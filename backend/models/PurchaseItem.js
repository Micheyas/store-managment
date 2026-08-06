const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PurchaseItem = sequelize.define('PurchaseItem', {
  id:              { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  purchaseOrderId: { type: DataTypes.INTEGER, allowNull: false },
  productId:       { type: DataTypes.INTEGER, allowNull: false },
  quantity:        { type: DataTypes.DECIMAL(12, 3), allowNull: false },
  receivedQty:     { type: DataTypes.DECIMAL(12, 3), allowNull: false, defaultValue: 0 },
  unitCost:        { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  subtotal:        { type: DataTypes.DECIMAL(14, 2), allowNull: false },
});

module.exports = PurchaseItem;
