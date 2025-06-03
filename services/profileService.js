import prisma from '../Config/db.js';
import { uploadBufferToCloudinary } from '../Utils/uploadtocloudinary.js';

// Get user profile by username
export const getProfileByUsername = async (username) => {
  const user = await prisma.user.findUnique({
    where: { name: username },
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
          _count: {
            select: { likes: true, comments: true },
          },
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
  if (!user) throw new Error('User not found');
  return user;
};

// Update user profile (name, bio, avatar)
export const updateUserProfile = async (userId, { name, bio, fileBuffer }) => {
  let avatarUrl;
  if (fileBuffer) {
    const result = await uploadBufferToCloudinary(fileBuffer, 'avatars');
    avatarUrl = result.secure_url;
  }

  return prisma.user.update({
    where: { id: userId },
    data: {
      name,
      bio,
      ...(avatarUrl && { avatarUrl }),
    },
    select: {
      id: true,
      name: true,
      bio: true,
      avatarUrl: true,
    },
  });
};

// Search users by name or bio with PRIORITY ORDERING
export const searchUsers = async (query = '', page = 1, limit = 10) => {
  if (!query || query.trim() === '') {
    return {
      usersfound: 0,
      users: []
    };
  }
  
  const trimmedQuery = query.trim().toLowerCase();
  
  // Get all matching users without pagination first
  const allUsers = await prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: query.trim(), mode: 'insensitive' } },
        { bio: { contains: query.trim(), mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      bio: true,
    },
  });
  
  // Sort by priority:
  // 1. Name starts with query (highest priority)
  // 2. Bio starts with query  
  // 3. Name contains query
  // 4. Bio contains query (lowest priority)
  const sortedUsers = allUsers.sort((a, b) => {
    // Priority scoring
    const getPriority = (user) => {
      const nameLower = user.name.toLowerCase();
      const bioLower = (user.bio || '').toLowerCase();
      
      if (nameLower.startsWith(trimmedQuery)) return 1; // Highest priority
      if (bioLower.startsWith(trimmedQuery)) return 2;
      if (nameLower.includes(trimmedQuery)) return 3;
      if (bioLower.includes(trimmedQuery)) return 4; // Lowest priority
      return 5;
    };
    
    const aPriority = getPriority(a);
    const bPriority = getPriority(b);
    
    // If same priority, sort alphabetically by name
    if (aPriority === bPriority) {
      return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    }
    
    return aPriority - bPriority;
  });
  
 
  const startIndex = (page - 1) * limit;
  const paginatedUsers = sortedUsers.slice(startIndex, startIndex + limit);
  
  return {
    usersfound: sortedUsers.length,
    users: paginatedUsers
  };
};

export const followUserByUsername = async (followerId, username) => {
  const targetUser = await prisma.user.findUnique({
    where: { name: username },
    select: { id: true, name: true },
  });

  if (!targetUser) throw new Error('User to follow does not exist');
  if (followerId === targetUser.id) throw new Error("Can't follow yourself");

  const existingFollow = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId,
        followingId: targetUser.id,
      },
    },
  });

  if (existingFollow) {
    throw new Error('Already following this user');
  }

  await prisma.follow.create({
    data: {
      followerId,
      followingId: targetUser.id,
    },
  });

  return { followed: true, targetUser: targetUser.name };
};

export const unfollowUserByUsername = async (followerId, username) => {
  const targetUser = await prisma.user.findUnique({
    where: { name: username },
    select: { id: true, name: true },
  });

  if (!targetUser) throw new Error('User to unfollow does not exist');
  if (followerId === targetUser.id) throw new Error("Can't unfollow yourself");

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

export const getFollowers = async (username, page = 1, limit = 10) => {
  const user = await prisma.user.findUnique({ where: { name: username } });
  if (!user) throw new Error('User not found');

  // Get total count for pagination
  const totalFollowers = await prisma.follow.count({
    where: { followingId: user.id }
  });

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
    orderBy: { createdAt: 'desc' }
  });

  return {
     totalFollowers,followers: followers.map(f => f.follower)};
};

// Get following list with pagination info
export const getFollowing = async (username, page = 1, limit = 10) => {
  const user = await prisma.user.findUnique({ where: { name: username } });
  if (!user) throw new Error('User not found');

  // Get total count for pagination
  const totalFollowing = await prisma.follow.count({
    where: { followerId: user.id }
  });

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
    orderBy: { createdAt: 'desc' }
  });

  return {
    totalFollowing,following: following.map(f => f.following)};
};