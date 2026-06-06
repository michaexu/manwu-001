/**
 * 订阅消息工具
 * 管理微信订阅消息授权请求与后端记录
 */
const { api } = require('./request');

/**
 * 请求订阅消息授权
 * 在关键操作（兑换、活动参与）后调用
 *
 * @param {string[]} scenes - 场景列表: ['activity_remind', 'redeem_success', 'checkin_remind']
 * @returns {Promise<Object>} 授权结果
 *
 * 使用示例:
 *   const { accepted } = await requestSubscribe(['redeem_success', 'activity_remind']);
 *   if (accepted.includes('redeem_success')) {
 *     console.log('用户同意兑换成功通知');
 *   }
 */
async function requestSubscribe(scenes = ['redeem_success']) {
  try {
    // Step 1: 获取所有模板ID
    const templatesRes = await api.get('/subscription/templates');
    const allTemplates = templatesRes.data || [];

    // 筛选需要的场景模板
    const targetTemplates = allTemplates.filter(t => scenes.includes(t.scene));
    if (targetTemplates.length === 0) {
      console.warn('[Subscribe] 没有可用的订阅模板');
      return { accepted: [], result: {} };
    }

    const tmplIds = targetTemplates.map(t => t.templateId);

    // Step 2: 调用微信授权
    return new Promise((resolve) => {
      wx.requestSubscribeMessage({
        tmplIds: tmplIds,
        success: (res) => {
          console.log('[Subscribe] 授权结果:', res);

          // Step 3: 记录到后端
          const acceptMap = {};
          tmplIds.forEach(id => {
            acceptMap[id] = res[id] || 'reject';
          });

          api.post('/subscription/record', { acceptMap }).catch(err => {
            console.error('[Subscribe] 记录订阅失败:', err);
          });

          const accepted = tmplIds.filter(id => res[id] === 'accept');
          resolve({ accepted, result: res, templates: targetTemplates });
        },
        fail: (err) => {
          console.warn('[Subscribe] 用户取消或授权失败:', err);
          resolve({ accepted: [], result: {}, templates: targetTemplates });
        }
      });
    });
  } catch (err) {
    console.error('[Subscribe] 获取模板失败:', err);
    return { accepted: [], result: {} };
  }
}

/**
 * 获取用户当前订阅状态
 */
async function getMySubscriptions() {
  try {
    const res = await api.get('/subscription/my');
    return res.data || [];
  } catch (err) {
    console.error('[Subscribe] 获取订阅状态失败:', err);
    return [];
  }
}

/**
 * 智能订阅提示
 * 根据用户订阅状态决定是否弹窗请求授权
 */
async function smartSubscribe(scenes, reason) {
  const mySubs = await getMySubscriptions();
  const subscribedScenes = mySubs.filter(s => s.accepted).map(s => s.scene);
  const needRequest = scenes.filter(s => !subscribedScenes.includes(s));

  if (needRequest.length === 0) {
    return { alreadySubscribed: true };
  }

  // 显示确认弹窗
  return new Promise((resolve) => {
    wx.showModal({
      title: '开启通知',
      content: reason || '开启消息通知，不错过重要信息',
      confirmText: '去开启',
      cancelText: '暂不',
      success: async (modalRes) => {
        if (modalRes.confirm) {
          const result = await requestSubscribe(needRequest);
          resolve({ alreadySubscribed: false, ...result });
        } else {
          resolve({ alreadySubscribed: false, accepted: [] });
        }
      }
    });
  });
}

module.exports = {
  requestSubscribe,
  getMySubscriptions,
  smartSubscribe
};
