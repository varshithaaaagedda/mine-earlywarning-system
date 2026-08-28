const express = require('express');
const router = express.Router();
const { queryAll, queryGet, queryRun } = require('../database/db');

// GET /api/sites/:siteId/alerts - Get active alerts feed
router.get('/sites/:siteId/alerts', async (req, res) => {
  try {
    const { severity } = req.query;
    let sql = 'SELECT id, code, title, location, time_ago as timeAgo, severity, acknowledged FROM alerts WHERE site_id = ?';
    const params = [req.params.siteId];

    if (severity && severity !== 'all') {
      sql += ' AND severity = ?';
      params.push(severity.toLowerCase());
    }

    sql += ' ORDER BY id DESC;';

    const alerts = await queryAll(sql, params);
    res.json({ success: true, alerts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/alerts/:alertId/acknowledge - Acknowledge active alert
router.post('/alerts/:alertId/acknowledge', async (req, res) => {
  try {
    const alertId = req.params.alertId;
    const result = await queryRun('UPDATE alerts SET acknowledged = 1 WHERE id = ?;', [alertId]);
    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: 'Alert not found' });
    }
    res.json({ success: true, message: `Alert ${alertId} acknowledged successfully.` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/alerts - Create manual alert
router.post('/alerts', async (req, res) => {
  try {
    const { siteId, zoneId, sensorId, code, title, location, severity } = req.body;
    if (!title || !severity) {
      return res.status(400).json({ success: false, error: 'title and severity are required' });
    }

    const alertId = code || `ALT-${Math.floor(100 + Math.random() * 900)}`;
    await queryRun(
      `INSERT INTO alerts (id, site_id, zone_id, sensor_id, code, title, location, time_ago, severity)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'Just now', ?);`,
      [alertId, siteId || 'singareni-s4', zoneId || 'zone-a', sensorId || 'SN-101', alertId, title, location || 'Sector 4 East', severity.toLowerCase()]
    );

    res.status(201).json({ success: true, alertId, message: 'Alert created successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
