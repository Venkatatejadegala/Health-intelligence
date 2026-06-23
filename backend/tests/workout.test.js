const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'workout_test_jwt_secret_key';

// Mock the email service
jest.mock('../services/email.service', () => {
  return {
    sendMail: jest.fn().mockResolvedValue({ success: true })
  };
});

const User = require('../models/User');
const WorkoutPlan = require('../models/WorkoutPlan');
const ActiveWorkoutPlan = require('../models/ActiveWorkoutPlan');
const UserWorkoutSession = require('../models/UserWorkoutSession');

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
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

describe('Gym Planner & Workout Operating System Integration Tests', () => {
  const testUser = {
    username: 'gymrat',
    email: 'gymrat@test.com',
    password: 'Password123!',
    age: 24,
    gender: 'male',
    height: 180,
    weight: 80
  };

  async function registerAndVerify() {
    await request(app).post('/api/auth/signup').send(testUser);
    const user = await User.findOne({ email: testUser.email });
    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    await user.save();
    return user;
  }

  async function getAuthToken() {
    const res = await request(app).post('/api/auth/login').send({
      email: testUser.email,
      password: testUser.password
    });
    return res.body.data.token;
  }

  test('Workout Plan Lifecycle, Switch Active Plan, Log Session, and Compute Dashboard Stats', async () => {
    const user = await registerAndVerify();
    const token = await getAuthToken();

    // 1. Initially user should have no saved plans or default active plan
    const initialPlansRes = await request(app)
      .get('/api/workouts')
      .set('Authorization', `Bearer ${token}`);
    expect(initialPlansRes.statusCode).toBe(200);
    expect(initialPlansRes.body.success).toBe(true);

    const initialActiveRes = await request(app)
      .get('/api/workouts/active')
      .set('Authorization', `Bearer ${token}`);
    expect(initialActiveRes.statusCode).toBe(200);

    // 2. Create custom workout plan
    const customPlanData = {
      name: 'Custom Push Pull Legs',
      goal: 'deficit',
      split: 'push_pull_legs',
      experienceLevel: 'advanced',
      weeklySchedule: [
        {
          day: 1,
          dayName: 'Monday',
          focus: 'push',
          estimatedMinutes: 60,
          exercises: [
            {
              name: 'Incline Bench Press',
              targetMuscles: ['chest', 'shoulders'],
              sets: 4,
              reps: '8-10',
              difficulty: 'hard'
            }
          ]
        }
      ]
    };

    const createRes = await request(app)
      .post('/api/workouts/custom')
      .set('Authorization', `Bearer ${token}`)
      .send(customPlanData);
    expect(createRes.statusCode).toBe(201);
    expect(createRes.body.success).toBe(true);
    expect(createRes.body.data.name).toBe('Custom Push Pull Legs');
    const customPlanId = createRes.body.data._id;
    expect(customPlanId).toBeDefined();

    // 3. Set custom plan as active
    const activateRes = await request(app)
      .post(`/api/workouts/${customPlanId}/activate`)
      .set('Authorization', `Bearer ${token}`);
    expect(activateRes.statusCode).toBe(200);
    expect(activateRes.body.success).toBe(true);

    // Verify it is active
    const activeRes = await request(app)
      .get('/api/workouts/active')
      .set('Authorization', `Bearer ${token}`);
    expect(activeRes.statusCode).toBe(200);
    expect(activeRes.body.data._id).toBe(customPlanId);

    // 4. Log a completed workout session
    const sessionData = {
      workoutPlanId: customPlanId,
      workoutName: 'Monday Push',
      date: new Date().toISOString(),
      duration: 55,
      startTime: new Date(Date.now() - 55 * 60000).toISOString(),
      endTime: new Date().toISOString(),
      notes: 'Felt extremely strong today. Hit 4 sets.',
      exercises: [
        {
          name: 'Incline Bench Press',
          sets: [
            { weight: 80, reps: 10, completed: true, setType: 'normal' },
            { weight: 80, reps: 10, completed: true, setType: 'normal' },
            { weight: 85, reps: 8, completed: true, setType: 'normal' },
            { weight: 85, reps: 8, completed: true, setType: 'normal' }
          ]
        }
      ]
    };

    const sessionRes = await request(app)
      .post('/api/workout-sessions')
      .set('Authorization', `Bearer ${token}`)
      .send(sessionData);
    expect(sessionRes.statusCode).toBe(201);
    expect(sessionRes.body.success).toBe(true);
    expect(sessionRes.body.data.session.workoutName).toBe('Monday Push');
    expect(sessionRes.body.data.session.notes).toBe('Felt extremely strong today. Hit 4 sets.');

    // Calculate volume: (80*10) + (80*10) + (85*8) + (85*8) = 800 + 800 + 680 + 680 = 2960 kg
    const expectedVolume = 2960;

    // 5. Query Dashboard Stats and check dynamically calculated results
    const statsRes = await request(app)
      .get('/api/workouts/dashboard-stats')
      .set('Authorization', `Bearer ${token}`);
    expect(statsRes.statusCode).toBe(200);
    expect(statsRes.body.success).toBe(true);
    
    const stats = statsRes.body.data;
    expect(stats.activePlanName).toBe('Custom Push Pull Legs');
    expect(stats.streak).toBe(1);
    expect(stats.weeklyVolume).toBe(expectedVolume);
    expect(stats.lastWorkout).toBeDefined();
    expect(stats.lastWorkout.volume).toBe(expectedVolume);
    expect(stats.lastWorkout.workoutName).toBe('Monday Push');
    expect(stats.lastWorkout.duration).toBe(55);
  });
});
