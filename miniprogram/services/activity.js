/**
 * 活动服务 — V2
 */
const { api } = require('../utils/request');

const activityService = {
  /** 活动列表 */
  getList(params = {}) {
    return api.get('/activities', params);
  },

  /** 活动详情 */
  getDetail(id) {
    return api.get(`/activities/${id}`);
  },

  /** 兑换活动资格（自动判断VIP免积分/积分兑换） */
  redeem(id) {
    return api.post(`/activities/${id}/redeem`);
  },

  /** 获取兑换记录 */
  getRedeemHistory(page = 1, pageSize = 20) {
    return api.get('/activities/redeem-history', { page, page_size: pageSize });
  }
};

module.exports = activityService;
