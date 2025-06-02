import prisma from '../Config/db.js';
import { uploadBufferToCloudinary } from '../Utils/uploadtocloudinary.js';

// GET /api/profile/:username
export const getUserProfile = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await prisma.user.findUnique({
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

    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

// PUT /api/profile/profile
export const updateProfile = async (req, res) => {
  try {
    const { id } = req.user;
    const { name, bio } = req.body;

    let avatarUrl;
    if (req.file && req.file.buffer) {
      const result = await uploadBufferToCloudinary(req.file.buffer, 'avatars');
      avatarUrl = result.secure_url;
    }

    const updated = await prisma.user.update({
      where: { id },
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

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Failed to update profile' });
  }
};

// GET /api/profile/search?q=someText
export const searchUsers = async (req, res) => {
  try {
    const { q = '', limit = 10 } = req.query;

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: q, mode: 'insensitive' } },
          { name: { contains: q, mode: 'insensitive' } },
          { bio: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        username: true,
        name: true,
        avatarUrl: true,
      },
      orderBy: { username: 'asc' },
      take: Number(limit),
    });

    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to search users' });
  }
};

// POST /api/profile/:userId/follow
export const toggleFollow = async (req, res) => {
  try {
    const { id } = req.user;
    const { userId: targetId } = req.params;

    if (id === targetId) return res.status(400).json({ error: "Can't follow yourself" });

    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: id,
          followingId: targetId,
        },
      },
    });

    if (existingFollow) {
      await prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId: id,
            followingId: targetId,
          },
        },
      });
      return res.json({ followed: false });
    } else {
      await prisma.follow.create({
        data: {
          followerId: id,
          followingId: targetId,
        },
      });
      return res.json({ followed: true });
    }
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Failed to toggle follow' });
  }
};

// GET /api/profile/:username/followers
export const getFollowers = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await prisma.user.findUnique({ where: { name: username } });

    if (!user) return res.status(404).json({ error: 'User not found' });

    const followers = await prisma.follow.findMany({
      where: { followingId: user.id },
      include: {
        follower: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });

    res.json(followers.map(f => f.follower));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch followers' });
  }
};

// GET /api/profile/:username/following
export const getFollowing = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await prisma.user.findUnique({ where: { name: username } });

    if (!user) return res.status(404).json({ error: 'User not found' });

    const following = await prisma.follow.findMany({
      where: { followerId: user.id },
      include: {
        following: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });

    res.json(following.map(f => f.following));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch following' });
  }
};
