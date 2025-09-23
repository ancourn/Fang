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

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const messageId = params.id;

    // Check if message exists and user has access
    const message = await db.message.findFirst({
      where: {
        id: messageId,
        OR: [
          { channelId: { in: user.channelIds || [] } },
          { userId: user.userId }
        ]
      }
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found or access denied' }, { status: 404 });
    }

    // Toggle pin status
    const updatedMessage = await db.message.update({
      where: { id: messageId },
      data: { isPinned: !message.isPinned },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      }
    });

    return NextResponse.json({ 
      message: updatedMessage,
      pinned: updatedMessage.isPinned 
    });

  } catch (error) {
    console.error('Error pinning message:', error);
    return NextResponse.json({ error: 'Failed to pin message' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const messageId = params.id;

    // Check if message exists and user has access
    const message = await db.message.findFirst({
      where: {
        id: messageId,
        OR: [
          { channelId: { in: user.channelIds || [] } },
          { userId: user.userId }
        ]
      }
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found or access denied' }, { status: 404 });
    }

    // Unpin the message
    const updatedMessage = await db.message.update({
      where: { id: messageId },
      data: { isPinned: false },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      }
    });

    return NextResponse.json({ 
      message: updatedMessage,
      pinned: false 
    });

  } catch (error) {
    console.error('Error unpinning message:', error);
    return NextResponse.json({ error: 'Failed to unpin message' }, { status: 500 });
  }
}