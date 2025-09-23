import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; version: string } }
) {
  try {
    const { id, version } = params;
    const versionNumber = parseInt(version);

    if (isNaN(versionNumber)) {
      return NextResponse.json(
        { error: "Invalid version number" },
        { status: 400 }
      );
    }

    // Get the version to restore
    const versionToRestore = await db.documentVersion.findFirst({
      where: {
        documentId: id,
        version: versionNumber,
      },
    });

    if (!versionToRestore) {
      return NextResponse.json(
        { error: "Version not found" },
        { status: 404 }
      );
    }

    // Update the document with the version content
    const updatedDocument = await db.document.update({
      where: { id },
      data: {
        title: versionToRestore.title,
        content: versionToRestore.content,
      },
    });

    // Create a new version for the restore action
    const latestVersion = await db.documentVersion.findFirst({
      where: { documentId: id },
      orderBy: { version: "desc" },
    });

    const newVersionNumber = latestVersion ? latestVersion.version + 1 : 1;

    const restoreVersion = await db.documentVersion.create({
      data: {
        documentId: id,
        version: newVersionNumber,
        title: versionToRestore.title,
        content: versionToRestore.content,
        changeLog: `Restored from version ${versionNumber}`,
        userId: "current-user", // In real app, get from auth
      },
    });

    // Log activity
    await db.documentActivity.create({
      data: {
        documentId: id,
        userId: "current-user", // In real app, get from auth
        action: "version_restored",
        details: JSON.stringify({
          fromVersion: versionNumber,
          toVersion: newVersionNumber,
        }),
      },
    });

    return NextResponse.json({
      document: updatedDocument,
      version: restoreVersion,
    });
  } catch (error) {
    console.error("Error restoring document version:", error);
    return NextResponse.json(
      { error: "Failed to restore document version" },
      { status: 500 }
    );
  }
}