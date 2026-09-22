const { scheduleMessage } = require('../services/message.service');
const { sendSuccess } = require('../utils/api-response');

async function createScheduledMessage(req, res) {
  const scheduledMessage = await scheduleMessage(req.validated.body);
  return sendSuccess(res, {
    statusCode: 201,
    message: 'Message scheduled successfully',
    data: {
      id: scheduledMessage.id,
      status: scheduledMessage.status,
      scheduledFor: scheduledMessage.scheduledFor
    }
  });
}

module.exports = { createScheduledMessage };
