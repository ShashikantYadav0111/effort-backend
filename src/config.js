import 'dotenv/config';

function need(key) {
  const v = process.env[key];
  if (!v) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
  return v;
}

export const config = {
  port: Number(process.env.PORT) || 4000,
  mongoUri: need('MONGODB_URI'),
  jwtSecret: need('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '90d',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  allowRegistration: (process.env.ALLOW_REGISTRATION ?? 'true').toLowerCase() !== 'false',
};

if (config.jwtSecret.length < 16) {
  console.error('JWT_SECRET must be at least 16 characters long.');
  process.exit(1);
}
