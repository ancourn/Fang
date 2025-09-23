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

    const { workspaceId, token, backupCode } = await request.json();
    
    if (!workspaceId || (!token && !backupCode)) {
      return NextResponse.json({ error: 'Workspace ID and token or backup code are required' }, { status: 400 });
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

    if (!securitySetting || !securitySetting.mfaEnabled) {
      return NextResponse.json({ error: 'MFA not enabled' }, { status: 400 });
    }

    let verified = false;
    let method = 'totp';

    // Check backup code first
    if (backupCode) {
      const backupCodes = JSON.parse(securitySetting.mfaBackupCodes || '[]');
      const codeIndex = backupCodes.indexOf(backupCode);
      
      if (codeIndex !== -1) {
        verified = true;
        method = 'backup_code';
        
        // Remove used backup code
        backupCodes.splice(codeIndex, 1);
        await db.userSecuritySetting.update({
          where: {
            userId_workspaceId: {
              userId: session.user.id,
              workspaceId
            }
          },
          data: {
            mfaBackupCodes: JSON.stringify(backupCodes),
            updatedAt: new Date()
          }
        });
      }
    }

    // Check TOTP token if not verified by backup code
    if (!verified && token) {
      verified = speakeasy.totp.verify({
        secret: securitySetting.mfaSecret!,
        encoding: 'base32',
        token,
        window: 2
      });
    }

    if (!verified) {
      // Log failed attempt
      await logSecurityEvent(session.user.id, workspaceId, 'mfa_verification_failed', {
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        method
      });

      return NextResponse.json({ error: 'Invalid token or backup code' }, { status: 400 });
    }

    // Update last login info
    await db.userSecuritySetting.update({
      where: {
        userId_workspaceId: {
          userId: session.user.id,
          workspaceId
        }
      },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: request.headers.get('x-forwarded-for') || 'unknown',
        lastLoginDevice: request.headers.get('user-agent') || 'unknown',
        updatedAt: new Date()
      }
    });

    // Log successful verification
    await logSecurityEvent(session.user.id, workspaceId, 'mfa_verification_success', {
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      method
    });

    return NextResponse.json({ 
      message: 'MFA verification successful',
      method,
      sessionTimeout: securitySetting.sessionTimeout
    });
  } catch (error) {
    console.error('Error verifying MFA:', error);
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