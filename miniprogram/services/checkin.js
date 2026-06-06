/**
 * 签到服务
 */
const { api } = require('../utils/request');

const checkinService = {
  /** 执行签到 */
  doCheckin() {
    return api.post('/checkin');
  },

  /** 查询今日签到状态 */
  getTodayStatus() {
    return api.get('/checkin/today-status');
  },

  /** 签到历史 */
  getHistory(month) {
    return api.get('/checkin/history', { month });
  }
};

module.exports = checkinService;
