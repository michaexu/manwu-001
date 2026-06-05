const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MessageTemplate = sequelize.define('MessageTemplate', {
  id: {
    type: DataTypes.STRING(36),
    primaryKey: true
  },
  type: {
    type: DataTypes.ENUM('signup_success', 'activity_reminder', 'claim_success'),
    unique: true,
    allowNull: false
  },
  templateId: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'template_id'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  }
}, {
  tableName: 'message_templates',
  timestamps: true,
  underscored: true
});

module.exports = MessageTemplate;
