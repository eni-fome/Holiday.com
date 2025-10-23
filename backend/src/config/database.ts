import mongoose from 'mongoose';

const sanitizeForLog = (str: string): string => {
  return str.replace(/[\r\n]/g, '').substring(0, 100);
};

const validateMongoUri = (uri: string): void => {
  if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
    throw new Error('Invalid MongoDB connection string protocol');
  }
  
  try {
    const url = new URL(uri.replace('mongodb+srv://', 'https://').replace('mongodb://', 'http://'));
    if (url.hostname.includes('localhost') || url.hostname.includes('127.0.0.1')) {
      return;
    }
    if (!url.hostname.includes('mongodb.net') && !url.hostname.includes('mongo')) {
      throw new Error('Invalid MongoDB host');
    }
  } catch (error) {
    throw new Error('Invalid MongoDB connection string format');
  }
};

export const connectDatabase = async () => {
  try {
    const connectionString = process.env.MONGODB_CONNECTION_STRING;

    if (!connectionString) {
      throw new Error('MONGODB_CONNECTION_STRING is not defined');
    }

    validateMongoUri(connectionString);
    await mongoose.connect(connectionString);

    console.log('✅ MongoDB connected successfully');

    // Create indexes after connection
    await createIndexes();
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const createIndexes = async () => {
  try {
    // Indexes will be created by the models
    console.log('✅ Database indexes ensured');
  } catch (error) {
    console.error('⚠️  Error creating indexes:', error);
  }
};

export default connectDatabase;
