/**
 * 商家管理服务 — V2
 */
const { api } = require('../utils/request');

const merchantService = {
  /** 创建活动 */
  createActivity(data) {
    return api.post('/merchant/activities', data);
  },

  /** 更新活动 */
  updateActivity(id, data) {
    return api.put(`/merchant/activities/${id}`, data);
  },

  /** 商家活动列表 */
  getActivities(params) {
    return api.get('/merchant/activities', params);
  },

  /** 更新活动状态 */
  updateActivityStatus(id, status) {
    return api.put(`/merchant/activities/${id}/status`, { status });
  },

  /** 商家信息 */
  getProfile() {
    return api.get('/merchant/profile');
  }
};

module.exports = merchantService;
