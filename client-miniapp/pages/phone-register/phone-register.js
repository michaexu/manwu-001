const Auth = require('../../utils/auth');

Page({
  data: {
    phone: '',
    nickname: '',
    isRegistering: false
  },

  handlePhoneInput(e) {
    this.setData({ phone: e.detail.value });
  },

  handleNameInput(e) {
    this.setData({ nickname: e.detail.value });
  },

  async handleRegister() {
    const { phone } = this.data;
    if (!phone || phone.length < 11) {
      wx.showToast({ title: '请输入11位手机号', icon: 'none' });
      return;
    }

    this.setData({ isRegistering: true });
    const member = await Auth.registerByPhone(phone, this.data.nickname);
    this.setData({ isRegistering: false });

    if (member) {
      wx.showToast({ title: '登录成功', icon: 'success' });
      setTimeout(() => {
        wx.switchTab({ url: '/pages/index/index' });
      }, 1000);
    }
  },

  goBack() {
    wx.navigateBack();
  }
});
