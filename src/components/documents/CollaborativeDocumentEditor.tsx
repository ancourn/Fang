"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CollaborativeEditor } from "./CollaborativeEditor";
import { DocumentVersionHistory } from "./DocumentVersionHistory";
import { DocumentCollaborators } from "./DocumentCollaborators";
import { DocumentActivityFeed } from "./DocumentActivityFeed";
import { DocumentComments } from "./DocumentComments";
import { DocumentShareDialog } from "./DocumentShareDialog";
import { 
  Save, 
  FileText, 
  FileSpreadsheet, 
  Presentation, 
  Loader2, 
  Users, 
  Clock,
  History,
  MessageSquare,
  UserPlus,
  Activity,
  MoreVertical,
  Share,
  Download,
  Printer,
  Users as UsersIcon
} from "lucide-react";

interface Document {
  id: string;
  title: string;
  content: string;
  type: "doc" | "sheet" | "slide";
  workspaceId: string;
  channelId?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name?: string;
    email: string;
    avatar?: string;
  };
  channel?: {
    id: string;
    name: string;
    displayName?: string;
  };
}

interface CollaborativeDocumentEditorProps {
  document?: Document;
  workspaceId: string;
  channelId?: string;
  onSave?: (document: Document) => void;
  onCancel?: () => void;
}

export function CollaborativeDocumentEditor({ 
  document, 
  workspaceId, 
  channelId, 
  onSave, 
  onCancel 
}: CollaborativeDocumentEditorProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState(document?.title || "");
  const [content, setContent] = useState(document?.content || "");
  const [type, setType] = useState<"doc" | "sheet" | "slide">(document?.type || "doc");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [activeTab, setActiveTab] = useState("editor");
  const [collaborativeMode, setCollaborativeMode] = useState(true);

  const isEditing = !!document;

  useEffect(() => {
    if (document) {
      setTitle(document.title);
      setContent(document.content);
      setType(document.type);
    }
  }, [document]);

  const handleSave = useCallback(async () => {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const url = isEditing ? `/api/documents/${document.id}` : "/api/documents";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          content,
          type,
          workspaceId,
          channelId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setLastSaved(new Date());
        onSave?.(data.document);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to save document");
      }
    } catch (error) {
      console.error("Save document error:", error);
      setError("Failed to save document");
    } finally {
      setSaving(false);
    }
  }, [title, content, type, workspaceId, channelId, isEditing, document, onSave]);

  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
  }, []);

  const getDocumentIcon = (docType: string) => {
    switch (docType) {
      case "sheet":
        return <FileSpreadsheet className="h-5 w-5" />;
      case "slide":
        return <Presentation className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const handleVersionSelect = useCallback((version: any) => {
    setContent(version.content);
    setTitle(version.title);
    setActiveTab("editor");
  }, []);

  const handleVersionRestore = useCallback(async (versionNumber: number) => {
    if (onSave) {
      handleSave();
    }
  }, [handleSave, onSave]);

  const formatLastSaved = (date: Date | null) => {
    if (!date) return "";
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="flex h-full">
      {/* Main Content */}
      <div className={`flex flex-col flex-1 ${showSidebar ? "pr-80" : ""}`}>
        {/* Header */}
        <div className="border-b p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getDocumentIcon(type)}
              <div className="flex-1">
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Document title..."
                  className="text-lg font-semibold border-none p-0 h-auto focus-visible:ring-0 shadow-none"
                />
              </div>
              <Select value={type} onValueChange={(value: "doc" | "sheet" | "slide") => setType(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="doc">Document</SelectItem>
                  <SelectItem value="sheet">Spreadsheet</SelectItem>
                  <SelectItem value="slide">Presentation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              {document && (
                <Button
                  variant={collaborativeMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCollaborativeMode(!collaborativeMode)}
                >
                  <UsersIcon className="h-4 w-4 mr-2" />
                  {collaborativeMode ? "Collaborative" : "Classic"}
                </Button>
              )}
              
              {lastSaved && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{formatLastSaved(lastSaved)}</span>
                </div>
              )}
              <Button
                onClick={handleSave}
                disabled={saving}
                size="sm"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {saving ? "Saving..." : "Save"}
              </Button>
              {onCancel && (
                <Button variant="outline" onClick={onCancel} size="sm">
                  Cancel
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSidebar(!showSidebar)}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Document Info */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={document?.user.avatar} alt={document?.user.name} />
                  <AvatarFallback className="text-xs">
                    {document?.user.name?.charAt(0) || document?.user.email.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span>
                  {document?.user.name || document?.user.email}
                  {document && document.userId !== user?.id && " (Owner)"}
                </span>
              </div>
              {document?.channel && (
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>#{document.channel.displayName || document.channel.name}</span>
                </div>
              )}
              {document && collaborativeMode && (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  <UsersIcon className="h-3 w-3 mr-1" />
                  Real-time
                </Badge>
              )}
            </div>
            <div>
              {document && (
                <span>Created {new Date(document.createdAt).toLocaleDateString()}</span>
              )}
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Editor Tabs */}
        <div className="flex-1 flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="editor" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Editor
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                Versions
              </TabsTrigger>
              <TabsTrigger value="collaborators" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Collaborate
              </TabsTrigger>
              <TabsTrigger value="comments" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Comments
              </TabsTrigger>
              <TabsTrigger value="activity" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Activity
              </TabsTrigger>
            </TabsList>

            <TabsContent value="editor" className="flex-1 p-0 m-0">
              {document && collaborativeMode ? (
                <CollaborativeEditor
                  documentId={document.id}
                  initialContent={content}
                  onContentChange={handleContentChange}
                  onSave={handleSave}
                />
              ) : (
                <div className="flex-1 p-4">
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Start writing your document..."
                    className="w-full h-full p-4 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ minHeight: "500px" }}
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="history" className="flex-1 p-0 m-0">
              <div className="flex-1 p-4">
                <DocumentVersionHistory
                  documentId={document?.id || ""}
                  currentVersion={1}
                  onVersionView={(version) => {
                    setContent(version.content);
                    setTitle(version.title);
                    setActiveTab("editor");
                  }}
                  onVersionRestore={handleVersionRestore}
                />
              </div>
            </TabsContent>

            <TabsContent value="collaborators" className="flex-1 p-0 m-0">
              <div className="flex-1 p-4">
                <DocumentCollaborators
                  documentId={document?.id || ""}
                  canManage={document?.userId === user?.id}
                  onCollaboratorUpdate={() => {
                    // Refresh collaborator list
                  }}
                />
              </div>
            </TabsContent>

            <TabsContent value="comments" className="flex-1 p-0 m-0">
              <div className="flex-1 p-4">
                <DocumentComments
                  documentId={document?.id || ""}
                  canComment={true}
                  onCommentAdded={() => {
                    // Refresh comments
                  }}
                />
              </div>
            </TabsContent>

            <TabsContent value="activity" className="flex-1 p-0 m-0">
              <div className="flex-1 p-4">
                <DocumentActivityFeed
                  documentId={document?.id || ""}
                  documentTitle={title}
                  canView={true}
                  onActivitySelect={(activity) => {
                    console.log('Activity selected:', activity);
                  }}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="border-t p-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <Badge variant="outline">
                {type === "doc" ? "Document" : type === "sheet" ? "Spreadsheet" : "Presentation"}
              </Badge>
              <span>{content.length} characters</span>
              <span>{content.split(/\s+/).filter(Boolean).length} words</span>
            </div>
            <div>
              {collaborativeMode && document ? "Real-time editing enabled" : "Auto-save disabled"}
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      {showSidebar && (
        <div className="w-80 border-l flex flex-col">
          <div className="p-4 border-b">
            <h3 className="font-medium">Document Info</h3>
          </div>
          <div className="flex-1 p-4 space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Quick Actions</h4>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Share className="h-4 w-4 mr-2" />
                  Share
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-2">Document Stats</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div>Created: {document ? new Date(document.createdAt).toLocaleDateString() : "New"}</div>
                <div>Last modified: {document ? new Date(document.updatedAt).toLocaleDateString() : "Never"}</div>
                <div>Type: {type === "doc" ? "Document" : type === "sheet" ? "Spreadsheet" : "Presentation"}</div>
                {document && collaborativeMode && (
                  <div>Mode: Real-time Collaborative</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}