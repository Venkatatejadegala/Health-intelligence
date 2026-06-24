const admin = require('firebase-admin');

// Parse the private key from environment variables (replacing escaped newlines for string representation)
const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n').replace(/^"|"$/g, '')
    : undefined;

const logger = require('../utils/logger');

if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
    logger.warn('Firebase environment variables are missing. Firebase Admin SDK might not initialize correctly.');
}

try {
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: privateKey
            }),
        });
        logger.info('Firebase Admin SDK initialized successfully');
    }
} catch (error) {
    logger.error({ err: error.message }, 'Error initializing Firebase Admin SDK');
}

module.exports = admin;
