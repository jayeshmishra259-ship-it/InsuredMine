const mongoose = require('mongoose');
const { Schema } = mongoose;
const timestamp = { timestamps: true };

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

module.exports = Policy;
