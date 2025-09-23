import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const documentId = params.id;

    // Check if user has access to this document
    const document = await db.document.findUnique({
      where: { id: documentId },
      include: {
        workspace: {
          include: {
            members: {
              where: { userId: user.id }
            }
          }
        },
        collaborators: {
          where: { userId: user.id }
        }
      }
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Check if user has permission to view this document
    const hasAccess = 
      document.userId === user.id ||
      document.workspace.members.length > 0 ||
      document.collaborators.length > 0;

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Get document activities
    const activities = await db.documentActivity.findMany({
      where: { documentId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset
    });

    // Get total count for pagination
    const total = await db.documentActivity.count({
      where: { documentId }
    });

    return NextResponse.json({
      activities,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });
  } catch (error) {
    console.error("Error fetching document activities:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Log activity (can be called internally)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const documentId = params.id;
    const { action, details } = await request.json();

    if (!action) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 });
    }

    // Check if user has access to this document
    const document = await db.document.findUnique({
      where: { id: documentId },
      include: {
        workspace: {
          include: {
            members: {
              where: { userId: user.id }
            }
          }
        },
        collaborators: {
          where: { userId: user.id }
        }
      }
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Check if user has permission to view this document
    const hasAccess = 
      document.userId === user.id ||
      document.workspace.members.length > 0 ||
      document.collaborators.length > 0;

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Create activity log
    const activity = await db.documentActivity.create({
      data: {
        documentId,
        userId: user.id,
        action,
        details: details ? JSON.stringify(details) : null
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

    return NextResponse.json({ activity });
  } catch (error) {
    console.error("Error logging document activity:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}