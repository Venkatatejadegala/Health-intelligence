require('dotenv').config();
const Sentry = require('@sentry/node');

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 1.0,
  });
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const logger = require('./utils/logger');
const pinoHttp = require('pino-http')({ logger });

const authRoutes = require('./routes/auth.routes');
const userProfileRoutes = require('./routes/userProfile.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const aiCoachRoutes = require('./routes/aiCoach.routes');
const nutritionIntelligenceRoutes = require('./routes/nutritionIntelligence.routes');
const workoutRoutes = require('./routes/workout.routes');
const dailyLogRoutes = require('./routes/dailyLog.routes');
const progressRoutes = require('./routes/progress.routes');
const workoutSessionRoutes = require('./routes/workoutSession.routes');
const platformIntelligenceRoutes = require('./routes/platformIntelligence.routes');
const notificationRoutes = require('./routes/notification.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy settings to read forward client IPs in production environments
app.set('trust proxy', 1);

app.use(helmet());
app.use(pinoHttp);

const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const isDev = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test' || !process.env.NODE_ENV;

// Stricter rate limiting configurations matching RC-1 spec
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 10000 : 100,
  message: 'Too many requests from this IP, please try again later.'
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 10000 : 5,
  message: 'Too many auth requests. Please try again in 15 minutes.'
});

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 10000 : 10,
  message: 'Too many AI requests. Please try again in 15 minutes.'
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api/auth/reset-password', authLimiter);
app.use('/api/auth/change-password', authLimiter);
app.use('/api/auth/resend-verification', authLimiter);
app.use('/api/auth/verify-email', authLimiter);
app.use('/api/coach/insight', aiLimiter);
app.use('/api/workouts/generate-plan', aiLimiter);
app.use('/api/workouts/enrich-exercise', aiLimiter);

app.use(generalLimiter);

app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'https://your-app-name.vercel.app',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174'
  ],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const { sanitize } = require('./middleware/sanitize.middleware');
app.use(sanitize);

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'fallback-no-database'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/profile', userProfileRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/coach', aiCoachRoutes);
app.use('/api/nutrition-intelligence', nutritionIntelligenceRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/logs', dailyLogRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/workout-sessions', workoutSessionRoutes);
app.use('/api/intelligence', platformIntelligenceRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
  res.json({
    message: 'Health Hub API is running!',
    version: '2.0.0',
    documentation: '/api/docs',
    health: '/health'
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    availableRoutes: [
      'GET /',
      'GET /health',
      'POST /api/auth/login',
      'POST /api/auth/register',
      'GET /api/profile',
      'PUT /api/profile',
      'POST /api/coach/insight',
      'GET /api/coach/context',
      'GET /api/nutrition-intelligence/summary',
      'POST /api/workouts/generate-plan',
      'PUT /api/logs/today',
      'POST /api/workout-sessions',
      'GET /api/progress/comparison',
      'GET /api/intelligence/overview'
    ]
  });
});

if (process.env.SENTRY_DSN) {
  Sentry.setupExpressErrorHandler(app);
}

const { errorHandler } = require('./middleware/error.middleware');
app.use(errorHandler);

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;

if (!MONGODB_URI) {
  logger.error('MONGODB_URI is not defined in environment variables. Please add it to your .env file.');
  process.exit(1);
}

if (!JWT_SECRET) {
  logger.error('FATAL ERROR: JWT_SECRET is not defined in environment variables. Please add it to your .env file.');
  process.exit(1);
}

// mongoose.set('bufferCommands', false);

const startServer = (databaseStatus = 'connected') => {
  app.listen(PORT, () => {
    logger.info(`Health Hub API server running on port ${PORT}`);
    logger.info(`Health check: http://localhost:${PORT}/health`);
    logger.info(`API docs: http://localhost:${PORT}/api/docs`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`Database status: ${databaseStatus}`);
  });
};

if (process.env.NODE_ENV !== 'test') {
  const MAX_RETRIES = 5;
  
  const connectWithRetry = async (retryCount = 1) => {
    try {
      logger.info({ retryCount, maxRetries: MAX_RETRIES }, `Attempting database connection`);
      await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 6000 });
      logger.info('Database connected successfully');
      startServer('connected');
    } catch (err) {
      logger.error({ err: err.message, retryCount }, `Unable to connect to the database`);
      
      try {
        await mongoose.disconnect();
      } catch (discErr) {
        logger.error(`Failed to disconnect mongoose: ${discErr.message}`);
      }
      
      if (retryCount < MAX_RETRIES) {
        const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff: 2s, 4s, 8s, 16s
        logger.info({ delayMs: delay }, `Scheduling reconnection attempt`);
        setTimeout(() => connectWithRetry(retryCount + 1), delay);
      } else {
        logger.error({ maxRetries: MAX_RETRIES }, `Maximum database connection retries exceeded`);
        if ((process.env.NODE_ENV || 'development') !== 'production') {
          logger.warn('Starting API in development fallback mode. Database-backed writes may fail, but demo intelligence endpoints remain available.');
          startServer('fallback-no-database');
          return;
        }
        process.exit(1);
      }
    }
  };

  connectWithRetry();
}

module.exports = app;
