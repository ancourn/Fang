import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/tasks/[id] - Get a specific task
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const task = await db.task.findUnique({
      where: { id: params.id },
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
        workspace: {
          select: {
            id: true,
            name: true
          }
        },
        channel: {
          select: {
            id: true,
            name: true,
            displayName: true
          }
        },
        labels: true,
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true
              }
            }
          },
          orderBy: {
            createdAt: "asc"
          }
        },
        activities: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true
              }
            }
          },
          orderBy: {
            createdAt: "desc"
          }
        },
        _count: {
          select: {
            comments: true,
            activities: true
          }
        }
      }
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Check if user has access to the workspace
    const user = await db.user.findUnique({
      where: { email: session.user.email },
      include: {
        workspaces: {
          where: { workspaceId: task.workspaceId }
        }
      }
    });

    if (!user || user.workspaces.length === 0) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error("Error fetching task:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/tasks/[id] - Update a task
export async function PUT(request: NextRequest, { params }: RouteParams) {
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
      assigneeId,
      labels
    } = body;

    // Get the current task
    const currentTask = await db.task.findUnique({
      where: { id: params.id },
      include: {
        workspace: {
          select: {
            id: true
          }
        }
      }
    });

    if (!currentTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Check if user has access to the workspace
    const user = await db.user.findUnique({
      where: { email: session.user.email },
      include: {
        workspaces: {
          where: { workspaceId: currentTask.workspaceId }
        }
      }
    });

    if (!user || user.workspaces.length === 0) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Update the task
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (assigneeId !== undefined) updateData.assigneeId = assigneeId;

    // Handle completion date
    if (status === "done" && currentTask.status !== "done") {
      updateData.completedAt = new Date();
    } else if (status !== "done" && currentTask.status === "done") {
      updateData.completedAt = null;
    }

    const updatedTask = await db.task.update({
      where: { id: params.id },
      data: updateData,
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

    // Handle labels update
    if (labels !== undefined) {
      // Remove existing labels
      await db.taskLabel.deleteMany({
        where: { taskId: params.id }
      });

      // Add new labels
      if (labels.length > 0) {
        await db.taskLabel.createMany({
          data: labels.map((label: { name: string; color: string }) => ({
            taskId: params.id,
            name: label.name,
            color: label.color || "#3b82f6"
          }))
        });
      }
    }

    // Log activity for significant changes
    const activities = [];
    if (status !== undefined && status !== currentTask.status) {
      activities.push({
        taskId: params.id,
        userId: user.id,
        action: "status_changed",
        details: JSON.stringify({
          from: currentTask.status,
          to: status
        })
      });
    }
    if (assigneeId !== undefined && assigneeId !== currentTask.assigneeId) {
      activities.push({
        taskId: params.id,
        userId: user.id,
        action: "assigned",
        details: JSON.stringify({
          to: assigneeId
        })
      });
    }
    if (priority !== undefined && priority !== currentTask.priority) {
      activities.push({
        taskId: params.id,
        userId: user.id,
        action: "priority_changed",
        details: JSON.stringify({
          from: currentTask.priority,
          to: priority
        })
      });
    }

    if (activities.length > 0) {
      await db.taskActivity.createMany({
        data: activities
      });
    }

    // Fetch the updated task with labels
    const finalTask = await db.task.findUnique({
      where: { id: params.id },
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

    return NextResponse.json(finalTask);
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/tasks/[id] - Delete a task
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the current task
    const currentTask = await db.task.findUnique({
      where: { id: params.id },
      include: {
        workspace: {
          select: {
            id: true
          }
        }
      }
    });

    if (!currentTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Check if user has access to the workspace
    const user = await db.user.findUnique({
      where: { email: session.user.email },
      include: {
        workspaces: {
          where: { workspaceId: currentTask.workspaceId }
        }
      }
    });

    if (!user || user.workspaces.length === 0) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Delete the task (this will cascade delete related records)
    await db.task.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}