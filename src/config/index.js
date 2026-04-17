import 'dotenv/config';

const mongoHostPort = process.env.MONGO_HOST_PORT || '27019';
const mongoDbName = process.env.MONGO_DB_NAME || 'iot-care';
const mongoUri = process.env.MONGODB_URI || `mongodb://localhost:${mongoHostPort}/${mongoDbName}`;

export const config = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri,
};
