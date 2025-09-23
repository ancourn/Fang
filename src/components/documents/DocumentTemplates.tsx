"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  FileText, 
  FileSpreadsheet, 
  Presentation, 
  Plus, 
  Edit,
  Trash2,
  Copy,
  Star,
  Clock,
  User,
  Search,
  Filter,
  Loader2
} from "lucide-react";

interface DocumentTemplate {
  id: string;
  title: string;
  description: string;
  content: string;
  type: "doc" | "sheet" | "slide";
  category: string;
  isPublic: boolean;
  isFeatured: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name?: string;
    email: string;
    avatar?: string;
  };
  _count: {
    uses: number;
  };
}

interface DocumentTemplatesProps {
  workspaceId: string;
  onTemplateSelect?: (template: DocumentTemplate) => void;
  onCreateDocument?: (template: DocumentTemplate) => void;
}

export function DocumentTemplates({ workspaceId, onTemplateSelect, onCreateDocument }: DocumentTemplatesProps) {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<DocumentTemplate | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState<string | null>(null);

  const [newTemplate, setNewTemplate] = useState({
    title: "",
    description: "",
    content: "",
    type: "doc" as "doc" | "sheet" | "slide",
    category: "general",
    isPublic: false,
    isFeatured: false
  });

  const categories = [
    "all",
    "general",
    "business",
    "project",
    "meeting",
    "report",
    "proposal",
    "technical",
    "personal"
  ];

  useEffect(() => {
    fetchTemplates();
  }, [workspaceId]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/documents/templates?workspaceId=${workspaceId}`);
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates);
      } else {
        setError("Failed to fetch templates");
      }
    } catch (error) {
      console.error("Fetch templates error:", error);
      setError("Failed to fetch templates");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    if (!newTemplate.title.trim()) {
      setError("Title is required");
      return;
    }

    try {
      const response = await fetch("/api/documents/templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newTemplate,
          workspaceId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setTemplates(prev => [data.template, ...prev]);
        setNewTemplate({
          title: "",
          description: "",
          content: "",
          type: "doc",
          category: "general",
          isPublic: false,
          isFeatured: false
        });
        setShowCreateDialog(false);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to create template");
      }
    } catch (error) {
      console.error("Create template error:", error);
      setError("Failed to create template");
    }
  };

  const handleUpdateTemplate = async (templateId: string, updates: Partial<DocumentTemplate>) => {
    try {
      const response = await fetch(`/api/documents/templates/${templateId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const data = await response.json();
        setTemplates(prev => prev.map(t => t.id === templateId ? data.template : t));
        setEditingTemplate(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to update template");
      }
    } catch (error) {
      console.error("Update template error:", error);
      setError("Failed to update template");
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      setDeletingTemplate(templateId);
      const response = await fetch(`/api/documents/templates/${templateId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setTemplates(prev => prev.filter(t => t.id !== templateId));
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to delete template");
      }
    } catch (error) {
      console.error("Delete template error:", error);
      setError("Failed to delete template");
    } finally {
      setDeletingTemplate(null);
    }
  };

  const handleUseTemplate = (template: DocumentTemplate) => {
    onTemplateSelect?.(template);
  };

  const handleCreateDocumentFromTemplate = async (template: DocumentTemplate) => {
    try {
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: `${template.title} (Copy)`,
          content: template.content,
          type: template.type,
          workspaceId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        onCreateDocument?.(data.document);
        
        // Track template usage
        await fetch(`/api/documents/templates/${template.id}/use`, {
          method: "POST",
        });
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to create document from template");
      }
    } catch (error) {
      console.error("Create document from template error:", error);
      setError("Failed to create document from template");
    }
  };

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

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Document Templates</h2>
          <p className="text-muted-foreground">Create documents quickly from pre-built templates</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Create New Template</DialogTitle>
              <DialogDescription>
                Create a reusable template for your team.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={newTemplate.title}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Template title..."
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={newTemplate.description}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Template description..."
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Content</label>
                <Textarea
                  value={newTemplate.content}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Template content..."
                  rows={10}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <Select value={newTemplate.type} onValueChange={(value: "doc" | "sheet" | "slide") => 
                    setNewTemplate(prev => ({ ...prev, type: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="doc">Document</SelectItem>
                      <SelectItem value="sheet">Spreadsheet</SelectItem>
                      <SelectItem value="slide">Presentation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Select value={newTemplate.category} onValueChange={(value) => 
                    setNewTemplate(prev => ({ ...prev, category: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.filter(cat => cat !== "all").map(category => (
                        <SelectItem key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newTemplate.isPublic}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, isPublic: e.target.checked }))}
                  />
                  Make public
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newTemplate.isFeatured}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, isFeatured: e.target.checked }))}
                  />
                  Feature this template
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTemplate}>
                Create Template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates..."
              className="pl-10"
            />
          </div>
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-40">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map(category => (
              <SelectItem key={category} value={category}>
                {category === "all" ? "All Categories" : category.charAt(0).toUpperCase() + category.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Templates Grid */}
      <ScrollArea className="max-h-96">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.length === 0 ? (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              {searchQuery || selectedCategory !== "all" 
                ? "No templates found matching your filters."
                : "No templates yet. Create your first template!"
              }
            </div>
          ) : (
            filteredTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getDocumentIcon(template.type)}
                      <div className="flex-1">
                        <CardTitle className="text-lg">{template.title}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {template.type === "doc" ? "Doc" : template.type === "sheet" ? "Sheet" : "Slide"}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {template.category}
                          </Badge>
                          {template.isFeatured && (
                            <Badge variant="default" className="text-xs">
                              <Star className="h-3 w-3 mr-1" />
                              Featured
                            </Badge>
                          )}
                          {template.isPublic && (
                            <Badge variant="outline" className="text-xs">
                              Public
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {template.userId === user?.id && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingTemplate(template)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTemplate(template.id)}
                            disabled={deletingTemplate === template.id}
                          >
                            {deletingTemplate === template.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="mb-4 line-clamp-2">
                    {template.description}
                  </CardDescription>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>{template.user.name || template.user.email}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatDate(template.createdAt)}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{template._count.uses} uses</span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUseTemplate(template)}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Use
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleCreateDocumentFromTemplate(template)}
                        >
                          Create Document
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}