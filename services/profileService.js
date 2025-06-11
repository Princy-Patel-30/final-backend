import prisma from '../Config/db.js';
import { uploadBufferToCloudinary } from '../Utils/uploadtocloudinary.js';

// Get user profile by user ID
// Get user profile by user ID
export const getProfileById = async (userId, currentUserId = null) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      bio: true,
      createdAt: true,
      posts: {
        select: {
          id: true,
          content: true,
          createdAt: true,
          media: true,
          _count: { select: { likes: true, comments: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
      _count: { select: { posts: true, followers: true, following: true } },
      // Add isFollowing field if currentUserId is provided
      ...(currentUserId && {
        followers: {
          where: { followerId: currentUserId },
          select: { followerId: true },
        },
      }),
    },
  });
  if (!user) throw new Error('User not found');
  return {
    ...user,
    isFollowing: currentUserId ? !!user.followers?.length : false,
  };
};

// Search users by name or bio
export const searchUsers = async (query = '', page = 1, limit = 10, currentUserId = null) => {
  if (!Number.isInteger(page) || page < 1) throw new Error('Invalid page number');
  if (!Number.isInteger(limit) || limit < 1) throw new Error('Invalid limit value');

  if (!query || query.trim() === '') {
    return { usersfound: 0, users: [] };
  }

  const trimmedQuery = query.trim();

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: trimmedQuery, mode: 'insensitive' } },
        { bio: { contains: trimmedQuery, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      name: true,
      bio: true,
      avatarUrl: true,
      email: true,
      // Add isFollowing field
      followers: currentUserId
        ? {
            where: { followerId: currentUserId },
            select: { followerId: true },
          }
        : false,
    },
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { name: 'asc' },
  });

  return {
    usersfound: users.length,
    users: users.map((user) => ({
      ...user,
      isFollowing: currentUserId ? !!user.followers?.length : false,
    })),
  };
};
// Update user profile
export const updateUserProfile = async (userId, { name, bio, avatarUrl, fileBuffer }) => {
  let uploadedAvatarUrl;

  if (fileBuffer) {
    const result = await uploadBufferToCloudinary(fileBuffer, 'avatars');
    uploadedAvatarUrl = result.secure_url;
  }

  if (name) {
    const existingUser = await prisma.user.findUnique({
      where: { name },
      select: { id: true },
    });

    if (existingUser && existingUser.id !== userId) {
      throw new Error('Username already exists');
    }
  }

  if (avatarUrl && !fileBuffer) {
    try {
      new URL(avatarUrl);
      if (!avatarUrl.startsWith('https://res.cloudinary.com/')) {
        throw new Error('Avatar URL must be from Cloudinary');
      }
    } catch {
      throw new Error('Invalid avatar URL format');
    }
  }

  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (bio !== undefined) updateData.bio = bio;
  if (uploadedAvatarUrl) {
    updateData.avatarUrl = uploadedAvatarUrl;
  } else if (avatarUrl !== undefined) {
    updateData.avatarUrl = avatarUrl;
  }

  return prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      name: true,
      bio: true,
      avatarUrl: true,
      email: true,
      _count: {
        select: {
          posts: true,
          followers: true,
          following: true,
        },
      },
    },
  });
};



// Follow a user by ID
export const followUser = async (followerId, followingId) => {
  if (followerId === followingId) {
    throw new Error("Can't follow yourself");
  }

  const existingFollow = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId,
        followingId,
      },
    },
  });

  if (existingFollow) {
    throw new Error('You are already following this user');
  }

  const newFollow = await prisma.follow.create({
    data: {
      follower: { connect: { id: followerId } },
      following: { connect: { id: followingId } },
    },
    include: {
      following: { select: { name: true } },
    },
  });

  return { followed: true, targetUser: newFollow.following.name };
};

// Unfollow a user by ID
export const unfollowUser = async (followerId, followingId) => {
  const targetUser = await prisma.user.findUnique({
    where: { id: followingId },
    select: { id: true, name: true },
  });

  if (!targetUser) {
    throw new Error('User to unfollow does not exist');
  }
  if (followerId === targetUser.id) {
    throw new Error("Can't unfollow yourself");
  }

  const existingFollow = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId,
        followingId: targetUser.id,
      },
    },
  });

  if (!existingFollow) {
    throw new Error('You are not following this user');
  }

  await prisma.follow.delete({
    where: {
      followerId_followingId: {
        followerId,
        followingId: targetUser.id,
      },
    },
  });

  return { unfollowed: true, targetUser: targetUser.name };
};

// Get followers list with pagination
export const getFollowers = async (userId, page = 1, limit = 10) => {
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid user ID');
  }
  if (!Number.isInteger(page) || page < 1) {
    throw new Error('Invalid page number');
  }
  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error('Invalid limit value');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, avatarUrl:true, name: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const totalFollowers = await prisma.follow.count({
    where: { followingId: userId },
  });

  const followers = await prisma.follow.findMany({
    where: { followingId: userId },
    include: {
      follower: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
        },
      },
    },
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { createdAt: 'desc' },
  });

  const formattedFollowers = followers.map(f => ({
    id:  f.follower.id,
    name: f.follower.name,
    avatarUrl: f.follower.avatarUrl || null,
  }));

  return {
    totalFollowers,
    followers: formattedFollowers,
  };
};

// Get following list with pagination
export const getFollowing = async (userId, page = 1, limit = 10) => {
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid user ID');
  }
  if (!Number.isInteger(page) || page < 1) {
    throw new Error('Invalid page number');
  }
  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error('Invalid limit value');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const totalFollowing = await prisma.follow.count({
    where: { followerId: userId },
  });

  const following = await prisma.follow.findMany({
    where: { followerId: userId },
    include: {
      following: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
        },
      },
    },
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { createdAt: 'desc' },
  });

  const formattedFollowing = following.map(f => ({
    id: f.following.id,
    name: f.following.name,
    avatarUrl: f.following.avatarUrl || null,
  }));

  return {
    totalFollowing,
    following: formattedFollowing,
  };
};