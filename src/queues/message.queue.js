const { Queue } = require('bullmq');
const { createRedisConnection } = require('../config/redis');

let messageQueue;

function getMessageQueue() {
  if (!messageQueue) {
    messageQueue = new Queue('scheduled-messages', { connection: createRedisConnection() });
  }
  return messageQueue;
}

module.exports = { getMessageQueue };
