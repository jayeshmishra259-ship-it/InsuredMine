const { ScheduledMessage } = require('../models');
const ApiError = require('../utils/api-error');
const { getMessageQueue } = require('../queues/message.queue');
const { resolveScheduledFor } = require('../utils/scheduled-time');

async function scheduleMessage(input) {
  const scheduledFor = resolveScheduledFor(input);
  if (Number.isNaN(scheduledFor.getTime()) || scheduledFor <= new Date()) {
    throw new ApiError(400, 'The scheduled time must be a future date-time');
  }

  const scheduledMessage = await ScheduledMessage.create({ message: input.message, scheduledFor });
  try {
    const queueJob = await getMessageQueue().add(
      'deliver-message',
      { scheduledMessageId: scheduledMessage.id },
      {
        jobId: scheduledMessage.id,
        delay: scheduledFor.getTime() - Date.now(),
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: { age: 7 * 24 * 60 * 60 },
        removeOnFail: { age: 30 * 24 * 60 * 60 }
      }
    );
    scheduledMessage.bullJobId = queueJob.id;
    await scheduledMessage.save();
    return scheduledMessage;
  } catch (error) {
    await ScheduledMessage.findByIdAndUpdate(scheduledMessage._id, {
      status: 'failed',
      failedAt: new Date(),
      $push: { deliveryErrors: { message: error.message, occurredAt: new Date() } }
    });
    throw new ApiError(503, 'Message could not be scheduled because Redis is unavailable');
  }
}

module.exports = { scheduleMessage, resolveScheduledFor };
