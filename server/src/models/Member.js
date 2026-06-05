const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Member = sequelize.define('Member', {
  id: {
    type: DataTypes.STRING(36),
    primaryKey: true
  },
  openid: {
    type: DataTypes.STRING(64),
    unique: true,
    allowNull: false
  },
  nickname: DataTypes.STRING(50),
  avatarUrl: {
    type: DataTypes.STRING(500),
    field: 'avatar_url'
  },
  phone: DataTypes.STRING(20),
  memberType: {
    type: DataTypes.ENUM('regular', 'vip'),
    defaultValue: 'regular',
    field: 'member_type'
  },
  pointsBalance: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'points_balance'
  }
}, {
  tableName: 'members',
  timestamps: true,
  underscored: true
});

module.exports = Member;
