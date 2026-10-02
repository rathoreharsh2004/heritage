require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDB, getIsConnected } = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Route modules
const authRoutes = require('./routes/authRoutes');
const contentRoutes = require('./routes/contentRoutes');
const mediaRoutes = require('./routes/mediaRoutes');
const enquiryRoutes = require('./routes/enquiryRoutes');
const auditRoutes = require('./routes/auditRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Parsing Middleware
app.use(cors({
  origin: '*',
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint (reports real MongoDB connectivity status)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: getIsConnected() ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api', contentRoutes); // mounts /api/content, /api/settings, /api/sections, /api/projects, etc.

// Serve Admin Panel at /admin
app.use('/admin', express.static(path.join(__dirname, '../admin')));

// Serve root static assets (videos, images, icons, and public index.html)
app.use(express.static(path.join(__dirname, '..'), {
  index: 'index.html',
}));

// Route fallback for /admin single page app
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(__dirname, '../admin/index.html'));
});

// Route fallback for root public website
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

// Centralized Error Handler
app.use(errorHandler);

// Start server after connecting to database
async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`🏰 Rathore Heritage Developers CMS Server Running`);
      console.log(`🌐 Public Website:  http://localhost:${PORT}/`);
      console.log(`🛡️  Admin Panel:     http://localhost:${PORT}/admin/`);
      console.log(`📡 API Base:        http://localhost:${PORT}/api/`);
      console.log(`====================================================`);
    });
  } catch (err) {
    console.error('[Server Startup Fatal Error]', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = app;

