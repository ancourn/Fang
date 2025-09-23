"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Activity, 
  Clock, 
  User, 
  FileText, 
  MessageSquare,
  Share,
  Eye,
  Edit,
  Trash2,
  Users,
  Plus
} from "lucide-react";

interface DocumentActivityItem {
  id: string;
  action: string;
  details?: string;
  createdAt: string;
  user: {
    id: string;
    name?: string;
    email: string;
    avatar?: string;
  };
}

interface DocumentActivityProps {
  documentId: string;
}

export function DocumentActivity({ documentId }: DocumentActivityProps) {
  const [activities, setActivities] = useState<DocumentActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  useEffect(() => {
    fetchActivities();
  }, [documentId, offset]);

  const fetchActivities = async () => {
    try {
      const response = await fetch(`/api/documents/${documentId}/activities?limit=${limit}&offset=${offset}`);
      if (response.ok) {
        const data = await response.json();
        if (offset === 0) {
          setActivities(data.activities);
        } else {
          setActivities(prev => [...prev, ...data.activities]);
        }
        setHasMore(data.pagination.hasMore);
      }
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    setOffset(prev => prev + limit);
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "created":
        return <Plus className="h-4 w-4" />;
      case "updated":
        return <Edit className="h-4 w-4" />;
      case "deleted":
        return <Trash2 className="h-4 w-4" />;
      case "viewed":
        return <Eye className="h-4 w-4" />;
      case "commented":
        return <MessageSquare className="h-4 w-4" />;
      case "shared":
        return <Share className="h-4 w-4" />;
      case "version_created":
        return <FileText className="h-4 w-4" />;
      case "version_restored":
        return <FileText className="h-4 w-4" />;
      case "collaborator_added":
        return <Users className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "created":
        return "bg-green-100 text-green-800";
      case "updated":
        return "bg-blue-100 text-blue-800";
      case "deleted":
        return "bg-red-100 text-red-800";
      case "version_created":
      case "version_restored":
        return "bg-purple-100 text-purple-800";
      case "commented":
        return "bg-orange-100 text-orange-800";
      case "shared":
        return "bg-indigo-100 text-indigo-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatActionText = (action: string, details?: string) => {
    let actionText = action.replace(/_/g, " ");
    actionText = actionText.charAt(0).toUpperCase() + actionText.slice(1);
    
    if (details) {
      try {
        const detailsObj = JSON.parse(details);
        if (detailsObj.version) {
          actionText += ` (version ${detailsObj.version})`;
        }
        if (detailsObj.fromVersion && detailsObj.toVersion) {
          actionText += ` (from v${detailsObj.fromVersion} to v${detailsObj.toVersion})`;
        }
      } catch (e) {
        // If details is not JSON, ignore
      }
    }
    
    return actionText;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const groupActivitiesByDate = (activities: DocumentActivityItem[]) => {
    const groups: { [key: string]: DocumentActivityItem[] } = {};
    
    activities.forEach(activity => {
      const date = new Date(activity.createdAt).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(activity);
    });
    
    return groups;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const groupedActivities = groupActivitiesByDate(activities);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Activity className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Activity History</h3>
        <Badge variant="secondary">{activities.length} activities</Badge>
      </div>

      {/* Activity List */}
      <ScrollArea className="h-96 border rounded-lg">
        <div className="p-4 space-y-6">
          {Object.entries(groupedActivities).map(([date, dayActivities]) => (
            <div key={date} className="space-y-3">
              {/* Date Header */}
              <div className="sticky top-0 bg-background py-2 border-b">
                <div className="flex items-center gap-2">
                  <Separator className="flex-1" />
                  <span className="text-sm font-medium text-muted-foreground">
                    {new Date(date).toLocaleDateString(undefined, { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </span>
                  <Separator className="flex-1" />
                </div>
              </div>

              {/* Activities for this date */}
              <div className="space-y-2">
                {dayActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                      {getActionIcon(activity.action)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${getActionColor(activity.action)}`}
                        >
                          {formatActionText(activity.action, activity.details)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(activity.createdAt)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={activity.user.avatar} alt={activity.user.name} />
                          <AvatarFallback className="text-xs">
                            {activity.user.name?.charAt(0) || activity.user.email.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-muted-foreground">
                          {activity.user.name || activity.user.email}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          {activities.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No activity found</p>
              <p className="text-sm">Activity will appear here as you work on this document</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Load More */}
      {hasMore && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={loadMore}>
            Load More Activities
          </Button>
        </div>
      )}
    </div>
  );
}