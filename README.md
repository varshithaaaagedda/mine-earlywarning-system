# Mine Subsidence Early Warning System 🚨⛰️

A real-time GIS & geotechnical monitoring dashboard designed to track ground deformation above underground coal mines, predict potential subsidence events, and trigger early warning alerts before surface cracks, infrastructure damage, or mine roof collapses occur.

---

## 🌟 Key Features

* **🗺️ Real-Time GIS Hazard Mapping**:
  * Leaflet-powered GIS engine displaying Esri Dark Gray canvas tiles.
  * Color-coded dynamic risk zone overlays (**Critical**, **Warning**, **Watch**, **Safe**).
  * Underground tunnel drift & extraction gallery vector layer integration.
  * Surface infrastructure risk tracking (villages, access roads, rivers).

* **📈 Time-Series Subsidence Analytics**:
  * Dynamic Chart.js trends displaying 24-hour displacement history.
  * Automated threshold line indicators for **Normal (5 mm)**, **Warning (12 mm)**, and **Critical (15 mm)** deformation limits.

* **📡 Sensor Telemetry Array**:
  * Real-time tracking of InSAR satellites, Optical Prisms, Extensometers, Borehole Tiltmeters, GNSS surface nodes, and Piezometers.
  * Pulsing status indicators reflecting signal strength (LoRaWAN/5G) and battery levels.

* **⚡ Interactive Event Simulation Suite**:
  * **Heavy Rain Infiltration**: Simulates soil moisture surges and accelerated pore pressure deformation.
  * **Displacement Spike Event**: Simulates rapid roof movement over active extraction galleries.
  * Live sensor micro-fluctuations (4s interval) to mirror live telemetry streaming.

* **🎨 Responsive Dark/Light UI Design**:
  * Control room optimized visual layout built with custom CSS tokens, glassmorphism cards, and smooth micro-animations.

---

## 🛠️ Tech Stack

* **Frontend**: HTML5, CSS3, JavaScript (ES6 IIFE Modular Architecture)
* **Mapping Engine**: Leaflet.js (v1.9.4) & Esri World Dark Gray Base Tile Service
* **Charts & Graphing**: Chart.js (v4.4.1)
* **Typography**: Google Fonts (*Inter* & *JetBrains Mono*)

---

## 📂 Project Structure

```
mine-earlywarning-system/
├── index.html         # Main dashboard HTML container & layout
├── css/
│   └── styles.css     # CSS custom variables, theme tokens & layout styles
├── js/
│   ├── app.js         # Core application lifecycle & UI state rendering
│   ├── chart.js       # Chart.js time-series graph controller
│   ├── data.js        # Site metadata, sensor array data & risk zone vectors
│   ├── map.js         # Leaflet GIS map initialization & vector overlays
│   └── simulation.js  # Live telemetry simulator & demo event triggers
├── LICENSE            # License details
└── README.md          # Project documentation
```

---

## 🚀 Local Development Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/varshithaaaagedda/mine-earlywarning-system.git
   cd mine-earlywarning-system
   ```

2. **Run locally**:
   * Open `index.html` directly in your browser, **OR**
   * Serve using any simple HTTP server:
     ```bash
     npx http-server -p 8080
     ```
   * Open `http://localhost:8080` in your web browser.

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.
