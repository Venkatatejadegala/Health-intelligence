const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Health Hub API',
      version: '2.0.0',
      description: 'API documentation for the Health Hub platform',
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Local Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token in the format: Bearer <token>',
        },
      },
      schemas: {
        SuccessEnvelope: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            timestamp: { type: 'string', format: 'date-time' },
            data: { type: 'object' }
          }
        },
        ErrorEnvelope: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            timestamp: { type: 'string', format: 'date-time' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'INVALID_CREDENTIALS' },
                message: { type: 'string', example: 'Invalid credentials provided' },
                details: { type: 'array', items: { type: 'string' } }
              }
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '665000000000000000000001' },
            username: { type: 'string', example: 'john_doe' },
            email: { type: 'string', format: 'email', example: 'john@example.com' }
          }
        },
        UserProfile: {
          type: 'object',
          properties: {
            userId: { type: 'string', example: '665000000000000000000001' },
            name: { type: 'string', example: 'John Doe' },
            age: { type: 'integer', example: 28 },
            sex: { type: 'string', enum: ['male', 'female', 'other'], example: 'male' },
            height: { type: 'number', example: 175 },
            weight: { type: 'number', example: 75 },
            activityLevel: { type: 'string', enum: ['sedentary', 'lightly_active', 'moderately_active', 'very_active'], example: 'moderately_active' },
            goal: { type: 'string', enum: ['lose_fat', 'maintain', 'gain_muscle', 'recomposition'], example: 'recomposition' },
            bmr: { type: 'number', example: 1710 },
            tdee: { type: 'number', example: 2650 },
            dailyCalories: { type: 'number', example: 2400 },
            targetMacros: {
              type: 'object',
              properties: {
                protein: { type: 'number', example: 150 },
                carbs: { type: 'number', example: 250 },
                fat: { type: 'number', example: 70 }
              }
            }
          }
        },
        DailyLog: {
          type: 'object',
          properties: {
            userId: { type: 'string', example: '665000000000000000000001' },
            date: { type: 'string', format: 'date', example: '2026-06-20' },
            caloriesConsumed: { type: 'integer', example: 2100 },
            waterIntake: { type: 'integer', example: 2500 },
            sleepHours: { type: 'number', example: 7.5 },
            workoutDuration: { type: 'integer', example: 45 },
            activeCaloriesBurned: { type: 'integer', example: 350 },
            proteinConsumed: { type: 'integer', example: 135 },
            carbsConsumed: { type: 'integer', example: 210 },
            fatConsumed: { type: 'integer', example: 65 },
            meals: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: 'm1' },
                  name: { type: 'string', example: 'Breakfast' },
                  calories: { type: 'integer', example: 500 },
                  protein: { type: 'integer', example: 30 },
                  carbs: { type: 'integer', example: 50 },
                  fat: { type: 'integer', example: 15 },
                  timestamp: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        },
        WorkoutPlan: {
          type: 'object',
          properties: {
            userId: { type: 'string', example: '665000000000000000000001' },
            splitType: { type: 'string', example: 'Push/Pull/Legs' },
            plan: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  day: { type: 'string', example: 'Monday' },
                  muscleGroup: { type: 'string', example: 'Push (Chest/Shoulders/Triceps)' },
                  exercises: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string', example: 'Bench Press' },
                        sets: { type: 'integer', example: 4 },
                        reps: { type: 'integer', example: 8 },
                        weight: { type: 'number', example: 60 },
                        rpe: { type: 'integer', example: 8 },
                        durationMinutes: { type: 'integer', example: 10 },
                        notes: { type: 'string', example: 'Focus on progressive overload' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./routes/*.js', './routes/**/*.js', './config/swagger.js'],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
