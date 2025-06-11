import prisma from '../Config/db.js';

export async function listChats(userId) {
  try {
    const chats = await prisma.chat.findMany({
      where: {
        participants: {
          some: { userId },
        },
      },
      include: {
        participants: {
          include: { 
            user: { 
              select: { id: true, name: true, avatarUrl: true } 
            } 
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            user: { 
              select: { id: true, name: true } 
            }
          }
        },
        _count: {
          select: { messages: true }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    // Transform the data to include other participant info and last message
    return chats.map(chat => {
      const otherParticipant = chat.participants.find(p => p.userId !== userId);
      const lastMessage = chat.messages[0] || null;
      
      return {
        id: chat.id,
        createdAt: chat.createdAt,
        otherUser: otherParticipant?.user || null,
        lastMessage,
        messageCount: chat._count.messages,
        participants: chat.participants
      };
    });
  } catch (error) {
    console.error('Error in listChats:', error);
    throw error;
  }
}

export async function createOrFindChat(userId, otherUserId) {
  try {
    // Validate that otherUserId exists
    const otherUser = await prisma.user.findUnique({
      where: { id: otherUserId },
      select: { id: true, name: true, avatarUrl: true }
    });

    if (!otherUser) {
      throw new Error('Other user not found');
    }

    // Prevent creating chat with oneself
    if (userId === otherUserId) {
      throw new Error('Cannot create chat with yourself');
    }

    // Try to find existing chat between these two users
    let chat = await prisma.chat.findFirst({
      where: {
        AND: [
          { participants: { some: { userId } } },
          { participants: { some: { userId: otherUserId } } },
          {
            participants: {
              count: {
                equals: 2
              }
            }
          }
        ]
      },
      include: {
        participants: {
          include: { 
            user: { 
              select: { id: true, name: true, avatarUrl: true } 
            } 
          }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            user: { 
              select: { id: true, name: true } 
            }
          }
        },
      }
    });

    // If chat doesn't exist, create it
    if (!chat) {
      chat = await prisma.$transaction(async (tx) => {
        const newChat = await tx.chat.create({
          data: {
            participants: {
              create: [
                { userId },
                { userId: otherUserId }
              ],
            },
          },
          include: {
            participants: {
              include: { 
                user: { 
                  select: { id: true, name: true, avatarUrl: true } 
                } 
              }
            },
            messages: {
              include: {
                user: { 
                  select: { id: true, name: true } 
                }
              }
            },
          }
        });
        return newChat;
      });
    }

    return chat;
  } catch (error) {
    console.error('Error in createOrFindChat:', error);
    throw error;
  }
}

export async function getChatDetails(chatId) {
  try {
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        participants: {
          include: { 
            user: { 
              select: { id: true, name: true, avatarUrl: true } 
            } 
          }
        },
        _count: {
          select: { messages: true }
        }
      }
    });

    return chat;
  } catch (error) {
    console.error('Error in getChatDetails:', error);
    throw error;
  }
}

export async function listMessages(chatId, page = 1, limit = 50) {
  try {
    const offset = (page - 1) * limit;
    
    const messages = await prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
      include: {
        user: { 
          select: { id: true, name: true, avatarUrl: true } 
        }
      }
    });

    // Return messages in ascending order (oldest first)
    return messages.reverse();
  } catch (error) {
    console.error('Error in listMessages:', error);
    throw error;
  }
}

export async function sendMessage(chatId, userId, content) {
  try {
    // Validate inputs
    if (!chatId || !userId || !content?.trim()) {
      throw new Error('Chat ID, user ID, and content are required');
    }

    // Verify user is participant in the chat
    const participant = await prisma.chatParticipant.findUnique({
      where: {
        chatId_userId: {
          chatId,
          userId
        }
      }
    });

    if (!participant) {
      throw new Error('User is not a participant in this chat');
    }

    // Create the message
    const message = await prisma.$transaction(async (tx) => {
      // Create message
      const newMessage = await tx.message.create({
        data: {
          chatId,
          userId,
          content: content.trim(),
        },
        include: {
          user: { 
            select: { id: true, name: true, avatarUrl: true } 
          }
        }
      });

      // Update chat's updatedAt timestamp
      await tx.chat.update({
        where: { id: chatId },
        data: { updatedAt: new Date() }
      });

      return newMessage;
    });

    return message;
  } catch (error) {
    console.error('Error in sendMessage:', error);
    throw error;
  }
}

export async function markMessageAsRead(chatId, userId, messageId) {
  try {
    // This would require a read receipts table - implement if needed
    // For now, just verify the message exists
    const message = await prisma.message.findFirst({
      where: {
        AND: [
          { id: messageId },
          { chatId },
          { userId: { not: userId } } // Can't mark own messages as read
        ]
      }
    });

    return message ? true : false;
  } catch (error) {
    console.error('Error in markMessageAsRead:', error);
    throw error;
  }
}

export async function getChatParticipants(chatId) {
  try {
    const participants = await prisma.chatParticipant.findMany({
      where: { chatId },
      include: {
        user: {
          select: { id: true, name: true, avatarUrl: true }
        }
      }
    });

    return participants.map(p => p.user);
  } catch (error) {
    console.error('Error in getChatParticipants:', error);
    throw error;
  }
}