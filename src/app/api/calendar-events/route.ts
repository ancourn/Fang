import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/calendar-events - Get all calendar events for a workspace
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");
    const channelId = searchParams.get("channelId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

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

    const whereClause: any = {
      workspaceId
    };

    if (channelId) {
      whereClause.channelId = channelId;
    }

    if (startDate && endDate) {
      whereClause.startTime = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const events = await db.calendarEvent.findMany({
      where: whereClause,
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
      },
      orderBy: {
        startTime: "asc"
      }
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/calendar-events - Create a new calendar event
export async function POST(request: NextRequest) {
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
      workspaceId,
      channelId,
      taskId,
      attendees,
      reminders
    } = body;

    if (!title || !startTime || !endTime || !workspaceId) {
      return NextResponse.json({ 
        error: "Title, start time, end time, and workspace ID are required" 
      }, { status: 400 });
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

    // Create the calendar event
    const event = await db.calendarEvent.create({
      data: {
        title,
        description,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        allDay: allDay || false,
        location,
        meetingUrl,
        type: type || "event",
        status: status || "confirmed",
        visibility: visibility || "public",
        color: color || "#3b82f6",
        workspaceId,
        channelId,
        taskId,
        creatorId: user.id,
        attendees: attendees ? {
          create: attendees.map((attendee: { userId?: string; email?: string; role?: string }) => ({
            userId: attendee.userId,
            email: attendee.email,
            role: attendee.role || "attendee"
          }))
        } : undefined,
        reminders: reminders ? {
          create: reminders.map((reminder: { minutesBefore: number; method?: string }) => ({
            minutesBefore: reminder.minutesBefore || 15,
            method: reminder.method || "notification"
          }))
        } : undefined
      },
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

    return NextResponse.json(event);
  } catch (error) {
    console.error("Error creating calendar event:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}