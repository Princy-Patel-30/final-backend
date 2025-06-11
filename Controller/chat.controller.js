import * as chatService from '../Services/chatService.js';
import { io } from '../Server.js';

// GET /api/chat - List all chats for the user
export async function listChats(req, res) {
  try {
    const userId = req.user.id;
    const chats = await chatService.listChats(userId);
    
    res.status(200).json({
      success: true,
      data: chats,
      count: chats.length
    });
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch chats',
      message: error.message 
    });
  }
}

// POST /api/chat - Create or find chat with another user
export async function createOrFindChat(req, res) {
  try {
    const userId = req.user.id;
    const { otherUserId } = req.body;
    
    if (!otherUserId) {
      return res.status(400).json({ 
        success: false,
        error: 'otherUserId is required' 
      });
    }

    const chat = await chatService.createOrFindChat(userId, otherUserId);
    
    res.status(200).json({
      success: true,
      data: chat
    });
  } catch (error) {
    console.error('Error creating or finding chat:', error);
    
    if (error.message === 'Other user not found') {
      return res.status(404).json({ 
        success: false,
        error: error.message 
      });
    }
    
    if (error.message === 'Cannot create chat with yourself') {
      return res.status(400).json({ 
        success: false,
        error: error.message 
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Failed to create or find chat',
      message: error.message 
    });
  }
}

// GET /api/chat/:chatId - Get details of a specific chat
export async function getChatDetails(req, res) {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;
    
    if (!chatId) {
      return res.status(400).json({ 
        success: false,
        error: 'Chat ID is required' 
      });
    }

    const chat = await chatService.getChatDetails(chatId);
    
    if (!chat) {
      return res.status(404).json({ 
        success: false,
        error: 'Chat not found' 
      });
    }
    
    // Verify user is a participant
    const isParticipant = chat.participants.some(p => p.user.id === userId);
    if (!isParticipant) {
      return res.status(403).json({ 
        success: false,
        error: 'Unauthorized access to this chat' 
      });
    }
    
    res.status(200).json({
      success: true,
      data: chat
    });
  } catch (error) {
    console.error('Error fetching chat details:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch chat details',
      message: error.message 
    });
  }
}

// GET /api/chat/:chatId/messages - List messages in a chat with pagination
export async function listMessages(req, res) {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100); // Max 100 messages per request
    
    if (!chatId) {
      return res.status(400).json({ 
        success: false,
        error: 'Chat ID is required' 
      });
    }
    
    // Verify user is a participant
    const chat = await chatService.getChatDetails(chatId);
    if (!chat) {
      return res.status(404).json({ 
        success: false,
        error: 'Chat not found' 
      });
    }
    
    const isParticipant = chat.participants.some(p => p.user.id === userId);
    if (!isParticipant) {
      return res.status(403).json({ 
        success: false,
        error: 'Unauthorized access to this chat' 
      });
    }
    
    const messages = await chatService.listMessages(chatId, page, limit);
    
    res.status(200).json({
      success: true,
      data: messages,
      pagination: {
        page,
        limit,
        count: messages.length
      }
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch messages',
      message: error.message 
    });
  }
}

// POST /api/chat/:chatId/messages - Send a message in a chat (HTTP endpoint)
export async function sendMessage(req, res) {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;
    const { content } = req.body;
    
    if (!chatId) {
      return res.status(400).json({ 
        success: false,
        error: 'Chat ID is required' 
      });
    }
    
    if (!content?.trim()) {
      return res.status(400).json({ 
        success: false,
        error: 'Message content is required' 
      });
    }
    
    const message = await chatService.sendMessage(chatId, userId, content);
    
    // Emit the message to all participants via Socket.IO
    const participants = await chatService.getChatParticipants(chatId);
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

    // Emit to all participants
    participants.forEach((participant) => {
      io.to(participant.id).emit('receive_message', messageData);
    });

    // Also emit to the chat room
    io.to(chatId).emit('new_message', messageData);
    
    res.status(201).json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Error sending message:', error);
    
    if (error.message === 'User is not a participant in this chat') {
      return res.status(403).json({ 
        success: false,
        error: error.message 
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Failed to send message',
      message: error.message 
    });
  }
}

// GET /api/chat/search/:query - Search for users to start a chat
export async function searchUsers(req, res) {
  try {
    const { query } = req.params;
    const userId = req.user.id;
    
    if (!query || query.length < 2) {
      return res.status(400).json({ 
        success: false,
        error: 'Search query must be at least 2 characters' 
      });
    }
    
    // Search for users by name or email (excluding current user)
    const users = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: userId } },
          {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } }
            ]
          }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true
      },
      take: 10 // Limit results
    });
    
    res.status(200).json({
      success: true,
      data: users,
      count: users.length
    });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to search users',
      message: error.message 
    });
  }
}

// DELETE /api/chat/:chatId - Delete a chat (optional feature)
export async function deleteChat(req, res) {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;
    
    if (!chatId) {
      return res.status(400).json({ 
        success: false,
        error: 'Chat ID is required' 
      });
    }
    
    // Verify user is a participant
    const chat = await chatService.getChatDetails(chatId);
    if (!chat) {
      return res.status(404).json({ 
        success: false,
        error: 'Chat not found' 
      });
    }
    
    const isParticipant = chat.participants.some(p => p.user.id === userId);
    if (!isParticipant) {
      return res.status(403).json({ 
        success: false,
        error: 'Unauthorized access to this chat' 
      });
    }
    
    // Delete the chat (this will cascade delete messages and participants)
    await prisma.chat.delete({
      where: { id: chatId }
    });
    
    // Notify other participants
    const participants = await chatService.getChatParticipants(chatId);
    participants.forEach((participant) => {
      if (participant.id !== userId) {
        io.to(participant.id).emit('chat_deleted', { chatId });
      }
    });
    
    res.status(200).json({
      success: true,
      message: 'Chat deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting chat:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete chat',
      message: error.message 
    });
  }
}