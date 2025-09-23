import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { slugify } from '@/lib/utils';

const createArticleSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().optional(),
  excerpt: z.string().optional(),
  baseId: z.string().min(1, 'Base ID is required'),
  categoryId: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  sortOrder: z.number().min(0).default(0),
  isFeatured: z.boolean().default(false),
  isPublic: z.boolean().default(true),
  tagIds: z.array(z.string()).optional(),
});

const updateArticleSchema = z.object({
  title: z.string().min(1, 'Title is optional for updates').optional(),
  content: z.string().optional(),
  excerpt: z.string().optional(),
  categoryId: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  sortOrder: z.number().min(0).optional(),
  isFeatured: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  tagIds: z.array(z.string()).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    const baseId = searchParams.get('baseId');
    const categoryId = searchParams.get('categoryId');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const tag = searchParams.get('tag');
    const featured = searchParams.get('featured');

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
      base: {
        workspaceId,
        isArchived: false,
      },
    };

    if (baseId) {
      whereClause.baseId = baseId;
    }

    if (categoryId) {
      whereClause.categoryId = categoryId;
    }

    if (status) {
      whereClause.status = status;
    } else {
      // By default, only show published articles to regular users
      whereClause.status = 'published';
    }

    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (tag) {
      whereClause.articleTags = {
        some: {
          tag: {
            name: { contains: tag, mode: 'insensitive' },
          },
        },
      };
    }

    if (featured === 'true') {
      whereClause.isFeatured = true;
    }

    const articles = await db.knowledgeArticle.findMany({
      where: whereClause,
      include: {
        base: {
          select: {
            id: true,
            name: true,
            isCategory: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        articleTags: {
          include: {
            tag: true,
          },
        },
        _count: {
          select: {
            comments: true,
            versions: true,
          },
        },
      },
      orderBy: [
        { sortOrder: 'asc' },
        { isFeatured: 'desc' },
        { publishedAt: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json(articles);
  } catch (error) {
    console.error('Error fetching knowledge articles:', error);
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
    const validatedData = createArticleSchema.parse(body);

    // Check if user has permission to create articles in the base
    const base = await db.knowledgeBase.findFirst({
      where: {
        id: validatedData.baseId,
        isArchived: false,
      },
      include: {
        workspace: {
          include: {
            members: {
              where: {
                userId: session.user.id,
                role: {
                  in: ['owner', 'admin'],
                },
              },
            },
          },
        },
      },
    });

    if (!base || base.workspace.members.length === 0) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    // If categoryId is provided, check if it exists and belongs to the same workspace
    if (validatedData.categoryId) {
      const category = await db.knowledgeBase.findFirst({
        where: {
          id: validatedData.categoryId,
          workspaceId: base.workspaceId,
          isCategory: true,
          isArchived: false,
        },
      });

      if (!category) {
        return NextResponse.json({ error: 'Category not found' }, { status: 404 });
      }
    }

    // Generate slug from title
    const slug = slugify(validatedData.title);
    
    // Check if slug already exists in this base
    const existingArticle = await db.knowledgeArticle.findFirst({
      where: {
        baseId: validatedData.baseId,
        slug,
      },
    });

    if (existingArticle) {
      // Append random suffix if slug exists
      const uniqueSlug = `${slug}-${Date.now()}`;
      validatedData.slug = uniqueSlug;
    } else {
      validatedData.slug = slug;
    }

    const article = await db.knowledgeArticle.create({
      data: {
        title: validatedData.title,
        content: validatedData.content,
        excerpt: validatedData.excerpt,
        slug: validatedData.slug,
        baseId: validatedData.baseId,
        categoryId: validatedData.categoryId,
        authorId: session.user.id,
        status: validatedData.status,
        sortOrder: validatedData.sortOrder,
        isFeatured: validatedData.isFeatured,
        isPublic: validatedData.isPublic,
        publishedAt: validatedData.status === 'published' ? new Date() : null,
        versions: {
          create: {
            title: validatedData.title,
            content: validatedData.content || '',
            authorId: session.user.id,
            version: 1,
          },
        },
        articleTags: validatedData.tagIds ? {
          create: validatedData.tagIds.map((tagId: string) => ({
            tagId,
          })),
        } : undefined,
      },
      include: {
        base: {
          select: {
            id: true,
            name: true,
            isCategory: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        articleTags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return NextResponse.json(article, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    console.error('Error creating knowledge article:', error);
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
    const validatedData = updateArticleSchema.parse(updateData);

    if (!id) {
      return NextResponse.json({ error: 'Article ID is required' }, { status: 400 });
    }

    // Get the existing article
    const existingArticle = await db.knowledgeArticle.findFirst({
      where: {
        id,
      },
      include: {
        base: {
          include: {
            workspace: {
              include: {
                members: {
                  where: {
                    userId: session.user.id,
                    role: {
                      in: ['owner', 'admin'],
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!existingArticle) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    // Check if user has permission to edit this article
    const canEdit = existingArticle.authorId === session.user.id || 
                   existingArticle.base.workspace.members.length > 0;

    if (!canEdit) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    // If categoryId is provided, check if it exists and belongs to the same workspace
    if (validatedData.categoryId) {
      const category = await db.knowledgeBase.findFirst({
        where: {
          id: validatedData.categoryId,
          workspaceId: existingArticle.base.workspaceId,
          isCategory: true,
          isArchived: false,
        },
      });

      if (!category) {
        return NextResponse.json({ error: 'Category not found' }, { status: 404 });
      }
    }

    // Update the article
    const updatedArticle = await db.knowledgeArticle.update({
      where: { id },
      data: {
        ...(validatedData.title && { title: validatedData.title }),
        ...(validatedData.content !== undefined && { content: validatedData.content }),
        ...(validatedData.excerpt !== undefined && { excerpt: validatedData.excerpt }),
        ...(validatedData.categoryId !== undefined && { categoryId: validatedData.categoryId }),
        ...(validatedData.status !== undefined && { 
          status: validatedData.status,
          publishedAt: validatedData.status === 'published' ? new Date() : null,
        }),
        ...(validatedData.sortOrder !== undefined && { sortOrder: validatedData.sortOrder }),
        ...(validatedData.isFeatured !== undefined && { isFeatured: validatedData.isFeatured }),
        ...(validatedData.isPublic !== undefined && { isPublic: validatedData.isPublic }),
      },
      include: {
        base: {
          select: {
            id: true,
            name: true,
            isCategory: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        articleTags: {
          include: {
            tag: true,
          },
        },
      },
    });

    // Create a new version if content changed
    if (validatedData.content !== undefined || validatedData.title !== undefined) {
      const latestVersion = await db.knowledgeVersion.findFirst({
        where: {
          articleId: id,
        },
        orderBy: {
          version: 'desc',
        },
      });

      const newVersion = (latestVersion?.version || 0) + 1;

      await db.knowledgeVersion.create({
        data: {
          articleId: id,
          version: newVersion,
          title: validatedData.title || existingArticle.title,
          content: validatedData.content || existingArticle.content || '',
          authorId: session.user.id,
        },
      });
    }

    // Update tags if provided
    if (validatedData.tagIds !== undefined) {
      // Remove existing tags
      await db.knowledgeArticleTag.deleteMany({
        where: {
          articleId: id,
        },
      });

      // Add new tags
      if (validatedData.tagIds.length > 0) {
        await db.knowledgeArticleTag.createMany({
          data: validatedData.tagIds.map((tagId: string) => ({
            articleId: id,
            tagId,
          })),
        });
      }
    }

    return NextResponse.json(updatedArticle);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    console.error('Error updating knowledge article:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}