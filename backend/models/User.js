const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id:       { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name:     { type: DataTypes.STRING,  allowNull: false },
  email:    { type: DataTypes.STRING,  allowNull: false, unique: true },
  password: { type: DataTypes.STRING,  allowNull: false },
  role: {
    // owner = superadmin, manager = admin/warehouse, cashier = cashier, it = IT dept
    type: DataTypes.ENUM('owner', 'manager', 'cashier', 'it'),
    defaultValue: 'cashier',
  },
  branchId: { type: DataTypes.INTEGER, allowNull: true },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
});

module.exports = User;
