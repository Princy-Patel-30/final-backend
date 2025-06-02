import prisma from '../Config/db.js';
import { uploadBufferToCloudinary } from '../Utils/uploadtocloudinary.js';

// Get user profile by username
export const getProfileByUsername = async (username) => {
  return prisma.user.findUnique({
    where: { name: username },
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      bio: true,
      posts: {
        select: {
          id: true,
          content: true,
          createdAt: true,
          media: true,
        },
        orderBy: { createdAt: 'desc' },
      },
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

// Update user info (name, bio)
export const updateUserInfo = async (userId, { name, bio }) => {
  return prisma.user.update({
    where: { id: userId },
    data: { name, bio },
    select: {
      id: true,
      name: true,
      bio: true,
      avatarUrl: true,
    },
  });
};

// Update user avatar
export const updateUserAvatar = async (userId, fileBuffer) => {
  const result = await uploadBufferToCloudinary(fileBuffer, 'avatars');
  return prisma.user.update({
    where: { id: userId },
    data: { avatarUrl: result.secure_url },
    select: {
      id: true,
      name: true,
      bio: true,
      avatarUrl: true,
    },
  });
};

// Follow a user
export const followUser = async (followerId, followingId) => {
  if (followerId === followingId) throw new Error("Can't follow yourself");
  const existing = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId,
        followingId,
      },
    },
  });
  if (existing) return { followed: false };
  await prisma.follow.create({
    data: { followerId, followingId },
  });
  return { followed: true };
};

// Unfollow a user
export const unfollowUser = async (followerId, followingId) => {
  const existing = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId,
        followingId,
      },
    },
  });
  if (!existing) return { followed: false };
  await prisma.follow.delete({
    where: {
      followerId_followingId: {
        followerId,
        followingId,
      },
    },
  });
  return { followed: false };
};

// Get followers with pagination
export const getFollowers = async (username, page = 1, limit = 10) => {
  const user = await prisma.user.findUnique({ where: { name: username } });
  if (!user) throw new Error('User not found');
  const followers = await prisma.follow.findMany({
    where: { followingId: user.id },
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
  });
  return followers.map(f => f.follower);
};

// Get following with pagination
export const getFollowing = async (username, page = 1, limit = 10) => {
  const user = await prisma.user.findUnique({ where: { name: username } });
  if (!user) throw new Error('User not found');
  const following = await prisma.follow.findMany({
    where: { followerId: user.id },
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
  });
  return following.map(f => f.following);
};

// Search users
export const searchUsers = async (query = '', page = 1, limit = 10) => {
  return prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { bio: { contains: query, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      name: true,
      avatarUrl: true,
    },
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { name: 'asc' },
  });
};