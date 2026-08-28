const express = require('express');
const router = express.Router();
const { queryAll } = require('../database/db');

// GET /api/sites/:siteId/sensors - Diagnostic Sensor Fleet List
router.get('/sites/:siteId/sensors', async (req, res) => {
  try {
    const rawSensors = await queryAll(
      `SELECT id, name, type, zone_id as zoneId, status, lat, lng, displacement_mm as displacement, battery_pct as battery, signal_dbm as signal, last_ping as lastPing FROM sensors WHERE site_id = ?;`,
      [req.params.siteId]
    );

    const sensors = rawSensors.map(s => ({
      id: s.id,
      name: s.name,
      type: s.type,
      zoneId: s.zoneId,
      status: s.status,
      coords: [s.lat, s.lng],
      displacement: `${s.displacement} mm`,
      battery: `${s.battery}%`,
      signal: `${s.signal} dBm`,
      lastPing: s.lastPing || 'Just now'
    }));

    res.json({ success: true, count: sensors.length, sensors });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
