const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');

// Set environment variables before requiring the app
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'coverage_jwt_secret_key';

// Mock the email service
jest.mock('../services/email.service', () => {
  return {
    sendMail: jest.fn().mockResolvedValue({ success: true })
  };
});

// Mock firebase admin
jest.mock('../config/firebase-admin', () => {
  return {
    auth: () => ({
      verifyIdToken: jest.fn().mockImplementation(async (token) => {
        if (token === 'valid-token') {
          return { uid: 'firebase-uid', email: 'firebase@user.com', name: 'Firebase User' };
        }
        if (token === 'auth-error-token') {
          const err = new Error('Firebase token expired');
          err.code = 'auth/id-token-expired';
          throw err;
        }
        throw new Error('Some other Firebase error');
      })
    })
  };
});

const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const Notification = require('../models/Notification');
const AiUsage = require('../models/AiUsage');

let mongoServer;
let app;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  process.env.MONGODB_URI = uri;
  await mongoose.connect(uri);
  app = require('../server');
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  // Clean all collections
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

describe('Stabilization and High Coverage Test Suite', () => {
  const userCreds = {
    username: 'coverageuser',
    email: 'coverage@test.com',
    password: 'Password123!',
    name: 'Coverage User',
    age: 25,
    height: 175,
    weight: 70,
    activityLevel: 'moderately_active',
    goal: 'recomposition'
  };

  async function registerAndVerify() {
    await request(app).post('/api/auth/signup').send(userCreds);
    const user = await User.findOne({ email: userCreds.email });
    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    await user.save();
    return user;
  }

  async function getAuthToken() {
    const res = await request(app).post('/api/auth/login').send({
      email: userCreds.email,
      password: userCreds.password
    });
    return res.body.data.token;
  }

  describe('1. Auth Routes Edge Cases', () => {
    test('POST /api/auth/demo-fallback - Allowed in non-prod, fails in prod env', async () => {
      const devRes = await request(app).post('/api/auth/demo-fallback');
      expect(devRes.statusCode).toBe(200);

      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      const prodRes = await request(app).post('/api/auth/demo-fallback');
      expect(prodRes.statusCode).toBe(404);
      process.env.NODE_ENV = originalNodeEnv;
    });

    test('POST /api/auth/firebase - Successful signup/signin via Firebase', async () => {
      const res = await request(app).post('/api/auth/firebase').send({ idToken: 'valid-token' });
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
    });

    test('POST /api/auth/firebase - Handles Firebase auth errors cleanly', async () => {
      const res = await request(app).post('/api/auth/firebase').send({ idToken: 'auth-error-token' });
      expect(res.statusCode).toBe(401);
      expect(res.body.error.code).toBe('INVALID_FIREBASE_TOKEN');
    });

    test('POST /api/auth/firebase - Handles other Firebase internal errors cleanly', async () => {
      const res = await request(app).post('/api/auth/firebase').send({ idToken: 'other-error-token' });
      expect(res.statusCode).toBe(500);
    });

    test('GET /api/auth/verify-email/:token - Fails for invalid token', async () => {
      const res = await request(app).get('/api/auth/verify-email/nonexistent_token');
      expect(res.statusCode).toBe(400);
      expect(res.body.error.code).toBe('INVALID_VERIFICATION_TOKEN');
    });
  });

  describe('2. UserProfile Routes Gaps', () => {
    test('POST /api/profile - Creates a profile if none exists', async () => {
      const user = await registerAndVerify();
      const token = await getAuthToken();

      await UserProfile.findOneAndDelete({ userId: user._id });

      const res = await request(app)
        .post('/api/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'New Profile',
          age: 30,
          height: 180,
          weight: 80,
          activityLevel: 'very_active',
          goal: 'maintain'
        });
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.userProfile.name).toBe('New Profile');
    });

    test('GET /api/profile - Returns 404 if profile not found', async () => {
      const user = await registerAndVerify();
      const token = await getAuthToken();

      await UserProfile.findOneAndDelete({ userId: user._id });

      const res = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(404);
      expect(res.body.error.code).toBe('PROFILE_NOT_FOUND');
    });

    test('DELETE /api/profile - GDPR delete fails with incorrect password', async () => {
      await registerAndVerify();
      const token = await getAuthToken();

      const res = await request(app)
        .delete('/api/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ password: 'wrongpassword' });
      expect(res.statusCode).toBe(400);
      expect(res.body.error.code).toBe('INCORRECT_PASSWORD');
    });
  });

  describe('3. Admin Dashboard Suspension Gaps', () => {
    test('POST /api/admin/users/:id/suspend - Admin cannot suspend self', async () => {
      const user = await registerAndVerify();
      user.role = 'admin';
      await user.save();

      const token = await getAuthToken();

      const res = await request(app)
        .post(`/api/admin/users/${user._id}/suspend`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(400);
      expect(res.body.error.code).toBe('SELF_SUSPENSION_BLOCKED');
    });

    test('POST /api/admin/users/:id/suspend - Fails if user not found', async () => {
      const user = await registerAndVerify();
      user.role = 'admin';
      await user.save();

      const token = await getAuthToken();
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .post(`/api/admin/users/${fakeId}/suspend`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(404);
      expect(res.body.error.code).toBe('USER_NOT_FOUND');
    });
  });

  describe('4. Notification Gaps', () => {
    test('PUT /api/notifications/:id/read - Fails if notification not found or access denied', async () => {
      await registerAndVerify();
      const token = await getAuthToken();
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .put(`/api/notifications/${fakeId}/read`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(404);
      expect(res.body.error.code).toBe('NOTIFICATION_NOT_FOUND');
    });

    test('DELETE /api/notifications/:id - Fails if notification not found', async () => {
      await registerAndVerify();
      const token = await getAuthToken();
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .delete(`/api/notifications/${fakeId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(404);
      expect(res.body.error.code).toBe('NOTIFICATION_NOT_FOUND');
    });
  });

  describe('5. Database Offline Fallback Operations', () => {
    beforeEach(() => {
      Object.defineProperty(mongoose.connection, 'readyState', {
        get: () => 0,
        configurable: true
      });
    });

    afterEach(() => {
      delete mongoose.connection.readyState;
    });

    test('GET /health - Reports fallback state', async () => {
      const res = await request(app).get('/health');
      expect(res.statusCode).toBe(200);
      expect(res.body.database).toBe('fallback-no-database');
    });

    test('POST /api/auth/signup - Falls back to localDb signup', async () => {
      const res = await request(app).post('/api/auth/signup').send({
        username: 'fallbackuser',
        email: 'fallback@test.com',
        password: 'Password123!'
      });
      expect(res.statusCode).toBe(201);
      expect(res.body.data.message).toContain('Demo Fallback');
    });

    test('POST /api/auth/login - Falls back to localDb login', async () => {
      await request(app).post('/api/auth/signup').send({
        username: 'fallbackuser',
        email: 'fallback@test.com',
        password: 'Password123!'
      });

      const res = await request(app).post('/api/auth/login').send({
        email: 'fallback@test.com',
        password: 'Password123!'
      });
      expect(res.statusCode).toBe(200);
      expect(res.body.data.token).toBeDefined();
    });

    test('GET /api/profile and POST /api/profile - Fall back to localDb profile', async () => {
      const localDb = require('../services/localDb.service');
      const fallbackUser = await localDb.findUserByEmail('fallback@test.com');
      const token = jwt.sign({ id: fallbackUser._id }, process.env.JWT_SECRET);

      const postRes = await request(app)
        .post('/api/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Fallback Athlete',
          age: 22,
          height: 170,
          weight: 65,
          activityLevel: 'sedentary',
          goal: 'lose_fat'
        });
      expect(postRes.statusCode).toBe(200);

      const getRes = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${token}`);
      expect(getRes.statusCode).toBe(200);
      expect(getRes.body.data.userProfile.name).toBe('Fallback Athlete');
    });

    test('DELETE /api/profile - GDPR delete under fallback', async () => {
      const localDb = require('../services/localDb.service');
      const fallbackUser = await localDb.findUserByEmail('fallback@test.com');
      const token = jwt.sign({ id: fallbackUser._id }, process.env.JWT_SECRET);

      const res = await request(app)
        .delete('/api/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ password: 'Password123!' });
      expect(res.statusCode).toBe(200);
      expect(res.body.data.message).toContain('purged');
    });

    test('GET /api/notifications & CRUD - Fall back to notifications mock responses', async () => {
      const token = jwt.sign({ id: 'fallback-user-id' }, process.env.JWT_SECRET);

      const getRes = await request(app).get('/api/notifications').set('Authorization', `Bearer ${token}`);
      expect(getRes.statusCode).toBe(200);
      expect(getRes.body.data.notifications.length).toBe(1);

      const readRes = await request(app).put('/api/notifications/mock-id/read').set('Authorization', `Bearer ${token}`);
      expect(readRes.statusCode).toBe(200);

      const readAllRes = await request(app).put('/api/notifications/read-all').set('Authorization', `Bearer ${token}`);
      expect(readAllRes.statusCode).toBe(200);

      const delRes = await request(app).delete('/api/notifications/mock-id').set('Authorization', `Bearer ${token}`);
      expect(delRes.statusCode).toBe(200);
    });

    test('GET /api/admin/users & /ai-usage & suspend - Fall back to admin mock responses', async () => {
      const localDb = require('../services/localDb.service');
      const adminUser = await localDb.createUser('fallbackadmin', 'fallbackadmin@test.com', 'AdminPassword123!');
      adminUser.role = 'admin';
      await localDb.updateUser(adminUser._id, { role: 'admin' });

      const token = jwt.sign({ id: adminUser._id }, process.env.JWT_SECRET);

      const usersRes = await request(app).get('/api/admin/users').set('Authorization', `Bearer ${token}`);
      expect(usersRes.statusCode).toBe(200);
      expect(usersRes.body.data.users.length).toBeGreaterThan(0);

      const aiRes = await request(app).get('/api/admin/ai-usage').set('Authorization', `Bearer ${token}`);
      expect(aiRes.statusCode).toBe(200);

      const normalUser = await localDb.createUser('normalfallback', 'normal@fallback.com', 'Pass123!');
      const suspendNormalRes = await request(app).post(`/api/admin/users/${normalUser._id}/suspend`).set('Authorization', `Bearer ${token}`);
      expect(suspendNormalRes.statusCode).toBe(200);
    });
  });
});
