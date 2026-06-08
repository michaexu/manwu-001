/**
 * 统一网络请求封装
 * 基于 wx.request，支持自动Token注入、401刷新、错误处理
 */
const config = require('./config');
const BASE_URL = config.apiBaseUrl;

let isRefreshing = false;
let refreshSubscribers = [];

function onTokenRefreshed(newToken) {
  refreshSubscribers.forEach(cb => cb(newToken));
  refreshSubscribers = [];
}

function addRefreshSubscriber(cb) {
  refreshSubscribers.push(cb);
}

/**
 * 刷新Token
 */
async function refreshToken() {
  const refreshToken = wx.getStorageSync('refresh_token');
  if (!refreshToken) throw new Error('No refresh token');

  return new Promise((resolve, reject) => {
    wx.request({
      url: `${BASE_URL}/auth/refresh`,
      method: 'POST',
      data: { refresh_token: refreshToken },
      success: (res) => {
        if (res.statusCode === 200) {
          const { access_token, refresh_token } = res.data.data;
          wx.setStorageSync('access_token', access_token);
          wx.setStorageSync('refresh_token', refresh_token);
          resolve(access_token);
        } else {
          reject(new Error('Refresh failed'));
        }
      },
      fail: reject
    });
  });
}

/**
 * 核心请求方法
 */
function request(options) {
  const { url, method = 'GET', data = {}, header = {}, showLoading = false, loadingText = '加载中...' } = options;

  if (showLoading) {
    wx.showLoading({ title: loadingText, mask: true });
  }

  const token = wx.getStorageSync('access_token');

  return new Promise((resolve, reject) => {
    const doRequest = (authToken) => {
      wx.request({
        url: `${BASE_URL}${url}`,
        method,
        data,
        header: {
          'Content-Type': 'application/json',
          'Authorization': authToken ? `Bearer ${authToken}` : '',
          ...header
        },
        success: (res) => {
          if (showLoading) wx.hideLoading();

          if (res.statusCode === 401) {
            // Token过期，尝试刷新
            if (!isRefreshing) {
              isRefreshing = true;
              refreshToken()
                .then(newToken => {
                  isRefreshing = false;
                  onTokenRefreshed(newToken);
                  doRequest(newToken);
                })
                .catch(() => {
                  isRefreshing = false;
                  refreshSubscribers = [];
                  wx.removeStorageSync('access_token');
                  wx.removeStorageSync('refresh_token');
                  wx.reLaunch({ url: '/pages/login/login' });
                  reject({ code: 401, message: '登录已过期，请重新登录' });
                });
            } else {
              addRefreshSubscriber((newToken) => {
                doRequest(newToken);
              });
            }
            return;
          }

          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(res.data);
          } else {
            const msg = (res.data && res.data.message) || '请求失败';
            // 401 静默处理，不弹 toast（refresh 失败后已有 reLaunch 跳转登录页）
            if (res.statusCode !== 401) {
              wx.showToast({ title: msg, icon: 'none', duration: 2000 });
            }
            reject({
              code: res.statusCode,
              message: msg,
              data: res.data
            });
          }
        },
        fail: (err) => {
          if (showLoading) wx.hideLoading();
          wx.showToast({ title: '网络异常，请稍后重试', icon: 'none', duration: 2000 });
          reject({
            code: -1,
            message: '网络异常',
            detail: err
          });
        }
      });
    };

    doRequest(token);
  });
}

// 便捷方法
const api = {
  get: (url, data, options = {}) => request({ url, method: 'GET', data, ...options }),
  post: (url, data, options = {}) => request({ url, method: 'POST', data, ...options }),
  put: (url, data, options = {}) => request({ url, method: 'PUT', data, ...options }),
  delete: (url, data, options = {}) => request({ url, method: 'DELETE', data, ...options })
};

module.exports = { request, api, BASE_URL };
