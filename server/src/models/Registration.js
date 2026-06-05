const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Registration = sequelize.define('Registration', {
  id: {
    type: DataTypes.STRING(36),
    primaryKey: true
  },
  memberId: {
    type: DataTypes.STRING(36),
    allowNull: false,
    field: 'member_id'
  },
  activityId: {
    type: DataTypes.STRING(36),
    allowNull: false,
    field: 'activity_id'
  },
  qrToken: {
    type: DataTypes.STRING(128),
    unique: true,
    allowNull: false,
    field: 'qr_token'
  },
  pointsCost: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'points_cost'
  },
  status: {
    type: DataTypes.ENUM('registered', 'claimed', 'cancelled'),
    defaultValue: 'registered'
  },
  claimedAt: {
    type: DataTypes.DATE,
    field: 'claimed_at'
  },
  claimedBy: {
    type: DataTypes.STRING(36),
    field: 'claimed_by'
  },
  cancelledAt: {
    type: DataTypes.DATE,
    field: 'cancelled_at'
  }
}, {
  tableName: 'registrations',
  timestamps: true,
  underscored: true
});

module.exports = Registration;
