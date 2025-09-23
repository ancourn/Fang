"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  UserPlus, 
  Settings, 
  Trash2,
  Crown,
  Edit,
  Eye,
  MessageCircle,
  Clock,
  Search
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface DocumentCollaborator {
  id: string;
  role: string;
  permission: string;
  joinedAt: string;
  lastActive?: string;
  user: {
    id: string;
    name?: string;
    email: string;
    avatar?: string;
    status: string;
  };
}

interface DocumentCollaboratorsProps {
  documentId: string;
  canManage: boolean;
  onCollaboratorUpdate?: () => void;
}

export function DocumentCollaborators({ 
  documentId, 
  canManage,
  onCollaboratorUpdate 
}: DocumentCollaboratorsProps) {
  const [collaborators, setCollaborators] = useState<DocumentCollaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchEmail, setSearchEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState("viewer");
  const [selectedPermission, setSelectedPermission] = useState("read");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    fetchCollaborators();
  }, [documentId]);

  const fetchCollaborators = async () => {
    try {
      const response = await fetch(`/api/documents/${documentId}/collaborators`);
      if (response.ok) {
        const data = await response.json();
        setCollaborators(data.collaborators);
      }
    } catch (error) {
      console.error("Error fetching document collaborators:", error);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async (email: string) => {
    if (!email.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await fetch(`/api/users/search?email=${encodeURIComponent(email)}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.users || []);
      }
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setSearching(false);
    }
  };

  const addCollaborator = async (userId: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/collaborators`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          role: selectedRole,
          permission: selectedPermission
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCollaborators([...collaborators, data.collaborator]);
        setShowAddDialog(false);
        setSearchEmail("");
        setSearchResults([]);
        onCollaboratorUpdate?.();
      }
    } catch (error) {
      console.error("Error adding collaborator:", error);
    }
  };

  const removeCollaborator = async (collaboratorId: string) => {
    if (!confirm("Are you sure you want to remove this collaborator?")) {
      return;
    }

    try {
      const response = await fetch(`/api/documents/${documentId}/collaborators/${collaboratorId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setCollaborators(collaborators.filter(c => c.id !== collaboratorId));
        onCollaboratorUpdate?.();
      }
    } catch (error) {
      console.error("Error removing collaborator:", error);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <Crown className="h-4 w-4" />;
      case "editor":
        return <Edit className="h-4 w-4" />;
      case "commenter":
        return <MessageCircle className="h-4 w-4" />;
      case "viewer":
        return <Eye className="h-4 w-4" />;
      default:
        return <Eye className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "owner":
        return "default";
      case "editor":
        return "secondary";
      case "commenter":
        return "outline";
      case "viewer":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const getPermissionColor = (permission: string) => {
    switch (permission) {
      case "write":
        return "default";
      case "comment":
        return "secondary";
      case "read":
        return "outline";
      default:
        return "secondary";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Clock className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading collaborators...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Collaborators</h3>
          <Badge variant="secondary">{collaborators.length}</Badge>
        </div>
        {canManage && (
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Collaborator
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Collaborator</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Search by Email</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={searchEmail}
                      onChange={(e) => {
                        setSearchEmail(e.target.value);
                        searchUsers(e.target.value);
                      }}
                      placeholder="Enter email address..."
                      className="pl-10"
                    />
                  </div>
                  
                  {searching && (
                    <div className="text-sm text-muted-foreground mt-1">
                      Searching...
                    </div>
                  )}
                  
                  {searchResults.length > 0 && (
                    <div className="mt-2 border rounded-md max-h-32 overflow-y-auto">
                      {searchResults.map((user) => (
                        <div
                          key={user.id}
                          className="p-2 hover:bg-muted cursor-pointer flex items-center gap-2"
                          onClick={() => addCollaborator(user.id)}
                        >
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={user.avatar} alt={user.name} />
                            <AvatarFallback className="text-xs">
                              {user.name?.charAt(0) || user.email.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="text-sm font-medium">
                              {user.name || user.email}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium">Role</label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owner">Owner</SelectItem>
                      <SelectItem value="editor">Editor</SelectItem>
                      <SelectItem value="commenter">Commenter</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Permission</label>
                  <Select value={selectedPermission} onValueChange={setSelectedPermission}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="write">Can Edit</SelectItem>
                      <SelectItem value="comment">Can Comment</SelectItem>
                      <SelectItem value="read">Can View</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <ScrollArea className="h-64">
        <div className="space-y-2">
          {collaborators.map((collaborator) => (
            <Card key={collaborator.id} className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={collaborator.user.avatar} alt={collaborator.user.name} />
                    <AvatarFallback className="text-xs">
                      {collaborator.user.name?.charAt(0) || collaborator.user.email.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {collaborator.user.name || collaborator.user.email}
                      </span>
                      <div className="flex items-center gap-1">
                        {getRoleIcon(collaborator.role)}
                        <Badge variant={getRoleColor(collaborator.role) as any} className="text-xs">
                          {collaborator.role}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{collaborator.user.email}</span>
                      <span>•</span>
                      <Badge variant={getPermissionColor(collaborator.permission) as any} className="text-xs">
                        {collaborator.permission}
                      </Badge>
                      <span>•</span>
                      <span>
                        Joined {formatDistanceToNow(new Date(collaborator.joinedAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>

                {canManage && collaborator.role !== "owner" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCollaborator(collaborator.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </Card>
          ))}
          
          {collaborators.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No collaborators yet</p>
              <p className="text-sm">Add team members to collaborate on this document</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}