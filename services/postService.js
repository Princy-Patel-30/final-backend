import streamifier from 'streamifier';
import cloudinary from '../Config/cloudinary.js';
import prisma from '../Config/db.js';


const uploadToCloudinary = async (fileBuffer) => {
  try {
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: 'auto', folder: 'sociofeed-posts' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      streamifier.createReadStream(fileBuffer).pipe(stream);
    });
    return result;
  } catch (error) {
    throw new Error(`Cloudinary upload failed: ${error.message}`);
  }
};

export const createPost = async (userId, content, files = []) => {
  if (!content && files.length === 0) {
    throw new Error('Post must have content or media.');
  }

  if (files.length > 4) {
    throw new Error('You can upload a maximum of 4 images.');
  }

  const uploadedMedia = [];
  for (const file of files) {
    const result = await uploadToCloudinary(file.buffer);
    uploadedMedia.push({
      url: result.secure_url,
      type: result.resource_type.toUpperCase(),
    });
  }

  return await prisma.post.create({
    data: {
      content,
      userId,
      media: {
        create: uploadedMedia,
      },
    },
    include: {
      media: true,
      user: {
        select: {
          name: true,
          avatarUrl: true,
        },
      },
      _count: {
        select: {
          likes: true,
          comments: true,
        },
      },
    },
  });
};

export const getHomeFeed = async (userId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const following = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });

  const followingIds = [...new Set([...following.map(f => f.followingId), userId])];

  const posts = await prisma.post.findMany({
    where: {
      userId: { in: followingIds },
    },
    skip,
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          name: true,
          avatarUrl: true,
        },
      },
      media: true,
      likes: {
        select: {
          userId: true,
        },
      },
      _count: {
        select: {
          likes: true,
          comments: true,
        },
      },
    },
  });

  return posts.map(post => ({
    ...post,
    likedByCurrentUser: post.likes.some(like => like.userId === userId),
  }));
};

export const getPostDetails = async (postId, userId) => {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      user: {
        select: {
          name: true,
          avatarUrl: true,
        },
      },
      media: true,
      _count: {
        select: {
          likes: true,
          comments: true,
        },
      },
      likes: userId
        ? {
            where: { userId },
            select: { id: true },
          }
        : false,
    },
  });

  if (!post) throw new Error('Post not found');

  return {
    ...post,
    likedByCurrentUser: userId ? post.likes.length > 0 : false,
  };
};

export const addComment = async (postId, userId, content) => {
  if (!content) throw new Error('Comment content is required.');

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new Error('Post not found.');

  return await prisma.comment.create({
    data: {
      content,
      postId,
      userId,
    },
    include: {
      user: {
        select: {
          name: true,
          avatarUrl: true,
        },
      },
    },
  });
};

export const editComment = async (commentId, userId, content) => {
  if (!content || content.trim() === '') throw new Error('Content cannot be empty');

  const existing = await prisma.comment.findUnique({
    where: { id: commentId },
  });

  if (!existing) throw new Error('Comment not found');
  if (existing.userId !== userId) throw new Error('You are not allowed to edit this comment');

  return await prisma.comment.update({
    where: { id: commentId },
    data: {
      content: content.trim(),
      updatedAt: new Date(),
    },
  });
};

export const deleteComment = async (commentId, userId) => {
  try {
    // First, fetch the comment with all necessary relationships
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        post: {
          select: {
            userId: true,
          },
        },
        commentLikes: true, // Include related comment likes
      },
    });

    if (!comment) {
      throw new Error('Comment not found');
    }

    // Check authorization (comment owner or post owner can delete)
    if (comment.userId !== userId && comment.post.userId !== userId) {
      throw new Error('Unauthorized to delete this comment');
    }

    // Use a transaction to ensure all related data is deleted properly
    const result = await prisma.$transaction(async (tx) => {
      // First delete all comment likes associated with this comment
      if (comment.commentLikes.length > 0) {
        await tx.commentLike.deleteMany({
          where: { commentId: commentId }
        });
      }

      // Then delete the comment itself
      const deletedComment = await tx.comment.delete({
        where: { id: commentId }
      });

      return deletedComment;
    });

    return result;
  } catch (error) {
    console.error('Delete comment error:', error);
    
    // Handle specific Prisma errors
    if (error.code === 'P2025') {
      throw new Error('Comment not found');
    }
    
    if (error.code === 'P2003') {
      throw new Error('Cannot delete comment due to foreign key constraint');
    }

    if (error.message === 'Comment not found' || 
        error.message === 'Unauthorized to delete this comment') {
      throw error;
    }
    
    throw new Error('Failed to delete comment');
  }
};

export const likePost = async (userId, postId) => {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new Error('Post not found');

  await prisma.like.create({
    data: { userId, postId },
  });

  const likesCount = await prisma.like.count({ where: { postId } });
  const likedUsers = await prisma.like.findMany({
    where: { postId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return {
    likesCount,
    likedUsers: likedUsers.map(like => like.user),
  };
};

export const unlikePost = async (userId, postId) => {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new Error('Post not found');

  await prisma.like.delete({
    where: {
      userId_postId: { userId, postId },
    },
  });

  return await prisma.like.count({ where: { postId } });
};

export const getPostComments = async (postId) => {
  return await prisma.comment.findMany({
    where: { postId },
    orderBy: { createdAt: 'asc' },
    include: {
      user: {
        select: {
          name: true,
          avatarUrl: true,
        },
      },
    },
  });
};

export const savePost = async (userId, postId) => {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new Error('Post not found');

  // Check if already saved
  const alreadySaved = await prisma.savedPost.findUnique({
    where: {
      userId_postId: { userId, postId }
    }
  });

  if (alreadySaved) {
    throw new Error('Post already saved');
  
  }

  return await prisma.savedPost.create({
    data: { userId, postId },
  });
};

export const getSavedPosts = async (userId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const saved = await prisma.savedPost.findMany({
    where: { userId },
    skip,
    take: limit,
    include: {
      post: {
        include: {
          user: {
            select: {
              name: true,
              avatarUrl: true,
            },
          },
          media: true,
          likes: {
            select: {
              userId: true,
            },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return saved.map(s => ({
    ...s.post,
    likedByCurrentUser: s.post.likes.some(like => like.userId === userId),
  }));
};

export const getUserPosts = async (userId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const posts = await prisma.post.findMany({
    where: {
      userId: userId,
    },
    skip,
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          name: true,
          avatarUrl: true,
        },
      },
      media: true,
      likes: {
        select: {
          userId: true,
        },
      },
      _count: {
        select: {
          likes: true,
          comments: true,
        },
      },
    },
  });

  return posts.map(post => ({
    ...post,
    likedByCurrentUser: post.likes.some(like => like.userId === userId),
  }));
};