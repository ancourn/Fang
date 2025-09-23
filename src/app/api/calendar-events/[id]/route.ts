import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/calendar-events/[id] - Get a specific calendar event
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const event = await db.calendarEvent.findUnique({
      where: { id: params.id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        attendees: {
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
        },
        task: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true
          }
        },
        reminders: true,
        recurring: true,
        roomBookings: {
          include: {
            room: {
              select: {
                id: true,
                name: true,
                location: true,
                capacity: true
              }
            }
          }
        },
        _count: {
          select: {
            attendees: true,
            reminders: true
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

    return NextResponse.json(event);
  } catch (error) {
    console.error("Error fetching calendar event:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/calendar-events/[id] - Update a calendar event
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      startTime,
      endTime,
      allDay,
      location,
      meetingUrl,
      type,
      status,
      visibility,
      color,
      attendees,
      reminders
    } = body;

    // Get the current event
    const currentEvent = await db.calendarEvent.findUnique({
      where: { id: params.id },
      include: {
        workspace: {
          select: {
            id: true
          }
        }
      }
    });

    if (!currentEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Check if user has access to the workspace
    const user = await db.user.findUnique({
      where: { email: session.user.email },
      include: {
        workspaces: {
          where: { workspaceId: currentEvent.workspaceId }
        }
      }
    });

    if (!user || user.workspaces.length === 0) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Update the event
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (startTime !== undefined) updateData.startTime = new Date(startTime);
    if (endTime !== undefined) updateData.endTime = new Date(endTime);
    if (allDay !== undefined) updateData.allDay = allDay;
    if (location !== undefined) updateData.location = location;
    if (meetingUrl !== undefined) updateData.meetingUrl = meetingUrl;
    if (type !== undefined) updateData.type = type;
    if (status !== undefined) updateData.status = status;
    if (visibility !== undefined) updateData.visibility = visibility;
    if (color !== undefined) updateData.color = color;

    const updatedEvent = await db.calendarEvent.update({
      where: { id: params.id },
      data: updateData,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        attendees: {
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
        },
        task: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true
          }
        },
        _count: {
          select: {
            attendees: true,
            reminders: true
          }
        }
      }
    });

    // Handle attendees update
    if (attendees !== undefined) {
      // Remove existing attendees
      await db.calendarAttendee.deleteMany({
        where: { eventId: params.id }
      });

      // Add new attendees
      if (attendees.length > 0) {
        await db.calendarAttendee.createMany({
          data: attendees.map((attendee: { userId?: string; email?: string; role?: string }) => ({
            eventId: params.id,
            userId: attendee.userId,
            email: attendee.email,
            role: attendee.role || "attendee"
          }))
        });
      }
    }

    // Handle reminders update
    if (reminders !== undefined) {
      // Remove existing reminders
      await db.calendarReminder.deleteMany({
        where: { eventId: params.id }
      });

      // Add new reminders
      if (reminders.length > 0) {
        await db.calendarReminder.createMany({
          data: reminders.map((reminder: { minutesBefore: number; method?: string }) => ({
            eventId: params.id,
            minutesBefore: reminder.minutesBefore || 15,
            method: reminder.method || "notification"
          }))
        });
      }
    }

    // Fetch the updated event with all relations
    const finalEvent = await db.calendarEvent.findUnique({
      where: { id: params.id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        attendees: {
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
        },
        task: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true
          }
        },
        _count: {
          select: {
            attendees: true,
            reminders: true
          }
        }
      }
    });

    return NextResponse.json(finalEvent);
  } catch (error) {
    console.error("Error updating calendar event:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/calendar-events/[id] - Delete a calendar event
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the current event
    const currentEvent = await db.calendarEvent.findUnique({
      where: { id: params.id },
      include: {
        workspace: {
          select: {
            id: true
          }
        }
      }
    });

    if (!currentEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Check if user has access to the workspace
    const user = await db.user.findUnique({
      where: { email: session.user.email },
      include: {
        workspaces: {
          where: { workspaceId: currentEvent.workspaceId }
        }
      }
    });

    if (!user || user.workspaces.length === 0) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Delete the event (this will cascade delete related records)
    await db.calendarEvent.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Error deleting calendar event:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}