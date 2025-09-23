import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Get direct messages between current user and target user
    const messages = await db.directMessage.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: "current-user-id" },
          { senderId: "current-user-id", receiverId: userId }
        ]
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            status: true
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            status: true
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

    const formattedMessages = messages.map(message => ({
      id: message.id,
      content: message.content,
      senderId: message.senderId,
      receiverId: message.receiverId,
      senderName: message.sender.name,
      senderEmail: message.sender.email,
      senderAvatar: message.sender.avatar,
      senderStatus: message.sender.status,
      receiverName: message.receiver.name,
      receiverEmail: message.receiver.email,
      receiverAvatar: message.receiver.avatar,
      receiverStatus: message.receiver.status,
      timestamp: message.createdAt,
      files: message.files
    }));

    return NextResponse.json({ messages: formattedMessages });
  } catch (error) {
    console.error("Error fetching direct messages:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { content, receiverId } = await request.json();
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
    const senderId = "current-user-id";

    if (!content || !receiverId) {
      return NextResponse.json(
        { error: "Content and receiver ID are required" },
        { status: 400 }
      );
    }

    // Create direct message
    const message = await db.directMessage.create({
      data: {
        content,
        senderId,
        receiverId,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            status: true
          }
        },
        receiver: {
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
        senderId: message.senderId,
        receiverId: message.receiverId,
        senderName: message.sender.name,
        senderEmail: message.sender.email,
        senderAvatar: message.sender.avatar,
        senderStatus: message.sender.status,
        receiverName: message.receiver.name,
        receiverEmail: message.receiver.email,
        receiverAvatar: message.receiver.avatar,
        receiverStatus: message.receiver.status,
        timestamp: message.createdAt
      }
    });
  } catch (error) {
    console.error("Error creating direct message:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}