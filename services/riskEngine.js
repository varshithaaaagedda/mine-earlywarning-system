const { queryRun } = require('../database/db');

/**
 * Risk Level Evaluation & Alert Generator Service
 */
function calculateRiskLevel(telemetry) {
  const disp = parseFloat(telemetry.groundDisplacement || telemetry.ground_displacement_mm || 0);
  const tilt = parseFloat(telemetry.tiltAngle || telemetry.tilt_angle_deg || 0);
  const crack = parseFloat(telemetry.crackWidth || telemetry.crack_width_mm || 0);
  const vib = parseFloat(telemetry.vibrationPPV || telemetry.vibration_ppv_mms || 0);

  let riskScore = 15;
  let riskLevel = "SAFE";

  // Displacement factor (Weight: 50%)
  if (disp >= 15.0) {
    riskScore += 45;
  } else if (disp >= 12.0) {
    riskScore += 30;
  } else if (disp >= 5.0) {
    riskScore += 15;
  }

  // Tilt factor (Weight: 25%)
  if (tilt >= 3.0) {
    riskScore += 25;
  } else if (tilt >= 1.5) {
    riskScore += 15;
  } else if (tilt >= 0.5) {
    riskScore += 5;
  }

  // Crack factor (Weight: 15%)
  if (crack >= 5.0) {
    riskScore += 15;
  } else if (crack >= 2.0) {
    riskScore += 8;
  }

  // Vibration factor (Weight: 10%)
  if (vib >= 3.0) {
    riskScore += 10;
  } else if (vib >= 1.5) {
    riskScore += 5;
  }

  // Cap score between 0 and 100
  riskScore = Math.min(100, Math.max(0, Math.round(riskScore)));

  if (riskScore >= 75 || disp >= 15.0) {
    riskLevel = "CRITICAL";
  } else if (riskScore >= 50 || disp >= 12.0 || tilt >= 2.0) {
    riskLevel = "WARNING";
  } else if (riskScore >= 30 || disp >= 5.0) {
    riskLevel = "WATCH";
  } else {
    riskLevel = "SAFE";
  }

  return { riskScore, riskLevel };
}

async function processTelemetryAndAlerts(siteId, zoneId, telemetry) {
  const { riskScore, riskLevel } = calculateRiskLevel(telemetry);

  // If CRITICAL or WARNING risk level detected, automatically record an alert in DB
  if (riskLevel === "CRITICAL" || riskLevel === "WARNING") {
    const alertId = `ALT-${Math.floor(100 + Math.random() * 900)}`;
    const severity = riskLevel.toLowerCase();
    const title = riskLevel === "CRITICAL"
      ? `Accelerated Ground Deformation (${telemetry.groundDisplacement || telemetry.ground_displacement_mm} mm)`
      : `Elevated Subsidence & Strain Detected (${telemetry.groundDisplacement || telemetry.ground_displacement_mm} mm)`;
    const location = `Zone ${zoneId ? zoneId.toUpperCase().replace('ZONE-', '') : 'A'} — Active Extraction Panel`;

    try {
      await queryRun(
        `INSERT INTO alerts (id, site_id, zone_id, sensor_id, code, title, location, time_ago, severity)
         VALUES (?, ?, ?, 'EX-AUTO', ?, ?, ?, 'Just now', ?);`,
        [alertId, siteId, zoneId || 'zone-a', alertId, title, location, severity]
      );
    } catch (err) {
      console.error('Error inserting auto alert:', err.message);
    }
  }

  return { riskScore, riskLevel };
}

module.exports = {
  calculateRiskLevel,
  processTelemetryAndAlerts
};
