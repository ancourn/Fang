"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Share, 
  Users, 
  Mail, 
  Link, 
  Copy, 
  Plus, 
  X, 
  Settings, 
  Eye,
  Edit,
  Trash2,
  Shield,
  Globe,
  Lock,
  UserPlus,
  Search,
  MoreHorizontal
} from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
}

interface Permission {
  userId: string;
  user: User;
  role: 'viewer' | 'editor' | 'owner';
  grantedAt: Date;
  grantedBy: string;
}

interface DocumentShareDialogProps {
  documentId: string;
  documentTitle: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isOwner: boolean;
  currentUserId: string;
}

export function DocumentShareDialog({ 
  documentId, 
  documentTitle, 
  isOpen, 
  onOpenChange, 
  isOwner,
  currentUserId 
}: DocumentShareDialogProps) {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [shareLink, setShareLink] = useState<string>('');
  const [linkPermission, setLinkPermission] = useState<'viewer' | 'editor' | 'none'>('none');
  const [isPublic, setIsPublic] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchPermissions();
      generateShareLink();
    }
  }, [isOpen, documentId]);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      // Mock data - in real implementation, this would fetch from API
      const mockPermissions: Permission[] = [
        {
          userId: 'user1',
          user: {
            id: 'user1',
            name: 'Alice Chen',
            email: 'alice@example.com',
            avatar: '/avatars/alice.jpg',
            role: 'admin'
          },
          role: 'owner',
          grantedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          grantedBy: 'user1'
        },
        {
          userId: 'user2',
          user: {
            id: 'user2',
            name: 'Bob Smith',
            email: 'bob@example.com',
            avatar: '/avatars/bob.jpg',
            role: 'member'
          },
          role: 'editor',
          grantedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          grantedBy: 'user1'
        },
        {
          userId: 'user3',
          user: {
            id: 'user3',
            name: 'Carol Johnson',
            email: 'carol@example.com',
            avatar: '/avatars/carol.jpg',
            role: 'member'
          },
          role: 'viewer',
          grantedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          grantedBy: 'user1'
        }
      ];
      setPermissions(mockPermissions);
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
      setError('Failed to load permissions');
    } finally {
      setLoading(false);
    }
  };

  const generateShareLink = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const link = `${baseUrl}/documents/${documentId}/shared`;
    setShareLink(link);
  };

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      // Mock search results - in real implementation, this would search the database
      const mockResults: User[] = [
        {
          id: 'user4',
          name: 'David Wilson',
          email: 'david@example.com',
          role: 'member'
        },
        {
          id: 'user5',
          name: 'Emma Davis',
          email: 'emma@example.com',
          role: 'member'
        }
      ].filter(user => 
        user.name.toLowerCase().includes(query.toLowerCase()) ||
        user.email.toLowerCase().includes(query.toLowerCase())
      );
      
      setSearchResults(mockResults);
    } catch (error) {
      console.error('Failed to search users:', error);
    }
  };

  const addPermission = async (userId: string, role: 'viewer' | 'editor') => {
    try {
      // Mock API call - in real implementation, this would update the backend
      const newUser = searchResults.find(u => u.id === userId);
      if (newUser) {
        const newPermission: Permission = {
          userId,
          user: newUser,
          role,
          grantedAt: new Date(),
          grantedBy: currentUserId
        };
        
        setPermissions(prev => [...prev, newPermission]);
        setSearchResults([]);
        setSearchQuery('');
      }
    } catch (error) {
      console.error('Failed to add permission:', error);
      setError('Failed to add user');
    }
  };

  const removePermission = async (userId: string) => {
    try {
      // Mock API call - in real implementation, this would update the backend
      setPermissions(prev => prev.filter(p => p.userId !== userId));
    } catch (error) {
      console.error('Failed to remove permission:', error);
      setError('Failed to remove user');
    }
  };

  const updatePermission = async (userId: string, newRole: 'viewer' | 'editor') => {
    try {
      // Mock API call - in real implementation, this would update the backend
      setPermissions(prev => 
        prev.map(p => 
          p.userId === userId ? { ...p, role: newRole } : p
        )
      );
    } catch (error) {
      console.error('Failed to update permission:', error);
      setError('Failed to update permission');
    }
  };

  const updateLinkSharing = async (permission: 'viewer' | 'editor' | 'none') => {
    try {
      setLinkPermission(permission);
      setIsPublic(permission !== 'none');
      // Mock API call - in real implementation, this would update the backend
    } catch (error) {
      console.error('Failed to update link sharing:', error);
      setError('Failed to update link sharing');
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Shield className="h-4 w-4" />;
      case 'editor': return <Edit className="h-4 w-4" />;
      case 'viewer': return <Eye className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'editor': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'viewer': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share className="h-5 w-5" />
            Share "{documentTitle}"
          </DialogTitle>
          <DialogDescription>
            Manage who can access and edit this document
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6">
          {/* Add People Section */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Add people</h4>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    searchUsers(e.target.value);
                  }}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="border rounded-lg p-2 space-y-1">
                {searchResults.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-2 hover:bg-accent rounded">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select onValueChange={(value: 'viewer' | 'editor') => addPermission(user.id, value)}>
                        <SelectTrigger className="w-24 h-8">
                          <SelectValue placeholder="Role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="viewer">Viewer</SelectItem>
                          <SelectItem value="editor">Editor</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => addPermission(user.id, 'viewer')}
                        className="h-8 w-8 p-0"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Link Sharing Section */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Share with link</h4>
            <div className="flex items-center gap-2 p-3 border rounded-lg">
              {isPublic ? (
                <Globe className="h-4 w-4 text-green-600" />
              ) : (
                <Lock className="h-4 w-4 text-gray-600" />
              )}
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {isPublic ? 'Anyone with the link' : 'Restricted'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {linkPermission === 'editor' ? 'Can edit' : 
                   linkPermission === 'viewer' ? 'Can view' : 'No access'}
                </p>
              </div>
              <Select value={linkPermission} onValueChange={updateLinkSharing}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No access</SelectItem>
                  <SelectItem value="viewer">Can view</SelectItem>
                  <SelectItem value="editor">Can edit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isPublic && (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <Input
                  value={shareLink}
                  readOnly
                  className="flex-1"
                />
                <Button variant="outline" size="sm" onClick={copyShareLink}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
              </div>
            )}
          </div>

          <Separator />

          {/* People with Access Section */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">People with access</h4>
            <ScrollArea className="max-h-64">
              <div className="space-y-2">
                {permissions.map(permission => (
                  <div key={permission.userId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={permission.user.avatar} alt={permission.user.name} />
                        <AvatarFallback>{permission.user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{permission.user.name}</p>
                        <p className="text-xs text-muted-foreground">{permission.user.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={getRoleColor(permission.role)}>
                        {getRoleIcon(permission.role)}
                        <span className="ml-1 capitalize">{permission.role}</span>
                      </Badge>
                      
                      {permission.role !== 'owner' && isOwner && (
                        <Select 
                          value={permission.role} 
                          onValueChange={(value: 'viewer' | 'editor') => updatePermission(permission.userId, value)}
                        >
                          <SelectTrigger className="w-24 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="viewer">Viewer</SelectItem>
                            <SelectItem value="editor">Editor</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                      
                      {permission.role !== 'owner' && permission.userId !== currentUserId && isOwner && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removePermission(permission.userId)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}