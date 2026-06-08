/**
 * 商家管理服务 — V3
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

  /** 商家活动列表（含参与人数） */
  getActivities(params) {
    return api.get('/merchant/activities', params);
  },

  /** 单个活动 */
  getActivity(id) {
    return api.get(`/merchant/activities/${id}`);
  },

  /** 活动参与者 */
  getParticipants(activityId) {
    return api.get(`/merchant/activities/${activityId}/participants`);
  },

  /** 更新活动状态 */
  updateActivityStatus(id, status) {
    return api.put(`/merchant/activities/${id}/status`, { status });
  },

  /** 删除活动 */
  deleteActivity(id) {
    return api.del(`/merchant/activities/${id}`);
  },

  /** 上传图片（base64） */
  uploadImage(fileName, base64Data) {
    return api.post('/merchant/upload', { fileName, data: base64Data });
  },

  /** 仪表盘统计 */
  getDashboard() {
    return api.get('/merchant/dashboard');
  },

  /** 商家信息 */
  getProfile() {
    return api.get('/merchant/profile');
  }
};

module.exports = merchantService;
