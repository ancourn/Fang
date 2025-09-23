import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/tasks - Get all tasks for a workspace
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");
    const channelId = searchParams.get("channelId");

    if (!workspaceId) {
      return NextResponse.json({ error: "Workspace ID is required" }, { status: 400 });
    }

    // Check if user has access to the workspace
    const user = await db.user.findUnique({
      where: { email: session.user.email },
      include: {
        workspaces: {
          where: { workspaceId }
        }
      }
    });

    if (!user || user.workspaces.length === 0) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const whereClause: any = {
      workspaceId
    };

    if (channelId) {
      whereClause.channelId = channelId;
    }

    const tasks = await db.task.findMany({
      where: whereClause,
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        labels: true,
        _count: {
          select: {
            comments: true,
            activities: true
          }
        }
      },
      orderBy: [
        { priority: "desc" },
        { dueDate: "asc" },
        { createdAt: "desc" }
      ]
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/tasks - Create a new task
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      status,
      priority,
      dueDate,
      workspaceId,
      channelId,
      assigneeId,
      labels
    } = body;

    if (!title || !workspaceId) {
      return NextResponse.json({ error: "Title and workspace ID are required" }, { status: 400 });
    }

    // Check if user has access to the workspace
    const user = await db.user.findUnique({
      where: { email: session.user.email },
      include: {
        workspaces: {
          where: { workspaceId }
        }
      }
    });

    if (!user || user.workspaces.length === 0) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Create the task
    const task = await db.task.create({
      data: {
        title,
        description,
        status: status || "todo",
        priority: priority || "medium",
        dueDate: dueDate ? new Date(dueDate) : null,
        workspaceId,
        channelId,
        assigneeId,
        creatorId: user.id,
        labels: labels ? {
          create: labels.map((label: { name: string; color: string }) => ({
            name: label.name,
            color: label.color || "#3b82f6"
          }))
        } : undefined
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        labels: true,
        _count: {
          select: {
            comments: true,
            activities: true
          }
        }
      }
    });

    // Log activity
    await db.taskActivity.create({
      data: {
        taskId: task.id,
        userId: user.id,
        action: "created",
        details: JSON.stringify({
          title: task.title,
          priority: task.priority,
          assigneeId: task.assigneeId
        })
      }
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}