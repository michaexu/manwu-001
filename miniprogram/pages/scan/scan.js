/**
 * 扫码确认页（商家端）
 * 设计参照 Ardot 2:149
 */
const scanService = require('../../services/scan');

Page({
  data: {
    statusBarHeight: 20,
    redemption: null,
    user: null,
    activity: null,
    merchantName: '',
    loading: false,
    error: '',
    confirmed: false
  },

  onLoad(query) {
    const sysInfo = wx.getSystemInfoSync();
    this.setData({ statusBarHeight: sysInfo.statusBarHeight || 20 });

    const { code } = query;
    if (code) {
      this.fetchRedemptionDetail(decodeURIComponent(code));
    }
  },

  /** 扫码 */
  onScanCode() {
    wx.scanCode({
      onlyFromCamera: true,
      scanType: ['barCode', 'qrCode'],
      success: (res) => {
        this.fetchRedemptionDetail(res.result);
      },
      fail: (err) => {
        if (err.errMsg !== 'scanCode:fail cancel') {
          wx.showToast({ title: '扫码失败', icon: 'none' });
        }
      }
    });
  },

  /** 获取兑换码详情 */
  async fetchRedemptionDetail(code) {
    if (!code) return;

    try {
      this.setData({ loading: true, error: '' });
      const res = await scanService.getRedemptionDetail(code);
      const { redemption, user, activity, merchant } = res.data;

      this.setData({
        redemption,
        user,
        activity,
        merchantName: merchant?.name || '',
        loading: false
      });
    } catch (err) {
      this.setData({
        loading: false,
        error: err.message || '未找到该兑换记录'
      });
    }
  },

  /** 确认核销 */
  async onConfirm() {
    const { redemption, confirmed } = this.data;
    if (!redemption || confirmed) return;

    wx.showModal({
      title: '确认核销',
      content: `确认用户已完成礼品领取？核销后无法撤销。`,
      confirmColor: '#DC2626',
      success: async (modalRes) => {
        if (!modalRes.confirm) return;

        try {
          await scanService.confirmRedemption(redemption.code);
          wx.showToast({ title: '核销成功！', icon: 'success' });
          this.setData({ confirmed: true });
        } catch (err) {
          /* 错误已在 request 中处理 */
        }
      }
    });
  },

  /** 取消 */
  onCancel() {
    wx.navigateBack({ delta: 1 });
  },

  /** 格式化日期 */
  _formatTime(dateStr) {
    const d = new Date(dateStr);
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const h = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${m}-${day} ${h}:${min}`;
  }
});
