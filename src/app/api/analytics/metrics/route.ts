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
    const metricType = searchParams.get('metricType');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID is required' }, { status: 400 });
    }

    const whereClause: any = { workspaceId };
    if (metricType) {
      whereClause.metricType = metricType;
    }
    if (startDate) {
      whereClause.date = { gte: new Date(startDate) };
    }
    if (endDate) {
      whereClause.date = { 
        ...whereClause.date,
        lte: new Date(endDate) 
      };
    }

    const [workspaceMetrics, userActivityMetrics, performanceMetrics] = await Promise.all([
      db.workspaceMetric.findMany({
        where: whereClause,
        orderBy: { date: 'desc' },
        take: 100
      }),
      db.userActivityMetric.findMany({
        where: {
          ...whereClause,
          userId: session.user.id
        },
        orderBy: { date: 'desc' },
        take: 100,
        include: {
          user: {
            select: { id: true, name: true, email: true, avatar: true }
          }
        }
      }),
      db.performanceMetric.findMany({
        where: whereClause,
        orderBy: { timestamp: 'desc' },
        take: 100
      })
    ]);

    return NextResponse.json({
      workspaceMetrics,
      userActivityMetrics,
      performanceMetrics
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
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
    const { type, metricType, metricValue, metadata, workspaceId } = body;

    if (!type || !metricType || metricValue === undefined || !workspaceId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let result;
    
    switch (type) {
      case 'workspace':
        result = await db.workspaceMetric.create({
          data: {
            workspaceId,
            metricType,
            metricValue,
            metadata: metadata ? JSON.stringify(metadata) : null
          }
        });
        break;
        
      case 'user':
        result = await db.userActivityMetric.create({
          data: {
            userId: session.user.id,
            workspaceId,
            metricType,
            metricValue,
            metadata: metadata ? JSON.stringify(metadata) : null
          }
        });
        break;
        
      case 'performance':
        result = await db.performanceMetric.create({
          data: {
            workspaceId,
            metricType,
            metricValue,
            metadata: metadata ? JSON.stringify(metadata) : null
          }
        });
        break;
        
      default:
        return NextResponse.json({ error: 'Invalid metric type' }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error creating metric:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}