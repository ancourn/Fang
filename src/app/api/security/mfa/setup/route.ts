import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import * as speakeasy from 'speakeasy';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspaceId } = await request.json();
    
    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID is required' }, { status: 400 });
    }

    // Generate MFA secret
    const secret = speakeasy.generateSecret({
      name: `Fang Platform (${session.user.email})`,
      issuer: 'Fang Platform',
    });

    // Store the temporary secret (not yet enabled)
    await db.userSecuritySetting.upsert({
      where: {
        userId_workspaceId: {
          userId: session.user.id,
          workspaceId
        }
      },
      update: {
        mfaSecret: secret.base32,
        updatedAt: new Date()
      },
      create: {
        userId: session.user.id,
        workspaceId,
        mfaSecret: secret.base32,
        sessionTimeout: 3600,
        securityLevel: 'standard'
      }
    });

    return NextResponse.json({
      secret: secret.base32,
      qrCodeUrl: secret.otpauth_url,
      backupCodes: generateBackupCodes()
    });
  } catch (error) {
    console.error('Error setting up MFA:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspaceId, token, backupCodes } = await request.json();
    
    if (!workspaceId || !token) {
      return NextResponse.json({ error: 'Workspace ID and token are required' }, { status: 400 });
    }

    // Get user security settings
    const securitySetting = await db.userSecuritySetting.findUnique({
      where: {
        userId_workspaceId: {
          userId: session.user.id,
          workspaceId
        }
      }
    });

    if (!securitySetting || !securitySetting.mfaSecret) {
      return NextResponse.json({ error: 'MFA not set up' }, { status: 400 });
    }

    // Verify the token
    const verified = speakeasy.totp.verify({
      secret: securitySetting.mfaSecret,
      encoding: 'base32',
      token,
      window: 2
    });

    if (!verified) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
    }

    // Enable MFA and store backup codes
    await db.userSecuritySetting.update({
      where: {
        userId_workspaceId: {
          userId: session.user.id,
          workspaceId
        }
      },
      data: {
        mfaEnabled: true,
        mfaBackupCodes: JSON.stringify(backupCodes || generateBackupCodes()),
        updatedAt: new Date()
      }
    });

    // Log the MFA enablement
    await logSecurityEvent(session.user.id, workspaceId, 'mfa_enabled', {
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    });

    return NextResponse.json({ message: 'MFA enabled successfully' });
  } catch (error) {
    console.error('Error enabling MFA:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function generateBackupCodes(): string[] {
  const codes = [];
  for (let i = 0; i < 10; i++) {
    codes.push(Math.random().toString(36).substring(2, 8).toUpperCase());
  }
  return codes;
}

async function logSecurityEvent(userId: string, workspaceId: string, action: string, details: any) {
  try {
    await db.securityAuditLog.create({
      data: {
        userId,
        workspaceId,
        action,
        resource: 'user_security',
        details: JSON.stringify(details),
        ipAddress: details.ipAddress,
        userAgent: details.userAgent,
        riskLevel: 'low',
        status: 'success'
      }
    });
  } catch (error) {
    console.error('Error logging security event:', error);
  }
}