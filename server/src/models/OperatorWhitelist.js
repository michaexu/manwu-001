const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OperatorWhitelist = sequelize.define('OperatorWhitelist', {
  id: {
    type: DataTypes.STRING(36),
    primaryKey: true
  },
  phone: {
    type: DataTypes.STRING(20),
    unique: true,
    allowNull: false
  },
  nickname: DataTypes.STRING(50),
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  }
}, {
  tableName: 'operator_whitelist',
  timestamps: true,
  underscored: true
});

module.exports = OperatorWhitelist;
