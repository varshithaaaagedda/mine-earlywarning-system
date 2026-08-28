const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { initializeDatabase } = require('./database/init');
const healthRoutes = require('./routes/health');
const sitesRoutes = require('./routes/sites');
const telemetryRoutes = require('./routes/telemetry');
const zonesRoutes = require('./routes/zones');
const alertsRoutes = require('./routes/alerts');
const sensorsRoutes = require('./routes/sensors');
const simulationRoutes = require('./routes/simulation');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(__dirname));

// Mount REST API Routes
app.use('/api', healthRoutes);
app.use('/api/sites', sitesRoutes);
app.use('/api', telemetryRoutes);
app.use('/api', zonesRoutes);
app.use('/api', alertsRoutes);
app.use('/api', sensorsRoutes);
app.use('/api', simulationRoutes);

// Fallback to index.html for SPA / root requests
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('❌ Server Internal Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'API Endpoint Not Found' });
});

// Initialize Database & Start Express Server
async function startServer() {
  try {
    await initializeDatabase();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Mine Subsidence Early Warning System Backend running at: http://localhost:${PORT}`);
      console.log(`📡 REST API Base URL: http://localhost:${PORT}/api`);
    });
  } catch (err) {
    console.error('❌ Failed to start backend server:', err.message);
    process.exit(1);
  }
}

startServer();
