const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PurchaseOrder = sequelize.define('PurchaseOrder', {
  id:           { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  orderNumber:  { type: DataTypes.STRING,  allowNull: false, unique: true },
  supplierId:   { type: DataTypes.INTEGER, allowNull: false },
  branchId:     { type: DataTypes.INTEGER, allowNull: false },
  status: {
    type: DataTypes.ENUM('draft', 'sent', 'partially_received', 'received', 'cancelled'),
    defaultValue: 'draft',
  },
  totalAmount:  { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
  notes:        { type: DataTypes.TEXT,    allowNull: true },
  expectedDate: { type: DataTypes.DATEONLY, allowNull: true },
  receivedDate: { type: DataTypes.DATEONLY, allowNull: true },
  userId:       { type: DataTypes.INTEGER, allowNull: true },
});

module.exports = PurchaseOrder;
