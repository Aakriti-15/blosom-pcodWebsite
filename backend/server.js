const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
// Load environment variables FIRST
// (before anything else that might need them)
dotenv.config();

// Connect to MongoDB
connectDB();

// Create the Express app
const app = express();

// ─── Middleware ───────────────────────────────────
// Allow React frontend to talk to this backend
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://your-frontend-name.onrender.com', // ← add this
  ],
  credentials: true,
}));

// Allow server to read JSON from request body
app.use(express.json());

// Allow server to read form data
app.use(express.urlencoded({ extended: true }));

// Log every request in terminal (only in development)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ─── Test Route ───────────────────────────────────
// This is just to confirm the server is running
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '🌸 Blosom API is running!',
    timestamp: new Date(),
  });
});

// Auth routes
app.use('/api/auth', require('./routes/auth'));


//cycle routes 
app.use('/api/cycles', require('./routes/cycles'));


//symptom routes
app.use('/api/symptoms', require('./routes/symptom'));

app.use('/api/chat', require('./routes/chat'));


// ─── 404 Handler ──────────────────────────────────
// If someone hits a route that doesn't exist
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

app.use(errorHandler);

// ─── Start Server ─────────────────────────────────
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`\n🌸 Blosom server running on port ${PORT}`);
  console.log(`📡 Test it: http://localhost:${PORT}/api/health\n`);
});



    