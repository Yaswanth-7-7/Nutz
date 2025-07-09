const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User-simple-working');
// If you have authentication middleware, require it here
// const { requireAuth } = require('../middleware/auth');

// Like a post
router.post('/:id/like', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (!post.likes.includes(req.body.userId)) {
      post.likes.push(req.body.userId);
      await post.save();
    }
    res.json({ likes: post.likes.length });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Unlike a post
router.post('/:id/unlike', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    post.likes = post.likes.filter(uid => uid.toString() !== req.body.userId);
    await post.save();
    res.json({ likes: post.likes.length });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Add a comment
router.post('/:id/comment', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    const comment = {
      user: req.body.userId,
      text: req.body.text,
      createdAt: new Date()
    };
    // Enforce max 3 comments
    if (post.comments.length >= 3) {
      post.comments.shift(); // Remove the oldest comment
    }
    post.comments.push(comment);
    await post.save();
    res.json(post.comments);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get comments for a post
router.get('/:id/comments', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('comments.user', 'username');
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post.comments);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a comment by index
router.delete('/:id/comment/:commentIdx', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    const idx = parseInt(req.params.commentIdx, 10);
    if (isNaN(idx) || idx < 0 || idx >= post.comments.length) {
      return res.status(400).json({ error: 'Invalid comment index' });
    }
    // Only allow if the user matches
    const userId = req.body.userId;
    const comment = post.comments[idx];
    if (comment.user.toString() !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this comment' });
    }
    post.comments.splice(idx, 1);
    await post.save();
    res.json({ success: true, comments: post.comments });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 