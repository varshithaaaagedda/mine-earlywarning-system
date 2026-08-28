const express = require('express');
const router = express.Router();
const { queryGet } = require('../database/db');

router.get('/health', async (req, res) => {
  try {
    const dbCheck = await queryGet('SELECT COUNT(*) as sites_count FROM sites;');
    res.json({
      status: 'UP',
      system: 'Mine Subsidence Early Warning Backend',
      timestamp: new Date().toISOString(),
      database: 'Connected',
      sitesCount: dbCheck.sites_count
    });
  } catch (error) {
    res.status(500).json({
      status: 'DOWN',
      error: error.message
    });
  }
});

module.exports = router;
