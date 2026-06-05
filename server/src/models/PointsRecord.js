const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PointsRecord = sequelize.define('PointsRecord', {
  id: {
    type: DataTypes.STRING(36),
    primaryKey: true
  },
  memberId: {
    type: DataTypes.STRING(36),
    allowNull: false,
    field: 'member_id'
  },
  changeType: {
    type: DataTypes.ENUM('earn_ad', 'cost_activity', 'refund_cancel', 'admin_adjust'),
    allowNull: false,
    field: 'change_type'
  },
  changeAmount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'change_amount'
  },
  balanceAfter: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'balance_after'
  },
  refId: {
    type: DataTypes.STRING(36),
    field: 'ref_id'
  },
  remark: DataTypes.STRING(200)
}, {
  tableName: 'points_records',
  timestamps: true,
  underscored: true
});

module.exports = PointsRecord;
