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

// GET /api/channels - Get channels for a workspace
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json({ error: "Workspace ID is required" }, { status: 400 });
    }

    // Check if user has access to this workspace
    const userWorkspace = await db.userWorkspace.findUnique({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId: workspaceId,
        },
      },
    });

    if (!userWorkspace) {
      return NextResponse.json({ error: "Access denied to this workspace" }, { status: 403 });
    }

    // Get channels for the workspace
    const channels = await db.channel.findMany({
      where: { workspaceId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                status: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
            messages: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // For each channel, check if the user is a member
    const channelsWithMembership = channels.map((channel) => ({
      ...channel,
      isMember: channel.members.some((member) => member.userId === user.id),
      unreadCount: 0, // TODO: Implement unread message count
    }));

    return NextResponse.json({ channels: channelsWithMembership });
  } catch (error) {
    console.error("Get channels error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/channels - Create a new channel
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, description, type, workspaceId } = await request.json();

    if (!name || !workspaceId) {
      return NextResponse.json(
        { error: "Name and workspace ID are required" },
        { status: 400 }
      );
    }

    // Check if user has access to this workspace
    const userWorkspace = await db.userWorkspace.findUnique({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId: workspaceId,
        },
      },
    });

    if (!userWorkspace) {
      return NextResponse.json({ error: "Access denied to this workspace" }, { status: 403 });
    }

    // Check if channel name already exists in this workspace
    const existingChannel = await db.channel.findFirst({
      where: {
        workspaceId,
        name: {
          equals: name,
          mode: "insensitive",
        },
      },
    });

    if (existingChannel) {
      return NextResponse.json(
        { error: "Channel with this name already exists" },
        { status: 409 }
      );
    }

    // Create the channel
    const channel = await db.channel.create({
      data: {
        name: name.toLowerCase().replace(/\s+/g, "-"),
        displayName: name,
        description,
        type: type || "public",
        workspaceId,
      },
    });

    // Add the creator as a member
    await db.channelMember.create({
      data: {
        userId: user.id,
        channelId: channel.id,
      },
    });

    // If it's a public channel, add all workspace members
    if (type === "public") {
      const workspaceMembers = await db.userWorkspace.findMany({
        where: { workspaceId },
      });

      for (const member of workspaceMembers) {
        if (member.userId !== user.id) {
          await db.channelMember.create({
            data: {
              userId: member.userId,
              channelId: channel.id,
            },
          });
        }
      }
    }

    const createdChannel = await db.channel.findUnique({
      where: { id: channel.id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                status: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ channel: createdChannel });
  } catch (error) {
    console.error("Create channel error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}