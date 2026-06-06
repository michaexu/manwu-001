/**
 * 积分活动小程序 - App入口
 * 功能：商家维护活动，用户通过VIP/签到/广告获取积分参与活动，线下扫码确认领取
 */
const config = require('./utils/config');
const { login, checkAndRefreshToken } = require('./utils/auth');

App({
  globalData: {
    userInfo: null,
    token: null,
    isMerchant: false,
    merchantInfo: null,
    points: 0,
    vipLevel: 0,
    vip: null       // { level, monthlyQuota, monthlyUsed, monthlyRemaining }
  },

  onLaunch() {
    // 检查登录态
    this.checkLoginStatus();
    // 获取系统信息
    this.getSystemInfo();
  },

  onShow(options) {
    // 从其他场景进入时刷新token
    if (options.scene) {
      checkAndRefreshToken();
    }
  },

  async checkLoginStatus() {
    const token = wx.getStorageSync('access_token');
    if (token) {
      try {
        const userInfo = await checkAndRefreshToken();
        this.globalData.userInfo = userInfo;
        this.globalData.token = token;
        this.globalData.points = userInfo.points || 0;
        this.globalData.vipLevel = userInfo.vipLevel || 0;
        this.globalData.vip = userInfo.vip || null;
        this.globalData.isMerchant = userInfo.role === 'merchant';
        this.globalData.merchantInfo = userInfo.merchant || null;
      } catch (err) {
        // Token失效，需要重新登录
        wx.removeStorageSync('access_token');
        this.globalData.token = null;
      }
    }
  },

  getSystemInfo() {
    try {
      const systemInfo = wx.getSystemInfoSync();
      this.globalData.systemInfo = systemInfo;
      this.globalData.statusBarHeight = systemInfo.statusBarHeight;
      this.globalData.navBarHeight = systemInfo.statusBarHeight + 44;
    } catch (e) {
      console.warn('获取系统信息失败', e);
    }
  },

  // 更新全局积分
  updatePoints(points) {
    this.globalData.points = points;
    // 通知当前页面更新
    const pages = getCurrentPages();
    if (pages.length > 0) {
      const currentPage = pages[pages.length - 1];
      if (currentPage.updatePoints) {
        currentPage.updatePoints(points);
      }
    }
  }
});
