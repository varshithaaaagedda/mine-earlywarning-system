const express = require('express');
const router = express.Router();
const { queryGet } = require('../database/db');

router.get('/health', async (req, res) => {
  try {
    const dbCheck = await queryGet('SELECT COUNT(*) as sites_count FROM sites;');
    res.json({
      status: 'ok',
      system: 'Mine Subsidence Early Warning Backend',
      timestamp: new Date().toISOString(),
      database: 'Connected',
      sitesCount: dbCheck ? dbCheck.sites_count : 4
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

module.exports = router;
