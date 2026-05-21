require('dotenv').config();
const path = require('path');

const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

// Import middleware
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const wishesRoutes = require('./routes/wishes');
const matchesRoutes = require('./routes/matches');
const wishpadRoutes = require('./routes/wishpad');
const searchRoutes = require('./routes/search');
const paymentsRoutes = require('./routes/payments');

// Import workers
const agentWorker = require('./workers/agentWorker');

// Import DB
const pool = require('./db/pool');

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-dev-secret';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Create Express app
const app = express();
const server = http.createServer(app);

// ---------------------
// CORS Configuration
// ---------------------
const corsOptions = {
  origin: FRONTEND_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));

// ---------------------
// Body Parsers
// ---------------------

// IMPORTANT: JSON body parser must NOT process the Stripe webhook route
// We use a verify function to skip JSON parsing for the webhook path
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// Standard JSON parser for all other routes
app.use(express.json({ limit: '10mb' }));

// URL-encoded parser for form data
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ---------------------
// Socket.io Setup
// ---------------------
const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Store io instance for use in routes
app.set('io', io);

// Socket.io authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token || socket.handshake.query.token;

  if (!token) {
    // Allow connection without auth (limited functionality)
    socket.userId = null;
    socket.role = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.userId = decoded.userId;
    socket.role = decoded.role;
    next();
  } catch (err) {
    // Invalid token - allow connection but mark as unauthenticated
    socket.userId = null;
    socket.role = null;
    next();
  }
});

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id} (user: ${socket.userId || 'anonymous'})`);

  // Join user-specific room for targeted events
  if (socket.userId) {
    socket.join(`user_${socket.userId}`);
    console.log(`[Socket] User #${socket.userId} joined their room`);

    // Also join role-based room
    if (socket.role) {
      socket.join(`role_${socket.role}`);
    }
  }

  // Handle joining a specific wish's updates
  socket.on('watch_wish', (wishId) => {
    if (wishId) {
      socket.join(`wish_${wishId}`);
      console.log(`[Socket] ${socket.id} watching wish #${wishId}`);
    }
  });

  // Handle leaving a wish's updates
  socket.on('unwatch_wish', (wishId) => {
    if (wishId) {
      socket.leave(`wish_${wishId}`);
    }
  });

  // Handle manual join of a match room (when viewing match details)
  socket.on('join_match', (matchId) => {
    if (matchId) {
      socket.join(`match_${matchId}`);
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

// ---------------------
// Health Check
// ---------------------
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (err) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: err.message
    });
  }
});

// ---------------------
// Mount Routes
// ---------------------
app.use('/api/auth', authRoutes);
app.use('/api/wishes', wishesRoutes);
app.use('/api/matches', matchesRoutes);
app.use('/api/wishpad', wishpadRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/payments', paymentsRoutes);

// ---------------------
// Production: Serve static frontend build
// ---------------------
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'public')));
}

// ---------------------
// SPA Fallback & 404 Handler
// ---------------------
app.use((req, res) => {
  // In production, serve index.html for non-API routes (SPA routing)
  if (process.env.NODE_ENV === 'production' && !req.path.startsWith('/api')) {
    return res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// ---------------------
// Global Error Handler
// ---------------------
app.use(errorHandler);

// ---------------------
// Start Server
// ---------------------
server.listen(PORT, () => {
  console.log(`[WishPal] Server running on port ${PORT}`);
  console.log(`[WishPal] Frontend URL: ${FRONTEND_URL}`);
  console.log(`[WishPal] Environment: ${process.env.NODE_ENV || 'development'}`);

  // Initialize and start the agent worker with Socket.io
  agentWorker.initWorker(io);
  agentWorker.startWorker();

  console.log('[WishPal] Agent worker started');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[WishPal] SIGTERM received. Shutting down gracefully...');
  agentWorker.stopWorker();
  await pool.end();
  server.close(() => {
    console.log('[WishPal] Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('[WishPal] SIGINT received. Shutting down gracefully...');
  agentWorker.stopWorker();
  await pool.end();
  server.close(() => {
    console.log('[WishPal] Server closed');
    process.exit(0);
  });
});

module.exports = { app, server, io };
