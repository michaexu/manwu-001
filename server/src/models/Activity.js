const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Activity = sequelize.define('Activity', {
  id: {
    type: DataTypes.STRING(36),
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  coverImage: {
    type: DataTypes.STRING(500),
    field: 'cover_image'
  },
  prizeDesc: {
    type: DataTypes.TEXT,
    field: 'prize_desc'
  },
  location: DataTypes.STRING(200),
  startTime: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'start_time'
  },
  endTime: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'end_time'
  },
  maxParticipants: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'max_participants'
  },
  vipQuota: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'vip_quota'
  },
  regularQuota: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'regular_quota'
  },
  pointsRequired: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'points_required'
  },
  description: DataTypes.TEXT,
  status: {
    type: DataTypes.ENUM('draft', 'published', 'unpublished', 'ended'),
    defaultValue: 'draft'
  },
  currentCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'current_count'
  },
  vipCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'vip_count'
  },
  regularCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'regular_count'
  },
  createdBy: {
    type: DataTypes.STRING(36),
    field: 'created_by'
  }
}, {
  tableName: 'activities',
  timestamps: true,
  underscored: true
});

module.exports = Activity;
