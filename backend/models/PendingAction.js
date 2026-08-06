const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Stores IT-submitted actions awaiting Superadmin approval
const PendingAction = sequelize.define('PendingAction', {
  id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  type: {
    type: DataTypes.ENUM('create_user', 'update_user', 'reset_password', 'delete_user'),
    allowNull: false,
  },
  payload:     { type: DataTypes.JSONB,   allowNull: false }, // action data
  submittedBy: { type: DataTypes.INTEGER, allowNull: false }, // IT user id
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending',
  },
  reviewedBy:  { type: DataTypes.INTEGER, allowNull: true },  // superadmin id
  reviewNote:  { type: DataTypes.TEXT,    allowNull: true },
  reviewedAt:  { type: DataTypes.DATE,    allowNull: true },
});

module.exports = PendingAction;
