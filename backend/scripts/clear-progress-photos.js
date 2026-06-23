require('dotenv').config();
const mongoose = require('mongoose');
const BodyProgress = require('../models/BodyProgress');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not defined.');
  process.exit(1);
}

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('Database connected successfully.');
    // Clear all progress photo URLs containing giphy.com
    const result = await BodyProgress.updateMany(
      { progressPhotoUrl: { $regex: 'giphy\\.com', $options: 'i' } },
      { $set: { progressPhotoUrl: '' } }
    );
    console.log(`Cleaned up ${result.modifiedCount} progress entries with broken Giphy photo URLs.`);
    process.exit(0);
  })
  .catch(err => {
    console.error('Database connection error:', err);
    process.exit(1);
  });
