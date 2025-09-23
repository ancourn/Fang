import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Helper function to parse search query with operators
function parseSearchQuery(query: string) {
  const operators: {
    exact: string[];
    exclude: string[];
    mentions: string[];
    channels: string[];
    regular: string;
  } = {
    exact: [],
    exclude: [],
    mentions: [],
    channels: [],
    regular: query
  };

  // Extract exact matches (quotes)
  const exactMatches = query.match(/"([^"]*)"/g);
  if (exactMatches) {
    operators.exact = exactMatches.map(match => match.slice(1, -1));
    operators.regular = query.replace(/"([^"]*)"/g, '').trim();
  }

  // Extract exclusions (minus sign)
  const exclusions = operators.regular.match(/-\s*(\S+)/g);
  if (exclusions) {
    operators.exclude = exclusions.map(match => match.replace(/-\s*/, ''));
    operators.regular = operators.regular.replace(/-\s*\S+/g, '').trim();
  }

  // Extract mentions (@)
  const mentions = operators.regular.match(/@(\S+)/g);
  if (mentions) {
    operators.mentions = mentions.map(match => match.slice(1));
    operators.regular = operators.regular.replace(/@\S+/g, '').trim();
  }

  // Extract channels (#)
  const channels = operators.regular.match(/#(\S+)/g);
  if (channels) {
    operators.channels = channels.map(match => match.slice(1));
    operators.regular = operators.regular.replace(/#\S+/g, '').trim();
  }

  return operators;
}

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

interface SearchResult {
  id: string;
  type: 'message' | 'user' | 'file';
  title: string;
  content?: string;
  user?: {
    id: string;
    name?: string;
    email: string;
    avatar?: string;
  };
  createdAt: string;
  url?: string;
}

// GET /api/search - Search across messages, users, and files
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    const workspaceId = searchParams.get("workspaceId");
    const type = searchParams.get("type"); // 'messages', 'users', 'files', or empty for all
    const dateFilter = searchParams.get("dateFilter") || "all";
    const userId = searchParams.get("userId") || "";

    if (!q) {
      return NextResponse.json({ results: [] });
    }

    if (!workspaceId) {
      return NextResponse.json({ error: "Workspace ID is required" }, { status: 400 });
    }

    // Verify user has access to this workspace
    const userWorkspace = await db.userWorkspace.findUnique({
      where: {
        userId_workspaceId: {
          userId: user.userId,
          workspaceId
        }
      }
    });

    if (!userWorkspace) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const results: SearchResult[] = [];
    const searchTerm = q.toLowerCase();

    // Calculate date range based on filter
    let dateFilterObj = {};
    const now = new Date();
    
    switch (dateFilter) {
      case 'today':
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        dateFilterObj = { gte: today };
        break;
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateFilterObj = { gte: weekAgo };
        break;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        dateFilterObj = { gte: monthAgo };
        break;
      default:
        // No date filter
        break;
    }

    // Parse search query for operators
    const searchOperators = parseSearchQuery(q);

    // Search messages
    if (!type || type === 'messages' || type === 'all') {
      const channelMembers = await db.channelMember.findMany({
        where: { userId: user.userId },
        select: { channelId: true }
      });

      const channelIds = channelMembers ? channelMembers.map(cm => cm.channelId) : [];
      
      if (channelIds.length > 0) {
        // Build message search conditions
        const messageConditions: any[] = [];
        
        // Add regular search term
        if (searchOperators.regular) {
          messageConditions.push({ content: { contains: searchOperators.regular, mode: 'insensitive' } });
        }
        
        // Add exact matches
        searchOperators.exact.forEach(exact => {
          messageConditions.push({ content: { contains: exact, mode: 'insensitive' } });
        });
        
        // Add exclusions
        const excludeConditions = searchOperators.exclude.map(exclude => ({
          NOT: { content: { contains: exclude, mode: 'insensitive' } }
        }));
        
        // Add mentions
        searchOperators.mentions.forEach(mention => {
          messageConditions.push({ content: { contains: `@${mention}`, mode: 'insensitive' } });
        });
        
        // Build the final where clause
        let whereClause: any = {
          channelId: { in: channelIds },
          ...(Object.keys(dateFilterObj).length > 0 && { createdAt: dateFilterObj })
        };
        
        if (messageConditions.length > 0) {
          whereClause.OR = messageConditions;
        }
        
        if (excludeConditions.length > 0) {
          whereClause.AND = excludeConditions;
        }
        
        // Add user filter if specified
        if (userId === 'current') {
          whereClause.userId = user.userId;
        }

        const messages = await db.message.findMany({
          where: whereClause,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true
              }
            },
            channel: {
              select: {
                name: true,
                displayName: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 20
        });

        if (messages) {
          messages.forEach(message => {
            results.push({
              id: message.id,
              type: 'message',
              title: `Message in #${message.channel.displayName || message.channel.name}`,
              content: message.content,
              user: message.user,
              createdAt: message.createdAt.toISOString(),
              url: `/#channels/${message.channelId}`
            });
          });
        }
      }

      // Also search direct messages
      const dmConditions: any[] = [];
      
      if (searchOperators.regular) {
        dmConditions.push({ content: { contains: searchOperators.regular, mode: 'insensitive' } });
      }
      
      searchOperators.exact.forEach(exact => {
        dmConditions.push({ content: { contains: exact, mode: 'insensitive' } });
      });

      let dmWhereClause: any = {
        OR: [
          { senderId: user.userId },
          { receiverId: user.userId }
        ],
        ...(Object.keys(dateFilterObj).length > 0 && { createdAt: dateFilterObj })
      };
      
      if (dmConditions.length > 0) {
        dmWhereClause.OR = [
          { senderId: user.userId, OR: dmConditions },
          { receiverId: user.userId, OR: dmConditions }
        ];
      }

      const directMessages = await db.directMessage.findMany({
        where: dmWhereClause,
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true
            }
          },
          receiver: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      });

      if (directMessages) {
        directMessages.forEach(dm => {
          const otherUser = dm.senderId === user.userId ? dm.receiver : dm.sender;
          if (otherUser) {
            results.push({
              id: dm.id,
              type: 'message',
              title: `Direct message with ${otherUser.name || otherUser.email}`,
              content: dm.content,
              user: dm.sender,
              createdAt: dm.createdAt.toISOString()
            });
          }
        });
      }
    }

    // Search users
    if (!type || type === 'users' || type === 'all') {
      const users = await db.user.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { email: { contains: searchTerm, mode: 'insensitive' } }
          ],
          id: { not: user.userId },
          workspaces: {
            some: {
              workspaceId: workspaceId
            }
          }
        },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          status: true,
          createdAt: true
        },
        take: 10
      });

      if (users) {
        users.forEach(user => {
          results.push({
            id: user.id,
            type: 'user',
            title: user.name || user.email,
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              avatar: user.avatar
            },
            createdAt: user.createdAt.toISOString()
          });
        });
      }
    }

    // Search files
    if (!type || type === 'files' || type === 'all') {
      const fileConditions: any[] = [];
      
      if (searchOperators.regular) {
        fileConditions.push({ name: { contains: searchOperators.regular, mode: 'insensitive' } });
        fileConditions.push({ type: { contains: searchOperators.regular, mode: 'insensitive' } });
      }
      
      searchOperators.exact.forEach(exact => {
        fileConditions.push({ name: { contains: exact, mode: 'insensitive' } });
        fileConditions.push({ type: { contains: exact, mode: 'insensitive' } });
      });

      let fileWhereClause: any = {
        workspaceId: workspaceId,
        ...(Object.keys(dateFilterObj).length > 0 && { createdAt: dateFilterObj })
      };
      
      if (fileConditions.length > 0) {
        fileWhereClause.OR = fileConditions;
      }
      
      // Add user filter if specified
      if (userId === 'current') {
        fileWhereClause.userId = user.userId;
      }

      const files = await db.file.findMany({
        where: fileWhereClause,
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
        orderBy: { createdAt: 'desc' },
        take: 20
      });

      if (files) {
        files.forEach(file => {
          results.push({
            id: file.id,
            type: 'file',
            title: file.name,
            content: `${file.type} • ${Math.round(file.size / 1024)}KB`,
            user: file.user,
            createdAt: file.createdAt.toISOString(),
            url: file.url
          });
        });
      }
    }

    // Sort results by relevance (simple scoring based on exact matches)
    const scoredResults = results && results.length > 0 ? results.map(result => {
      let score = 0;
      
      // Exact match in title gets higher score
      if (result.title && result.title.toLowerCase().includes(searchTerm)) {
        score += 10;
      }
      
      // Exact match in content gets medium score
      if (result.content && result.content.toLowerCase().includes(searchTerm)) {
        score += 5;
      }
      
      // Partial matches get lower score
      if (result.title && result.title.toLowerCase().split(' ').some(word => word.includes(searchTerm))) {
        score += 3;
      }
      
      return { ...result, score };
    }) : [];

    // Sort by score and then by date
    if (scoredResults && scoredResults.length > 0) {
      scoredResults.sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }

    return NextResponse.json({
      results: scoredResults ? scoredResults.slice(0, 50) : [] // Limit to 50 results
    });
  } catch (error) {
    console.error("Error performing search:", error);
    return NextResponse.json(
      { error: "Failed to perform search" },
      { status: 500 }
    );
  }
}