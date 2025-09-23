"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Clock, 
  Send, 
  Calendar, 
  Trash2, 
  Edit,
  Plus,
  X
} from "lucide-react";

interface ScheduledMessage {
  id: string;
  content: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar: string;
  channelId: string;
  channelName: string;
  channelDisplayName?: string;
  scheduledAt: string;
  createdAt: string;
}

interface MessageSchedulerProps {
  channelId: string;
  channelName: string;
}

export function MessageScheduler({ channelId, channelName }: MessageSchedulerProps) {
  const { user } = useAuth();
  const [scheduledMessages, setScheduledMessages] = useState<ScheduledMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [scheduledDateTime, setScheduledDateTime] = useState("");

  useEffect(() => {
    fetchScheduledMessages();
  }, [channelId]);

  const fetchScheduledMessages = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/messages/schedule?channelId=${channelId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const formattedMessages = data.scheduledMessages.map((msg: any) => ({
          id: msg.id,
          content: msg.content,
          userId: msg.user.id,
          userName: msg.user.name || msg.user.email,
          userEmail: msg.user.email,
          userAvatar: msg.user.avatar,
          channelId: msg.channel.id,
          channelName: msg.channel.name,
          channelDisplayName: msg.channel.displayName,
          scheduledAt: msg.scheduledAt,
          createdAt: msg.createdAt
        }));
        setScheduledMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Error fetching scheduled messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleMessage = async () => {
    if (!newMessage.trim() || !scheduledDateTime) return;

    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/messages/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: newMessage,
          channelId,
          scheduledAt: scheduledDateTime
        })
      });

      if (response.ok) {
        setNewMessage("");
        setScheduledDateTime("");
        setIsDialogOpen(false);
        fetchScheduledMessages();
      }
    } catch (error) {
      console.error('Error scheduling message:', error);
    }
  };

  const handleDeleteScheduled = async (messageId: string) => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/messages/schedule?messageId=${messageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setScheduledMessages(prev => prev.filter(msg => msg.id !== messageId));
      }
    } catch (error) {
      console.error('Error deleting scheduled message:', error);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getTimeUntilScheduled = (dateString: string) => {
    const now = new Date();
    const scheduled = new Date(dateString);
    const diff = scheduled.getTime() - now.getTime();
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <Card className="w-80">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Scheduled Messages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-80">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Scheduled Messages
          <Badge variant="secondary" className="text-xs">
            {scheduledMessages.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="p-3 border-b">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="w-full">
                <Plus className="h-3 w-3 mr-2" />
                Schedule Message
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schedule Message</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Channel: #{channelName}
                  </label>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Message
                  </label>
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="min-h-[100px]"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Schedule For
                  </label>
                  <Input
                    type="datetime-local"
                    value={scheduledDateTime}
                    onChange={(e) => setScheduledDateTime(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleScheduleMessage}
                    disabled={!newMessage.trim() || !scheduledDateTime}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Schedule
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <ScrollArea className="h-80">
          {scheduledMessages.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No scheduled messages</p>
            </div>
          ) : (
            <div className="space-y-2 p-2">
              {scheduledMessages.map((message) => (
                <div key={message.id} className="p-3 rounded-lg border bg-card">
                  <div className="flex items-start gap-2 mb-2">
                    <Avatar className="h-6 w-6 flex-shrink-0">
                      <AvatarImage src={message.userAvatar} alt={message.userName} />
                      <AvatarFallback className="text-xs">
                        {message.userName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium truncate">
                          {message.userName}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {getTimeUntilScheduled(message.scheduledAt)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(message.scheduledAt)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => handleDeleteScheduled(message.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    {message.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}