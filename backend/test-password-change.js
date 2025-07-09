require('dotenv').config({ path: './config.env' });
const mongoose = require('mongoose');
const User = require('./models/User-simple-working');

const testPasswordChange = async () => {
  try {
    // Connect to database
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/socialapp';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Find a test user
    const user = await User.findOne();
    if (!user) {
      console.log('No users found in database');
      return;
    }

    console.log('Testing with user:', user.username);
    console.log('Current password history:', user.getPasswordHistory());

    // Test password change
    const newPassword = 'newtestpassword123';
    console.log('Changing password to:', newPassword);

    // Check if password is in history
    const isInHistory = await user.isPasswordInHistory(newPassword);
    console.log('Is password in history?', isInHistory);

    if (!isInHistory) {
      // Update password
      user.password = newPassword;
      await user.save();
      console.log('Password changed successfully');
      console.log('Updated password history:', user.getPasswordHistory());
    } else {
      console.log('Password is in history, cannot use it');
    }

    await mongoose.disconnect();
    console.log('Test completed');

  } catch (error) {
    console.error('Test error:', error);
    await mongoose.disconnect();
  }
};

testPasswordChange(); 