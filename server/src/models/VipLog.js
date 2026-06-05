const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const VipLog = sequelize.define('VipLog', {
  id: {
    type: DataTypes.STRING(36),
    primaryKey: true
  },
  memberId: {
    type: DataTypes.STRING(36),
    allowNull: false,
    field: 'member_id'
  },
  action: {
    type: DataTypes.ENUM('grant', 'revoke'),
    allowNull: false
  },
  operatorId: {
    type: DataTypes.STRING(36),
    field: 'operator_id'
  }
}, {
  tableName: 'vip_logs',
  timestamps: true,
  underscored: true
});

module.exports = VipLog;
