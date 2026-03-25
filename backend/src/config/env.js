import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 4000),
  mongodbUri: process.env.MONGODB_URI || '',
  jwtSecret: process.env.JWT_SECRET || '',
  clientOrigin: process.env.CLIENT_ORIGIN || '*',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
};

if (!env.mongodbUri) {
  throw new Error('Missing MONGODB_URI in backend/.env');
}

if (!env.jwtSecret) {
  throw new Error('Missing JWT_SECRET in backend/.env');
}

if (!env.openaiApiKey) {
  console.warn('WARNING: Missing OPENAI_API_KEY in backend/.env — AI features will be unavailable');
}
