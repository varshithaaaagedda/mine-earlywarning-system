/**
 * Mine Subsidence Early Warning System - Real-Time Data Module
 * Site: Singareni Colliery - Shaft 4 (Kothagudem Seam #3)
 */

window.MineData = {
  currentSite: {
    id: "singareni-s4",
    name: "Singareni Colliery - Shaft 4",
    location: "Kothagudem, Telangana, India",
    seam: "King Seam #3 (Depth: 240m)",
    centerCoords: [17.5485, 80.6120],
    zoomLevel: 16
  },

  sitesList: [
    { id: "singareni-s4", name: "Singareni Colliery - Shaft 4", location: "Kothagudem, Telangana" },
    { id: "jharia-b7", name: "Jharia Coalfield - Sector 7", location: "Dhanbad, Jharkhand" },
    { id: "korba-secb", name: "Korba Underground - Sector B", location: "Korba, Chhattisgarh" },
    { id: "raniganj-m3", name: "Raniganj Coalfield - Mine #3", location: "Asansol, West Bengal" }
  ],

  // Raniganj Coalfield Field Survey & PS-InSAR Telemetry Dataset
  raniganjFieldData: {
    gnssStations: [
      { name: "RBUA", lat: 23.6614639671, lng: 87.1616919475, height: 43.34, displacement_mm: 12.0, rate_mm_yr: 5.71, risk: "Watch" },
      { name: "RBUB", lat: 23.6612783551, lng: 87.1614920419, height: 43.75, displacement_mm: 124.6, rate_mm_yr: 117.43, risk: "Critical" },
      { name: "RSMB", lat: 23.6668421453, lng: 87.1767764296, height: 52.91, displacement_mm: 12.4, rate_mm_yr: 5.90, risk: "Watch" },
      { name: "RSSC", lat: 23.6379755936, lng: 87.2553597757, height: 35.72, displacement_mm: 73.8, rate_mm_yr: 68.97, risk: "Critical" }
    ],
    insarVelocity: [
      { point: "P", psInSAR_asc: -7.78, psInSAR_desc: -10.14, sbas_desc: -7.78, pearson_asc_desc: 0.745, pearson_desc_sbas: 0.468 },
      { point: "Q", psInSAR_asc: -8.17, psInSAR_desc: -10.57, sbas_desc: -13.34, pearson_asc_desc: 0.622, pearson_desc_sbas: 0.493 },
      { point: "R", psInSAR_asc: -9.45, psInSAR_desc: -9.77, sbas_desc: -9.74, pearson_asc_desc: 0.874, pearson_desc_sbas: 0.716 },
      { point: "S", psInSAR_asc: -10.25, psInSAR_desc: -15.01, sbas_desc: -18.39, pearson_asc_desc: 0.860, pearson_desc_sbas: 0.857 }
    ],
    geology: [
      { age: "Tertiary", formation: "Tertiary sediment", lithology: "Sediments" },
      { age: "Late Triassic", formation: "Supra panchet", lithology: "Pebbly sandstone" },
      { age: "Early Triassic", formation: "Panchet", lithology: "Sandstone, shale and siltstone" },
      { age: "Late Permian", formation: "Raniganj", lithology: "Sandstone, shale and coal seam" },
      { age: "Middle Permian", formation: "Barren measure Barakar", lithology: "Sandstone, shale and coal seam" },
      { age: "Early Permian", formation: "Talchir", lithology: "Tillites to boulder conglomerate" },
      { age: "Archean", formation: "Crystalline basement", lithology: "Granite, granitic gneiss, hornblende schist" }
    ]
  },

  // System KPI Summaries
  kpis: {
    overallRiskScore: 68,
    maxRiskScore: 100,
    activeAlerts: 3,
    criticalAlertsCount: 1,
    warningAlertsCount: 1,
    watchAlertsCount: 1,
    sensorsOnline: 47,
    sensorsTotal: 50,
    highRiskZonesCount: 2
  },

  // Telemetry Readings for Selected / Focus Zone (Zone A)
  telemetry: {
    groundDisplacement: 18.2, // mm
    displacementRate: "+2.4 mm/hr",
    tiltAngle: 3.2, // degrees
    tiltRate: "+0.4°/hr",
    crackWidth: 6.4, // mm
    crackRate: "+0.8 mm",
    vibrationPPV: 2.8, // mm/s
    vibrationStatus: "Elevated",
    soilMoisture: 34, // %
    moistureStatus: "Post-Rain Infiltration",
    sensorBattery: 82, // %
    signalStrength: -68 // dBm LoRaWAN
  },

  // Risk Zones GeoJSON / Coordinates (Relative to center: 17.5485, 80.6120)
  zones: [
    {
      id: "zone-a",
      name: "Zone A — CRITICAL",
      riskScore: 87,
      status: "critical", // critical, warning, watch, safe
      description: "Surface area directly above Active Panel 4 East gallery. High displacement over Kalyanpur Village Road.",
      displacement: "18.2 mm",
      crackGrowth: "+6.4 mm",
      tiltAngle: "3.2°",
      recommendedAction: "Immediate surface inspection & close Kalyanpur Village Road segment to heavy transport.",
      polygon: [
        [17.5510, 80.6095],
        [17.5518, 80.6135],
        [17.5495, 80.6142],
        [17.5485, 80.6102]
      ]
    },
    {
      id: "zone-b",
      name: "Zone B — WARNING",
      riskScore: 68,
      status: "warning",
      description: "Agricultural sector adjacent to main shaft haulage pillar. Moderate micro-seismic activity.",
      displacement: "12.4 mm",
      crackGrowth: "+3.1 mm",
      tiltAngle: "1.8°",
      recommendedAction: "Increase sensor telemetry poll rate to 1 min. Inspect agricultural drainage channels.",
      polygon: [
        [17.5495, 80.6142],
        [17.5518, 80.6135],
        [17.5505, 80.6170],
        [17.5475, 80.6160]
      ]
    },
    {
      id: "zone-c",
      name: "Zone C — WATCH",
      riskScore: 42,
      status: "watch",
      description: "Eastern boundary above legacy goaf extraction chamber (1998). Slight tilt creep detected.",
      displacement: "6.1 mm",
      crackGrowth: "+0.9 mm",
      tiltAngle: "0.9°",
      recommendedAction: "Continue automated optical prism tracking and visual ground patrol.",
      polygon: [
        [17.5475, 80.6160],
        [17.5505, 80.6170],
        [17.5485, 80.6200],
        [17.5450, 80.6185]
      ]
    },
    {
      id: "zone-d",
      name: "Zone D — SAFE",
      riskScore: 14,
      status: "safe",
      description: "Western solid coal pillar barrier zone. Baseline ground stability normal.",
      displacement: "1.8 mm",
      crackGrowth: "0.0 mm",
      tiltAngle: "0.1°",
      recommendedAction: "Routine monthly calibration checks.",
      polygon: [
        [17.5460, 80.6060],
        [17.5510, 80.6095],
        [17.5485, 80.6102],
        [17.5445, 80.6075]
      ]
    }
  ],

  // Underground Mine Tunnel Gallery Overlay Polygons / Lines
  tunnels: [
    // Main Incline Haulage Drift
    {
      name: "Main Incline Trunk Drift",
      path: [[17.5440, 80.6070], [17.5485, 80.6120], [17.5520, 80.6170]],
      type: "trunk"
    },
    // Panel 4 East Extraction Galleries (Below Zone A)
    {
      name: "Panel 4 East - Gallery 1",
      path: [[17.5485, 80.6100], [17.5512, 80.6108]],
      type: "gallery"
    },
    {
      name: "Panel 4 East - Gallery 2",
      path: [[17.5488, 80.6115], [17.5514, 80.6122]],
      type: "gallery"
    },
    {
      name: "Panel 4 East - Gallery 3",
      path: [[17.5491, 80.6130], [17.5516, 80.6136]],
      type: "gallery"
    },
    // Crosscuts
    {
      name: "Panel 4 Crosscut A",
      path: [[17.5510, 80.6098], [17.5516, 80.6138]],
      type: "crosscut"
    },
    {
      name: "Panel 4 Crosscut B",
      path: [[17.5498, 80.6095], [17.5502, 80.6135]],
      type: "crosscut"
    }
  ],

  // Surface Infrastructure Overlay (Villages, Roads, Water)
  surfaceInfrastructure: {
    village: {
      name: "Kalyanpur Settlement (85 Houses)",
      center: [17.5508, 80.6115],
      polygon: [
        [17.5514, 80.6105],
        [17.5522, 80.6128],
        [17.5504, 80.6132],
        [17.5498, 80.6110]
      ]
    },
    road: {
      name: "Kalyanpur Village Access Road (H-14)",
      path: [
        [17.5440, 80.6050],
        [17.5470, 80.6085],
        [17.5505, 80.6118],
        [17.5535, 80.6150]
      ]
    },
    river: {
      name: "Godavari Feeder Stream",
      path: [
        [17.5440, 80.6190],
        [17.5475, 80.6180],
        [17.5520, 80.6185]
      ]
    }
  },

  // 24-Hour Time-Series Subsidence Graph Data
  displacementHistory24h: {
    labels: [
      "00:00", "02:00", "04:00", "06:00", "08:00", "10:00", 
      "12:00", "14:00", "16:00", "18:00", "20:00", "22:00", "Now"
    ],
    displacement: [
      2.1, 2.3, 2.4, 2.8, 3.5, 4.8, 
      6.2, 8.5, 11.2, 13.8, 15.6, 17.1, 18.2
    ],
    thresholds: {
      normal: 5.0,
      warning: 12.0,
      critical: 15.0
    }
  },

  // Active Alert Stream
  alerts: [
    {
      id: "ALT-901",
      severity: "critical",
      zoneId: "zone-a",
      zoneName: "Zone A (Kalyanpur Road)",
      title: "Zone A — Rapid ground deformation detected",
      riskScore: 87,
      time: "2 minutes ago",
      timestamp: "14:22:00",
      explanation: "Displacement rate exceeded +2.0 mm/hr threshold over Active Panel 4 East gallery. Surface cracking reported along village access road."
    },
    {
      id: "ALT-902",
      severity: "warning",
      zoneId: "zone-b",
      zoneName: "Zone B (Agricultural Sector)",
      title: "Zone B — Increasing crack width",
      riskScore: 68,
      time: "18 minutes ago",
      timestamp: "14:06:00",
      explanation: "Extensometer #EX-14 registered +3.1 mm strain acceleration following recent rainfall infiltration."
    },
    {
      id: "ALT-903",
      severity: "watch",
      zoneId: "zone-c",
      zoneName: "Zone C (East Boundary)",
      title: "Zone C — Abnormal tilt detected",
      riskScore: 42,
      time: "35 minutes ago",
      timestamp: "13:49:00",
      explanation: "Borehole inclinometer #INC-09 recorded 0.9° tilt deviation towards old goaf extraction zone."
    }
  ],

  // Decision Support Recommended Actions
  recommendedActions: [
    { id: "act-1", text: "Dispatch geotechnical field team to inspect Zone A surface cracks", checked: true, priority: "critical" },
    { id: "act-2", text: "Restrict heavy vehicle transit on Kalyanpur Village Road (H-14)", checked: false, priority: "critical" },
    { id: "act-3", text: "Increase wireless sensor polling frequency from 15m to 1m interval", checked: false, priority: "warning" },
    { id: "act-4", text: "Notify Chief Shaft Safety Manager & Emergency Response Lead", checked: false, priority: "warning" },
    { id: "act-5", text: "Issue precautionary advisory to Kalyanpur Village Panchayat", checked: false, priority: "watch" }
  ],

  // Multi-channel Notification Matrix
  notifications: [
    { role: "Mine Operator", channel: "SMS Broadcast", status: "Sent ✓", time: "2m ago", color: "#10b981" },
    { role: "Safety Officer", channel: "App Push Alert", status: "Acknowledged ✓", time: "1m ago", color: "#10b981" },
    { role: "Field Response Team", channel: "Radio & Mobile", status: "Dispatched ✓", time: "2m ago", color: "#10b981" },
    { role: "Local Authority / DM", channel: "Automated Email", status: "Delivered ✓", time: "2m ago", color: "#10b981" }
  ],

  // Generated Sensor Network Fleet (50 Sensors)
  generateSensorFleet: function() {
    const sensors = [];
    const baseLat = 17.5485;
    const baseLng = 80.6120;

    // Specific Highlighted Sensors
    sensors.push({
      id: "S-12",
      name: "Sensor S-12 (Critical Node)",
      type: "Wireless Inclinometer & Strain Gauge",
      zone: "Zone A",
      status: "critical",
      lat: 17.5506,
      lng: 80.6118,
      displacement: 18.2,
      tilt: 3.2,
      crackWidth: 6.4,
      battery: 82,
      signal: -68,
      lastPing: "Just now"
    });

    sensors.push({
      id: "S-14",
      name: "Sensor S-14 (Extensometer)",
      type: "Borehole Extensometer",
      zone: "Zone B",
      status: "warning",
      lat: 17.5502,
      lng: 80.6148,
      displacement: 12.4,
      tilt: 1.8,
      crackWidth: 3.1,
      battery: 94,
      signal: -72,
      lastPing: "1m ago"
    });

    sensors.push({
      id: "S-34",
      name: "Sensor S-34 (Telemetry Node)",
      type: "Piezometer & Soil Moisture",
      zone: "Zone C",
      status: "offline",
      lat: 17.5468,
      lng: 80.6175,
      displacement: 0.0,
      tilt: 0.0,
      crackWidth: 0.0,
      battery: 4,
      signal: -110,
      lastPing: "4 hours ago"
    });

    sensors.push({
      id: "S-09",
      name: "Sensor S-09 (Tiltmeter)",
      type: "Surface Optical Prism & Tilt Node",
      zone: "Zone C",
      status: "warning",
      lat: 17.5482,
      lng: 80.6165,
      displacement: 6.1,
      tilt: 0.9,
      crackWidth: 0.9,
      battery: 68,
      signal: -85,
      lastPing: "2m ago"
    });

    // Populate remaining 46 online safe sensors scattered in zones
    for (let i = 1; i <= 46; i++) {
      if (i === 12 || i === 14 || i === 34 || i === 9) continue;
      const sId = `S-${i < 10 ? '0' + i : i}`;
      const offsetLat = (Math.random() - 0.5) * 0.008;
      const offsetLng = (Math.random() - 0.5) * 0.012;
      sensors.push({
        id: sId,
        name: `Sensor ${sId} (Standard Node)`,
        type: i % 2 === 0 ? "Multi-Axis Tiltmeter" : "GNSS Surface Prism",
        zone: offsetLat > 0 ? (offsetLng > 0 ? "Zone B" : "Zone A") : "Zone D",
        status: "safe",
        lat: baseLat + offsetLat,
        lng: baseLng + offsetLng,
        displacement: (Math.random() * 3.5 + 0.5).toFixed(1),
        tilt: (Math.random() * 0.4 + 0.1).toFixed(1),
        crackWidth: (Math.random() * 0.5).toFixed(1),
        battery: Math.floor(Math.random() * 25 + 75),
        signal: Math.floor(-60 - Math.random() * 25),
        lastPing: `${Math.floor(Math.random() * 4 + 1)}m ago`
      });
    }

    return sensors;
  },

  // Asynchronously Sync Data from REST API Backend
  async loadFromBackend(siteId = "singareni-s4") {
    const API_BASE = '/api';
    try {
      // 1. Fetch KPI Metrics
      const kpiRes = await fetch(`${API_BASE}/sites/${siteId}/kpis`).then(r => r.json());
      if (kpiRes.success && kpiRes.kpis) {
        this.kpis = kpiRes.kpis;
      }

      // 2. Fetch Latest Telemetry
      const telRes = await fetch(`${API_BASE}/sites/${siteId}/telemetry/latest`).then(r => r.json());
      if (telRes.success && telRes.telemetry) {
        this.telemetry = telRes.telemetry;
      }

      // 3. Fetch Risk Zones
      const zonesRes = await fetch(`${API_BASE}/sites/${siteId}/zones`).then(r => r.json());
      if (zonesRes.success && zonesRes.zones) {
        this.zones = zonesRes.zones;
      }

      // 4. Fetch Tunnels
      const tunRes = await fetch(`${API_BASE}/sites/${siteId}/tunnels`).then(r => r.json());
      if (tunRes.success && tunRes.tunnels) {
        this.tunnels = tunRes.tunnels;
      }

      // 5. Fetch Surface Infrastructure
      const infraRes = await fetch(`${API_BASE}/sites/${siteId}/infrastructure`).then(r => r.json());
      if (infraRes.success && infraRes.surfaceInfrastructure) {
        this.surfaceInfrastructure = infraRes.surfaceInfrastructure;
      }

      // 6. Fetch Displacement History
      const histRes = await fetch(`${API_BASE}/sites/${siteId}/history`).then(r => r.json());
      if (histRes.success && histRes.displacementHistory24h) {
        this.displacementHistory24h = histRes.displacementHistory24h;
      }

      // 7. Fetch Alerts
      const alertsRes = await fetch(`${API_BASE}/sites/${siteId}/alerts`).then(r => r.json());
      if (alertsRes.success && alertsRes.alerts) {
        this.alerts = alertsRes.alerts;
      }

      console.log('✅ Synchronized dataset with Mine Subsidence Backend API');
    } catch (err) {
      console.warn('⚠️ Backend REST API unavailable. Using fallback offline mock datasets:', err.message);
    }
  }
};

