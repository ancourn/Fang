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
  MoreHorizontal,
  Check
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
  addedAt: Date;
}

interface DocumentShareDialogProps {
  documentId: string;
  documentTitle: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  canManage: boolean;
}

export function DocumentShareDialog({ 
  documentId, 
  documentTitle, 
  isOpen, 
  onOpenChange, 
  canManage 
}: DocumentShareDialogProps) {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [linkSharing, setLinkSharing] = useState<'disabled' | 'view' | 'edit'>('disabled');
  const [searchQuery, setSearchQuery] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'viewer' | 'editor'>('viewer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchPermissions();
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
          addedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
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
          addedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
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
          addedAt: new Date(Date.now() - 6 * 60 * 60 * 1000)
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

  const handleInviteUser = async () => {
    if (!inviteEmail.trim()) {
      setError('Please enter an email address');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // Mock API call - in real implementation, this would invite the user
      const newUser: User = {
        id: `user${Date.now()}`,
        name: inviteEmail.split('@')[0],
        email: inviteEmail,
        role: 'member'
      };

      const newPermission: Permission = {
        userId: newUser.id,
        user: newUser,
        role: inviteRole,
        addedAt: new Date()
      };

      setPermissions(prev => [...prev, newPermission]);
      setInviteEmail('');
      setSuccess('User invited successfully');
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Failed to invite user:', error);
      setError('Failed to invite user');
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePermission = async (userId: string) => {
    try {
      setLoading(true);
      setPermissions(prev => prev.filter(p => p.userId !== userId));
    } catch (error) {
      console.error('Failed to remove permission:', error);
      setError('Failed to remove user');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePermission = async (userId: string, newRole: 'viewer' | 'editor') => {
    try {
      setLoading(true);
      setPermissions(prev => 
        prev.map(p => p.userId === userId ? { ...p, role: newRole } : p)
      );
    } catch (error) {
      console.error('Failed to update permission:', error);
      setError('Failed to update permission');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    const shareUrl = `${window.location.origin}/documents/${documentId}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
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

  const getLinkSharingIcon = (mode: string) => {
    switch (mode) {
      case 'edit': return <Edit className="h-4 w-4" />;
      case 'view': return <Eye className="h-4 w-4" />;
      case 'disabled': return <Lock className="h-4 w-4" />;
      default: return <Link className="h-4 w-4" />;
    }
  };

  const filteredPermissions = permissions.filter(permission =>
    permission.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    permission.user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share className="h-5 w-5" />
            Share "{documentTitle}"
          </DialogTitle>
          <DialogDescription>
            Manage who can access this document and their permissions.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6">
          {/* Link Sharing */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Link className="h-4 w-4" />
              Link Sharing
            </h3>
            
            <div className="flex items-center gap-2">
              <Select value={linkSharing} onValueChange={(value: 'disabled' | 'view' | 'edit') => setLinkSharing(value)}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="disabled">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Disabled - Only invited people
                    </div>
                  </SelectItem>
                  <SelectItem value="view">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Anyone with link can view
                    </div>
                  </SelectItem>
                  <SelectItem value="edit">
                    <div className="flex items-center gap-2">
                      <Edit className="h-4 w-4" />
                      Anyone with link can edit
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className="flex items-center gap-2"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
          </div>

          <Separator />

          {/* Invite People */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Invite People
            </h3>
            
            <div className="flex gap-2">
              <Input
                placeholder="Enter email address"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1"
                type="email"
              />
              <Select value={inviteRole} onValueChange={(value: 'viewer' | 'editor') => setInviteRole(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Can view</SelectItem>
                  <SelectItem value="editor">Can edit</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleInviteUser} disabled={loading || !inviteEmail.trim()}>
                <Plus className="h-4 w-4 mr-1" />
                Invite
              </Button>
            </div>
          </div>

          {/* People with Access */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                People with Access ({permissions.length})
              </h3>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search people..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-48"
                />
              </div>
            </div>

            <ScrollArea className="max-h-64">
              <div className="space-y-2">
                {filteredPermissions.map((permission) => (
                  <div key={permission.userId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={permission.user.avatar} alt={permission.user.name} />
                        <AvatarFallback>
                          {permission.user.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div>
                        <p className="font-medium">{permission.user.name}</p>
                        <p className="text-sm text-muted-foreground">{permission.user.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className={`flex items-center gap-1 ${getRoleColor(permission.role)}`}
                      >
                        {getRoleIcon(permission.role)}
                        <span className="capitalize">{permission.role}</span>
                      </Badge>
                      
                      {permission.role !== 'owner' && canManage && (
                        <div className="flex items-center gap-1">
                          <Select 
                            value={permission.role} 
                            onValueChange={(value: 'viewer' | 'editor') => 
                              handleUpdatePermission(permission.userId, value)
                            }
                          >
                            <SelectTrigger className="w-24 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="viewer">View</SelectItem>
                              <SelectItem value="editor">Edit</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleRemovePermission(permission.userId)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {filteredPermissions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No people found</p>
                    {searchQuery && (
                      <p className="text-sm mt-2">Try adjusting your search</p>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Error and Success Messages */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert>
              <AlertDescription>{success}</AlertDescription>
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