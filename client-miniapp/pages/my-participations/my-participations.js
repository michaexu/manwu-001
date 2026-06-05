const API = require('../../utils/api');
const { REGISTRATION_STATUS_TEXT } = require('../../utils/constants');

Page({
  data: {
    registrations: [],
    page: 1,
    totalPages: 1,
    isLoading: false,
    statusText: REGISTRATION_STATUS_TEXT
  },

  onShow() {
    this.loadRegistrations(true);
  },

  async loadRegistrations(refresh = false) {
    if (this.data.isLoading) return;
    if (refresh) this.setData({ page: 1, registrations: [] });

    this.setData({ isLoading: true });
    try {
      const result = await API.getMyRegistrations(this.data.page);
      this.setData({
        registrations: refresh ? result.list : [...this.data.registrations, ...result.list],
        totalPages: result.totalPages,
        isLoading: false
      });
    } catch (err) {
      this.setData({ isLoading: false });
    }
  },

  onReachBottom() {
    if (this.data.page < this.data.totalPages) {
      this.setData({ page: this.data.page + 1 });
      this.loadRegistrations();
    }
  },

  /**
   * 查看领奖码
   */
  goToQrCode(e) {
    const { id } = e.currentTarget.dataset;
    if (id) {
      wx.navigateTo({ url: `/pages/qr-code/qr-code?registrationId=${id}` });
    }
  },

  /**
   * 取消报名
   */
  handleCancel(e) {
    const { id, pointsCost, activityTitle } = e.currentTarget.dataset;
    const content = pointsCost > 0
      ? `取消后 ${pointsCost} 积分将退回您的账户`
      : '确认取消报名？';

    wx.showModal({
      title: '取消报名',
      content,
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '取消中...', mask: true });
          try {
            await API.cancelRegistration(id);
            wx.hideLoading();
            wx.showToast({ title: '已取消', icon: 'success' });
            this.loadRegistrations(true);
          } catch (err) {
            wx.hideLoading();
          }
        }
      }
    });
  }
});
