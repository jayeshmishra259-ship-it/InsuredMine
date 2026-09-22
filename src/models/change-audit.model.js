const mongoose = require('mongoose');
const { Schema } = mongoose;
const timestamp = { timestamps: true };

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

module.exports = ChangeAudit;
