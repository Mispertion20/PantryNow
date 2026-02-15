import mongoose from 'mongoose';

export const connectToDatabase = async (mongodbUri) => {
  await mongoose.connect(mongodbUri, {
    serverSelectionTimeoutMS: 10000,
  });
};
