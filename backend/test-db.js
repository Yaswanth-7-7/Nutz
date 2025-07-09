require('dotenv').config({ path: './config.env' });
const mongoose = require('mongoose');

const testConnection = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/socialapp';
    console.log('Attempting to connect to MongoDB...');
    console.log('URI:', mongoURI);
    
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Test creating a simple document
    const TestSchema = new mongoose.Schema({ name: String });
    const Test = mongoose.model('Test', TestSchema);
    
    const testDoc = new Test({ name: 'test' });
    await testDoc.save();
    console.log('Database write test successful');
    
    await Test.deleteOne({ name: 'test' });
    console.log('Database delete test successful');
    
    await mongoose.disconnect();
    console.log('Database connection closed');
    
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    console.error('Full error:', error);
  }
};

testConnection(); 