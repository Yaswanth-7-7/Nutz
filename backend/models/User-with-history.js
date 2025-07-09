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
  passwordHistory: {
    type: [{
      password: {
        type: String,
        required: true
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const saltRounds = 12;
    const oldPassword = this.password;
    const hashedPassword = await bcrypt.hash(this.password, saltRounds);

    // Only add to history if this is not a new user and old password is a valid hash
    if (!this.isNew && oldPassword && oldPassword.length > 20) {
      // Initialize passwordHistory if it doesn't exist
      if (!this.passwordHistory) {
        this.passwordHistory = [];
      }
      
      // Add old password to history
      this.passwordHistory.push({
        password: oldPassword,
        createdAt: new Date()
      });
      
      // Keep only last 3 passwords
      if (this.passwordHistory.length > 3) {
        this.passwordHistory = this.passwordHistory.slice(-3);
      }
      
      console.log(`Added password to history. Total passwords in history: ${this.passwordHistory.length}`);
    }
    
    this.password = hashedPassword;
    next();
  } catch (error) {
    console.error('Error in pre-save middleware:', error);
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to check if password is in history
userSchema.methods.isPasswordInHistory = async function(newPassword) {
  try {
    // Ensure passwordHistory exists and is an array
    if (!this.passwordHistory || !Array.isArray(this.passwordHistory)) {
      console.log('No password history found');
      return false;
    }
    
    // Get last 3 passwords, filter out any with undefined/null passwords
    const recentPasswords = this.passwordHistory
      .slice(-3)
      .filter(item => item && item.password && typeof item.password === 'string');
    
    console.log(`Checking ${recentPasswords.length} passwords in history`);
    
    for (const historyItem of recentPasswords) {
      try {
        const isSame = await bcrypt.compare(newPassword, historyItem.password);
        if (isSame) {
          console.log('Password found in history - cannot reuse');
          return true;
        }
      } catch (error) {
        console.error('Error comparing password with history:', error);
        // Continue checking other passwords even if one fails
        continue;
      }
    }
    
    console.log('Password not found in history - can use this password');
    return false;
  } catch (error) {
    console.error('Error in isPasswordInHistory:', error);
    return false;
  }
};

// Method to get password history (for debugging)
userSchema.methods.getPasswordHistory = function() {
  if (!this.passwordHistory || !Array.isArray(this.passwordHistory)) {
    return [];
  }
  return this.passwordHistory.map(item => ({
    createdAt: item.createdAt,
    hasPassword: !!item.password,
    passwordLength: item.password ? item.password.length : 0
  }));
};

module.exports = mongoose.model('User', userSchema); 