import mongoose from 'mongoose';

export const connectDatabase = async () => {
  try {
    const connectionString = process.env.MONGODB_CONNECTION_STRING;

    if (!connectionString) {
      throw new Error('MONGODB_CONNECTION_STRING is not defined');
    }

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
