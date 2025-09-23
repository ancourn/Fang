import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const participants = await db.meetingParticipant.findMany({
      where: { meetingId: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        joinedAt: "asc",
      },
    });

    return NextResponse.json(participants);
  } catch (error) {
    console.error("Error fetching meeting participants:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { userId, role = "participant" } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Check if meeting exists and user has permission
    const meeting = await db.meeting.findUnique({
      where: { id: params.id },
    });

    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    // Only meeting host can add participants
    if (meeting.hostId !== session.user.id) {
      return NextResponse.json({ error: "Only meeting host can add participants" }, { status: 403 });
    }

    // Check if user is already a participant
    const existingParticipant = await db.meetingParticipant.findUnique({
      where: {
        meetingId_userId: {
          meetingId: params.id,
          userId,
        },
      },
    });

    if (existingParticipant) {
      return NextResponse.json({ error: "User is already a participant" }, { status: 400 });
    }

    const participant = await db.meetingParticipant.create({
      data: {
        meetingId: params.id,
        userId,
        role,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    return NextResponse.json(participant, { status: 201 });
  } catch (error) {
    console.error("Error adding meeting participant:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}