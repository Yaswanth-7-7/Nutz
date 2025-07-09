const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User-simple-working');
const PasswordReset = require('../models/PasswordReset');
const { sendOTPEmail, generateOTP } = require('../services/emailService');
const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = new User({
      username,
      email,
      password: hashedPassword,
      passwordHistory: [{
        password: hashedPassword,
        createdAt: new Date()
      }]
    });

    await user.save();

    // Generate JWT
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Forgot Password - Send OTP
router.post('/forgot-password', async (req, res) => {
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
    console.log(`Generated OTP for ${email}: ${otp}`);
    
    // Set expiration (10 minutes from now)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Save OTP to database
    const passwordReset = new PasswordReset({
      userId: user._id,
      otp,
      expiresAt
    });

    await passwordReset.save();
    console.log(`OTP saved to database for user: ${user._id}`);

    // Send OTP email
    const emailSent = await sendOTPEmail(email, otp, user.username);

    if (emailSent) {
      console.log(`OTP email sent successfully to: ${email}`);
      res.json({ message: 'OTP sent to your email' });
    } else {
      console.error(`Failed to send OTP email to: ${email}`);
      res.status(500).json({ message: 'Failed to send OTP email. Please try again later.' });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
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

// Verify OTP and Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find valid OTP
    const passwordReset = await PasswordReset.findOne({
      userId: user._id,
      otp,
      expiresAt: { $gt: new Date() },
      isUsed: false
    });

    if (!passwordReset) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Check if new password is same as current password
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({ message: 'New password must be different from current password' });
    }

    // Check password history (last 3 passwords)
    const passwordHistory = user.passwordHistory.slice(-3);
    for (const historyItem of passwordHistory) {
      const isOldPassword = await bcrypt.compare(newPassword, historyItem.password);
      if (isOldPassword) {
        return res.status(400).json({ message: 'give valid pass' });
      }
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    // Update user password
    user.password = hashedNewPassword;
    user.passwordHistory.push({
      password: hashedNewPassword,
      createdAt: new Date()
    });
    
    // Keep only last 3 passwords in history
    if (user.passwordHistory.length > 3) {
      user.passwordHistory = user.passwordHistory.slice(-3);
    }

    await user.save();

    // Mark OTP as used
    passwordReset.isUsed = true;
    await passwordReset.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Change Password (for logged-in users)
router.post('/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Check if new password is same as current password
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({ message: 'New password must be different from current password' });
    }

    // Check password history (last 3 passwords)
    const passwordHistory = user.passwordHistory.slice(-3);
    for (const historyItem of passwordHistory) {
      const isOldPassword = await bcrypt.compare(newPassword, historyItem.password);
      if (isOldPassword) {
        return res.status(400).json({ message: 'give valid pass' });
      }
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    // Update user password
    user.password = hashedNewPassword;
    user.passwordHistory.push({
      password: hashedNewPassword,
      createdAt: new Date()
    });
    
    // Keep only last 3 passwords in history
    if (user.passwordHistory.length > 3) {
      user.passwordHistory = user.passwordHistory.slice(-3);
    }

    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Test endpoint for password reset
router.post('/test-reset', async (req, res) => {
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

module.exports = router; 