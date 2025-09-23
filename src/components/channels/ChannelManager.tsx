"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Hash, Users, Lock, MessageCircle, Loader2 } from "lucide-react";

interface Channel {
  id: string;
  name: string;
  displayName?: string;
  description?: string;
  type: "public" | "private";
  workspaceId: string;
  isMember: boolean;
  members: Array<{
    id: string;
    user: {
      id: string;
      name?: string;
      email: string;
      avatar?: string;
      status: string;
    };
  }>;
  _count: {
    members: number;
    messages: number;
  };
}

interface ChannelManagerProps {
  workspaceId: string;
  onChannelSelect: (channel: Channel) => void;
  selectedChannelId?: string;
}

export function ChannelManager({ workspaceId, onChannelSelect, selectedChannelId }: ChannelManagerProps) {
  const { user } = useAuth();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isJoining, setIsJoining] = useState<string | null>(null);
  const [isLeaving, setIsLeaving] = useState<string | null>(null);

  const [newChannel, setNewChannel] = useState({
    name: "",
    description: "",
    type: "public" as "public" | "private",
  });

  useEffect(() => {
    fetchChannels();
  }, [workspaceId]);

  const fetchChannels = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/channels?workspaceId=${workspaceId}`);
      if (response.ok) {
        const data = await response.json();
        setChannels(data.channels);
      } else {
        setError("Failed to fetch channels");
      }
    } catch (error) {
      console.error("Fetch channels error:", error);
      setError("Failed to fetch channels");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChannel = async () => {
    if (!newChannel.name.trim()) {
      setError("Channel name is required");
      return;
    }

    try {
      const response = await fetch("/api/channels", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newChannel,
          workspaceId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setChannels(prev => [...prev, data.channel]);
        setNewChannel({ name: "", description: "", type: "public" });
        setIsCreateDialogOpen(false);
        setError("");
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to create channel");
      }
    } catch (error) {
      console.error("Create channel error:", error);
      setError("Failed to create channel");
    }
  };

  const handleJoinChannel = async (channelId: string) => {
    try {
      setIsJoining(channelId);
      const response = await fetch("/api/channels/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ channelId }),
      });

      if (response.ok) {
        setChannels(prev =>
          prev.map(channel =>
            channel.id === channelId
              ? { ...channel, isMember: true }
              : channel
          )
        );
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to join channel");
      }
    } catch (error) {
      console.error("Join channel error:", error);
      setError("Failed to join channel");
    } finally {
      setIsJoining(null);
    }
  };

  const handleLeaveChannel = async (channelId: string) => {
    try {
      setIsLeaving(channelId);
      const response = await fetch("/api/channels/leave", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ channelId }),
      });

      if (response.ok) {
        setChannels(prev =>
          prev.map(channel =>
            channel.id === channelId
              ? { ...channel, isMember: false }
              : channel
          )
        );
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to leave channel");
      }
    } catch (error) {
      console.error("Leave channel error:", error);
      setError("Failed to leave channel");
    } finally {
      setIsLeaving(null);
    }
  };

  const getChannelIcon = (type: string) => {
    return type === "private" ? <Lock className="h-4 w-4" /> : <Hash className="h-4 w-4" />;
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

      {/* Create Channel Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogTrigger asChild>
          <Button className="w-full" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Create Channel
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Channel</DialogTitle>
            <DialogDescription>
              Create a new channel for your team to collaborate and communicate.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="channel-name">Channel Name</Label>
              <Input
                id="channel-name"
                placeholder="e.g., general, random, dev-team"
                value={newChannel.name}
                onChange={(e) => setNewChannel(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="channel-description">Description (Optional)</Label>
              <Textarea
                id="channel-description"
                placeholder="What's this channel about?"
                value={newChannel.description}
                onChange={(e) => setNewChannel(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="channel-type">Channel Type</Label>
              <Select
                value={newChannel.type}
                onValueChange={(value: "public" | "private") => 
                  setNewChannel(prev => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4" />
                      Public - Anyone in workspace can join
                    </div>
                  </SelectItem>
                  <SelectItem value="private">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Private - Only invited members can join
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateChannel}>
              Create Channel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Channels List */}
      <ScrollArea className="max-h-96">
        <div className="space-y-2">
          {channels.map((channel) => (
            <div
              key={channel.id}
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedChannelId === channel.id
                  ? "bg-accent border-accent"
                  : "hover:bg-accent/50"
              }`}
              onClick={() => channel.isMember && onChannelSelect(channel)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="flex items-center gap-2 mt-0.5">
                    {getChannelIcon(channel.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium truncate">
                        {channel.displayName || channel.name}
                      </h4>
                      <Badge variant="outline" className="text-xs">
                        {channel.type}
                      </Badge>
                    </div>
                    {channel.description && (
                      <p className="text-sm text-muted-foreground truncate">
                        {channel.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>{channel._count.members} members</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" />
                        <span>{channel._count.messages} messages</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  {channel.isMember ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLeaveChannel(channel.id);
                      }}
                      disabled={isLeaving === channel.id}
                    >
                      {isLeaving === channel.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        "Leave"
                      )}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleJoinChannel(channel.id);
                      }}
                      disabled={isJoining === channel.id}
                    >
                      {isJoining === channel.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        "Join"
                      )}
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Show some members */}
              {channel.members.length > 0 && (
                <div className="flex items-center gap-1 mt-2">
                  {channel.members.slice(0, 5).map((member) => (
                    <Avatar key={member.id} className="h-5 w-5">
                      <AvatarImage src={member.user.avatar} alt={member.user.name} />
                      <AvatarFallback className="text-xs">
                        {member.user.name?.charAt(0) || member.user.email.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {channel.members.length > 5 && (
                    <span className="text-xs text-muted-foreground">
                      +{channel.members.length - 5} more
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}