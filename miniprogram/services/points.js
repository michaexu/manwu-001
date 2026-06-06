/**
 * 积分服务
 */
const { api } = require('../utils/request');

const pointsService = {
  /** 获取积分明细 */
  getHistory(page = 1, pageSize = 20) {
    return api.get('/points/history', { page, page_size: pageSize });
  },

  /** 广告奖励 */
  claimAdReward() {
    return api.post('/points/ad-reward');
  },

  /** 获取积分规则 */
  getRules() {
    return api.get('/points/rules');
  }
};

module.exports = pointsService;
