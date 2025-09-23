import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Helper function to get user from token
async function getUserFromToken(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return decoded;
  } catch (error) {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get('channelId');

    // Get user's channel IDs
    const channelMembers = await db.channelMember.findMany({
      where: { userId: user.userId },
      select: { channelId: true }
    });

    const userChannelIds = channelMembers.map(cm => cm.channelId);

    // Get pinned messages
    const whereClause: any = {
      isPinned: true
    };

    if (channelId) {
      whereClause.channelId = channelId;
    } else {
      whereClause.channelId = { in: userChannelIds };
    }

    const pinnedMessages = await db.message.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        channel: {
          select: {
            id: true,
            name: true,
            displayName: true
          }
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    return NextResponse.json({ pinnedMessages });

  } catch (error) {
    console.error('Error fetching pinned messages:', error);
    return NextResponse.json({ error: 'Failed to fetch pinned messages' }, { status: 500 });
  }
}