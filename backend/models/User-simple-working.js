const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  passwordHistory: [{ type: String }], // Store last 3 password hashes
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving and update password history
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const saltRounds = 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Check if new password matches any of the last 3
userSchema.methods.isPasswordInHistory = async function(newPassword) {
  if (!this.passwordHistory) return false;
  for (let hash of this.passwordHistory) {
    if (await bcrypt.compare(newPassword, hash)) {
      return true;
    }
  }
  return false;
};

// Method to get password history
userSchema.methods.getPasswordHistory = function() {
  return this.passwordHistory || [];
};

module.exports = mongoose.model('User', userSchema); 