const express = require('express');
const router = express.Router();
const { predictMineRisk, getModelInfo } = require('../services/mlClassifier');
const { receiveReading, evaluateReading } = require('../services/fourLayerEngine');
const { verifyPacketSecurity, generateHMAC } = require('../services/cyberSecurity');

/**
 * POST /api/ml/predict - Perform real-time ML risk classification
 */
router.post('/ml/predict', (req, res) => {
  try {
    const telemetry = req.body || {};
    const prediction = predictMineRisk(telemetry);

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      prediction: {
        riskClass: prediction.riskClass,         // "Normal" | "Warning" | "Critical"
        riskScore: prediction.riskScore,         // 0 - 100
        confidence: prediction.confidence,       // %
        probabilities: prediction.probabilities, // { Normal: 0.05, Warning: 0.15, Critical: 0.80 }
        anomalies: prediction.anomalies,
        featureImportance: prediction.featureImportance
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/ml/node-reading - Ingest IoT node reading through Cybersecurity Layer & 4-Layer Server Check Engine
 * Payload: { nodeId: "Node_03", seq: 101, hmac: "...", tilt: 0.40, vibration: 0.09, timestamp: "..." }
 */
router.post('/ml/node-reading', (req, res) => {
  try {
    const payload = req.body || {};

    // Step 1: CYBERSECURITY LAYER VERIFICATION (HMAC-SHA256 & Sequence Anti-Replay Check)
    const securityCheck = verifyPacketSecurity(payload);
    
    if (!securityCheck.isValid) {
      return res.status(401).json({
        success: false,
        securityAlert: securityCheck,
        error: securityCheck.message
      });
    }

    // Step 2: 4-LAYER INTELLIGENT ANALYSIS ARCHITECTURE
    const targetNode = payload.nodeId || "Node_03";
    const result = receiveReading(targetNode, parseFloat(payload.tilt || 0.40), parseFloat(payload.vibration || 0.09), payload.timestamp);

    res.json({
      success: true,
      cyberSecurity: securityCheck,
      result
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/ml/model-info - Retrieve ML model performance metrics, accuracy & confusion matrix
 */
router.get('/ml/model-info', (req, res) => {
  try {
    const metrics = getModelInfo();
    res.json({
      success: true,
      model: metrics
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

