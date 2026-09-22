const mongoose = require('mongoose');
const { Schema } = mongoose;
const timestamp = { timestamps: true };

const PolicyCategory = mongoose.model(
  'PolicyCategory',
  new Schema({ categoryName: { type: String, required: true, unique: true, trim: true } }, timestamp)
);

module.exports = PolicyCategory;
