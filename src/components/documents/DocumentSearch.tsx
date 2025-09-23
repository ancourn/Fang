"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, 
  Filter, 
  FileText, 
  FileSpreadsheet, 
  Presentation,
  Calendar,
  User,
  Star,
  MoreHorizontal,
  Eye,
  Edit,
  Clock,
  X
} from "lucide-react";

interface SearchResult {
  id: string;
  title: string;
  content: string;
  type: "doc" | "sheet" | "slide";
  workspaceId: string;
  workspaceName: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  updatedAt: string;
  createdAt: string;
  relevanceScore: number;
  matchedContent: string;
  tags: string[];
}

interface DocumentSearchProps {
  workspaceId?: string;
  onResultSelect?: (document: SearchResult) => void;
  placeholder?: string;
  className?: string;
}

export function DocumentSearch({ 
  workspaceId, 
  onResultSelect, 
  placeholder = "Search documents...",
  className = ""
}: DocumentSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [filters, setFilters] = useState({
    type: "all" as "all" | "doc" | "sheet" | "slide",
    dateRange: "all" as "all" | "today" | "week" | "month",
    author: "all" as "all" | string,
    sortBy: "relevance" as "relevance" | "date" | "title"
  });

  // Debounced search
  const debouncedSearch = useCallback(
    debounce(async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        return;
      }

      try {
        setLoading(true);
        
        // Mock search results - in real implementation, this would call an API
        const mockResults: SearchResult[] = [
          {
            id: "doc1",
            title: "Project Proposal",
            content: "This is a comprehensive project proposal outlining the key objectives and deliverables for the upcoming quarter...",
            type: "doc",
            workspaceId: workspaceId || "ws1",
            workspaceName: "Engineering Team",
            userId: "user1",
            userName: "Alice Chen",
            userAvatar: "/avatars/alice.jpg",
            updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            relevanceScore: 0.95,
            matchedContent: "comprehensive <mark>project</mark> <mark>proposal</mark> outlining the key objectives",
            tags: ["important", "planning"]
          },
          {
            id: "doc2", 
            title: "Budget Spreadsheet",
            content: "Q4 budget allocation across different departments including engineering, marketing, and operations...",
            type: "sheet",
            workspaceId: workspaceId || "ws1",
            workspaceName: "Engineering Team",
            userId: "user2",
            userName: "Bob Smith",
            userAvatar: "/avatars/bob.jpg",
            updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
            relevanceScore: 0.87,
            matchedContent: "Q4 <mark>budget</mark> allocation across different departments",
            tags: ["finance", "planning"]
          },
          {
            id: "doc3",
            title: "Product Roadmap Presentation",
            content: "Strategic product roadmap for the next 12 months including feature releases and timeline...",
            type: "slide",
            workspaceId: workspaceId || "ws1",
            workspaceName: "Engineering Team", 
            userId: "user3",
            userName: "Carol Johnson",
            userAvatar: "/avatars/carol.jpg",
            updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            relevanceScore: 0.82,
            matchedContent: "Strategic <mark>product</mark> <mark>roadmap</mark> for the next 12 months",
            tags: ["strategy", "planning"]
          }
        ];

        // Apply filters
        let filteredResults = mockResults.filter(result => {
          if (filters.type !== "all" && result.type !== filters.type) return false;
          
          if (filters.dateRange !== "all") {
            const now = new Date();
            const resultDate = new Date(result.updatedAt);
            const daysDiff = (now.getTime() - resultDate.getTime()) / (1000 * 60 * 60 * 24);
            
            switch (filters.dateRange) {
              case "today": return daysDiff < 1;
              case "week": return daysDiff < 7;
              case "month": return daysDiff < 30;
            }
          }
          
          return true;
        });

        // Sort results
        filteredResults.sort((a, b) => {
          switch (filters.sortBy) {
            case "date": return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
            case "title": return a.title.localeCompare(b.title);
            case "relevance":
            default: return b.relevanceScore - a.relevanceScore;
          }
        });

        setResults(filteredResults);
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setLoading(false);
      }
    }, 300),
    [filters, workspaceId]
  );

  useEffect(() => {
    if (query) {
      debouncedSearch(query);
    } else {
      setResults([]);
    }
  }, [query, debouncedSearch]);

  function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case "sheet": return <FileSpreadsheet className="h-5 w-5" />;
      case "slide": return <Presentation className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
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

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    
    const regex = new RegExp(`(${query})`, "gi");
    return text.replace(regex, "<mark>$1</mark>");
  };

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowResults(true)}
          className="pl-10"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            onClick={() => setQuery("")}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && (query || results.length > 0) && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 shadow-lg border max-h-96">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Search Results</CardTitle>
              <div className="flex items-center gap-2">
                <Select value={filters.type} onValueChange={(value: any) => setFilters(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger className="w-24 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="doc">Docs</SelectItem>
                    <SelectItem value="sheet">Sheets</SelectItem>
                    <SelectItem value="slide">Slides</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={filters.sortBy} onValueChange={(value: any) => setFilters(prev => ({ ...prev, sortBy: value }))}>
                  <SelectTrigger className="w-24 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <ScrollArea className="max-h-64">
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : results.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No documents found</p>
                  <p className="text-sm mt-2">Try different keywords or filters</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {results.map((result) => (
                    <div
                      key={result.id}
                      className="p-3 hover:bg-accent/50 cursor-pointer transition-colors border-b last:border-b-0"
                      onClick={() => {
                        onResultSelect?.(result);
                        setShowResults(false);
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getDocumentIcon(result.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium truncate" dangerouslySetInnerHTML={{ 
                              __html: highlightMatch(result.title, query) 
                            }} />
                            <Badge variant="outline" className="text-xs">
                              {result.type}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2" dangerouslySetInnerHTML={{ 
                            __html: highlightMatch(result.matchedContent, query) 
                          }} />
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Avatar className="h-4 w-4">
                                <AvatarImage src={result.userAvatar} alt={result.userName} />
                                <AvatarFallback className="text-[10px]">
                                  {result.userName.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <span>{result.userName}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{formatDate(result.updatedAt)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3" />
                              <span>{Math.round(result.relevanceScore * 100)}% match</span>
                            </div>
                          </div>
                          
                          {result.tags.length > 0 && (
                            <div className="flex gap-1 mt-2">
                              {result.tags.map(tag => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Close results when clicking outside */}
      {showResults && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowResults(false)}
        />
      )}
    </div>
  );
}