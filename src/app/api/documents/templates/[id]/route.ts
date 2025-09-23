import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const template = await db.documentTemplate.findFirst({
      where: {
        id: params.id,
        OR: [
          { userId: session.user.id },
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
    });

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    const transformedTemplate = {
      ...template,
      _count: {
        uses: template._count.templateUses,
      },
    };

    return NextResponse.json({ template: transformedTemplate });
  } catch (error) {
    console.error("Get template error:", error);
    return NextResponse.json({ error: "Failed to fetch template" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, description, content, type, category, isPublic, isFeatured } = await request.json();

    // Check if template exists and user owns it
    const existingTemplate = await db.documentTemplate.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!existingTemplate) {
      return NextResponse.json({ error: "Template not found or access denied" }, { status: 404 });
    }

    const template = await db.documentTemplate.update({
      where: { id: params.id },
      data: {
        title,
        description,
        content,
        type,
        category,
        isPublic,
        isFeatured,
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

    const transformedTemplate = {
      ...template,
      _count: {
        uses: template._count.templateUses,
      },
    };

    return NextResponse.json({ template: transformedTemplate });
  } catch (error) {
    console.error("Update template error:", error);
    return NextResponse.json({ error: "Failed to update template" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if template exists and user owns it
    const existingTemplate = await db.documentTemplate.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!existingTemplate) {
      return NextResponse.json({ error: "Template not found or access denied" }, { status: 404 });
    }

    await db.documentTemplate.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete template error:", error);
    return NextResponse.json({ error: "Failed to delete template" }, { status: 500 });
  }
}