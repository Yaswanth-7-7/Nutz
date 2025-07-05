const mongoose = require('mongoose');

const passwordResetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  otp: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for automatic cleanup of expired OTPs
passwordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Create a compound index for userId and otp to ensure uniqueness
passwordResetSchema.index({ userId: 1, otp: 1 }, { unique: true });

module.exports = mongoose.model('PasswordReset', passwordResetSchema); 