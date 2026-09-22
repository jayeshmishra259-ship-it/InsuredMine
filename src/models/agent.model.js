const mongoose = require('mongoose');
const { Schema } = mongoose;
const timestamp = { timestamps: true };

module.exports = mongoose.model(
  'Agent',
  new Schema(
    { name: { type: String, required: true, unique: true, trim: true }, agencyId: String },
    timestamp
  )
);
