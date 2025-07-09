require('dotenv').config({ path: './config.env' });
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Simple test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
}); 