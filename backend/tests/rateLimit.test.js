// Intercept process.env before requiring the server to enforce production mode rate limits
process.env.NODE_ENV = 'production';
process.env.JWT_SECRET = 'ratelimit_secret_integration_test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/ratelimit_dummy_db';

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;
let app;

beforeAll(async () => {
  // Spin up mongodb-memory-server
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  
  process.env.MONGODB_URI = uri;
  
  // Connect mongoose
  await mongoose.connect(uri);
  
  // Require the express application server
  app = require('../server');
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Sensitive Routes Rate Limiting Guard (Production Env)', () => {
  test('Returns 429 when verify-email endpoint is hammered (> 5 requests)', async () => {
    const verifyToken = 'some_dummy_verification_token';
    
    // Send 5 requests (should NOT return 429, but probably 400 since token is dummy)
    for (let i = 0; i < 5; i++) {
      const res = await request(app).get(`/api/auth/verify-email/${verifyToken}`);
      expect(res.statusCode).not.toBe(429);
    }

    // 6th request should return 429 Too Many Requests
    const res = await request(app).get(`/api/auth/verify-email/${verifyToken}`);
    expect(res.statusCode).toBe(429);
    expect(res.text).toContain('Too many auth requests');
  });
});
