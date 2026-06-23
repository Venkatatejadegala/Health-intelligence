const fs = require('fs');
const path = require('path');
const request = require('supertest');

// Set env vars before loading app
process.env.NODE_ENV = 'test';
process.env.TEST_DB_NAME = 'api_test_local_db';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret_123456';
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/test';

// Backup and unset GEMINI_API_KEY to force fast rules-based local generation in tests
const originalGeminiKey = process.env.GEMINI_API_KEY;
delete process.env.GEMINI_API_KEY;

const app = require('../server');

// Ensure GEMINI_API_KEY is deleted after require since server.js calls dotenv.config() on load
delete process.env.GEMINI_API_KEY;

const TEST_DB_PATH = path.join(__dirname, '../api_test_local_db.json');

const cleanDbState = {
  users: [],
  profiles: [],
  dailyLogs: [],
  workoutPlans: [],
  progress: [],
  sessions: [],
  coachingInsights: []
};

beforeAll(() => {
  // Initialize/reset test DB
  fs.writeFileSync(TEST_DB_PATH, JSON.stringify(cleanDbState, null, 2));
});

afterAll(() => {
  // Restore original key
  if (originalGeminiKey) {
    process.env.GEMINI_API_KEY = originalGeminiKey;
  }
  // Clean up DB file
  if (fs.existsSync(TEST_DB_PATH)) {
    try {
      fs.unlinkSync(TEST_DB_PATH);
    } catch (err) {
      console.warn('Teardown: Could not delete test DB file due to file lock:', err.message);
    }
  }
});

describe('Backend API Integration Tests', () => {
  let authToken = '';
  let userId = '';

  const testUser = {
    username: 'testathlete',
    email: 'athlete@test.com',
    password: 'Password123!',
    age: 25,
    gender: 'male',
    height: 180,
    weight: 75,
    activityLevel: 'active',
    goal: 'recomposition'
  };

  describe('Authentication Endpoints', () => {
    test('POST /api/auth/signup - Should successfully register a user', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send(testUser);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.username).toBe(testUser.username);
      expect(res.body.data.user.email).toBe(testUser.email);
      expect(res.body.data.user).not.toHaveProperty('password');
      
      userId = res.body.data.user._id;
    });

    test('POST /api/auth/signup - Should fail if username or email already exists', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send(testUser);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('USER_EXISTS');
    });

    test('POST /api/auth/login - Should successfully log in and return a JWT', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe(testUser.email);

      authToken = res.body.data.token;
    });

    test('POST /api/auth/login - Should fail with invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('Profile Endpoints', () => {
    test('POST /api/profile - Should create a user profile', async () => {
      const profileData = {
        name: 'Test Athlete Updated Name',
        age: 26,
        sex: 'male',
        height: 181,
        weight: 76,
        activityLevel: 'very_active',
        goal: 'muscle_gain'
      };

      const res = await request(app)
        .post('/api/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(profileData);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.userProfile.name).toBe(profileData.name);
      expect(res.body.data.userProfile.age).toBe(profileData.age);
      expect(res.body.data.userProfile.weight).toBe(profileData.weight);
      expect(res.body.data.userProfile.bmr).toBeDefined();
      expect(res.body.data.userProfile.tdee).toBeDefined();
    });

    test('GET /api/profile - Should retrieve the user profile', async () => {
      const res = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.userProfile.name).toBe('Test Athlete Updated Name');
      expect(res.body.data.userProfile.age).toBe(26);
    });
  });

  describe('Logs Endpoints', () => {
    const todayDateStr = new Date().toISOString();

    test('PUT /api/logs/today - Should create/update daily log', async () => {
      const logData = {
        date: todayDateStr,
        waterIntakeMl: 2500,
        sleepHours: 8,
        mood: 'energetic',
        weight: 75.8
      };

      const res = await request(app)
        .put('/api/logs/today')
        .set('Authorization', `Bearer ${authToken}`)
        .send(logData);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.waterIntakeMl).toBe(logData.waterIntakeMl);
      expect(res.body.data.sleepHours).toBe(logData.sleepHours);
      expect(res.body.data.mood).toBe(logData.mood);
    });

    test('GET /api/logs/today - Should retrieve the daily log for today', async () => {
      const res = await request(app)
        .get(`/api/logs/today?date=${todayDateStr}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.waterIntakeMl).toBe(2500);
      expect(res.body.data.sleepHours).toBe(8);
      expect(res.body.data.mood).toBe('energetic');
    });
  });

  describe('Workout Endpoints', () => {
    test('POST /api/workouts/generate-plan - Should generate a workout plan', async () => {
      const planRequest = {
        workoutDays: [1, 3, 5],
        experienceLevel: 'intermediate',
        goal: 'hypertrophy',
        split: 'full_body'
      };

      const res = await request(app)
        .post('/api/workouts/generate-plan')
        .set('Authorization', `Bearer ${authToken}`)
        .send(planRequest);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.weeklySchedule).toBeDefined();
      expect(res.body.data.weeklySchedule.length).toBe(3);
      expect(res.body.data.progressionRules).toBeDefined();
    });

    test('GET /api/workouts/current - Should retrieve current workout plan', async () => {
      const res = await request(app)
        .get('/api/workouts/current')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.name).toContain('hypertrophy');
    });
  });
});
