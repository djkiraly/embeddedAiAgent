const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import database and models
const Database = require('./config/database');
const Session = require('./models/Session');
const Message = require('./models/Message');
const Settings = require('./models/Settings');

// Import routes
const chatRoutes = require('./routes/chat');
const settingsRoutes = require('./routes/settings');
const reportRoutes = require('./routes/report');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize database
const database = new Database();

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL || 'http://localhost:3000'
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000) / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', limiter);

// Initialize models and make them available to routes
app.locals.database = database;
app.locals.models = {
  Session: new Session(database.getDatabase()),
  Message: new Message(database.getDatabase()),
  Settings: new Settings(database.getDatabase())
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// API routes
app.use('/api', chatRoutes);
app.use('/api', settingsRoutes);
app.use('/api', reportRoutes);

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'AI Chat Interface API',
    version: '1.0.0',
    description: 'Backend API for AI Chat Interface with multiple LLM support',
    endpoints: {
      chat: {
        'POST /api/chat': 'Send message to AI and get response',
        'GET /api/models': 'Get available models',
        'GET /api/sessions': 'Get chat sessions',
        'GET /api/sessions/:id': 'Get session by ID',
        'GET /api/sessions/:id/messages': 'Get messages for a session',
        'DELETE /api/sessions/:id': 'Delete session'
      },
      settings: {
        'GET /api/settings': 'Get all settings',
        'PUT /api/settings': 'Update settings',
        'GET /api/settings/:key': 'Get specific setting',
        'PUT /api/settings/:key': 'Update specific setting',
        'DELETE /api/settings/:key': 'Delete setting',
        'POST /api/settings/test-api-key': 'Test API key'
      },
      reporting: {
        'GET /api/report': 'Get usage analytics',
        'GET /api/report/sessions': 'Get detailed session report',
        'GET /api/report/models': 'Get model usage report',
        'GET /api/report/export': 'Export data'
      }
    },
    documentation: 'See README.md for detailed API documentation'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `${req.method} ${req.originalUrl} is not a valid endpoint`,
    availableEndpoints: '/api'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('Shutting down gracefully...');
  
  try {
    await database.close();
    console.log('Database connection closed.');
  } catch (error) {
    console.error('Error closing database:', error);
  }
  
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 AI Chat Interface API running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📖 API info: http://localhost:${PORT}/api`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`💾 Database: ${process.env.DATABASE_PATH || './database.sqlite'}`);
});

module.exports = app; 