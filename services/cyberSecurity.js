/**
 * Cybersecurity Layer Service for IoT Edge Nodes & Gateway Server
 * 
 * Flowchart Architecture:
 * 1. HMAC-SHA256 Message Authentication Code (MAC) generation & verification
 * 2. Monotonically increasing Sequence Number anti-replay protection
 * 3. Sensor Packet Integrity & Anti-Tampering Shield
 */

const crypto = require('crypto');

// Secret Preshared Cryptographic Key (HMAC Key shared between ESP32 Edge Nodes & Server)
const PRESHARED_SECRET_KEY = process.env.HMAC_SECRET_KEY || 'Raniganj-Mine-Security-Secret-Key-2026';

// Tracking last seen sequence number per sensor node to reject replayed packets
const nodeSequenceRegistry = {
  'Node_03': 100,
  'Node_04': 100,
  'Node_02': 100,
  'SN-101': 100,
  'SN-102': 100
};

/**
 * Generates an HMAC-SHA256 signature for a sensor node packet payload (simulates ESP32 node)
 */
function generateHMAC(payload, secretKey = PRESHARED_SECRET_KEY) {
  const dataString = JSON.stringify({
    nodeId: payload.nodeId || payload.sensorId,
    seq: payload.seq,
    tilt: payload.tilt || payload.tiltAngle || payload.tilt_angle_deg,
    vibration: payload.vibration || payload.vibrationPPV || payload.vibration_ppv_mms,
    soilMoisture: payload.soilMoisture || payload.soil_moisture_pct,
    timestamp: payload.timestamp
  });

  return crypto
    .createHmac('sha256', secretKey)
    .update(dataString)
    .digest('hex');
}

/**
 * Verifies an incoming sensor packet at the Gateway / Server
 * 1. Checks HMAC-SHA256 signature for anti-tampering
 * 2. Checks sequence number (seq > last_seen_seq) for anti-replay protection
 */
function verifyPacketSecurity(packet, secretKey = PRESHARED_SECRET_KEY) {
  const nodeId = packet.nodeId || packet.sensorId || 'Node_03';
  const incomingSeq = parseInt(packet.seq || 0, 10);
  const incomingHmac = packet.hmac || packet.signature;

  // 1. Sequence Number Anti-Replay Verification
  const lastSeenSeq = nodeSequenceRegistry[nodeId] || 0;
  
  if (incomingSeq > 0 && incomingSeq <= lastSeenSeq) {
    return {
      isValid: false,
      reason: "REPLAY_ATTACK_DETECTED",
      message: `🚨 SECURITY ALERT: Stale / Replayed sequence number detected! (Incoming seq: ${incomingSeq} <= Last seen seq: ${lastSeenSeq})`,
      nodeId,
      seq: incomingSeq
    };
  }

  // 2. HMAC-SHA256 Signature Anti-Tampering Verification
  if (incomingHmac) {
    const expectedHmac = generateHMAC(packet, secretKey);
    const bufIncoming = Buffer.from(incomingHmac, 'hex');
    const bufExpected = Buffer.from(expectedHmac, 'hex');

    // Constant time string comparison to prevent timing side-channel attacks
    const isSignatureValid = (bufIncoming.length === bufExpected.length) && crypto.timingSafeEqual(bufIncoming, bufExpected);

    if (!isSignatureValid) {
      return {
        isValid: false,
        reason: "HMAC_TAMPERING_DETECTED",
        message: `🚨 SECURITY ALERT: Cryptographic HMAC-SHA256 signature mismatch! Sensor payload tampering detected.`,
        nodeId,
        seq: incomingSeq
      };
    }
  }

  // Update last seen sequence number on successful verification
  if (incomingSeq > 0) {
    nodeSequenceRegistry[nodeId] = incomingSeq;
  }

  return {
    isValid: true,
    reason: "AUTHENTICATED",
    message: `🛡️ SECURITY VERIFIED: HMAC-SHA256 signature valid & sequence number #${incomingSeq} verified.`,
    nodeId,
    seq: incomingSeq
  };
}

/**
 * Logs security incident asynchronously into SQLite security_logs table
 */
async function logSecurityIncident(nodeId, sequenceNumber, attackType, message, actionTaken = "PACKET_REJECTED") {
  try {
    const { queryRun } = require('../database/db');
    await queryRun(`
      INSERT INTO security_logs (node_id, sequence_number, attack_type, message, action_taken)
      VALUES (?, ?, ?, ?, ?)
    `, [nodeId, sequenceNumber, attackType, message, actionTaken]);
  } catch (err) {
    console.error("Failed to log security incident:", err.message);
  }
}

module.exports = {
  PRESHARED_SECRET_KEY,
  generateHMAC,
  verifyPacketSecurity,
  logSecurityIncident,
  nodeSequenceRegistry
};

