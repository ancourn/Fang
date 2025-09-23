"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  BookOpen, 
  Plus, 
  Search, 
  FileText, 
  Folder, 
  FolderOpen, 
  Tag, 
  Calendar, 
  User,
  Edit,
  Trash2,
  MoreHorizontal,
  Eye,
  MessageSquare
} from "lucide-react";

interface KnowledgeBase {
  id: string;
  name: string;
  description?: string;
  workspaceId: string;
  parentId?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    name?: string;
    email: string;
    avatar?: string;
  };
  _count: {
    articles: number;
    children: number;
  };
}

interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  summary?: string;
  knowledgeBaseId: string;
  workspaceId: string;
  authorId: string;
  status: "draft" | "published" | "archived";
  tags: string[];
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name?: string;
    email: string;
    avatar?: string;
  };
  knowledgeBase: {
    id: string;
    name: string;
  };
  _count: {
    comments: number;
    versions: number;
  };
}

interface KnowledgeManagerProps {
  workspaceId: string;
}

export function KnowledgeManager({ workspaceId }: KnowledgeManagerProps) {
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [selectedBase, setSelectedBase] = useState<KnowledgeBase | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeArticle | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateBaseOpen, setIsCreateBaseOpen] = useState(false);
  const [isCreateArticleOpen, setIsCreateArticleOpen] = useState(false);
  const [newBaseName, setNewBaseName] = useState("");
  const [newBaseDescription, setNewBaseDescription] = useState("");
  const [newBaseParent, setNewBaseParent] = useState("");
  const [newBaseIsPublic, setNewBaseIsPublic] = useState(true);
  const [newArticleTitle, setNewArticleTitle] = useState("");
  const [newArticleContent, setNewArticleContent] = useState("");
  const [newArticleSummary, setNewArticleSummary] = useState("");
  const [newArticleTags, setNewArticleTags] = useState("");
  const [newArticleBase, setNewArticleBase] = useState("");

  useEffect(() => {
    loadKnowledgeBases();
  }, [workspaceId]);

  useEffect(() => {
    if (selectedBase) {
      loadArticles(selectedBase.id);
    } else {
      setArticles([]);
    }
  }, [selectedBase]);

  const loadKnowledgeBases = async () => {
    try {
      const response = await fetch(`/api/knowledge-bases?workspaceId=${workspaceId}`);
      if (response.ok) {
        const data = await response.json();
        setKnowledgeBases(data);
      }
    } catch (error) {
      console.error("Failed to load knowledge bases:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadArticles = async (baseId: string) => {
    try {
      const response = await fetch(`/api/knowledge-articles?baseId=${baseId}`);
      if (response.ok) {
        const data = await response.json();
        setArticles(data);
      }
    } catch (error) {
      console.error("Failed to load articles:", error);
    }
  };

  const createKnowledgeBase = async () => {
    try {
      const response = await fetch("/api/knowledge-bases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newBaseName,
          description: newBaseDescription,
          workspaceId,
          parentId: newBaseParent || null,
          isPublic: newBaseIsPublic,
        }),
      });

      if (response.ok) {
        await loadKnowledgeBases();
        setIsCreateBaseOpen(false);
        setNewBaseName("");
        setNewBaseDescription("");
        setNewBaseParent("");
        setNewBaseIsPublic(true);
      }
    } catch (error) {
      console.error("Failed to create knowledge base:", error);
    }
  };

  const createArticle = async () => {
    try {
      const response = await fetch("/api/knowledge-articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newArticleTitle,
          content: newArticleContent,
          summary: newArticleSummary,
          knowledgeBaseId: newArticleBase,
          workspaceId,
          tags: newArticleTags.split(",").map(tag => tag.trim()).filter(Boolean),
        }),
      });

      if (response.ok) {
        if (selectedBase?.id === newArticleBase) {
          await loadArticles(newArticleBase);
        }
        setIsCreateArticleOpen(false);
        setNewArticleTitle("");
        setNewArticleContent("");
        setNewArticleSummary("");
        setNewArticleTags("");
        setNewArticleBase("");
      }
    } catch (error) {
      console.error("Failed to create article:", error);
    }
  };

  const filteredArticles = articles.filter(article =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const topLevelBases = knowledgeBases.filter(base => !base.parentId);
  const childBases = knowledgeBases.filter(base => base.parentId);

  return (
    <div className="flex h-full">
      {/* Sidebar - Knowledge Bases */}
      <div className="w-80 border-r bg-card">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Knowledge Bases</h2>
            <Dialog open={isCreateBaseOpen} onOpenChange={setIsCreateBaseOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Base
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Knowledge Base</DialogTitle>
                  <DialogDescription>
                    Create a new knowledge base to organize your articles.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={newBaseName}
                      onChange={(e) => setNewBaseName(e.target.value)}
                      placeholder="Enter knowledge base name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newBaseDescription}
                      onChange={(e) => setNewBaseDescription(e.target.value)}
                      placeholder="Enter description"
                    />
                  </div>
                  <div>
                    <Label htmlFor="parent">Parent Base (Optional)</Label>
                    <Select value={newBaseParent} onValueChange={setNewBaseParent}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select parent base" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None (Top Level)</SelectItem>
                        {topLevelBases.map((base) => (
                          <SelectItem key={base.id} value={base.id}>
                            {base.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isPublic"
                      checked={newBaseIsPublic}
                      onChange={(e) => setNewBaseIsPublic(e.target.checked)}
                    />
                    <Label htmlFor="isPublic">Public</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={createKnowledgeBase}>Create</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-2">
            {isLoading ? (
              <div className="text-center text-muted-foreground">Loading...</div>
            ) : topLevelBases.length === 0 ? (
              <div className="text-center text-muted-foreground">
                No knowledge bases yet. Create one to get started.
              </div>
            ) : (
              topLevelBases.map((base) => (
                <div key={base.id}>
                  <Card 
                    className={`cursor-pointer transition-colors ${
                      selectedBase?.id === base.id ? "bg-accent" : ""
                    }`}
                    onClick={() => setSelectedBase(base)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          <div>
                            <h3 className="font-medium">{base.name}</h3>
                            {base.description && (
                              <p className="text-xs text-muted-foreground truncate">
                                {base.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {base._count.articles} articles
                          </Badge>
                          {!base.isPublic && (
                            <Badge variant="secondary" className="text-xs">
                              Private
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Child bases */}
                  {childBases
                    .filter(child => child.parentId === base.id)
                    .map((child) => (
                      <Card 
                        key={child.id}
                        className={`ml-4 cursor-pointer transition-colors ${
                          selectedBase?.id === child.id ? "bg-accent" : ""
                        }`}
                        onClick={() => setSelectedBase(child)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Folder className="h-4 w-4" />
                              <div>
                                <h3 className="font-medium">{child.name}</h3>
                                {child.description && (
                                  <p className="text-xs text-muted-foreground truncate">
                                    {child.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {child._count.articles} articles
                              </Badge>
                              {!child.isPublic && (
                                <Badge variant="secondary" className="text-xs">
                                  Private
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {selectedBase ? (
          <>
            {/* Header */}
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-semibold">{selectedBase.name}</h1>
                  {selectedBase.description && (
                    <p className="text-muted-foreground">{selectedBase.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Dialog open={isCreateArticleOpen} onOpenChange={setIsCreateArticleOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        New Article
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Create New Article</DialogTitle>
                        <DialogDescription>
                          Create a new knowledge article in {selectedBase.name}.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="title">Title</Label>
                          <Input
                            id="title"
                            value={newArticleTitle}
                            onChange={(e) => setNewArticleTitle(e.target.value)}
                            placeholder="Enter article title"
                          />
                        </div>
                        <div>
                          <Label htmlFor="summary">Summary</Label>
                          <Textarea
                            id="summary"
                            value={newArticleSummary}
                            onChange={(e) => setNewArticleSummary(e.target.value)}
                            placeholder="Brief summary of the article"
                            rows={2}
                          />
                        </div>
                        <div>
                          <Label htmlFor="content">Content</Label>
                          <Textarea
                            id="content"
                            value={newArticleContent}
                            onChange={(e) => setNewArticleContent(e.target.value)}
                            placeholder="Write your article content here..."
                            rows={8}
                          />
                        </div>
                        <div>
                          <Label htmlFor="tags">Tags (comma-separated)</Label>
                          <Input
                            id="tags"
                            value={newArticleTags}
                            onChange={(e) => setNewArticleTags(e.target.value)}
                            placeholder="tag1, tag2, tag3"
                          />
                        </div>
                        <div>
                          <Label htmlFor="base">Knowledge Base</Label>
                          <Select value={newArticleBase || selectedBase.id} onValueChange={setNewArticleBase}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {knowledgeBases.map((base) => (
                                <SelectItem key={base.id} value={base.id}>
                                  {base.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={createArticle}>Create Article</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="p-4 border-b">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search articles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            {/* Articles List */}
            <ScrollArea className="flex-1">
              <div className="p-4">
                {filteredArticles.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No articles found in this knowledge base.</p>
                    <p className="text-sm">Create your first article to get started.</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {filteredArticles.map((article) => (
                      <Card key={article.id} className="cursor-pointer hover:bg-accent/50">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg">{article.title}</CardTitle>
                              {article.summary && (
                                <CardDescription className="mt-1">
                                  {article.summary}
                                </CardDescription>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={article.status === "published" ? "default" : "secondary"}>
                                {article.status}
                              </Badge>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                <span>{article.author.name || article.author.email}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>{new Date(article.createdAt).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MessageSquare className="h-3 w-3" />
                                <span>{article._count.comments} comments</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {article.tags.map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">Welcome to Knowledge Base</h2>
              <p className="text-muted-foreground mb-4">
                Select a knowledge base from the sidebar to view its articles, or create a new one to get started.
              </p>
              <Dialog open={isCreateBaseOpen} onOpenChange={setIsCreateBaseOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Knowledge Base
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Knowledge Base</DialogTitle>
                    <DialogDescription>
                      Create a new knowledge base to organize your articles.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={newBaseName}
                        onChange={(e) => setNewBaseName(e.target.value)}
                        placeholder="Enter knowledge base name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={newBaseDescription}
                        onChange={(e) => setNewBaseDescription(e.target.value)}
                        placeholder="Enter description"
                      />
                    </div>
                    <div>
                      <Label htmlFor="parent">Parent Base (Optional)</Label>
                      <Select value={newBaseParent} onValueChange={setNewBaseParent}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select parent base" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">None (Top Level)</SelectItem>
                          {topLevelBases.map((base) => (
                            <SelectItem key={base.id} value={base.id}>
                              {base.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isPublic"
                        checked={newBaseIsPublic}
                        onChange={(e) => setNewBaseIsPublic(e.target.checked)}
                      />
                      <Label htmlFor="isPublic">Public</Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={createKnowledgeBase}>Create</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}