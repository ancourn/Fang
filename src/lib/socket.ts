import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { db } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userEmail?: string;
}

interface MessageData {
  content: string;
  channelId?: string;
  receiverId?: string;
  threadId?: string;
}

export const setupSocket = (io: Server) => {
  // Authentication middleware
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
      socket.userId = decoded.userId;
      socket.userEmail = decoded.email;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log('User connected:', socket.userId, socket.userEmail);

    // Join user to their personal room for direct messages
    socket.join(`user:${socket.userId}`);

    // Handle joining a channel
    socket.on('join_channel', async (channelId: string) => {
      try {
        // Verify user has access to this channel
        const channelMember = await db.channelMember.findUnique({
          where: {
            userId_channelId: {
              userId: socket.userId!,
              channelId: channelId
            }
          }
        });

        if (channelMember) {
          socket.join(`channel:${channelId}`);
          console.log(`User ${socket.userId} joined channel ${channelId}`);
          
          // Notify other users in the channel
          socket.to(`channel:${channelId}`).emit('user_joined', {
            userId: socket.userId,
            userEmail: socket.userEmail,
            timestamp: new Date().toISOString()
          });
        } else {
          socket.emit('error', { message: 'Access denied to this channel' });
        }
      } catch (error) {
        console.error('Error joining channel:', error);
        socket.emit('error', { message: 'Failed to join channel' });
      }
    });

    // Handle leaving a channel
    socket.on('leave_channel', (channelId: string) => {
      socket.leave(`channel:${channelId}`);
      console.log(`User ${socket.userId} left channel ${channelId}`);
      
      // Notify other users in the channel
      socket.to(`channel:${channelId}`).emit('user_left', {
        userId: socket.userId,
        userEmail: socket.userEmail,
        timestamp: new Date().toISOString()
      });
    });

    // Handle sending messages
    socket.on('send_message', async (data: MessageData) => {
      try {
        const { content, channelId, receiverId, threadId } = data;

        if (!content.trim()) {
          socket.emit('error', { message: 'Message content cannot be empty' });
          return;
        }

        let message;
        let targetRoom;

        if (channelId) {
          // Channel message
          message = await db.message.create({
            data: {
              content,
              channelId,
              userId: socket.userId!,
              threadId: threadId || null
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatar: true
                }
              }
            }
          });
          targetRoom = `channel:${channelId}`;
        } else if (receiverId) {
          // Direct message
          message = await db.directMessage.create({
            data: {
              content,
              senderId: socket.userId!,
              receiverId,
            },
            include: {
              sender: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatar: true
                }
              },
              receiver: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatar: true
                }
              }
            }
          });
          targetRoom = `user:${receiverId}`;
        } else {
          socket.emit('error', { message: 'Message must be sent to a channel or user' });
          return;
        }

        // Broadcast message to the target room
        io.to(targetRoom).emit('new_message', {
          id: message.id,
          content: message.content,
          userId: message.userId || message.senderId,
          userName: message.user?.name || message.sender?.name,
          userEmail: message.user?.email || message.sender?.email,
          userAvatar: message.user?.avatar || message.sender?.avatar,
          timestamp: message.createdAt,
          channelId,
          receiverId,
          threadId: message.threadId
        });

        // Check for mentions and create notifications
        const mentionRegex = /@(\w+)/g;
        const mentions = content.match(mentionRegex);
        
        if (mentions) {
          for (const mention of mentions) {
            const mentionedEmail = mention.substring(1); // Remove @
            
            // Find the mentioned user
            const mentionedUser = await db.user.findUnique({
              where: { email: mentionedEmail }
            });
            
            if (mentionedUser && mentionedUser.id !== socket.userId) {
              // Create mention notification
              await db.notification.create({
                data: {
                  type: 'mention',
                  title: `You were mentioned by ${message.user?.name || message.sender?.name}`,
                  content: message.content,
                  userId: mentionedUser.id
                }
              });
              
              // Send real-time notification if user is online
              io.to(`user:${mentionedUser.id}`).emit('new_notification', {
                type: 'mention',
                title: `You were mentioned by ${message.user?.name || message.sender?.name}`,
                content: message.content,
                timestamp: new Date().toISOString()
              });
            }
          }
        }

        console.log(`Message sent from ${socket.userId} to ${targetRoom}`);

      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle message reactions
    socket.on('add_reaction', async (data: { messageId: string; emoji: string }) => {
      try {
        const { messageId, emoji } = data;

        // Check if reaction already exists
        const existingReaction = await db.messageReaction.findUnique({
          where: {
            messageId_userId_emoji: {
              messageId,
              userId: socket.userId!,
              emoji
            }
          }
        });

        if (existingReaction) {
          // Remove reaction
          await db.messageReaction.delete({
            where: {
              messageId_userId_emoji: {
                messageId,
                userId: socket.userId!,
                emoji
              }
            }
          });
        } else {
          // Add reaction
          await db.messageReaction.create({
            data: {
              messageId,
              userId: socket.userId!,
              emoji
            }
          });
        }

        // Get updated reactions count
        const reactions = await db.messageReaction.groupBy({
          by: ['emoji'],
          where: { messageId },
          _count: { emoji: true }
        });

        // Broadcast reaction update
        io.emit('reaction_updated', {
          messageId,
          reactions: reactions.map(r => ({
            emoji: r.emoji,
            count: r._count.emoji
          }))
        });

      } catch (error) {
        console.error('Error handling reaction:', error);
        socket.emit('error', { message: 'Failed to update reaction' });
      }
    });

    // Handle typing indicators
    socket.on('typing_start', (data: { channelId?: string; receiverId?: string }) => {
      const room = data.channelId ? `channel:${data.channelId}` : `user:${data.receiverId}`;
      socket.to(room).emit('user_typing', {
        userId: socket.userId,
        userEmail: socket.userEmail,
        isTyping: true
      });
    });

    socket.on('typing_stop', (data: { channelId?: string; receiverId?: string }) => {
      const room = data.channelId ? `channel:${data.channelId}` : `user:${data.receiverId}`;
      socket.to(room).emit('user_typing', {
        userId: socket.userId,
        userEmail: socket.userEmail,
        isTyping: false
      });
    });

    // Handle user status updates
    socket.on('update_status', async (data: { status: string; statusMessage?: string }) => {
      try {
        await db.user.update({
          where: { id: socket.userId! },
          data: {
            status: data.status,
            statusMessage: data.statusMessage
          }
        });

        // Broadcast status update to all rooms user is in
        const rooms = Array.from(socket.rooms);
        rooms.forEach(room => {
          if (room.startsWith('channel:') || room.startsWith('user:')) {
            socket.to(room).emit('user_status_updated', {
              userId: socket.userId,
              status: data.status,
              statusMessage: data.statusMessage
            });
          }
        });

      } catch (error) {
        console.error('Error updating status:', error);
        socket.emit('error', { message: 'Failed to update status' });
      }
    });

    // Handle creating notifications
    socket.on('create_notification', async (data: { 
      type: string; 
      title: string; 
      content?: string; 
      targetUserId?: string 
    }) => {
      try {
        const { type, title, content, targetUserId } = data;
        
        // If targetUserId is provided, send notification to that user
        // Otherwise, send to all users in the same workspace
        let targetUsers = [];
        
        if (targetUserId) {
          targetUsers = [targetUserId];
        } else {
          // Get all users in the same workspace as the current user
          const userWorkspaces = await db.userWorkspace.findMany({
            where: { userId: socket.userId! },
            select: { workspaceId: true }
          });
          
          if (userWorkspaces && userWorkspaces.length > 0) {
            const workspaceIds = userWorkspaces.map(uw => uw.workspaceId);
            
            const workspaceUsers = await db.userWorkspace.findMany({
              where: { 
                workspaceId: { in: workspaceIds },
                userId: { not: socket.userId! } // Exclude the current user
              },
              select: { userId: true }
            });
            
            targetUsers = workspaceUsers ? workspaceUsers.map(uw => uw.userId) : [];
          } else {
            targetUsers = [];
          }
        }

        // Create notifications for all target users
        if (targetUsers && targetUsers.length > 0) {
          const notifications = await db.notification.createMany({
            data: targetUsers.map(userId => ({
              type,
              title,
              content,
              userId
            }))
          });
        }

        // Send real-time notifications to online users
        if (targetUsers && targetUsers.length > 0) {
          targetUsers.forEach(userId => {
            io.to(`user:${userId}`).emit('new_notification', {
              type,
              title,
              content,
              timestamp: new Date().toISOString()
            });
          });
        }

        console.log(`Created notifications for ${targetUsers ? targetUsers.length : 0} users`);

      } catch (error) {
        console.error('Error creating notification:', error);
        socket.emit('error', { message: 'Failed to create notification' });
      }
    });

    // Handle video calls
    socket.on('join_call', async (data: { channelId: string }) => {
      try {
        const { channelId } = data;
        
        // Join the call room
        socket.join(`call:${channelId}`);
        
        // Get user info
        const user = await db.user.findUnique({
          where: { id: socket.userId! },
          select: { name: true, email: true, avatar: true }
        });
        
        if (user) {
          // Notify other participants
          socket.to(`call:${channelId}`).emit('call_joined', {
            userId: socket.userId,
            userName: user.name || user.email,
            userAvatar: user.avatar
          });
        }
        
        console.log(`User ${socket.userId} joined call in channel ${channelId}`);
        
      } catch (error) {
        console.error('Error joining call:', error);
        socket.emit('error', { message: 'Failed to join call' });
      }
    });

    socket.on('leave_call', async (data: { channelId: string }) => {
      try {
        const { channelId } = data;
        
        // Leave the call room
        socket.leave(`call:${channelId}`);
        
        // Notify other participants
        socket.to(`call:${channelId}`).emit('call_left', {
          userId: socket.userId
        });
        
        console.log(`User ${socket.userId} left call in channel ${channelId}`);
        
      } catch (error) {
        console.error('Error leaving call:', error);
        socket.emit('error', { message: 'Failed to leave call' });
      }
    });

    socket.on('offer', async (data: { targetUserId: string; offer: RTCSessionDescription; channelId: string }) => {
      try {
        const { targetUserId, offer, channelId } = data;
        
        // Forward offer to target user
        io.to(`user:${targetUserId}`).emit('offer', {
          userId: socket.userId,
          offer,
          channelId
        });
        
        console.log(`Offer sent from ${socket.userId} to ${targetUserId}`);
        
      } catch (error) {
        console.error('Error sending offer:', error);
        socket.emit('error', { message: 'Failed to send offer' });
      }
    });

    socket.on('answer', async (data: { targetUserId: string; answer: RTCSessionDescription; channelId: string }) => {
      try {
        const { targetUserId, answer, channelId } = data;
        
        // Forward answer to target user
        io.to(`user:${targetUserId}`).emit('answer', {
          userId: socket.userId,
          answer,
          channelId
        });
        
        console.log(`Answer sent from ${socket.userId} to ${targetUserId}`);
        
      } catch (error) {
        console.error('Error sending answer:', error);
        socket.emit('error', { message: 'Failed to send answer' });
      }
    });

    socket.on('ice_candidate', async (data: { targetUserId: string; candidate: RTCIceCandidate; channelId: string }) => {
      try {
        const { targetUserId, candidate, channelId } = data;
        
        // Forward ICE candidate to target user
        io.to(`user:${targetUserId}`).emit('ice_candidate', {
          userId: socket.userId,
          candidate,
          channelId
        });
        
        console.log(`ICE candidate sent from ${socket.userId} to ${targetUserId}`);
        
      } catch (error) {
        console.error('Error sending ICE candidate:', error);
        socket.emit('error', { message: 'Failed to send ICE candidate' });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.userId);
      
      // Update user status to offline
      if (socket.userId) {
        db.user.update({
          where: { id: socket.userId },
          data: { status: 'offline' }
        }).catch(err => console.error('Error updating user status on disconnect:', err));
      }
    });

    // Send welcome message
    socket.emit('connected', {
      message: 'Connected to Feishu Clone messaging',
      userId: socket.userId,
      timestamp: new Date().toISOString()
    });
  });
};