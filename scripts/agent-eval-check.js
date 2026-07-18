const http = require('http');
const https = require('https');

const apiBase = process.env.LUCY_API_BASE || 'http://localhost:8080/LucyBackendAPI';

// 1. Define fixtures for local offline schema checks
const fixtures = {
  coach: {
    userId: 1,
    coachName: "LISA AI Coach",
    nextLesson: { level: 2, topic: "Introducing Yourself" },
    riskFlags: ["low_speaking_practice"],
    recommendedActions: ["Join LIVE Room English Beginner", "Practice Vocab Level 2"]
  },
  mentorFeedback: {
    userId: 1,
    lessonCode: "EN_1",
    feedback: "Excellent response! Consider using 'Good morning' in formal contexts.",
    corrections: "None",
    speakingTips: "Focus on the rising intonation at the end of questions.",
    confidenceScore: 88
  },
  adminInsights: {
    activeClassrooms: 5,
    contentHealth: "92%",
    weakAreas: ["Chinese Level 3 Tones"],
    riskAlerts: ["2 students inactive for > 7 days"],
    recommendedActions: ["Reprocess curriculum import data_importer_toolkit/LucyImporter", "Send push notifications to inactive learners"]
  }
};

// 2. Schema validators
function validateCoachSchema(data) {
  if (typeof data !== 'object' || data === null) return false;
  if (typeof data.userId !== 'number') return false;
  if (typeof data.coachName !== 'string') return false;
  if (typeof data.nextLesson !== 'object' || data.nextLesson === null) return false;
  if (typeof data.nextLesson.level !== 'number') return false;
  if (typeof data.nextLesson.topic !== 'string') return false;
  if (!Array.isArray(data.riskFlags)) return false;
  if (!Array.isArray(data.recommendedActions)) return false;
  return true;
}

function validateFeedbackSchema(data) {
  if (typeof data !== 'object' || data === null) return false;
  if (typeof data.userId !== 'number') return false;
  if (typeof data.lessonCode !== 'string') return false;
  if (typeof data.feedback !== 'string') return false;
  if (typeof data.corrections !== 'string') return false;
  if (typeof data.speakingTips !== 'string') return false;
  if (typeof data.confidenceScore !== 'number') return false;
  return true;
}

function validateAdminInsightsSchema(data) {
  if (typeof data !== 'object' || data === null) return false;
  if (typeof data.activeClassrooms !== 'number') return false;
  if (typeof data.contentHealth !== 'string') return false;
  if (!Array.isArray(data.weakAreas)) return false;
  if (!Array.isArray(data.riskAlerts)) return false;
  if (!Array.isArray(data.recommendedActions)) return false;
  return true;
}

// 3. Helper to make request
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
          'User-Agent': 'Lucy-Agent-EvalClient',
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

function isUnreachableError(err) {
  const code = err.code || '';
  return code === 'ECONNREFUSED' || code === 'ENOTFOUND' || code === 'ETIMEDOUT' || err.message === 'Request Timeout';
}

async function main() {
  console.log('==================================================');
  console.log('LUCY AI-AGENT LAYER SCHEMA & API INTEGRATION EVAL');
  console.log('==================================================');

  let passed = true;

  // Step 1: Validate local fixtures offline (always run)
  console.log('\n[1/2] Running Offline Local Fixture Schema Validations...');
  
  if (validateCoachSchema(fixtures.coach)) {
    console.log('>>> Local Coach Schema: PASS');
  } else {
    console.log('>>> Local Coach Schema: FAIL');
    passed = false;
  }

  if (validateFeedbackSchema(fixtures.mentorFeedback)) {
    console.log('>>> Local Mentor Feedback Schema: PASS');
  } else {
    console.log('>>> Local Mentor Feedback Schema: FAIL');
    passed = false;
  }

  if (validateAdminInsightsSchema(fixtures.adminInsights)) {
    console.log('>>> Local Admin Insights Schema: PASS');
  } else {
    console.log('>>> Local Admin Insights Schema: FAIL');
    passed = false;
  }

  // Step 2: Validate live backend endpoints if reachable
  console.log('\n[2/2] Running Live API Integration Checks (conditional)...');
  
  let isJavaReachable = true;
  try {
    // Ping contents API to see if Java server is running
    await makeRequest('GET', `${apiBase}/api/contents?lang=GB`);
  } catch (err) {
    if (isUnreachableError(err)) {
      isJavaReachable = false;
      console.log('>>> Java API server offline. Live integration checks: SKIP');
    }
  }

  if (isJavaReachable) {
    console.log(`Java server is ONLINE at ${apiBase}. Performing live validations...`);

    // check coach
    try {
      const res = await makeRequest('GET', `${apiBase}/api/agent/coach?userId=1`);
      if (res.statusCode === 200) {
        const json = JSON.parse(res.body);
        if (validateCoachSchema(json)) {
          console.log('>>> Live Coach Endpoint: PASS');
        } else {
          console.log('>>> Live Coach Endpoint: FAIL (Invalid response structure)');
          passed = false;
        }
      } else {
        console.log(`>>> Live Coach Endpoint: FAIL (HTTP Status ${res.statusCode})`);
        passed = false;
      }
    } catch (err) {
      console.log('>>> Live Coach Endpoint: FAIL (' + err.message + ')');
      passed = false;
    }

    // check mentor feedback
    try {
      const res = await makeRequest('POST', `${apiBase}/api/agent/mentor-feedback`, {}, {
        userId: 1,
        answerText: 'I want to speak fluent English',
        lessonCode: 'EN_1'
      });
      if (res.statusCode === 200) {
        const json = JSON.parse(res.body);
        if (validateFeedbackSchema(json)) {
          console.log('>>> Live Mentor Feedback Endpoint: PASS');
        } else {
          console.log('>>> Live Mentor Feedback Endpoint: FAIL (Invalid response structure)');
          passed = false;
        }
      } else {
        console.log(`>>> Live Mentor Feedback Endpoint: FAIL (HTTP Status ${res.statusCode})`);
        passed = false;
      }
    } catch (err) {
      console.log('>>> Live Mentor Feedback Endpoint: FAIL (' + err.message + ')');
      passed = false;
    }

    // check admin insights
    try {
      const res = await makeRequest('GET', `${apiBase}/api/agent/admin-insights`);
      if (res.statusCode === 200) {
        const json = JSON.parse(res.body);
        if (validateAdminInsightsSchema(json)) {
          console.log('>>> Live Admin Insights Endpoint: PASS');
        } else {
          console.log('>>> Live Admin Insights Endpoint: FAIL (Invalid response structure)');
          passed = false;
        }
      } else {
        console.log(`>>> Live Admin Insights Endpoint: FAIL (HTTP Status ${res.statusCode})`);
        passed = false;
      }
    } catch (err) {
      console.log('>>> Live Admin Insights Endpoint: FAIL (' + err.message + ')');
      passed = false;
    }
  }

  console.log('\n==================================================');
  if (passed) {
    console.log('AGENT EVALUATION STATUS: SUCCESS');
    console.log('==================================================');
    process.exit(0);
  } else {
    console.log('AGENT EVALUATION STATUS: FAILED');
    console.log('==================================================');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal evaluation error:', err);
  process.exit(1);
});
