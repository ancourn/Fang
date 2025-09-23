import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";
import { db } from "@/lib/db";
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

// POST /api/files/upload - Upload a file
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.formData();
    const file: File | null = data.get("file") as unknown as File;
    const workspaceId = data.get("workspaceId") as string;
    const messageId = data.get("messageId") as string;
    const directMessageId = data.get("directMessageId") as string;
    const documentId = data.get("documentId") as string;

    if (!file) {
      return NextResponse.json({ error: "No file received" }, { status: 400 });
    }

    if (!workspaceId) {
      return NextResponse.json({ error: "Workspace ID is required" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = new Uint8Array(bytes);

    // Generate unique filename
    const timestamp = Date.now();
    const originalName = file.name;
    const fileExtension = originalName.split('.').pop();
    const fileName = `${timestamp}-${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;
    
    // Save file to public directory
    const path = join(process.cwd(), "public", "uploads", fileName);
    await writeFile(path, buffer);

    // Create file record in database
    const fileRecord = await db.file.create({
      data: {
        name: originalName,
        size: file.size,
        type: file.type,
        url: `/uploads/${fileName}`,
        messageId: messageId || null,
        directMessageId: directMessageId || null,
        documentId: documentId || null,
        workspaceId,
        userId: user.userId
      }
    });

    return NextResponse.json({
      id: fileRecord.id,
      name: fileRecord.name,
      size: fileRecord.size,
      type: fileRecord.type,
      url: fileRecord.url,
      createdAt: fileRecord.createdAt
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}