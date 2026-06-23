const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User.js');
const { validateBody } = require('../middleware/validation.middleware');
const { successResponse, errorResponse } = require('../utils/response');
const logger = require('../utils/logger');


/**
 * @swagger
 * /api/auth/demo-fallback:
 *   post:
 *     summary: Demo login fallback
 *     tags: [Authentication]
 *     description: Authenticate as the demo athlete fallback user (development only)
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessEnvelope'
 *       404:
 *         description: Demo fallback disabled in production
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorEnvelope'
 */
router.post('/demo-fallback', async (req, res) => {
  if ((process.env.NODE_ENV || 'development') === 'production') {
    return errorResponse(res, 'Demo fallback is disabled in production', 404, 'DEMO_FALLBACK_DISABLED');
  }
  const demoUser = {
    _id: '665000000000000000000001',
    id: '665000000000000000000001',
    username: 'demo-athlete',
    email: 'demo@health.com'
  };
  const token = jwt.sign({ id: demoUser.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

  return successResponse(res, {
    message: 'Demo fallback login successful',
    token,
    user: demoUser,
    mode: 'fallback-no-database'
  }, 200);
});

// Signup Route
const localDb = require('../services/localDb.service.js');
const mongoose = require('mongoose');
const UserProfile = require('../models/UserProfile.js');

const createProfileHelper = async (userId, username, body, isFallback) => {
  const age = body.age ? Number(body.age) : null;
  const sex = body.gender || null;
  const height = body.height ? Number(body.height) : null;
  const weight = body.weight ? Number(body.weight) : null;
  const activityLevel = body.activityLevel || 'moderately_active';
  const goal = body.goal || 'recomposition';

  const profileHelper = require('../services/profileHelper.service.js');
  const profileFields = {
    name: username,
    age,
    sex,
    height,
    weight,
    activityLevel,
    goal,
    ...profileHelper.calculateBmrTdeeMacros({
      age, sex, height, weight, activityLevel, goal
    })
  };

  if (isFallback) {
    await localDb.saveProfile(userId, profileFields);
  } else {
    const profile = new UserProfile({
      userId,
      ...profileFields
    });
    await profile.save();
  }
};

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     description: Creates a user and associated UserProfile
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessEnvelope'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorEnvelope'
 */
router.post('/signup', validateBody({ username: 'string', email: 'string', password: 'string' }), async (req, res) => {
  const { password } = req.body;
  const username = req.body.username ? req.body.username.trim() : '';
  const email = req.body.email ? req.body.email.trim().toLowerCase() : '';

  try {
    if (mongoose.connection.readyState === 1) {
      // Check if user already exists
      const existingUser = await User.findOne({ $or: [{ email }, { username }] });
      if (existingUser) {
        logger.warn({ email, username }, 'Signup failed: Username or email already exists');
        return errorResponse(res, 'Username or email already exists.', 400, 'USER_EXISTS');
      }

      // Create user object in DB (password is hashed in pre-save hook)
      const crypto = require('crypto');
      const emailVerificationToken = crypto.randomBytes(32).toString('hex');
      const user = new User({
        username,
        email,
        password,
        isEmailVerified: false,
        emailVerificationToken
      });
      await user.save();

      // Create User Profile automatically
      try {
        await createProfileHelper(user._id, username, req.body, false);
      } catch (profileErr) {
        logger.error({ err: profileErr.message, userId: user._id }, 'Failed to create UserProfile on signup');
      }

      // Send verification email
      try {
        const { sendMail } = require('../services/email.service');
        const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email/${emailVerificationToken}`;
        await sendMail({
          to: email,
          subject: 'Verify Your Email - Health Hub',
          html: `<p>Welcome to Health Hub!</p><p>Please verify your email address by clicking the link below:</p><p><a href="${verificationLink}">${verificationLink}</a></p><p>This link is valid for 24 hours.</p>`
        });
      } catch (mailErr) {
        logger.error({ err: mailErr.message, userId: user._id }, 'Failed to send verification email');
      }

      // Exclude password from the response
      const userResponse = user.toObject();
      delete userResponse.password;

      return successResponse(res, { message: 'User registered successfully. Please check your email to verify your account.', user: userResponse }, 201);
    } else {
      // Local DB Fallback
      if ((process.env.NODE_ENV || 'development') === 'production') {
        throw new Error('Database connection is not ready');
      }

      const existingUser = await localDb.findUserByEmailOrUsername(email, username);
      if (existingUser) {
        logger.warn({ email, username }, 'Signup failed: Username or email already exists (Fallback)');
        return errorResponse(res, 'Username or email already exists.', 400, 'USER_EXISTS');
      }

      const user = await localDb.createUser(username, email, password);

      // Create User Profile automatically in localDb fallback
      try {
        await createProfileHelper(user._id, username, req.body, true);
      } catch (profileErr) {
        logger.error({ err: profileErr.message, userId: user._id }, 'Failed to create UserProfile fallback on signup');
      }

      const userResponse = { ...user };
      delete userResponse.password;

      return successResponse(res, { message: 'User registered successfully (Demo Fallback)', user: userResponse }, 201);
    }
  } catch (error) {
    logger.error({ err: error.message, email }, 'Error registering user');
    return errorResponse(res, 'Error registering user', 500, 'SIGNUP_ERROR');
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     description: Authenticate with email and password to receive a JWT
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: athlete@example.com
 *               password:
 *                 type: string
 *                 example: Password123
 *     responses:
 *       200:
 *         description: Logged in successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessEnvelope'
 *       400:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorEnvelope'
 */
router.post('/login', validateBody({ email: 'string', password: 'string' }), async (req, res) => {
  const email = req.body.email ? req.body.email.trim().toLowerCase() : '';
  const { password } = req.body;

  try {
    if (mongoose.connection.readyState === 1) {
      const user = await User.findOne({ email });

      if (!user) {
        logger.warn({ email }, 'Login failed: User not found');
        return errorResponse(res, 'Invalid credentials', 400, 'INVALID_CREDENTIALS');
      }

      if (user.isSuspended) {
        logger.warn({ email }, 'Login failed: Account suspended');
        return errorResponse(res, 'Your account has been suspended. Please contact support.', 403, 'ACCOUNT_SUSPENDED');
      }

      const isMatch = await user.validPassword(password);

      if (!isMatch) {
        logger.warn({ email }, 'Login failed: Incorrect password');
        return errorResponse(res, 'Invalid credentials', 400, 'INVALID_CREDENTIALS');
      }

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

      // Exclude password from the response
      const userResponse = user.toObject();
      delete userResponse.password;

      return successResponse(res, { message: 'Logged in successfully', token, user: userResponse }, 200);
    } else {
      // Local DB Fallback
      if ((process.env.NODE_ENV || 'development') === 'production') {
        throw new Error('Database connection is not ready');
      }

      const user = await localDb.findUserByEmail(email);

      if (!user) {
        logger.warn({ email }, 'Login failed: User not found (Fallback)');
        return errorResponse(res, 'Invalid credentials', 400, 'INVALID_CREDENTIALS');
      }

      const isMatch = await localDb.verifyPassword(password, user.password);

      if (!isMatch) {
        logger.warn({ email }, 'Login failed: Incorrect password (Fallback)');
        return errorResponse(res, 'Invalid credentials', 400, 'INVALID_CREDENTIALS');
      }

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

      const userResponse = { ...user };
      delete userResponse.password;

      return successResponse(res, { message: 'Logged in successfully (Demo Fallback)', token, user: userResponse }, 200);
    }
  } catch (error) {
    logger.error({ err: error.message, email }, 'Error during login');
    return errorResponse(res, 'Error logging in', 500, 'LOGIN_ERROR');
  }
});

// Firebase Auth Route (Google Sign-In)
const admin = require('../config/firebase-admin');

/**
 * @swagger
 * /api/auth/firebase:
 *   post:
 *     summary: Firebase Google authentication
 *     tags: [Authentication]
 *     description: Authenticate using Firebase ID Token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idToken
 *             properties:
 *               idToken:
 *                 type: string
 *                 example: eyJhbGciOiJSUzI1NiIsImtpZCI6...
 *     responses:
 *       200:
 *         description: Firebase Auth successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessEnvelope'
 *       400:
 *         description: Firebase ID token is required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorEnvelope'
 *       401:
 *         description: Invalid or expired Firebase token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorEnvelope'
 */
router.post('/firebase', validateBody({ idToken: 'string' }), async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    logger.warn('Firebase login attempt failed: ID token is missing');
    return errorResponse(res, 'Firebase ID token is required', 400, 'ID_TOKEN_REQUIRED');
  }

  try {
    // Verify the Firebase token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, email, name, picture } = decodedToken;

    // Check if user exists in MongoDB (if database is connected)
    const mongoose = require('mongoose');
    let user = null;

    if (mongoose.connection.readyState === 1) {
      user = await User.findOne({ email });

      // If no user exists, create one (this handles the silent signup flow Google provides)
      if (!user) {
        // Generate a strong random password for Google-first users since they don't provide one
        const randomPassword = require('crypto').randomBytes(20).toString('hex');
        user = new User({
          username: name ? name.replace(/\s+/g, '').toLowerCase() + Math.floor(Math.random() * 1000) : email.split('@')[0],
          email: email,
          password: randomPassword
        });
        await user.save();
      }
    } else {
      // Fallback mode for development/preview when database is offline
      if ((process.env.NODE_ENV || 'development') === 'production') {
        throw new Error('Database connection is not ready and bufferCommands is disabled.');
      }
      
      logger.warn({ email }, 'MongoDB is offline. Using local development fallback user for Google Auth.');
      user = {
        _id: '665000000000000000000002',
        id: '665000000000000000000002',
        username: name ? name.replace(/\s+/g, '').toLowerCase() : email.split('@')[0],
        email: email,
        isFallback: true
      };
    }

    // Sign a custom JWT to match the existing app logic
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    const userResponse = typeof user.toObject === 'function' ? user.toObject() : { ...user };
    delete userResponse.password;

    return successResponse(res, { 
      message: mongoose.connection.readyState === 1 ? 'Firebase Auth successful' : 'Firebase Auth successful (Demo Fallback)', 
      token, 
      user: userResponse 
    }, 200);
  } catch (error) {
    logger.error({ err: error.message, stack: error.stack }, 'Firebase authentication failed');
    
    if (error.code && error.code.startsWith('auth/')) {
      return errorResponse(res, 'Invalid or expired Firebase token', 401, 'INVALID_FIREBASE_TOKEN', [error.message]);
    }
    return errorResponse(res, 'Internal Server Error during Google Auth', 500, 'FIREBASE_AUTH_ERROR', [error.message]);
  }
});

const { protect } = require('../middleware/auth.middleware');
const { sendMail } = require('../services/email.service');
const crypto = require('crypto');

// Forgot Password
router.post('/forgot-password', validateBody({ email: 'string' }), async (req, res) => {
  const email = req.body.email ? req.body.email.trim().toLowerCase() : '';
  if (mongoose.connection.readyState !== 1) {
    return errorResponse(res, 'Database offline. Action unavailable.', 503, 'SERVICE_UNAVAILABLE');
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      // Return 200/success anyway to prevent email enumeration attacks
      return successResponse(res, { message: 'If that email address exists in our database, we have sent a reset password link.' }, 200);
    }

    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${token}`;
    await sendMail({
      to: email,
      subject: 'Reset Your Password - Health Hub',
      html: `<p>You requested a password reset.</p><p>Click the link below to set a new password:</p><p><a href="${resetLink}">${resetLink}</a></p><p>This link is valid for 1 hour. If you did not make this request, you can ignore this email.</p>`
    });

    return successResponse(res, { message: 'If that email address exists in our database, we have sent a reset password link.' }, 200);
  } catch (error) {
    logger.error({ err: error.message, email }, 'Forgot password error');
    return errorResponse(res, 'Error processing request', 500, 'FORGOT_PASSWORD_ERROR');
  }
});

// Reset Password
router.post('/reset-password/:token', validateBody({ password: 'string' }), async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (mongoose.connection.readyState !== 1) {
    return errorResponse(res, 'Database offline. Action unavailable.', 503, 'SERVICE_UNAVAILABLE');
  }

  try {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return errorResponse(res, 'Password reset token is invalid or has expired.', 400, 'INVALID_TOKEN');
    }

    // Set new password (will be hashed in pre-save hook)
    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    // Send confirmation email
    await sendMail({
      to: user.email,
      subject: 'Password Changed Successfully - Health Hub',
      html: `<p>Your password was changed successfully.</p><p>If you did not make this change, please contact support immediately.</p>`
    });

    return successResponse(res, { message: 'Password has been reset successfully.' }, 200);
  } catch (error) {
    logger.error({ err: error.message }, 'Reset password error');
    return errorResponse(res, 'Error resetting password', 500, 'RESET_PASSWORD_ERROR');
  }
});

// Verify Email
router.get('/verify-email/:token', async (req, res) => {
  const { token } = req.params;

  if (mongoose.connection.readyState !== 1) {
    return errorResponse(res, 'Database offline. Action unavailable.', 503, 'SERVICE_UNAVAILABLE');
  }

  try {
    const user = await User.findOne({ emailVerificationToken: token });

    if (!user) {
      return errorResponse(res, 'Invalid or expired verification token.', 400, 'INVALID_VERIFICATION_TOKEN');
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    await user.save();

    return successResponse(res, { message: 'Email verified successfully!' }, 200);
  } catch (error) {
    logger.error({ err: error.message }, 'Verify email error');
    return errorResponse(res, 'Error verifying email', 500, 'VERIFY_EMAIL_ERROR');
  }
});

// Resend Verification Email
router.post('/resend-verification', protect, async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return errorResponse(res, 'Database offline. Action unavailable.', 503, 'SERVICE_UNAVAILABLE');
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return errorResponse(res, 'User not found.', 404, 'USER_NOT_FOUND');
    }

    if (user.isEmailVerified) {
      return errorResponse(res, 'Email is already verified.', 400, 'ALREADY_VERIFIED');
    }

    const token = crypto.randomBytes(32).toString('hex');
    user.emailVerificationToken = token;
    await user.save();

    const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email/${token}`;
    await sendMail({
      to: user.email,
      subject: 'Verify Your Email - Health Hub',
      html: `<p>Please verify your email address by clicking the link below:</p><p><a href="${verificationLink}">${verificationLink}</a></p><p>This link is valid for 24 hours.</p>`
    });

    return successResponse(res, { message: 'Verification email resent successfully.' }, 200);
  } catch (error) {
    logger.error({ err: error.message, userId: req.user.id }, 'Resend verification error');
    return errorResponse(res, 'Error resending verification email', 500, 'RESEND_VERIFICATION_ERROR');
  }
});

// Change Password (Authenticated)
router.post('/change-password', protect, validateBody({ currentPassword: 'string', newPassword: 'string' }), async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (mongoose.connection.readyState !== 1) {
    return errorResponse(res, 'Database offline. Action unavailable.', 503, 'SERVICE_UNAVAILABLE');
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return errorResponse(res, 'User not found.', 404, 'USER_NOT_FOUND');
    }

    const isMatch = await user.validPassword(currentPassword);
    if (!isMatch) {
      return errorResponse(res, 'Incorrect current password.', 400, 'INCORRECT_CURRENT_PASSWORD');
    }

    user.password = newPassword;
    await user.save();

    // Send security notification
    await sendMail({
      to: user.email,
      subject: 'Security Alert: Password Changed - Health Hub',
      html: `<p>Your password was updated.</p><p>If you did not perform this change, please contact support immediately.</p>`
    });

    return successResponse(res, { message: 'Password updated successfully!' }, 200);
  } catch (error) {
    logger.error({ err: error.message, userId: req.user.id }, 'Change password error');
    return errorResponse(res, 'Error changing password', 500, 'CHANGE_PASSWORD_ERROR');
  }
});

module.exports = router;
