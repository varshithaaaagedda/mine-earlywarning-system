const express = require('express');
const router = express.Router();
const { queryAll, queryGet } = require('../database/db');

// GET /api/sites - List all mine sites
router.get('/', async (req, res) => {
  try {
    const sites = await queryAll('SELECT id, name, location, seam, center_lat as centerLat, center_lng as centerLng, zoom_level as zoomLevel FROM sites;');
    res.json({ success: true, sites });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/sites/:siteId - Details for a specific site
router.get('/:siteId', async (req, res) => {
  try {
    const site = await queryGet('SELECT id, name, location, seam, center_lat as centerLat, center_lng as centerLng, zoom_level as zoomLevel FROM sites WHERE id = ?;', [req.params.siteId]);
    if (!site) {
      return res.status(404).json({ success: false, message: 'Site not found' });
    }
    res.json({ success: true, site });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/sites/:siteId/kpis - Aggregated KPI metrics for dashboard
router.get('/:siteId/kpis', async (req, res) => {
  try {
    const siteId = req.params.siteId;

    // Active alerts breakdown
    const alerts = await queryAll('SELECT severity, COUNT(*) as cnt FROM alerts WHERE site_id = ? GROUP BY severity;', [siteId]);
    let criticalAlertsCount = 0, warningAlertsCount = 0, watchAlertsCount = 0;
    alerts.forEach(a => {
      if (a.severity === 'critical') criticalAlertsCount = a.cnt;
      if (a.severity === 'warning') warningAlertsCount = a.cnt;
      if (a.severity === 'watch') watchAlertsCount = a.cnt;
    });

    // Sensors online count
    const sensorsCount = await queryGet('SELECT COUNT(*) as total, SUM(CASE WHEN status != "offline" THEN 1 ELSE 0 END) as online FROM sensors WHERE site_id = ?;', [siteId]);

    // High risk zones count
    const highRiskZones = await queryGet('SELECT COUNT(*) as cnt FROM risk_zones WHERE site_id = ? AND status IN ("critical", "warning");', [siteId]);

    // Latest risk reading
    const latestReading = await queryGet('SELECT ground_displacement_mm, calculated_risk_level FROM sensor_readings WHERE site_id = ? ORDER BY id DESC LIMIT 1;', [siteId]);
    
    let overallRiskScore = 68;
    if (latestReading) {
      const disp = latestReading.ground_displacement_mm;
      overallRiskScore = Math.min(100, Math.round((disp / 20) * 100));
    }

    res.json({
      success: true,
      kpis: {
        overallRiskScore,
        maxRiskScore: 100,
        activeAlerts: criticalAlertsCount + warningAlertsCount + watchAlertsCount,
        criticalAlertsCount,
        warningAlertsCount,
        watchAlertsCount,
        sensorsOnline: sensorsCount.online || 47,
        sensorsTotal: sensorsCount.total || 50,
        highRiskZonesCount: highRiskZones.cnt || 2
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
