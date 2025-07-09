require('dotenv').config({ path: './config.env' });
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const connectDB = require('./config/database');
const User = require('./models/User-simple-working');
const Post = require('./models/Post');
const PasswordReset = require('./models/PasswordReset');
const upload = require('./middleware/upload');
const { sendOTPEmail, generateOTP } = require('./services/emailService');
const path = require('path');
const crypto = require('crypto');
const postRoutes = require('./routes/posts');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Validation middleware
const validateRegistration = [
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

const validateLogin = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

const validatePasswordChange = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
];

const validateForgotPassword = [
  body('email').isEmail().withMessage('Valid email is required')
];

const validateResetPassword = [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
];

const validatePost = [
  body('content').notEmpty().withMessage('Post content is required'),
  body('isPrivate').isBoolean().withMessage('isPrivate must be a boolean')
];

// Routes

// Register new user
app.post('/api/auth/register', validateRegistration, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    const newUser = new User({
      username,
      email,
      password
    });

    await newUser.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser._id, email: newUser.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        createdAt: newUser.createdAt
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login user
app.post('/api/auth/login', validateLogin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Change password
app.post('/api/auth/change-password', authenticateToken, validatePasswordChange, async (req, res) => {
  try {
    console.log('Password change request received');
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;
    
    console.log('User ID:', userId);
    console.log('Current password provided:', !!currentPassword);
    console.log('New password provided:', !!newPassword);

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      console.log('User not found');
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log('User found:', user.username);

    // Verify current password
    console.log('Verifying current password...');
    const isValidCurrentPassword = await user.comparePassword(currentPassword);
    if (!isValidCurrentPassword) {
      console.log('Current password is incorrect');
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    console.log('Current password verified');

    // Check if new password is in history (simplified)
    console.log('Checking password history...');
    const isInHistory = await user.isPasswordInHistory(newPassword);
    if (isInHistory) {
      console.log('New password is in history');
      return res.status(400).json({ message: 'give valid pass' });
    }
    console.log('Password not in history');

    // Update password
    console.log('Updating password...');
    const oldHash = user.password;
    user.password = newPassword;
    if (!user.passwordHistory) user.passwordHistory = [];
    user.passwordHistory.unshift(oldHash);
    if (user.passwordHistory.length > 3) {
      user.passwordHistory = user.passwordHistory.slice(0, 3);
    }
    await user.save();
    console.log('Password updated successfully');

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Server error' });
  }
});

// Forgot password
app.post('/api/auth/forgot-password', validateForgotPassword, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;
    console.log('Forgot password request for email:', email);

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found for email:', email);
      // Don't reveal if user exists or not for security
      return res.json({ message: 'If an account with that email exists, an OTP has been sent.' });
    }

    console.log('User found:', user.username);

    // Generate OTP
    const otp = generateOTP();
    console.log('Generated OTP:', otp);

    // Save OTP to database
    const passwordReset = new PasswordReset({
      userId: user._id,
      otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    });

    await passwordReset.save();
    console.log('OTP saved to database');

    // Send OTP email
    const emailSent = await sendOTPEmail(email, otp, user.username);

    if (emailSent) {
      console.log('OTP email sent successfully');
      res.json({ message: 'OTP sent to your email' });
    } else {
      console.log('Failed to send OTP email');
      res.status(500).json({ message: 'Failed to send OTP email. Please try again.' });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reset password
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    console.log('Reset password request for email:', email);

    // Validate inputs
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP, and new password are required' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found for email:', email);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('User found:', user.username);

    // Find valid OTP
    const passwordReset = await PasswordReset.findOne({
      userId: user._id,
      otp,
      expiresAt: { $gt: new Date() },
      isUsed: false
    });

    if (!passwordReset) {
      console.log('Invalid or expired OTP');
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    console.log('Valid OTP found');

    // Check if new password is in history
    try {
      console.log('Checking password history for reset...');
      console.log('Current password history:', user.getPasswordHistory());
      const isInHistory = await user.isPasswordInHistory(newPassword);
      if (isInHistory) {
        console.log('New password is in history');
        return res.status(400).json({ message: 'give valid pass' });
      }
      console.log('Password not in history');
    } catch (error) {
      console.error('Error checking password history:', error);
      // Continue with password reset even if history check fails
    }

    // Update password
    console.log('Updating password for user:', user.username);
    console.log('User before update:', {
      id: user._id,
      username: user.username,
      hasPassword: !!user.password,
      passwordLength: user.password ? user.password.length : 0,
      passwordHistoryCount: user.passwordHistory ? user.passwordHistory.length : 0
    });
    
    try {
      const oldHash = user.password;
      user.password = newPassword;
      if (!user.passwordHistory) user.passwordHistory = [];
      user.passwordHistory.unshift(oldHash);
      if (user.passwordHistory.length > 3) {
        user.passwordHistory = user.passwordHistory.slice(0, 3);
      }
      console.log('Password set to new value, length:', newPassword.length);
      
      await user.save();
      console.log('Password updated successfully');
      console.log('User after update:', {
        id: user._id,
        username: user.username,
        hasPassword: !!user.password,
        passwordLength: user.password ? user.password.length : 0,
        passwordHistoryCount: user.passwordHistory ? user.passwordHistory.length : 0
      });
    } catch (saveError) {
      console.error('Error saving password:', saveError);
      console.error('Save error details:', {
        message: saveError.message,
        name: saveError.name,
        stack: saveError.stack
      });
      if (saveError.errors) {
        console.error('Validation errors:', saveError.errors);
      }
      return res.status(500).json({ 
        message: 'Failed to update password',
        error: saveError.message,
        details: saveError.errors
      });
    }

    // Mark OTP as used
    passwordReset.isUsed = true;
    await passwordReset.save();
    console.log('OTP marked as used');

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    if (error.errors) {
      console.error('Validation errors:', error.errors);
    }
    res.status(500).json({ 
      message: 'Server error',
      error: error.message,
      details: error.errors
    });
  }
});

// Create post with image upload
app.post('/api/posts', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const { content, isPrivate } = req.body;
    const userId = req.user.userId;

    // Validate content
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Post content is required' });
    }

    // Create post object
    const postData = {
      userId,
      content: content.trim(),
      isPrivate: isPrivate === 'true'
    };

    // Add image if uploaded
    if (req.file) {
      postData.image = `/uploads/${req.file.filename}`;
    }

    const newPost = new Post(postData);
    await newPost.save();

    res.status(201).json({
      message: 'Post created successfully',
      post: newPost
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get posts (public and user's private posts)
app.get('/api/posts', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get public posts and user's private posts
    const posts = await Post.find({
      $or: [
        { isPrivate: false },
        { userId: userId }
      ]
    }).populate('userId', 'username').sort({ createdAt: -1 });

    // Format posts for frontend
    const formattedPosts = posts.map(post => ({
      id: post._id,
      userId: post.userId._id,
      username: post.userId.username,
      content: post.content,
      image: post.image,
      isPrivate: post.isPrivate,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      likes: post.likes,
      comments: post.comments
    }));

    res.json(formattedPosts);
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's own posts
app.get('/api/posts/my-posts', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const posts = await Post.find({ userId }).sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update post
app.put('/api/posts/:postId', authenticateToken, validatePost, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { postId } = req.params;
    const { content, isPrivate } = req.body;
    const userId = req.user.userId;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.userId.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to update this post' });
    }

    post.content = content;
    post.isPrivate = isPrivate;
    await post.save();

    res.json({
      message: 'Post updated successfully',
      post
    });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete post
app.delete('/api/posts/:postId', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.userId;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.userId.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    await Post.findByIdAndDelete(postId);

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ message: 'Server is running' });
});

// Test endpoint to check reset tokens (for development only)
app.get('/api/test/reset-tokens', async (req, res) => {
  try {
    const tokens = await PasswordReset.find().populate('userId', 'username email');
    res.json({
      message: 'Reset tokens in database',
      tokens: tokens.map(token => ({
        id: token._id,
        username: token.userId?.username,
        email: token.userId?.email,
        expiresAt: token.expiresAt,
        isExpired: token.expiresAt < new Date()
      }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tokens', error: error.message });
  }
});

// Test email endpoint
app.post('/api/test/send-email', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    console.log('Testing email sending to:', email);
    
    const testToken = crypto.randomBytes(32).toString('hex');
    const emailSent = await sendOTPEmail(email, testToken, 'Test User');

    if (emailSent) {
      res.json({ 
        message: 'Test email sent successfully',
        resetUrl: `http://localhost:3000/reset-password?token=${testToken}`
      });
    } else {
      res.status(500).json({ message: 'Failed to send test email' });
    }
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({ message: 'Email test failed', error: error.message });
  }
});

// Test endpoint for password reset
app.post('/api/auth/test-reset', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Validate email input
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate OTP
    const otp = generateOTP();
    console.log(`Test: Generated OTP for ${email}: ${otp}`);
    
    // Set expiration (10 minutes from now)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Save OTP to database
    const passwordReset = new PasswordReset({
      userId: user._id,
      otp,
      expiresAt
    });

    await passwordReset.save();
    console.log(`Test: OTP saved to database for user: ${user._id}`);

    // Send OTP email
    const emailSent = await sendOTPEmail(email, otp, user.username);

    res.json({
      message: 'Test reset completed',
      emailSent,
      otp,
      expiresAt,
      userId: user._id
    });
  } catch (error) {
    console.error('Test reset error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      email: req.body.email
    });
    
    // Check for specific error types
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Invalid data provided' });
    }
    
    if (error.name === 'MongoError' || error.name === 'MongoServerError') {
      return res.status(500).json({ message: 'Database error. Please try again later.' });
    }
    
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});

// Test endpoint to check user's password history
app.get('/api/test/password-history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      userId: user._id,
      username: user.username,
      passwordHistory: user.getPasswordHistory(),
      passwordHistoryCount: user.passwordHistory ? user.passwordHistory.length : 0
    });
  } catch (error) {
    console.error('Error getting password history:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Test endpoint to manually change password (for debugging)
app.post('/api/test/change-password/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;
    
    if (!newPassword) {
      return res.status(400).json({ message: 'New password is required' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log('Test password change for user:', user.username);
    console.log('Current password history:', user.getPasswordHistory());
    
    // Check if password is in history
    const isInHistory = await user.isPasswordInHistory(newPassword);
    console.log('Is password in history?', isInHistory);
    
    if (isInHistory) {
      return res.status(400).json({ message: 'Password is in history' });
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    console.log('Password updated successfully');
    console.log('Updated password history:', user.getPasswordHistory());
    
    res.json({ 
      message: 'Password changed successfully',
      passwordHistory: user.getPasswordHistory()
    });
  } catch (error) {
    console.error('Test password change error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.use('/api/posts', postRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 