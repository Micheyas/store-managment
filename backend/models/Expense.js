const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Expense = sequelize.define('Expense', {
  id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title:       { type: DataTypes.STRING,  allowNull: false },
  amount:      { type: DataTypes.DECIMAL(14, 2), allowNull: false },
  category: {
    type: DataTypes.ENUM('rent','salary','utilities','supplies','maintenance','marketing','other'),
    defaultValue: 'other',
  },
  paymentMethod: { type: DataTypes.ENUM('cash','card','mobile','bank'), defaultValue: 'cash' },
  branchId:    { type: DataTypes.INTEGER, allowNull: true },
  userId:      { type: DataTypes.INTEGER, allowNull: false },
  note:        { type: DataTypes.TEXT,    allowNull: true },
  expenseDate: { type: DataTypes.DATEONLY, allowNull: false, defaultValue: DataTypes.NOW },
});

module.exports = Expense;
