/**
 * 订阅消息服务
 * 管理微信订阅消息模板、用户授权、消息发送
 */
const axios = require('axios');
const config = require('../config');
const db = require('../models/db');
const { ConflictError } = require('../utils/errors');

const subscriptionService = {
  /**
   * 记录用户订阅授权
   * 在小程序端 wx.requestSubscribeMessage 回调后调用
   */
  async recordSubscription(userId, acceptMap) {
    // acceptMap: { templateId: 'accept' | 'reject' | 'ban' }
    const templateIds = Object.keys(acceptMap);

    for (const templateId of templateIds) {
      const accepted = acceptMap[templateId] === 'accept';

      // 获取模板的场景信息
      const templateResult = await db.query(
        'SELECT scene FROM subscription_templates WHERE template_id = $1',
        [templateId]
      );

      if (templateResult.rows.length === 0) continue;

      const scene = templateResult.rows[0].scene;

      // 插入或更新订阅记录
      await db.query(
        `INSERT INTO user_subscriptions (user_id, template_id, scene, accepted, subscribed_at)
         VALUES (?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE accepted = VALUES(accepted), subscribed_at = NOW()`,
        [userId, templateId, scene, accepted]
      );
    }

    return { success: true };
  },

  /**
   * 发送订阅消息
   * @param {string} userId - 接收用户ID
   * @param {string} scene - 场景 (activity_remind / redeem_success / checkin_remind)
   * @param {object} data - 消息内容（需匹配微信模板字段）
   * @param {string} page - 点击跳转的小程序页面路径
   */
  async sendMessage(userId, scene, data, page = '') {
    // 查找该场景的模板
    const templateResult = await db.query(
      'SELECT template_id, name FROM subscription_templates WHERE scene = $1 AND status = $2',
      [scene, 'active']
    );

    if (templateResult.rows.length === 0) {
      console.warn(`[Subscription] 未找到场景 ${scene} 的模板`);
      return { sent: false, reason: 'no_template' };
    }

    const { template_id } = templateResult.rows[0];

    // 检查用户是否订阅了该模板
    const subResult = await db.query(
      'SELECT * FROM user_subscriptions WHERE user_id = $1 AND template_id = $2 AND accepted = true',
      [userId, template_id]
    );

    if (subResult.rows.length === 0) {
      return { sent: false, reason: 'not_subscribed' };
    }

    // 获取用户openid
    const userResult = await db.query(
      'SELECT wechat_openid FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0 || !userResult.rows[0].wechat_openid) {
      return { sent: false, reason: 'no_openid' };
    }

    const openid = userResult.rows[0].wechat_openid;

    // 创建发送日志
    const logResult = await db.query(
      `INSERT INTO message_logs (user_id, template_id, scene, data, page, send_status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [userId, template_id, scene, JSON.stringify(data), page]
    );

    const logId = logResult.insertId;

    try {
      // 获取微信 access_token
      const accessToken = await this.getAccessToken();

      // 发送订阅消息
      const sendResult = await axios.post(
        `https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${accessToken}`,
        {
          touser: openid,
          template_id: template_id,
          page: page,
          data: data,
          miniprogram_state: 'formal' // developer / trial / formal
        }
      );

      if (sendResult.data.errcode === 0) {
        await db.query(
          'UPDATE message_logs SET send_status = $1, sent_at = NOW() WHERE id = $2',
          ['success', logId]
        );
        return { sent: true, logId };
      } else {
        const errMsg = sendResult.data.errmsg || 'unknown error';
        await db.query(
          'UPDATE message_logs SET send_status = $1, error_msg = $2 WHERE id = $3',
          ['failed', errMsg, logId]
        );
        console.error(`[Subscription] 发送失败: ${errMsg}`);
        return { sent: false, reason: errMsg };
      }
    } catch (err) {
      await db.query(
        'UPDATE message_logs SET send_status = $1, error_msg = $2 WHERE id = $3',
        ['failed', err.message, logId]
      );
      console.error('[Subscription] 发送异常:', err.message);
      return { sent: false, reason: err.message };
    }
  },

  /**
   * 兑换成功后发送通知
   */
  async sendRedeemSuccess(userId, activityTitle, redeemCode) {
    return this.sendMessage(userId, 'redeem_success', {
      thing1: { value: activityTitle.substring(0, 20) },
      character_string2: { value: redeemCode },
      thing3: { value: '请到店出示兑换码核销' }
    }, `/pages/qrcode/qrcode?code=${redeemCode}`);
  },

  /**
   * 活动即将开始时发送提醒
   */
  async sendActivityRemind(userId, activityTitle, startTime, hint) {
    return this.sendMessage(userId, 'activity_remind', {
      thing1: { value: activityTitle.substring(0, 20) },
      time2: { value: startTime },
      thing3: { value: hint || '记得来参加哦～' }
    }, '/pages/activity/activity');
  },

  /**
   * 获取用户订阅状态
   */
  async getUserSubscriptions(userId) {
    const result = await db.query(
      `SELECT us.*, st.name, st.scene
       FROM user_subscriptions us
       JOIN subscription_templates st ON us.template_id = st.template_id
       WHERE us.user_id = $1`,
      [userId]
    );
    return result.rows;
  },

  /**
   * 获取所有模板
   */
  async getTemplates() {
    const result = await db.query(
      'SELECT * FROM subscription_templates WHERE status = $1',
      ['active']
    );
    return result.rows;
  },

  /**
   * 获取微信 access_token（带缓存）
   */
  async getAccessToken() {
    // 开发环境Mock
    if (config.env === 'development') {
      return 'dev_access_token';
    }

    // 检查缓存（简化实现，实际应用Redis）
    const cacheKey = 'wx_access_token';
    const cacheResult = await db.query(
      'SELECT value FROM system_config WHERE `key` = ?',
      [cacheKey]
    );

    if (cacheResult.rows.length > 0) {
      const cached = JSON.parse(cacheResult.rows[0].value);
      if (cached.expires_at > Date.now()) {
        return cached.token;
      }
    }

    const tokenRes = await axios.get('https://api.weixin.qq.com/cgi-bin/token', {
      params: {
        grant_type: 'client_credential',
        appid: config.wechat.appId,
        secret: config.wechat.secret
      }
    });

    const { access_token, expires_in } = tokenRes.data;

    // 缓存token
    const expiresAt = Date.now() + (expires_in - 300) * 1000; // 提前5分钟过期
    await db.query(
      `INSERT INTO system_config (\`key\`, value)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE value = VALUES(value), updated_at = NOW()`,
      [cacheKey, JSON.stringify({ token: access_token, expires_at: expiresAt })]
    );

    return access_token;
  }
};

module.exports = subscriptionService;
