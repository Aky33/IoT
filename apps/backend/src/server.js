import mongoose from 'mongoose';

import { config } from './config/index.js';
import { createApp } from './app.js';

async function start() {
  await mongoose.connect(config.mongoUri);
  console.log(`[db] connected to ${config.mongoUri}`);

  const app = createApp();
  const server = app.listen(config.port, () => {
    console.log(`[server] listening on http://localhost:${config.port}`);
  });

  const shutdown = async (signal) => {
    console.log(`\n[server] received ${signal}, shutting down`);
    server.close();
    await mongoose.disconnect();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start().catch((err) => {
  console.error('[server] fatal error during startup:', err);
  process.exit(1);
});
