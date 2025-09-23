import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get("channelId");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    if (!channelId) {
      return NextResponse.json(
        { error: "Channel ID is required" },
        { status: 400 }
      );
    }

    // Get messages for the channel
    const messages = await db.message.findMany({
      where: { channelId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            status: true
          }
        },
        reactions: {
          select: {
            emoji: true,
            userId: true,
            createdAt: true
          }
        },
        files: {
          select: {
            id: true,
            name: true,
            size: true,
            type: true,
            url: true,
            createdAt: true
          }
        }
      },
      orderBy: { createdAt: "asc" },
      take: limit,
      skip: offset
    });

    // Format reactions
    const formattedMessages = messages.map(message => ({
      id: message.id,
      content: message.content,
      userId: message.userId,
      userName: message.user.name,
      userEmail: message.user.email,
      userAvatar: message.user.avatar,
      userStatus: message.user.status,
      timestamp: message.createdAt,
      reactions: message.reactions.reduce((acc, reaction) => {
        const existing = acc.find(r => r.emoji === reaction.emoji);
        if (existing) {
          existing.count++;
          existing.users.push(reaction.userId);
        } else {
          acc.push({
            emoji: reaction.emoji,
            count: 1,
            users: [reaction.userId]
          });
        }
        return acc;
      }, [] as Array<{ emoji: string; count: number; users: string[] }>),
      files: message.files
    }));

    return NextResponse.json({ messages: formattedMessages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { content, channelId } = await request.json();
    const authHeader = request.headers.get("authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authorization token required" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    // In a real app, you'd verify the token and get the user ID
    // For demo purposes, we'll use a placeholder
    const userId = "current-user-id";

    if (!content || !channelId) {
      return NextResponse.json(
        { error: "Content and channel ID are required" },
        { status: 400 }
      );
    }

    // Create message
    const message = await db.message.create({
      data: {
        content,
        channelId,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            status: true
          }
        }
      }
    });

    return NextResponse.json({
      message: {
        id: message.id,
        content: message.content,
        userId: message.userId,
        userName: message.user.name,
        userEmail: message.user.email,
        userAvatar: message.user.avatar,
        userStatus: message.user.status,
        timestamp: message.createdAt
      }
    });
  } catch (error) {
    console.error("Error creating message:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}