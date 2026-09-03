/**
 * 4-Layer Intelligent Server Check Engine
 * Implementation of your team's 4-layer server verification logic:
 * Layer 1: Baseline deviation (node vs its own baseline tilt)
 * Layer 2: Trend over time (sustained 7-day trend check)
 * Layer 3: Cross-sensor agreement (tilt AND vibration both abnormal)
 * Layer 4: Cross-node consensus (physically nearby neighbor nodes in LoRa network)
 */

const nodeRegistry = {
  "Node_03": { location: [150, 300], neighbors: ["Node_02", "Node_04"], baselineTilt: 0.10, baselineVibration: 0.05 },
  "Node_04": { location: [225, 300], neighbors: ["Node_03", "Node_05"], baselineTilt: 0.15, baselineVibration: 0.06 },
  "Node_02": { location: [75, 300],  neighbors: ["Node_01", "Node_03"], baselineTilt: 0.12, baselineVibration: 0.05 },
  "SN-101":  { location: [17.5479, 80.6096], neighbors: ["SN-102", "SN-103"], baselineTilt: 0.10, baselineVibration: 0.05 },
  "SN-102":  { location: [17.5477, 80.6096], neighbors: ["SN-101", "SN-103"], baselineTilt: 0.15, baselineVibration: 0.06 }
};

const readingHistory = {
  "Node_03": [],
  "Node_04": [],
  "Node_02": [],
  "SN-101": [],
  "SN-102": []
};

// Threshold Parameters
const TILT_DEVIATION_THRESHOLD = 0.2;  // degrees
const TREND_DAYS_TO_CHECK = 7;         // days
const TREND_MIN_INCREASE = 0.15;       // degrees
const CROSS_NODE_TIME_WINDOW_MIN = 10; // minutes
const MIN_AGREEING_NODES = 2;          // minimum agreeing nodes count

function receiveReading(nodeId, tilt, vibration, timestamp = null) {
  const ts = timestamp ? new Date(timestamp) : new Date();

  if (!readingHistory[nodeId]) {
    readingHistory[nodeId] = [];
  }

  const reading = { tilt: parseFloat(tilt), vibration: parseFloat(vibration), timestamp: ts };
  readingHistory[nodeId].push(reading);

  const evaluation = evaluateReading(nodeId, reading);
  return {
    nodeId,
    reading,
    evaluation
  };
}

function evaluateReading(nodeId, reading) {
  const registry = nodeRegistry[nodeId] || { location: [0,0], neighbors: [], baselineTilt: 0.10, baselineVibration: 0.05 };

  // ----- LAYER 1: Baseline deviation -----
  const deviation = reading.tilt - registry.baselineTilt;
  const baselineFlag = Math.abs(deviation) > TILT_DEVIATION_THRESHOLD;

  const l1 = {
    layer: 1,
    name: "Baseline Deviation",
    deviation: parseFloat(deviation.toFixed(3)),
    threshold: TILT_DEVIATION_THRESHOLD,
    passed: baselineFlag,
    status: baselineFlag ? "SUSPICIOUS - Exceeds baseline tilt threshold" : "NORMAL - Within baseline range"
  };

  if (!baselineFlag) {
    return {
      confirmedAlert: false,
      status: "NORMAL - Within baseline range",
      layers: { l1 }
    };
  }

  // ----- LAYER 2: Trend over time -----
  const trendConfirmed = checkTrend(nodeId);
  const l2 = {
    layer: 2,
    name: "Trend Over Time",
    daysChecked: TREND_DAYS_TO_CHECK,
    minIncrease: TREND_MIN_INCREASE,
    passed: trendConfirmed,
    status: trendConfirmed ? "CONFIRMED sustained tilt increase" : "FLAGGED - One-off spike, not sustained"
  };

  if (!trendConfirmed) {
    return {
      confirmedAlert: false,
      status: "Flagged but not a sustained trend (likely noise)",
      layers: { l1, l2 }
    };
  }

  // ----- LAYER 3: Cross-sensor agreement -----
  const vibrationFlag = reading.vibration > (registry.baselineVibration * 1.5);
  const l3 = {
    layer: 3,
    name: "Cross-Sensor Agreement",
    vibrationReading: reading.vibration,
    baselineVibration: registry.baselineVibration,
    passed: vibrationFlag,
    status: vibrationFlag ? "Vibration ALSO abnormal (50%+ above baseline)" : "Tilt trend present but vibration normal (lower confidence)"
  };

  if (!vibrationFlag) {
    return {
      confirmedAlert: false,
      status: "Tilt trend present but vibration normal (lower confidence)",
      layers: { l1, l2, l3 }
    };
  }

  // ----- LAYER 4: Cross-node consensus -----
  const agreeingNodes = checkNeighbors(nodeId, reading.timestamp);
  const consensusPassed = (agreeingNodes.length + 1) >= MIN_AGREEING_NODES;

  const l4 = {
    layer: 4,
    name: "Cross-Node Consensus",
    agreeingNodes,
    minAgreeingNodes: MIN_AGREEING_NODES,
    passed: consensusPassed,
    status: consensusPassed
      ? `CONFIRMED - ${agreeingNodes.length} nearby neighbor node(s) also suspicious: [${agreeingNodes.join(', ')}]`
      : "Only this node abnormal - possible faulty/tampered sensor, not confirmed"
  };

  if (!consensusPassed) {
    return {
      confirmedAlert: false,
      status: "Only this node abnormal (possible faulty/tampered sensor)",
      layers: { l1, l2, l3, l4 }
    };
  }

  // All 4 Layers Passed -> CONFIRMED ALERT
  return {
    confirmedAlert: true,
    riskLevel: "CRITICAL",
    status: "CONFIRMED ALERT - All 4 layers passed",
    agreeingNodes,
    layers: { l1, l2, l3, l4 }
  };
}

function checkTrend(nodeId) {
  const history = readingHistory[nodeId] || [];
  const cutoff = new Date(Date.now() - (TREND_DAYS_TO_CHECK * 24 * 60 * 60 * 1000));
  const recent = history.filter(r => new Date(r.timestamp) >= cutoff);

  if (recent.length < 2) return false;

  const registry = nodeRegistry[nodeId] || { baselineTilt: 0.10 };
  const firstDev = recent[0].tilt - registry.baselineTilt;
  const lastDev = recent[recent.length - 1].tilt - registry.baselineTilt;
  const increase = lastDev - firstDev;

  return increase >= TREND_MIN_INCREASE;
}

function checkNeighbors(nodeId, timestamp) {
  const registry = nodeRegistry[nodeId] || { neighbors: [] };
  const neighbors = registry.neighbors || [];
  const agreeing = [];

  const targetTs = new Date(timestamp).getTime();
  const windowMs = CROSS_NODE_TIME_WINDOW_MIN * 60 * 1000;

  for (const nId of neighbors) {
    const nHistory = readingHistory[nId] || [];
    const nBaseline = (nodeRegistry[nId] || {}).baselineTilt || 0.10;

    for (const r of nHistory) {
      const rTs = new Date(r.timestamp).getTime();
      if (Math.abs(rTs - targetTs) <= windowMs) {
        const dev = Math.abs(r.tilt - nBaseline);
        if (dev > TILT_DEVIATION_THRESHOLD) {
          agreeing.push(nId);
          break;
        }
      }
    }
  }

  return agreeing;
}

module.exports = {
  nodeRegistry,
  readingHistory,
  receiveReading,
  evaluateReading,
  checkTrend,
  checkNeighbors
};
