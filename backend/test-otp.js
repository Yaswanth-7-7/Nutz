require('dotenv').config({ path: './config.env' });
const mongoose = require('mongoose');
const User = require('./models/User');
const PasswordReset = require('./models/PasswordReset');
const { sendOTPEmail, generateOTP } = require('./services/emailService');

const testOTP = async () => {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/socialapp';
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB Connected');

    // Test email service
    console.log('\n📧 Testing Email Service...');
    const testEmail = 'test@example.com';
    const testOTP = generateOTP();
    const testUsername = 'TestUser';
    
    console.log('Generated OTP:', testOTP);
    
    const emailResult = await sendOTPEmail(testEmail, testOTP, testUsername);
    console.log('Email sent:', emailResult);

    // Test with a real user if exists
    const user = await User.findOne({});
    if (user) {
      console.log('\n👤 Testing with real user:', user.email);
      
      const otp = generateOTP();
      console.log('Generated OTP for user:', otp);
      
      const passwordReset = new PasswordReset({
        userId: user._id,
        otp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000)
      });
      
      await passwordReset.save();
      console.log('✅ OTP saved to database');
      
      const emailSent = await sendOTPEmail(user.email, otp, user.username);
      console.log('✅ Email sent to real user:', emailSent);
      
      console.log('\n📋 Summary:');
      console.log('- OTP generated successfully');
      console.log('- OTP saved to database');
      console.log('- Email service working (check console for OTP)');
      console.log('- To receive real emails, follow the EMAIL_SETUP.md guide');
    } else {
      console.log('\n⚠️  No users found in database');
      console.log('💡 Create a user first by registering at http://localhost:3000/register');
    }

    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
  } finally {
    await mongoose.disconnect();
    console.log('🔌 MongoDB disconnected');
  }
};

testOTP(); 