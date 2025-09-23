import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json({ error: "Workspace ID is required" }, { status: 400 });
    }

    // Check if user has access to workspace
    const userWorkspace = await db.userWorkspace.findFirst({
      where: {
        userId: session.user.id,
        workspaceId: workspaceId,
      },
    });

    if (!userWorkspace) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const workflows = await db.workflow.findMany({
      where: {
        workspaceId: workspaceId,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        executions: {
          orderBy: {
            startedAt: "desc",
          },
          take: 10, // Last 10 executions for summary
        },
        _count: {
          select: {
            executions: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(workflows);
  } catch (error) {
    console.error("Error fetching workflows:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { workspaceId, name, description, triggerType, triggerConfig, actions } = body;

    if (!workspaceId || !name || !triggerType) {
      return NextResponse.json({ error: "Workspace ID, name, and trigger type are required" }, { status: 400 });
    }

    // Check if user has access to workspace
    const userWorkspace = await db.userWorkspace.findFirst({
      where: {
        userId: session.user.id,
        workspaceId: workspaceId,
      },
    });

    if (!userWorkspace) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const workflow = await db.workflow.create({
      data: {
        workspaceId,
        name,
        description,
        triggerType,
        triggerConfig: triggerConfig || "{}",
        actions: actions || "[]",
        createdBy: session.user.id,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        executions: {
          orderBy: {
            startedAt: "desc",
          },
          take: 10,
        },
        _count: {
          select: {
            executions: true,
          },
        },
      },
    });

    return NextResponse.json(workflow);
  } catch (error) {
    console.error("Error creating workflow:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}