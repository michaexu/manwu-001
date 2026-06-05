const config = require('../config');
const { MessageTemplate, Member } = require('../models');
const WeChatService = require('./wechat');

/**
 * 消息通知服务（微信订阅消息）
 */
class NotificationService {
  /**
   * 发送报名成功通知
   */
  async sendSignupSuccess(openid, activity, signupTime) {
    const template = await MessageTemplate.findOne({
      where: { type: 'signup_success', isActive: true }
    });
    if (!template) return;

    try {
      await WeChatService.sendSubscribeMessage(
        config.wechat.customer.appId,
        openid,
        template.templateId,
        {
          thing1: { value: activity.title },
          thing2: { value: activity.location },
          time3: { value: this.formatTime(signupTime) }
        },
        'pages/my-participations/my-participations'
      );
    } catch (err) {
      console.error('[通知] 报名成功通知发送失败:', err.message);
    }
  }

  /**
   * 发送活动提醒（开始前 2 小时）
   */
  async sendActivityReminder(openid, activity) {
    const template = await MessageTemplate.findOne({
      where: { type: 'activity_reminder', isActive: true }
    });
    if (!template) return;

    try {
      await WeChatService.sendSubscribeMessage(
        config.wechat.customer.appId,
        openid,
        template.templateId,
        {
          thing2: { value: activity.title },
          thing1: { value: activity.location },
          time3: { value: this.formatTime(activity.startTime) }
        },
        'pages/my-participations/my-participations'
      );
    } catch (err) {
      console.error('[通知] 活动提醒发送失败:', err.message);
    }
  }

  /**
   * 发送核销成功通知
   */
  async sendClaimSuccess(openid, activity, claimedAt) {
    const template = await MessageTemplate.findOne({
      where: { type: 'claim_success', isActive: true }
    });
    if (!template) return;

    try {
      await WeChatService.sendSubscribeMessage(
        config.wechat.customer.appId,
        openid,
        template.templateId,
        {
          thing1: { value: activity.title },
          thing2: { value: activity.prizeDesc || '奖品' },
          time3: { value: this.formatTime(claimedAt) },
          thing4: { value: activity.location }
        },
        'pages/my-participations/my-participations'
      );
    } catch (err) {
      console.error('[通知] 核销成功通知发送失败:', err.message);
    }
  }

  formatTime(date) {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  }
}

module.exports = new NotificationService();
