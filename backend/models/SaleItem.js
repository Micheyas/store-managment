const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SaleItem = sequelize.define('SaleItem', {
  id:        { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  saleId:    { type: DataTypes.INTEGER, allowNull: false },
  productId: { type: DataTypes.INTEGER, allowNull: false },
  quantity:  { type: DataTypes.DECIMAL(12, 3), allowNull: false },
  unitPrice: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  discount:  { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
  subtotal:  { type: DataTypes.DECIMAL(14, 2), allowNull: false },
});

module.exports = SaleItem;
