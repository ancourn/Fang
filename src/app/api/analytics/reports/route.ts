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
    const type = searchParams.get('type');

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID is required' }, { status: 400 });
    }

    const whereClause: any = { workspaceId };
    if (type) {
      whereClause.type = type;
    }

    const reports = await db.analyticsReport.findMany({
      where: whereClause,
      include: {
        creator: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        snapshots: {
          orderBy: { date: 'desc' },
          take: 1
        },
        schedules: {
          where: { isActive: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(reports);
  } catch (error) {
    console.error('Error fetching analytics reports:', error);
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
    const { name, description, type, config, workspaceId, isPublic } = body;

    if (!name || !type || !config || !workspaceId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const report = await db.analyticsReport.create({
      data: {
        name,
        description,
        type,
        config: JSON.stringify(config),
        workspaceId,
        createdBy: session.user.id,
        isPublic: isPublic || false
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true, avatar: true }
        }
      }
    });

    return NextResponse.json(report);
  } catch (error) {
    console.error('Error creating analytics report:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}