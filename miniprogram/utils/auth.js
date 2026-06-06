/**
 * 认证模块 - 微信登录 + 手机号注册
 */
const { api } = require('./request');

/**
 * 微信登录 + 手机号注册/登录
 * @param {string} phoneCode - wx.cloud.getPhoneNumber 返回的code
 * @returns {Promise<Object>} 用户信息
 */
async function phoneLogin(phoneCode) {
  // Step 1: 获取微信登录code
  const loginRes = await wxLogin();
  const { code } = loginRes;

  // Step 2: 发送手机号code + 微信code到后端
  const res = await api.post('/auth/phone-login', {
    code: code,           // wx.login的code
    phone_code: phoneCode // 手机号授权code
  });

  // Step 3: 存储Token和用户信息
  const { access_token, refresh_token, user } = res.data;
  wx.setStorageSync('access_token', access_token);
  wx.setStorageSync('refresh_token', refresh_token);

  // 更新全局状态
  const app = getApp();
  app.globalData.userInfo = user;
  app.globalData.token = access_token;
  app.globalData.points = user.points || 0;
  app.globalData.vipLevel = user.vipLevel || 0;
  app.globalData.isMerchant = user.role === 'merchant';
  app.globalData.merchantInfo = user.merchant || null;

  return user;
}

/**
 * 微信登录获取code
 */
function wxLogin() {
  return new Promise((resolve, reject) => {
    wx.login({
      success: (res) => {
        if (res.code) {
          resolve(res);
        } else {
          reject(new Error('wx.login 失败'));
        }
      },
      fail: reject
    });
  });
}

/**
 * 检查并刷新Token，返回用户信息
 */
async function checkAndRefreshToken() {
  try {
    const res = await api.get('/auth/profile');
    const user = res.data;

    const app = getApp();
    app.globalData.userInfo = user;
    app.globalData.points = user.points || 0;
    app.globalData.vipLevel = user.vipLevel || 0;
    app.globalData.isMerchant = user.role === 'merchant';
    app.globalData.merchantInfo = user.merchant || null;

    return user;
  } catch (err) {
    throw err;
  }
}

/**
 * 退出登录
 */
function logout() {
  wx.removeStorageSync('access_token');
  wx.removeStorageSync('refresh_token');

  const app = getApp();
  app.globalData.userInfo = null;
  app.globalData.token = null;
  app.globalData.points = 0;
  app.globalData.vipLevel = 0;
  app.globalData.isMerchant = false;
  app.globalData.merchantInfo = null;

  wx.reLaunch({ url: '/pages/login/login' });
}

module.exports = {
  phoneLogin,
  wxLogin,
  checkAndRefreshToken,
  logout
};
