const mongoose = require('mongoose');
const { Schema } = mongoose;
const timestamp = { timestamps: true };

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

module.exports = User;
