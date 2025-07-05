require('dotenv').config({ path: './config.env' });
const mongoose = require('mongoose');

const fixDatabase = async () => {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/socialapp';
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB Connected');

    const db = mongoose.connection.db;
    
    // Drop the old passwordresets collection to remove old schema
    console.log('🗑️  Dropping old passwordresets collection...');
    try {
      await db.collection('passwordresets').drop();
      console.log('✅ Old passwordresets collection dropped');
    } catch (error) {
      console.log('ℹ️  passwordresets collection already dropped or doesn\'t exist');
    }

    // Drop any indexes that might conflict
    console.log('🗑️  Cleaning up indexes...');
    try {
      await db.collection('passwordresets').dropIndexes();
      console.log('✅ Old indexes dropped');
    } catch (error) {
      console.log('ℹ️  No indexes to drop');
    }

    console.log('✅ Database cleanup completed!');
    console.log('🔄 The new OTP-based password reset system is ready to use.');
    
  } catch (error) {
    console.error('❌ Database fix failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 MongoDB disconnected');
  }
};

fixDatabase(); 