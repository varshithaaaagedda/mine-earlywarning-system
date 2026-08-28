/**
 * GIS Map Controller Component for Mine Subsidence Early Warning System
 * Uses Leaflet.js with custom styled vector layers, hazard zones, and tunnel overlays.
 */

window.MineMap = (function () {
  let map = null;
  let zoneLayers = {};
  let tunnelLayers = [];
  let surfaceLayers = [];
  let sensorMarkers = [];
  let activeInspector = null;

  function initMap(containerId) {
    const site = window.MineData.currentSite;

    // Create Leaflet Map Instance
    map = L.map(containerId, {
      center: site.centerCoords,
      zoom: site.zoomLevel,
      zoomControl: false,
      attributionControl: false
    });

    // Add Zoom Control to Top Left
    L.control.zoom({ position: 'topleft' }).addTo(map);

    // Dark Tile Layer (Esri World Dark Gray Canvas - No API Key required)
    const darkTileLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 16,
      attribution: 'Esri, HERE, Garmin, © OpenStreetMap'
    });
    darkTileLayer.addTo(map);

    // Render Layers
    renderRiskZones();
    renderUndergroundTunnels();
    renderSurfaceInfrastructure();
    renderSensors();

    // Select Zone A by default
    selectZone("zone-a");

    return map;
  }

  // Render Hazard Polygons
  function renderRiskZones() {
    const zones = window.MineData.zones;

    zones.forEach(zone => {
      let fillColor, strokeColor;
      switch (zone.status) {
        case 'critical':
          fillColor = '#ef4444';
          strokeColor = '#dc2626';
          break;
        case 'warning':
          fillColor = '#f97316';
          strokeColor = '#ea580c';
          break;
        case 'watch':
          fillColor = '#eab308';
          strokeColor = '#ca8a04';
          break;
        case 'safe':
        default:
          fillColor = '#10b981';
          strokeColor = '#059669';
          break;
      }

      const polygon = L.polygon(zone.polygon, {
        color: strokeColor,
        weight: 2,
        fillColor: fillColor,
        fillOpacity: zone.status === 'critical' ? 0.45 : 0.3,
        className: `hazard-polygon ${zone.status}`
      }).addTo(map);

      // Tooltip on Hover
      polygon.bindTooltip(`<strong>${zone.name}</strong><br/>Risk Score: ${zone.riskScore}/100`, {
        permanent: false,
        direction: 'center',
        className: 'custom-map-tooltip'
      });

      // Click Event to select zone
      polygon.on('click', () => {
        selectZone(zone.id);
      });

      zoneLayers[zone.id] = { polygon, data: zone };
    });
  }

  // Render Underground Coal Mine Tunnels & Galleries Overlay
  function renderUndergroundTunnels() {
    const tunnels = window.MineData.tunnels;

    tunnels.forEach(t => {
      let color = '#38bdf8';
      let dashArray = '6, 6';
      let weight = 3;

      if (t.type === 'trunk') {
        color = '#0284c7';
        dashArray = '10, 5';
        weight = 5;
      } else if (t.type === 'crosscut') {
        color = '#7dd3fc';
        dashArray = '4, 4';
        weight = 2;
      }

      const polyline = L.polyline(t.path, {
        color: color,
        weight: weight,
        dashArray: dashArray,
        opacity: 0.85
      }).addTo(map);

      polyline.bindTooltip(`⛏️ Underground: ${t.name}`, { sticky: true });
      tunnelLayers.push(polyline);
    });

    // Mine Seam Outer Boundary
    const seamBoundary = L.polygon([
      [17.5435, 80.6050],
      [17.5525, 80.6080],
      [17.5530, 80.6180],
      [17.5440, 80.6210]
    ], {
      color: '#f59e0b',
      weight: 2,
      dashArray: '8, 8',
      fill: false
    }).addTo(map);
    tunnelLayers.push(seamBoundary);
  }

  // Render Surface Infrastructure (Village, Road, Water)
  function renderSurfaceInfrastructure() {
    const infra = window.MineData.surfaceInfrastructure;

    // Village Boundary
    const villagePoly = L.polygon(infra.village.polygon, {
      color: '#a855f7',
      weight: 2,
      fillColor: '#c084fc',
      fillOpacity: 0.25,
      dashArray: '3, 3'
    }).addTo(map);
    villagePoly.bindTooltip(`🏠 ${infra.village.name}`, { sticky: true });
    surfaceLayers.push(villagePoly);

    // Village Road Polyline
    const roadPoly = L.polyline(infra.road.path, {
      color: '#f8fafc',
      weight: 4,
      opacity: 0.9
    }).addTo(map);
    roadPoly.bindTooltip(`🛣️ ${infra.road.name}`, { sticky: true });
    surfaceLayers.push(roadPoly);

    // River Stream
    const riverPoly = L.polyline(infra.river.path, {
      color: '#3b82f6',
      weight: 4,
      opacity: 0.8
    }).addTo(map);
    riverPoly.bindTooltip(`🌊 ${infra.river.name}`, { sticky: true });
    surfaceLayers.push(riverPoly);
  }

  // Render Sensor Pins with HTML DivIcons
  function renderSensors() {
    const fleet = window.MineData.generateSensorFleet();

    fleet.forEach(s => {
      let pinColor = '#10b981';
      let pulseClass = '';

      if (s.status === 'critical') {
        pinColor = '#ef4444';
        pulseClass = 'pulse-red';
      } else if (s.status === 'warning') {
        pinColor = '#f97316';
        pulseClass = 'pulse-orange';
      } else if (s.status === 'offline') {
        pinColor = '#64748b';
      }

      const customIcon = L.divIcon({
        className: 'custom-sensor-icon-wrap',
        html: `
          <div class="sensor-pin ${pulseClass}" style="background-color: ${pinColor}">
            <span class="sensor-label-txt">${s.id}</span>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const marker = L.marker([s.lat, s.lng], { icon: customIcon }).addTo(map);

      marker.bindPopup(`
        <div style="color: #0f172a; font-family: sans-serif; font-size: 0.8rem;">
          <strong style="color: #1e293b;">${s.name}</strong><br/>
          <span>Type: ${s.type}</span><br/>
          <span>Displacement: <strong>${s.displacement} mm</strong></span><br/>
          <span>Tilt Angle: <strong>${s.tilt}°</strong></span><br/>
          <span>Battery: ${s.battery}% | Signal: ${s.signal} dBm</span><br/>
          <small style="color: #64748b;">Last Ping: ${s.lastPing}</small>
        </div>
      `);

      sensorMarkers.push(marker);
    });
  }

  // Select Zone & Show Inspector Panel
  function selectZone(zoneId) {
    const zoneObj = window.MineData.zones.find(z => z.id === zoneId);
    if (!zoneObj) return;

    // Pan / Fly to zone center
    const bounds = L.latLngBounds(zoneObj.polygon);
    map.flyToBounds(bounds, { padding: [50, 50], maxZoom: 17, duration: 0.8 });

    // Highlight polygon
    Object.keys(zoneLayers).forEach(id => {
      const p = zoneLayers[id].polygon;
      if (id === zoneId) {
        p.setStyle({ weight: 4, fillOpacity: 0.55 });
      } else {
        p.setStyle({ weight: 2, fillOpacity: 0.25 });
      }
    });

    // Update Inspector UI Component in DOM
    updateInspectorUI(zoneObj);
  }

  function updateInspectorUI(zone) {
    const card = document.getElementById('zone-inspector-card');
    if (!card) return;

    card.innerHTML = `
      <div class="inspector-header">
        <div class="inspector-title">${zone.name}</div>
        <span class="inspector-badge ${zone.status}">${zone.status}</span>
      </div>
      <div class="inspector-metrics">
        <div class="metric-row">
          <span class="metric-label">Risk Score:</span>
          <span class="metric-val" style="color: ${zone.status === 'critical' ? 'var(--color-critical)' : 'var(--text-primary)'}">${zone.riskScore} / 100</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Ground Displacement:</span>
          <span class="metric-val">${zone.displacement}</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Crack Growth Rate:</span>
          <span class="metric-val">${zone.crackGrowth}</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Tilt Angle:</span>
          <span class="metric-val">${zone.tiltAngle}</span>
        </div>
      </div>
      <div class="recommended-action-box">
        <strong>Recommended Protocol:</strong>
        ${zone.recommendedAction}
      </div>
    `;
    card.style.display = 'block';
  }

  // Layer Toggles
  function toggleTunnels(visible) {
    tunnelLayers.forEach(l => {
      if (visible) map.addLayer(l);
      else map.removeLayer(l);
    });
  }

  function toggleSensors(visible) {
    sensorMarkers.forEach(m => {
      if (visible) map.addLayer(m);
      else map.removeLayer(m);
    });
  }

  function toggleSurface(visible) {
    surfaceLayers.forEach(l => {
      if (visible) map.addLayer(l);
      else map.removeLayer(l);
    });
  }

  function resetView() {
    const site = window.MineData.currentSite;
    map.flyTo(site.centerCoords, site.zoomLevel, { duration: 0.8 });
  }

  return {
    initMap,
    selectZone,
    toggleTunnels,
    toggleSensors,
    toggleSurface,
    resetView
  };
})();
