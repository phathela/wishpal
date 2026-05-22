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
const fs = require('fs');

/**
 * Run database migrations automatically on startup.
 */
async function runMigrations() {
  const migrationsDir = path.join(__dirname, 'db', 'migrations');
  if (!fs.existsSync(migrationsDir)) return;

  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    try {
      await pool.query(sql);
      console.log(`[Migration] Applied: ${file}`);
    } catch (err) {
      // If migration already applied or error, log and continue
      console.log(`[Migration] ${file}: ${err.message}`);
    }
  }
}

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

// Liveness probe — always returns 200 so Railway's healthcheck passes
// regardless of database availability.
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Readiness probe — verifies database connectivity for monitoring purposes.
// Not used by Railway's healthcheck; will return 503 when the DB is unreachable.
app.get('/api/health/ready', async (req, res) => {
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
// Debug: show directory structure for diagnosing frontend issues
// ---------------------
app.get('/api/debug', (req, res) => {
  const candidates = [
    path.join(__dirname, 'public'),
    path.join(__dirname, '..', 'frontend', 'dist'),
    path.join(__dirname, '..', 'frontend'),
    path.join(__dirname, '..'),
  ];
  const checks = candidates.map(dir => ({
    dir,
    exists: fs.existsSync(dir),
    hasIndex: fs.existsSync(path.join(dir, 'index.html')),
    contents: fs.existsSync(dir) ? fs.readdirSync(dir).slice(0, 20) : []
  }));

  // Database connection diagnostic info
  const dbUrl = process.env.DATABASE_URL || '';
  const maskedUrl = dbUrl ? dbUrl.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') : '(not set)';
  const isLocalHost = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');

  res.json({
    cwd: process.cwd(),
    __dirname: __dirname,
    checks,
    nodeEnv: process.env.NODE_ENV,
    database: {
      url: maskedUrl,
      hasDbUrl: !!dbUrl,
      isLocalHost,
      sslMode: isLocalHost ? 'disabled' : 'enabled (rejectUnauthorized: false)',
      pgVersion: require('pg/package.json').version
    }
  });
});

// Database diagnostic endpoint - tests connection and returns full error details
app.get('/api/debug/db', async (req, res) => {
  const diagnostics = { poolState: {} };
  try {
    // Get pool stats (pg@8.13 has totalCount, idleCount, waitingCount)
    if (pool.totalCount !== undefined) {
      diagnostics.poolState = {
        totalConnections: pool.totalCount,
        idle: pool.idleCount,
        waiting: pool.waitingCount
      };
    }
    // Test pool.query
    await pool.query('SELECT 1');
    diagnostics.poolQuery = 'ok';
  } catch (err) {
    diagnostics.poolQuery = 'failed';
    diagnostics.errorType = typeof err;
    diagnostics.errorConstructor = err?.constructor?.name;
    diagnostics.errorMessage = err?.message;
    diagnostics.errorCode = err?.code;
    diagnostics.hasStack = !!err?.stack;
    diagnostics.errorKeys = err ? Object.keys(err) : [];

    // Try direct new client connection
    try {
      const { Client } = require('pg');
      const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000
      });
      await client.connect();
      await client.query('SELECT 1');
      diagnostics.directClient = 'ok';
      await client.end();
    } catch (directErr) {
      diagnostics.directClient = 'failed';
      diagnostics.directErrorType = typeof directErr;
      diagnostics.directErrorMessage = directErr?.message;
      diagnostics.directErrorCode = directErr?.code;
      diagnostics.directErrorKeys = directErr ? Object.keys(directErr) : [];
    }

    // Try without SSL
    try {
      const { Client } = require('pg');
      const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: false,
        connectionTimeoutMillis: 5000
      });
      await client.connect();
      await client.query('SELECT 1');
      diagnostics.directNoSsl = 'ok';
      await client.end();
    } catch (directErr) {
      diagnostics.directNoSsl = 'failed';
      diagnostics.directNoSslError = directErr?.message;
    }
  }

  // Log diagnostics to server console
  console.error('[DB-DIAG] Full diagnostic result:', JSON.stringify(diagnostics, null, 2));

  res.json(diagnostics);
});

app.use('/api/auth', authRoutes);
app.use('/api/wishes', wishesRoutes);
app.use('/api/matches', matchesRoutes);
app.use('/api/wishpad', wishpadRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/payments', paymentsRoutes);

// ---------------------
// Serve static frontend build (try multiple possible locations)
// ---------------------
const frontendCandidates = [
  path.join(__dirname, 'public'),                    // backend/public/ (copy approach)
  path.join(__dirname, '..', 'frontend', 'dist'),    // frontend/dist/ (via __dirname)
  path.join(process.cwd(), 'frontend', 'dist'),      // frontend/dist/ (via CWD for Railway)
];
let publicDir = null;
for (const dir of frontendCandidates) {
  if (fs.existsSync(dir) && fs.existsSync(path.join(dir, 'index.html'))) {
    publicDir = dir;
    break;
  }
}
if (publicDir) {
  app.use(express.static(publicDir));
  console.log(`[WishPal] Serving static frontend from ${publicDir}`);
}

// ---------------------
// SPA Fallback & 404 Handler
// ---------------------
app.use((req, res) => {
  if (publicDir && !req.path.startsWith('/api')) {
    return res.sendFile(path.join(publicDir, 'index.html'));
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
async function startServer() {
  // Wait for database and run migrations
  for (let i = 0; i < 10; i++) {
    try {
      await pool.query('SELECT 1');
      console.log('[WishPal] Database connected');
      await runMigrations();
      break;
    } catch (err) {
      console.log(`[WishPal] Waiting for database... (${i + 1}/10)`);
      await new Promise(r => setTimeout(r, 3000));
    }
  }

  server.listen(PORT, () => {
    console.log(`[WishPal] Server running on port ${PORT}`);
    console.log(`[WishPal] Frontend URL: ${FRONTEND_URL}`);
    console.log(`[WishPal] Environment: ${process.env.NODE_ENV || 'development'}`);

    // Initialize and start the agent worker with Socket.io
    agentWorker.initWorker(io);
    agentWorker.startWorker();

    console.log('[WishPal] Agent worker started');
  });
}

startServer();

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

// ---------------------
// Process-level error handlers (prevent crashes on unhandled rejections)
// ---------------------
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Process] UNHANDLED PROMISE REJECTION:', reason instanceof Error ? reason.message : reason);
  if (reason?.stack) console.error('[Process] Stack:', reason.stack);
  // Don't exit - keep the server running
});

process.on('uncaughtException', (err) => {
  console.error('[Process] UNCAUGHT EXCEPTION:', err.message);
  console.error(err.stack);
  // Don't exit - keep the server running
});

module.exports = { app, server, io };
