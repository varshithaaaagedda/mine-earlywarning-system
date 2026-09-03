const { queryRun } = require('../database/db');
const { predictMineRisk } = require('./mlClassifier');

/**
 * Combined Hybrid Risk Decision Rule:
 * Final Risk Level = Max(XGBoost_ML_Prediction, Physical_Safety_Override)
 * 
 * Rule 1: XGBoost Model generates predicted class (Normal, Warning, Critical) & class probabilities.
 * Rule 2: If physical safety threshold is breached (cumulative displacement >= 15mm or annual subsidence rate >= 30mm/yr),
 *         the system IMMEDIATELY overrides the final decision to CRITICAL.
 * Rule 3: ML prediction ALONE cannot bypass or downgrade a critical physical safety rule.
 */
function calculateRiskLevel(telemetry) {
  // Execute XGBoost ML Model Prediction (11 Leakage-Safe Features)
  const mlResult = predictMineRisk(telemetry);

  const disp = parseFloat(telemetry.groundDisplacement || telemetry.ground_displacement_mm || 0);
  const subRate = parseFloat(telemetry.subsidenceRate || telemetry.rate_mm_yr || 0);

  let riskScore = mlResult.riskScore;
  let riskLevel = mlResult.riskClass.toUpperCase(); // "NORMAL", "WARNING", "CRITICAL"

  // Physical Safety Override Rule (Fail-Safe: ML cannot bypass physical threshold)
  if (disp >= 15.0 || subRate >= 30.0) {
    riskLevel = "CRITICAL";
    riskScore = Math.max(riskScore, 98);
  } else if (riskLevel === "NORMAL" && disp >= 5.0) {
    riskLevel = "WATCH";
  }

  return {
    riskScore,
    riskLevel,
    mlPrediction: mlResult
  };
}

async function processTelemetryAndAlerts(siteId, zoneId, telemetry) {
  const { riskScore, riskLevel, mlPrediction } = calculateRiskLevel(telemetry);

  // If CRITICAL or WARNING risk level detected, automatically record an alert in DB
  if (riskLevel === "CRITICAL" || riskLevel === "WARNING" || mlPrediction.riskClass === "Critical" || mlPrediction.riskClass === "Warning") {
    const alertId = `ALT-${Math.floor(100 + Math.random() * 900)}`;
    const severity = (mlPrediction.riskClass || riskLevel).toLowerCase();
    const title = mlPrediction.riskClass === "Critical" || riskLevel === "CRITICAL"
      ? `ML ALERT: Accelerated Ground Deformation (${telemetry.groundDisplacement || telemetry.ground_displacement_mm} mm)`
      : `ML ALERT: Elevated Subsidence & Crack Expansion (${telemetry.groundDisplacement || telemetry.ground_displacement_mm} mm)`;
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

  return { riskScore, riskLevel, mlPrediction };
}

module.exports = {
  calculateRiskLevel,
  processTelemetryAndAlerts
};

