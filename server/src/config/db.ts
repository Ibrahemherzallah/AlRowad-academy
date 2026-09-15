import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

export async function connectDB(): Promise<void> {
  mongoose.set('strictQuery', true);

  try {
    await mongoose.connect(env.MONGO_URI, {
      autoIndex: env.NODE_ENV !== 'production',
    });
    logger.info('✅ MongoDB connected');
  } catch (err) {
    logger.error('❌ MongoDB connection error', err);
    process.exit(1);
  }

  mongoose.connection.on('disconnected', () => {
    logger.warn('⚠️  MongoDB disconnected');
  });
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
}
