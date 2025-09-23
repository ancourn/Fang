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

    // Get all comments (top-level only, replies will be nested)
    const comments = await db.documentComment.findMany({
      where: { 
        documentId,
        parentId: null // Only top-level comments
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        replies: {
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
          orderBy: { createdAt: "asc" }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ comments });
  } catch (error) {
    console.error("Error fetching document comments:", error);
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
    const { content, position, parentId } = await request.json();

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
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

    // Check if user has permission to comment on this document
    const canComment = 
      document.userId === user.id ||
      document.workspace.members.length > 0 ||
      document.collaborators.some(collab => 
        ["owner", "editor", "commenter"].includes(collab.role)
      );

    if (!canComment) {
      return NextResponse.json({ error: "Comment access denied" }, { status: 403 });
    }

    // If parentId is provided, check if it exists and belongs to this document
    if (parentId) {
      const parentComment = await db.documentComment.findUnique({
        where: { id: parentId }
      });

      if (!parentComment || parentComment.documentId !== documentId) {
        return NextResponse.json({ error: "Parent comment not found" }, { status: 404 });
      }
    }

    // Create the comment
    const newComment = await db.documentComment.create({
      data: {
        documentId,
        userId: user.id,
        content: content.trim(),
        position: position ? JSON.stringify(position) : null,
        parentId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        replies: {
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
          orderBy: { createdAt: "asc" }
        }
      }
    });

    // Log activity
    await db.documentActivity.create({
      data: {
        documentId,
        userId: user.id,
        action: parentId ? "comment_replied" : "comment_added",
        details: JSON.stringify({
          commentId: newComment.id,
          hasPosition: !!position,
          isReply: !!parentId
        })
      }
    });

    return NextResponse.json({ comment: newComment });
  } catch (error) {
    console.error("Error creating document comment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}