const http = require('http');
const https = require('https');

const apiBase = process.env.LUCY_API_BASE || 'http://localhost:8080/LucyBackendAPI';
const paymentApiBase = process.env.LUCY_PAYMENT_API_BASE || '';
const agoraTokenBase = process.env.AGORA_TOKEN_BASE || 'http://localhost:3000';

function makeRequest(method, urlStr, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    try {
      const parsedUrl = new URL(urlStr);
      const isHttps = parsedUrl.protocol === 'https:';
      const client = isHttps ? https : http;

      const options = {
        method: method,
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (isHttps ? 443 : 80),
        path: parsedUrl.pathname + parsedUrl.search,
        headers: {
          'User-Agent': 'Lucy-MultiRole-SmokeClient',
          ...headers
        },
        timeout: 3000
      };

      let bodyStr = null;
      if (body) {
        bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
        options.headers['Content-Type'] = 'application/json';
        options.headers['Content-Length'] = Buffer.byteLength(bodyStr);
      }

      const req = client.request(options, (res) => {
        let responseData = '';
        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: responseData
          });
        });
      });

      req.on('error', (err) => {
        reject(err);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request Timeout'));
      });

      if (bodyStr) {
        req.write(bodyStr);
      }
      req.end();
    } catch (err) {
      reject(err);
    }
  });
}

// Check if a network connection error implies service offline/unreachable
function isUnreachableError(err) {
  const code = err.code || '';
  return code === 'ECONNREFUSED' || code === 'ENOTFOUND' || code === 'ETIMEDOUT' || err.message === 'Request Timeout';
}

const matrix = [];

function recordResult(role, endpoint, status, reason = '') {
  matrix.push({ role, endpoint, status, reason });
}

async function runLearnerScenarios() {
  const roleName = 'Learner';
  
  // 1. GET /api/contents (equivalent to lessons API for Java backend)
  try {
    const res = await makeRequest('GET', `${apiBase}/api/contents?lang=GB`, { 'X-LUCY-ROLE': 'student' });
    if (res.statusCode >= 200 && res.statusCode < 300) {
      try {
        JSON.parse(res.body);
        recordResult(roleName, 'GET /api/contents', 'PASS');
      } catch (e) {
        recordResult(roleName, 'GET /api/contents', 'FAIL', 'Invalid JSON response');
      }
    } else {
      recordResult(roleName, 'GET /api/contents', 'FAIL', `Server returned status ${res.statusCode}`);
    }
  } catch (err) {
    if (isUnreachableError(err)) {
      recordResult(roleName, 'GET /api/contents', 'SKIP', 'Java API server offline');
    } else {
      recordResult(roleName, 'GET /api/contents', 'FAIL', err.message);
    }
  }

  // 2. GET /api/progress?userId=1
  try {
    const res = await makeRequest('GET', `${apiBase}/api/progress?userId=1`, { 'X-LUCY-ROLE': 'student' });
    if (res.statusCode >= 200 && res.statusCode < 300) {
      try {
        JSON.parse(res.body);
        recordResult(roleName, 'GET /api/progress', 'PASS');
      } catch (e) {
        recordResult(roleName, 'GET /api/progress', 'FAIL', 'Invalid JSON response');
      }
    } else {
      recordResult(roleName, 'GET /api/progress', 'FAIL', `Server returned status ${res.statusCode}`);
    }
  } catch (err) {
    if (isUnreachableError(err)) {
      recordResult(roleName, 'GET /api/progress', 'SKIP', 'Java API server offline');
    } else {
      recordResult(roleName, 'GET /api/progress', 'FAIL', err.message);
    }
  }

  // 3. GET /api/wallet/balance?userId=1
  try {
    const res = await makeRequest('GET', `${apiBase}/api/wallet/balance?userId=1`, { 'X-LUCY-ROLE': 'student' });
    if (res.statusCode >= 200 && res.statusCode < 300) {
      try {
        JSON.parse(res.body);
        recordResult(roleName, 'GET /api/wallet/balance', 'PASS');
      } catch (e) {
        recordResult(roleName, 'GET /api/wallet/balance', 'FAIL', 'Invalid JSON response');
      }
    } else {
      recordResult(roleName, 'GET /api/wallet/balance', 'FAIL', `Server returned status ${res.statusCode}`);
    }
  } catch (err) {
    if (isUnreachableError(err)) {
      recordResult(roleName, 'GET /api/wallet/balance', 'SKIP', 'Java API server offline');
    } else {
      recordResult(roleName, 'GET /api/wallet/balance', 'FAIL', err.message);
    }
  }
}

async function runMentorTeacherScenarios() {
  const roleName = 'MentorTeacher';

  // 1. GET /api/teacher/classrooms
  try {
    const res = await makeRequest('GET', `${apiBase}/api/teacher/classrooms`, { 'X-LUCY-ROLE': 'teacher' });
    if (res.statusCode >= 200 && res.statusCode < 300) {
      try {
        JSON.parse(res.body);
        recordResult(roleName, 'GET /api/teacher/classrooms', 'PASS');
      } catch (e) {
        recordResult(roleName, 'GET /api/teacher/classrooms', 'FAIL', 'Invalid JSON response');
      }
    } else {
      recordResult(roleName, 'GET /api/teacher/classrooms', 'FAIL', `Server returned status ${res.statusCode}`);
    }
  } catch (err) {
    if (isUnreachableError(err)) {
      recordResult(roleName, 'GET /api/teacher/classrooms', 'SKIP', 'Java API server offline');
    } else {
      recordResult(roleName, 'GET /api/teacher/classrooms', 'FAIL', err.message);
    }
  }

  // 2. GET /api/teacher/materials
  try {
    const res = await makeRequest('GET', `${apiBase}/api/teacher/materials`, { 'X-LUCY-ROLE': 'teacher' });
    if (res.statusCode >= 200 && res.statusCode < 300) {
      try {
        JSON.parse(res.body);
        recordResult(roleName, 'GET /api/teacher/materials', 'PASS');
      } catch (e) {
        recordResult(roleName, 'GET /api/teacher/materials', 'FAIL', 'Invalid JSON response');
      }
    } else {
      recordResult(roleName, 'GET /api/teacher/materials', 'FAIL', `Server returned status ${res.statusCode}`);
    }
  } catch (err) {
    if (isUnreachableError(err)) {
      recordResult(roleName, 'GET /api/teacher/materials', 'SKIP', 'Java API server offline');
    } else {
      recordResult(roleName, 'GET /api/teacher/materials', 'FAIL', err.message);
    }
  }

  // 3. GET /api/podcasts/recordings
  try {
    const res = await makeRequest('GET', `${apiBase}/api/podcasts/recordings`, { 'X-LUCY-ROLE': 'teacher' });
    if (res.statusCode >= 200 && res.statusCode < 300) {
      try {
        JSON.parse(res.body);
        recordResult(roleName, 'GET /api/podcasts/recordings', 'PASS');
      } catch (e) {
        recordResult(roleName, 'GET /api/podcasts/recordings', 'FAIL', 'Invalid JSON response');
      }
    } else {
      recordResult(roleName, 'GET /api/podcasts/recordings', 'FAIL', `Server returned status ${res.statusCode}`);
    }
  } catch (err) {
    if (isUnreachableError(err)) {
      recordResult(roleName, 'GET /api/podcasts/recordings', 'SKIP', 'Java API server offline');
    } else {
      recordResult(roleName, 'GET /api/podcasts/recordings', 'FAIL', err.message);
    }
  }
}

async function runAdminSystemScenarios() {
  const roleName = 'AdminSystem';

  // 1. GET /api/import/history
  try {
    const res = await makeRequest('GET', `${apiBase}/api/import/history`, { 'X-LUCY-ROLE': 'admin' });
    if (res.statusCode >= 200 && res.statusCode < 300) {
      try {
        JSON.parse(res.body);
        recordResult(roleName, 'GET /api/import/history', 'PASS');
      } catch (e) {
        recordResult(roleName, 'GET /api/import/history', 'FAIL', 'Invalid JSON response');
      }
    } else {
      recordResult(roleName, 'GET /api/import/history', 'FAIL', `Server returned status ${res.statusCode}`);
    }
  } catch (err) {
    if (isUnreachableError(err)) {
      recordResult(roleName, 'GET /api/import/history', 'SKIP', 'Java API server offline');
    } else {
      recordResult(roleName, 'GET /api/import/history', 'FAIL', err.message);
    }
  }

  // 2. GET /api/ai/generate-questions (Check GET-safety)
  recordResult(roleName, 'GET /api/ai/generate-questions', 'SKIP', 'AI generation endpoint requires POST request');
}

async function runPaymentServiceScenarios() {
  const roleName = 'PaymentService';

  if (!paymentApiBase) {
    recordResult(roleName, 'GET /health', 'SKIP', 'LUCY_PAYMENT_API_BASE environment variable is empty');
    recordResult(roleName, 'POST /api/identity/anonymous-token', 'SKIP', 'LUCY_PAYMENT_API_BASE environment variable is empty');
    recordResult(roleName, 'GET /api/payments/wallet/balance', 'SKIP', 'LUCY_PAYMENT_API_BASE environment variable is empty');
    return;
  }

  // 1. GET /health
  try {
    const res = await makeRequest('GET', `${paymentApiBase}/health`);
    if (res.statusCode >= 200 && res.statusCode < 300) {
      try {
        JSON.parse(res.body);
        recordResult(roleName, 'GET /health', 'PASS');
      } catch (e) {
        recordResult(roleName, 'GET /health', 'FAIL', 'Invalid JSON response');
      }
    } else {
      recordResult(roleName, 'GET /health', 'FAIL', `Server returned status ${res.statusCode}`);
    }
  } catch (err) {
    if (isUnreachableError(err)) {
      recordResult(roleName, 'GET /health', 'SKIP', '.NET Payment service offline');
    } else {
      recordResult(roleName, 'GET /health', 'FAIL', err.message);
    }
  }

  // 2. POST /api/identity/anonymous-token
  try {
    const res = await makeRequest('POST', `${paymentApiBase}/api/identity/anonymous-token`, {}, {
      roomId: 'room_smoke',
      role: 'student'
    });
    if (res.statusCode >= 200 && res.statusCode < 300) {
      try {
        JSON.parse(res.body);
        recordResult(roleName, 'POST /api/identity/anonymous-token', 'PASS');
      } catch (e) {
        recordResult(roleName, 'POST /api/identity/anonymous-token', 'FAIL', 'Invalid JSON response');
      }
    } else {
      recordResult(roleName, 'POST /api/identity/anonymous-token', 'FAIL', `Server returned status ${res.statusCode}`);
    }
  } catch (err) {
    if (isUnreachableError(err)) {
      recordResult(roleName, 'POST /api/identity/anonymous-token', 'SKIP', '.NET Payment service offline');
    } else {
      recordResult(roleName, 'POST /api/identity/anonymous-token', 'FAIL', err.message);
    }
  }

  // 3. GET /api/payments/wallet/balance?userId=1
  try {
    const res = await makeRequest('GET', `${paymentApiBase}/api/payments/wallet/balance?userId=1`);
    if (res.statusCode >= 200 && res.statusCode < 300) {
      try {
        JSON.parse(res.body);
        recordResult(roleName, 'GET /api/payments/wallet/balance', 'PASS');
      } catch (e) {
        recordResult(roleName, 'GET /api/payments/wallet/balance', 'FAIL', 'Invalid JSON response');
      }
    } else {
      recordResult(roleName, 'GET /api/payments/wallet/balance', 'FAIL', `Server returned status ${res.statusCode}`);
    }
  } catch (err) {
    if (isUnreachableError(err)) {
      recordResult(roleName, 'GET /api/payments/wallet/balance', 'SKIP', '.NET Payment service offline');
    } else {
      recordResult(roleName, 'GET /api/payments/wallet/balance', 'FAIL', err.message);
    }
  }
}

async function runAgoraTokenScenarios() {
  const roleName = 'AgoraToken';

  // 1. GET /api/agora/token?channelName=smoke&uid=1
  try {
    const res = await makeRequest('GET', `${agoraTokenBase}/api/agora/token?channelName=smoke&uid=1`);
    if (res.statusCode >= 200 && res.statusCode < 300) {
      try {
        JSON.parse(res.body);
        recordResult(roleName, 'GET /api/agora/token', 'PASS');
      } catch (e) {
        recordResult(roleName, 'GET /api/agora/token', 'FAIL', 'Invalid JSON response');
      }
    } else {
      recordResult(roleName, 'GET /api/agora/token', 'FAIL', `Server returned status ${res.statusCode}`);
    }
  } catch (err) {
    if (isUnreachableError(err)) {
      recordResult(roleName, 'GET /api/agora/token', 'SKIP', 'Agora Token server offline');
    } else {
      recordResult(roleName, 'GET /api/agora/token', 'FAIL', err.message);
    }
  }
}

async function main() {
  console.log('==================================================');
  console.log('LUCY CONCURRENT MULTI-ROLE SCENARIO CHECK');
  console.log('==================================================');
  console.log(`Java API Base:     ${apiBase}`);
  console.log(`Payment API Base:  ${paymentApiBase || '(Empty - Optional)'}`);
  console.log(`Agora Token Base:  ${agoraTokenBase}`);
  console.log('==================================================\n');

  // Run all role checking scenarios concurrently
  await Promise.allSettled([
    runLearnerScenarios(),
    runMentorTeacherScenarios(),
    runAdminSystemScenarios(),
    runPaymentServiceScenarios(),
    runAgoraTokenScenarios()
  ]);

  console.log('--------------------------------------------------');
  console.log('| ROLE           | ENDPOINT                       | STATUS | REASON/DETAILS');
  console.log('--------------------------------------------------');
  
  let failed = false;
  matrix.forEach(row => {
    const roleCol = row.role.padEnd(14);
    const epCol = row.endpoint.padEnd(30);
    const statusCol = row.status.padEnd(6);
    console.log(`| ${roleCol} | ${epCol} | ${statusCol} | ${row.reason}`);
    if (row.status === 'FAIL') {
      failed = true;
    }
  });
  console.log('--------------------------------------------------\n');

  if (failed) {
    console.log('STATUS: FAILED (One or more critical checks failed)');
    process.exit(1);
  } else {
    console.log('STATUS: SUCCESS (All running services passed, others skipped)');
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Fatal testing error:', err);
  process.exit(1);
});
