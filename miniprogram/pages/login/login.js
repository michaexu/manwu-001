/**
 * 登录/注册页
 * 设计参照 Ardot 8:2
 */
const { api } = require('../../utils/request');
const { phoneLogin } = require('../../utils/auth');

Page({
  data: {
    phone: '',
    smsCode: '',
    smsSending: false,
    smsCountdown: 0,
    agreed: false,
    loading: false,
    statusBarHeight: 20
  },

  onLoad() {
    const sysInfo = wx.getSystemInfoSync();
    this.setData({ statusBarHeight: sysInfo.statusBarHeight || 20 });

    // 已登录则直接跳转首页
    const token = wx.getStorageSync('access_token');
    if (token) {
      wx.switchTab({ url: '/pages/index/index' });
    }
  },

  /** 手机号输入 */
  onPhoneInput(e) {
    this.setData({ phone: e.detail.value });
  },

  /** 验证码输入 */
  onSmsInput(e) {
    this.setData({ smsCode: e.detail.value });
  },

  /** 发送验证码 */
  async onSendSms() {
    const { phone, smsSending, smsCountdown } = this.data;
    if (smsSending || smsCountdown > 0) return;

    if (!/^1[3-9]\d{9}$/.test(phone)) {
      wx.showToast({ title: '请输入正确的手机号', icon: 'none' });
      return;
    }

    try {
      this.setData({ smsSending: true });
      await api.post('/auth/send-sms', { phone });
      wx.showToast({ title: '验证码已发送', icon: 'success' });

      // 倒计时
      let countdown = 60;
      this.setData({ smsCountdown: countdown });
      const timer = setInterval(() => {
        countdown--;
        this.setData({ smsCountdown: countdown });
        if (countdown <= 0) {
          clearInterval(timer);
          this.setData({ smsSending: false });
        }
      }, 1000);
    } catch (err) {
      this.setData({ smsSending: false });
    }
  },

  /** 切换同意勾选 */
  onToggleAgree() {
    this.setData({ agreed: !this.data.agreed });
  },

  /** 手机号登录 */
  async onPhoneLogin() {
    const { phone, smsCode, agreed, loading } = this.data;
    if (loading) return;

    if (!agreed) {
      wx.showToast({ title: '请先阅读并同意用户协议', icon: 'none' });
      return;
    }

    if (!phone || !smsCode) {
      wx.showToast({ title: '请输入手机号和验证码', icon: 'none' });
      return;
    }

    try {
      this.setData({ loading: true });
      const res = await api.post('/auth/sms-login', {
        phone,
        code: smsCode
      });

      this._onLoginSuccess(res.data);
    } catch (err) {
      this.setData({ loading: false });
    }
  },

  /** 微信一键登录 */
  async onWechatLogin() {
    const { agreed, loading } = this.data;
    if (loading) return;

    if (!agreed) {
      wx.showToast({ title: '请先阅读并同意用户协议', icon: 'none' });
      return;
    }

    try {
      this.setData({ loading: true });

      // 获取微信登录code
      const { code } = await new Promise((resolve, reject) => {
        wx.login({
          success: resolve,
          fail: reject
        });
      });

      const res = await api.post('/auth/wechat-login', { code });
      this._onLoginSuccess(res.data);
    } catch (err) {
      this.setData({ loading: false });
      wx.showToast({ title: '登录失败，请重试', icon: 'none' });
    }
  },

  /** 手机号快速验证 (微信按钮) */
  async onGetPhoneNumber(e) {
    const { agreed } = this.data;
    if (!agreed) {
      wx.showToast({ title: '请先阅读并同意用户协议', icon: 'none' });
      return;
    }

    if (!e.detail.code) {
      // 用户拒绝授权
      return;
    }

    try {
      this.setData({ loading: true });
      const user = await phoneLogin(e.detail.code);
      this._onLoginSuccess({ user, access_token: wx.getStorageSync('access_token') });
    } catch (err) {
      this.setData({ loading: false });
    }
  },

  /** 登录成功处理 */
  _onLoginSuccess(data) {
    const { access_token, refresh_token, user } = data;
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

    wx.showToast({ title: '登录成功', icon: 'success', duration: 1000 });
    setTimeout(() => {
      wx.switchTab({ url: '/pages/index/index' });
    }, 1100);
  },

  /** 查看协议 */
  onViewAgreement(e) {
    const type = e.currentTarget.dataset.type;
    wx.showToast({ title: `${type}页面开发中`, icon: 'none' });
  }
});
