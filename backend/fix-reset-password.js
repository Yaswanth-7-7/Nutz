require('dotenv').config({ path: './config.env' });
const mongoose = require('mongoose');
const User = require('./models/User-simple-working');
const PasswordReset = require('./models/PasswordReset');

const testResetPassword = async () => {
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

    // Create a test OTP
    const testOTP = '123456';
    const passwordReset = new PasswordReset({
      userId: user._id,
      otp: testOTP,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      isUsed: false
    });
    await passwordReset.save();
    console.log('Test OTP created');

    // Test password reset
    const newPassword = 'newresetpassword123';
    console.log('Resetting password to:', newPassword);

    // Check if password is in history
    const isInHistory = await user.isPasswordInHistory(newPassword);
    console.log('Is password in history?', isInHistory);

    if (!isInHistory) {
      // Update password
      console.log('Updating password...');
      user.password = newPassword;
      
      try {
        await user.save();
        console.log('Password reset successfully');
        console.log('Updated password history:', user.getPasswordHistory());
        
        // Mark OTP as used
        passwordReset.isUsed = true;
        await passwordReset.save();
        console.log('OTP marked as used');
      } catch (saveError) {
        console.error('Error saving password:', saveError);
        if (saveError.errors) {
          console.error('Validation errors:', saveError.errors);
        }
      }
    } else {
      console.log('Password is in history, cannot use it');
    }

    // Clean up test OTP
    await PasswordReset.findByIdAndDelete(passwordReset._id);
    console.log('Test OTP cleaned up');

    await mongoose.disconnect();
    console.log('Test completed');

  } catch (error) {
    console.error('Test error:', error);
    await mongoose.disconnect();
  }
};

testResetPassword(); 