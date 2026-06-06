/**
 * 个人中心
 */
const { logout } = require('../../utils/auth');
const { api } = require('../../utils/request');
const app = getApp();

Page({
  data: {
    userInfo: null,
    points: 0,
    vipLevel: 0,
    vip: null,
    isMerchant: false,
    menuList: [
      { icon: '📊', title: '积分明细', url: '/pages/points/points' },
      { icon: '📅', title: '签到记录', url: '/pages/checkin/checkin' },
      { icon: '🎫', title: '兑换记录', url: '/pages/redeem-history/redeem-history' },
      { icon: '⚙️', title: '设置', url: '' }
    ]
  },

  onShow() {
    this.setData({
      userInfo: app.globalData.userInfo,
      points: app.globalData.points,
      vipLevel: app.globalData.vipLevel,
      vip: app.globalData.vip,
      isMerchant: app.globalData.isMerchant
    });
  },

  /** 菜单点击 */
  handleMenuTap(e) {
    const { url, title } = e.currentTarget.dataset;
    if (title === '设置') {
      wx.showToast({ title: '设置页开发中', icon: 'none' });
      return;
    }
    if (url) {
      wx.navigateTo({ url });
    }
  },

  /** 商家管理入口 */
  handleMerchantEntry() {
    if (!this.data.isMerchant) {
      wx.showToast({ title: '仅商家可访问', icon: 'none' });
      return;
    }
    wx.navigateTo({ url: '/subpackages/merchant-admin/activity-list/activity-list' });
  },

  /** 退出登录 */
  handleLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          logout();
        }
      }
    });
  },

  /** 手机号绑定 */
  handleGetPhoneNumber(e) {
    if (e.detail.errMsg !== 'getPhoneNumber:ok') {
      return;
    }
    // phone code 已在登录时使用，此处可做绑定更新
    wx.showToast({ title: '手机号已绑定', icon: 'success' });
  }
});
