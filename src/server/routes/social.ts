import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import db from '../db.ts';

const router = express.Router();

// ─── Setup uploads dir ────────────────────────────────────────────────────────
const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed'));
    }
  },
});

// ─── Ensure social tables exist ───────────────────────────────────────────────
async function ensureSocialTables() {
  try {
    // Add banner_url to profiles if missing
    try {
      await db.raw('ALTER TABLE profiles ADD COLUMN banner_url TEXT');
      console.log('Added banner_url to profiles');
    } catch {}

    await db.raw(`
      CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        content TEXT,
        media_url TEXT,
        media_type TEXT DEFAULT 'none',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    await db.raw(`
      CREATE TABLE IF NOT EXISTS post_likes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        UNIQUE(post_id, user_id),
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
      )
    `);
    await db.raw(`
      CREATE TABLE IF NOT EXISTS post_comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
      )
    `);
    await db.raw(`
      CREATE TABLE IF NOT EXISTS user_follows (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        follower_id INTEGER NOT NULL,
        following_id INTEGER NOT NULL,
        UNIQUE(follower_id, following_id),
        FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Social tables ready');
  } catch (err) {
    console.error('Social tables init error:', err);
  }
}

ensureSocialTables();

// ─── GET /api/social/feed ─────────────────────────────────────────────────────
router.get('/feed', async (req: any, res) => {
  try {
    const userId = req.query.userId ? Number(req.query.userId) : null;
    const authorId = req.query.authorId ? Number(req.query.authorId) : null;
    const followingOnly = req.query.followingOnly === 'true';
    const page = Number(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    let query = db('posts as p')
      .join('users as u', 'p.user_id', 'u.id')
      .leftJoin('profiles as pr', 'p.user_id', 'pr.user_id')
      .leftJoin(
        db.raw(`(SELECT post_id, COUNT(*) as like_count FROM post_likes GROUP BY post_id) as lc`),
        'p.id', 'lc.post_id'
      )
      .leftJoin(
        db.raw(`(SELECT post_id, COUNT(*) as comment_count FROM post_comments GROUP BY post_id) as cc`),
        'p.id', 'cc.post_id'
      )
      .leftJoin(
        db.raw(`(SELECT following_id, COUNT(*) as follower_count FROM user_follows GROUP BY following_id) as fc`),
        'p.user_id', 'fc.following_id'
      );

    if (followingOnly && userId) {
      query = query.whereIn('p.user_id', function() {
        this.select('following_id').from('user_follows').where('follower_id', userId);
      });
    }

    if (authorId) {
      query = query.where('p.user_id', authorId);
    }

    const posts = await query
      .select(
        'p.id', 'p.user_id', 'p.content', 'p.media_url', 'p.media_type', 'p.created_at',
        'u.full_name', 'u.role', 'pr.avatar_url',
        db.raw('COALESCE(lc.like_count, 0) as like_count'),
        db.raw('COALESCE(cc.comment_count, 0) as comment_count'),
        db.raw('COALESCE(fc.follower_count, 0) as follower_count')
      )
      .orderBy('p.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    const enriched = await Promise.all(posts.map(async (post: any) => {
      let isLiked = false;
      let isFollowing = false;
      if (userId) {
        const liked = await db('post_likes').where({ post_id: post.id, user_id: userId }).first();
        isLiked = !!liked;
        const following = await db('user_follows').where({ follower_id: userId, following_id: post.user_id }).first();
        isFollowing = !!following;
      }
      return {
        ...post,
        like_count: Number(post.like_count),
        comment_count: Number(post.comment_count),
        follower_count: Number(post.follower_count),
        isLiked,
        isFollowing,
      };
    }));

    return res.json(enriched);
  } catch (err: any) {
    console.error('Feed error:', err);
    return res.status(500).json({ error: err.message || 'Failed to load feed' });
  }
});

// ─── GET /api/social/user/:userId ─────────────────────────────────────────────
router.get('/user/:userId', async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const user = await db('users as u')
      .leftJoin('profiles as pr', 'u.id', 'pr.user_id')
      .where('u.id', userId)
      .select('u.id', 'u.full_name', 'u.role', 'pr.avatar_url', 'pr.banner_url')
      .first();

    if (!user) return res.status(404).json({ error: 'User not found' });

    const [followers] = await db('user_follows').where('following_id', userId).count('* as count');
    const [following] = await db('user_follows').where('follower_id', userId).count('* as count');

    return res.json({
      ...user,
      followersCount: (followers as any).count || 0,
      followingCount: (following as any).count || 0
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/social/posts/:id ─────────────────────────────────────────────
router.delete('/posts/:id', async (req: any, res) => {
  try {
    const userId = req.query.userId || req.body.userId;
    const postId = Number(req.params.id);

    if (!userId) return res.status(400).json({ error: 'userId required' });

    const post = await db('posts').where({ id: postId }).first();
    if (!post) return res.status(404).json({ error: 'Post not found' });
    
    if (post.user_id !== Number(userId)) {
      return res.status(403).json({ error: 'Unauthorized: You can only delete your own posts' });
    }

    if (post.media_url) {
      try {
        const fullPath = path.join(process.cwd(), 'public', post.media_url);
        if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
      } catch (e) {
        console.error('Error deleting media file:', e);
      }
    }

    await db('posts').where({ id: postId }).delete();
    return res.json({ success: true });
  } catch (err: any) {
    console.error('Delete post error:', err);
    return res.status(500).json({ error: err.message || 'Failed to delete post' });
  }
});

// ─── DELETE /api/social/comments/:id ──────────────────────────────────────────
router.delete('/comments/:id', async (req: any, res) => {
  try {
    const userId = req.query.userId || req.body.userId;
    const commentId = Number(req.params.id);

    if (!userId) return res.status(400).json({ error: 'userId required' });

    const comment = await db('post_comments').where({ id: commentId }).first();
    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    if (comment.user_id !== Number(userId)) {
      return res.status(403).json({ error: 'Unauthorized: You can only delete your own comments' });
    }

    await db('post_comments').where({ id: commentId }).delete();
    return res.json({ success: true });
  } catch (err: any) {
    console.error('Delete comment error:', err);
    return res.status(500).json({ error: err.message || 'Failed to delete comment' });
  }
});

// ─── POST /api/social/posts ───────────────────────────────────────────────────
router.post('/posts', (req: any, res: any) => {
  upload.single('media')(req, res, async (uploadErr: any) => {
    try {
      if (uploadErr) {
        return res.status(400).json({ error: uploadErr.message || 'File upload failed' });
      }

      const { userId, content } = req.body;

      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }
      if (!content && !req.file) {
        return res.status(400).json({ error: 'Post must have content or a media file' });
      }

      let media_url: string | null = null;
      let media_type = 'none';

      if (req.file) {
        media_url = `/uploads/${req.file.filename}`;
        media_type = req.file.mimetype.startsWith('video/') ? 'video' : 'image';
      }

      const [id] = await db('posts').insert({
        user_id: Number(userId),
        content: content ? content.trim() : null,
        media_url,
        media_type,
        created_at: new Date().toISOString(),
      });

      const post = await db('posts as p')
        .join('users as u', 'p.user_id', 'u.id')
        .leftJoin('profiles as pr', 'p.user_id', 'pr.user_id')
        .where('p.id', id)
        .select('p.*', 'u.full_name', 'u.role', 'pr.avatar_url')
        .first();

      const [followerRes] = await db('user_follows').where('following_id', userId).count('* as count');

      return res.json({
        ...post,
        like_count: 0,
        comment_count: 0,
        follower_count: Number((followerRes as any).count || 0),
        isLiked: false,
        isFollowing: false,
      });
    } catch (err: any) {
      console.error('Create post error:', err);
      return res.status(500).json({ error: err.message || 'Failed to create post' });
    }
  });
});

// ─── POST /api/social/posts/:id/like ─────────────────────────────────────────
router.post('/posts/:id/like', async (req: any, res) => {
  try {
    const { userId } = req.body;
    const postId = Number(req.params.id);
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const existing = await db('post_likes').where({ post_id: postId, user_id: Number(userId) }).first();
    if (existing) {
      await db('post_likes').where({ post_id: postId, user_id: Number(userId) }).delete();
      return res.json({ liked: false });
    } else {
      await db('post_likes').insert({ post_id: postId, user_id: Number(userId) });
      return res.json({ liked: true });
    }
  } catch (err: any) {
    console.error('Like error:', err);
    return res.status(500).json({ error: err.message || 'Failed to toggle like' });
  }
});

// ─── GET /api/social/posts/:id/comments ──────────────────────────────────────
router.get('/posts/:id/comments', async (req: any, res) => {
  try {
    const postId = Number(req.params.id);
    const comments = await db('post_comments as c')
      .join('users as u', 'c.user_id', 'u.id')
      .where('c.post_id', postId)
      .select('c.id', 'c.content', 'c.created_at', 'u.full_name', 'u.role', 'c.user_id')
      .orderBy('c.created_at', 'asc');
    return res.json(comments);
  } catch (err: any) {
    console.error('Comments error:', err);
    return res.status(500).json({ error: err.message || 'Failed to load comments' });
  }
});

// ─── POST /api/social/posts/:id/comments ─────────────────────────────────────
router.post('/posts/:id/comments', async (req: any, res) => {
  try {
    const { userId, content } = req.body;
    const postId = Number(req.params.id);
    if (!userId || !content) return res.status(400).json({ error: 'userId and content required' });

    const [id] = await db('post_comments').insert({
      post_id: postId,
      user_id: Number(userId),
      content: content.trim(),
      created_at: new Date().toISOString(),
    });

    const comment = await db('post_comments as c')
      .join('users as u', 'c.user_id', 'u.id')
      .where('c.id', id)
      .select('c.id', 'c.content', 'c.created_at', 'u.full_name', 'u.role', 'c.user_id')
      .first();

    return res.json(comment);
  } catch (err: any) {
    console.error('Comment error:', err);
    return res.status(500).json({ error: err.message || 'Failed to add comment' });
  }
});

// ─── POST /api/social/follow ──────────────────────────────────────────────────
router.post('/follow', async (req: any, res) => {
  try {
    const { followerId, followingId } = req.body;
    if (!followerId || !followingId) return res.status(400).json({ error: 'followerId and followingId required' });
    if (Number(followerId) === Number(followingId)) return res.status(400).json({ error: 'Cannot follow yourself' });

    const existing = await db('user_follows').where({
      follower_id: Number(followerId),
      following_id: Number(followingId),
    }).first();

    if (existing) {
      await db('user_follows').where({ follower_id: Number(followerId), following_id: Number(followingId) }).delete();
      return res.json({ following: false });
    } else {
      await db('user_follows').insert({ follower_id: Number(followerId), following_id: Number(followingId) });
      return res.json({ following: true });
    }
  } catch (err: any) {
    console.error('Follow error:', err);
    return res.status(500).json({ error: err.message || 'Failed to toggle follow' });
  }
});

// ─── GET /api/social/stats/:userId ───────────────────────────────────────────
router.get('/stats/:userId', async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const [followers] = await db('user_follows').where('following_id', userId).count('* as count');
    const [following] = await db('user_follows').where('follower_id', userId).count('* as count');
    return res.json({
      followersCount: (followers as any).count || 0,
      followingCount: (following as any).count || 0
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/social/followers/:userId ───────────────────────────────────────
router.get('/followers/:userId', async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const users = await db('user_follows as f')
      .join('users as u', 'f.follower_id', 'u.id')
      .where('f.following_id', userId)
      .select('u.id', 'u.full_name', 'u.role');
    return res.json(users);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/social/following/:userId ───────────────────────────────────────
router.get('/following/:userId', async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const users = await db('user_follows as f')
      .join('users as u', 'f.following_id', 'u.id')
      .where('f.follower_id', userId)
      .select('u.id', 'u.full_name', 'u.role');
    return res.json(users);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
