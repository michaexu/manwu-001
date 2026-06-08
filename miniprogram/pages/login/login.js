/**
 * 登录页 — 手机号 + 密码登录（新用户自动注册）
 */
const { api } = require('../../utils/request');

Page({
  data: {
    phone: '',
    password: '',
    agreed: false,
    loading: false,
    statusBarHeight: 20,
    errorMsg: ''
  },

  onLoad() {
    const sysInfo = wx.getSystemInfoSync();
    this.setData({ statusBarHeight: sysInfo.statusBarHeight || 20 });

    // 已登录：商家跳转商家后台，普通用户跳转首页
    const token = wx.getStorageSync('access_token');
    if (token) {
      const app = getApp();
      if (app.globalData.isMerchant) {
        wx.reLaunch({ url: '/pages/merchant/merchant' });
      } else {
        wx.switchTab({ url: '/pages/index/index' });
      }
    }
  },

  onPhoneInput(e) {
    this.setData({ phone: e.detail.value, errorMsg: '' });
  },

  onPasswordInput(e) {
    this.setData({ password: e.detail.value, errorMsg: '' });
  },

  onToggleAgree() {
    this.setData({ agreed: !this.data.agreed });
  },

  async onLogin() {
    const { phone, password, agreed, loading } = this.data;
    if (loading) return;

    if (!agreed) {
      wx.showToast({ title: '请先阅读并同意用户协议', icon: 'none' });
      return;
    }

    if (!/^1[3-9]\d{9}$/.test(phone)) {
      this.setData({ errorMsg: '请输入正确的手机号' });
      return;
    }

    if (!password) {
      this.setData({ errorMsg: '请输入密码' });
      return;
    }

    try {
      this.setData({ loading: true, errorMsg: '' });
      const res = await api.post('/auth/password-login', { phone, password });
      this._onLoginSuccess(res.data);
    } catch (err) {
      this.setData({ loading: false });
    }
  },

  _onLoginSuccess(data) {
    const { access_token, refresh_token, user, isNewUser } = data;
    wx.setStorageSync('access_token', access_token);
    if (refresh_token) wx.setStorageSync('refresh_token', refresh_token);

    const app = getApp();
    app.globalData.userInfo = user;
    app.globalData.token = access_token;
    app.globalData.points = user.points || 0;
    app.globalData.vipLevel = user.vipLevel || 0;
    app.globalData.vip = user.vip || null;
    app.globalData.isMerchant = user.role === 'merchant';
    app.globalData.merchantInfo = user.merchant || null;

    if (isNewUser) {
      wx.showToast({ title: '注册成功', icon: 'success', duration: 1000 });
    } else {
      wx.showToast({ title: '登录成功', icon: 'success', duration: 1000 });
    }
    setTimeout(() => {
      if (user.role === 'merchant') {
        wx.reLaunch({ url: '/pages/merchant/merchant' });
      } else {
        wx.switchTab({ url: '/pages/index/index' });
      }
    }, 1100);
  },

  onViewAgreement(e) {
    const type = e.currentTarget.dataset.type;
    wx.showToast({ title: `${type}页面开发中`, icon: 'none' });
  }
});
