// app.js
App({
  globalData: {
    operatorInfo: null,
    token: ''
  },

  onLaunch() {
    const token = wx.getStorageSync('merchant_token');
    const operatorInfo = wx.getStorageSync('operatorInfo');
    if (token && operatorInfo) {
      this.globalData.token = token;
      this.globalData.operatorInfo = operatorInfo;
    }
  },

  isLoggedIn() {
    return !!this.globalData.token;
  }
});
