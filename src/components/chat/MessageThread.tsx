"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useSocket } from "@/hooks/useSocket";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Send, 
  Reply, 
  MoreVertical, 
  CornerUpLeft,
  X
} from "lucide-react";

interface ThreadMessage {
  id: string;
  content: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar: string;
  userStatus: string;
  timestamp: string;
  threadId?: string;
  reactions?: { emoji: string; count: number; users: string[] }[];
}

interface MessageThreadProps {
  parentMessage: ThreadMessage;
  channelId: string;
  onClose: () => void;
}

export function MessageThread({ parentMessage, channelId, onClose }: MessageThreadProps) {
  const { user } = useAuth();
  const [threadMessages, setThreadMessages] = useState<ThreadMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const {
    isConnected,
    sendMessage,
    startTyping,
    stopTyping
  } = useSocket();

  // Fetch thread messages when component mounts
  useEffect(() => {
    fetchThreadMessages();
  }, [parentMessage.id]);

  const fetchThreadMessages = async () => {
    try {
      const response = await fetch(`/api/messages/thread/${parentMessage.id}`);
      if (response.ok) {
        const data = await response.json();
        setThreadMessages(data.messages || []);
      }
    } catch (error) {
      console.error("Error fetching thread messages:", error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [threadMessages]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      // Send via socket with threadId
      sendMessage({
        content: newMessage,
        channelId: channelId,
        threadId: parentMessage.id
      });

      // Add message locally for immediate feedback
      const message: ThreadMessage = {
        id: Date.now().toString(),
        content: newMessage,
        userId: user?.id || "current-user",
        userName: user?.name || "You",
        userEmail: user?.email || "",
        userAvatar: user?.avatar || "/api/placeholder/32/32",
        userStatus: user?.status || "online",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        threadId: parentMessage.id
      };
      setThreadMessages([...threadMessages, message]);
      setNewMessage("");
      
      // Stop typing indicator
      stopTyping({ channelId: channelId });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    } else {
      // Start typing indicator
      startTyping({ channelId: channelId });
      
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set timeout to stop typing
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping({ channelId: channelId });
      }, 1000);
    }
  };

  const handleReaction = (messageId: string, emoji: string) => {
    // In a real app, this would call the socket addReaction function
    console.log(`Added reaction ${emoji} to message ${messageId}`);
  };

  return (
    <div className="flex h-full bg-background">
      {/* Thread Sidebar */}
      <div className="w-96 border-r flex flex-col">
        {/* Thread Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium">Thread</h3>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Parent Message */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CornerUpLeft className="h-3 w-3" />
              <span>Reply to message</span>
            </div>
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="flex gap-2 mb-2">
                <Avatar className="h-6 w-6 flex-shrink-0">
                  <AvatarImage src={parentMessage.userAvatar} alt={parentMessage.userName} />
                  <AvatarFallback className="text-xs">
                    {parentMessage.userName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{parentMessage.userName}</span>
                    <span className="text-xs text-muted-foreground">{parentMessage.timestamp}</span>
                  </div>
                  <div className="text-sm">{parentMessage.content}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Thread Messages */}
        <ScrollArea className="flex-1 px-4 py-4">
          <div className="space-y-4">
            {threadMessages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <p className="text-sm">No replies yet</p>
                <p className="text-xs mt-1">Be the first to reply to this message</p>
              </div>
            ) : (
              threadMessages.map((message) => (
                <div key={message.id} className="flex gap-3 group">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={message.userAvatar} alt={message.userName} />
                    <AvatarFallback className="text-xs">
                      {message.userName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{message.userName}</span>
                      <span className="text-xs text-muted-foreground">{message.timestamp}</span>
                      {message.userId === user?.id && (
                        <Badge variant="outline" className="text-xs">You</Badge>
                      )}
                    </div>
                    <div className="text-sm">{message.content}</div>
                    {message.reactions && message.reactions.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {message.reactions.map((reaction, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={() => handleReaction(message.id, reaction.emoji)}
                          >
                            {reaction.emoji} {reaction.count}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Thread Input */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Reply in thread..."
                className="min-h-[36px]"
              />
            </div>
            <Button onClick={handleSendMessage} size="sm">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}