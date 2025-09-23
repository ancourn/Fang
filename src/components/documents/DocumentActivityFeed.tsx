"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Activity, 
  Clock, 
  FileText, 
  Users, 
  Edit3, 
  Eye, 
  Save,
  Share,
  Download,
  Filter,
  Search,
  Calendar,
  UserPlus,
  MessageSquare,
  History
} from "lucide-react";

interface ActivityItem {
  id: string;
  type: 'edit' | 'save' | 'view' | 'share' | 'comment' | 'join' | 'leave' | 'create' | 'delete';
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar?: string;
  documentId: string;
  documentTitle: string;
  description: string;
  timestamp: Date;
  metadata?: {
    changes?: number;
    duration?: number;
    collaborators?: number;
    version?: number;
    content?: string;
  };
}

interface DocumentActivityFeedProps {
  documentId: string;
  documentTitle: string;
  canView?: boolean;
  onActivitySelect?: (activity: ActivityItem) => void;
}

export function DocumentActivityFeed({ 
  documentId, 
  documentTitle, 
  canView = true,
  onActivitySelect 
}: DocumentActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [timeRange, setTimeRange] = useState<string>('all');

  useEffect(() => {
    fetchActivities();
  }, [documentId]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      // Mock data for now - in real implementation, this would fetch from API
      const mockActivities: ActivityItem[] = [
        {
          id: '1',
          type: 'edit',
          userId: 'user1',
          userName: 'Alice Chen',
          userEmail: 'alice@example.com',
          userAvatar: '/avatars/alice.jpg',
          documentId,
          documentTitle,
          description: 'Made significant edits to the introduction section',
          timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
          metadata: {
            changes: 156,
            duration: 320
          }
        },
        {
          id: '2',
          type: 'save',
          userId: 'user1',
          userName: 'Alice Chen',
          userEmail: 'alice@example.com',
          userAvatar: '/avatars/alice.jpg',
          documentId,
          documentTitle,
          description: 'Auto-saved document changes',
          timestamp: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
          metadata: {
            version: 12
          }
        },
        {
          id: '3',
          type: 'join',
          userId: 'user2',
          userName: 'Bob Smith',
          userEmail: 'bob@example.com',
          userAvatar: '/avatars/bob.jpg',
          documentId,
          documentTitle,
          description: 'Joined the document for collaborative editing',
          timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
          metadata: {
            collaborators: 2
          }
        },
        {
          id: '4',
          type: 'comment',
          userId: 'user2',
          userName: 'Bob Smith',
          userEmail: 'bob@example.com',
          userAvatar: '/avatars/bob.jpg',
          documentId,
          documentTitle,
          description: 'Added a comment about the technical specifications',
          timestamp: new Date(Date.now() - 20 * 60 * 1000), // 20 minutes ago
          metadata: {
            content: 'We should consider adding more details about the API endpoints here.'
          }
        },
        {
          id: '5',
          type: 'create',
          userId: 'user1',
          userName: 'Alice Chen',
          userEmail: 'alice@example.com',
          userAvatar: '/avatars/alice.jpg',
          documentId,
          documentTitle,
          description: 'Created this document',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          metadata: {
            version: 1
          }
        },
        {
          id: '6',
          type: 'share',
          userId: 'user1',
          userName: 'Alice Chen',
          userEmail: 'alice@example.com',
          userAvatar: '/avatars/alice.jpg',
          documentId,
          documentTitle,
          description: 'Shared document with the development team',
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
          metadata: {
            collaborators: 5
          }
        }
      ];

      setActivities(mockActivities);
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'edit': return <Edit3 className="h-4 w-4" />;
      case 'save': return <Save className="h-4 w-4" />;
      case 'view': return <Eye className="h-4 w-4" />;
      case 'share': return <Share className="h-4 w-4" />;
      case 'comment': return <MessageSquare className="h-4 w-4" />;
      case 'join': return <UserPlus className="h-4 w-4" />;
      case 'leave': return <Users className="h-4 w-4" />;
      case 'create': return <FileText className="h-4 w-4" />;
      case 'delete': return <FileText className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'edit': return 'text-blue-600 bg-blue-100';
      case 'save': return 'text-green-600 bg-green-100';
      case 'view': return 'text-gray-600 bg-gray-100';
      case 'share': return 'text-purple-600 bg-purple-100';
      case 'comment': return 'text-orange-600 bg-orange-100';
      case 'join': return 'text-green-600 bg-green-100';
      case 'leave': return 'text-red-600 bg-red-100';
      case 'create': return 'text-indigo-600 bg-indigo-100';
      case 'delete': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString();
  };

  const filteredActivities = activities.filter(activity => {
    const matchesFilter = filter === 'all' || activity.type === filter;
    const matchesSearch = activity.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         activity.userName.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const groupedActivities = filteredActivities.reduce((groups, activity) => {
    const date = activity.timestamp.toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(activity);
    return groups;
  }, {} as Record<string, ActivityItem[]>);

  if (!canView) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>You don't have permission to view activity history</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Activity Feed
        </CardTitle>
        
        {/* Filters */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search activities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="edit">Edits</SelectItem>
              <SelectItem value="save">Saves</SelectItem>
              <SelectItem value="comment">Comments</SelectItem>
              <SelectItem value="join">Joins</SelectItem>
              <SelectItem value="share">Shares</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <ScrollArea className="h-[600px]">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No activity found</p>
              {searchQuery && (
                <p className="text-sm mt-2">Try adjusting your search or filters</p>
              )}
            </div>
          ) : (
            <div className="space-y-4 p-4">
              {Object.entries(groupedActivities).map(([date, dayActivities]) => (
                <div key={date}>
                  <div className="sticky top-0 bg-background z-10 py-2">
                    <h4 className="text-sm font-medium text-muted-foreground">
                      {new Date(date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </h4>
                  </div>
                  
                  <div className="space-y-3">
                    {dayActivities.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer transition-colors"
                        onClick={() => onActivitySelect?.(activity)}
                      >
                        <div className="flex-shrink-0">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={activity.userAvatar} alt={activity.userName} />
                            <AvatarFallback>
                              {activity.userName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm">
                                  {activity.userName}
                                </span>
                                <Badge 
                                  variant="secondary" 
                                  className={`text-xs ${getActivityColor(activity.type)}`}
                                >
                                  {getActivityIcon(activity.type)}
                                  <span className="ml-1 capitalize">{activity.type}</span>
                                </Badge>
                              </div>
                              
                              <p className="text-sm text-muted-foreground mb-2">
                                {activity.description}
                              </p>
                              
                              {activity.metadata && (
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  {activity.metadata.changes && (
                                    <span>{activity.metadata.changes} changes</span>
                                  )}
                                  {activity.metadata.duration && (
                                    <span>{Math.floor(activity.metadata.duration / 60)}m editing</span>
                                  )}
                                  {activity.metadata.version && (
                                    <span>v{activity.metadata.version}</span>
                                  )}
                                  {activity.metadata.collaborators && (
                                    <span>{activity.metadata.collaborators} collaborators</span>
                                  )}
                                </div>
                              )}
                            </div>
                            
                            <div className="flex flex-col items-end gap-1">
                              <span className="text-xs text-muted-foreground">
                                {formatTimestamp(activity.timestamp)}
                              </span>
                              <Clock className="h-3 w-3 text-muted-foreground" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}