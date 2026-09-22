const IORedis = require('ioredis');
const { redisUrl } = require('./env');
const logger = require('./logger');

let applicationConnection;

function createRedisConnection() {
  const connection = new IORedis(redisUrl, { lazyConnect: true, maxRetriesPerRequest: null });
  connection.on('error', (error) => logger.error({ err: error }, 'Redis connection error'));
  return connection;
}

async function connectRedis() {
  if (!applicationConnection) {
    applicationConnection = createRedisConnection();
    applicationConnection.on('connect', () => logger.info({ redisUrl }, 'Redis connected'));
    applicationConnection.on('close', () => logger.warn('Redis disconnected'));
  }
  if (applicationConnection.status !== 'ready') {
    await applicationConnection.connect();
  }
  await applicationConnection.ping();
}

function isRedisConnected() {
  return applicationConnection?.status === 'ready';
}

async function disconnectRedis() {
  if (applicationConnection) {
    await applicationConnection.quit();
    applicationConnection = undefined;
  }
}

module.exports = { createRedisConnection, connectRedis, disconnectRedis, isRedisConnected };
