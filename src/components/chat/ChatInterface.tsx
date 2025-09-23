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
import { FileUpload } from "@/components/files/FileUpload";
import { MessageThread } from "@/components/chat/MessageThread";
import { VideoCall } from "@/components/calls/VideoCall";
import { PinnedMessages } from "@/components/chat/PinnedMessages";
import { MessageScheduler } from "@/components/chat/MessageScheduler";
import { ChatRichTextEditor } from "@/components/ui/RichTextEditor";
import { ChatMarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import { 
  Send, 
  Paperclip, 
  Smile, 
  MoreVertical, 
  Phone, 
  Video, 
  Info,
  Users,
  Search,
  Reply,
  File,
  Pin,
  Clock,
  Bold,
  Italic,
  Code,
  Link,
  AtSign
} from "lucide-react";

interface Message {
  id: string;
  content: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar: string;
  userStatus: string;
  timestamp: string;
  isPinned?: boolean;
  reactions?: { emoji: string; count: number; users: string[] }[];
}

const mockMessages: Message[] = [
  {
    id: "1",
    content: "Welcome to the Feishu clone! This is a demonstration of the real-time chat interface.",
    userId: "1",
    userName: "Alice Chen",
    userEmail: "alice@example.com",
    userAvatar: "/api/placeholder/32/32",
    userStatus: "online",
    timestamp: "10:30 AM",
    isPinned: true,
    reactions: [
      { emoji: "👍", count: 3, users: ["1", "2", "3"] }
    ]
  },
  {
    id: "2",
    content: "Great! I can see we have real-time messaging, channels, and workspace switching working.",
    userId: "2",
    userName: "Bob Wang",
    userEmail: "bob@example.com",
    userAvatar: "/api/placeholder/32/32",
    userStatus: "away",
    timestamp: "10:32 AM"
  },
  {
    id: "3",
    content: "The layout looks clean and modern. I like the collapsible sidebar feature!",
    userId: "3",
    userName: "Carol Liu",
    userEmail: "carol@example.com",
    userAvatar: "/api/placeholder/32/32",
    userStatus: "online",
    timestamp: "10:35 AM",
    isPinned: true,
    reactions: [
      { emoji: "❤️", count: 2, users: ["1", "3"] },
      { emoji: "🎉", count: 1, users: ["2"] }
    ]
  }
];

const mockChannelMembers = [
  { id: "1", name: "Alice Chen", email: "alice@example.com", avatar: "/api/placeholder/32/32", status: "online", role: "admin" },
  { id: "2", name: "Bob Wang", email: "bob@example.com", avatar: "/api/placeholder/32/32", status: "away", role: "member" },
  { id: "3", name: "Carol Liu", email: "carol@example.com", avatar: "/api/placeholder/32/32", status: "online", role: "member" },
  { id: "4", name: "David Zhang", email: "david@example.com", avatar: "/api/placeholder/32/32", status: "offline", role: "member" },
];

export function ChatInterface() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [newMessage, setNewMessage] = useState("");
  const [showMembers, setShowMembers] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [activeThread, setActiveThread] = useState<Message | null>(null);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [showPinned, setShowPinned] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const [currentChannelId] = useState("general-channel-id"); // Mock channel ID
  const [currentWorkspaceId] = useState("workspace-id"); // Mock workspace ID
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const {
    isConnected,
    lastMessage,
    typingUsers,
    joinChannel,
    sendMessage,
    startTyping,
    stopTyping
  } = useSocket();

  // Join channel when connected
  useEffect(() => {
    if (isConnected && currentChannelId) {
      joinChannel(currentChannelId);
    }
  }, [isConnected, currentChannelId, joinChannel]);

  // Handle new messages from socket
  useEffect(() => {
    if (lastMessage) {
      const newMsg: Message = {
        id: lastMessage.id,
        content: lastMessage.content,
        userId: lastMessage.userId,
        userName: lastMessage.userName || lastMessage.userEmail,
        userEmail: lastMessage.userEmail,
        userAvatar: lastMessage.userAvatar,
        userStatus: lastMessage.userStatus || "online",
        timestamp: new Date(lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, newMsg]);
    }
  }, [lastMessage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      // Send via socket
      sendMessage({
        content: newMessage,
        channelId: currentChannelId
      });

      // Add message locally for immediate feedback
      const message: Message = {
        id: Date.now().toString(),
        content: newMessage,
        userId: user?.id || "current-user",
        userName: user?.name || "You",
        userEmail: user?.email || "",
        userAvatar: user?.avatar || "/api/placeholder/32/32",
        userStatus: user?.status || "online",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([...messages, message]);
      setNewMessage("");
      
      // Stop typing indicator
      stopTyping({ channelId: currentChannelId });
    }
  };

  const handleReaction = (messageId: string, emoji: string) => {
    // In a real app, this would call the socket addReaction function
    console.log(`Added reaction ${emoji} to message ${messageId}`);
  };

  const handleStartThread = (message: Message) => {
    setActiveThread(message);
  };

  const handleCloseThread = () => {
    setActiveThread(null);
  };

  const handleStartVideoCall = () => {
    setShowVideoCall(true);
  };

  const handleCloseVideoCall = () => {
    setShowVideoCall(false);
  };

  const handleFileUploaded = (file: any) => {
    // Send a message about the file upload
    const message: Message = {
      id: Date.now().toString(),
      content: `📎 Uploaded a file: ${file.name}`,
      userId: user?.id || "current-user",
      userName: user?.name || "You",
      userEmail: user?.email || "",
      userAvatar: user?.avatar || "/api/placeholder/32/32",
      userStatus: user?.status || "online",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, message]);
    setShowFileUpload(false);
  };

  const handlePinMessage = async (messageId: string) => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/messages/pin/${messageId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Update message in local state
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, isPinned: data.pinned } : msg
        ));
      }
    } catch (error) {
      console.error('Error pinning message:', error);
    }
  };

  return (
    <div className="flex h-full">
      {/* Connection Status */}
      <div className={cn(
        "absolute top-2 right-2 z-10 px-2 py-1 rounded text-xs font-medium",
        isConnected ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
      )}>
        {isConnected ? "Connected" : "Disconnected"}
      </div>

      {/* Chat Area */}
      <div className={cn(
        "flex flex-col flex-1",
        showMembers ? "pr-80" : "",
        activeThread ? "pr-96" : "",
        showPinned ? "pr-80" : "",
        showScheduler ? "pr-80" : ""
      )}>
        {/* Channel Header */}
        <div className="h-14 border-b flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-lg font-medium"># general</span>
              <Badge variant="secondary" className="text-xs">Public Channel</Badge>
            </div>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{mockChannelMembers.length} members</span>
              {typingUsers.size > 0 && (
                <span className="text-xs text-blue-600">
                  {typingUsers.size} person{typingUsers.size > 1 ? 's' : ''} typing...
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleStartVideoCall}
            >
              <Phone className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleStartVideoCall}
            >
              <Video className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowMembers(!showMembers)}>
              <Info className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowPinned(!showPinned)}>
              <Pin className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowScheduler(!showScheduler)}>
              <Clock className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Search className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 px-4 py-4">
          <div className="space-y-4">
            {messages.map((message) => (
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
                  <div className="text-sm">
                    <ChatMarkdownRenderer content={message.content} />
                  </div>
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
                  <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => handleStartThread(message)}
                    >
                      <Reply className="h-3 w-3 mr-1" />
                      Reply
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => handlePinMessage(message.id)}
                    >
                      <Pin className="h-3 w-3 mr-1" />
                      {message.isPinned ? 'Unpin' : 'Pin'}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="border-t p-4">
          {showFileUpload ? (
            <div className="mb-4">
              <FileUpload
                workspaceId={currentWorkspaceId}
                onFileUploaded={handleFileUploaded}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFileUpload(false)}
                className="mt-2"
              >
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowFileUpload(true)}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <div className="flex-1">
                <ChatRichTextEditor
                  value={newMessage}
                  onChange={setNewMessage}
                  placeholder="Type a message..."
                  onSend={handleSendMessage}
                />
              </div>
              <Button variant="ghost" size="sm">
                <Smile className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Pinned Messages Sidebar */}
      {showPinned && (
        <PinnedMessages 
          channelId={currentChannelId}
          onMessageSelect={(messageId) => {
            // Scroll to message (in a real app, you'd implement this)
            console.log('Scroll to message:', messageId);
          }}
        />
      )}

      {/* Message Scheduler Sidebar */}
      {showScheduler && (
        <MessageScheduler 
          channelId={currentChannelId}
          channelName="general"
        />
      )}

      {/* Thread Sidebar */}
      {activeThread && (
        <MessageThread
          parentMessage={activeThread}
          channelId={currentChannelId}
          onClose={handleCloseThread}
        />
      )}

      {/* Members Sidebar */}
      {showMembers && (
        <div className="w-80 border-l flex flex-col">
          <div className="p-4 border-b">
            <h3 className="font-medium">Channel Members</h3>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {mockChannelMembers.map((member) => (
                <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent">
                  <div className="relative">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.avatar} alt={member.name} />
                      <AvatarFallback className="text-xs">
                        {member.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className={cn(
                      "absolute bottom-0 right-0 h-2 w-2 rounded-full border border-background",
                      member.status === "online" && "bg-green-500",
                      member.status === "away" && "bg-yellow-500",
                      member.status === "offline" && "bg-gray-400"
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{member.name}</p>
                    <p className="text-xs text-muted-foreground">{member.role}</p>
                  </div>
                  {typingUsers.has(member.id) && (
                    <div className="text-xs text-blue-600">typing...</div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
      {/* Video Call Modal */}
      {showVideoCall && (
        <VideoCall
          channelId={currentChannelId}
          onClose={handleCloseVideoCall}
        />
      )}
    </div>
  );
}