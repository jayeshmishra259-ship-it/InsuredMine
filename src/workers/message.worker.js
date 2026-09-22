const { Worker } = require('bullmq');
const { connectDatabase, disconnectDatabase } = require('../config/database');
const { createRedisConnection, connectRedis, disconnectRedis } = require('../config/redis');
const logger = require('../config/logger');
const { ScheduledMessage } = require('../models');

async function deliverMessage(job) {
  const message = await ScheduledMessage.findOneAndUpdate(
    { _id: job.data.scheduledMessageId, status: { $in: ['pending', 'failed'] } },
    { status: 'processing', processingAt: new Date(), $inc: { deliveryAttempts: 1 } },
    { new: true }
  );
  if (!message) {
    return { skipped: true };
  }

  logger.info({ messageId: message.id }, 'Scheduled message is due for delivery');
  await ScheduledMessage.findByIdAndUpdate(message._id, { status: 'sent', sentAt: new Date() });
  return { delivered: true };
}

async function startWorker() {
  await connectDatabase();
  await connectRedis();
  const worker = new Worker('scheduled-messages', deliverMessage, {
    connection: createRedisConnection(),
    concurrency: 10
  });
  worker.on('failed', async (job, error) => {
    if (!job) {
      return;
    }
    await ScheduledMessage.findByIdAndUpdate(job.data.scheduledMessageId, {
      status: 'failed',
      failedAt: new Date(),
      $push: { deliveryErrors: { message: error.message, occurredAt: new Date() } }
    });
    logger.error({ err: error, jobId: job.id }, 'Scheduled message job failed');
  });
  worker.on('error', (error) => logger.error({ err: error }, 'Message worker error'));
  const shutdown = async () => {
    await worker.close();
    await Promise.allSettled([disconnectRedis(), disconnectDatabase()]);
    logger.info('Message worker shut down cleanly');
    process.exit(0);
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startWorker().catch((error) => {
  logger.fatal({ err: error, dependencies: ['MongoDB', 'Redis'] }, 'Unable to start message worker');
  process.exit(1);
});
