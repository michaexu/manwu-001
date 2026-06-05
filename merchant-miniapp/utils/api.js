const BASE_URL = 'http://localhost:3091/api';

/**
 * 封装的 HTTP 请求（商家版）
 */
function request({ url, method = 'GET', data = {}, isLoading = true }) {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync('merchant_token') || '';

    if (isLoading) {
      wx.showLoading({ title: '加载中...', mask: true });
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
          wx.showToast({ title: res.data.message || '操作失败', icon: 'none' });
          reject(res.data);
        } else if (res.statusCode === 401) {
          wx.removeStorageSync('merchant_token');
          wx.removeStorageSync('operatorInfo');
          wx.redirectTo({ url: '/pages/login/login' });
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
        if (isLoading) wx.hideLoading();
      }
    });
  });
}

// ============ 登录 ============
const merchantLogin = (code, encryptedData, iv) => {
  return request({
    url: '/auth/merchant/login',
    method: 'POST',
    data: { code, encryptedData, iv }
  });
};

// ============ 活动管理 ============
const getActivities = (page = 1, status = '') => {
  return request({ url: `/merchant/activities?page=${page}&pageSize=20${status ? '&status=' + status : ''}` });
};
const createActivity = (data) => {
  return request({ url: '/merchant/activities', method: 'POST', data });
};
const updateActivity = (id, data) => {
  return request({ url: `/merchant/activities/${id}`, method: 'PUT', data });
};
const publishActivity = (id) => {
  return request({ url: `/merchant/activities/${id}/publish`, method: 'POST' });
};
const unpublishActivity = (id) => {
  return request({ url: `/merchant/activities/${id}/unpublish`, method: 'POST' });
};
const getActivityRegistrations = (id, page = 1, status = '') => {
  return request({ url: `/merchant/activities/${id}/registrations?page=${page}&pageSize=20${status ? '&status=' + status : ''}` });
};

// ============ 核销 ============
const verifyQrContent = (qrContent) => {
  return request({ url: '/merchant/verify', method: 'POST', data: { qrContent } });
};
const confirmClaim = (activityId, registrationId) => {
  return request({ url: '/merchant/claim', method: 'POST', data: { activityId, registrationId } });
};

// ============ 会员管理 ============
const getMembers = (page = 1, keyword = '', memberType = '') => {
  return request({ url: `/members?page=${page}&pageSize=20${keyword ? '&keyword=' + keyword : ''}${memberType ? '&memberType=' + memberType : ''}` });
};
const getMemberDetail = (id) => {
  return request({ url: `/members/${id}` });
};
const grantVip = (memberId) => {
  return request({ url: `/members/${memberId}/vip/grant`, method: 'POST' });
};
const revokeVip = (memberId) => {
  return request({ url: `/members/${memberId}/vip/revoke`, method: 'POST' });
};

// ============ 管理员 ============
const getDashboard = () => {
  return request({ url: '/admin/dashboard' });
};
const getAds = () => {
  return request({ url: '/admin/ads' });
};
const saveAd = (data) => {
  return request({ url: '/admin/ads', method: 'POST', data });
};
const getWhitelist = () => {
  return request({ url: '/admin/whitelist' });
};
const addWhitelist = (phone, nickname) => {
  return request({ url: '/admin/whitelist', method: 'POST', data: { phone, nickname } });
};
const deleteWhitelist = (id) => {
  return request({ url: `/admin/whitelist/${id}`, method: 'DELETE' });
};

module.exports = {
  merchantLogin,
  getActivities, createActivity, updateActivity, publishActivity, unpublishActivity, getActivityRegistrations,
  verifyQrContent, confirmClaim,
  getMembers, getMemberDetail, grantVip, revokeVip,
  getDashboard, getAds, saveAd, getWhitelist, addWhitelist, deleteWhitelist
};
