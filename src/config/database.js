const mongoose = require('mongoose');
const logger = require('./logger');
const { mongoUri } = require('./env');

mongoose.set('strictQuery', true);
mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
mongoose.connection.on('error', (error) => logger.error({ err: error }, 'MongoDB connection error'));

async function connectDatabase(uri = mongoUri) {
  if (mongoose.connection.readyState === 1) {
    return;
  }
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 });
  logger.info({ database: mongoose.connection.name, host: mongoose.connection.host }, 'MongoDB connected');
}

async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

function isDatabaseConnected() {
  return mongoose.connection.readyState === 1;
}
module.exports = { connectDatabase, disconnectDatabase, isDatabaseConnected };
