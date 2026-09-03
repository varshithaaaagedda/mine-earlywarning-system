const express = require('express');
const router = express.Router();
const { queryAll, queryGet, queryRun } = require('../database/db');
const { processTelemetryAndAlerts } = require('../services/riskEngine');

// GET /api/sites/:siteId/telemetry/latest - Latest telemetry reading
router.get('/sites/:siteId/telemetry/latest', async (req, res) => {
  try {
    const reading = await queryGet(
      `SELECT * FROM sensor_readings WHERE site_id = ? ORDER BY id DESC LIMIT 1;`,
      [req.params.siteId]
    );

    if (!reading) {
      return res.json({
        success: true,
        telemetry: {
          groundDisplacement: 18.2,
          displacementRate: "+2.4 mm/hr",
          tiltAngle: 3.2,
          tiltRate: "+0.4°/hr",
          crackWidth: 6.4,
          crackRate: "+0.8 mm",
          vibrationPPV: 2.8,
          vibrationStatus: "Elevated",
          soilMoisture: 34,
          moistureStatus: "Post-Rain Infiltration",
          sensorBattery: 82,
          signalStrength: -68
        }
      });
    }

    res.json({
      success: true,
      telemetry: {
        id: reading.id,
        groundDisplacement: reading.ground_displacement_mm,
        displacementRate: reading.displacement_rate,
        tiltAngle: reading.tilt_angle_deg,
        tiltRate: reading.tilt_rate,
        crackWidth: reading.crack_width_mm,
        crackRate: reading.crack_rate,
        vibrationPPV: reading.vibration_ppv_mms,
        vibrationStatus: reading.vibration_status,
        soilMoisture: reading.soil_moisture_pct,
        moistureStatus: reading.moisture_status,
        sensorBattery: reading.sensor_battery_pct,
        signalStrength: reading.signal_dbm,
        calculatedRiskLevel: reading.calculated_risk_level,
        timestamp: reading.timestamp
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/sites/:siteId/history - 24-hour displacement graph data
router.get('/sites/:siteId/history', async (req, res) => {
  try {
    const readings = await queryAll(
      `SELECT ground_displacement_mm, timestamp FROM sensor_readings WHERE site_id = ? ORDER BY id ASC LIMIT 24;`,
      [req.params.siteId]
    );

    let labels = ["00:00", "02:00", "04:00", "06:00", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00", "Now"];
    let displacement = [2.1, 2.3, 2.4, 2.8, 3.5, 4.8, 6.2, 8.5, 11.2, 13.8, 15.6, 17.1, 18.2];

    if (readings.length > 0) {
      displacement = readings.map(r => r.ground_displacement_mm);
      labels = readings.map(r => new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }

    res.json({
      success: true,
      displacementHistory24h: {
        labels,
        displacement,
        thresholds: {
          critical: 15.0,
          warning: 12.0,
          normal: 5.0
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/telemetry/ingest - Ingest IoT Sensor Reading
router.post('/telemetry/ingest', async (req, res) => {
  try {
    const {
      siteId,
      zoneId,
      sensorId,
      groundDisplacement,
      displacementRate,
      tiltAngle,
      tiltRate,
      crackWidth,
      crackRate,
      vibrationPPV,
      vibrationStatus,
      soilMoisture,
      moistureStatus,
      sensorBattery,
      signalStrength
    } = req.body;

    // Input Validation
    if (!siteId) {
      return res.status(400).json({ success: false, error: 'siteId is required' });
    }
    if (groundDisplacement === undefined || isNaN(parseFloat(groundDisplacement))) {
      return res.status(400).json({ success: false, error: 'groundDisplacement must be a valid number' });
    }

    const targetSiteId = siteId || 'singareni-s4';
    const targetZoneId = zoneId || 'zone-a';

    // Risk Engine evaluation
    const { riskScore, riskLevel } = await processTelemetryAndAlerts(targetSiteId, targetZoneId, {
      groundDisplacement,
      tiltAngle,
      crackWidth,
      vibrationPPV
    });

    // Save reading in database
    const result = await queryRun(
      `INSERT INTO sensor_readings (
        site_id, zone_id, sensor_id, ground_displacement_mm, displacement_rate,
        tilt_angle_deg, tilt_rate, crack_width_mm, crack_rate,
        vibration_ppv_mms, vibration_status, soil_moisture_pct, moisture_status,
        sensor_battery_pct, signal_dbm, calculated_risk_level
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        targetSiteId,
        targetZoneId,
        sensorId || 'SN-101',
        parseFloat(groundDisplacement),
        displacementRate || '+2.4 mm/hr',
        parseFloat(tiltAngle || 3.2),
        tiltRate || '+0.4°/hr',
        parseFloat(crackWidth || 6.4),
        crackRate || '+0.8 mm',
        parseFloat(vibrationPPV || 2.8),
        vibrationStatus || 'Normal',
        parseInt(soilMoisture || 34),
        moistureStatus || 'Normal Infiltration',
        parseInt(sensorBattery || 85),
        parseInt(signalStrength || -68),
        riskLevel
      ]
    );

    // Update risk zone table displacement text
    await queryRun(
      `UPDATE risk_zones SET displacement = ?, risk_score = ?, status = ? WHERE id = ? AND site_id = ?;`,
      [`${groundDisplacement} mm`, riskScore, riskLevel.toLowerCase(), targetZoneId, targetSiteId]
    );

    res.status(201).json({
      success: true,
      message: 'Telemetry ingested successfully',
      readingId: result.lastID,
      evaluatedRisk: {
        riskScore,
        riskLevel
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/security/logs - Query Cybersecurity Incident Log Audit Table
router.get('/security/logs', async (req, res) => {
  try {
    const logs = await queryAll(`SELECT * FROM security_logs ORDER BY id DESC LIMIT 50;`);
    res.json({
      success: true,
      count: logs.length,
      logs
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
