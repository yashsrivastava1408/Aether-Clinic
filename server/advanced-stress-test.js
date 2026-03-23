import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 10 }, // Ramp-up: 10 users login
    { duration: '1m', target: 50 },  // Sustained load: 50 users chatting
    { duration: '30s', target: 0 },  // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% of requests < 1s
    http_req_failed: ['rate<0.05'],     // < 5% failures allowed
  },
};

const BASE_URL = 'http://localhost:5050';

export default function () {
  // 1. Simulation: Login / Register
  const userEmail = `tester-${__VU}@example.com`;
  const loginPayload = JSON.stringify({
    email: userEmail,
    name: `Stress Tester ${__VU}`,
    isGuest: false
  });

  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'k6-stress-tester', // Bypass rate limiter
  };

  const loginRes = http.post(`${BASE_URL}/api/auth/login`, loginPayload, { headers });
  
  check(loginRes, {
    'login status 200': (r) => r.status === 200,
    'has user id': (r) => r.json().user._id !== undefined,
  });

  const userId = loginRes.json().user._id;
  sleep(1);

  // 2. Simulation: Multiple Chat Messages
  const questions = [
    "I have shared symptoms of flu earlier, what should I eat?",
    "Is my condition serious?",
    "When should I visit a doctor?",
    "Can you summarize our session?"
  ];

  for (const question of questions) {
    const chatPayload = JSON.stringify({
      message: question,
      specialization: "General Medicine",
      userId: userId
    });

    const chatRes = http.post(`${BASE_URL}/api/chat`, chatPayload, { headers });

    check(chatRes, {
      'chat status 200': (r) => r.status === 200,
      'chat has reply': (r) => r.json().reply.length > 0,
    });

    sleep(Math.random() * 3 + 2); // 2-5s thinking time
  }
}
