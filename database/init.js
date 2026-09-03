const { queryRun, queryGet, queryAll } = require('./db');

let initPromise = null;

async function initializeDatabase() {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    console.log('🔄 Initializing SQLite database schema...');

  // 1. Sites Table
  await queryRun(`
    CREATE TABLE IF NOT EXISTS sites (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      location TEXT NOT NULL,
      seam TEXT,
      center_lat REAL NOT NULL,
      center_lng REAL NOT NULL,
      zoom_level INTEGER DEFAULT 16,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. Risk Zones Table
  await queryRun(`
    CREATE TABLE IF NOT EXISTS risk_zones (
      id TEXT PRIMARY KEY,
      site_id TEXT NOT NULL,
      name TEXT NOT NULL,
      risk_score INTEGER NOT NULL,
      status TEXT NOT NULL, -- critical, warning, watch, safe
      description TEXT,
      displacement TEXT,
      crack_growth TEXT,
      tilt_angle TEXT,
      recommended_action TEXT,
      polygon_json TEXT NOT NULL,
      FOREIGN KEY (site_id) REFERENCES sites(id)
    );
  `);

  // 3. Sensors Table
  await queryRun(`
    CREATE TABLE IF NOT EXISTS sensors (
      id TEXT PRIMARY KEY,
      site_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      zone_id TEXT NOT NULL,
      status TEXT NOT NULL, -- online, warning, offline
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      displacement_mm REAL DEFAULT 0.0,
      battery_pct INTEGER DEFAULT 100,
      signal_dbm INTEGER DEFAULT -70,
      last_ping TEXT,
      FOREIGN KEY (site_id) REFERENCES sites(id)
    );
  `);

  // 4. Sensor Readings History Table
  await queryRun(`
    CREATE TABLE IF NOT EXISTS sensor_readings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      site_id TEXT NOT NULL,
      zone_id TEXT NOT NULL,
      sensor_id TEXT,
      ground_displacement_mm REAL NOT NULL,
      displacement_rate TEXT,
      tilt_angle_deg REAL,
      tilt_rate TEXT,
      crack_width_mm REAL,
      crack_rate TEXT,
      vibration_ppv_mms REAL,
      vibration_status TEXT,
      soil_moisture_pct INTEGER,
      moisture_status TEXT,
      sensor_battery_pct INTEGER,
      signal_dbm INTEGER,
      calculated_risk_level TEXT NOT NULL, -- SAFE, WARNING, CRITICAL
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (site_id) REFERENCES sites(id)
    );
  `);

  // 5. Active Alerts Table
  await queryRun(`
    CREATE TABLE IF NOT EXISTS alerts (
      id TEXT PRIMARY KEY,
      site_id TEXT NOT NULL,
      zone_id TEXT,
      sensor_id TEXT,
      code TEXT NOT NULL,
      title TEXT NOT NULL,
      location TEXT NOT NULL,
      time_ago TEXT,
      severity TEXT NOT NULL, -- critical, warning, watch
      acknowledged INTEGER DEFAULT 0,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (site_id) REFERENCES sites(id)
    );
  `);

  // 5b. Cybersecurity Incident Logs Table
  await queryRun(`
    CREATE TABLE IF NOT EXISTS security_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      node_id TEXT NOT NULL,
      sequence_number INTEGER,
      attack_type TEXT NOT NULL, -- HMAC_TAMPERING, REPLAY_ATTACK, FAULTY_NODE
      message TEXT NOT NULL,
      action_taken TEXT NOT NULL
    );
  `);

  // 6. Underground Tunnels Table
  await queryRun(`
    CREATE TABLE IF NOT EXISTS tunnels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      site_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL, -- trunk, gallery, crosscut
      path_json TEXT NOT NULL,
      FOREIGN KEY (site_id) REFERENCES sites(id)
    );
  `);

  // 7. Surface Infrastructure Table
  await queryRun(`
    CREATE TABLE IF NOT EXISTS surface_infrastructure (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      site_id TEXT NOT NULL,
      category TEXT NOT NULL, -- village, road, river
      name TEXT NOT NULL,
      geometry_json TEXT NOT NULL,
      FOREIGN KEY (site_id) REFERENCES sites(id)
    );
  `);

  // Seed Data if Sites Table is Empty
  const existingSites = await queryAll(`SELECT * FROM sites;`);
  if (existingSites.length === 0) {
    console.log('🌱 Seeding initial database data...');

    // Seed Sites
    const sites = [
      { id: "singareni-s4", name: "Singareni Colliery - Shaft 4", location: "Kothagudem, Telangana, India", seam: "King Seam #3 (Depth: 240m)", center_lat: 17.5485, center_lng: 80.6120, zoom_level: 16 },
      { id: "jharia-b7", name: "Jharia Coalfield - Sector 7", location: "Dhanbad, Jharkhand, India", seam: "Seam IX/X (Depth: 310m)", center_lat: 23.7500, center_lng: 86.4167, zoom_level: 15 },
      { id: "korba-secb", name: "Korba Underground - Sector B", location: "Korba, Chhattisgarh, India", seam: "Gevra Deep Seam (Depth: 190m)", center_lat: 22.3500, center_lng: 82.6833, zoom_level: 15 },
      { id: "raniganj-m3", name: "Raniganj Coalfield - Mine #3", location: "Asansol, West Bengal, India", seam: "Raniganj Seam (Late Permian, Depth: 420m)", center_lat: 23.6614, center_lng: 87.1616, zoom_level: 14 }
    ];

    for (const site of sites) {
      await queryRun(
        `INSERT INTO sites (id, name, location, seam, center_lat, center_lng, zoom_level) VALUES (?, ?, ?, ?, ?, ?, ?);`,
        [site.id, site.name, site.location, site.seam, site.center_lat, site.center_lng, site.zoom_level]
      );
    }

    // Seed Risk Zones for Singareni S4
    const zones = [
      {
        id: "zone-a",
        site_id: "singareni-s4",
        name: "Zone A — CRITICAL",
        risk_score: 87,
        status: "critical",
        description: "Surface area directly above Active Panel 4 East gallery. High displacement over Kalyanpur Village Road.",
        displacement: "18.2 mm",
        crack_growth: "+6.4 mm",
        tilt_angle: "3.2°",
        recommended_action: "Immediate surface inspection & close Kalyanpur Village Road segment to heavy transport.",
        polygon_json: JSON.stringify([
          [17.5510, 80.6095],
          [17.5518, 80.6135],
          [17.5495, 80.6142],
          [17.5485, 80.6102]
        ])
      },
      {
        id: "zone-b",
        site_id: "singareni-s4",
        name: "Zone B — WARNING",
        risk_score: 68,
        status: "warning",
        description: "Agricultural sector adjacent to main shaft haulage pillar. Moderate micro-seismic activity.",
        displacement: "12.4 mm",
        crack_growth: "+3.1 mm",
        tilt_angle: "1.8°",
        recommended_action: "Increase sensor telemetry poll rate to 1 min. Inspect agricultural drainage channels.",
        polygon_json: JSON.stringify([
          [17.5495, 80.6142],
          [17.5518, 80.6135],
          [17.5505, 80.6170],
          [17.5475, 80.6160]
        ])
      },
      {
        id: "zone-c",
        site_id: "singareni-s4",
        name: "Zone C — WATCH",
        risk_score: 42,
        status: "watch",
        description: "Eastern boundary above legacy goaf extraction chamber (1998). Slight tilt creep detected.",
        displacement: "6.1 mm",
        crack_growth: "+0.9 mm",
        tilt_angle: "0.9°",
        recommended_action: "Continue automated optical prism tracking and visual ground patrol.",
        polygon_json: JSON.stringify([
          [17.5475, 80.6160],
          [17.5505, 80.6170],
          [17.5485, 80.6200],
          [17.5450, 80.6185]
        ])
      },
      {
        id: "zone-d",
        site_id: "singareni-s4",
        name: "Zone D — SAFE",
        risk_score: 14,
        status: "safe",
        description: "Western solid coal pillar barrier zone. Baseline ground stability normal.",
        displacement: "1.8 mm",
        crack_growth: "0.0 mm",
        tilt_angle: "0.1°",
        recommended_action: "Routine monthly calibration checks.",
        polygon_json: JSON.stringify([
          [17.5460, 80.6060],
          [17.5510, 80.6095],
          [17.5485, 80.6102],
          [17.5445, 80.6075]
        ])
      }
    ];

    for (const zone of zones) {
      await queryRun(
        `INSERT INTO risk_zones (id, site_id, name, risk_score, status, description, displacement, crack_growth, tilt_angle, recommended_action, polygon_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [zone.id, zone.site_id, zone.name, zone.risk_score, zone.status, zone.description, zone.displacement, zone.crack_growth, zone.tilt_angle, zone.recommended_action, zone.polygon_json]
      );
    }

    // Seed Active Alerts
    const alerts = [
      {
        id: "ALT-901",
        site_id: "singareni-s4",
        zone_id: "zone-a",
        sensor_id: "EX-12",
        code: "ALT-901",
        title: "Displacement Rate Breached Threshold (>2.0mm/h)",
        location: "Zone A — Sector 4 East (Kalyanpur Road)",
        time_ago: "12 mins ago",
        severity: "critical"
      },
      {
        id: "ALT-884",
        site_id: "singareni-s4",
        zone_id: "zone-b",
        sensor_id: "TM-04",
        code: "ALT-884",
        title: "Tiltmeter Drift Exceeded 1.5° Baseline",
        location: "Zone B — Sector 2 Haulage Pillar",
        time_ago: "45 mins ago",
        severity: "warning"
      },
      {
        id: "ALT-762",
        site_id: "singareni-s4",
        zone_id: "zone-c",
        sensor_id: "OP-09",
        code: "ALT-762",
        title: "Piezometer Water Table Pressure Infiltration",
        location: "Zone C — Goaf Boundary East",
        time_ago: "2 hours ago",
        severity: "watch"
      }
    ];

    for (const alert of alerts) {
      await queryRun(
        `INSERT INTO alerts (id, site_id, zone_id, sensor_id, code, title, location, time_ago, severity) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [alert.id, alert.site_id, alert.zone_id, alert.sensor_id, alert.code, alert.title, alert.location, alert.time_ago, alert.severity]
      );
    }

    // Seed Telemetry Reading
    await queryRun(`
      INSERT INTO sensor_readings (site_id, zone_id, ground_displacement_mm, displacement_rate, tilt_angle_deg, tilt_rate, crack_width_mm, crack_rate, vibration_ppv_mms, vibration_status, soil_moisture_pct, moisture_status, sensor_battery_pct, signal_dbm, calculated_risk_level)
      VALUES ('singareni-s4', 'zone-a', 18.2, '+2.4 mm/hr', 3.2, '+0.4°/hr', 6.4, '+0.8 mm', 2.8, 'Elevated', 34, 'Post-Rain Infiltration', 82, -68, 'CRITICAL');
    `);

    // Seed Tunnels
    const tunnels = [
      { name: "Main Incline Trunk Drift", path: [[17.5440, 80.6070], [17.5485, 80.6120], [17.5520, 80.6170]], type: "trunk" },
      { name: "Panel 4 East - Gallery 1", path: [[17.5485, 80.6100], [17.5512, 80.6108]], type: "gallery" },
      { name: "Panel 4 East - Gallery 2", path: [[17.5488, 80.6115], [17.5514, 80.6122]], type: "gallery" },
      { name: "Panel 4 East - Gallery 3", path: [[17.5491, 80.6130], [17.5516, 80.6136]], type: "gallery" },
      { name: "Panel 4 Crosscut A", path: [[17.5510, 80.6098], [17.5516, 80.6138]], type: "crosscut" },
      { name: "Panel 4 Crosscut B", path: [[17.5498, 80.6095], [17.5502, 80.6135]], type: "crosscut" }
    ];

    for (const tun of tunnels) {
      await queryRun(
        `INSERT INTO tunnels (site_id, name, type, path_json) VALUES ('singareni-s4', ?, ?, ?);`,
        [tun.name, tun.type, JSON.stringify(tun.path)]
      );
    }

    // Seed Surface Infrastructure
    const surfaceItems = [
      { category: "village", name: "Kalyanpur Settlement (85 Houses)", geometry_json: JSON.stringify({ center: [17.5508, 80.6115], polygon: [[17.5514, 80.6105], [17.5522, 80.6128], [17.5504, 80.6132], [17.5498, 80.6110]] }) },
      { category: "road", name: "Kalyanpur Village Access Road (H-14)", geometry_json: JSON.stringify({ path: [[17.5440, 80.6050], [17.5470, 80.6085], [17.5505, 80.6118], [17.5535, 80.6150]] }) },
      { category: "river", name: "Godavari Feeder Stream", geometry_json: JSON.stringify({ path: [[17.5440, 80.6190], [17.5475, 80.6180], [17.5520, 80.6185]] }) }
    ];

    for (const surf of surfaceItems) {
      await queryRun(
        `INSERT INTO surface_infrastructure (site_id, category, name, geometry_json) VALUES ('singareni-s4', ?, ?, ?);`,
        [surf.category, surf.name, surf.geometry_json]
      );
    }

    // Seed Sensors Nodes (50 nodes)
    const sensorTypes = ["Extensometer", "Tiltmeter", "Optical Prism", "GNSS Node", "Piezometer"];
    for (let i = 1; i <= 50; i++) {
      const type = sensorTypes[i % sensorTypes.length];
      const zoneId = i <= 15 ? "zone-a" : i <= 30 ? "zone-b" : i <= 42 ? "zone-c" : "zone-d";
      const status = i === 12 ? "warning" : i === 28 ? "warning" : i === 49 ? "offline" : "online";
      const lat = 17.5480 + (Math.random() * 0.005 - 0.0025);
      const lng = 80.6110 + (Math.random() * 0.006 - 0.003);
      const disp = (Math.random() * (zoneId === "zone-a" ? 18 : zoneId === "zone-b" ? 12 : 5)).toFixed(1);
      const battery = Math.floor(70 + Math.random() * 30);
      const signal = -60 - Math.floor(Math.random() * 25);

      await queryRun(
        `INSERT INTO sensors (id, site_id, name, type, zone_id, status, lat, lng, displacement_mm, battery_pct, signal_dbm, last_ping)
         VALUES (?, 'singareni-s4', ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP);`,
        [`SN-${100 + i}`, `Sensor Node #${100 + i}`, type, zoneId, status, lat, lng, disp, battery, signal]
      );
    }

    console.log('✅ SQLite Database initial seeding complete.');
  }
  })();

  return initPromise;
}

module.exports = { initializeDatabase };
