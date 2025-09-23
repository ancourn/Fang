"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Users, 
  Save, 
  Share, 
  Download, 
  History, 
  Settings,
  UserPlus,
  Eye,
  Edit3,
  MessageSquare
} from "lucide-react";
import { DocumentPresenceIndicator } from "./DocumentPresenceIndicator";
import { useSocket } from "@/hooks/useSocket";
import { useAuth } from "@/contexts/AuthContext";
import { OTClient, TextChange, TextOperation } from "@/lib/ot";

interface CollaborativeUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  color: string;
  cursor: { line: number; ch: number } | null;
  isEditing: boolean;
  lastSeen: Date;
}

interface DocumentChange {
  type: "insert" | "delete" | "replace";
  position: number;
  content: string;
  userId: string;
  timestamp: Date;
}

interface CollaborativeEditorProps {
  documentId: string;
  initialContent: string;
  onContentChange: (content: string) => void;
  onSave?: () => void;
}

export function CollaborativeEditor({ 
  documentId, 
  initialContent, 
  onContentChange, 
  onSave 
}: CollaborativeEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [collaborators, setCollaborators] = useState<CollaborativeUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showUsers, setShowUsers] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { user } = useAuth();
  const socket = useSocket();
  const otClient = useRef<OTClient | null>(null);
  const changeTimeout = useRef<NodeJS.Timeout | null>(null);

  // Generate a unique color for each user
  const getUserColor = useCallback((userId: string) => {
    const colors = [
      "#3b82f6", "#ef4444", "#10b981", "#f59e0b", 
      "#8b5cf6", "#06b6d4", "#f97316", "#84cc16"
    ];
    const hash = userId.split("").reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return colors[Math.abs(hash) % colors.length];
  }, []);

  // Initialize socket connection
  useEffect(() => {
    if (!socket || !user) return;

    // Initialize OT client
    otClient.current = new OTClient(user.id);

    // Join document room
    socket.emit("join-document", { documentId, userId: user.id });

    // Listen for connection events
    socket.on("document-joined", (data: { users: CollaborativeUser[] }) => {
      setIsConnected(true);
      setCollaborators(data.users.map(u => ({
        ...u,
        color: getUserColor(u.id)
      })));
    });

    // Listen for user join/leave events
    socket.on("user-joined", (userData: CollaborativeUser) => {
      setCollaborators(prev => [...prev, {
        ...userData,
        color: getUserColor(userData.id)
      }]);
    });

    socket.on("user-left", (userId: string) => {
      setCollaborators(prev => prev.filter(u => u.id !== userId));
    });

    // Listen for OT-based content changes
    socket.on("content-changed", (change: TextChange) => {
      if (change.clientId !== user?.id && otClient.current) {
        // Apply transformed change using OT
        const transformedOps = otClient.current.remoteChange(change);
        const newContent = otClient.current.getBuffer();
        setContent(newContent);
        onContentChange(newContent);
      }
    });

    // Listen for cursor updates
    socket.on("cursor-updated", (data: { userId: string; cursor: { line: number; ch: number } }) => {
      setCollaborators(prev => prev.map(u => 
        u.id === data.userId ? { ...u, cursor: data.cursor } : u
      ));
    });

    // Listen for user activity updates
    socket.on("user-activity", (data: { userId: string; user: any; activity: string; timestamp: string }) => {
      setCollaborators(prev => prev.map(u => 
        u.id === data.userId ? { 
          ...u, 
          isEditing: data.activity === 'editing',
          lastSeen: new Date(data.timestamp)
        } : u
      ));
    });

    // Listen for save events
    socket.on("document-saved", (data: { timestamp: Date }) => {
      setLastSaved(new Date(data.timestamp));
      setIsSaving(false);
    });

    return () => {
      socket.emit("leave-document", { documentId, userId: user.id });
      socket.off("document-joined");
      socket.off("user-joined");
      socket.off("user-left");
      socket.off("content-changed");
      socket.off("cursor-updated");
      socket.off("user-activity");
      socket.off("document-saved");
    };
  }, [socket, user, documentId, getUserColor, onContentChange]);

  // Handle content changes with OT
  const handleContentChange = (newContent: string) => {
    if (!otClient.current || !socket || !user) return;

    // Generate OT change
    const change = otClient.current.localChange(content, newContent);
    
    if (change) {
      // Clear any pending timeout
      if (changeTimeout.current) {
        clearTimeout(changeTimeout.current);
      }

      // Debounce sending changes to avoid flooding
      changeTimeout.current = setTimeout(() => {
        socket.emit("content-change", { documentId, change });
        changeTimeout.current = null;
      }, 100); // 100ms debounce
    }

    setContent(newContent);
    onContentChange(newContent);
    
    // Update editing status
    setIsEditing(true);
    setTimeout(() => setIsEditing(false), 1000);
  };

  // Handle cursor position updates
  const handleSelectionChange = () => {
    if (!textareaRef.current || !socket || !user) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const lines = textarea.value.substring(0, start).split('\n');
    const cursor = {
      line: lines.length - 1,
      ch: lines[lines.length - 1].length
    };

    socket.emit("cursor-update", { documentId, cursor });
  };

  // Save document
  const handleSave = async () => {
    if (!socket || !user) return;

    setIsSaving(true);
    
    try {
      socket.emit("save-document", { 
        documentId, 
        content, 
        userId: user.id 
      });

      if (onSave) {
        onSave();
      }
    } catch (error) {
      console.error("Failed to save document:", error);
      setIsSaving(false);
    }
  };

  // Format last saved time
  const formatLastSaved = (date: Date | null) => {
    if (!date) return "Not saved";
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return `${Math.floor(minutes / 1440)}d ago`;
  };

  const activeCollaborators = collaborators.filter(u => u.isEditing || u.cursor !== null);
  const viewerCount = collaborators.length - activeCollaborators.length;

  return (
    <div className="flex h-full">
      {/* Collaborators Sidebar */}
      <div className="w-64 border-r bg-card">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Users className="h-4 w-4" />
              Collaborators
            </h3>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowUsers(!showUsers)}
            >
              <UserPlus className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
            <span>{isConnected ? "Connected" : "Disconnected"}</span>
          </div>
          
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Edit3 className="h-3 w-3" />
              {activeCollaborators.length} editing
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {viewerCount} viewing
            </span>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-3">
            {collaborators.map((collaborator) => (
              <div key={collaborator.id} className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={collaborator.avatar} alt={collaborator.name} />
                    <AvatarFallback 
                      className="text-xs"
                      style={{ backgroundColor: collaborator.color + "20", color: collaborator.color }}
                    >
                      {collaborator.name?.charAt(0) || collaborator.email.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div 
                    className="absolute bottom-0 right-0 w-2 h-2 rounded-full border border-background"
                    style={{ backgroundColor: collaborator.isEditing ? collaborator.color : "#9ca3af" }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {collaborator.name || collaborator.email}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {collaborator.isEditing ? "Editing..." : collaborator.cursor ? "Viewing" : "Idle"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="p-4 border-t">
          <div className="space-y-2">
            <Button variant="outline" size="sm" className="w-full justify-start">
              <Share className="h-4 w-4 mr-2" />
              Share Document
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start">
              <History className="h-4 w-4 mr-2" />
              Version History
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col">
        {/* Editor Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">Document Editor</h2>
                <Badge variant="outline">Collaborative</Badge>
              </div>
              
              <DocumentPresenceIndicator
                documentId={documentId}
                collaborators={collaborators}
                isCollaborativeMode={true}
              />
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Auto-saved {formatLastSaved(lastSaved)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Saving..." : "Save"}
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Editor Content */}
        <div className="flex-1 p-6">
          <Card className="h-full">
            <CardContent className="p-0 h-full">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
                onSelect={handleSelectionChange}
                onClick={handleSelectionChange}
                onKeyUp={handleSelectionChange}
                className="w-full h-full p-6 resize-none border-0 focus:outline-none font-mono text-sm"
                placeholder="Start typing your document..."
                style={{ minHeight: "500px" }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Status Bar */}
        <div className="p-2 border-t bg-muted/50">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>{content.length} characters</span>
              <span>{content.split('\n').length} lines</span>
            </div>
            <div className="flex items-center gap-2">
              {activeCollaborators.slice(0, 3).map(collaborator => (
                <Avatar key={collaborator.id} className="h-4 w-4">
                  <AvatarFallback 
                    className="text-xs"
                    style={{ backgroundColor: collaborator.color + "20", color: collaborator.color }}
                  >
                    {collaborator.name?.charAt(0) || collaborator.email.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              ))}
              {activeCollaborators.length > 3 && (
                <span className="text-xs">+{activeCollaborators.length - 3} active</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}