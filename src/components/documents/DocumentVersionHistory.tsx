"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  History, 
  Eye, 
  RotateCcw, 
  Clock, 
  User,
  FileText,
  ArrowLeft,
  ArrowRight,
  Calendar
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface DocumentVersion {
  id: string;
  version: number;
  title: string;
  content: string;
  changelog?: string;
  createdAt: string;
  user: {
    id: string;
    name?: string;
    email: string;
    avatar?: string;
  };
}

interface DocumentVersionHistoryProps {
  documentId: string;
  currentVersion?: number;
  onVersionRestore?: (version: DocumentVersion) => void;
  onVersionView?: (version: DocumentVersion) => void;
}

export function DocumentVersionHistory({ 
  documentId, 
  currentVersion,
  onVersionRestore,
  onVersionView 
}: DocumentVersionHistoryProps) {
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<DocumentVersion | null>(null);
  const [showCreateVersion, setShowCreateVersion] = useState(false);
  const [newVersionTitle, setNewVersionTitle] = useState("");
  const [newVersionContent, setNewVersionContent] = useState("");
  const [newVersionChangelog, setNewVersionChangelog] = useState("");

  useEffect(() => {
    fetchVersions();
  }, [documentId]);

  const fetchVersions = async () => {
    try {
      const response = await fetch(`/api/documents/${documentId}/versions`);
      if (response.ok) {
        const data = await response.json();
        setVersions(data.versions);
      }
    } catch (error) {
      console.error("Error fetching document versions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVersion = async () => {
    if (!newVersionTitle.trim() || !newVersionContent.trim()) {
      return;
    }

    try {
      const response = await fetch(`/api/documents/${documentId}/versions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: newVersionTitle,
          content: newVersionContent,
          changelog: newVersionChangelog
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setVersions([data.version, ...versions]);
        setShowCreateVersion(false);
        setNewVersionTitle("");
        setNewVersionContent("");
        setNewVersionChangelog("");
      }
    } catch (error) {
      console.error("Error creating document version:", error);
    }
  };

  const handleRestoreVersion = async (version: DocumentVersion) => {
    if (!confirm(`Are you sure you want to restore to version ${version.version}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/documents/${documentId}/versions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: version.title,
          content: version.content,
          changelog: `Restored from version ${version.version}`
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setVersions([data.version, ...versions]);
        onVersionRestore?.(data.version);
      }
    } catch (error) {
      console.error("Error restoring document version:", error);
    }
  };

  const formatActionDescription = (action: string) => {
    switch (action) {
      case "created":
        return "Created document";
      case "updated":
        return "Updated document";
      case "version_created":
        return "Created new version";
      case "collaborator_added":
        return "Added collaborator";
      case "collaborator_updated":
        return "Updated collaborator";
      case "comment_added":
        return "Added comment";
      case "comment_replied":
        return "Replied to comment";
      default:
        return action;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Clock className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading version history...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Version History</h3>
          <Badge variant="secondary">{versions.length} versions</Badge>
        </div>
        <Dialog open={showCreateVersion} onOpenChange={setShowCreateVersion}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              Save Version
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Version</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Version Title</label>
                <Input
                  value={newVersionTitle}
                  onChange={(e) => setNewVersionTitle(e.target.value)}
                  placeholder="Enter version title..."
                />
              </div>
              <div>
                <label className="text-sm font-medium">Content</label>
                <Textarea
                  value={newVersionContent}
                  onChange={(e) => setNewVersionContent(e.target.value)}
                  placeholder="Enter document content..."
                  rows={10}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Changelog (Optional)</label>
                <Textarea
                  value={newVersionChangelog}
                  onChange={(e) => setNewVersionChangelog(e.target.value)}
                  placeholder="Describe what changed in this version..."
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateVersion(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateVersion}>
                  Create Version
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <ScrollArea className="h-96">
        <div className="space-y-3">
          {versions.map((version, index) => (
            <Card 
              key={version.id} 
              className={`transition-colors ${
                version.version === currentVersion ? "ring-2 ring-primary" : ""
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">v{version.version}</Badge>
                      {version.version === currentVersion && (
                        <Badge variant="default">Current</Badge>
                      )}
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(version.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={version.user.avatar} alt={version.user.name} />
                        <AvatarFallback className="text-xs">
                          {version.user.name?.charAt(0) || version.user.email.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">
                        {version.user.name || version.user.email}
                      </span>
                    </div>

                    <h4 className="font-medium mb-1">{version.title}</h4>
                    
                    {version.changelog && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {version.changelog}
                      </p>
                    )}

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {new Date(version.createdAt).toLocaleDateString()} at{" "}
                        {new Date(version.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onVersionView?.(version)}
                      title="View version"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {version.version !== currentVersion && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRestoreVersion(version)}
                        title="Restore this version"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {versions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No versions found</p>
              <p className="text-sm">Create your first version to start tracking changes</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}