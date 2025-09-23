"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Users, 
  Eye, 
  Edit3, 
  Clock, 
  MoreVertical,
  UserPlus,
  Settings
} from "lucide-react";

interface CollaborativeUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  color: string;
  cursor: { line: number; ch: number } | null;
  isEditing: boolean;
  lastSeen: Date;
  status: 'active' | 'idle' | 'viewing';
}

interface DocumentPresenceIndicatorProps {
  documentId: string;
  collaborators: CollaborativeUser[];
  isCollaborativeMode: boolean;
  onShowUsers?: () => void;
}

export function DocumentPresenceIndicator({ 
  documentId, 
  collaborators, 
  isCollaborativeMode,
  onShowUsers 
}: DocumentPresenceIndicatorProps) {
  const [expanded, setExpanded] = useState(false);
  const [activeUsers, setActiveUsers] = useState<CollaborativeUser[]>([]);
  const [viewerCount, setViewerCount] = useState(0);

  useEffect(() => {
    // Categorize users by activity
    const now = new Date();
    const active = collaborators.filter(user => {
      const timeDiff = now.getTime() - new Date(user.lastSeen).getTime();
      return timeDiff < 30000; // Active in last 30 seconds
    });
    
    const editing = active.filter(user => user.isEditing);
    const viewing = active.filter(user => !user.isEditing);
    const idle = collaborators.filter(user => {
      const timeDiff = now.getTime() - new Date(user.lastSeen).getTime();
      return timeDiff >= 30000 && timeDiff < 300000; // Idle for 30s to 5min
    });

    setActiveUsers(editing);
    setViewerCount(viewing.length);
  }, [collaborators]);

  const formatLastSeen = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const getUserStatus = (user: CollaborativeUser) => {
    const now = new Date();
    const timeDiff = now.getTime() - new Date(user.lastSeen).getTime();
    
    if (timeDiff < 30000) {
      return user.isEditing ? 'editing' : 'viewing';
    } else if (timeDiff < 300000) {
      return 'idle';
    } else {
      return 'offline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'editing': return 'bg-green-500';
      case 'viewing': return 'bg-blue-500';
      case 'idle': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'editing': return <Edit3 className="h-3 w-3" />;
      case 'viewing': return <Eye className="h-3 w-3" />;
      case 'idle': return <Clock className="h-3 w-3" />;
      default: return null;
    }
  };

  if (!isCollaborativeMode) {
    return null;
  }

  return (
    <div className="relative">
      {/* Compact Presence Bar */}
      <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg border">
        <div className="flex items-center gap-1">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {collaborators.length} {collaborators.length === 1 ? 'person' : 'people'}
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          <div className="flex -space-x-2">
            {activeUsers.slice(0, 3).map(user => (
              <div key={user.id} className="relative">
                <Avatar className="h-6 w-6 border-2 border-background">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback 
                    className="text-xs"
                    style={{ backgroundColor: user.color + "20", color: user.color }}
                  >
                    {user.name?.charAt(0) || user.email.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className={`absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full border border-background ${getStatusColor('editing')}`} />
              </div>
            ))}
          </div>
          {activeUsers.length > 3 && (
            <span className="text-xs text-muted-foreground">+{activeUsers.length - 3}</span>
          )}
        </div>
        
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Edit3 className="h-3 w-3" />
          <span>{activeUsers.length}</span>
        </div>
        
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Eye className="h-3 w-3" />
          <span>{viewerCount}</span>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 ml-auto"
          onClick={() => setExpanded(!expanded)}
        >
          <MoreVertical className="h-3 w-3" />
        </Button>
      </div>

      {/* Expanded Presence Panel */}
      {expanded && (
        <Card className="absolute top-full right-0 w-80 mt-2 z-50 shadow-lg border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Document Collaborators
              </span>
              <Badge variant="outline" className="text-xs">
                {collaborators.length} total
              </Badge>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-0">
            <ScrollArea className="max-h-64">
              <div className="p-4 space-y-3">
                {/* Active Users Section */}
                {activeUsers.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      Active Now ({activeUsers.length})
                    </h4>
                    <div className="space-y-2">
                      {activeUsers.map(user => (
                        <div key={user.id} className="flex items-center gap-3 p-2 rounded-lg bg-accent/50">
                          <div className="relative">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.avatar} alt={user.name} />
                              <AvatarFallback 
                                className="text-xs"
                                style={{ backgroundColor: user.color + "20", color: user.color }}
                              >
                                {user.name?.charAt(0) || user.email.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border border-background ${getStatusColor(getUserStatus(user))}`} />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {user.name || user.email}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                {getStatusIcon(getUserStatus(user))}
                                {getUserStatus(user)}
                              </span>
                              {user.cursor && (
                                <span>Line {user.cursor.line + 1}</span>
                              )}
                            </div>
                          </div>
                          
                          <div className="text-xs text-muted-foreground">
                            {formatLastSeen(user.lastSeen)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Idle Users Section */}
                {collaborators.filter(u => getUserStatus(u) === 'idle').length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-yellow-500" />
                      Idle ({collaborators.filter(u => getUserStatus(u) === 'idle').length})
                    </h4>
                    <div className="space-y-2">
                      {collaborators
                        .filter(u => getUserStatus(u) === 'idle')
                        .map(user => (
                          <div key={user.id} className="flex items-center gap-3 p-2 rounded-lg">
                            <div className="relative">
                              <Avatar className="h-8 w-8 opacity-60">
                                <AvatarImage src={user.avatar} alt={user.name} />
                                <AvatarFallback 
                                  className="text-xs"
                                  style={{ backgroundColor: user.color + "20", color: user.color }}
                                >
                                  {user.name?.charAt(0) || user.email.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border border-background ${getStatusColor('idle')}`} />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate opacity-60">
                                {user.name || user.email}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  {getStatusIcon('idle')}
                                  idle
                                </span>
                              </div>
                            </div>
                            
                            <div className="text-xs text-muted-foreground">
                              {formatLastSeen(user.lastSeen)}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Offline Users Section */}
                {collaborators.filter(u => getUserStatus(u) === 'offline').length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-gray-500" />
                      Offline ({collaborators.filter(u => getUserStatus(u) === 'offline').length})
                    </h4>
                    <div className="space-y-2">
                      {collaborators
                        .filter(u => getUserStatus(u) === 'offline')
                        .map(user => (
                          <div key={user.id} className="flex items-center gap-3 p-2 rounded-lg opacity-40">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.avatar} alt={user.name} />
                              <AvatarFallback 
                                className="text-xs"
                                style={{ backgroundColor: user.color + "20", color: user.color }}
                              >
                                {user.name?.charAt(0) || user.email.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {user.name || user.email}
                              </p>
                              <div className="text-xs text-muted-foreground">
                                offline
                              </div>
                            </div>
                            
                            <div className="text-xs text-muted-foreground">
                              {formatLastSeen(user.lastSeen)}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            
            <Separator />
            
            <div className="p-3">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <UserPlus className="h-3 w-3 mr-1" />
                  Invite
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <Settings className="h-3 w-3 mr-1" />
                  Settings
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}