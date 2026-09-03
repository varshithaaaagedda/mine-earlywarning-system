/**
 * Simulation Suite for Interactive Demo & Live Telemetry Updates (Backend API Integrated)
 */

window.MineSimulation = (function () {
  let simInterval = null;

  function initSimulation() {
    // Periodically fluctuate sensor values slightly to demonstrate live streaming
    simInterval = setInterval(() => {
      microFluctuateData();
    }, 4000);
  }

  async function microFluctuateData() {
    const telemetry = window.MineData.telemetry;
    const jitter = (Math.random() * 0.08 - 0.03).toFixed(2);
    telemetry.groundDisplacement = Math.max(0, parseFloat((telemetry.groundDisplacement + parseFloat(jitter)).toFixed(2)));

    // Update DOM
    window.MineApp.updateTelemetryUI();

    // Ingest telemetry to backend occasionally
    try {
      await fetch('/api/telemetry/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId: window.MineData.currentSite.id,
          zoneId: 'zone-a',
          sensorId: 'SN-101',
          groundDisplacement: telemetry.groundDisplacement,
          tiltAngle: telemetry.tiltAngle,
          crackWidth: telemetry.crackWidth,
          vibrationPPV: telemetry.vibrationPPV,
          soilMoisture: telemetry.soilMoisture
        })
      });
    } catch (e) {
      // Ignore network errors in background micro-fluctuations
    }
  }

  // Trigger Heavy Rain Event Simulation
  async function triggerRainSimulation() {
    try {
      const res = await fetch('/api/simulation/trigger-rain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId: window.MineData.currentSite.id })
      }).then(r => r.json());

      if (res.success && res.telemetry) {
        Object.assign(window.MineData.telemetry, res.telemetry);
        window.MineApp.updateTelemetryUI();
        window.MineChart.addDataPoint(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), res.telemetry.groundDisplacement);
        window.MineApp.showNotification(res.message || "🌧️ Heavy Rain Simulation Injected.");
      }
    } catch (err) {
      // Fallback local update if offline
      const telemetry = window.MineData.telemetry;
      telemetry.soilMoisture = Math.min(95, telemetry.soilMoisture + 15);
      telemetry.groundDisplacement = parseFloat((telemetry.groundDisplacement + 1.2).toFixed(1));
      telemetry.displacementRate = "+3.6 mm/hr";
      telemetry.moistureStatus = "Heavy Rain Infiltration Alert";

      window.MineApp.updateTelemetryUI();
      window.MineChart.addDataPoint(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), telemetry.groundDisplacement);
      window.MineApp.showNotification("🌧️ Simulation: Heavy Rain Event Injected.");
    }
  }

  // Trigger Sudden Displacement Spike Simulation
  async function triggerDisplacementSpike() {
    try {
      const res = await fetch('/api/simulation/trigger-spike', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId: window.MineData.currentSite.id })
      }).then(r => r.json());

      if (res.success && res.telemetry) {
        Object.assign(window.MineData.telemetry, res.telemetry);
        window.MineApp.updateTelemetryUI();
        window.MineChart.addDataPoint(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), res.telemetry.groundDisplacement);
        window.MineApp.showNotification(res.message || "⚠️ Accelerated ground deformation triggered!");
      }
    } catch (err) {
      const telemetry = window.MineData.telemetry;
      telemetry.groundDisplacement = parseFloat((telemetry.groundDisplacement + 3.5).toFixed(1));
      telemetry.tiltAngle = parseFloat((telemetry.tiltAngle + 0.8).toFixed(1));
      telemetry.crackWidth = parseFloat((telemetry.crackWidth + 1.4).toFixed(1));
      telemetry.displacementRate = "+5.2 mm/hr (RAPID)";

      window.MineApp.updateTelemetryUI();
      window.MineChart.addDataPoint(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), telemetry.groundDisplacement);
      window.MineApp.showNotification("⚠️ Simulation: Accelerated ground deformation triggered in Zone A!");
    }
  }

  // Reset to Baseline
  async function resetSimulation() {
    try {
      const res = await fetch('/api/simulation/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId: window.MineData.currentSite.id })
      }).then(r => r.json());

      if (res.success && res.telemetry) {
        Object.assign(window.MineData.telemetry, res.telemetry);
        window.MineApp.updateTelemetryUI();
        window.MineApp.showNotification(res.message || "🔄 Baseline telemetry reset.");
      }
    } catch (err) {
      window.MineData.telemetry.groundDisplacement = 18.2;
      window.MineData.telemetry.tiltAngle = 3.2;
      window.MineData.telemetry.crackWidth = 6.4;
      window.MineData.telemetry.soilMoisture = 34;
      window.MineData.telemetry.displacementRate = "+2.4 mm/hr";

      window.MineApp.updateTelemetryUI();
      window.MineApp.showNotification("🔄 Baseline telemetry reset.");
    }
  }

  // Trigger Normal Baseline Scenario
  function triggerNormalScenario() {
    const t = window.MineData.telemetry;
    t.groundDisplacement = 1.8;
    t.displacementRate = "+0.2 mm/hr";
    t.tiltAngle = 0.2;
    t.tiltRate = "+0.05°/hr";
    t.crackWidth = 0.5;
    t.crackRate = "+0.05 mm";
    t.vibrationPPV = 0.6;
    t.soilMoisture = 22;
    t.vibrationStatus = "Normal Baseline";

    window.MineApp.updateTelemetryUI();
    window.MineApp.showNotification("🟢 ML Scenario: Baseline Normal state injected.");
  }

  // Trigger Warning Creep Scenario
  function triggerWarningScenario() {
    const t = window.MineData.telemetry;
    t.groundDisplacement = 8.5;
    t.displacementRate = "+1.4 mm/hr";
    t.tiltAngle = 1.6;
    t.tiltRate = "+0.25°/hr";
    t.crackWidth = 3.4;
    t.crackRate = "+0.45 mm";
    t.vibrationPPV = 1.8;
    t.soilMoisture = 48;
    t.vibrationStatus = "Elevated Creep";

    window.MineApp.updateTelemetryUI();
    window.MineApp.showNotification("🟡 ML Scenario: Warning progressive creep state injected.");
  }

  // Trigger Critical Spike Scenario
  function triggerCriticalSpikeScenario() {
    const t = window.MineData.telemetry;
    t.groundDisplacement = 18.5;
    t.displacementRate = "+3.8 mm/hr (RAPID)";
    t.tiltAngle = 3.8;
    t.tiltRate = "+0.65°/hr";
    t.crackWidth = 7.2;
    t.crackRate = "+1.2 mm";
    t.vibrationPPV = 3.2;
    t.soilMoisture = 75;
    t.vibrationStatus = "Critical Strata Movement";

    window.MineApp.updateTelemetryUI();
    window.MineChart.addDataPoint(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), t.groundDisplacement);
    window.MineApp.showNotification("🔴 ML Scenario: Critical slope deformation spike injected!");
  }

  // Trigger Watch Scenario (Subtle deformation / elevated caution)
  function triggerWatchScenario() {
    const t = window.MineData.telemetry;
    t.groundDisplacement = 4.2;
    t.displacementRate = "+0.8 mm/hr";
    t.tiltAngle = 0.9;
    t.tiltRate = "+0.15°/hr";
    t.crackWidth = 1.8;
    t.crackRate = "+0.20 mm/hr";
    t.vibrationPPV = 1.1;
    t.soilMoisture = 35;
    t.signalStrength = -70;

    window.MineApp.updateTelemetryUI();
    window.MineApp.showNotification("🟡 ML Scenario: WATCH level subtle strain acceleration detected.");
  }

  // Trigger Sensor Tampering / Neighbor Disagreement Scenario
  function triggerTamperingScenario() {
    const t = window.MineData.telemetry;
    t.groundDisplacement = 18.5;
    t.tiltAngle = 3.4;
    t.tiltRate = "+0.65°/hr";
    t.crackWidth = 7.2;
    t.crackRate = "+1.20 mm/hr";
    t.vibrationPPV = 2.8;
    t.soilMoisture = 65;
    t.signalStrength = -68;

    window.MineApp.updateTelemetryUI();
    window.MineApp.showNotification("⚠️ SECURITY ALERT: Node 03 Possible Sensor Tampering - Neighboring nodes disagree. Evacuation NOT triggered.");
  }

  return {
    initSimulation,
    triggerRainSimulation,
    triggerDisplacementSpike,
    resetSimulation,
    triggerNormalScenario,
    triggerWatchScenario,
    triggerWarningScenario,
    triggerCriticalSpikeScenario,
    triggerTamperingScenario
  };
})();

