import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Helper function to get user from token
async function getUserFromToken(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value;
  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = await db.user.findUnique({
      where: { id: decoded.userId },
    });
    return user;
  } catch (error) {
    return null;
  }
}

// POST /api/channels/leave - Leave a channel
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { channelId } = await request.json();

    if (!channelId) {
      return NextResponse.json({ error: "Channel ID is required" }, { status: 400 });
    }

    // Check if channel exists
    const channel = await db.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    // Check if user is a member
    const membership = await db.channelMember.findUnique({
      where: {
        userId_channelId: {
          userId: user.id,
          channelId: channelId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Not a member of this channel" }, { status: 404 });
    }

    // Remove user from channel
    await db.channelMember.delete({
      where: {
        userId_channelId: {
          userId: user.id,
          channelId: channelId,
        },
      },
    });

    return NextResponse.json({ message: "Successfully left channel" });
  } catch (error) {
    console.error("Leave channel error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}