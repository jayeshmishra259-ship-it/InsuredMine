const mongoose = require('mongoose');
const { Schema } = mongoose;
const timestamp = { timestamps: true };

const Agent = mongoose.model(
  'Agent',
  new Schema(
    { name: { type: String, required: true, unique: true, trim: true }, agencyId: String },
    timestamp
  )
);
const User = mongoose.model(
  'User',
  new Schema(
    {
      firstName: String,
      dob: Date,
      address: String,
      phone: String,
      state: String,
      zip: String,
      email: String,
      gender: String,
      userType: String,
      city: String,
      applicantId: String,
      identityKey: { type: String, required: true, unique: true },
      agentId: { type: Schema.Types.ObjectId, ref: 'Agent' }
    },
    timestamp
  )
);
User.schema.index({ firstName: 1 });
User.schema.index({ email: 1 });
User.schema.index({ phone: 1 });
const Account = mongoose.model(
  'Account',
  new Schema(
    { accountName: { type: String, required: true, unique: true, trim: true }, accountType: String },
    timestamp
  )
);
const PolicyCategory = mongoose.model(
  'PolicyCategory',
  new Schema({ categoryName: { type: String, required: true, unique: true, trim: true } }, timestamp)
);
const PolicyCarrier = mongoose.model(
  'PolicyCarrier',
  new Schema({ companyName: { type: String, required: true, unique: true, trim: true } }, timestamp)
);
const Policy = mongoose.model(
  'Policy',
  new Schema(
    {
      policyNumber: { type: String, required: true, unique: true },
      policyStartDate: Date,
      policyEndDate: Date,
      policyCategoryId: { type: Schema.Types.ObjectId, ref: 'PolicyCategory' },
      carrierId: { type: Schema.Types.ObjectId, ref: 'PolicyCarrier' },
      userId: { type: Schema.Types.ObjectId, ref: 'User' },
      accountId: { type: Schema.Types.ObjectId, ref: 'Account' },
      premiumAmount: Number,
      premiumAmountWritten: Number,
      policyType: String,
      mode: String,
      producer: String,
      csr: String,
      primary: String,
      hasActiveClientPolicy: String,
      sourceImportId: { type: Schema.Types.ObjectId, ref: 'ImportJob', index: true },
      sourceRow: Number,
      rowHash: { type: String, index: true },
      sourceFields: [{ name: { type: String, required: true }, value: Schema.Types.Mixed }],
      importHistory: [
        {
          importJobId: { type: Schema.Types.ObjectId, ref: 'ImportJob' },
          sourceRow: Number,
          action: String,
          importedAt: Date
        }
      ]
    },
    timestamp
  )
);
Policy.schema.index({ userId: 1, policyStartDate: -1 });
Policy.schema.index({ policyCategoryId: 1 });
Policy.schema.index({ carrierId: 1 });
const ImportJob = mongoose.model(
  'ImportJob',
  new Schema(
    {
      originalName: String,
      storedName: String,
      storagePath: String,
      mimeType: String,
      fileSize: Number,
      fileHash: { type: String, index: true },
      sourceHeaders: [String],
      duplicateOf: { type: Schema.Types.ObjectId, ref: 'ImportJob' },
      status: {
        type: String,
        enum: ['queued', 'processing', 'completed', 'failed', 'duplicate'],
        default: 'queued'
      },
      stats: {
        totalRows: { type: Number, default: 0 },
        successfulRows: { type: Number, default: 0 },
        failedRows: { type: Number, default: 0 },
        skippedRows: { type: Number, default: 0 },
        duplicateRows: { type: Number, default: 0 },
        errors: [{ row: Number, reason: String }]
      },
      error: String
    },
    timestamp
  )
);
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
const ChangeAudit = mongoose.model(
  'ChangeAudit',
  new Schema(
    {
      entityType: { type: String, required: true },
      entityId: { type: Schema.Types.ObjectId, required: true, index: true },
      policyNumber: { type: String, index: true },
      importJobId: { type: Schema.Types.ObjectId, ref: 'ImportJob', required: true, index: true },
      sourceFileName: String,
      sourceRow: Number,
      changes: [{ field: String, oldValue: Schema.Types.Mixed, newValue: Schema.Types.Mixed }]
    },
    timestamp
  )
);
module.exports = {
  Agent,
  User,
  Account,
  PolicyCategory,
  PolicyCarrier,
  Policy,
  ImportJob,
  ScheduledMessage,
  ChangeAudit
};
