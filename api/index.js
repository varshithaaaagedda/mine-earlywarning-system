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

const app = express();

// Middlewares
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure database schema initialization runs safely on cold starts
app.use(async (req, res, next) => {
  try {
    await initializeDatabase();
    next();
  } catch (err) {
    console.error('❌ Database Initialization Error:', err.message);
    next();
  }
});

// Mount REST API Routes
app.use('/api', healthRoutes);
app.use('/api/sites', sitesRoutes);
app.use('/api', telemetryRoutes);
app.use('/api', zonesRoutes);
app.use('/api', alertsRoutes);
app.use('/api', sensorsRoutes);
app.use('/api', simulationRoutes);

// Fallback health response for /api root
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Mine Subsidence Early Warning System REST API Serverless Backend Running',
    health: '/api/health'
  });
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
