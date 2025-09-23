import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const threadId = params.id;

    // Fetch all messages that are replies to the parent message
    const messages = await db.message.findMany({
      where: {
        threadId: threadId
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
        createdAt: "asc"
      }
    });

    // Format the response
    const formattedMessages = messages.map(message => ({
      id: message.id,
      content: message.content,
      userId: message.userId,
      userName: message.user.name || message.user.email,
      userEmail: message.user.email,
      userAvatar: message.user.avatar,
      userStatus: message.user.status,
      timestamp: message.createdAt.toISOString(),
      threadId: message.threadId,
      reactions: message.reactions.reduce((acc, reaction) => {
        const existing = acc.find(r => r.emoji === reaction.emoji);
        if (existing) {
          existing.count++;
          existing.users.push(reaction.user.id);
        } else {
          acc.push({
            emoji: reaction.emoji,
            count: 1,
            users: [reaction.user.id]
          });
        }
        return acc;
      }, [] as { emoji: string; count: number; users: string[] }[])
    }));

    return NextResponse.json({
      success: true,
      messages: formattedMessages
    });

  } catch (error) {
    console.error("Error fetching thread messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch thread messages" },
      { status: 500 }
    );
  }
}