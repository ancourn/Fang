import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface RouteParams {
  params: {
    id: string;
  };
}

// POST /api/calendar-events/[id]/attendees - RSVP to an event
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { status } = body;

    if (!status || !["accepted", "declined", "tentative"].includes(status)) {
      return NextResponse.json({ error: "Valid status is required" }, { status: 400 });
    }

    // Get the current event
    const event = await db.calendarEvent.findUnique({
      where: { id: params.id },
      include: {
        workspace: {
          select: {
            id: true
          }
        }
      }
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Check if user has access to the workspace
    const user = await db.user.findUnique({
      where: { email: session.user.email },
      include: {
        workspaces: {
          where: { workspaceId: event.workspaceId }
        }
      }
    });

    if (!user || user.workspaces.length === 0) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Update or create attendee record
    const attendee = await db.calendarAttendee.upsert({
      where: {
        eventId_userId: {
          eventId: params.id,
          userId: user.id
        }
      },
      update: {
        status,
        respondedAt: new Date()
      },
      create: {
        eventId: params.id,
        userId: user.id,
        status,
        role: "attendee",
        respondedAt: new Date()
      },
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

    return NextResponse.json(attendee);
  } catch (error) {
    console.error("Error updating attendee status:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}