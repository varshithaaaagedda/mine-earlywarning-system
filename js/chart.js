/**
 * Time-Series Subsidence Trend Chart Controller using Chart.js
 */

window.MineChart = (function () {
  let chartInstance = null;

  function initChart(canvasId) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    const histData = window.MineData.displacementHistory24h;

    // Gradient fill under the line
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(239, 68, 68, 0.45)');  // Red top
    gradient.addColorStop(0.5, 'rgba(249, 115, 22, 0.25)'); // Orange mid
    gradient.addColorStop(1, 'rgba(16, 185, 129, 0.05)'); // Green bottom

    chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: histData.labels,
        datasets: [
          {
            label: 'Ground Displacement (mm)',
            data: histData.displacement,
            borderColor: '#ef4444',
            borderWidth: 3,
            backgroundColor: gradient,
            fill: true,
            tension: 0.35,
            pointBackgroundColor: '#ef4444',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 7
          },
          // Threshold Lines
          {
            label: 'Critical Threshold (15 mm)',
            data: Array(histData.labels.length).fill(histData.thresholds.critical),
            borderColor: '#ef4444',
            borderWidth: 2,
            borderDash: [6, 4],
            pointRadius: 0,
            fill: false
          },
          {
            label: 'Warning Threshold (12 mm)',
            data: Array(histData.labels.length).fill(histData.thresholds.warning),
            borderColor: '#f97316',
            borderWidth: 2,
            borderDash: [6, 4],
            pointRadius: 0,
            fill: false
          },
          {
            label: 'Normal Threshold (5 mm)',
            data: Array(histData.labels.length).fill(histData.thresholds.normal),
            borderColor: '#10b981',
            borderWidth: 1.5,
            borderDash: [4, 4],
            pointRadius: 0,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: '#94a3b8',
              font: { family: 'Inter', size: 11, weight: '600' },
              usePointStyle: true,
              boxWidth: 8
            }
          },
          tooltip: {
            backgroundColor: '#0f172a',
            titleColor: '#f8fafc',
            bodyColor: '#cbd5e1',
            borderColor: 'rgba(255,255,255,0.15)',
            borderWidth: 1,
            padding: 10,
            displayColors: true,
            callbacks: {
              label: function(context) {
                return `${context.dataset.label}: ${context.parsed.y} mm`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#94a3b8', font: { family: 'Inter', size: 10 } }
          },
          y: {
            min: 0,
            max: 25,
            grid: { color: 'rgba(255, 255, 255, 0.08)' },
            ticks: {
              color: '#94a3b8',
              font: { family: 'Inter', size: 10 },
              callback: function(value) { return value + ' mm'; }
            },
            title: {
              display: true,
              text: 'Surface Displacement (mm)',
              color: '#64748b',
              font: { family: 'Inter', size: 11, weight: '600' }
            }
          }
        }
      }
    });
  }

  function addDataPoint(label, value) {
    if (!chartInstance) return;
    chartInstance.data.labels.shift();
    chartInstance.data.labels.push(label);

    chartInstance.data.datasets[0].data.shift();
    chartInstance.data.datasets[0].data.push(value);

    // Update threshold arrays
    const thresholds = window.MineData.displacementHistory24h.thresholds;
    chartInstance.data.datasets[1].data = Array(chartInstance.data.labels.length).fill(thresholds.critical);
    chartInstance.data.datasets[2].data = Array(chartInstance.data.labels.length).fill(thresholds.warning);
    chartInstance.data.datasets[3].data = Array(chartInstance.data.labels.length).fill(thresholds.normal);

    chartInstance.update();
  }

  return {
    initChart,
    addDataPoint
  };
})();
