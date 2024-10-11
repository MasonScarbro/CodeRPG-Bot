const {Schema, model } = require('mongoose');

const UserRoleSchema = new Schema({
    userId: { type: String, required: true },
    roleId: { type: String, required: true },
  });
  

module.exports = model('UserRole', UserRoleSchema);