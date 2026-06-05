const Auth = require('../../utils/auth');

Page({
  data: {
    memberInfo: null,
    isLoggedIn: false
  },

  onShow() {
    const member = Auth.getMember();
    this.setData({
      memberInfo: member,
      isLoggedIn: !!Auth.isLoggedIn()
    });
  },

  goToRegister() {
    wx.navigateTo({ url: '/pages/phone-register/phone-register' });
  },

  goToParticipations() {
    wx.navigateTo({ url: '/pages/my-participations/my-participations' });
  },

  goToPointsDetail() {
    wx.navigateTo({ url: '/pages/points-detail/points-detail' });
  },

  handleLogout() {
    wx.showModal({
      title: '退出登录',
      content: '确定退出？',
      success: (res) => {
        if (res.confirm) {
          Auth.logout();
          this.setData({ memberInfo: null, isLoggedIn: false });
        }
      }
    });
  }
});
