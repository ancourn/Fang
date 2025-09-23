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

    const policies = await db.securityPolicy.findMany({
      where: whereClause,
      include: {
        userSecuritySettings: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(policies);
  } catch (error) {
    console.error('Error fetching security policies:', error);
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
    const { name, description, type, config, workspaceId } = body;

    if (!name || !type || !config || !workspaceId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const policy = await db.securityPolicy.create({
      data: {
        name,
        description,
        type,
        config: JSON.stringify(config),
        workspaceId
      },
      include: {
        userSecuritySettings: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true }
            }
          }
        }
      }
    });

    // Log policy creation
    await logSecurityEvent(session.user.id, workspaceId, 'security_policy_created', {
      policyId: policy.id,
      policyName: name,
      policyType: type,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    });

    return NextResponse.json(policy);
  } catch (error) {
    console.error('Error creating security policy:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function logSecurityEvent(userId: string, workspaceId: string, action: string, details: any) {
  try {
    await db.securityAuditLog.create({
      data: {
        userId,
        workspaceId,
        action,
        resource: 'security_policy',
        details: JSON.stringify(details),
        ipAddress: details.ipAddress,
        userAgent: details.userAgent,
        riskLevel: 'medium',
        status: 'success'
      }
    });
  } catch (error) {
    console.error('Error logging security event:', error);
  }
}