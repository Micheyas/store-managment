const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Stock = sequelize.define('Stock', {
  id:                { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  productId:         { type: DataTypes.INTEGER, allowNull: false },
  branchId:          { type: DataTypes.INTEGER, allowNull: false },
  quantity:          { type: DataTypes.DECIMAL(12, 3), allowNull: false, defaultValue: 0 },
  lowStockThreshold: { type: DataTypes.DECIMAL(12, 3), allowNull: false, defaultValue: 10 },
});

module.exports = Stock;
