import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const createBaseSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  workspaceId: z.string().min(1, 'Workspace ID is required'),
  parentId: z.string().optional(),
  isCategory: z.boolean().default(false),
  icon: z.string().optional(),
  color: z.string().optional(),
  sortOrder: z.number().min(0).default(0),
  isPublic: z.boolean().default(true),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    const parentId = searchParams.get('parentId');
    const isCategory = searchParams.get('isCategory');

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
      isArchived: false,
    };

    if (parentId !== null) {
      whereClause.parentId = parentId || null;
    }

    if (isCategory !== null) {
      whereClause.isCategory = isCategory === 'true';
    }

    const bases = await db.knowledgeBase.findMany({
      where: whereClause,
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
        children: {
          where: {
            isArchived: false,
          },
          orderBy: {
            sortOrder: 'asc',
          },
        },
        articles: {
          where: {
            status: 'published',
            isPublic: true,
          },
          orderBy: {
            sortOrder: 'asc',
          },
          take: 5, // Limit to 5 articles for preview
        },
        _count: {
          select: {
            articles: true,
            children: true,
          },
        },
      },
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' },
      ],
    });

    return NextResponse.json(bases);
  } catch (error) {
    console.error('Error fetching knowledge bases:', error);
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
    const validatedData = createBaseSchema.parse(body);

    // Check if user has permission to create knowledge bases in the workspace
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

    // If parentId is provided, check if it exists and belongs to the same workspace
    if (validatedData.parentId) {
      const parentBase = await db.knowledgeBase.findFirst({
        where: {
          id: validatedData.parentId,
          workspaceId: validatedData.workspaceId,
          isArchived: false,
        },
      });

      if (!parentBase) {
        return NextResponse.json({ error: 'Parent knowledge base not found' }, { status: 404 });
      }
    }

    const base = await db.knowledgeBase.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        workspaceId: validatedData.workspaceId,
        parentId: validatedData.parentId,
        isCategory: validatedData.isCategory,
        icon: validatedData.icon,
        color: validatedData.color,
        sortOrder: validatedData.sortOrder,
        isPublic: validatedData.isPublic,
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
        children: {
          where: {
            isArchived: false,
          },
          orderBy: {
            sortOrder: 'asc',
          },
        },
        _count: {
          select: {
            articles: true,
            children: true,
          },
        },
      },
    });

    return NextResponse.json(base, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    console.error('Error creating knowledge base:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}