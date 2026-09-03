const fs = require('fs');
const path = require('path');

const datasetsDir = path.join(__dirname, '..', 'datasets');
const outputPath = path.join(datasetsDir, 'leakage_safe_mine_telemetry.csv');

console.log('⚡ Generating Leakage-Safe ML Dataset...\n');

// Seeded deterministic random generator for reproducibility
let seed = 12345;
function pseudoRandom() {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

function gaussianRandom(mean = 0, stdev = 1) {
  const u1 = Math.max(1e-6, pseudoRandom());
  const u2 = pseudoRandom();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return mean + z0 * stdev;
}

const totalRows = 2500;
const startDate = new Date('2026-01-01T00:00:00Z');
const sites = ['singareni-s4', 'jharia-open-pit', 'korba-west-bench', 'raniganj-south-slope'];
const zones = ['zone-a', 'zone-b', 'zone-c', 'zone-d'];
const sensorTypes = ['SN-101', 'EX-201', 'TL-301', 'PZ-401'];

const header = [
  'reading_id',
  'timestamp',
  'site_id',
  'zone_id',
  'sensor_id',
  'tilt_angle_deg',
  'tilt_rate_deg_hr',
  'crack_width_mm',
  'crack_rate_mm_hr',
  'vibration_ppv_mms',
  'soil_moisture_pct',
  'signal_dbm',
  'sensor_battery_pct',
  'angular_crack_velocity_product',
  'crack_expansion_ratio',
  'moisture_weighted_tilt',
  'hazard_index_H',
  'risk_class'
];

const rows = [header.join(',')];

let normalCount = 0;
let warningCount = 0;
let criticalCount = 0;

for (let i = 1; i <= totalRows; i++) {
  const timeOffsetMs = i * 3600000; // Hourly synchronized timestamps
  const dateStr = new Date(startDate.getTime() + timeOffsetMs).toISOString();
  const site = sites[Math.floor(pseudoRandom() * sites.length)];
  const zone = zones[Math.floor(pseudoRandom() * zones.length)];
  const sensor = sensorTypes[Math.floor(pseudoRandom() * sensorTypes.length)];

  // Generate continuous overlapping physical sensor measurements (No hard interval bounds)
  const baseRegime = pseudoRandom();
  let meanTilt, meanTiltRate, meanCrack, meanCrackRate, meanVib, meanMoisture;

  if (baseRegime < 0.60) {
    meanTilt = 0.4; meanTiltRate = 0.08; meanCrack = 0.8; meanCrackRate = 0.10; meanVib = 0.6; meanMoisture = 25;
  } else if (baseRegime < 0.85) {
    meanTilt = 1.6; meanTiltRate = 0.35; meanCrack = 3.2; meanCrackRate = 0.45; meanVib = 1.8; meanMoisture = 48;
  } else {
    meanTilt = 3.5; meanTiltRate = 0.85; meanCrack = 7.5; meanCrackRate = 1.20; meanVib = 3.4; meanMoisture = 72;
  }

  // Add realistic Gaussian continuous noise to avoid artificial sharp boundaries
  const tilt = Math.max(0, parseFloat(gaussianRandom(meanTilt, 0.4).toFixed(2)));
  const tiltRate = Math.max(0, parseFloat(gaussianRandom(meanTiltRate, 0.12).toFixed(2)));
  const crack = Math.max(0, parseFloat(gaussianRandom(meanCrack, 0.8).toFixed(2)));
  const crackRate = Math.max(0, parseFloat(gaussianRandom(meanCrackRate, 0.15).toFixed(2)));
  const vib = Math.max(0, parseFloat(gaussianRandom(meanVib, 0.5).toFixed(2)));
  const moisture = Math.min(100, Math.max(10, Math.round(gaussianRandom(meanMoisture, 8))));
  const signal = Math.round(-85 + pseudoRandom() * 25); // LoRa RSSI dBm (-85 to -60)
  const battery = Math.round(60 + pseudoRandom() * 40);

  // Leakage-Safe Input Engineered Features (Excludes ground_displacement_mm)
  const strainVelocityIndex = parseFloat((tiltRate * (crackRate + 0.1)).toFixed(3));
  const crackExpansionRatio = parseFloat((crackRate / (crack + 0.1)).toFixed(3));
  const moistureWeightedTilt = parseFloat(((moisture / 100) * tilt).toFixed(3));

  // Multi-Parameter Compound Geotechnical Hazard Index H
  const normTilt = Math.min(1.0, tilt / 5.0);
  const normTiltRate = Math.min(1.0, tiltRate / 1.2);
  const normCrack = Math.min(1.0, crack / 15.0);
  const normCrackRate = Math.min(1.0, crackRate / 2.0);
  const normVib = Math.min(1.0, vib / 5.0);
  const normMoisture = Math.min(1.0, moisture / 100.0);
  const epsilon = gaussianRandom(0, 0.04);

  const H = parseFloat((
    (0.25 * normTilt) +
    (0.20 * normTiltRate) +
    (0.20 * normCrack) +
    (0.15 * normCrackRate) +
    (0.10 * normVib) +
    (0.10 * normMoisture) +
    epsilon
  ).toFixed(3));

  // Multi-Parameter Risk Classification (Documented Proxy Methodology)
  let riskClass = 'Normal';
  if (H >= 0.55) {
    riskClass = 'Critical';
    criticalCount++;
  } else if (H >= 0.30) {
    riskClass = 'Warning';
    warningCount++;
  } else {
    riskClass = 'Normal';
    normalCount++;
  }

  rows.push([
    i,
    dateStr,
    site,
    zone,
    sensor,
    tilt,
    tiltRate,
    crack,
    crackRate,
    vib,
    moisture,
    signal,
    battery,
    strainVelocityIndex,
    crackExpansionRatio,
    moistureWeightedTilt,
    H,
    riskClass
  ].join(','));
}

fs.writeFileSync(outputPath, rows.join('\n'));

console.log(`✅ Created Leakage-Safe Dataset: ${outputPath}`);
console.log(`- Total Records: ${totalRows} rows`);
console.log(`- Normal Samples: ${normalCount} (${((normalCount/totalRows)*100).toFixed(1)}%)`);
console.log(`- Warning Samples: ${warningCount} (${((warningCount/totalRows)*100).toFixed(1)}%)`);
console.log(`- Critical Samples: ${criticalCount} (${((criticalCount/totalRows)*100).toFixed(1)}%)`);
