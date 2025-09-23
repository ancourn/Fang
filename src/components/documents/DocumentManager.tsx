"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CollaborativeDocumentEditor } from "./CollaborativeDocumentEditor";
import { DocumentSearch } from "./DocumentSearch";
import { DocumentTemplates } from "./DocumentTemplates";
import { DocumentAnalytics } from "./DocumentAnalytics";
import { 
  Plus, 
  FileText, 
  FileSpreadsheet, 
  Presentation, 
  Search, 
  MoreVertical,
  Trash2,
  Edit,
  Loader2,
  Clock,
  Users,
  LayoutTemplate,
  BarChart3
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
  _count: {
    files: number;
  };
}

interface DocumentManagerProps {
  workspaceId: string;
  channelId?: string;
  onDocumentSelect?: (document: Document) => void;
  selectedDocumentId?: string;
}

export function DocumentManager({ workspaceId, channelId, onDocumentSelect, selectedDocumentId }: DocumentManagerProps) {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [deletingDocument, setDeletingDocument] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, [workspaceId, channelId]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ workspaceId });
      if (channelId) {
        params.append("channelId", channelId);
      }
      
      const response = await fetch(`/api/documents?${params}`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents);
      } else {
        setError("Failed to fetch documents");
      }
    } catch (error) {
      console.error("Fetch documents error:", error);
      setError("Failed to fetch documents");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDocument = () => {
    setIsCreateDialogOpen(true);
  };

  const handleEditDocument = (document: Document) => {
    setEditingDocument(document);
  };

  const handleDeleteDocument = async (documentId: string) => {
    try {
      setDeletingDocument(documentId);
      const response = await fetch(`/api/documents/${documentId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to delete document");
      }
    } catch (error) {
      console.error("Delete document error:", error);
      setError("Failed to delete document");
    } finally {
      setDeletingDocument(null);
    }
  };

  const handleDocumentSave = (savedDocument: Document) => {
    setDocuments(prev => {
      const existingIndex = prev.findIndex(doc => doc.id === savedDocument.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = savedDocument;
        return updated;
      }
      return [savedDocument, ...prev];
    });
    setEditingDocument(null);
    setIsCreateDialogOpen(false);
  };

const handleTemplateSelect = (template: any) => {
    // Create a new document from the template
    setIsCreateDialogOpen(true);
    // The template content will be used in the CollaborativeDocumentEditor
  };

  const handleCreateDocumentFromTemplate = (template: any) => {
    // Create document directly from template
    const newDocument = {
      title: `${template.title} (Copy)`,
      content: template.content,
      type: template.type,
      workspaceId,
      channelId,
    };
    
    // This will be handled by the CollaborativeDocumentEditor
    setIsCreateDialogOpen(true);
  };

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case "sheet":
        return <FileSpreadsheet className="h-5 w-5" />;
      case "slide":
        return <Presentation className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
<div className="flex items-center gap-2">
          <Button
            variant={showTemplates ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setShowTemplates(!showTemplates);
              setShowAnalytics(false);
            }}
          >
            <LayoutTemplate className="h-4 w-4 mr-2" />
            Templates
          </Button>
          <Button
            variant={showAnalytics ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setShowAnalytics(!showAnalytics);
              setShowTemplates(false);
            }}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </Button>
          <div className="flex items-center gap-2 flex-1">
            <DocumentSearch
              workspaceId={workspaceId}
              onResultSelect={(result) => {
                // Handle search result selection
                console.log('Selected document:', result);
              }}
              className="flex-1"
            />
          </div>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCreateDocument}>
              <Plus className="h-4 w-4 mr-2" />
              New Document
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Create New Document</DialogTitle>
              <DialogDescription>
                Create a new document to collaborate with your team.
              </DialogDescription>
            </DialogHeader>
            <CollaborativeDocumentEditor
              workspaceId={workspaceId}
              channelId={channelId}
              onSave={handleDocumentSave}
              onCancel={() => setIsCreateDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

    {/* Templates Section */}
      {showTemplates && (
        <div className="border rounded-lg p-4">
          <DocumentTemplates
            workspaceId={workspaceId}
            onTemplateSelect={handleTemplateSelect}
            onCreateDocument={handleCreateDocumentFromTemplate}
          />
        </div>
      )}

      {/* Analytics Section */}
      {showAnalytics && (
        <div className="border rounded-lg p-4">
          <DocumentAnalytics workspaceId={workspaceId} />
        </div>
      )}

      {/* Documents List */}
      <ScrollArea className="max-h-96">
        <div className="space-y-2">
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? "No documents found matching your search." : "No documents yet. Create your first document!"}
            </div>
          ) : (
            filteredDocuments.map((document) => (
              <div
                key={document.id}
                className={`p-4 rounded-lg border cursor-pointer transition-colors hover:bg-accent/50 ${
                  selectedDocumentId === document.id ? "bg-accent border-accent" : ""
                }`}
                onClick={() => onDocumentSelect?.(document)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="flex items-center gap-2 mt-1">
                      {getDocumentIcon(document.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium truncate">{document.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          {document.type === "doc" ? "Doc" : document.type === "sheet" ? "Sheet" : "Slide"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {document.content || "No content yet..."}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>Updated {formatDate(document.updatedAt)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Avatar className="h-4 w-4">
                            <AvatarImage src={document.user.avatar} alt={document.user.name} />
                            <AvatarFallback className="text-[10px]">
                              {document.user.name?.charAt(0) || document.user.email.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span>{document.user.name || document.user.email}</span>
                        </div>
                        {document.channel && (
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span>#{document.channel.displayName || document.channel.name}</span>
                          </div>
                        )}
                        {document._count.files > 0 && (
                          <span>{document._count.files} file{document._count.files > 1 ? "s" : ""}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditDocument(document);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteDocument(document.id);
                      }}
                      disabled={deletingDocument === document.id}
                    >
                      {deletingDocument === document.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Edit Document Dialog */}
      {editingDocument && (
        <Dialog open={!!editingDocument} onOpenChange={() => setEditingDocument(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Edit Document</DialogTitle>
              <DialogDescription>
                Make changes to your document and save when you're done.
              </DialogDescription>
            </DialogHeader>
            <CollaborativeDocumentEditor
              document={editingDocument}
              workspaceId={workspaceId}
              channelId={channelId}
              onSave={handleDocumentSave}
              onCancel={() => setEditingDocument(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}