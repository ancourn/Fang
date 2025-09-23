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
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');
    const resource = searchParams.get('resource');
    const riskLevel = searchParams.get('riskLevel');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID is required' }, { status: 400 });
    }

    const whereClause: any = { workspaceId };
    if (userId) whereClause.userId = userId;
    if (action) whereClause.action = { contains: action };
    if (resource) whereClause.resource = resource;
    if (riskLevel) whereClause.riskLevel = riskLevel;
    if (status) whereClause.status = status;
    if (startDate) {
      whereClause.createdAt = { gte: new Date(startDate) };
    }
    if (endDate) {
      whereClause.createdAt = { 
        ...whereClause.createdAt,
        lte: new Date(endDate) 
      };
    }

    const [logs, total] = await Promise.all([
      db.securityAuditLog.findMany({
        where: whereClause,
        include: {
          user: {
            select: { id: true, name: true, email: true, avatar: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      db.securityAuditLog.count({ where: whereClause })
    ]);

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
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
    const { action, resource, resourceId, details, riskLevel, status, workspaceId } = body;

    if (!action || !workspaceId) {
      return NextResponse.json({ error: 'Action and workspace ID are required' }, { status: 400 });
    }

    const log = await db.securityAuditLog.create({
      data: {
        userId: session.user.id,
        workspaceId,
        action,
        resource,
        resourceId,
        details: details ? JSON.stringify(details) : null,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        riskLevel: riskLevel || 'low',
        status: status || 'success'
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true }
        }
      }
    });

    return NextResponse.json(log);
  } catch (error) {
    console.error('Error creating audit log:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}