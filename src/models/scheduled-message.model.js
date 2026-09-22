const mongoose = require('mongoose');
const { Schema } = mongoose;
const timestamp = { timestamps: true };

const ScheduledMessage = mongoose.model(
  'ScheduledMessage',
  new Schema(
    {
      message: { type: String, required: true },
      scheduledFor: { type: Date, required: true, index: true },
      bullJobId: { type: String, index: true },
      status: { type: String, enum: ['pending', 'processing', 'sent', 'failed'], default: 'pending' },
      deliveryAttempts: { type: Number, default: 0 },
      deliveryErrors: [{ message: String, occurredAt: Date }],
      processingAt: Date,
      sentAt: Date,
      failedAt: Date
    },
    timestamp
  )
);

module.exports = ScheduledMessage;
