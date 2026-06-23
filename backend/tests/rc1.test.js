const fs = require('fs');
const path = require('path');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

process.env.NODE_ENV = 'test';
process.env.TEST_DB_NAME = 'rc1_test_local_db';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret_123456';
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/test';

// Import Mongoose models to mock
const User = require('../models/User');
const Notification = require('../models/Notification');
const AiUsage = require('../models/AiUsage');
const UserProfile = require('../models/UserProfile');
// Mock email service at module load to intercept destructured imports
jest.mock('../services/email.service', () => {
  return {
    sendMail: jest.fn().mockImplementation(async (options) => {
      global.lastSentEmail = options;
      return {
        success: true,
        message: 'Email mocked successfully',
        id: `mock-email-id-${Date.now()}`
      };
    })
  };
});

const app = require('../server');
const TEST_DB_PATH = path.join(__dirname, '../rc1_test_local_db.json');

const cleanDbState = {
  users: [],
  profiles: [],
  dailyLogs: [],
  workoutPlans: [],
  progress: [],
  sessions: [],
  coachingInsights: [],
  notifications: [],
  aiUsage: []
};

// Mock User Document helper
function mockUserDoc(userData) {
  const bcrypt = require('bcryptjs');
  return {
    ...userData,
    id: userData._id,
    toObject: function() {
      const obj = { ...this };
      delete obj.toObject;
      delete obj.save;
      delete obj.validPassword;
      return obj;
    },
    validPassword: async function(plainPassword) {
      return await bcrypt.compare(plainPassword, userData.password);
    },
    save: async function() {
      const db = JSON.parse(fs.readFileSync(TEST_DB_PATH, 'utf8'));
      const index = db.users.findIndex(x => x._id === userData._id);
      if (index > -1) {
        if (this.password !== userData.password) {
          const salt = await bcrypt.genSalt(10);
          this.password = await bcrypt.hash(this.password, salt);
        }
        db.users[index] = { ...this };
        delete db.users[index].toObject;
        delete db.users[index].save;
        delete db.users[index].validPassword;
        fs.writeFileSync(TEST_DB_PATH, JSON.stringify(db, null, 2));
      }
      return this;
    }
  };
}

beforeAll(() => {
  // 1. Force readyState mock to return connected state (1)
  const originalConnection = mongoose.connection;
  const connectionProxy = new Proxy(originalConnection, {
    get(target, prop, receiver) {
      if (prop === 'readyState') return 1;
      return Reflect.get(target, prop, receiver);
    }
  });
  Object.defineProperty(mongoose, 'connection', {
    get: () => connectionProxy,
    configurable: true
  });


  // 2. Mock Mongoose Model queries to translate to file-based JSON storage
  jest.spyOn(User, 'findOne').mockImplementation(async (query) => {
    const db = JSON.parse(fs.readFileSync(TEST_DB_PATH, 'utf8'));
    if (query.email) {
      const u = db.users.find(x => x.email === query.email);
      return u ? mockUserDoc(u) : null;
    }
    if (query.resetPasswordToken) {
      const u = db.users.find(x => x.resetPasswordToken === query.resetPasswordToken && new Date(x.resetPasswordExpires) > new Date());
      return u ? mockUserDoc(u) : null;
    }
    if (query.emailVerificationToken) {
      const u = db.users.find(x => x.emailVerificationToken === query.emailVerificationToken);
      return u ? mockUserDoc(u) : null;
    }
    if (query.$or) {
      const emailVal = query.$or.find(o => o.email)?.email;
      const userVal = query.$or.find(o => o.username)?.username;
      const u = db.users.find(x => x.email === emailVal || x.username === userVal);
      return u ? mockUserDoc(u) : null;
    }
    return null;
  });

  jest.spyOn(User, 'findById').mockImplementation(async (id) => {
    const db = JSON.parse(fs.readFileSync(TEST_DB_PATH, 'utf8'));
    const u = db.users.find(x => x._id === id || x.id === id);
    return u ? mockUserDoc(u) : null;
  });

  jest.spyOn(User, 'countDocuments').mockImplementation(async (query) => {
    const db = JSON.parse(fs.readFileSync(TEST_DB_PATH, 'utf8'));
    return db.users.length;
  });

  jest.spyOn(User, 'find').mockImplementation((query) => {
    const exec = async () => {
      const db = JSON.parse(fs.readFileSync(TEST_DB_PATH, 'utf8'));
      return db.users.map(u => mockUserDoc(u));
    };
    return {
      select: () => ({
        sort: () => ({
          skip: () => ({
            limit: () => ({
              lean: () => exec()
            })
          })
        })
      })
    };
  });

  jest.spyOn(User, 'findByIdAndDelete').mockImplementation(async (id) => {
    const db = JSON.parse(fs.readFileSync(TEST_DB_PATH, 'utf8'));
    db.users = db.users.filter(x => x._id !== id);
    fs.writeFileSync(TEST_DB_PATH, JSON.stringify(db, null, 2));
    return { _id: id };
  });

  // Mock Notification
  jest.spyOn(Notification, 'countDocuments').mockImplementation(async (query) => {
    const db = JSON.parse(fs.readFileSync(TEST_DB_PATH, 'utf8'));
    return db.notifications.filter(n => n.userId === query.userId).length;
  });

  jest.spyOn(Notification, 'find').mockImplementation((query) => {
    const exec = async () => {
      const db = JSON.parse(fs.readFileSync(TEST_DB_PATH, 'utf8'));
      return db.notifications.filter(n => n.userId.toString() === query.userId.toString());
    };
    return {
      sort: () => ({
        skip: () => ({
          limit: () => ({
            lean: () => exec()
          })
        })
      })
    };
  });

  jest.spyOn(Notification, 'findOneAndUpdate').mockImplementation(async (query, update) => {
    const db = JSON.parse(fs.readFileSync(TEST_DB_PATH, 'utf8'));
    const n = db.notifications.find(x => x._id === query._id && x.userId.toString() === query.userId.toString());
    if (n) {
      if (update.read !== undefined) n.read = update.read;
      fs.writeFileSync(TEST_DB_PATH, JSON.stringify(db, null, 2));
      return n;
    }
    return null;
  });

  jest.spyOn(Notification, 'updateMany').mockImplementation(async (query, update) => {
    const db = JSON.parse(fs.readFileSync(TEST_DB_PATH, 'utf8'));
    db.notifications.forEach(n => {
      if (n.userId.toString() === query.userId.toString() && (query.read === undefined || n.read === query.read)) {
        if (update.read !== undefined) n.read = update.read;
      }
    });
    fs.writeFileSync(TEST_DB_PATH, JSON.stringify(db, null, 2));
    return { modifiedCount: db.notifications.length };
  });

  jest.spyOn(Notification, 'findOneAndDelete').mockImplementation(async (query) => {
    const db = JSON.parse(fs.readFileSync(TEST_DB_PATH, 'utf8'));
    const index = db.notifications.findIndex(x => x._id === query._id && x.userId.toString() === query.userId.toString());
    if (index > -1) {
      const n = db.notifications[index];
      db.notifications.splice(index, 1);
      fs.writeFileSync(TEST_DB_PATH, JSON.stringify(db, null, 2));
      return n;
    }
    return null;
  });

  // Mock AiUsage
  jest.spyOn(AiUsage, 'create').mockImplementation(async (data) => {
    const db = JSON.parse(fs.readFileSync(TEST_DB_PATH, 'utf8'));
    const usage = {
      _id: 'mock_usage_' + Date.now() + Math.random(),
      ...data,
      createdAt: new Date().toISOString()
    };
    db.aiUsage.push(usage);
    fs.writeFileSync(TEST_DB_PATH, JSON.stringify(db, null, 2));
    return usage;
  });

  jest.spyOn(AiUsage, 'find').mockImplementation((query) => {
    const exec = async () => {
      const db = JSON.parse(fs.readFileSync(TEST_DB_PATH, 'utf8'));
      const timeLimit = query.createdAt && query.createdAt.$gte;
      return db.aiUsage.filter(u => u.userId.toString() === query.userId.toString() && (!timeLimit || new Date(u.createdAt) >= new Date(timeLimit)));
    };
    return {
      select: () => exec()
    };
  });

  jest.spyOn(AiUsage, 'aggregate').mockImplementation(async (pipeline) => {
    const db = JSON.parse(fs.readFileSync(TEST_DB_PATH, 'utf8'));
    if (pipeline[0] && pipeline[0].$group && pipeline[0].$group._id === null) {
      const totalTokens = db.aiUsage.reduce((sum, u) => sum + (u.tokens || 0), 0);
      return [{ totalTokens, callCount: db.aiUsage.length }];
    }
    const groupField = pipeline[0].$group._id;
    if (groupField === '$endpoint') {
      const groups = {};
      db.aiUsage.forEach(u => {
        if (!groups[u.endpoint]) groups[u.endpoint] = { totalTokens: 0, count: 0 };
        groups[u.endpoint].totalTokens += u.tokens;
        groups[u.endpoint].count += 1;
      });
      return Object.keys(groups).map(k => ({
        _id: k,
        totalTokens: groups[k].totalTokens,
        count: groups[k].count
      }));
    }
    if (groupField === '$userId') {
      const groups = {};
      db.aiUsage.forEach(u => {
        if (!groups[u.userId]) groups[u.userId] = { totalTokens: 0, callCount: 0 };
        groups[u.userId].totalTokens += u.tokens;
        groups[u.userId].callCount += 1;
      });
      const users = Object.keys(groups).map(k => {
        const user = db.users.find(x => x._id === k);
        return {
          _id: k,
          totalTokens: groups[k].totalTokens,
          callCount: groups[k].callCount,
          username: user?.username || 'testuser',
          email: user?.email || 'test@user.com'
        };
      });
      return users;
    }
    return [];
  });

  // Mock User.prototype.save to intercept custom/new User creations
  jest.spyOn(User.prototype, 'save').mockImplementation(async function() {
    const db = JSON.parse(fs.readFileSync(TEST_DB_PATH, 'utf8'));
    if (!this._id) {
      this._id = 'mock_user_' + Date.now() + Math.random();
    }
    const userData = this.toObject();
    const bcrypt = require('bcryptjs');
    if (userData.password && !userData.password.startsWith('$2a$') && !userData.password.startsWith('$2b$')) {
      const salt = await bcrypt.genSalt(10);
      userData.password = await bcrypt.hash(userData.password, salt);
      this.password = userData.password;
    }
    const index = db.users.findIndex(x => x._id === userData._id || x.email === userData.email);
    if (index > -1) {
      db.users[index] = userData;
    } else {
      db.users.push(userData);
    }
    fs.writeFileSync(TEST_DB_PATH, JSON.stringify(db, null, 2));
    return this;
  });

  // Mock UserProfile.prototype.save to intercept user profile creation on signup
  jest.spyOn(UserProfile.prototype, 'save').mockImplementation(async function() {
    const db = JSON.parse(fs.readFileSync(TEST_DB_PATH, 'utf8'));
    if (!this._id) {
      this._id = 'mock_profile_' + Date.now() + Math.random();
    }
    const profileData = this.toObject();
    const index = db.profiles.findIndex(x => x.userId === profileData.userId);
    if (index > -1) {
      db.profiles[index] = profileData;
    } else {
      db.profiles.push(profileData);
    }
    fs.writeFileSync(TEST_DB_PATH, JSON.stringify(db, null, 2));
    return this;
  });

  // Mock UserProfile.findOne
  jest.spyOn(UserProfile, 'findOne').mockImplementation((query) => {
    const exec = async () => {
      const db = JSON.parse(fs.readFileSync(TEST_DB_PATH, 'utf8'));
      const p = db.profiles.find(x => x.userId === query.userId);
      return p || null;
    };
    return {
      lean: () => exec(),
      exec: () => exec()
    };
  });

  // Mock UserProfile.findOneAndDelete
  jest.spyOn(UserProfile, 'findOneAndDelete').mockImplementation(async (query) => {
    const db = JSON.parse(fs.readFileSync(TEST_DB_PATH, 'utf8'));
    const index = db.profiles.findIndex(x => x.userId === query.userId);
    if (index > -1) {
      const p = db.profiles[index];
      db.profiles.splice(index, 1);
      fs.writeFileSync(TEST_DB_PATH, JSON.stringify(db, null, 2));
      return p;
    }
    return null;
  });

  // Mock UserProfile.deleteMany
  jest.spyOn(UserProfile, 'deleteMany').mockImplementation(async (query) => {
    const db = JSON.parse(fs.readFileSync(TEST_DB_PATH, 'utf8'));
    db.profiles = db.profiles.filter(x => x.userId !== query.userId);
    fs.writeFileSync(TEST_DB_PATH, JSON.stringify(db, null, 2));
    return { deletedCount: 1 };
  });
});

beforeEach(() => {
  fs.writeFileSync(TEST_DB_PATH, JSON.stringify(cleanDbState, null, 2));
});

afterAll(() => {
  if (fs.existsSync(TEST_DB_PATH)) {
    try {
      fs.unlinkSync(TEST_DB_PATH);
    } catch (e) {}
  }
});

describe('RC-1 Production Verification Integration Tests', () => {
  const athleteCreds = {
    username: 'testathlete',
    email: 'athlete@test.com',
    password: 'SecurePassword123!'
  };

  const adminCreds = {
    username: 'testadmin',
    email: 'admin@test.com',
    password: 'AdminPassword123!'
  };

  async function registerUser(creds, role = 'user') {
    const res = await request(app).post('/api/auth/signup').send(creds);
    const db = JSON.parse(fs.readFileSync(TEST_DB_PATH, 'utf8'));
    const index = db.users.findIndex(u => u.email === creds.email);
    if (index > -1) {
      db.users[index].role = role;
      fs.writeFileSync(TEST_DB_PATH, JSON.stringify(db, null, 2));
    }
    return res.body.data.user;
  }

  async function getLoginToken(creds) {
    const res = await request(app).post('/api/auth/login').send({
      email: creds.email,
      password: creds.password
    });
    return res.body.data.token;
  }

  describe('1. Forgot / Reset Password Flows', () => {
    test('POST /forgot-password - Generates reset tokens and confirmation paths', async () => {
      await registerUser(athleteCreds);
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: athleteCreds.email });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      const db = JSON.parse(fs.readFileSync(TEST_DB_PATH, 'utf8'));
      const user = db.users.find(u => u.email === athleteCreds.email);
      expect(user.resetPasswordToken).toBeDefined();
      expect(user.resetPasswordExpires).toBeDefined();
    });

    test('POST /reset-password/:token - Updates password successfully', async () => {
      await registerUser(athleteCreds);
      
      // Request forgot token
      await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: athleteCreds.email });

      expect(global.lastSentEmail).toBeDefined();
      const match = global.lastSentEmail.html.match(/reset-password\/([^"<\s]+)/);
      const token = match ? match[1] : null;
      expect(token).not.toBeNull();

      const res = await request(app)
        .post(`/api/auth/reset-password/${token}`)
        .send({ password: 'NewSecurePassword123!' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify login works with new password
      const loginRes = await request(app).post('/api/auth/login').send({
        email: athleteCreds.email,
        password: 'NewSecurePassword123!'
      });
      expect(loginRes.statusCode).toBe(200);
      expect(loginRes.body.data.token).toBeDefined();
    });
  });

  describe('2. Email Verification Flow', () => {
    test('GET /verify-email/:token - Marks email as verified', async () => {
      await registerUser(athleteCreds);
      
      const db = JSON.parse(fs.readFileSync(TEST_DB_PATH, 'utf8'));
      const user = db.users.find(u => u.email === athleteCreds.email);
      const token = user.emailVerificationToken;

      const res = await request(app).get(`/api/auth/verify-email/${token}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      const dbAfter = JSON.parse(fs.readFileSync(TEST_DB_PATH, 'utf8'));
      const userAfter = dbAfter.users.find(u => u.email === athleteCreds.email);
      expect(userAfter.isEmailVerified).toBe(true);
    });

    test('POST /resend-verification - Regenerates and sends new token', async () => {
      await registerUser(athleteCreds);
      const token = await getLoginToken(athleteCreds);

      const dbBefore = JSON.parse(fs.readFileSync(TEST_DB_PATH, 'utf8'));
      const tokenBefore = dbBefore.users[0].emailVerificationToken;

      const res = await request(app)
        .post('/api/auth/resend-verification')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      const dbAfter = JSON.parse(fs.readFileSync(TEST_DB_PATH, 'utf8'));
      const tokenAfter = dbAfter.users[0].emailVerificationToken;
      expect(tokenAfter).not.toBe(tokenBefore);
    });
  });

  describe('3. Change Password Flow', () => {
    test('POST /change-password - Successfully updates password when authenticated', async () => {
      await registerUser(athleteCreds);
      const token = await getLoginToken(athleteCreds);

      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: athleteCreds.password,
          newPassword: 'ChangedPassword321!'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify login works with new changed password
      const loginRes = await request(app).post('/api/auth/login').send({
        email: athleteCreds.email,
        password: 'ChangedPassword321!'
      });
      expect(loginRes.statusCode).toBe(200);
    });
  });

  describe('4. Notification Center Flow', () => {
    test('Notifications CRUD Lifecycle (Fetch, Read, Read-All, Delete)', async () => {
      const user = await registerUser(athleteCreds);
      const token = await getLoginToken(athleteCreds);

      // Seed notifications directly
      const db = JSON.parse(fs.readFileSync(TEST_DB_PATH, 'utf8'));
      db.notifications.push(
        { _id: 'notif_1', userId: user._id, title: 'Title 1', message: 'Msg 1', read: false, createdAt: new Date().toISOString() },
        { _id: 'notif_2', userId: user._id, title: 'Title 2', message: 'Msg 2', read: false, createdAt: new Date().toISOString() }
      );
      fs.writeFileSync(TEST_DB_PATH, JSON.stringify(db, null, 2));

      // GET notifications
      let listRes = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${token}`);
      expect(listRes.statusCode).toBe(200);
      expect(listRes.body.data.notifications.length).toBe(2);

      // PUT mark single notification as read
      const readRes = await request(app)
        .put('/api/notifications/notif_1/read')
        .set('Authorization', `Bearer ${token}`);
      expect(readRes.statusCode).toBe(200);

      const dbCheck = JSON.parse(fs.readFileSync(TEST_DB_PATH, 'utf8'));
      expect(dbCheck.notifications.find(n => n._id === 'notif_1').read).toBe(true);
      expect(dbCheck.notifications.find(n => n._id === 'notif_2').read).toBe(false);

      // PUT read-all
      await request(app)
        .put('/api/notifications/read-all')
        .set('Authorization', `Bearer ${token}`);
      
      const dbCheckAll = JSON.parse(fs.readFileSync(TEST_DB_PATH, 'utf8'));
      expect(dbCheckAll.notifications.every(n => n.read)).toBe(true);

      // DELETE notification
      const delRes = await request(app)
        .delete('/api/notifications/notif_1')
        .set('Authorization', `Bearer ${token}`);
      expect(delRes.statusCode).toBe(200);

      const dbCheckDel = JSON.parse(fs.readFileSync(TEST_DB_PATH, 'utf8'));
      expect(dbCheckDel.notifications.length).toBe(1);
    });
  });

  describe('5. Admin Console Routing', () => {
    test('Admin CRUD & user suspension endpoints', async () => {
      const user = await registerUser(athleteCreds);
      await registerUser(adminCreds, 'admin');

      const adminToken = await getLoginToken(adminCreds);
      const athleteToken = await getLoginToken(athleteCreds);

      // Verify role protection: standard user should get 403 Forbidden
      const unauthorizedRes = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${athleteToken}`);
      expect(unauthorizedRes.statusCode).toBe(403);

      // GET users (Admin access)
      const listRes = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(listRes.statusCode).toBe(200);
      expect(listRes.body.data.users.length).toBe(2);

      // Toggle user suspension
      const suspendRes = await request(app)
        .post(`/api/admin/users/${user._id}/suspend`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(suspendRes.statusCode).toBe(200);

      const db = JSON.parse(fs.readFileSync(TEST_DB_PATH, 'utf8'));
      expect(db.users.find(u => u._id === user._id).isSuspended).toBe(true);

      // Try logging in as suspended user -> Expect 403 Forbidden
      const loginRes = await request(app).post('/api/auth/login').send({
        email: athleteCreds.email,
        password: athleteCreds.password
      });
      expect(loginRes.statusCode).toBe(403);
      expect(loginRes.body.error.code).toBe('ACCOUNT_SUSPENDED');
    });

    test('GET /admin/ai-usage returns unified payload alignment', async () => {
      const admin = await registerUser(adminCreds, 'admin');
      const adminToken = await getLoginToken(adminCreds);

      // Seed AI usage logs
      const db = JSON.parse(fs.readFileSync(TEST_DB_PATH, 'utf8'));
      db.aiUsage.push(
        { userId: admin._id, endpoint: 'generate-workout-plan', tokens: 12000, createdAt: new Date().toISOString() },
        { userId: admin._id, endpoint: 'coach-insight', tokens: 3000, createdAt: new Date().toISOString() }
      );
      fs.writeFileSync(TEST_DB_PATH, JSON.stringify(db, null, 2));

      const res = await request(app)
        .get('/api/admin/ai-usage')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.totalTokens).toBe(15000);
      expect(res.body.data.requestCount).toBe(2);
      expect(res.body.data.endpoints).toBeDefined();
      expect(res.body.data.endpoints.length).toBe(2);
      expect(res.body.data.endpoints.find(e => e._id === 'coach-insight').totalTokens).toBe(3000);
    });
  });

  describe('6. AI Quota Guard Middleware', () => {
    test('49,999 tokens → Allowed, 50,000 tokens → Allowed, 50,001 tokens → Blocked (429)', async () => {
      const user = await registerUser(athleteCreds);
      const token = await getLoginToken(athleteCreds);

      // Seed 49,999 tokens
      let db = JSON.parse(fs.readFileSync(TEST_DB_PATH, 'utf8'));
      db.aiUsage.push({
        userId: user._id,
        endpoint: 'generate-workout-plan',
        tokens: 49999,
        createdAt: new Date().toISOString()
      });
      fs.writeFileSync(TEST_DB_PATH, JSON.stringify(db, null, 2));

      // Make AI request -> Expect allowed (returns validation error since parameters are empty but doesn't throw 429)
      let res = await request(app)
        .post('/api/workouts/generate-plan')
        .set('Authorization', `Bearer ${token}`)
        .send({});
      expect(res.statusCode).not.toBe(429);

      // Seed exactly 1 more token (total 50,000)
      db = JSON.parse(fs.readFileSync(TEST_DB_PATH, 'utf8'));
      db.aiUsage = [{
        userId: user._id,
        endpoint: 'generate-workout-plan',
        tokens: 50000,
        createdAt: new Date().toISOString()
      }];
      fs.writeFileSync(TEST_DB_PATH, JSON.stringify(db, null, 2));

      // Make AI request -> Expect allowed
      res = await request(app)
        .post('/api/workouts/generate-plan')
        .set('Authorization', `Bearer ${token}`)
        .send({});
      expect(res.statusCode).not.toBe(429);

      // Seed exactly 50,001 tokens
      db = JSON.parse(fs.readFileSync(TEST_DB_PATH, 'utf8'));
      db.aiUsage = [{
        userId: user._id,
        endpoint: 'generate-workout-plan',
        tokens: 50001,
        createdAt: new Date().toISOString()
      }];
      fs.writeFileSync(TEST_DB_PATH, JSON.stringify(db, null, 2));

      // Make AI request -> Expect BLOCKED (429)
      res = await request(app)
        .post('/api/workouts/generate-plan')
        .set('Authorization', `Bearer ${token}`)
        .send({});
      expect(res.statusCode).toBe(429);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('AI_QUOTA_EXCEEDED');
      expect(res.body.details.current).toBe(50001);
    });
  });
});
