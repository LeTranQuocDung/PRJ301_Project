/**
 * Lucy Stress Check Tool
 * Pure Node.js script using built-in http module. No external dependencies.
 * Run using: node scripts/stress-check.js
 */

const http = require('http');
const { URL } = require('url');

const API_BASE = process.env.LUCY_API_BASE || 'http://localhost:8080/LucyBackendAPI';

const ENDPOINTS = [
  { path: '/api/engagement/podcasts', method: 'GET' },
  { path: '/api/engagement/gifts', method: 'GET' },
  { path: '/api/import/history', method: 'GET' },
  { path: '/api/wallet/balance?userId=1', method: 'GET' },
  { path: '/api/podcasts/recordings', method: 'GET' },
  {
    path: '/api/ai/generate-questions',
    method: 'POST',
    body: JSON.stringify({
      lang: 'English',
      level: 'Beginner',
      topic: 'Travel',
      count: 2
    })
  }
];

function sendRequest(endpoint) {
  return new Promise((resolve) => {
    const urlStr = `${API_BASE}${endpoint.path}`;
    let parsedUrl;
    try {
      parsedUrl = new URL(urlStr);
    } catch (e) {
      resolve({ success: false, status: 0, ms: 0, error: 'Invalid URL: ' + urlStr });
      return;
    }

    const start = Date.now();
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 80,
      path: parsedUrl.pathname + parsedUrl.search,
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
        'X-LUCY-ROLE': 'admin'
      }
    };

    if (endpoint.method === 'POST' && endpoint.body) {
      options.headers['Content-Length'] = Buffer.byteLength(endpoint.body);
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        const ms = Date.now() - start;
        const success = res.statusCode >= 200 && res.statusCode < 300;
        resolve({ success, status: res.statusCode, ms });
      });
    });

    req.on('error', (err) => {
      const ms = Date.now() - start;
      resolve({ success: false, status: 0, ms, error: err.message });
    });

    if (endpoint.method === 'POST' && endpoint.body) {
      req.write(endpoint.body);
    }
    req.end();
  });
}

async function runStressTest(concurrency = 5, totalRuns = 10) {
  console.log(`=========================================`);
  console.log(`LUCY PERFORMANCE & STRESS CHECK`);
  console.log(`Target Base URL: ${API_BASE}`);
  console.log(`Concurrency: ${concurrency} parallel workers`);
  console.log(`Total target cycles: ${totalRuns}`);
  console.log(`=========================================`);

  let totalRequests = 0;
  let successes = 0;
  let failures = 0;
  let totalMs = 0;
  let results = [];

  const startTest = Date.now();

  for (let i = 0; i < totalRuns; i++) {
    // Run key endpoints concurrently
    const promises = ENDPOINTS.map(ep => sendRequest(ep));
    const batchResults = await Promise.all(promises);
    
    batchResults.forEach(res => {
      totalRequests++;
      totalMs += res.ms;
      if (res.success) {
        successes++;
      } else {
        failures++;
      }
      results.push(res);
    });
  }

  const elapsedTotal = Date.now() - startTest;
  const avgMs = totalRequests > 0 ? (totalMs / totalRequests).toFixed(1) : 0;

  console.log(`\nResults Summary:`);
  console.log(`- Total Requests Sent: ${totalRequests}`);
  console.log(`- Success Rate: ${successes} (${((successes / totalRequests) * 100).toFixed(1)}%)`);
  console.log(`- Failure Rate: ${failures} (${((failures / totalRequests) * 100).toFixed(1)}%)`);
  console.log(`- Average Latency: ${avgMs} ms`);
  console.log(`- Total Execution Time: ${elapsedTotal} ms`);
  console.log(`=========================================`);
}

runStressTest(5, 5).catch(console.error);
