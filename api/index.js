const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { initializeDatabase } = require('../database/init');
const healthRoutes = require('../routes/health');
const sitesRoutes = require('../routes/sites');
const telemetryRoutes = require('../routes/telemetry');
const zonesRoutes = require('../routes/zones');
const alertsRoutes = require('../routes/alerts');
const sensorsRoutes = require('../routes/sensors');
const simulationRoutes = require('../routes/simulation');
const mlRoutes = require('../routes/ml');

const app = express();

// Middlewares
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cold-start database schema initialization
initializeDatabase().catch(err => {
  console.error('❌ Cold-start Database Initialization Error:', err.message);
});

// URL path normalization for Vercel serverless function rewrites
app.use((req, res, next) => {
  if (req.url.startsWith('/api/index.js')) {
    req.url = req.url.replace('/api/index.js', '') || '/';
  }
  next();
});

// Mount REST API Routes (supports both /api prefix and root subpaths for Vercel serverless compatibility)
app.use('/api/sites', sitesRoutes);
app.use('/sites', sitesRoutes);

app.use('/api', healthRoutes);
app.use('/', healthRoutes);

app.use('/api', telemetryRoutes);
app.use('/', telemetryRoutes);

app.use('/api', zonesRoutes);
app.use('/', zonesRoutes);

app.use('/api', alertsRoutes);
app.use('/', alertsRoutes);

app.use('/api', sensorsRoutes);
app.use('/', sensorsRoutes);

app.use('/api', simulationRoutes);
app.use('/', simulationRoutes);

app.use('/api', mlRoutes);
app.use('/', mlRoutes);

// Fallback health response for /api root
app.get(['/api', '/api/'], (req, res) => {
  res.json({
    success: true,
    message: 'Mine Subsidence Early Warning System REST API Serverless Backend Running',
    health: '/api/health'
  });
});

const fs = require('fs');

// Serve static frontend assets for root or non-API requests
const publicDir = path.join(__dirname, '..', 'public');
const rootDir = path.join(__dirname, '..');

if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
}
app.use(express.static(rootDir));

// Serve index.html for root page requests
app.get('/', (req, res) => {
  if (fs.existsSync(path.join(publicDir, 'index.html'))) {
    return res.sendFile(path.join(publicDir, 'index.html'));
  }
  res.sendFile(path.join(rootDir, 'index.html'));
});

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('❌ Server Internal Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

// Export Express app for Vercel Serverless Function Handler
module.exports = app;
