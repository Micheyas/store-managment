const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Currency = sequelize.define('Currency', {
  id:        { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  code:      { type: DataTypes.STRING(10), allowNull: false, unique: true },
  name:      { type: DataTypes.STRING, allowNull: false },
  symbol:    { type: DataTypes.STRING(10), allowNull: false },
  rate:      { type: DataTypes.DECIMAL(14, 6), allowNull: false, defaultValue: 1 }, // vs ETB base
  isBase:    { type: DataTypes.BOOLEAN, defaultValue: false },
  isActive:  { type: DataTypes.BOOLEAN, defaultValue: true },
});

module.exports = Currency;
