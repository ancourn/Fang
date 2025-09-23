"use client";

import { useState, useEffect, useRef } from "react";
import { Search, MessageSquare, Users, File, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  type: 'message' | 'user' | 'file';
  title: string;
  content?: string;
  user?: {
    id: string;
    name?: string;
    email: string;
    avatar?: string;
  };
  createdAt: string;
  url?: string;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
}

export function SearchModal({ isOpen, onClose, workspaceId }: SearchModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'all' | 'messages' | 'users' | 'files'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [userFilter, setUserFilter] = useState<string>('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const performSearch = async () => {
    if (!searchTerm.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: searchTerm,
        workspaceId,
        type: selectedTab === 'all' ? '' : selectedTab,
        dateFilter,
        ...(userFilter && { userId: userFilter })
      });

      const response = await fetch(`/api/search?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        setResults(data.results);
      }
    } catch (error) {
      console.error("Error performing search:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm) {
        performSearch();
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, selectedTab, dateFilter, userFilter]);

  useEffect(() => {
    if (isOpen) {
      setSearchTerm("");
      setResults([]);
      setDateFilter('all');
      setUserFilter('');
      setShowAdvancedFilters(false);
    }
  }, [isOpen]);

  const getSearchIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="h-4 w-4" />;
      case 'user':
        return <Users className="h-4 w-4" />;
      case 'file':
        return <File className="h-4 w-4" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  const getSearchColor = (type: string) => {
    switch (type) {
      case 'message':
        return "text-blue-600";
      case 'user':
        return "text-green-600";
      case 'file':
        return "text-purple-600";
      default:
        return "text-gray-600";
    }
  };

  const formatContent = (content: string, highlight: string) => {
    if (!content) return "";
    
    const regex = new RegExp(`(${highlight})`, 'gi');
    const parts = content.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} className="bg-yellow-200 dark:bg-yellow-800">
          {part}
        </span>
      ) : part
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-20 z-50">
      <Card className="w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Search Header */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-muted-foreground" />
            <Input
              ref={inputRef}
              placeholder="Search messages, users, and files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button variant="ghost" size="sm" onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="mt-3 p-3 bg-muted/50 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Advanced Filters</span>
                <Button variant="ghost" size="sm" onClick={() => {
                  setDateFilter('all');
                  setUserFilter('');
                }}>
                  Clear Filters
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block">Date Range</label>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value as any)}
                    className="w-full p-2 text-xs border rounded"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-xs font-medium mb-1 block">User</label>
                  <select
                    value={userFilter}
                    onChange={(e) => setUserFilter(e.target.value)}
                    className="w-full p-2 text-xs border rounded"
                  >
                    <option value="">All Users</option>
                    <option value="current">Me</option>
                    {/* In a real app, you'd fetch actual users here */}
                  </select>
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground">
                <p>Search operators:</p>
                <p>• Use quotes for exact matches: "hello world"</p>
                <p>• Use - to exclude: meeting -urgent</p>
                <p>• Use @ for mentions: @alice</p>
                <p>• Use # for channels: #general</p>
              </div>
            </div>
          )}
          
          {/* Search Tabs */}
          <div className="flex gap-2 mt-3">
            {[
              { key: 'all', label: 'All' },
              { key: 'messages', label: 'Messages' },
              { key: 'users', label: 'Users' },
              { key: 'files', label: 'Files' }
            ].map((tab) => (
              <Button
                key={tab.key}
                variant={selectedTab === tab.key ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedTab(tab.key as any)}
                className="text-xs"
              >
                {tab.label}
              </Button>
            ))}
          </div>
          
          {/* Active Filters Display */}
          {(dateFilter !== 'all' || userFilter) && (
            <div className="flex gap-2 mt-2">
              {dateFilter !== 'all' && (
                <Badge variant="secondary" className="text-xs">
                  Date: {dateFilter}
                  <button 
                    onClick={() => setDateFilter('all')}
                    className="ml-1 hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {userFilter && (
                <Badge variant="secondary" className="text-xs">
                  User: {userFilter === 'current' ? 'Me' : userFilter}
                  <button 
                    onClick={() => setUserFilter('')}
                    className="ml-1 hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Search Results */}
        <ScrollArea className="flex-1">
          <div className="p-4">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-sm text-muted-foreground">Searching...</div>
              </div>
            ) : searchTerm && results.length === 0 ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-sm text-muted-foreground">
                  No results found for "{searchTerm}"
                </div>
              </div>
            ) : !searchTerm ? (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Recent Searches</h4>
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                      Your recent searches will appear here
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2">Quick Actions</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" className="justify-start">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Search Messages
                    </Button>
                    <Button variant="outline" size="sm" className="justify-start">
                      <Users className="h-4 w-4 mr-2" />
                      Find Users
                    </Button>
                    <Button variant="outline" size="sm" className="justify-start">
                      <File className="h-4 w-4 mr-2" />
                      Browse Files
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {results.map((result) => (
                  <Card
                    key={result.id}
                    className="p-3 cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => {
                      // Handle navigation to result
                      if (result.url) {
                        window.open(result.url, '_blank');
                      }
                      onClose();
                    }}
                  >
                    <div className="flex gap-3">
                      <div className={cn("flex-shrink-0", getSearchColor(result.type))}>
                        {getSearchIcon(result.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="text-sm font-medium truncate">
                            {result.title}
                          </h4>
                          <Badge variant="outline" className="text-xs capitalize">
                            {result.type}
                          </Badge>
                        </div>
                        
                        {result.content && (
                          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                            {formatContent(result.content, searchTerm)}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between">
                          {result.user && (
                            <div className="flex items-center gap-2">
                              <Avatar className="h-5 w-5">
                                <AvatarImage src={result.user.avatar} alt={result.user.name} />
                                <AvatarFallback className="text-xs">
                                  {result.user.name?.charAt(0) || result.user.email.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs text-muted-foreground">
                                {result.user.name || result.user.email}
                              </span>
                            </div>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {new Date(result.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Results Footer */}
        {results.length > 0 && (
          <div className="p-3 border-t">
            <div className="text-xs text-muted-foreground">
              Found {results.length} result{results.length !== 1 ? 's' : ''}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}