import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { unlink } from "fs/promises";
import { join } from "path";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Helper function to get user from token
async function getUserFromToken(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value;
    
    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
    return decoded;
  } catch (error) {
    return null;
  }
}

// DELETE /api/files/[id] - Delete a file
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken(request);
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const fileId = params.id;

    // Get file details
    const file = await db.file.findUnique({
      where: { id: fileId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Check if user owns the file or is workspace admin
    const userWorkspace = await db.userWorkspace.findUnique({
      where: {
        userId_workspaceId: {
          userId: user.userId,
          workspaceId: file.workspaceId
        }
      }
    });

    if (!userWorkspace || (file.userId !== user.userId && userWorkspace.role !== "admin")) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Delete physical file
    try {
      const filePath = join(process.cwd(), "public", file.url);
      await unlink(filePath);
    } catch (error) {
      console.error("Error deleting physical file:", error);
      // Continue with database deletion even if physical file deletion fails
    }

    // Delete file record from database
    await db.file.delete({
      where: { id: fileId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting file:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}