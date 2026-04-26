import 'dotenv/config';

const mongoHostPort = process.env.MONGO_HOST_PORT || '27019';
const mongoDbName = process.env.MONGO_DB_NAME || 'iot-care';
const mongoUri = process.env.MONGODB_URI || `mongodb://localhost:${mongoHostPort}/${mongoDbName}`;

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export const config = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri,
  jwt: {
    accessSecret: required('JWT_ACCESS_SECRET'),
    refreshSecret: required('JWT_REFRESH_SECRET'),
    accessExpires: process.env.JWT_ACCESS_EXPIRES || '15m',
    refreshExpires: process.env.JWT_REFRESH_EXPIRES || '7d',
  },
};
