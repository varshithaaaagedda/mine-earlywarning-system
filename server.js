const express = require('express');
const path = require('path');
const app = require('./api/index');
const { initializeDatabase } = require('./database/init');

const PORT = process.env.PORT || 3000;

// Serve static frontend assets for local execution
app.use(express.static(__dirname));

// Fallback to index.html for root page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Standalone local execution server listener
if (require.main === module) {
  initializeDatabase().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Mine Subsidence Early Warning System Backend running at: http://localhost:${PORT}`);
      console.log(`📡 REST API Base URL: http://localhost:${PORT}/api`);
    });
  }).catch((err) => {
    console.error('❌ Failed to start backend server:', err.message);
  });
}

module.exports = app;
