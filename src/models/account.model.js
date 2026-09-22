const mongoose = require('mongoose');
const { Schema } = mongoose;
const timestamp = { timestamps: true };

const Account = mongoose.model(
  'Account',
  new Schema(
    { accountName: { type: String, required: true, unique: true, trim: true }, accountType: String },
    timestamp
  )
);

module.exports = Account;
