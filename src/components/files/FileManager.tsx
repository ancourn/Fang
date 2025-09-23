"use client";

import { useState, useEffect } from "react";
import { File, Download, Trash2, Eye, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  createdAt: string;
  user: {
    id: string;
    name?: string;
    email: string;
  };
  message?: {
    id: string;
    content: string;
  };
}

interface FileManagerProps {
  workspaceId: string;
  className?: string;
}

export function FileManager({ workspaceId, className }: FileManagerProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return <div className="text-blue-600">🖼️</div>;
    } else if (type.startsWith('video/')) {
      return <div className="text-purple-600">🎥</div>;
    } else if (type.startsWith('audio/')) {
      return <div className="text-green-600">🎵</div>;
    } else if (type.includes('pdf')) {
      return <div className="text-red-600">📄</div>;
    } else if (type.includes('word') || type.includes('document')) {
      return <div className="text-blue-500">📝</div>;
    } else if (type.includes('sheet') || type.includes('excel')) {
      return <div className="text-green-500">📊</div>;
    } else if (type.includes('presentation') || type.includes('powerpoint')) {
      return <div className="text-orange-500">📽️</div>;
    } else if (type.startsWith('text/')) {
      return <div className="text-gray-600">📃</div>;
    } else {
      return <div className="text-gray-500">📎</div>;
    }
  };

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/files?workspaceId=${workspaceId}`);
      if (response.ok) {
        const data = await response.json();
        setFiles(data.files);
      }
    } catch (error) {
      console.error("Error fetching files:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [workspaceId]);

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    file.user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    file.user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm("Are you sure you want to delete this file?")) return;

    try {
      const response = await fetch(`/api/files/${fileId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setFiles(prev => prev.filter(file => file.id !== fileId));
        if (selectedFile?.id === fileId) {
          setSelectedFile(null);
        }
      }
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  };

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center h-64", className)}>
        <div className="text-sm text-muted-foreground">Loading files...</div>
      </div>
    );
  }

  return (
    <div className={cn("flex h-full", className)}>
      {/* File List */}
      <div className={cn(
        "flex flex-col border-r",
        selectedFile ? "w-96" : "flex-1"
      )}>
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Files</h3>
            <Badge variant="outline">{files.length} files</Badge>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* File List */}
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {filteredFiles.length === 0 ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-sm text-muted-foreground">
                  {searchTerm ? "No files found" : "No files uploaded yet"}
                </div>
              </div>
            ) : (
              filteredFiles.map((file) => (
                <Card
                  key={file.id}
                  className={cn(
                    "p-3 cursor-pointer transition-colors",
                    selectedFile?.id === file.id && "bg-accent",
                    "hover:bg-accent/50"
                  )}
                  onClick={() => setSelectedFile(file)}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">
                      {getFileIcon(file.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium truncate">{file.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {formatFileSize(file.size)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(file.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <Avatar className="h-4 w-4">
                          <AvatarFallback className="text-xs">
                            {file.user.name?.charAt(0) || file.user.email.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground truncate">
                          {file.user.name || file.user.email}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* File Preview */}
      {selectedFile && (
        <div className="flex-1 flex flex-col">
          {/* Preview Header */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-2xl">
                  {getFileIcon(selectedFile.type)}
                </div>
                <div>
                  <h3 className="font-medium">{selectedFile.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(selectedFile.size)} • {selectedFile.type}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(selectedFile.url, '_blank')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteFile(selectedFile.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </div>

          {/* Preview Content */}
          <div className="flex-1 p-4">
            {selectedFile.type.startsWith('image/') ? (
              <div className="flex items-center justify-center h-full">
                <img
                  src={selectedFile.url}
                  alt={selectedFile.name}
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
              </div>
            ) : selectedFile.type.startsWith('text/') ? (
              <div className="h-full">
                <iframe
                  src={selectedFile.url}
                  className="w-full h-full border rounded-lg"
                  title={selectedFile.name}
                />
              </div>
            ) : selectedFile.type.includes('pdf') ? (
              <div className="h-full">
                <iframe
                  src={selectedFile.url}
                  className="w-full h-full border rounded-lg"
                  title={selectedFile.name}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-6xl mb-4">
                    {getFileIcon(selectedFile.type)}
                  </div>
                  <p className="text-muted-foreground">
                    Preview not available for this file type
                  </p>
                  <Button
                    className="mt-4"
                    onClick={() => window.open(selectedFile.url, '_blank')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download File
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* File Info */}
          <div className="p-4 border-t">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Uploaded by:</span>
                <span>{selectedFile.user.name || selectedFile.user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Uploaded on:</span>
                <span>{new Date(selectedFile.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">File size:</span>
                <span>{formatFileSize(selectedFile.size)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">File type:</span>
                <span>{selectedFile.type}</span>
              </div>
              {selectedFile.message && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-muted-foreground mb-1">Shared in message:</p>
                  <p className="text-xs bg-accent p-2 rounded">
                    {selectedFile.message.content}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}