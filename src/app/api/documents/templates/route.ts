import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json({ error: "Workspace ID is required" }, { status: 400 });
    }

    // Check if user has access to workspace
    const userWorkspace = await db.userWorkspace.findFirst({
      where: {
        userId: session.user.id,
        workspaceId: workspaceId,
      },
    });

    if (!userWorkspace) {
      return NextResponse.json({ error: "Access denied to workspace" }, { status: 403 });
    }

    // Fetch templates - both user's private templates and public templates
    const templates = await db.documentTemplate.findMany({
      where: {
        OR: [
          { userId: session.user.id, workspaceId: workspaceId },
          { isPublic: true },
        ],
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
        _count: {
          select: {
            templateUses: true,
          },
        },
      },
      orderBy: [
        { isFeatured: "desc" },
        { updatedAt: "desc" },
      ],
    });

    // Transform the response to match the frontend interface
    const transformedTemplates = templates.map(template => ({
      ...template,
      _count: {
        uses: template._count.templateUses,
      },
    }));

    return NextResponse.json({ templates: transformedTemplates });
  } catch (error) {
    console.error("Get templates error:", error);
    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, description, content, type, category, isPublic, isFeatured, workspaceId } = await request.json();

    if (!title || !workspaceId) {
      return NextResponse.json({ error: "Title and workspace ID are required" }, { status: 400 });
    }

    // Check if user has access to workspace
    const userWorkspace = await db.userWorkspace.findFirst({
      where: {
        userId: session.user.id,
        workspaceId: workspaceId,
      },
    });

    if (!userWorkspace) {
      return NextResponse.json({ error: "Access denied to workspace" }, { status: 403 });
    }

    const template = await db.documentTemplate.create({
      data: {
        title,
        description,
        content,
        type,
        category,
        isPublic: isPublic || false,
        isFeatured: isFeatured || false,
        userId: session.user.id,
        workspaceId,
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
        _count: {
          select: {
            templateUses: true,
          },
        },
      },
    });

    // Transform the response
    const transformedTemplate = {
      ...template,
      _count: {
        uses: template._count.templateUses,
      },
    };

    return NextResponse.json({ template: transformedTemplate });
  } catch (error) {
    console.error("Create template error:", error);
    return NextResponse.json({ error: "Failed to create template" }, { status: 500 });
  }
}