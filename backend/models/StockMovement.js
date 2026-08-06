const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StockMovement = sequelize.define('StockMovement', {
  id:         { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  productId:  { type: DataTypes.INTEGER, allowNull: false },
  branchId:   { type: DataTypes.INTEGER, allowNull: false },
  type: {
    type: DataTypes.ENUM('in', 'out', 'transfer_in', 'transfer_out', 'adjustment', 'sale', 'purchase'),
    allowNull: false,
  },
  quantity:         { type: DataTypes.DECIMAL(12, 3), allowNull: false },
  balanceBefore:    { type: DataTypes.DECIMAL(12, 3), allowNull: true },
  balanceAfter:     { type: DataTypes.DECIMAL(12, 3), allowNull: true },
  referenceId:      { type: DataTypes.INTEGER, allowNull: true },  // saleId or purchaseOrderId
  referenceType:    { type: DataTypes.STRING,  allowNull: true },  // 'sale' | 'purchase' | 'manual'
  note:             { type: DataTypes.TEXT,    allowNull: true },
  userId:           { type: DataTypes.INTEGER, allowNull: true },
});

module.exports = StockMovement;
