import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Helper function to get user from token
async function getUserFromToken(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value;
  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = await db.user.findUnique({
      where: { id: decoded.userId },
    });
    return user;
  } catch (error) {
    return null;
  }
}

// GET /api/documents/[id] - Get a specific document
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const document = await db.document.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        channel: {
          select: {
            id: true,
            name: true,
            displayName: true,
          },
        },
        files: true,
      },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Check if user has access to this workspace
    const userWorkspace = await db.userWorkspace.findUnique({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId: document.workspaceId,
        },
      },
    });

    if (!userWorkspace) {
      return NextResponse.json({ error: "Access denied to this workspace" }, { status: 403 });
    }

    return NextResponse.json({ document });
  } catch (error) {
    console.error("Get document error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/documents/[id] - Update a document
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, content } = await request.json();

    // Check if document exists and user has access
    const existingDocument = await db.document.findUnique({
      where: { id: params.id },
      include: {
        workspace: true,
      },
    });

    if (!existingDocument) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Check if user has access to this workspace
    const userWorkspace = await db.userWorkspace.findUnique({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId: existingDocument.workspaceId,
        },
      },
    });

    if (!userWorkspace) {
      return NextResponse.json({ error: "Access denied to this workspace" }, { status: 403 });
    }

    // Get the current highest version number
    const latestVersion = await db.documentVersion.findFirst({
      where: { documentId: params.id },
      orderBy: { version: "desc" },
    });

    const newVersionNumber = latestVersion ? latestVersion.version + 1 : 1;

    // Create a new version before updating
    await db.documentVersion.create({
      data: {
        documentId: params.id,
        version: newVersionNumber,
        title: title || existingDocument.title,
        content: content !== undefined ? content : existingDocument.content || "",
        changeLog: "Document updated",
        userId: user.id,
      },
    });

    // Update the document
    const document = await db.document.update({
      where: { id: params.id },
      data: {
        ...(title && { title }),
        ...(content !== undefined && { content }),
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
        channel: {
          select: {
            id: true,
            name: true,
            displayName: true,
          },
        },
      },
    });

    // Log activity
    await db.documentActivity.create({
      data: {
        documentId: params.id,
        userId: user.id,
        action: "updated",
        details: JSON.stringify({
          titleChanged: title !== existingDocument.title,
          contentChanged: content !== existingDocument.content,
        }),
      },
    });

    return NextResponse.json({ document });
  } catch (error) {
    console.error("Update document error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/documents/[id] - Delete a document
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if document exists and user has access
    const existingDocument = await db.document.findUnique({
      where: { id: params.id },
    });

    if (!existingDocument) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Check if user has access to this workspace
    const userWorkspace = await db.userWorkspace.findUnique({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId: existingDocument.workspaceId,
        },
      },
    });

    if (!userWorkspace) {
      return NextResponse.json({ error: "Access denied to this workspace" }, { status: 403 });
    }

    // Check if user is the owner or has admin rights
    if (existingDocument.userId !== user.id && userWorkspace.role !== "admin" && userWorkspace.role !== "owner") {
      return NextResponse.json({ error: "Access denied to delete this document" }, { status: 403 });
    }

    // Delete the document
    await db.document.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Document deleted successfully" });
  } catch (error) {
    console.error("Delete document error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}