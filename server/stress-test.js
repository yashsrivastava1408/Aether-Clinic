import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 }, // ramp-up to 20 users
    { duration: '1m', target: 50 },  // stay at 50 users
    { duration: '30s', target: 0 },  // ramp-down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.01'],    // less than 1% errors
  },
};

const BASE_URL = 'http://localhost:5050';

export default function () {
  const userId = `user-${__VU}-${__ITER}`; // Unique ID for each VU iteration
  const payload = JSON.stringify({
    message: "I have a headache and slight fever. What should I do?",
    specialization: "General Medicine",
    userId: userId
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'k6-stress-tester', // Triggers the bypass
    },
  };

  const res = http.post(`${BASE_URL}/api/chat`, payload, params);

  check(res, {
    'is status 200': (r) => r.status === 200,
    'response has reply': (r) => r.json().reply && r.json().reply.length > 0,
    'cache worked (fast response)': (r) => r.timings.duration < 200, // Slightly more relaxed for local loopback
  });

  sleep(Math.random() * 2 + 1); // Simulate real user thinking time (1-3s)
}
