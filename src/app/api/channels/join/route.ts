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

// POST /api/channels/join - Join a channel
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
      include: {
        workspace: true,
      },
    });

    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    // Check if user has access to this workspace
    const userWorkspace = await db.userWorkspace.findUnique({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId: channel.workspaceId,
        },
      },
    });

    if (!userWorkspace) {
      return NextResponse.json({ error: "Access denied to this workspace" }, { status: 403 });
    }

    // Check if user is already a member
    const existingMembership = await db.channelMember.findUnique({
      where: {
        userId_channelId: {
          userId: user.id,
          channelId: channelId,
        },
      },
    });

    if (existingMembership) {
      return NextResponse.json({ error: "Already a member of this channel" }, { status: 409 });
    }

    // Add user to channel
    const membership = await db.channelMember.create({
      data: {
        userId: user.id,
        channelId: channelId,
      },
    });

    return NextResponse.json({ message: "Successfully joined channel", membership });
  } catch (error) {
    console.error("Join channel error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}