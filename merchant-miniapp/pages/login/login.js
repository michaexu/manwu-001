const API = require('../../utils/api');

Page({
  data: {
    isLoggingIn: false
  },

  /**
   * 微信手机号快捷登录
   */
  handlePhoneLogin(e) {
    if (this.data.isLoggingIn) return;

    const { code, encryptedData, iv } = e.detail;
    if (!code || !encryptedData || !iv) {
      wx.showToast({ title: '请允许获取手机号', icon: 'none' });
      return;
    }

    this.setData({ isLoggingIn: true });

    // 先通过 wx.login 获取 code
    wx.login({
      success: async (loginRes) => {
        if (loginRes.code) {
          try {
            const result = await API.merchantLogin(loginRes.code, encryptedData, iv);
            wx.setStorageSync('merchant_token', result.token);
            wx.setStorageSync('operatorInfo', result.operator);

            getApp().globalData.token = result.token;
            getApp().globalData.operatorInfo = result.operator;

            wx.showToast({ title: '登录成功', icon: 'success' });
            wx.switchTab({ url: '/pages/activity-management/activity-management' });
          } catch (err) {
            this.setData({ isLoggingIn: false });
          }
        } else {
          wx.showToast({ title: '微信登录失败', icon: 'none' });
          this.setData({ isLoggingIn: false });
        }
      },
      fail: () => {
        wx.showToast({ title: '微信登录失败', icon: 'none' });
        this.setData({ isLoggingIn: false });
      }
    });
  }
});
