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

    // Get all versions of the document
    const versions = await db.documentVersion.findMany({
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
      orderBy: { version: "desc" }
    });

    return NextResponse.json({ versions });
  } catch (error) {
    console.error("Error fetching document versions:", error);
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
    const { title, content, changelog } = await request.json();

    if (!title || content === undefined) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    // Check if user has write access to this document
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

    // Check if user has permission to edit this document
    const hasWriteAccess = 
      document.userId === user.id ||
      document.workspace.members.some(member => ["owner", "admin"].includes(member.role)) ||
      document.collaborators.some(collab => ["owner", "editor"].includes(collab.role));

    if (!hasWriteAccess) {
      return NextResponse.json({ error: "Write access denied" }, { status: 403 });
    }

    // Get the next version number
    const latestVersion = await db.documentVersion.findFirst({
      where: { documentId },
      orderBy: { version: "desc" }
    });

    const nextVersion = latestVersion ? latestVersion.version + 1 : 1;

    // Create the new version
    const newVersion = await db.documentVersion.create({
      data: {
        documentId,
        version: nextVersion,
        title,
        content,
        changelog: changelog || null,
        userId: user.id
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

    // Update the document
    await db.document.update({
      where: { id: documentId },
      data: {
        title,
        content,
        updatedAt: new Date()
      }
    });

    // Log activity
    await db.documentActivity.create({
      data: {
        documentId,
        userId: user.id,
        action: "version_created",
        details: JSON.stringify({
          version: nextVersion,
          changelog
        })
      }
    });

    return NextResponse.json({ version: newVersion });
  } catch (error) {
    console.error("Error creating document version:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}