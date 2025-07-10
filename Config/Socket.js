import { Server } from 'socket.io';
import prisma from './db.js';
import env from './env.js';
import { verifyToken } from '../Utils/jwt.js';

export const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: env.CORS_ORIGIN,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Store connected users
  const connectedUsers = new Map();

  // Socket.IO middleware to authenticate connections
  io.use(async (socket, next) => {
    try {
      const accessToken = socket.handshake.auth.accessToken || 
        socket.handshake.headers.cookie
          ?.split('; ')
          ?.find((c) => c.startsWith('accessToken='))
          ?.split('=')[1];

      if (!accessToken) {
        return next(new Error('Access token missing'));
      }

      const { id } = verifyToken(accessToken, 'access');
      
      // Verify user exists in database
      const user = await prisma.user.findUnique({
        where: { id },
        select: { id: true, name: true, avatarUrl: true }
      });

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = id;
      socket.user = user;
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`New client connected: ${socket.id}, userId: ${socket.userId}`);

    // Store user connection
    connectedUsers.set(socket.userId, {
      socketId: socket.id,
      user: socket.user,
      lastSeen: new Date()
    });

    // Join user to their personal room
    socket.join(socket.userId);

    // Join user to all their chat rooms
    joinUserChats(socket);

    // Notify others that user is online
    socket.broadcast.emit('user_online', {
      userId: socket.userId,
      user: socket.user
    });

    // Handle sending messages
    socket.on('send_message', async (data) => {
      try {
        await handleSendMessage(socket, data, io);
      } catch (error) {
        console.error('Error in send_message handler:', error);
        socket.emit('error', { 
          message: 'Failed to send message',
          details: error.message 
        });
      }
    });

    // Handle joining specific chat rooms
    socket.on('join_chat', async (data) => {
      try {
        await handleJoinChat(socket, data);
      } catch (error) {
        console.error('Error in join_chat handler:', error);
        socket.emit('error', { 
          message: 'Failed to join chat',
          details: error.message 
        });
      }
    });

    // Handle typing indicators
    socket.on('typing_start', (data) => {
      const { chatId } = data;
      socket.to(chatId).emit('user_typing', {
        userId: socket.userId,
        user: socket.user,
        chatId
      });
    });

    socket.on('typing_stop', (data) => {
      const { chatId } = data;
      socket.to(chatId).emit('user_stopped_typing', {
        userId: socket.userId,
        chatId
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}, userId: ${socket.userId}`);
      
      // Remove from connected users
      connectedUsers.delete(socket.userId);
      
      // Notify others that user is offline
      socket.broadcast.emit('user_offline', {
        userId: socket.userId
      });
    });
  });

  // Helper function to join user to all their chats
  async function joinUserChats(socket) {
    try {
      const userChats = await prisma.chatParticipant.findMany({
        where: { userId: socket.userId },
        select: { chatId: true }
      });

      userChats.forEach(({ chatId }) => {
        socket.join(chatId);
      });

      console.log(`User ${socket.userId} joined ${userChats.length} chat rooms`);
    } catch (error) {
      console.error('Error joining user chats:', error);
    }
  }

  // Helper function to handle message sending
  async function handleSendMessage(socket, data, io) {
    const { chatId, content, receiverId } = data;
    const userId = socket.userId;

    // Validate input
    if (!chatId || !content?.trim()) {
      socket.emit('error', { message: 'Chat ID and content are required' });
      return;
    }

    // Verify chat exists and user is participant
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        participants: {
          where: { userId },
          select: { userId: true }
        },
      },
    });

    if (!chat || chat.participants.length === 0) {
      socket.emit('error', { message: 'Invalid chat or unauthorized access' });
      return;
    }

    // Create message in database
    const message = await prisma.message.create({
      data: {
        chatId,
        userId,
        content: content.trim(),
      },
      include: {
        user: { 
          select: { id: true, name: true, avatarUrl: true } 
        },
      },
    });

    // Get all participants for this chat
    const participants = await prisma.chatParticipant.findMany({
      where: { chatId },
      select: { userId: true },
    });

    // Emit message to all participants (including sender for confirmation)
    const messageData = {
      chatId,
      message: {
        id: message.id,
        content: message.content,
        createdAt: message.createdAt,
        user: message.user,
        chatId: message.chatId
      }
    };

    participants.forEach((participant) => {
      io.to(participant.userId).emit('receive_message', messageData);
    });

    // Also emit to the chat room
    io.to(chatId).emit('new_message', messageData);

    console.log(`Message sent in chat ${chatId} by user ${userId}`);
  }

  // Helper function to handle joining chat
  async function handleJoinChat(socket, data) {
    const { chatId } = data;
    const userId = socket.userId;

    if (!chatId) {
      socket.emit('error', { message: 'Chat ID is required' });
      return;
    }

    // Verify user is participant in this chat
    const participant = await prisma.chatParticipant.findUnique({
      where: {
        chatId_userId: {
          chatId,
          userId
        }
      }
    });

    if (!participant) {
      socket.emit('error', { message: 'Unauthorized access to chat' });
      return;
    }

    // Join the chat room
    socket.join(chatId);
    socket.emit('joined_chat', { chatId });
    
    console.log(`User ${userId} joined chat room ${chatId}`);
  }

  // Expose helper function to get connected users
  io.getConnectedUsers = () => connectedUsers;

  return io;
};