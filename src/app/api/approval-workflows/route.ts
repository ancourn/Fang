import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const createWorkflowSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  type: z.string().min(1, 'Type is required'),
  workspaceId: z.string().min(1, 'Workspace ID is required'),
  stages: z.array(z.object({
    name: z.string().min(1, 'Stage name is required'),
    description: z.string().optional(),
    order: z.number().min(0),
    type: z.string().default('sequential'),
    approverType: z.string().default('user'),
    approverId: z.string().optional(),
    timeoutHours: z.number().optional(),
    isRequired: z.boolean().default(true),
    conditions: z.string().optional(),
  })).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');

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

    const workflows = await db.approvalWorkflow.findMany({
      where: {
        workspaceId,
        isActive: true,
      },
      include: {
        stages: {
          orderBy: {
            order: 'asc',
          },
        },
        workspace: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(workflows);
  } catch (error) {
    console.error('Error fetching approval workflows:', error);
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
    const validatedData = createWorkflowSchema.parse(body);

    // Check if user has permission to create workflows in the workspace
    const userWorkspace = await db.userWorkspace.findFirst({
      where: {
        userId: session.user.id,
        workspaceId: validatedData.workspaceId,
        role: {
          in: ['owner', 'admin'],
        },
      },
    });

    if (!userWorkspace) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    // Create workflow with stages
    const workflow = await db.approvalWorkflow.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        type: validatedData.type,
        workspaceId: validatedData.workspaceId,
        stages: validatedData.stages ? {
          create: validatedData.stages.map((stage, index) => ({
            name: stage.name,
            description: stage.description,
            order: stage.order ?? index,
            type: stage.type,
            approverType: stage.approverType,
            approverId: stage.approverId,
            timeoutHours: stage.timeoutHours,
            isRequired: stage.isRequired,
            conditions: stage.conditions,
          })),
        } : undefined,
      },
      include: {
        stages: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    return NextResponse.json(workflow, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    console.error('Error creating approval workflow:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}