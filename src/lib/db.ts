import mongoose, { Mongoose } from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fakeapi';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

// Declare and type global.mongoose
declare global {
  var mongoose: {
    conn: Mongoose | null;
    promise: Promise<Mongoose> | null;
  } | undefined;
}

// Use globalThis to avoid scope issues and ensure type safety
const globalWithMongoose = globalThis as typeof globalThis & {
  mongoose?: {
    conn: Mongoose | null;
    promise: Promise<Mongoose> | null;
  };
};

if (!globalWithMongoose.mongoose) {
  globalWithMongoose.mongoose = { conn: null, promise: null };
}

const cached = globalWithMongoose.mongoose;

async function connectDB(): Promise<Mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      // Connection Pool Settings (Critical for Scale)
      maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE || '10'), // Max connections per serverless instance
      minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE || '2'),  // Keep minimum connections warm
      maxIdleTimeMS: parseInt(process.env.MONGODB_MAX_IDLE_TIME_MS || '10000'), // Close idle connections after 10s
      serverSelectionTimeoutMS: parseInt(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || '5000'), // Fail fast if MongoDB is down
      socketTimeoutMS: parseInt(process.env.MONGODB_SOCKET_TIMEOUT_MS || '45000'), // Socket timeout
      // Retry Logic
      retryWrites: process.env.MONGODB_RETRY_WRITES !== 'false', // Default: true
      retryReads: process.env.MONGODB_RETRY_READS !== 'false',   // Default: true
      // Compression (Reduces bandwidth)
      compressors: ['zlib'] as ('zlib' | 'none' | 'snappy' | 'zstd')[],
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts);
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;
