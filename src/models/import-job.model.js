const mongoose = require('mongoose');
const { Schema } = mongoose;
const timestamp = { timestamps: true };

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

module.exports = ImportJob;
