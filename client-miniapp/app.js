// app.js

App({
  globalData: {
    memberInfo: null,
    token: ''
  },

  onLaunch() {
    const token = wx.getStorageSync('token');
    const memberInfo = wx.getStorageSync('memberInfo');
    if (token && memberInfo) {
      this.globalData.token = token;
      this.globalData.memberInfo = memberInfo;
    }
  }
});
