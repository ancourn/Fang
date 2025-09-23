"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/contexts/AuthContext";

interface UseSocketProps {
  autoConnect?: boolean;
}

export function useSocket({ autoConnect = true }: UseSocketProps = {}) {
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const [lastNotification, setLastNotification] = useState<any>(null);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(() => new Set());
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (!user) return;

    // Get auth token from cookie
    const getAuthToken = () => {
      const cookies = document.cookie.split(';');
      const authCookie = cookies.find(cookie => cookie.trim().startsWith('auth-token='));
      return authCookie ? authCookie.split('=')[1] : null;
    };

    const token = getAuthToken();
    if (!token) return;

    // Initialize socket connection
    socketRef.current = io(process.env.NODE_ENV === "production" ? "" : "http://localhost:3000", {
      auth: {
        token: token
      },
      transports: ["websocket", "polling"]
    });

    const socket = socketRef.current;

    // Connection events
    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
      setIsConnected(false);
    });

    // Message events
    socket.on("new_message", (message) => {
      setLastMessage(message);
    });

    // Notification events
    socket.on("new_notification", (notification) => {
      setLastNotification(notification);
      // You could also show a toast notification here
      console.log("New notification:", notification);
    });

    // Typing events
    socket.on("user_typing", (data) => {
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        if (data.isTyping) {
          newSet.add(data.userId);
        } else {
          newSet.delete(data.userId);
        }
        return newSet;
      });
    });

    // User status events
    socket.on("user_status_updated", (data) => {
      console.log("User status updated:", data);
    });

    // User join/leave events
    socket.on("user_joined", (data) => {
      console.log("User joined:", data);
      setOnlineUsers(prev => new Set(prev).add(data.userId));
    });

    socket.on("user_left", (data) => {
      console.log("User left:", data);
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(data.userId);
        return newSet;
      });
    });

    // Error handling
    socket.on("error", (error) => {
      console.error("Socket error:", error);
    });

    // Connection confirmation
    socket.on("connected", (data) => {
      console.log("Socket connection confirmed:", data);
      // Set user status to online
      socket.emit("update_status", { status: "online" });
    });

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
    };
  }, [user]);

  // Socket actions
  const joinChannel = (channelId: string) => {
    if (socketRef.current) {
      socketRef.current.emit("join_channel", channelId);
    }
  };

  const leaveChannel = (channelId: string) => {
    if (socketRef.current) {
      socketRef.current.emit("leave_channel", channelId);
    }
  };

  const sendMessage = (data: { content: string; channelId?: string; receiverId?: string; threadId?: string }) => {
    if (socketRef.current) {
      socketRef.current.emit("send_message", data);
    }
  };

  const addReaction = (data: { messageId: string; emoji: string }) => {
    if (socketRef.current) {
      socketRef.current.emit("add_reaction", data);
    }
  };

  const startTyping = (data: { channelId?: string; receiverId?: string }) => {
    if (socketRef.current) {
      socketRef.current.emit("typing_start", data);
    }
  };

  const stopTyping = (data: { channelId?: string; receiverId?: string }) => {
    if (socketRef.current) {
      socketRef.current.emit("typing_stop", data);
    }
  };

  const updateStatus = (data: { status: string; statusMessage?: string }) => {
    if (socketRef.current) {
      socketRef.current.emit("update_status", data);
    }
  };

  const createNotification = (data: { 
    type: string; 
    title: string; 
    content?: string; 
    targetUserId?: string 
  }) => {
    if (socketRef.current) {
      socketRef.current.emit("create_notification", data);
    }
  };

  return {
    socket: socketRef.current,
    isConnected,
    lastMessage,
    lastNotification,
    typingUsers,
    onlineUsers,
    joinChannel,
    leaveChannel,
    sendMessage,
    addReaction,
    startTyping,
    stopTyping,
    updateStatus,
    createNotification
  };
}