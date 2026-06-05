const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CheckIn = sequelize.define('CheckIn', {
  id: {
    type: DataTypes.STRING(36),
    primaryKey: true
  },
  memberId: {
    type: DataTypes.STRING(36),
    allowNull: false,
    field: 'member_id'
  },
  checkinDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'checkin_date'
  },
  pointsEarned: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    field: 'points_earned'
  }
}, {
  tableName: 'check_ins',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['member_id', 'checkin_date']
    }
  ]
});

module.exports = CheckIn;
