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

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID is required' }, { status: 400 });
    }

    const dashboards = await db.dashboard.findMany({
      where: { workspaceId },
      include: {
        creator: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        widgets: {
          orderBy: { position: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(dashboards);
  } catch (error) {
    console.error('Error fetching dashboards:', error);
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
    const { name, description, layout, workspaceId, isPublic } = body;

    if (!name || !layout || !workspaceId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const dashboard = await db.dashboard.create({
      data: {
        name,
        description,
        layout: JSON.stringify(layout),
        workspaceId,
        createdBy: session.user.id,
        isPublic: isPublic || false
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        widgets: true
      }
    });

    return NextResponse.json(dashboard);
  } catch (error) {
    console.error('Error creating dashboard:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}