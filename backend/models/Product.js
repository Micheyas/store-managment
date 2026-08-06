const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define('Product', {
  id:           { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name:         { type: DataTypes.STRING,  allowNull: false },
  sku:          { type: DataTypes.STRING,  allowNull: true, unique: true },
  barcode:      { type: DataTypes.STRING,  allowNull: true },
  description:  { type: DataTypes.TEXT,    allowNull: true },
  image:        { type: DataTypes.STRING,  allowNull: true },
  unit:         { type: DataTypes.STRING,  allowNull: true, defaultValue: 'pcs' },
  costPrice:    { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
  sellingPrice: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
  taxRate:      { type: DataTypes.DECIMAL(5, 2),  allowNull: true,  defaultValue: 0 },
  categoryId:   { type: DataTypes.INTEGER, allowNull: true },
  supplierId:   { type: DataTypes.INTEGER, allowNull: true },
  isActive:     { type: DataTypes.BOOLEAN, defaultValue: true },
});

module.exports = Product;
