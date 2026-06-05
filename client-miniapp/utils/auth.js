const API = require('./api');

/**
 * 登录认证工具（仅手机号）
 */
const Auth = {
  /**
   * 手机号注册/登录
   * @param {string} phone - 手机号
   * @param {string} nickname - 昵称（可选）
   */
  async registerByPhone(phone, nickname = '') {
    try {
      const result = await API.registerByPhone(phone, nickname);
      this.saveSession(result.token, result.member);
      return result.member;
    } catch (err) {
      console.error('登录失败:', err);
      return null;
    }
  },

  /**
   * 保存登录态
   */
  saveSession(token, member) {
    wx.setStorageSync('token', token);
    wx.setStorageSync('memberInfo', member);
    try {
      const app = getApp();
      app.globalData.token = token;
      app.globalData.memberInfo = member;
    } catch (e) { /* ignore */ }
  },

  /**
   * 是否已登录
   */
  isLoggedIn() {
    return !!wx.getStorageSync('token');
  },

  /**
   * 获取当前会员信息
   */
  getMember() {
    return wx.getStorageSync('memberInfo') || null;
  },

  /**
   * 退出登录
   */
  logout() {
    wx.removeStorageSync('token');
    wx.removeStorageSync('memberInfo');
    try {
      const app = getApp();
      app.globalData.token = '';
      app.globalData.memberInfo = null;
    } catch (e) { /* ignore */ }
  }
};

module.exports = Auth;
