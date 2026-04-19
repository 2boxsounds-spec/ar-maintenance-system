/**
 * AR Maintenance Support System - Main Server
 * Bournemouth Buses Depot
 * COMP5067 University Project
 */

require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

// Import routes
const authRoutes = require('./api/auth');
const faultRoutes = require('./api/faults');
const toolRoutes = require('./api/tools');
const dashboardRoutes = require('./api/dashboard');

// Import security middleware
const { authMiddleware } = require('./security/auth-middleware');
const rateLimiter = require('./security/rate-limiter');

// Import database
const db = require('./database');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Configuration
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development
  crossOriginEmbedderPolicy: false
}));
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use('/api', rateLimiter);

// Static files
app.use('/ar', express.static(path.join(__dirname, 'ar-frontend')));
app.use('/dashboard', express.static(path.join(__dirname, 'dashboard')));

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/faults', authMiddleware, faultRoutes);
app.use('/api/v1/tool-events', authMiddleware, toolRoutes);
app.use('/api/v1/dashboard', authMiddleware, dashboardRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Socket.IO for real-time updates
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Join bay-specific room
  socket.on('join-bay', (bayId) => {
    socket.join(`bay:${bayId}`);
    console.log(`Client ${socket.id} joined bay:${bayId}`);
  });

  // Handle fault updates
  socket.on('fault-update', (data) => {
    io.to(`bay:${data.bayLocation}`).emit('fault-updated', data);
    io.emit('dashboard-update', { type: 'fault', data });
  });

  // Handle tool events
  socket.on('tool-event', (data) => {
    io.emit('tool-updated', data);
    io.emit('dashboard-update', { type: 'tool', data });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Initialize database and start server
async function startServer() {
  try {
    await db.sync();
    console.log('✅ Database synchronized');

    server.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════════════════╗
║   AR Maintenance Support System - Bournemouth Buses       ║
╠═══════════════════════════════════════════════════════════╣
║   Server running on port ${PORT}                            ║
║                                                           ║
║   AR Frontend:   http://localhost:${PORT}/ar              ║
║   Dashboard:     http://localhost:${PORT}/dashboard       ║
║   API:           http://localhost:${PORT}/api/v1          ║
║   Health Check:  http://localhost:${PORT}/api/health      ║
╚═══════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = { app, io };
