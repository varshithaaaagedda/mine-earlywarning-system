const express = require('express');
const router = express.Router();
const { queryAll } = require('../database/db');

// GET /api/sites/:siteId/zones - Risk Zones
router.get('/sites/:siteId/zones', async (req, res) => {
  try {
    const rawZones = await queryAll('SELECT * FROM risk_zones WHERE site_id = ?;', [req.params.siteId]);
    const zones = rawZones.map(z => ({
      id: z.id,
      name: z.name,
      riskScore: z.risk_score,
      status: z.status,
      description: z.description,
      displacement: z.displacement,
      crackGrowth: z.crack_growth,
      tiltAngle: z.tilt_angle,
      recommendedAction: z.recommended_action,
      polygon: JSON.parse(z.polygon_json)
    }));
    res.json({ success: true, zones });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/sites/:siteId/tunnels - Underground Tunnels Grid
router.get('/sites/:siteId/tunnels', async (req, res) => {
  try {
    const rawTunnels = await queryAll('SELECT * FROM tunnels WHERE site_id = ?;', [req.params.siteId]);
    const tunnels = rawTunnels.map(t => ({
      id: t.id,
      name: t.name,
      type: t.type,
      path: JSON.parse(t.path_json)
    }));
    res.json({ success: true, tunnels });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/sites/:siteId/infrastructure - Surface Infrastructure Overlay
router.get('/sites/:siteId/infrastructure', async (req, res) => {
  try {
    const rawInfra = await queryAll('SELECT * FROM surface_infrastructure WHERE site_id = ?;', [req.params.siteId]);
    const surfaceInfrastructure = {};
    rawInfra.forEach(item => {
      surfaceInfrastructure[item.category] = {
        name: item.name,
        ...JSON.parse(item.geometry_json)
      };
    });
    res.json({ success: true, surfaceInfrastructure });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
