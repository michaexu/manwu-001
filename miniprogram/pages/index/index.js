/**
 * 首页 - 积分概览 + 快捷操作 + 活动列表
 */
const { api } = require('../../utils/request');
const config = require('../../utils/config');
const app = getApp();

Page({
  data: {
    points: 0,
    vipLevel: 0,
    vip: null,
    userName: '',
    isCheckedIn: false,
    checkinReward: 10,
    activities: [],
    loading: true,
    refreshing: false
  },

  onLoad() {
    // 商家角色跳转商家后台
    if (getApp().globalData.isMerchant) {
      wx.reLaunch({ url: '/pages/merchant/merchant' });
      return;
    }
    this.loadHomeData();
  },

  onShow() {
    // 从其他页面返回时刷新积分（商家已在上方 onLoad 跳转，不会执行到这里）
    if (getApp().globalData.isMerchant) {
      wx.reLaunch({ url: '/pages/merchant/merchant' });
      return;
    }
    this.setData({ points: app.globalData.points });
  },

  onPullDownRefresh() {
    this.setData({ refreshing: true });
    this.loadHomeData().finally(() => {
      wx.stopPullDownRefresh();
      this.setData({ refreshing: false });
    });
  },

  onShareAppMessage() {
    return {
      title: '积分活动 - 签到领积分，兑换好礼！',
      path: '/pages/index/index'
    };
  },

  async loadHomeData() {
    try {
      const token = wx.getStorageSync('access_token');
      const [homeRes, checkinRes] = await Promise.all([
        api.get('/home', { page: 1, page_size: 10 }),
        token ? api.get('/checkin/today-status') : Promise.resolve({ data: { checkedIn: false, reward: 10 } })
      ]);

      const { points, vipLevel, vip, userName, activities } = homeRes.data;
      const { checkedIn, reward } = checkinRes.data;

      this.setData({
        points,
        vipLevel,
        vip,
        userName,
        activities,
        isCheckedIn: checkedIn,
        checkinReward: reward,
        loading: false
      });

      app.globalData.points = points;
      app.globalData.vipLevel = vipLevel;
      app.globalData.vip = vip;
    } catch (err) {
      this.setData({ loading: false });
    }
  },

  /** 每日签到 */
  async handleCheckin() {
    if (this.data.isCheckedIn) {
      wx.showToast({ title: '今日已签到', icon: 'none' });
      return;
    }

    try {
      const res = await api.post('/checkin');
      const { reward, totalPoints } = res.data;

      this.setData({
        isCheckedIn: true,
        points: totalPoints
      });
      app.globalData.points = totalPoints;

      wx.showToast({
        title: `签到成功！+${reward}积分`,
        icon: 'success'
      });
    } catch (err) {
      // 错误已在request中处理
    }
  },

  /** 看广告赚积分 */
  async handleWatchAd() {
    // 创建激励视频广告
    const rewardedVideoAd = wx.createRewardedVideoAd({
      adUnitId: config.adUnitId || 'adunit-xxxxxxxx'
    });

    rewardedVideoAd.onLoad(() => {
      rewardedVideoAd.show().catch(() => {
        // 广告未加载完成，重新加载
        rewardedVideoAd.load().then(() => rewardedVideoAd.show());
      });
    });

    rewardedVideoAd.onClose((res) => {
      if (res && res.isEnded) {
        // 观看完成，发放积分
        this.grantAdReward();
      } else {
        wx.showToast({ title: '看完广告才能获得积分哦', icon: 'none' });
      }
    });

    rewardedVideoAd.onError((err) => {
      console.error('广告加载失败', err);
      wx.showToast({ title: '广告加载失败，请稍后再试', icon: 'none' });
    });
  },

  /** 发放广告积分 */
  async grantAdReward() {
    try {
      const res = await api.post('/points/ad-reward');
      const { reward, totalPoints } = res.data;

      this.setData({ points: totalPoints });
      app.globalData.points = totalPoints;

      wx.showToast({
        title: `+${reward}积分`,
        icon: 'success'
      });
    } catch (err) {
      // 错误已处理
    }
  },

  /** 跳转扫码 */
  handleScan() {
    wx.navigateTo({ url: '/pages/qrcode/qrcode' });
  },

  /** 跳转活动详情 */
  handleActivityTap(e) {
    const { id } = e.currentTarget.dataset;
    app.globalData.pendingActivityId = id;
    wx.switchTab({ url: '/pages/activity/activity' });
  },

  /** 更新积分（供App调用） */
  updatePoints(points) {
    this.setData({ points });
  }
});
