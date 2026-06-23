require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, '../local_db.json');

const MONGODB_URI = process.env.MONGODB_URI;
const DEMO_USER_ID = '665000000000000000000001';

const generateMockData = () => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  const dailyLogs = [];
  const sessions = [];

  let currentWeight = 76.5;

  for (let i = 0; i <= 30; i++) {
    const logDate = new Date(startDate);
    logDate.setDate(startDate.getDate() + i);
    logDate.setHours(12, 0, 0, 0);

    const isWeekend = logDate.getDay() === 0 || logDate.getDay() === 6;
    const didWorkout = !isWeekend && (i % 2 === 0); // Train Mon, Wed, Fri
    
    // Calorie intake: target is 2000. Add some variations.
    const calorieTarget = 2000;
    const caloriesConsumed = Math.round(calorieTarget + (Math.sin(i) * 150) + (isWeekend ? 200 : -100));
    const proteinConsumed = Math.round(150 + (Math.cos(i) * 10));
    const carbsConsumed = Math.round(180 + (Math.sin(i) * 20));
    const fatConsumed = Math.round(60 + (isWeekend ? 10 : -5));
    
    const sleepHours = Number((7.0 + Math.sin(i/2) * 0.8 + (isWeekend ? 1.0 : 0)).toFixed(1));
    const stressLevel = didWorkout ? Math.round(4 - Math.sin(i)) : Math.round(5 + Math.sin(i));
    const energyLevel = sleepHours > 7 ? Math.round(8 - stressLevel/3) : Math.round(6 - stressLevel/3);
    const recoveryScore = Math.min(100, Math.max(30, Math.round(sleepHours * 10 + (10 - stressLevel) * 2 + (didWorkout ? -10 : 10))));

    // Weight projection: slowly goes down due to calorie deficit (7700 kcal deficit = 1kg)
    const weightLossPerDay = ((2500 - caloriesConsumed) / 7700); // TDEE is roughly 2500
    currentWeight -= weightLossPerDay;

    const meals = [
      {
        id: `meal_breakfast_${i}`,
        name: 'Oats with milk, scoop of whey and banana',
        calories: 550,
        protein: 38,
        carbs: 65,
        fat: 10,
        fiber: 8,
        serving: '1 bowl',
        confidence: 98,
        mealType: 'breakfast'
      },
      {
        id: `meal_lunch_${i}`,
        name: 'Chicken breast curry with brown rice and mixed green salad',
        calories: 680,
        protein: 50,
        carbs: 75,
        fat: 12,
        fiber: 6,
        serving: '1 plate',
        confidence: 95,
        mealType: 'lunch'
      },
      {
        id: `meal_dinner_${i}`,
        name: 'Dal tadka, scrambled eggs (3) and 2 whole wheat rotis',
        calories: 620,
        protein: 38,
        carbs: 60,
        fat: 20,
        fiber: 7,
        serving: '1 plate',
        confidence: 96,
        mealType: 'dinner'
      }
    ];

    dailyLogs.push({
      _id: `mock_log_${Date.now() + i}`,
      userId: DEMO_USER_ID,
      date: logDate.toISOString(),
      caloriesConsumed,
      proteinConsumed,
      carbsConsumed,
      fatConsumed,
      fiberConsumed: 21,
      waterIntake: didWorkout ? 3500 : 2500,
      sleepHours,
      didWorkout,
      energyLevel,
      stressLevel,
      mood: Math.max(1, Math.min(5, Math.round(energyLevel / 2))),
      recoveryScore,
      weight: Number(currentWeight.toFixed(2)),
      meals,
      createdAt: logDate.toISOString(),
      updatedAt: logDate.toISOString()
    });

    if (didWorkout) {
      sessions.push({
        _id: `mock_sess_${Date.now() + i}`,
        userId: DEMO_USER_ID,
        workoutPlanId: '665000000000000000000005',
        date: logDate.toISOString(),
        exercises: [
          {
            name: 'Back Squat',
            sets: [
              { weight: 80, reps: 8, completed: true },
              { weight: 80, reps: 8, completed: true },
              { weight: 85, reps: 6, completed: true }
            ]
          },
          {
            name: 'Bench Press',
            sets: [
              { weight: 70, reps: 8, completed: true },
              { weight: 70, reps: 8, completed: true },
              { weight: 72.5, reps: 7, completed: true }
            ]
          },
          {
            name: 'Lat Pulldown',
            sets: [
              { weight: 60, reps: 10, completed: true },
              { weight: 60, reps: 10, completed: true },
              { weight: 60, reps: 8, completed: true }
            ]
          }
        ],
        createdAt: logDate.toISOString(),
        updatedAt: logDate.toISOString()
      });
    }
  }

  // Demo user
  const hashedPassword = bcrypt.hashSync('password123', 10);
  const user = {
    _id: DEMO_USER_ID,
    username: 'demo-athlete',
    email: 'demo@health.com',
    password: hashedPassword,
    createdAt: startDate.toISOString()
  };

  // Profile targets
  const profile = {
    userId: DEMO_USER_ID,
    name: 'Demo Athlete',
    age: 26,
    sex: 'male',
    height: 180,
    weight: 76.5,
    activityLevel: 'moderately_active',
    goal: 'deficit',
    bmr: 1762,
    tdee: 2731,
    calorieTarget: 2000,
    proteinTarget: 150,
    carbsTarget: 200,
    fatsTarget: 66,
    createdAt: startDate.toISOString(),
    updatedAt: startDate.toISOString()
  };

  const workoutPlans = [
    {
      _id: '665000000000000000000005',
      userId: DEMO_USER_ID,
      name: 'deficit upper lower plan',
      goal: 'deficit',
      experienceLevel: 'intermediate',
      equipment: ['barbell', 'dumbbells', 'bench', 'cable'],
      workoutDays: [1, 2, 4, 5],
      bodyFocusAreas: ['chest', 'back', 'legs'],
      split: 'upper_lower',
      exercises: [
        {
          name: 'Back Squat',
          targetMuscles: ['quadriceps', 'glutes', 'core'],
          instructions: ['Brace hard before descent.', 'Sit between the hips.', 'Drive up through midfoot.'],
          commonMistakes: ['Knees collapsing inward.', 'Losing brace at the bottom.'],
          sets: 3,
          reps: '8-12',
          difficulty: 'intermediate',
          gifUrl: '',
          mediaStatus: 'gif-api-ready'
        },
        {
          name: 'Bench Press',
          targetMuscles: ['chest', 'triceps', 'front delts'],
          instructions: ['Set shoulder blades.', 'Lower with control.', 'Press slightly back.'],
          commonMistakes: ['Loose upper back.', 'Bouncing the bar.'],
          sets: 3,
          reps: '8-12',
          difficulty: 'intermediate',
          gifUrl: '',
          mediaStatus: 'gif-api-ready'
        },
        {
          name: 'Lat Pulldown',
          targetMuscles: ['lats', 'biceps', 'upper back'],
          instructions: ['Pull elbows toward ribs.', 'Keep chest tall.', 'Control the return.'],
          commonMistakes: ['Using too much momentum.', 'Pulling behind neck.'],
          sets: 3,
          reps: '8-12',
          difficulty: 'intermediate',
          gifUrl: '',
          mediaStatus: 'gif-api-ready'
        }
      ],
      isCustom: false,
      createdAt: startDate.toISOString(),
      updatedAt: startDate.toISOString()
    }
  ];

  return { user, profile, dailyLogs, workoutPlans, progress: [], sessions };
};

const seedLocalJson = (data) => {
  console.log('Seeding local JSON database...');
  const formattedData = {
    users: [data.user],
    profiles: [data.profile],
    dailyLogs: data.dailyLogs,
    workoutPlans: data.workoutPlans,
    progress: data.progress,
    sessions: data.sessions,
    coachingInsights: []
  };
  fs.writeFileSync(DB_PATH, JSON.stringify(formattedData, null, 2));
  console.log(`Successfully seeded local JSON database at ${DB_PATH}`);
};

const seedMongoDb = async (data) => {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB. Clearing existing collections for demo user...');
  
  // Clean
  await mongoose.connection.collection('users').deleteMany({ email: 'demo@health.com' });
  await mongoose.connection.collection('userprofiles').deleteMany({ userId: DEMO_USER_ID });
  await mongoose.connection.collection('dailylogs').deleteMany({ userId: DEMO_USER_ID });
  await mongoose.connection.collection('workoutplans').deleteMany({ userId: DEMO_USER_ID });
  await mongoose.connection.collection('userworkoutsessions').deleteMany({ userId: DEMO_USER_ID });

  // Seed
  await mongoose.connection.collection('users').insertOne(data.user);
  await mongoose.connection.collection('userprofiles').insertOne(data.profile);
  await mongoose.connection.collection('dailylogs').insertMany(data.dailyLogs);
  await mongoose.connection.collection('workoutplans').insertMany(data.workoutPlans);
  if (data.sessions.length > 0) {
    await mongoose.connection.collection('userworkoutsessions').insertMany(data.sessions);
  }

  console.log('Successfully seeded MongoDB collections!');
  await mongoose.connection.close();
};

const run = async () => {
  const data = generateMockData();
  
  // Seed local_db.json first
  seedLocalJson(data);

  // If MONGODB_URI is provided, try seeding Mongo as well
  if (MONGODB_URI) {
    try {
      await seedMongoDb(data);
    } catch (err) {
      console.error('MongoDB seeding failed (proceeding with local file seeding only):', err.message);
    }
  } else {
    console.log('No MONGODB_URI environment variable detected in backend/.env. Skipping MongoDB seeding.');
  }
};

run().then(() => {
  console.log('Seeding process completed.');
  process.exit(0);
});
