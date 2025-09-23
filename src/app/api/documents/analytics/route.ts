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
    const timeRange = searchParams.get("timeRange") || "30d";

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

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    
    switch (timeRange) {
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "1y":
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Fetch basic statistics
    const [
      totalDocuments,
      totalActivities,
      totalComments,
      totalCollaborators,
      documentsByType,
      topDocuments,
      userActivity
    ] = await Promise.all([
      // Total documents
      db.document.count({
        where: {
          workspaceId: workspaceId,
          createdAt: { gte: startDate },
        },
      }),

      // Total activities (views, edits)
      db.documentActivity.count({
        where: {
          document: {
            workspaceId: workspaceId,
          },
          createdAt: { gte: startDate },
        },
      }),

      // Total comments
      db.documentComment.count({
        where: {
          document: {
            workspaceId: workspaceId,
          },
          createdAt: { gte: startDate },
        },
      }),

      // Unique active users
      db.documentActivity.findMany({
        where: {
          document: {
            workspaceId: workspaceId,
          },
          createdAt: { gte: startDate },
        },
        select: {
          userId: true,
        },
        distinct: ["userId"],
      }),

      // Documents by type
      db.document.groupBy({
        by: ["type"],
        where: {
          workspaceId: workspaceId,
          createdAt: { gte: startDate },
        },
        _count: {
          type: true,
        },
      }),

      // Top documents by activity
      db.document.findMany({
        where: {
          workspaceId: workspaceId,
          createdAt: { gte: startDate },
        },
        include: {
          _count: {
            select: {
              activities: true,
              comments: true,
              collaborators: true,
            },
          },
        },
        orderBy: [
          {
            activities: {
              _count: "desc",
            },
          },
        ],
        take: 10,
      }),

      // User activity
      db.user.findMany({
        where: {
          OR: [
            {
              documents: {
                some: {
                  workspaceId: workspaceId,
                  createdAt: { gte: startDate },
                },
              },
            },
            {
              documentActivities: {
                some: {
                  document: {
                    workspaceId: workspaceId,
                  },
                  createdAt: { gte: startDate },
                },
              },
            },
            {
              documentComments: {
                some: {
                  document: {
                    workspaceId: workspaceId,
                  },
                  createdAt: { gte: startDate },
                },
              },
            },
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          _count: {
            select: {
              documents: {
                where: {
                  workspaceId: workspaceId,
                  createdAt: { gte: startDate },
                },
              },
              documentActivities: {
                where: {
                  document: {
                    workspaceId: workspaceId,
                  },
                  createdAt: { gte: startDate },
                },
              },
              documentComments: {
                where: {
                  document: {
                    workspaceId: workspaceId,
                  },
                  createdAt: { gte: startDate },
                },
              },
            },
          },
        },
        orderBy: [
          {
            documentActivities: {
              _count: "desc",
            },
          },
        ],
        take: 10,
      }),
    ]);

    // Calculate activity trend for the last 30 days
    const activityTrend = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

      const [dayViews, dayEdits, dayComments] = await Promise.all([
        db.documentActivity.count({
          where: {
            document: {
              workspaceId: workspaceId,
            },
            action: "viewed",
            createdAt: {
              gte: dayStart,
              lt: dayEnd,
            },
          },
        }),
        db.documentActivity.count({
          where: {
            document: {
              workspaceId: workspaceId,
            },
            action: {
              in: ["updated", "edited"],
            },
            createdAt: {
              gte: dayStart,
              lt: dayEnd,
            },
          },
        }),
        db.documentComment.count({
          where: {
            document: {
              workspaceId: workspaceId,
            },
            createdAt: {
              gte: dayStart,
              lt: dayEnd,
            },
          },
        }),
      ]);

      activityTrend.push({
        date: dayStart.toISOString(),
        views: dayViews,
        edits: dayEdits,
        comments: dayComments,
      });
    }

    // Process documents by type
    const documentsByType = {
      doc: 0,
      sheet: 0,
      slide: 0,
    };

    documentsByType.forEach(item => {
      if (item.type in documentsByType) {
        documentsByType[item.type as keyof typeof documentsByType] = item._count.type;
      }
    });

    // Process top documents
    const processedTopDocuments = topDocuments.map(doc => ({
      id: doc.id,
      title: doc.title,
      views: doc._count.activities,
      edits: doc._count.activities,
      comments: doc._count.comments,
      lastActivity: doc.updatedAt.toISOString(),
    }));

    // Process user activity
    const processedUserActivity = userActivity.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      documentsCreated: user._count.documents,
      documentsEdited: user._count.documentActivities,
      comments: user._count.documentComments,
      lastActive: new Date().toISOString(), // Simplified - would need last activity timestamp
    }));

    // Get documents by category (using template categories as a proxy)
    const documentsByCategory: { [key: string]: number } = {};
    
    // For now, we'll use a simple categorization based on document titles/content
    // In a real implementation, you might have a category field on documents
    const categories = ["general", "business", "project", "meeting", "report", "proposal", "technical", "personal"];
    categories.forEach(category => {
      documentsByCategory[category] = Math.floor(Math.random() * 10); // Placeholder data
    });

    const analytics = {
      totalDocuments,
      totalViews: totalActivities, // Simplified - would need to track views separately
      totalEdits: totalActivities,
      totalComments,
      totalShares: Math.floor(totalActivities * 0.1), // Estimated
      totalDownloads: Math.floor(totalActivities * 0.05), // Estimated
      activeUsers: totalCollaborators.length,
      documentsByType,
      documentsByCategory,
      topDocuments: processedTopDocuments,
      userActivity: processedUserActivity,
      activityTrend,
    };

    return NextResponse.json({ analytics });
  } catch (error) {
    console.error("Get analytics error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}