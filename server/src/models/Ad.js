const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Ad = sequelize.define('Ad', {
  id: {
    type: DataTypes.STRING(36),
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  adUnitId: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'ad_unit_id'
  },
  pointsReward: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'points_reward'
  },
  dailyLimit: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    field: 'daily_limit'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  }
}, {
  tableName: 'ads',
  timestamps: true,
  underscored: true
});

module.exports = Ad;
