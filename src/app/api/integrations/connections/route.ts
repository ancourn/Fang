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
    const integrationId = searchParams.get('integrationId');
    const status = searchParams.get('status');

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID is required' }, { status: 400 });
    }

    const whereClause: any = { workspaceId };
    if (integrationId) whereClause.integrationId = integrationId;
    if (status) whereClause.status = status;

    const connections = await db.integrationConnection.findMany({
      where: whereClause,
      include: {
        integration: true,
        creator: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        syncLogs: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(connections);
  } catch (error) {
    console.error('Error fetching integration connections:', error);
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
    const { integrationId, name, config, workspaceId } = body;

    if (!integrationId || !workspaceId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const connection = await db.integrationConnection.create({
      data: {
        integrationId,
        name,
        config: config ? JSON.stringify(config) : null,
        workspaceId,
        createdBy: session.user.id
      },
      include: {
        integration: true,
        creator: {
          select: { id: true, name: true, email: true, avatar: true }
        }
      }
    });

    return NextResponse.json(connection);
  } catch (error) {
    console.error('Error creating integration connection:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}