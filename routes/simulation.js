const express = require('express');
const router = express.Router();
const { queryGet, queryRun } = require('../database/db');
const { processTelemetryAndAlerts } = require('../services/riskEngine');

// POST /api/simulation/trigger-rain - Heavy Rain Infiltration
router.get('/simulation/trigger-rain', async (req, res) => handleRain(req, res));
router.post('/simulation/trigger-rain', async (req, res) => handleRain(req, res));

async function handleRain(req, res) {
  try {
    const siteId = req.body?.siteId || req.query?.siteId || 'singareni-s4';
    const latest = await queryGet('SELECT * FROM sensor_readings WHERE site_id = ? ORDER BY id DESC LIMIT 1;', [siteId]) || {};

    const newMoisture = Math.min(95, (latest.soil_moisture_pct || 34) + 15);
    const newDisp = parseFloat(((latest.ground_displacement_mm || 18.2) + 1.2).toFixed(1));

    const { riskScore, riskLevel } = await processTelemetryAndAlerts(siteId, 'zone-a', {
      groundDisplacement: newDisp,
      tiltAngle: latest.tilt_angle_deg || 3.2,
      crackWidth: latest.crack_width_mm || 6.4,
      vibrationPPV: latest.vibration_ppv_mms || 2.8
    });

    await queryRun(
      `INSERT INTO sensor_readings (
        site_id, zone_id, ground_displacement_mm, displacement_rate, tilt_angle_deg, tilt_rate,
        crack_width_mm, crack_rate, vibration_ppv_mms, vibration_status, soil_moisture_pct,
        moisture_status, sensor_battery_pct, signal_dbm, calculated_risk_level
      ) VALUES (?, 'zone-a', ?, '+3.6 mm/hr', ?, '+0.4°/hr', ?, '+0.8 mm', ?, 'Elevated', ?, 'Heavy Rain Infiltration Alert', 82, -68, ?);`,
      [siteId, newDisp, latest.tilt_angle_deg || 3.2, latest.crack_width_mm || 6.4, latest.vibration_ppv_mms || 2.8, newMoisture, riskLevel]
    );

    res.json({
      success: true,
      message: `🌧️ Heavy Rain Simulation Injected. Soil moisture increased to ${newMoisture}%`,
      telemetry: {
        groundDisplacement: newDisp,
        displacementRate: "+3.6 mm/hr",
        soilMoisture: newMoisture,
        moistureStatus: "Heavy Rain Infiltration Alert",
        calculatedRiskLevel: riskLevel
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

// POST /api/simulation/trigger-spike - Rapid Displacement Acceleration
router.get('/simulation/trigger-spike', async (req, res) => handleSpike(req, res));
router.post('/simulation/trigger-spike', async (req, res) => handleSpike(req, res));

async function handleSpike(req, res) {
  try {
    const siteId = req.body?.siteId || req.query?.siteId || 'singareni-s4';
    const latest = await queryGet('SELECT * FROM sensor_readings WHERE site_id = ? ORDER BY id DESC LIMIT 1;', [siteId]) || {};

    const newDisp = parseFloat(((latest.ground_displacement_mm || 18.2) + 3.5).toFixed(1));
    const newTilt = parseFloat(((latest.tilt_angle_deg || 3.2) + 0.8).toFixed(1));
    const newCrack = parseFloat(((latest.crack_width_mm || 6.4) + 1.4).toFixed(1));

    const { riskScore, riskLevel } = await processTelemetryAndAlerts(siteId, 'zone-a', {
      groundDisplacement: newDisp,
      tiltAngle: newTilt,
      crackWidth: newCrack,
      vibrationPPV: 3.5
    });

    await queryRun(
      `INSERT INTO sensor_readings (
        site_id, zone_id, ground_displacement_mm, displacement_rate, tilt_angle_deg, tilt_rate,
        crack_width_mm, crack_rate, vibration_ppv_mms, vibration_status, soil_moisture_pct,
        moisture_status, sensor_battery_pct, signal_dbm, calculated_risk_level
      ) VALUES (?, 'zone-a', ?, '+5.2 mm/hr (RAPID)', ?, '+0.8°/hr', ?, '+1.4 mm', 3.5, 'High Vibration', ?, 'Post-Rain Infiltration', 82, -68, ?);`,
      [siteId, newDisp, newTilt, newCrack, latest.soil_moisture_pct || 34, riskLevel]
    );

    res.json({
      success: true,
      message: '⚠️ Simulation: Accelerated ground deformation triggered in Zone A!',
      telemetry: {
        groundDisplacement: newDisp,
        displacementRate: "+5.2 mm/hr (RAPID)",
        tiltAngle: newTilt,
        crackWidth: newCrack,
        calculatedRiskLevel: riskLevel
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

// POST /api/simulation/reset - Reset Baseline Data
router.get('/simulation/reset', async (req, res) => handleReset(req, res));
router.post('/simulation/reset', async (req, res) => handleReset(req, res));

async function handleReset(req, res) {
  try {
    const siteId = req.body?.siteId || req.query?.siteId || 'singareni-s4';

    await queryRun(
      `INSERT INTO sensor_readings (
        site_id, zone_id, ground_displacement_mm, displacement_rate, tilt_angle_deg, tilt_rate,
        crack_width_mm, crack_rate, vibration_ppv_mms, vibration_status, soil_moisture_pct,
        moisture_status, sensor_battery_pct, signal_dbm, calculated_risk_level
      ) VALUES (?, 'zone-a', 18.2, '+2.4 mm/hr', 3.2, '+0.4°/hr', 6.4, '+0.8 mm', 2.8, 'Elevated', 34, 'Baseline Normal', 82, -68, 'CRITICAL');`,
      [siteId]
    );

    res.json({
      success: true,
      message: '🔄 Baseline telemetry reset successfully.',
      telemetry: {
        groundDisplacement: 18.2,
        displacementRate: "+2.4 mm/hr",
        tiltAngle: 3.2,
        crackWidth: 6.4,
        soilMoisture: 34
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = router;
