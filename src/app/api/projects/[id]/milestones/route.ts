import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if project exists and user has access
    const project = await db.project.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const userWorkspace = await db.userWorkspace.findFirst({
      where: {
        userId: session.user.id,
        workspaceId: project.workspaceId,
      },
    });

    if (!userWorkspace) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const milestones = await db.projectMilestone.findMany({
      where: {
        projectId: params.id,
      },
      orderBy: {
        dueDate: "asc",
      },
    });

    return NextResponse.json(milestones);
  } catch (error) {
    console.error("Error fetching project milestones:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, dueDate, status } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Check if project exists and user has access
    const project = await db.project.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const userWorkspace = await db.userWorkspace.findFirst({
      where: {
        userId: session.user.id,
        workspaceId: project.workspaceId,
      },
    });

    if (!userWorkspace) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const milestone = await db.projectMilestone.create({
      data: {
        projectId: params.id,
        name,
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
        status: status || "pending",
      },
    });

    return NextResponse.json(milestone);
  } catch (error) {
    console.error("Error creating project milestone:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}