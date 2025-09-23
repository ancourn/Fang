import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const createApprovalSchema = z.object({
  workflowId: z.string().min(1, 'Workflow ID is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  type: z.string().min(1, 'Type is required'),
  entityId: z.string().min(1, 'Entity ID is required'),
  priority: z.string().default('medium'),
  dueDate: z.string().optional(),
});

const updateApprovalSchema = z.object({
  status: z.string().min(1, 'Status is required'),
  comment: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const userId = searchParams.get('userId') || session.user.id;

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID is required' }, { status: 400 });
    }

    // Check if user has access to the workspace
    const userWorkspace = await db.userWorkspace.findFirst({
      where: {
        userId: session.user.id,
        workspaceId,
      },
    });

    if (!userWorkspace) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const whereClause: any = {
      workspaceId,
    };

    if (status) {
      whereClause.status = status;
    }

    if (type) {
      whereClause.type = type;
    }

    if (userId === session.user.id) {
      // Show approvals where user is requester
      whereClause.requesterId = userId;
    } else {
      // Show approvals where user is an approver (based on workflow stages)
      const userStages = await db.approvalStage.findMany({
        where: {
          approverType: 'user',
          approverId: userId,
        },
      });

      const stageIds = userStages.map(stage => stage.id);
      whereClause.stageId = { in: stageIds };
    }

    const approvals = await db.approval.findMany({
      where: whereClause,
      include: {
        workflow: {
          include: {
            stages: {
              orderBy: {
                order: 'asc',
              },
            },
          },
        },
        stage: true,
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        comments: {
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
          orderBy: {
            createdAt: 'desc',
          },
        },
        history: {
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
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(approvals);
  } catch (error) {
    console.error('Error fetching approvals:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createApprovalSchema.parse(body);

    // Get the workflow to find the first stage
    const workflow = await db.approvalWorkflow.findFirst({
      where: {
        id: validatedData.workflowId,
        isActive: true,
      },
      include: {
        stages: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    if (workflow.stages.length === 0) {
      return NextResponse.json({ error: 'Workflow has no stages' }, { status: 400 });
    }

    // Check if user has access to the workspace
    const userWorkspace = await db.userWorkspace.findFirst({
      where: {
        userId: session.user.id,
        workspaceId: workflow.workspaceId,
      },
    });

    if (!userWorkspace) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Create approval with the first stage
    const approval = await db.approval.create({
      data: {
        workflowId: validatedData.workflowId,
        stageId: workflow.stages[0].id,
        title: validatedData.title,
        description: validatedData.description,
        type: validatedData.type,
        entityId: validatedData.entityId,
        priority: validatedData.priority,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
        requesterId: session.user.id,
        workspaceId: workflow.workspaceId,
        history: {
          create: {
            userId: session.user.id,
            action: 'created',
            details: JSON.stringify({ stage: workflow.stages[0].name }),
          },
        },
      },
      include: {
        workflow: {
          include: {
            stages: {
              orderBy: {
                order: 'asc',
              },
            },
          },
        },
        stage: true,
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        comments: {
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
        history: {
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
      },
    });

    return NextResponse.json(approval, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    console.error('Error creating approval:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;
    const validatedData = updateApprovalSchema.parse(updateData);

    if (!id) {
      return NextResponse.json({ error: 'Approval ID is required' }, { status: 400 });
    }

    // Get the approval with workflow and stages
    const approval = await db.approval.findFirst({
      where: {
        id,
      },
      include: {
        workflow: {
          include: {
            stages: {
              orderBy: {
                order: 'asc',
              },
            },
          },
        },
        stage: true,
      },
    });

    if (!approval) {
      return NextResponse.json({ error: 'Approval not found' }, { status: 404 });
    }

    // Check if user can approve this stage
    const canApprove = approval.stage.approverType === 'user' && 
                     approval.stage.approverId === session.user.id;

    if (!canApprove) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    // Update approval status
    const updatedApproval = await db.approval.update({
      where: { id },
      data: {
        status: validatedData.status,
        completedAt: validatedData.status !== 'pending' ? new Date() : null,
        comments: validatedData.comment ? {
          create: {
            userId: session.user.id,
            content: validatedData.comment,
            action: validatedData.status,
          },
        } : undefined,
        history: {
          create: {
            userId: session.user.id,
            action: validatedData.status,
            details: validatedData.comment ? JSON.stringify({ comment: validatedData.comment }) : null,
          },
        },
      },
      include: {
        workflow: {
          include: {
            stages: {
              orderBy: {
                order: 'asc',
              },
            },
          },
        },
        stage: true,
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        comments: {
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
        history: {
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
      },
    });

    return NextResponse.json(updatedApproval);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    console.error('Error updating approval:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}