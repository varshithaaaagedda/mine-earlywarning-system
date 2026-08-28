/**
 * Simulation Suite for Interactive Demo & Live Telemetry Updates
 */

window.MineSimulation = (function () {
  let simInterval = null;

  function initSimulation() {
    // Periodically fluctuate sensor values slightly to demonstrate live streaming
    simInterval = setInterval(() => {
      microFluctuateData();
    }, 4000);
  }

  function microFluctuateData() {
    const telemetry = window.MineData.telemetry;
    // Tiny jitter on displacement (+0.05 mm)
    const jitter = (Math.random() * 0.08 - 0.03).toFixed(2);
    telemetry.groundDisplacement = Math.max(0, parseFloat((telemetry.groundDisplacement + parseFloat(jitter)).toFixed(2)));

    // Update DOM
    window.MineApp.updateTelemetryUI();
  }

  // Trigger Heavy Rain Event Simulation
  function triggerRainSimulation() {
    const telemetry = window.MineData.telemetry;
    telemetry.soilMoisture = Math.min(95, telemetry.soilMoisture + 15);
    telemetry.groundDisplacement = parseFloat((telemetry.groundDisplacement + 1.2).toFixed(1));
    telemetry.displacementRate = "+3.6 mm/hr";
    telemetry.moistureStatus = "Heavy Rain Infiltration Alert";

    window.MineApp.updateTelemetryUI();
    window.MineChart.addDataPoint(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), telemetry.groundDisplacement);
    window.MineApp.showNotification("🌧️ Simulation: Heavy Rain Event Injected. Soil moisture increased to " + telemetry.soilMoisture + "%");
  }

  // Trigger Sudden Displacement Spike Simulation
  function triggerDisplacementSpike() {
    const telemetry = window.MineData.telemetry;
    telemetry.groundDisplacement = parseFloat((telemetry.groundDisplacement + 3.5).toFixed(1));
    telemetry.tiltAngle = parseFloat((telemetry.tiltAngle + 0.8).toFixed(1));
    telemetry.crackWidth = parseFloat((telemetry.crackWidth + 1.4).toFixed(1));
    telemetry.displacementRate = "+5.2 mm/hr (RAPID)";

    window.MineApp.updateTelemetryUI();
    window.MineChart.addDataPoint(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), telemetry.groundDisplacement);
    window.MineApp.showNotification("⚠️ Simulation: Accelerated ground deformation triggered in Zone A!");
  }

  // Reset to Baseline
  function resetSimulation() {
    window.MineData.telemetry.groundDisplacement = 18.2;
    window.MineData.telemetry.tiltAngle = 3.2;
    window.MineData.telemetry.crackWidth = 6.4;
    window.MineData.telemetry.soilMoisture = 34;
    window.MineData.telemetry.displacementRate = "+2.4 mm/hr";

    window.MineApp.updateTelemetryUI();
    window.MineApp.showNotification("🔄 Baseline telemetry reset.");
  }

  return {
    initSimulation,
    triggerRainSimulation,
    triggerDisplacementSpike,
    resetSimulation
  };
})();
