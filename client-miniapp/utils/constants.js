/**
 * 常量定义
 */

// 活动状态
const ACTIVITY_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  UNPUBLISHED: 'unpublished',
  ENDED: 'ended'
};

// 活动状态文案
const ACTIVITY_STATUS_TEXT = {
  [ACTIVITY_STATUS.DRAFT]: '草稿',
  [ACTIVITY_STATUS.PUBLISHED]: '进行中',
  [ACTIVITY_STATUS.UNPUBLISHED]: '已下架',
  [ACTIVITY_STATUS.ENDED]: '已结束'
};

// 参与状态
const REGISTRATION_STATUS = {
  REGISTERED: 'registered',
  CLAIMED: 'claimed',
  CANCELLED: 'cancelled'
};

// 参与状态文案
const REGISTRATION_STATUS_TEXT = {
  [REGISTRATION_STATUS.REGISTERED]: '已报名',
  [REGISTRATION_STATUS.CLAIMED]: '已核销',
  [REGISTRATION_STATUS.CANCELLED]: '已取消'
};

// 积分变动类型
const POINTS_TYPE = {
  EARN_AD: 'earn_ad',
  COST_ACTIVITY: 'cost_activity',
  REFUND_CANCEL: 'refund_cancel',
  ADMIN_ADJUST: 'admin_adjust'
};

// 积分变动类型文案
const POINTS_TYPE_TEXT = {
  [POINTS_TYPE.EARN_AD]: '广告奖励',
  [POINTS_TYPE.COST_ACTIVITY]: '活动报名',
  [POINTS_TYPE.REFUND_CANCEL]: '取消退还',
  [POINTS_TYPE.ADMIN_ADJUST]: '管理员调整'
};

module.exports = {
  ACTIVITY_STATUS,
  ACTIVITY_STATUS_TEXT,
  REGISTRATION_STATUS,
  REGISTRATION_STATUS_TEXT,
  POINTS_TYPE,
  POINTS_TYPE_TEXT
};
