const BASE_URL = 'http://localhost:3091/api';

// loading 引用计数，防止多请求同时触发时 hideLoading 误关
let loadingCount = 0;

function showLoadingSafe() {
  loadingCount++;
  wx.showLoading({ title: '加载中...', mask: true });
}

function hideLoadingSafe() {
  loadingCount = Math.max(0, loadingCount - 1);
  if (loadingCount === 0) {
    wx.hideLoading();
  }
}

/**
 * 封装的 HTTP 请求
 */
function request({ url, method = 'GET', data = {}, isLoading = true }) {
  return new Promise((resolve, reject) => {
    // 获取 token
    const token = wx.getStorageSync('token') || '';

    if (isLoading) {
      showLoadingSafe();
    }

    wx.request({
      url: BASE_URL + url,
      method,
      data,
      header: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      success(res) {
        if (res.statusCode === 200 && res.data.code === 0) {
          resolve(res.data.data);
        } else if (res.statusCode === 200) {
          // 业务错误
          wx.showToast({ title: res.data.message || '操作失败', icon: 'none' });
          reject(res.data);
        } else if (res.statusCode === 401) {
          // 未授权，清除缓存，由页面自行重试登录
          wx.removeStorageSync('token');
          wx.removeStorageSync('memberInfo');
          wx.removeStorageSync('operatorInfo');
          wx.showToast({ title: '登录已过期', icon: 'none' });
          reject(res.data);
        } else {
          wx.showToast({ title: '网络错误', icon: 'none' });
          reject(res.data);
        }
      },
      fail(err) {
        wx.showToast({ title: '网络请求失败', icon: 'none' });
        reject(err);
      },
      complete() {
        if (isLoading) {
          hideLoadingSafe();
        }
      }
    });
  });
}

/**
 * 手机号注册/登录
 */
const registerByPhone = (phone, nickname) => {
  return request({
    url: '/auth/customer/register',
    method: 'POST',
    data: { phone, nickname },
    isLoading: false
  });
};

/**
 * 获取活动列表
 */
const getActivities = (page = 1) => {
  return request({ url: `/activities?page=${page}&pageSize=20` });
};

/**
 * 获取活动详情
 */
const getActivityDetail = (id) => {
  return request({ url: `/activities/${id}` });
};

/**
 * 报名活动
 */
const registerActivity = (activityId) => {
  return request({
    url: '/registrations',
    method: 'POST',
    data: { activityId }
  });
};

/**
 * 取消报名
 */
const cancelRegistration = (registrationId) => {
  return request({
    url: `/registrations/${registrationId}/cancel`,
    method: 'POST'
  });
};

/**
 * 获取我的参与记录
 */
const getMyRegistrations = (page = 1) => {
  return request({ url: `/registrations/my?page=${page}&pageSize=20` });
};

/**
 * 获取领奖码二维码
 */
const getQrCode = (registrationId) => {
  return request({ url: `/registrations/${registrationId}/qrcode` });
};

/**
 * 获取广告位列表
 */
const getAds = () => {
  return request({ url: '/points/ads' });
};

/**
 * 领取积分（观看广告后）
 */
const earnPoints = (adId) => {
  return request({
    url: '/points/earn',
    method: 'POST',
    data: { adId }
  });
};

/**
 * 获取积分明细
 */
const getPointsRecords = (page = 1, type = '') => {
  return request({ url: `/points/records?page=${page}&pageSize=20${type ? '&type=' + type : ''}` });
};

/**
 * 获取会员信息
 */
const getMemberInfo = () => {
  // 从本地获取，服务端无单独的获取会员信息接口，后续可补充
  return wx.getStorageSync('memberInfo');
};

/**
 * 签到获取积分
 */
const checkIn = () => {
  return request({
    url: '/points/checkin',
    method: 'POST',
    isLoading: false
  });
};

/**
 * 获取签到状态
 */
const getCheckInStatus = () => {
  return request({
    url: '/points/checkin/status',
    isLoading: false
  });
};

module.exports = {
  registerByPhone,
  getActivities,
  getActivityDetail,
  registerActivity,
  cancelRegistration,
  getMyRegistrations,
  getQrCode,
  getAds,
  earnPoints,
  getPointsRecords,
  getMemberInfo,
  checkIn,
  getCheckInStatus
};
