/**
 * 扫码核销服务
 */
const { api } = require('../utils/request');

const scanService = {
  /** 商家扫码确认核销 */
  confirmRedemption(redemptionCode) {
    return api.post('/scan/confirm', { code: redemptionCode });
  },

  /** 获取用户兑换码详情（商家视角） */
  getRedemptionDetail(code) {
    return api.get(`/scan/redemption/${code}`);
  },

  /** 商家核销记录 */
  getScanHistory(page = 1, pageSize = 20) {
    return api.get('/scan/history', { page, page_size: pageSize });
  }
};

module.exports = scanService;
