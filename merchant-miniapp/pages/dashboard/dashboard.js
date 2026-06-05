const API = require('../../utils/api');

Page({
  data: {
    dashboard: null,
    isLoading: true
  },

  onShow() {
    this.checkLogin();
    this.loadDashboard();
  },

  checkLogin() {
    if (!getApp().isLoggedIn()) {
      wx.redirectTo({ url: '/pages/login/login' });
    }
  },

  async loadDashboard() {
    this.setData({ isLoading: true });
    try {
      const data = await API.getDashboard();
      this.setData({ dashboard: data, isLoading: false });
    } catch (err) {
      this.setData({ isLoading: false });
    }
  },

  goTo(e) {
    const { page } = e.currentTarget.dataset;
    wx.navigateTo({ url: page });
  }
});
