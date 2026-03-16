const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const adminSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  officeEmail: {
    type: String,
  },
  password: {
    type: String,
  },
  role: {type: String,},
  adminType: {
    type: String,
  }
});

adminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;
