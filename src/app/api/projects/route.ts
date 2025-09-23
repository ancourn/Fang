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

    const projects = await db.project.findMany({
      where: {
        workspaceId: workspaceId,
      },
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
        milestones: true,
        resources: true,
        _count: {
          select: {
            tasks: true,
            members: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
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
    const { workspaceId, name, description, priority, startDate, endDate, budget } = body;

    if (!workspaceId || !name) {
      return NextResponse.json({ error: "Workspace ID and name are required" }, { status: 400 });
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

    const project = await db.project.create({
      data: {
        workspaceId,
        name,
        description,
        priority: priority || "medium",
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        budget: budget ? parseFloat(budget) : null,
        managerId: session.user.id,
      },
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
        milestones: true,
        resources: true,
        _count: {
          select: {
            tasks: true,
            members: true,
          },
        },
      },
    });

    // Add creator as project member
    await db.projectMember.create({
      data: {
        projectId: project.id,
        userId: session.user.id,
        role: "owner",
      },
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}