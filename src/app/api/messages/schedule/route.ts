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

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content, channelId, scheduledAt, threadId } = await request.json();

    if (!content || !channelId || !scheduledAt) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate scheduled time (must be in the future)
    const scheduledDate = new Date(scheduledAt);
    const now = new Date();
    if (scheduledDate <= now) {
      return NextResponse.json({ error: 'Scheduled time must be in the future' }, { status: 400 });
    }

    // Check if user has access to the channel
    const channelMember = await db.channelMember.findFirst({
      where: {
        userId: user.userId,
        channelId: channelId
      }
    });

    if (!channelMember) {
      return NextResponse.json({ error: 'Access denied to channel' }, { status: 403 });
    }

    // Create scheduled message
    const scheduledMessage = await db.message.create({
      data: {
        content,
        channelId,
        userId: user.userId,
        threadId: threadId || null,
        isScheduled: true,
        scheduledAt: scheduledDate
      },
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
        }
      }
    });

    return NextResponse.json({ 
      message: scheduledMessage,
      scheduled: true 
    });

  } catch (error) {
    console.error('Error scheduling message:', error);
    return NextResponse.json({ error: 'Failed to schedule message' }, { status: 500 });
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

    // Get scheduled messages
    const whereClause: any = {
      isScheduled: true,
      scheduledAt: { gte: new Date() }
    };

    if (channelId) {
      whereClause.channelId = channelId;
    } else {
      whereClause.channelId = { in: userChannelIds };
    }

    const scheduledMessages = await db.message.findMany({
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
        }
      },
      orderBy: {
        scheduledAt: 'asc'
      }
    });

    return NextResponse.json({ scheduledMessages });

  } catch (error) {
    console.error('Error fetching scheduled messages:', error);
    return NextResponse.json({ error: 'Failed to fetch scheduled messages' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('messageId');

    if (!messageId) {
      return NextResponse.json({ error: 'Message ID required' }, { status: 400 });
    }

    // Check if message exists and user has access
    const message = await db.message.findFirst({
      where: {
        id: messageId,
        userId: user.userId,
        isScheduled: true
      }
    });

    if (!message) {
      return NextResponse.json({ error: 'Scheduled message not found or access denied' }, { status: 404 });
    }

    // Delete the scheduled message
    await db.message.delete({
      where: { id: messageId }
    });

    return NextResponse.json({ 
      success: true,
      message: 'Scheduled message deleted' 
    });

  } catch (error) {
    console.error('Error deleting scheduled message:', error);
    return NextResponse.json({ error: 'Failed to delete scheduled message' }, { status: 500 });
  }
}