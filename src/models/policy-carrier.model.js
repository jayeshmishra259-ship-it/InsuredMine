const mongoose = require('mongoose');
const { Schema } = mongoose;
const timestamp = { timestamps: true };

const PolicyCarrier = mongoose.model(
  'PolicyCarrier',
  new Schema({ companyName: { type: String, required: true, unique: true, trim: true } }, timestamp)
);

module.exports = PolicyCarrier;
