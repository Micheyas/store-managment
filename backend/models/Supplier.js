const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Supplier = sequelize.define('Supplier', {
  id:      { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name:    { type: DataTypes.STRING,  allowNull: false },
  phone:   { type: DataTypes.STRING,  allowNull: true },
  email:   { type: DataTypes.STRING,  allowNull: true },
  address: { type: DataTypes.TEXT,    allowNull: true },
  notes:   { type: DataTypes.TEXT,    allowNull: true },
  isActive:{ type: DataTypes.BOOLEAN, defaultValue: true },
});

module.exports = Supplier;
