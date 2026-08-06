const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Sale = sequelize.define('Sale', {
  id:            { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  invoiceNumber: { type: DataTypes.STRING,  allowNull: false, unique: true },
  branchId:      { type: DataTypes.INTEGER, allowNull: false },
  userId:        { type: DataTypes.INTEGER, allowNull: false },
  subtotal:      { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
  discount:      { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
  tax:           { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
  totalAmount:   { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
  amountPaid:    { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
  change:        { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
  paymentMethod: {
    type: DataTypes.ENUM('cash', 'card', 'mobile', 'credit', 'other'),
    defaultValue: 'cash',
  },
  currency:      { type: DataTypes.STRING,  allowNull: false, defaultValue: 'ETB' },
  exchangeRate:  { type: DataTypes.DECIMAL(12, 6), allowNull: false, defaultValue: 1 },
  status: {
    type: DataTypes.ENUM('completed', 'refunded', 'voided'),
    defaultValue: 'completed',
  },
  notes:         { type: DataTypes.TEXT, allowNull: true },
  customerId:    { type: DataTypes.INTEGER, allowNull: true },
});

module.exports = Sale;
