import mongoose from 'mongoose';
import { config } from './config.js';
import app from './app.js';

try {
  await mongoose.connect(config.mongoUri);
  console.log('MongoDB connected');
} catch (err) {
  console.error('Could not connect to MongoDB:', err.message);
  process.exit(1);
}

const server = app.listen(config.port, () => console.log(`API listening on port ${config.port}`));

const shutdown = () => {
  server.close(async () => {
    await mongoose.disconnect();
    process.exit(0);
  });
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
