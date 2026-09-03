const fs = require('fs');
const path = require('path');

const datasetsDir = path.join(__dirname, '..', 'datasets');
if (!fs.existsSync(datasetsDir)) {
  fs.mkdirSync(datasetsDir, { recursive: true });
}

console.log('Generating datasets in datasets/ folder...');

// 1. Generate Open-Cast Mine Telemetry Dataset (open_cast_mine_telemetry.csv)
const sites = ['singareni-s4', 'jharia-open-pit', 'korba-west-bench', 'raniganj-south-slope'];
const zones = ['zone-a', 'zone-b', 'zone-c', 'zone-d'];
const sensorTypes = ['SN-101', 'SN-102', 'EX-201', 'TL-301', 'PZ-401'];

const telemetryHeader = 'reading_id,timestamp,site_id,zone_id,sensor_id,ground_displacement_mm,displacement_rate_mm_hr,tilt_angle_deg,tilt_rate_deg_hr,crack_width_mm,crack_rate_mm_hr,vibration_ppv_mms,soil_moisture_pct,sensor_battery_pct,risk_class\n';
let telemetryRows = [];

// Seeded deterministic generator for reproducibility
let seed = 42;
function pseudoRandom() {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

const totalRows = 2500;
const startDate = new Date('2026-01-01T00:00:00Z');

for (let i = 1; i <= totalRows; i++) {
  const timeOffsetMs = i * 3600000; // hourly readings
  const dateStr = new Date(startDate.getTime() + timeOffsetMs).toISOString();
  const site = sites[Math.floor(pseudoRandom() * sites.length)];
  const zone = zones[Math.floor(pseudoRandom() * zones.length)];
  const sensor = sensorTypes[Math.floor(pseudoRandom() * sensorTypes.length)];

  // Determine scenario regime
  const r = pseudoRandom();
  let disp, dispRate, tilt, tiltRate, crack, crackRate, vib, moisture, riskClass;

  if (r < 0.60) {
    // Normal Regime (60%)
    disp = (pseudoRandom() * 4.5).toFixed(2);
    dispRate = (pseudoRandom() * 0.8).toFixed(2);
    tilt = (pseudoRandom() * 0.8).toFixed(2);
    tiltRate = (pseudoRandom() * 0.15).toFixed(2);
    crack = (pseudoRandom() * 1.5).toFixed(2);
    crackRate = (pseudoRandom() * 0.2).toFixed(2);
    vib = (pseudoRandom() * 1.2).toFixed(2);
    moisture = Math.floor(15 + pseudoRandom() * 25);
    riskClass = 'Normal';
  } else if (r < 0.85) {
    // Warning Regime (25%)
    disp = (5.0 + pseudoRandom() * 6.5).toFixed(2);
    dispRate = (0.8 + pseudoRandom() * 1.6).toFixed(2);
    tilt = (0.8 + pseudoRandom() * 1.8).toFixed(2);
    tiltRate = (0.15 + pseudoRandom() * 0.45).toFixed(2);
    crack = (1.5 + pseudoRandom() * 3.2).toFixed(2);
    crackRate = (0.2 + pseudoRandom() * 0.55).toFixed(2);
    vib = (1.2 + pseudoRandom() * 1.8).toFixed(2);
    moisture = Math.floor(35 + pseudoRandom() * 30);
    riskClass = 'Warning';
  } else {
    // Critical Regime (15%)
    disp = (12.0 + pseudoRandom() * 18.0).toFixed(2);
    dispRate = (2.4 + pseudoRandom() * 4.5).toFixed(2);
    tilt = (2.5 + pseudoRandom() * 3.5).toFixed(2);
    tiltRate = (0.5 + pseudoRandom() * 1.2).toFixed(2);
    crack = (4.8 + pseudoRandom() * 8.2).toFixed(2);
    crackRate = (0.75 + pseudoRandom() * 1.8).toFixed(2);
    vib = (2.5 + pseudoRandom() * 3.8).toFixed(2);
    moisture = Math.floor(55 + pseudoRandom() * 40);
    riskClass = 'Critical';
  }

  // Introduce occasional realistic missing value or noise for data cleaning demonstration (1% chance)
  if (pseudoRandom() < 0.01) vib = '';
  if (pseudoRandom() < 0.005) moisture = '';

  const battery = Math.floor(60 + pseudoRandom() * 40);

  telemetryRows.push(`${i},${dateStr},${site},${zone},${sensor},${disp},${dispRate},${tilt},${tiltRate},${crack},${crackRate},${vib},${moisture},${battery},${riskClass}`);
}

// Add a few duplicate rows to demonstrate data cleaning duplicate detection
telemetryRows.push(telemetryRows[10]);
telemetryRows.push(telemetryRows[50]);

fs.writeFileSync(path.join(datasetsDir, 'open_cast_mine_telemetry.csv'), telemetryHeader + telemetryRows.join('\n'));
console.log(`✅ Created open_cast_mine_telemetry.csv (${telemetryRows.length} rows)`);

// 2. Generate DInSAR Satellite Displacement Dataset (dinsar_satellite_displacement.csv)
const satelliteHeader = 'sar_pass_id,satellite_id,acquisition_date,grid_cell_id,lat,lng,los_displacement_mm,coherence_index,velocity_mm_day\n';
let satelliteRows = [];

for (let i = 1; i <= 500; i++) {
  const passId = `SAR-2026-${String(i).padStart(4, '0')}`;
  const satId = pseudoRandom() > 0.5 ? 'Sentinel-1A' : 'Sentinel-1B';
  const acqDate = new Date(startDate.getTime() + i * 86400000 * 6).toISOString().split('T')[0];
  const gridCell = `GRID-CELL-${100 + (i % 20)}`;
  const lat = (17.545 + pseudoRandom() * 0.01).toFixed(4);
  const lng = (80.610 + pseudoRandom() * 0.01).toFixed(4);
  const losDisp = (-2.0 - pseudoRandom() * 25.0).toFixed(2);
  const coherence = (0.45 + pseudoRandom() * 0.50).toFixed(3);
  const velocity = (losDisp / 6.0).toFixed(2);

  satelliteRows.push(`${passId},${satId},${acqDate},${gridCell},${lat},${lng},${losDisp},${coherence},${velocity}`);
}

fs.writeFileSync(path.join(datasetsDir, 'dinsar_satellite_displacement.csv'), satelliteHeader + satelliteRows.join('\n'));
console.log(`✅ Created dinsar_satellite_displacement.csv (${satelliteRows.length} rows)`);

// 3. Generate Subsurface Borehole Tiltmeter Dataset (borehole_tiltmeter_logs.csv)
const boreholeHeader = 'log_id,tiltmeter_id,depth_m,x_axis_tilt_deg,y_axis_tilt_deg,temperature_c,battery_v\n';
let boreholeRows = [];

for (let i = 1; i <= 600; i++) {
  const tiltId = `TLM-DEEP-${10 + (i % 8)}`;
  const depth = (50 + (i % 5) * 40).toFixed(1); // 50m, 90m, 130m, 170m, 210m
  const xTilt = (pseudoRandom() * 3.5).toFixed(3);
  const yTilt = (pseudoRandom() * 2.8).toFixed(3);
  const temp = (28.5 + pseudoRandom() * 8.0).toFixed(1);
  const batteryV = (3.4 + pseudoRandom() * 0.8).toFixed(2);

  boreholeRows.push(`${i},${tiltId},${depth},${xTilt},${yTilt},${temp},${batteryV}`);
}

fs.writeFileSync(path.join(datasetsDir, 'borehole_tiltmeter_logs.csv'), boreholeHeader + boreholeRows.join('\n'));
console.log(`✅ Created borehole_tiltmeter_logs.csv (${boreholeRows.length} rows)`);

console.log('\nDataset generation complete!');
