const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Branch = sequelize.define('Branch', {
  id:       { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name:     { type: DataTypes.STRING,  allowNull: false },
  location: { type: DataTypes.STRING,  allowNull: true },
  phone:    { type: DataTypes.STRING,  allowNull: true },
  email:    { type: DataTypes.STRING,  allowNull: true },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
});

module.exports = Branch;
