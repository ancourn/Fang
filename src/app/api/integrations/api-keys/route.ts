import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { randomBytes } from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    const integrationId = searchParams.get('integrationId');

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID is required' }, { status: 400 });
    }

    const whereClause: any = { workspaceId };
    if (integrationId) whereClause.integrationId = integrationId;

    const apiKeys = await db.apiKey.findMany({
      where: whereClause,
      include: {
        integration: true,
        creator: {
          select: { id: true, name: true, email: true, avatar: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(apiKeys);
  } catch (error) {
    console.error('Error fetching API keys:', error);
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
    const { name, description, permissions, rateLimit, expiresAt, integrationId, workspaceId } = body;

    if (!name || !workspaceId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Generate API key and secret
    const key = `fk_${randomBytes(16).toString('hex')}`;
    const secret = randomBytes(32).toString('hex');

    const apiKey = await db.apiKey.create({
      data: {
        name,
        description,
        key,
        secret,
        permissions: permissions ? JSON.stringify(permissions) : null,
        rateLimit: rateLimit || 1000,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        integrationId,
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

    // Return the secret only once during creation
    return NextResponse.json({
      ...apiKey,
      secret // Include secret in response only during creation
    });
  } catch (error) {
    console.error('Error creating API key:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { apiKeyId, isActive, rateLimit, expiresAt } = body;

    if (!apiKeyId) {
      return NextResponse.json({ error: 'API key ID is required' }, { status: 400 });
    }

    const updateData: any = {};
    if (isActive !== undefined) updateData.isActive = isActive;
    if (rateLimit !== undefined) updateData.rateLimit = rateLimit;
    if (expiresAt !== undefined) updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;

    const apiKey = await db.apiKey.update({
      where: { id: apiKeyId },
      data: updateData,
      include: {
        integration: true,
        creator: {
          select: { id: true, name: true, email: true, avatar: true }
        }
      }
    });

    // Don't return the secret in updates
    const { secret, ...apiKeyWithoutSecret } = apiKey;
    return NextResponse.json(apiKeyWithoutSecret);
  } catch (error) {
    console.error('Error updating API key:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const apiKeyId = searchParams.get('apiKeyId');

    if (!apiKeyId) {
      return NextResponse.json({ error: 'API key ID is required' }, { status: 400 });
    }

    await db.apiKey.delete({
      where: { id: apiKeyId }
    });

    return NextResponse.json({ message: 'API key deleted successfully' });
  } catch (error) {
    console.error('Error deleting API key:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}