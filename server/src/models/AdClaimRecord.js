const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AdClaimRecord = sequelize.define('AdClaimRecord', {
  id: {
    type: DataTypes.STRING(36),
    primaryKey: true
  },
  memberId: {
    type: DataTypes.STRING(36),
    allowNull: false,
    field: 'member_id'
  },
  adId: {
    type: DataTypes.STRING(36),
    allowNull: false,
    field: 'ad_id'
  },
  claimedDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'claimed_date'
  }
}, {
  tableName: 'ad_claim_records',
  timestamps: true,
  underscored: true
});

module.exports = AdClaimRecord;
