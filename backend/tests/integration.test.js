const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Intercept process.env before requiring the server
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'supersecret_integration_test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/dummy_db_placeholder';

// Import Mongoose models
const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const Notification = require('../models/Notification');
const AiUsage = require('../models/AiUsage');
const DailyLog = require('../models/DailyLog');

let mongoServer;
let app;

// Mock the email service
jest.mock('../services/email.service', () => {
  return {
    sendMail: jest.fn().mockImplementation(async (options) => {
      global.lastSentEmail = options;
      return { success: true, message: 'Email sent successfully', id: 'mock-id' };
    })
  };
});

beforeAll(async () => {
  // Spin up mongodb-memory-server
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  
  // Set the URI for mongoose and start connection
  process.env.MONGODB_URI = uri;
  
  // Ensure mongoose connects to the mock memory server database
  await mongoose.connect(uri);
  
  // Require the express application server
  app = require('../server');
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
  global.lastSentEmail = undefined;
});

describe('Health Hub Backend Integration Tests', () => {
  const userCreds = {
    username: 'testathlete',
    email: 'athlete@test.com',
    password: 'SecurePassword123!',
    age: 25,
    gender: 'male',
    height: 180,
    weight: 75
  };

  const adminCreds = {
    username: 'testadmin',
    email: 'admin@test.com',
    password: 'AdminPassword123!'
  };

  async function registerAndVerifyUser(creds) {
    const res = await request(app).post('/api/auth/signup').send(creds);
    const dbUser = await User.findOne({ email: creds.email });
    dbUser.isEmailVerified = true;
    dbUser.emailVerificationToken = null;
    await dbUser.save();
    return dbUser;
  }

  async function getLoginToken(email, password) {
    const res = await request(app).post('/api/auth/login').send({ email, password });
    return res.body.data.token;
  }

  describe('1. Authentication Recovery (Forgot & Reset Password)', () => {
    test('Forgot Password dispatches token and Reset Password updates credentials successfully', async () => {
      await registerAndVerifyUser(userCreds);

      // Forgot Password request
      const forgotRes = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: userCreds.email });
      expect(forgotRes.statusCode).toBe(200);
      expect(forgotRes.body.success).toBe(true);

      // Extrapolate reset token from email link
      expect(global.lastSentEmail).toBeDefined();
      const match = global.lastSentEmail.html.match(/reset-password\/([^"<\s]+)/);
      const token = match ? match[1] : null;
      expect(token).not.toBeNull();

      // Reset Password request
      const resetRes = await request(app)
        .post(`/api/auth/reset-password/${token}`)
        .send({ password: 'NewSecurePassword321!' });
      expect(resetRes.statusCode).toBe(200);
      expect(resetRes.body.success).toBe(true);

      // Verify that login works with the new password
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: userCreds.email, password: 'NewSecurePassword321!' });
      expect(loginRes.statusCode).toBe(200);
      expect(loginRes.body.data.token).toBeDefined();
    });
  });

  describe('2. Email Verification & Resend Verification', () => {
    test('User verification flow and resending tokens', async () => {
      // Signup (initially unverified)
      const res = await request(app).post('/api/auth/signup').send(userCreds);
      expect(res.statusCode).toBe(201);
      
      const dbUser = await User.findOne({ email: userCreds.email });
      expect(dbUser.isEmailVerified).toBe(false);
      const verificationToken = dbUser.emailVerificationToken;
      expect(verificationToken).toBeDefined();

      // Verify email via token
      const verifyRes = await request(app).get(`/api/auth/verify-email/${verificationToken}`);
      expect(verifyRes.statusCode).toBe(200);
      expect(verifyRes.body.success).toBe(true);

      const dbUserVerified = await User.findOne({ email: userCreds.email });
      expect(dbUserVerified.isEmailVerified).toBe(true);

      // Resend verification (login first)
      const token = await getLoginToken(userCreds.email, userCreds.password);
      
      // Let's reset verification flag to verify resend functionality works
      dbUserVerified.isEmailVerified = false;
      await dbUserVerified.save();

      const resendRes = await request(app)
        .post('/api/auth/resend-verification')
        .set('Authorization', `Bearer ${token}`);
      expect(resendRes.statusCode).toBe(200);
      expect(resendRes.body.success).toBe(true);
      expect(global.lastSentEmail).toBeDefined();
    });
  });

  describe('3. Change Password Flow', () => {
    test('Changes password successfully for authenticated user', async () => {
      await registerAndVerifyUser(userCreds);
      const token = await getLoginToken(userCreds.email, userCreds.password);

      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: userCreds.password,
          newPassword: 'ChangedSecurePassword555!'
        });
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify login works with the changed password
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: userCreds.email, password: 'ChangedSecurePassword555!' });
      expect(loginRes.statusCode).toBe(200);
    });
  });

  describe('4. Notification Center CRUD Operations', () => {
    test('Lifecycle of user notification messages', async () => {
      const user = await registerAndVerifyUser(userCreds);
      const token = await getLoginToken(userCreds.email, userCreds.password);

      // Create notifications directly in DB
      const n1 = await Notification.create({ userId: user._id, title: 'Alert 1', message: 'Message 1', read: false });
      const n2 = await Notification.create({ userId: user._id, title: 'Alert 2', message: 'Message 2', read: false });

      // GET list
      const listRes = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${token}`);
      expect(listRes.statusCode).toBe(200);
      expect(listRes.body.data.notifications.length).toBe(2);

      // PUT read single
      const readRes = await request(app)
        .put(`/api/notifications/${n1._id}/read`)
        .set('Authorization', `Bearer ${token}`);
      expect(readRes.statusCode).toBe(200);
      
      const dbN1 = await Notification.findById(n1._id);
      expect(dbN1.read).toBe(true);

      // PUT read all
      const readAllRes = await request(app)
        .put('/api/notifications/read-all')
        .set('Authorization', `Bearer ${token}`);
      expect(readAllRes.statusCode).toBe(200);
      
      const dbN2 = await Notification.findById(n2._id);
      expect(dbN2.read).toBe(true);

      // DELETE single
      const deleteRes = await request(app)
        .delete(`/api/notifications/${n1._id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(deleteRes.statusCode).toBe(200);

      const dbNotifications = await Notification.find({ userId: user._id });
      expect(dbNotifications.length).toBe(1);
    });
  });

  describe('5. Admin Dashboard Console', () => {
    test('Access controls, listings, and user suspension operations', async () => {
      const standardUser = await registerAndVerifyUser(userCreds);
      const adminUser = await registerAndVerifyUser({ ...adminCreds, age: 30 });
      
      // Upgrade role of adminUser
      const dbAdmin = await User.findOne({ email: adminCreds.email });
      dbAdmin.role = 'admin';
      await dbAdmin.save();

      const standardToken = await getLoginToken(userCreds.email, userCreds.password);
      const adminToken = await getLoginToken(adminCreds.email, adminCreds.password);

      // Verify standard user is blocked from admin routes (403)
      const unauthorizedRes = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${standardToken}`);
      expect(unauthorizedRes.statusCode).toBe(403);

      // Admin gets user list (200)
      const listRes = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(listRes.statusCode).toBe(200);
      expect(listRes.body.data.users).toBeDefined();

      // Admin suspends standard user account
      const suspendRes = await request(app)
        .post(`/api/admin/users/${standardUser._id}/suspend`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(suspendRes.statusCode).toBe(200);

      const updatedUser = await User.findById(standardUser._id);
      expect(updatedUser.isSuspended).toBe(true);

      // Suspended user is blocked from logging in
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: userCreds.email, password: userCreds.password });
      expect(loginRes.statusCode).toBe(403);
      expect(loginRes.body.error.code).toBe('ACCOUNT_SUSPENDED');
    });
  });

  describe('6. AI Quota Guard Middleware', () => {
    test('Throttles user requests strictly when daily token allocations are exceeded', async () => {
      const user = await registerAndVerifyUser(userCreds);
      const token = await getLoginToken(userCreds.email, userCreds.password);

      // Seed 49,999 tokens AI usage logs for user
      await AiUsage.create({ userId: user._id, endpoint: 'generate-workout-plan', tokens: 49999 });

      // Call route generate-plan with empty body -> expects validation error 400, not 429
      let res = await request(app)
        .post('/api/workouts/generate-plan')
        .set('Authorization', `Bearer ${token}`)
        .send({});
      expect(res.statusCode).toBe(400); // Validation failure, meaning it passed quota check

      // Clean logs and seed exactly 50,000 tokens
      await AiUsage.deleteMany({});
      await AiUsage.create({ userId: user._id, endpoint: 'generate-workout-plan', tokens: 50000 });

      res = await request(app)
        .post('/api/workouts/generate-plan')
        .set('Authorization', `Bearer ${token}`)
        .send({});
      expect(res.statusCode).toBe(400); // Passed quota check

      // Seed 50,001 tokens
      await AiUsage.deleteMany({});
      await AiUsage.create({ userId: user._id, endpoint: 'generate-workout-plan', tokens: 50001 });

      res = await request(app)
        .post('/api/workouts/generate-plan')
        .set('Authorization', `Bearer ${token}`)
        .send({});
      expect(res.statusCode).toBe(429); // Blocked
      expect(res.body.error).toContain('daily AI allowance');
    });
  });

  describe('7. Account Deletion Cascade Purge', () => {
    test('GDPR cascade purge removes all matching user documents cleanly', async () => {
      const user = await registerAndVerifyUser(userCreds);
      const token = await getLoginToken(userCreds.email, userCreds.password);

      // Seed/update downstream documents (UserProfile is created on signup)
      await UserProfile.findOneAndUpdate({ userId: user._id }, { name: 'Athlete' });
      await Notification.create({ userId: user._id, title: 'Alert', message: 'Msg' });
      await AiUsage.create({ userId: user._id, endpoint: 'generate-plan', tokens: 100 });
      await DailyLog.create({ userId: user._id, date: new Date(), caloriesConsumed: 200 });

      // Run profile DELETE account
      const deleteRes = await request(app)
        .delete('/api/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ password: userCreds.password });
      expect(deleteRes.statusCode).toBe(200);

      // Assert database collections are fully purged of user data
      const dbUser = await User.findById(user._id);
      expect(dbUser).toBeNull();

      const dbProfile = await UserProfile.findOne({ userId: user._id });
      expect(dbProfile).toBeNull();

      const dbNotifications = await Notification.find({ userId: user._id });
      expect(dbNotifications.length).toBe(0);

      const dbUsage = await AiUsage.find({ userId: user._id });
      expect(dbUsage.length).toBe(0);

      const dbLogs = await DailyLog.find({ userId: user._id });
      expect(dbLogs.length).toBe(0);
    });
  });

});
