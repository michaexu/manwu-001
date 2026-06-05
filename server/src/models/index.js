const Member = require('./Member');
const Activity = require('./Activity');
const Registration = require('./Registration');
const PointsRecord = require('./PointsRecord');
const Ad = require('./Ad');
const AdClaimRecord = require('./AdClaimRecord');
const VipLog = require('./VipLog');
const OperatorWhitelist = require('./OperatorWhitelist');
const MessageTemplate = require('./MessageTemplate');
const CheckIn = require('./CheckIn');

// Member → Registrations (1:N)
Member.hasMany(Registration, { foreignKey: 'memberId' });
Registration.belongsTo(Member, { foreignKey: 'memberId' });

// Activity → Registrations (1:N)
Activity.hasMany(Registration, { foreignKey: 'activityId' });
Registration.belongsTo(Activity, { foreignKey: 'activityId' });

// Member → PointsRecords (1:N)
Member.hasMany(PointsRecord, { foreignKey: 'memberId' });
PointsRecord.belongsTo(Member, { foreignKey: 'memberId' });

// Member → AdClaimRecords (1:N)
Member.hasMany(AdClaimRecord, { foreignKey: 'memberId' });
AdClaimRecord.belongsTo(Member, { foreignKey: 'memberId' });

// Ad → AdClaimRecords (1:N)
Ad.hasMany(AdClaimRecord, { foreignKey: 'adId' });
AdClaimRecord.belongsTo(Ad, { foreignKey: 'adId' });

// Member → VipLogs (1:N)
Member.hasMany(VipLog, { foreignKey: 'memberId' });
VipLog.belongsTo(Member, { foreignKey: 'memberId' });

// Member → CheckIns (1:N)
Member.hasMany(CheckIn, { foreignKey: 'memberId' });
CheckIn.belongsTo(Member, { foreignKey: 'memberId' });

module.exports = {
  Member,
  Activity,
  Registration,
  PointsRecord,
  Ad,
  AdClaimRecord,
  VipLog,
  OperatorWhitelist,
  MessageTemplate,
  CheckIn
};
