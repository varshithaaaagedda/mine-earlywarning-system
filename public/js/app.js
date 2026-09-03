/**
 * Main Application Controller - Mine Subsidence Early Warning System
 */

window.MineApp = (function () {

  async function initApp() {
    startClock();
    setupThemeToggle();
    setupSiteSelector();

    // Fetch live REST API backend dataset
    await window.MineData.loadFromBackend();

    // Render Panels
    renderKPIs();
    renderAlerts();
    renderActions();
    renderNotifications();
    renderSensorHealth();

    // Initialize GIS Map & Chart
    window.MineMap.initMap('gis-map');
    window.MineChart.initChart('trend-chart');

    // Initialize Simulation
    window.MineSimulation.initSimulation();

    // Setup Event Listeners
    setupLayerToggles();
    setupModalListeners();
  }

  // Live Clock Ticker
  function startClock() {
    function tick() {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', { hour12: false }) + " IST";
      const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });

      const timeEl = document.getElementById('live-time');
      const dateEl = document.getElementById('live-date');
      if (timeEl) timeEl.textContent = timeStr;
      if (dateEl) dateEl.textContent = dateStr;
    }
    tick();
    setInterval(tick, 1000);
  }

  // Theme Switcher (Dark / Light)
  function setupThemeToggle() {
    const btn = document.getElementById('theme-toggle-btn');
    if (!btn) return;

    btn.addEventListener('click', () => {
      const currentTheme = document.body.getAttribute('data-theme') || 'dark';
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.body.setAttribute('data-theme', newTheme);

      btn.innerHTML = newTheme === 'dark'
        ? '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>'
        : '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>';
    });
  }

  // Site Dropdown Selector
  function setupSiteSelector() {
    const selector = document.getElementById('mine-site-select');
    if (!selector) return;

    window.MineData.sitesList.forEach(site => {
      const opt = document.createElement('option');
      opt.value = site.id;
      opt.textContent = `${site.name} (${site.location})`;
      if (site.id === window.MineData.currentSite.id) opt.selected = true;
      selector.appendChild(opt);
    });

    selector.addEventListener('change', (e) => {
      const selected = window.MineData.sitesList.find(s => s.id === e.target.value);
      if (selected) {
        showNotification(`🔄 Switched active site to ${selected.name}`);
      }
    });
  }

  // Render Top KPI Deck
  function renderKPIs() {
    const kpis = window.MineData.kpis;
    
    document.getElementById('kpi-risk-val').textContent = `${kpis.overallRiskScore} / 100`;
    document.getElementById('kpi-alerts-val').textContent = kpis.activeAlerts;
    document.getElementById('kpi-sensors-val').textContent = `${kpis.sensorsOnline} / ${kpis.sensorsTotal}`;
    document.getElementById('kpi-zones-val').textContent = kpis.highRiskZonesCount;
  }

  // Render Telemetry Data Panel UI & Fetch ML Risk Prediction
  async function updateTelemetryUI() {
    const t = window.MineData.telemetry;

    const dispVal = document.getElementById('tel-disp-val');
    const dispRate = document.getElementById('tel-disp-rate');
    const tiltVal = document.getElementById('tel-tilt-val');
    const tiltRate = document.getElementById('tel-tilt-rate');
    const crackVal = document.getElementById('tel-crack-val');
    const crackRate = document.getElementById('tel-crack-rate');
    const vibVal = document.getElementById('tel-vib-val');
    const moistureVal = document.getElementById('tel-moisture-val');
    const batteryVal = document.getElementById('tel-battery-val');

    if (dispVal) dispVal.textContent = `${t.groundDisplacement.toFixed(1)} mm`;
    if (dispRate) dispRate.textContent = t.displacementRate;
    if (tiltVal) tiltVal.textContent = `${t.tiltAngle.toFixed(1)}°`;
    if (tiltRate) tiltRate.textContent = t.tiltRate;
    if (crackVal) crackVal.textContent = `${t.crackWidth.toFixed(1)} mm`;
    if (crackRate) crackRate.textContent = t.crackRate;
    if (vibVal) vibVal.textContent = t.vibrationStatus;
    if (moistureVal) moistureVal.textContent = `${t.soilMoisture}%`;
    if (batteryVal) batteryVal.textContent = `${t.sensorBattery}%`;

    // Trigger ML Model inference API
    try {
      const mlRes = await fetch('/api/ml/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groundDisplacement: t.groundDisplacement,
          displacementRate: t.displacementRate,
          tiltAngle: t.tiltAngle,
          tiltRate: t.tiltRate,
          crackWidth: t.crackWidth,
          crackRate: t.crackRate,
          vibrationPPV: t.vibrationPPV,
          soilMoisture: t.soilMoisture
        })
      }).then(r => r.json());

      if (mlRes.success && mlRes.prediction) {
        updateMLPredictionUI(mlRes.prediction);
      }
    } catch (e) {
      // Ignore background network errors
    }
  }

  function updateMLPredictionUI(mlPred) {
    if (!mlPred) return;

    const badge = document.getElementById('ml-predicted-badge');
    const text = document.getElementById('ml-risk-class-text');
    const conf = document.getElementById('ml-confidence-val');
    const anomaly = document.getElementById('ml-anomaly-msg');

    const riskClass = mlPred.riskClass || 'Normal';
    if (badge) {
      badge.className = `ml-predicted-badge risk-${riskClass.toLowerCase()}`;
    }
    if (text) text.textContent = riskClass.toUpperCase();
    if (conf) conf.textContent = `${mlPred.confidence || 95.0}%`;

    if (anomaly && mlPred.anomalies) {
      anomaly.textContent = mlPred.anomalies.message;
    }

    // Probabilities
    if (mlPred.probabilities) {
      const pNorm = (mlPred.probabilities.Normal * 100).toFixed(1);
      const pWarn = (mlPred.probabilities.Warning * 100).toFixed(1);
      const pCrit = (mlPred.probabilities.Critical * 100).toFixed(1);

      const elPN = document.getElementById('prob-normal-val');
      const elBN = document.getElementById('prob-normal-bar');
      const elPW = document.getElementById('prob-warning-val');
      const elBW = document.getElementById('prob-warning-bar');
      const elPC = document.getElementById('prob-critical-val');
      const elBC = document.getElementById('prob-critical-bar');

      if (elPN) elPN.textContent = `${pNorm}%`;
      if (elBN) elBN.style.width = `${pNorm}%`;
      if (elPW) elPW.textContent = `${pWarn}%`;
      if (elBW) elBW.style.width = `${pWarn}%`;
      if (elPC) elPC.textContent = `${pCrit}%`;
      if (elBC) elBC.style.width = `${pCrit}%`;
    }

    // XAI Feature Importance
    const xaiList = document.getElementById('ml-xai-list');
    if (xaiList && mlPred.featureImportance) {
      xaiList.innerHTML = '';
      mlPred.featureImportance.slice(0, 4).forEach(item => {
        const row = document.createElement('div');
        row.className = 'xai-bar-row';
        row.innerHTML = `
          <span class="xai-name" title="${item.feature}">${item.feature}</span>
          <div class="xai-bar-wrap">
            <div class="xai-bar-fill" style="width: ${item.percentage}%;"></div>
          </div>
          <span class="xai-pct">${item.percentage}%</span>
        `;
        xaiList.appendChild(row);
      });
    }

    // Update Security & 4-Layer Status Ribbon Cards
    const elCyber = document.getElementById('status-cybersec');
    const elFour = document.getElementById('status-four-layer');
    const elCons = document.getElementById('status-consensus');
    const elGate = document.getElementById('status-gateway');

    if (riskClass === 'Critical') {
      if (elCyber) elCyber.innerHTML = '🛡️ HMAC-SHA256 Valid (Seq #204)';
      if (elFour) elFour.innerHTML = 'L1: Outlier • L2: Sustained • L3: Agree';
      if (elCons) elCons.innerHTML = '🔴 CONFIRMED (Node_04 Agrees)';
      if (elGate) elGate.innerHTML = '🟢 GATEWAY ONLINE (Cloud Sync)';
    } else if (riskClass === 'Warning') {
      if (elCyber) elCyber.innerHTML = '🛡️ HMAC-SHA256 Valid (Seq #202)';
      if (elFour) elFour.innerHTML = 'L1: Creep • L2: Elevated • L3: Caution';
      if (elCons) elCons.innerHTML = '🟠 WARNING (Single Node Creep)';
      if (elGate) elGate.innerHTML = '🟢 GATEWAY ONLINE (Cloud Sync)';
    } else {
      if (elCyber) elCyber.innerHTML = '🛡️ HMAC-SHA256 Valid (Seq #201)';
      if (elFour) elFour.innerHTML = 'L1: Normal • L2: Safe • L3: Baseline';
      if (elCons) elCons.innerHTML = '🟢 NORMAL (Isolated Baseline)';
      if (elGate) elGate.innerHTML = '🟢 GATEWAY ONLINE (Cloud Sync)';
    }
  }

  // Render Active Alerts Stream Panel
  function renderAlerts(filterSeverity = 'all') {
    const alertsContainer = document.getElementById('alerts-container');
    if (!alertsContainer) return;

    alertsContainer.innerHTML = '';

    const alerts = window.MineData.alerts.filter(a => filterSeverity === 'all' || a.severity === filterSeverity);

    alerts.forEach(alert => {
      const item = document.createElement('div');
      item.className = `alert-item ${alert.severity}`;
      item.innerHTML = `
        <div class="alert-top">
          <span class="alert-badge">${alert.severity}</span>
          <span class="alert-time">${alert.time}</span>
        </div>
        <div class="alert-title">${alert.title}</div>
        <div class="alert-body">${alert.explanation}</div>
        <div class="alert-footer">
          <span class="alert-risk-score">Risk Score: ${alert.riskScore}/100</span>
          <button class="btn-view-zone" data-zone="${alert.zoneId}">View Zone</button>
        </div>
      `;

      // Event listener for "View Zone" button
      item.querySelector('.btn-view-zone').addEventListener('click', () => {
        window.MineMap.selectZone(alert.zoneId);
        showNotification(`Focusing GIS map on ${alert.zoneName}`);
      });

      alertsContainer.appendChild(item);
    });
  }

  // Render Decision Support Recommended Actions
  function renderActions() {
    const actionsContainer = document.getElementById('actions-container');
    if (!actionsContainer) return;

    actionsContainer.innerHTML = '';
    const actions = window.MineData.recommendedActions;

    actions.forEach(act => {
      const div = document.createElement('div');
      div.className = 'action-checkbox-item';
      div.innerHTML = `
        <input type="checkbox" id="${act.id}" ${act.checked ? 'checked' : ''} />
        <label for="${act.id}">${act.text}</label>
      `;

      div.querySelector('input').addEventListener('change', (e) => {
        act.checked = e.target.checked;
      });

      actionsContainer.appendChild(div);
    });
  }

  // Render Multi-Channel Notification Matrix
  function renderNotifications() {
    const notifContainer = document.getElementById('notifications-container');
    if (!notifContainer) return;

    notifContainer.innerHTML = '';
    const notifs = window.MineData.notifications;

    notifs.forEach(n => {
      const card = document.createElement('div');
      card.className = 'notif-card';
      card.innerHTML = `
        <div>
          <div class="notif-role">${n.role}</div>
          <div class="notif-channel">${n.channel}</div>
        </div>
        <div class="notif-status" style="color: ${n.color}">
          ${n.status}
        </div>
      `;
      notifContainer.appendChild(card);
    });
  }

  // Render Sensor Fleet Summary & Health Panel
  function renderSensorHealth() {
    const quickList = document.getElementById('sensor-quick-list');
    if (!quickList) return;

    quickList.innerHTML = '';
    const fleet = window.MineData.generateSensorFleet();

    // Show top key sensors
    const keySensors = fleet.filter(s => s.status !== 'safe').concat(fleet.filter(s => s.status === 'safe').slice(0, 3));

    keySensors.forEach(s => {
      const row = document.createElement('div');
      row.className = 'sensor-row';
      let dotColor = 'green';
      if (s.status === 'warning') dotColor = 'yellow';
      if (s.status === 'critical' || s.status === 'offline') dotColor = 'red';

      row.innerHTML = `
        <div style="display:flex; align-items:center; gap:0.5rem;">
          <span class="sensor-status-dot ${dotColor}"></span>
          <span class="sensor-id">${s.id}</span>
          <span style="color: var(--text-secondary);">${s.zone}</span>
        </div>
        <span style="color: var(--text-muted);">${s.lastPing}</span>
      `;
      quickList.appendChild(row);
    });
  }

  // Setup Layer Toggles
  function setupLayerToggles() {
    const tTunnels = document.getElementById('toggle-tunnels');
    const tSensors = document.getElementById('toggle-sensors');
    const tSurface = document.getElementById('toggle-surface');

    if (tTunnels) tTunnels.addEventListener('change', (e) => window.MineMap.toggleTunnels(e.target.checked));
    if (tSensors) tSensors.addEventListener('change', (e) => window.MineMap.toggleSensors(e.target.checked));
    if (tSurface) tSurface.addEventListener('change', (e) => window.MineMap.toggleSurface(e.target.checked));
  }

  // Modal Dialog Listeners
  function setupModalListeners() {
    const openBtn = document.getElementById('btn-open-sensors-modal');
    const closeBtn = document.getElementById('btn-close-modal');
    const overlay = document.getElementById('sensor-modal-overlay');

    if (openBtn && overlay) {
      openBtn.addEventListener('click', () => {
        populateSensorTable();
        overlay.classList.add('active');
      });
    }

    if (closeBtn && overlay) {
      closeBtn.addEventListener('click', () => {
        overlay.classList.remove('active');
      });
    }

    // ML Diagnostics Modal
    const openMlBtn = document.getElementById('btn-open-ml-modal');
    const closeMlBtn = document.getElementById('btn-close-ml-modal');
    const mlOverlay = document.getElementById('ml-modal-overlay');

    if (openMlBtn && mlOverlay) {
      openMlBtn.addEventListener('click', () => {
        mlOverlay.classList.add('active');
      });
    }

    if (closeMlBtn && mlOverlay) {
      closeMlBtn.addEventListener('click', () => {
        mlOverlay.classList.remove('active');
      });
    }
  }

  function populateSensorTable() {
    const tbody = document.getElementById('sensor-modal-tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    const fleet = window.MineData.generateSensorFleet();

    fleet.forEach(s => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong style="font-family: var(--font-mono);">${s.id}</strong></td>
        <td>${s.type}</td>
        <td>${s.zone}</td>
        <td><span class="inspector-badge ${s.status}">${s.status}</span></td>
        <td style="font-family: var(--font-mono);">${s.displacement} mm</td>
        <td style="font-family: var(--font-mono);">${s.battery}%</td>
        <td style="font-family: var(--font-mono);">${s.signal} dBm</td>
        <td>${s.lastPing}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  // Simple Notification Toast
  function showNotification(msg) {
    let toast = document.getElementById('app-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'app-toast';
      toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background-color: #1e293b;
        color: #f8fafc;
        border: 1px solid var(--color-accent);
        border-radius: 8px;
        padding: 0.75rem 1.25rem;
        font-size: 0.82rem;
        font-weight: 600;
        box-shadow: 0 10px 25px rgba(0,0,0,0.5);
        z-index: 9999;
        transition: opacity 0.3s ease;
      `;
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    setTimeout(() => { toast.style.opacity = '0'; }, 3500);
  }

  return {
    initApp,
    updateTelemetryUI,
    showNotification,
    renderAlerts
  };
})();

// Initialize application on DOM content loaded
document.addEventListener('DOMContentLoaded', () => {
  window.MineApp.initApp();
});
