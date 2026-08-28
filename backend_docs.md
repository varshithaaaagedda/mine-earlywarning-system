# Mine Subsidence Early Warning System — REST API Backend Documentation 🚀

The backend for the **Mine Subsidence Early Warning System** is built on Node.js, Express, and SQLite. It provides REST APIs for real-time telemetry ingestion, dynamic risk level evaluation, GIS spatial data serving, hazard alert generation, and interactive simulation controls.

---

## 🛠️ Tech Stack & Database Architecture

* **Runtime & Framework**: Node.js (v26+), Express.js
* **Database**: SQLite3 (`database/subsidence.db`)
* **Environment Configuration**: `dotenv` (`.env`)
* **Security & CORS**: `cors` middleware

### Database Schema DDL

```sql
-- 1. Monitoring Sites Table
CREATE TABLE sites (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  seam TEXT,
  center_lat REAL NOT NULL,
  center_lng REAL NOT NULL,
  zoom_level INTEGER DEFAULT 16,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Risk Zones Table
CREATE TABLE risk_zones (
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

-- 3. Sensor Fleet Table
CREATE TABLE sensors (
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

-- 4. Sensor Readings History Table
CREATE TABLE sensor_readings (
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

-- 5. Active Hazard Alerts Table
CREATE TABLE alerts (
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
```

---

## 📡 REST API Reference

### 1. Health Check
* **Endpoint**: `GET /api/health`
* **Response**:
```json
{
  "status": "UP",
  "system": "Mine Subsidence Early Warning Backend",
  "timestamp": "2026-08-28T13:30:00.000Z",
  "database": "Connected",
  "sitesCount": 4
}
```

---

### 2. Monitoring Sites & KPIs

#### List Sites
* **Endpoint**: `GET /api/sites`
* **Response**:
```json
{
  "success": true,
  "sites": [
    {
      "id": "singareni-s4",
      "name": "Singareni Colliery - Shaft 4",
      "location": "Kothagudem, Telangana, India",
      "seam": "King Seam #3 (Depth: 240m)",
      "centerLat": 17.5485,
      "centerLng": 80.612,
      "zoomLevel": 16
    }
  ]
}
```

#### Get Site KPIs
* **Endpoint**: `GET /api/sites/:siteId/kpis`
* **Response**:
```json
{
  "success": true,
  "kpis": {
    "overallRiskScore": 87,
    "maxRiskScore": 100,
    "activeAlerts": 3,
    "criticalAlertsCount": 1,
    "warningAlertsCount": 1,
    "watchAlertsCount": 1,
    "sensorsOnline": 47,
    "sensorsTotal": 50,
    "highRiskZonesCount": 2
  }
}
```

---

### 3. Sensor Telemetry Ingestion (IoT Hardware API)

#### Ingest Sensor Reading
* **Endpoint**: `POST /api/telemetry/ingest`
* **Headers**: `Content-Type: application/json`
* **Payload**:
```json
{
  "siteId": "singareni-s4",
  "zoneId": "zone-a",
  "sensorId": "EXT-104",
  "groundDisplacement": 18.2,
  "displacementRate": "+2.4 mm/hr",
  "tiltAngle": 3.2,
  "tiltRate": "+0.4°/hr",
  "crackWidth": 6.4,
  "vibrationPPV": 2.8,
  "soilMoisture": 34,
  "sensorBattery": 82,
  "signalStrength": -68
}
```
* **Response (201 Created)**:
```json
{
  "success": true,
  "message": "Telemetry ingested successfully",
  "readingId": 42,
  "evaluatedRisk": {
    "riskScore": 87,
    "riskLevel": "CRITICAL"
  }
}
```

#### Get Latest Telemetry
* **Endpoint**: `GET /api/sites/:siteId/telemetry/latest`

#### Get 24-Hour Displacement History
* **Endpoint**: `GET /api/sites/:siteId/history`

---

### 4. GIS Risk Zones & Map Overlays

#### Get Hazard Risk Zones
* **Endpoint**: `GET /api/sites/:siteId/zones`

#### Get Underground Tunnels
* **Endpoint**: `GET /api/sites/:siteId/tunnels`

#### Get Surface Infrastructure
* **Endpoint**: `GET /api/sites/:siteId/infrastructure`

---

### 5. Hazard Alerts

#### Get Alerts Feed
* **Endpoint**: `GET /api/sites/:siteId/alerts?severity=all` (options: `all`, `critical`, `warning`, `watch`)

#### Acknowledge Alert
* **Endpoint**: `POST /api/alerts/:alertId/acknowledge`

---

### 6. Interactive Event Simulation

#### Trigger Heavy Rain Simulation
* **Endpoint**: `POST /api/simulation/trigger-rain`

#### Trigger Displacement Spike Simulation
* **Endpoint**: `POST /api/simulation/trigger-spike`

#### Reset Baseline Telemetry
* **Endpoint**: `POST /api/simulation/trigger-reset`

---

## ⚡ Connecting Real IoT Hardware / Gateway Nodes

To connect physical field sensors (LoRaWAN gateways, Modbus RTU nodes, cellular NB-IoT devices):
1. Configure your gateway to HTTP POST telemetry readings to:
   `POST http://<server-ip>:3000/api/telemetry/ingest`
2. Ensure JSON fields include `siteId`, `groundDisplacement`, `tiltAngle`, `crackWidth`, and `sensorId`.
3. The risk engine will automatically parse readings, compute risk scores, update SQLite, and alert control room operators in real time.
