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

    // Get all collaborators
    const collaborators = await db.documentCollaborator.findMany({
      where: { documentId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            status: true
          }
        }
      },
      orderBy: { joinedAt: "desc" }
    });

    return NextResponse.json({ collaborators });
  } catch (error) {
    console.error("Error fetching document collaborators:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

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
    const { userId, role, permission } = await request.json();

    if (!userId || !role || !permission) {
      return NextResponse.json({ error: "User ID, role, and permission are required" }, { status: 400 });
    }

    // Check if user has permission to manage collaborators
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

    // Check if user has permission to manage collaborators
    const canManageCollaborators = 
      document.userId === user.id ||
      document.workspace.members.some(member => ["owner", "admin"].includes(member.role)) ||
      document.collaborators.some(collab => collab.role === "owner" && collab.userId === user.id);

    if (!canManageCollaborators) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // Check if user exists
    const targetUser = await db.user.findUnique({
      where: { id: userId }
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user is already a collaborator
    const existingCollaborator = await db.documentCollaborator.findUnique({
      where: {
        documentId_userId: {
          documentId,
          userId
        }
      }
    });

    if (existingCollaborator) {
      // Update existing collaborator
      const updatedCollaborator = await db.documentCollaborator.update({
        where: { id: existingCollaborator.id },
        data: { role, permission },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              status: true
            }
          }
        }
      });

      // Log activity
      await db.documentActivity.create({
        data: {
          documentId,
          userId: user.id,
          action: "collaborator_updated",
          details: JSON.stringify({
            targetUserId: userId,
            role,
            permission
          })
        }
      });

      return NextResponse.json({ collaborator: updatedCollaborator });
    } else {
      // Add new collaborator
      const newCollaborator = await db.documentCollaborator.create({
        data: {
          documentId,
          userId,
          role,
          permission
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              status: true
            }
          }
        }
      });

      // Log activity
      await db.documentActivity.create({
        data: {
          documentId,
          userId: user.id,
          action: "collaborator_added",
          details: JSON.stringify({
            targetUserId: userId,
            role,
            permission
          })
        }
      });

      return NextResponse.json({ collaborator: newCollaborator });
    }
  } catch (error) {
    console.error("Error managing document collaborator:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}