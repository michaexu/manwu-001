/**
 * 活动详情页 — V2：VIP/普通双轨兑换
 */
const { api } = require('../../utils/request');
const app = getApp();

Page({
  data: {
    activityId: '',
    activity: null,
    loading: true,
    // 用户相关
    isVip: false,
    vipMonthlyRemaining: 0,
    userPoints: 0,
    // 兑换状态
    redeeming: false,
    redeemed: false,
    redeemResult: null
  },

  onLoad(options) {
    const { id } = options;
    this.setData({ activityId: id });
    this.loadDetail(id);
  },

  onShow() {
    // 刷新用户积分和VIP状态
    this.setData({
      userPoints: app.globalData.points,
      isVip: app.globalData.vipLevel > 0,
      vipMonthlyRemaining: app.globalData.vip?.monthlyRemaining || 0
    });
  },

  /** 加载活动详情 */
  async loadDetail(id) {
    try {
      const res = await api.get(`/activities/${id}`);
      this.setData({
        activity: res.data,
        loading: false
      });
    } catch (err) {
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  /** 计算当前活动各类型剩余名额 */
  getQuotaInfo() {
    const { activity } = this.data;
    if (!activity) return {};

    return {
      vipTotal: activity.vip_quota || 0,
      vipRemaining: (activity.vip_quota || 0) - (activity.vip_redeemed_count || 0),
      regularTotal: activity.regular_quota || 0,
      regularRemaining: (activity.regular_quota || 0) - (activity.regular_redeemed_count || 0)
    };
  },

  /** 判断用户是否可以参与 */
  canRedeem() {
    const { activity, isVip, vipMonthlyRemaining, userPoints } = this.data;
    if (!activity || activity.status !== 'active') return false;

    const quota = this.getQuotaInfo();

    if (isVip) {
      // VIP：免积分额度充足 OR 积分足够
      if (vipMonthlyRemaining > 0) return quota.vipRemaining > 0 || quota.vipTotal === 0;
      return userPoints >= activity.points_required && (quota.vipRemaining > 0 || quota.vipTotal === 0);
    } else {
      // 普通用户：积分足够 AND 名额未满
      return userPoints >= activity.points_required && (quota.regularRemaining > 0 || quota.regularTotal === 0);
    }
  },

  /** 获取兑换方式文案 */
  getRedeemLabel() {
    const { isVip, vipMonthlyRemaining, activity } = this.data;
    if (!activity) return '';

    if (isVip && vipMonthlyRemaining > 0) {
      return '🎫 免积分参与（消耗1次月度额度）';
    }
    return `⭐ 消耗 ${activity.points_required} 积分参与`;
  },

  /** 兑换操作 */
  async handleRedeem() {
    if (this.data.redeeming || this.data.redeemed) return;

    // 二次确认
    const { isVip, vipMonthlyRemaining, activity } = this.data;
    let confirmText = '';
    if (isVip && vipMonthlyRemaining > 0) {
      confirmText = `确认使用 1 次月度免积分额度参与「${activity.title}」？`;
    } else {
      confirmText = `确认消耗 ${activity.points_required} 积分参与「${activity.title}」？`;
    }

    const confirmRes = await new Promise(resolve => {
      wx.showModal({
        title: '确认参与',
        content: confirmText,
        success: resolve
      });
    });

    if (!confirmRes.confirm) return;

    this.setData({ redeeming: true });

    try {
      const res = await api.post(`/activities/${this.data.activityId}/redeem`);
      const result = res.data;

      // 更新全局积分
      app.globalData.points = result.remainingPoints;
      if (result.redeemType === 'vip_free' && app.globalData.vip) {
        app.globalData.vip.monthlyRemaining = result.vipMonthlyRemaining;
        app.globalData.vip.monthlyUsed = (app.globalData.vip.monthlyUsed || 0) + 1;
      }

      this.setData({
        redeeming: false,
        redeemed: true,
        redeemResult: result,
        userPoints: result.remainingPoints,
        vipMonthlyRemaining: result.vipMonthlyRemaining || this.data.vipMonthlyRemaining
      });

      wx.showToast({ title: '参与成功！', icon: 'success' });

      // 刷新活动详情
      this.loadDetail(this.data.activityId);
    } catch (err) {
      this.setData({ redeeming: false });
    }
  },

  /** 查看兑换码 */
  handleViewCode() {
    const { redeemResult } = this.data;
    if (redeemResult?.code) {
      wx.navigateTo({
        url: `/pages/qrcode/qrcode?code=${redeemResult.code}&gift=${encodeURIComponent(this.data.activity?.gift_name || '')}`
      });
    }
  },

  /** 分享 */
  onShareAppMessage() {
    const { activity } = this.data;
    return {
      title: activity?.title || '精彩活动等你来',
      path: `/pages/activity/activity?id=${this.data.activityId}`
    };
  }
});
