const http = require('http');

const BASE_URL = 'http://127.0.0.1:3000';

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });

    req.on('error', reject);
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

const app = require('../server');
const { initializeDatabase } = require('../database/init');

async function runTests() {
  console.log('🧪 Starting Automated Backend API Test Suite...\n');
  await initializeDatabase();
  
  const server = app.listen(3000, '127.0.0.1');
  
  let passed = 0;
  let failed = 0;

  async function assertTest(name, fn) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name} — ${err.message}`);
      failed++;
    }
  }

  try {
    // 1. Health Check
    await assertTest('GET /api/health returns 200 ok', async () => {
      const res = await makeRequest('GET', '/api/health');
      if (res.status !== 200 || (res.body.status !== 'ok' && res.body.status !== 'UP')) {
        throw new Error(`Expected ok/UP, got status ${res.status} (${res.body.status})`);
      }
    });

    // 2. Sites List
    await assertTest('GET /api/sites returns sites array', async () => {
      const res = await makeRequest('GET', '/api/sites');
      if (res.status !== 200 || !Array.isArray(res.body.sites) || res.body.sites.length === 0) {
        throw new Error('Failed to retrieve sites list');
      }
    });

    // 3. Site KPIs
    await assertTest('GET /api/sites/singareni-s4/kpis returns metrics', async () => {
      const res = await makeRequest('GET', '/api/sites/singareni-s4/kpis');
      if (res.status !== 200 || res.body.kpis.sensorsTotal !== 50) {
        throw new Error('KPI endpoint failed or invalid sensor count');
      }
    });

    // 4. Telemetry Ingestion & Risk Engine Calculation
    await assertTest('POST /api/telemetry/ingest calculates CRITICAL risk level', async () => {
      const res = await makeRequest('POST', '/api/telemetry/ingest', {
        siteId: 'singareni-s4',
        zoneId: 'zone-a',
        sensorId: 'EX-TEST-1',
        groundDisplacement: 19.5,
        tiltAngle: 3.8,
        crackWidth: 7.1
      });

      if (res.status !== 201 || res.body.evaluatedRisk.riskLevel !== 'CRITICAL') {
        throw new Error(`Expected CRITICAL risk level, got ${res.body.evaluatedRisk?.riskLevel}`);
      }
    });

    // 5. GIS Zones Endpoint
    await assertTest('GET /api/sites/singareni-s4/zones returns polygon geometry', async () => {
      const res = await makeRequest('GET', '/api/sites/singareni-s4/zones');
      if (res.status !== 200 || !Array.isArray(res.body.zones) || !res.body.zones[0].polygon) {
        throw new Error('Invalid GIS risk zones response');
      }
    });

    // 6. Simulation Spike Event
    await assertTest('POST /api/simulation/trigger-spike updates telemetry state', async () => {
      const res = await makeRequest('POST', '/api/simulation/trigger-spike', { siteId: 'singareni-s4' });
      if (res.status !== 200 || res.body.telemetry.calculatedRiskLevel !== 'CRITICAL') {
        throw new Error('Simulation spike failed');
      }
    });

    // 7. Active Alerts Feed
    await assertTest('GET /api/sites/singareni-s4/alerts returns alerts list', async () => {
      const res = await makeRequest('GET', '/api/sites/singareni-s4/alerts');
      if (res.status !== 200 || !Array.isArray(res.body.alerts)) {
        throw new Error('Failed to fetch active alerts list');
      }
    });

  } finally {
    server.close();
  }

  console.log(`\n📊 Test Suite Complete: ${passed} Passed, ${failed} Failed.`);
  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});
