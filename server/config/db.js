const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

let gridfsBucket = null;
let isConnected = false;
let mongoServerInstance = null;

async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/rathore_heritage';

  try {
    // Attempt standard connection first with 3s timeout
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
    });
    isConnected = true;
    console.log(`[MongoDB] Connected to external database: ${mongoose.connection.host}/${mongoose.connection.name}`);
  } catch (err) {
    console.warn(`[MongoDB] Could not connect to configured URI (${uri}): ${err.message}`);
    console.log('[MongoDB] Attempting to launch embedded MongoDB instance for seamless local operation...');

    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const dbPath = path.join(__dirname, '../../.mongo-data');
      if (!fs.existsSync(dbPath)) {
        fs.mkdirSync(dbPath, { recursive: true });
      }

      mongoServerInstance = await MongoMemoryServer.create({
        instance: {
          dbPath: dbPath,
          storageEngine: 'wiredTiger',
        },
      });

      const memoryUri = mongoServerInstance.getUri();
      await mongoose.connect(memoryUri);
      isConnected = true;
      console.log(`[MongoDB] Connected to local embedded MongoDB: ${memoryUri}`);
    } catch (memErr) {
      console.error('[MongoDB] Failed to start embedded MongoDB:', memErr.message);
      isConnected = false;
      throw new Error(`MongoDB connection failed: ${err.message}`);
    }
  }

  // Initialize GridFS bucket
  const db = mongoose.connection.db;
  gridfsBucket = new mongoose.mongo.GridFSBucket(db, {
    bucketName: 'mediaFiles',
  });
  console.log('[MongoDB] GridFS Bucket "mediaFiles" initialized.');

  return mongoose.connection;
}

function getGridFSBucket() {
  if (!gridfsBucket) {
    throw new Error('GridFS bucket is not initialized yet. Ensure MongoDB is connected.');
  }
  return gridfsBucket;
}

function getIsConnected() {
  return isConnected && mongoose.connection.readyState === 1;
}

module.exports = {
  connectDB,
  getGridFSBucket,
  getIsConnected,
};

