import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/meeting-rooms - Get all meeting rooms for a workspace
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json({ error: "Workspace ID is required" }, { status: 400 });
    }

    // Check if user has access to the workspace
    const user = await db.user.findUnique({
      where: { email: session.user.email },
      include: {
        workspaces: {
          where: { workspaceId }
        }
      }
    });

    if (!user || user.workspaces.length === 0) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const rooms = await db.meetingRoom.findMany({
      where: {
        workspaceId,
        isActive: true
      },
      include: {
        _count: {
          select: {
            bookings: true
          }
        }
      },
      orderBy: {
        name: "asc"
      }
    });

    return NextResponse.json(rooms);
  } catch (error) {
    console.error("Error fetching meeting rooms:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/meeting-rooms - Create a new meeting room
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      location,
      capacity,
      equipment,
      workspaceId
    } = body;

    if (!name || !workspaceId) {
      return NextResponse.json({ error: "Name and workspace ID are required" }, { status: 400 });
    }

    // Check if user has access to the workspace
    const user = await db.user.findUnique({
      where: { email: session.user.email },
      include: {
        workspaces: {
          where: { workspaceId }
        }
      }
    });

    if (!user || user.workspaces.length === 0) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Create the meeting room
    const room = await db.meetingRoom.create({
      data: {
        name,
        description,
        location,
        capacity,
        equipment: equipment ? JSON.stringify(equipment) : null,
        workspaceId
      },
      include: {
        _count: {
          select: {
            bookings: true
          }
        }
      }
    });

    return NextResponse.json(room);
  } catch (error) {
    console.error("Error creating meeting room:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}