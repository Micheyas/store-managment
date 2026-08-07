const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ActivityLog = sequelize.define('ActivityLog', {
  id:         { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId:     { type: DataTypes.INTEGER, allowNull: false },
  action:     { type: DataTypes.STRING,  allowNull: false }, // e.g. 'create_product'
  entity:     { type: DataTypes.STRING,  allowNull: true  }, // e.g. 'Product'
  entityId:   { type: DataTypes.INTEGER, allowNull: true  },
  detail:     { type: DataTypes.TEXT,    allowNull: true  }, // human-readable description
  ip:         { type: DataTypes.STRING,  allowNull: true  },
}, { updatedAt: false });

module.exports = ActivityLog;
