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

    const members = await db.projectMember.findMany({
      where: {
        projectId: params.id,
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
      },
      orderBy: {
        joinedAt: "asc",
      },
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error("Error fetching project members:", error);
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
    const { userId, role } = body;

    if (!userId || !role) {
      return NextResponse.json({ error: "User ID and role are required" }, { status: 400 });
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

    // Check if user is already a member
    const existingMember = await db.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: params.id,
          userId: userId,
        },
      },
    });

    if (existingMember) {
      return NextResponse.json({ error: "User is already a project member" }, { status: 400 });
    }

    const member = await db.projectMember.create({
      data: {
        projectId: params.id,
        userId,
        role,
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
      },
    });

    return NextResponse.json(member);
  } catch (error) {
    console.error("Error adding project member:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}