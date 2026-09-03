const fs = require('fs');
const path = require('path');
const { predictMineRisk } = require('../services/mlClassifier');

// Sample New Telemetry Payload from IoT Field Node
const newTelemetrySample = {
  groundDisplacement: 14.8,      // mm
  displacementRate: "+2.6 mm/hr", // mm/hr
  tiltAngle: 2.8,                // deg
  tiltRate: "+0.4°/hr",          // deg/hr
  crackWidth: 5.8,               // mm
  crackRate: "+0.7 mm",          // mm/hr
  vibrationPPV: 2.4,             // mm/s
  soilMoisture: 42               // %
};

console.log('==================================================');
console.log('🔮 ML PREDICTION ON NEW IoT SENSOR TELEMETRY');
console.log('==================================================');
console.log('Input Sensor Payload:');
console.log(JSON.stringify(newTelemetrySample, null, 2));

const result = predictMineRisk(newTelemetrySample);

console.log('\n🎯 ML Model Prediction Output:');
console.log(`- Predicted Risk Class: ${result.riskClass.toUpperCase()}`);
console.log(`- Overall Risk Score:   ${result.riskScore} / 100`);
console.log(`- ML Confidence:       ${result.confidence}%`);
console.log(`\nProbability Distribution:`);
console.log(`  🟢 Normal:   ${(result.probabilities.Normal * 100).toFixed(1)}%`);
console.log(`  🟡 Warning:  ${(result.probabilities.Warning * 100).toFixed(1)}%`);
console.log(`  🔴 Critical: ${(result.probabilities.Critical * 100).toFixed(1)}%`);

console.log('\n🔍 Explainable AI (XAI) Feature Importance Breakdown:');
result.featureImportance.forEach(f => {
  console.log(`  - ${f.feature.padEnd(25)}: ${f.percentage}% contribution`);
});

console.log(`\n🚨 Anomaly Status: ${result.anomalies.message}`);
