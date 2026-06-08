/**
 * 活动页 — 双模式：无 id 显示列表，有 id 显示详情
 */
const { api } = require('../../utils/request');
const app = getApp();

Page({
  data: {
    mode: 'list',        // 'list' | 'detail'
    // 列表模式
    activities: [],
    listLoading: true,
    listPage: 1,
    hasMore: true,
    // 详情模式
    activityId: '',
    activity: null,
    loading: true,
    // 用户相关
    isLoggedIn: false,
    isVip: false,
    vipMonthlyRemaining: 0,
    userPoints: 0,
    // 兑换按钮状态（在 JS 中计算，WXML 直接绑定）
    redeemBtn: {
      showLogin: false,       // 显示"请先登录"
      showRedeem: false,      // 显示"立即参与"
      showCode: false,        // 显示"查看兑换码"
      disabled: true,
      loading: false,
      btnText: '立即参与',
      label: '',
      hint: ''
    },
    // 兑换状态
    redeeming: false,
    redeemed: false,
    redeemResult: null
  },

  onLoad(options) {
    const { id } = options;
    if (id) {
      this.setData({ mode: 'detail', activityId: id });
      this.loadDetail(id);
    } else {
      this.setData({ mode: 'list' });
      this.loadList();
    }
  },

  onShow() {
    const token = wx.getStorageSync('access_token');
    const isLoggedIn = !!token;
    this.setData({
      isLoggedIn,
      userPoints: app.globalData.points || 0,
      isVip: app.globalData.vipLevel > 0,
      vipMonthlyRemaining: (app.globalData.vip && app.globalData.vip.monthlyRemaining) || 0
    });
    this._updateRedeemBtn();

    // 从首页跳转过来（switchTab 不支持传参，通过 globalData 传递）
    const pendingId = app.globalData.pendingActivityId;
    if (pendingId) {
      app.globalData.pendingActivityId = null;
      this.setData({ mode: 'detail', activityId: pendingId, loading: true });
      this.loadDetail(pendingId);
      return;
    }

    // 列表模式下每次显示都刷新
    if (this.data.mode === 'list') {
      this.setData({ listPage: 1, activities: [], hasMore: true });
      this.loadList();
    }
  },

  onPullDownRefresh() {
    if (this.data.mode === 'list') {
      this.setData({ listPage: 1, activities: [], hasMore: true });
      this.loadList().finally(() => wx.stopPullDownRefresh());
    } else {
      this.loadDetail(this.data.activityId).finally(() => wx.stopPullDownRefresh());
    }
  },

  onReachBottom() {
    if (this.data.mode === 'list' && this.data.hasMore) {
      this.loadList();
    }
  },

  // ========== 列表模式 ==========
  async loadList() {
    const { listPage, activities } = this.data;
    try {
      const res = await api.get('/activities', { page: listPage, page_size: 10 });
      const data = res.data || {};
      const newList = data.activities || [];
      const total = data.total || 0;

      this.setData({
        activities: listPage === 1 ? newList : [...activities, ...newList],
        listLoading: false,
        listPage: listPage + 1,
        hasMore: this.data.activities.length + newList.length < total
      });
    } catch (err) {
      this.setData({ listLoading: false });
    }
  },

  handleActivityTap(e) {
    const { id } = e.currentTarget.dataset;
    this.setData({ mode: 'detail', activityId: id, loading: true, redeemed: false, redeemResult: null });
    this.loadDetail(id);
  },

  backToList() {
    this.setData({ mode: 'list', activity: null, activityId: '', redeemed: false, redeemResult: null });
  },

  // ========== 详情模式 ==========
  async loadDetail(id) {
    try {
      const res = await api.get(`/activities/${id}`);
      const activity = res.data;

      // 如果已有兑换记录，恢复 redeemResult 以便查看兑换码
      let redeemed = false;
      let redeemResult = null;
      if (activity.user_redemption && activity.user_redemption.code) {
        redeemed = true;
        redeemResult = {
          code: activity.user_redemption.code,
          pointsSpent: activity.user_redemption.points_spent || 0,
          redeemType: activity.user_redemption.redeem_type || 'points'
        };
      }

      this.setData({
        activity: Object.assign(activity, {
          start_time: activity.start_time ? activity.start_time.substring(0, 10) : '',
          end_time: activity.end_time ? activity.end_time.substring(0, 10) : ''
        }),
        loading: false,
        redeemed,
        redeemResult
      });
      this._updateRedeemBtn();
    } catch (err) {
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  // ========== 计算兑换按钮状态 ==========
  _getQuotaInfo() {
    const { activity } = this.data;
    if (!activity) return { vipTotal: 0, vipRemaining: 0, regularTotal: 0, regularRemaining: 0 };
    return {
      vipTotal: activity.vip_quota || 0,
      vipRemaining: (activity.vip_quota || 0) - (activity.vip_redeemed_count || 0),
      regularTotal: activity.regular_quota || 0,
      regularRemaining: (activity.regular_quota || 0) - (activity.regular_redeemed_count || 0)
    };
  },

  _updateRedeemBtn() {
    const { activity, isLoggedIn, isVip, vipMonthlyRemaining, userPoints, redeeming, redeemed } = this.data;

    // 已兑换 → 显示查看兑换码
    if (redeemed) {
      this.setData({
        redeemBtn: { showLogin: false, showRedeem: false, showCode: true, disabled: false, loading: false, btnText: '', label: '', hint: '' }
      });
      return;
    }

    // 未登录
    if (!isLoggedIn) {
      this.setData({
        redeemBtn: { showLogin: true, showRedeem: false, showCode: false, disabled: false, loading: false, btnText: '请先登录', label: '请先登录后再参与活动', hint: '' }
      });
      return;
    }

    // 无活动数据
    if (!activity) {
      this.setData({
        redeemBtn: { showLogin: false, showRedeem: true, showCode: false, disabled: true, loading: false, btnText: '立即参与', label: '', hint: '' }
      });
      return;
    }

    // 活动已结束
    if (activity.status !== 'active') {
      this.setData({
        redeemBtn: { showLogin: false, showRedeem: true, showCode: false, disabled: true, loading: redeeming, btnText: redeeming ? '处理中...' : '立即参与', label: '活动已结束', hint: '该活动已结束，无法参与' }
      });
      return;
    }

    const quota = this._getQuotaInfo();
    let label = '';
    let hint = '';
    let canRedeem = false;

    if (isVip && vipMonthlyRemaining > 0) {
      // VIP 免积分模式
      label = '🎫 免积分参与（消耗1次月度额度）';
      if (quota.vipTotal > 0 && quota.vipRemaining <= 0) {
        hint = 'VIP名额已满';
      } else {
        canRedeem = true;
      }
    } else if (isVip) {
      // VIP 但免积分用完，回退积分兑换
      label = `⭐ 消耗 ${activity.points_required} 积分参与`;
      if (quota.vipTotal > 0 && quota.vipRemaining <= 0) {
        hint = 'VIP名额已满';
      } else if (userPoints < activity.points_required) {
        hint = `积分不足（需${activity.points_required}，当前${userPoints}）`;
      } else {
        canRedeem = true;
      }
    } else {
      // 普通用户
      label = `⭐ 消耗 ${activity.points_required} 积分参与`;
      if (quota.regularTotal > 0 && quota.regularRemaining <= 0) {
        hint = '普通名额已满';
      } else if (userPoints < activity.points_required) {
        hint = `积分不足（需${activity.points_required}，当前${userPoints}）`;
      } else {
        canRedeem = true;
      }
    }

    this.setData({
      redeemBtn: {
        showLogin: false,
        showRedeem: true,
        showCode: false,
        disabled: !canRedeem || redeeming,
        loading: redeeming,
        btnText: redeeming ? '处理中...' : '立即参与',
        label,
        hint
      }
    });
  },

  handleGoLogin() {
    wx.reLaunch({ url: '/pages/login/login' });
  },

  async handleRedeem() {
    if (this.data.redeeming || this.data.redeemed) return;

    const { isVip, vipMonthlyRemaining, activity } = this.data;
    let confirmText = '';
    if (isVip && vipMonthlyRemaining > 0) {
      confirmText = `确认使用 1 次月度免积分额度参与「${activity.title}」？`;
    } else {
      confirmText = `确认消耗 ${activity.points_required} 积分参与「${activity.title}」？`;
    }

    const confirmRes = await new Promise(resolve => {
      wx.showModal({ title: '确认参与', content: confirmText, success: resolve });
    });
    if (!confirmRes.confirm) return;

    this.setData({ redeeming: true });
    this._updateRedeemBtn();

    try {
      const res = await api.post(`/activities/${this.data.activityId}/redeem`);
      const result = res.data;
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
      this._updateRedeemBtn();
      wx.showToast({ title: '参与成功！', icon: 'success' });
      this.loadDetail(this.data.activityId);
    } catch (err) {
      this.setData({ redeeming: false });
      this._updateRedeemBtn();
    }
  },

  handleViewCode() {
    const { redeemResult, activity } = this.data;
    if (redeemResult && redeemResult.code) {
      const gift = (activity && activity.gift_name) || '';
      const params = [
        `code=${encodeURIComponent(redeemResult.code)}`,
        `gift=${encodeURIComponent(gift)}`,
        `type=${redeemResult.redeemType || 'points'}`,
        `spent=${redeemResult.pointsSpent || 0}`
      ];
      wx.navigateTo({ url: `/pages/qrcode/qrcode?${params.join('&')}` });
    }
  },

  onShareAppMessage() {
    const { activity, activityId } = this.data;
    return {
      title: (activity && activity.title) || '精彩活动等你来',
      path: `/pages/activity/activity?id=${activityId}`
    };
  }
});
