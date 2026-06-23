const fs = require('fs');
const path = require('path');
const request = require('supertest');

process.env.NODE_ENV = 'test';
process.env.TEST_DB_NAME = 'failures_test_local_db';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret_123456';
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/test';

// Disable Gemini calls
const originalGeminiKey = process.env.GEMINI_API_KEY;
delete process.env.GEMINI_API_KEY;

const app = require('../server');

// Ensure GEMINI_API_KEY is deleted after require since server.js calls dotenv.config() on load
delete process.env.GEMINI_API_KEY;

const TEST_DB_PATH = path.join(__dirname, '../failures_test_local_db.json');

const cleanDbState = {
  users: [
    {
      _id: '665000000000000000000005',
      username: 'existinguser',
      email: 'existing@user.com',
      password: 'hashedpassword_here'
    }
  ],
  profiles: [],
  dailyLogs: [],
  workoutPlans: [],
  progress: [],
  sessions: [],
  coachingInsights: []
};

beforeAll(() => {
  fs.writeFileSync(TEST_DB_PATH, JSON.stringify(cleanDbState, null, 2));
});

afterAll(() => {
  if (originalGeminiKey) {
    process.env.GEMINI_API_KEY = originalGeminiKey;
  }
  if (fs.existsSync(TEST_DB_PATH)) {
    try {
      fs.unlinkSync(TEST_DB_PATH);
    } catch (err) {
      console.warn('Teardown: Could not delete test DB file due to file lock:', err.message);
    }
  }
});

describe('Backend Failures & Edge Cases Integration Tests', () => {
  let validToken = '';

  beforeAll(async () => {
    // Generate a valid mock JWT token
    const jwt = require('jsonwebtoken');
    validToken = jwt.sign({ id: '665000000000000000000005' }, process.env.JWT_SECRET, { expiresIn: '1h' });
  });

  describe('Auth Route Validation & Failure Edge Cases', () => {
    // Test 1
    test('POST /api/auth/signup - Should fail if email is missing', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({ username: 'user1', password: 'Password123' });
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    // Test 2
    test('POST /api/auth/signup - Should fail if username is missing', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({ email: 'user1@test.com', password: 'Password123' });
      expect(res.statusCode).toBe(400);
    });

    // Test 3
    test('POST /api/auth/signup - Should fail if password is missing', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({ username: 'user1', email: 'user1@test.com' });
      expect(res.statusCode).toBe(400);
    });

    // Test 4
    test('POST /api/auth/login - Should fail if password is empty', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'existing@user.com', password: '' });
      expect(res.statusCode).toBe(400);
    });

    // Test 5
    test('POST /api/auth/login - Should fail if email is missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ password: 'Password123' });
      expect(res.statusCode).toBe(400);
    });

    // Test 6
    test('POST /api/auth/firebase - Should fail if idToken is missing', async () => {
      const res = await request(app)
        .post('/api/auth/firebase')
        .send({});
      expect(res.statusCode).toBe(400);
      expect(res.body.error.code).toBe('ID_TOKEN_REQUIRED');
    });
  });

  describe('Profile Route Failures & Schema Validation', () => {
    // Test 7
    test('GET /api/profile - Should fail (401) if authorization header is missing', async () => {
      const res = await request(app).get('/api/profile');
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    // Test 8
    test('GET /api/profile - Should fail (401) if token is malformed', async () => {
      const res = await request(app)
        .get('/api/profile')
        .set('Authorization', 'Bearer invalid-token-string');
      expect(res.statusCode).toBe(401);
    });

    // Test 9
    test('POST /api/profile - Should fail if name is missing', async () => {
      const res = await request(app)
        .post('/api/profile')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ age: 30, height: 180, weight: 80, activityLevel: 'active', goal: 'maintain' });
      expect(res.statusCode).toBe(400);
    });

    // Test 10
    test('POST /api/profile - Should fail if age is not a number', async () => {
      const res = await request(app)
        .post('/api/profile')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ name: 'User', age: 'thirty', height: 180, weight: 80, activityLevel: 'active', goal: 'maintain' });
      expect(res.statusCode).toBe(400);
    });

    // Test 11
    test('POST /api/profile - Should fail if height is missing', async () => {
      const res = await request(app)
        .post('/api/profile')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ name: 'User', age: 30, weight: 80, activityLevel: 'active', goal: 'maintain' });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('Daily Log Route Failures', () => {
    // Test 12
    test('GET /api/logs - Should fail if unauthorized', async () => {
      const res = await request(app).get('/api/logs');
      expect(res.statusCode).toBe(401);
    });

    // Test 13
    test('GET /api/logs/today - Should fail if unauthorized', async () => {
      const res = await request(app).get('/api/logs/today');
      expect(res.statusCode).toBe(401);
    });

    // Test 14
    test('PUT /api/logs/today - Should fail if date is missing', async () => {
      const res = await request(app)
        .put('/api/logs/today')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ waterIntakeMl: 2000 });
      expect(res.statusCode).toBe(400);
    });

    // Test 15
    test('POST /api/logs/meal - Should fail if date is missing', async () => {
      const res = await request(app)
        .post('/api/logs/meal')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ name: 'Breakfast', calories: 400, protein: 20 });
      expect(res.statusCode).toBe(400);
    });

    // Test 16
    test('POST /api/logs/meal - Should fail if calories is not a number', async () => {
      const res = await request(app)
        .post('/api/logs/meal')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ date: '2026-06-20', name: 'Breakfast', calories: 'four hundred', protein: 20 });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('Workout Route Failures', () => {
    // Test 17
    test('POST /api/workouts/generate-plan - Should fail if unauthorized', async () => {
      const res = await request(app).post('/api/workouts/generate-plan');
      expect(res.statusCode).toBe(401);
    });

    // Test 18
    test('POST /api/workouts/generate-plan - Should fail if workoutDays is not an array', async () => {
      const res = await request(app)
        .post('/api/workouts/generate-plan')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ workoutDays: 'Monday', experienceLevel: 'beginner', goal: 'strength' });
      expect(res.statusCode).toBe(400);
    });

    // Test 19
    test('POST /api/workouts/generate-plan - Should fail if goal is missing', async () => {
      const res = await request(app)
        .post('/api/workouts/generate-plan')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ workoutDays: ['Monday'], experienceLevel: 'beginner' });
      expect(res.statusCode).toBe(400);
    });

    // Test 20
    test('POST /api/workouts/enrich-exercise - Should fail if unauthorized', async () => {
      const res = await request(app).post('/api/workouts/enrich-exercise');
      expect(res.statusCode).toBe(401);
    });

    // Test 21
    test('POST /api/workouts/enrich-exercise - Should fail if name is missing', async () => {
      const res = await request(app)
        .post('/api/workouts/enrich-exercise')
        .set('Authorization', `Bearer ${validToken}`)
        .send({});
      expect(res.statusCode).toBe(400);
    });
  });

  describe('Analytics & Intelligence Route Protection', () => {
    // Test 22
    test('GET /api/analytics/consistency - Should fail if unauthorized', async () => {
      const res = await request(app).get('/api/analytics/consistency');
      expect(res.statusCode).toBe(401);
    });
  });
});
