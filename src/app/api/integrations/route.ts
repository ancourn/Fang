import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    const category = searchParams.get('category');
    const type = searchParams.get('type');

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID is required' }, { status: 400 });
    }

    const whereClause: any = { workspaceId };
    if (category) whereClause.category = category;
    if (type) whereClause.type = type;

    const integrations = await db.integration.findMany({
      where: whereClause,
      include: {
        connections: {
          include: {
            creator: {
              select: { id: true, name: true, email: true, avatar: true }
            }
          }
        },
        webhooks: true,
        apiKeys: true,
        marketplaceListing: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(integrations);
  } catch (error) {
    console.error('Error fetching integrations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, type, category, config, workspaceId, isPublic } = body;

    if (!name || !type || !category || !workspaceId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const integration = await db.integration.create({
      data: {
        name,
        description,
        type,
        category,
        config: JSON.stringify(config),
        workspaceId,
        isPublic: isPublic || false
      },
      include: {
        connections: true,
        webhooks: true,
        apiKeys: true
      }
    });

    return NextResponse.json(integration);
  } catch (error) {
    console.error('Error creating integration:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}