const API = require('../../utils/api');

Page({
  data: {
    scanResult: null,
    isScanning: false
  },

  onShow() {
    this.checkLogin();
  },

  checkLogin() {
    if (!getApp().isLoggedIn()) {
      wx.redirectTo({ url: '/pages/login/login' });
    }
  },

  /**
   * 调起微信扫码
   */
  handleScan() {
    if (this.data.isScanning) return;

    this.setData({ isScanning: true });

    wx.scanCode({
      onlyFromCamera: false,
      scanType: ['qrCode'],
      success: async (res) => {
        const qrContent = res.result;
        if (!qrContent) {
          wx.showToast({ title: '未能识别二维码', icon: 'none' });
          this.setData({ isScanning: false });
          return;
        }

        try {
          const result = await API.verifyQrContent(qrContent);
          this.setData({ isScanning: false });

          if (result.status === 'claimed') {
            wx.showToast({ title: `该奖品已于 ${result.claimedAt} 核销`, icon: 'none' });
            return;
          } else if (result.status === 'cancelled') {
            wx.showToast({ title: '该报名已取消', icon: 'none' });
            return;
          }

          // 跳转核销确认页
          wx.navigateTo({
            url: `/pages/verification-confirm/verification-confirm?data=${encodeURIComponent(JSON.stringify(result))}`
          });
        } catch (err) {
          this.setData({ isScanning: false });
        }
      },
      fail: (err) => {
        console.error('扫码失败:', err);
        this.setData({ isScanning: false });
        wx.showToast({ title: '扫码取消或失败', icon: 'none' });
      }
    });
  }
});
