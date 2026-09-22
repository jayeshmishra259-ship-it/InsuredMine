const path = require('path');
require('dotenv').config();

const root = path.resolve(__dirname, '../..');
const config = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3000),
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/policy_import',
  redisUrl: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  uploadDir: path.resolve(root, process.env.UPLOAD_DIR || 'uploads'),
  maxFileSize: Number(process.env.MAX_FILE_SIZE_BYTES || 10 * 1024 * 1024),
  cpuThreshold: Number(process.env.CPU_THRESHOLD || 70),
  cpuInterval: Number(process.env.CPU_CHECK_INTERVAL_MS || 5000),
  restartOnHighCpu: process.env.RESTART_ON_HIGH_CPU === 'true',
  corsOrigins: (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
};

function validateEnvironment() {
  if (config.env !== 'production') {
    return;
  }

  const missing = ['MONGODB_URI', 'REDIS_URL', 'CORS_ORIGINS'].filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing required production environment variables: ${missing.join(', ')}`);
  }
}

validateEnvironment();
module.exports = config;
