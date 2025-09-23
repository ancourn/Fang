import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workflow = await db.workflow.findUnique({
      where: {
        id: params.id,
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
          take: 50, // More executions for detailed view
        },
        _count: {
          select: {
            executions: true,
          },
        },
      },
    });

    if (!workflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    // Check if user has access to workflow
    const userWorkspace = await db.userWorkspace.findFirst({
      where: {
        userId: session.user.id,
        workspaceId: workflow.workspaceId,
      },
    });

    if (!userWorkspace) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json(workflow);
  } catch (error) {
    console.error("Error fetching workflow:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, triggerType, triggerConfig, actions, isActive } = body;

    // Check if workflow exists and user has access
    const existingWorkflow = await db.workflow.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!existingWorkflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    const userWorkspace = await db.userWorkspace.findFirst({
      where: {
        userId: session.user.id,
        workspaceId: existingWorkflow.workspaceId,
      },
    });

    if (!userWorkspace) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const workflow = await db.workflow.update({
      where: {
        id: params.id,
      },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(triggerType !== undefined && { triggerType }),
        ...(triggerConfig !== undefined && { triggerConfig }),
        ...(actions !== undefined && { actions }),
        ...(isActive !== undefined && { isActive }),
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
    console.error("Error updating workflow:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if workflow exists and user has access
    const existingWorkflow = await db.workflow.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!existingWorkflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    const userWorkspace = await db.userWorkspace.findFirst({
      where: {
        userId: session.user.id,
        workspaceId: existingWorkflow.workspaceId,
        role: {
          in: ["owner", "admin"],
        },
      },
    });

    if (!userWorkspace) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    await db.workflow.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting workflow:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}