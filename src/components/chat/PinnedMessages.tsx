"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Pin, 
  PinOff, 
  Clock, 
  MoreVertical,
  MessageSquare,
  Hash
} from "lucide-react";

interface PinnedMessage {
  id: string;
  content: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar: string;
  timestamp: string;
  channelId: string;
  channelName: string;
  channelDisplayName?: string;
  reactions?: { emoji: string; count: number; users: string[] }[];
}

interface PinnedMessagesProps {
  channelId?: string;
  onMessageSelect?: (messageId: string) => void;
}

export function PinnedMessages({ channelId, onMessageSelect }: PinnedMessagesProps) {
  const { user } = useAuth();
  const [pinnedMessages, setPinnedMessages] = useState<PinnedMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPinnedMessages();
  }, [channelId]);

  const fetchPinnedMessages = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const url = channelId 
        ? `/api/messages/pinned?channelId=${channelId}`
        : '/api/messages/pinned';
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const formattedMessages = data.pinnedMessages.map((msg: any) => ({
          id: msg.id,
          content: msg.content,
          userId: msg.user.id,
          userName: msg.user.name || msg.user.email,
          userEmail: msg.user.email,
          userAvatar: msg.user.avatar,
          timestamp: new Date(msg.createdAt).toLocaleString(),
          channelId: msg.channel.id,
          channelName: msg.channel.name,
          channelDisplayName: msg.channel.displayName,
          reactions: msg.reactions?.map((r: any) => ({
            emoji: r.emoji,
            count: r.user.length,
            users: r.user.map((u: any) => u.id)
          })) || []
        }));
        setPinnedMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Error fetching pinned messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnpin = async (messageId: string) => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/messages/pin/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setPinnedMessages(prev => prev.filter(msg => msg.id !== messageId));
      }
    } catch (error) {
      console.error('Error unpinning message:', error);
    }
  };

  const formatContent = (content: string) => {
    // Simple content formatting for display
    return content.length > 150 ? content.substring(0, 150) + '...' : content;
  };

  if (loading) {
    return (
      <Card className="w-80">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Pin className="h-4 w-4" />
            Pinned Messages
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
          <Pin className="h-4 w-4" />
          Pinned Messages
          <Badge variant="secondary" className="text-xs">
            {pinnedMessages.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-96">
          {pinnedMessages.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <Pin className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No pinned messages</p>
            </div>
          ) : (
            <div className="space-y-2 p-2">
              {pinnedMessages.map((message) => (
                <div
                  key={message.id}
                  className="p-3 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer transition-colors"
                  onClick={() => onMessageSelect?.(message.id)}
                >
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
                          <Hash className="h-3 w-3 mr-1" />
                          {message.channelDisplayName || message.channelName}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {message.timestamp}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUnpin(message.id);
                      }}
                    >
                      <PinOff className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <p className="text-sm mb-2">
                    {formatContent(message.content)}
                  </p>
                  
                  {message.reactions && message.reactions.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {message.reactions.map((reaction, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-xs px-2 py-0"
                        >
                          {reaction.emoji} {reaction.count}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}