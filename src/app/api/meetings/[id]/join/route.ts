import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if meeting exists
    const meeting = await db.meeting.findUnique({
      where: { id: params.id },
      include: {
        participants: {
          where: { userId: session.user.id },
        },
      },
    });

    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    // Check if user is already a participant
    const existingParticipant = meeting.participants[0];
    if (existingParticipant) {
      // Update participant status
      const participant = await db.meetingParticipant.update({
        where: { id: existingParticipant.id },
        data: {
          joinedAt: new Date(),
          leftAt: null,
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

      return NextResponse.json(participant);
    }

    // Add user as participant if not already
    const participant = await db.meetingParticipant.create({
      data: {
        meetingId: params.id,
        userId: session.user.id,
        role: "participant",
        joinedAt: new Date(),
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
    console.error("Error joining meeting:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find participant record
    const participant = await db.meetingParticipant.findUnique({
      where: {
        meetingId_userId: {
          meetingId: params.id,
          userId: session.user.id,
        },
      },
    });

    if (!participant) {
      return NextResponse.json({ error: "Participant not found" }, { status: 404 });
    }

    // Update participant status
    const updatedParticipant = await db.meetingParticipant.update({
      where: { id: participant.id },
      data: {
        leftAt: new Date(),
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

    return NextResponse.json(updatedParticipant);
  } catch (error) {
    console.error("Error leaving meeting:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}