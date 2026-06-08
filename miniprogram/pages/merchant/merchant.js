/**
 * 商家后台 — 仪表盘 + 活动列表
 */
const merchantService = require('../../services/merchant');
const { logout } = require('../../utils/auth');

Page({
  data: {
    statusBarHeight: 20,
    shopName: '',
    loading: true,

    // 概览
    overview: { totalActivities: 0, activeActivities: 0, totalRedemptions: 0, confirmedRedemptions: 0 },
    // 月度趋势
    monthlyTrend: [],
    maxMonthCount: 1,
    // 热门活动
    topActivities: [],

    // 分步视图：dashboard | list
    viewMode: 'dashboard',

    // 列表视图数据
    activities: [],
    listPage: 1,
    hasMore: true,
    listLoading: false,

    // 展开的参与者
    expandedId: '',
    expandedParticipants: [],
    participantsLoading: false
  },

  onLoad() {
    const { statusBarHeight } = wx.getWindowInfo();
    this.setData({ statusBarHeight });
  },

  onShow() {
    const app = getApp();
    if (!app.globalData.isMerchant) {
      wx.showToast({ title: '仅商家可访问', icon: 'none' });
      setTimeout(() => wx.switchTab({ url: '/pages/profile/profile' }), 1500);
      return;
    }
    this.setData({
      shopName: (app.globalData.merchantInfo && app.globalData.merchantInfo.name) || '我的店铺'
    });
    this.loadDashboard();
  },

  onPullDownRefresh() {
    if (this.data.viewMode === 'dashboard') {
      this.loadDashboard().finally(() => wx.stopPullDownRefresh());
    } else {
      this.setData({ listPage: 1, activities: [], hasMore: true, expandedId: '', expandedParticipants: [] });
      this.loadActivities().finally(() => wx.stopPullDownRefresh());
    }
  },

  /** 加载仪表盘 */
  async loadDashboard() {
    try {
      const res = await merchantService.getDashboard();
      const d = res.data;
      const overview = {
        totalActivities: +d.activities.total_activities || 0,
        activeActivities: +d.activities.active_activities || 0,
        pausedActivities: +d.activities.paused_activities || 0,
        endedActivities: +d.activities.ended_activities || 0,
        totalRedemptions: +d.redemptions.total_redemptions || 0,
        confirmedRedemptions: +d.redemptions.confirmed_redemptions || 0,
        pendingRedemptions: +d.redemptions.pending_redemptions || 0,
        vipRedemptions: +d.redemptions.vip_redemptions || 0,
        pointsRedemptions: +d.redemptions.points_redemptions || 0,
        totalPointsSpent: +d.redemptions.total_points_spent || 0
      };

      const monthlyTrend = d.monthlyTrend || [];
      const maxMonthCount = Math.max(1, ...monthlyTrend.map(m => +m.count));

      this.setData({ overview, monthlyTrend, maxMonthCount, topActivities: d.topActivities || [], loading: false });
    } catch (err) {
      this.setData({ loading: false });
    }
  },

  /** 切换到活动列表 */
  switchToList() {
    this.setData({ viewMode: 'list', listPage: 1, activities: [], hasMore: true });
    this.loadActivities();
  },

  /** 切回仪表盘 */
  switchToDashboard() {
    this.setData({ viewMode: 'dashboard' });
    this.loadDashboard();
  },

  /** 切到账户管理 */
  switchToAccount() {
    const app = getApp();
    this.setData({
      viewMode: 'account',
      shopName: (app.globalData.merchantInfo && app.globalData.merchantInfo.name) || '我的店铺'
    });
  },

  /** 退出登录 */
  handleLogout() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出当前商家账户吗？',
      success: (res) => {
        if (res.confirm) logout();
      }
    });
  },

  onReachBottom() {
    if (this.data.viewMode === 'list' && this.data.hasMore) this.loadActivities();
  },

  async loadActivities() {
    const { listPage, activities } = this.data;
    if (this.data.listLoading) return;
    this.setData({ listLoading: true });
    try {
      const res = await merchantService.getActivities({ page: listPage, page_size: 10 });
      const data = res.data || {};
      const newList = data.activities || [];
      const total = data.total || 0;
      this.setData({
        activities: listPage === 1 ? newList : [...activities, ...newList],
        listPage: listPage + 1,
        hasMore: this.data.activities.length + newList.length < total,
        listLoading: false
      });
    } catch (err) {
      this.setData({ listLoading: false });
    }
  },

  async toggleExpand(e) {
    const { id } = e.currentTarget.dataset;
    if (this.data.expandedId === id) {
      this.setData({ expandedId: '', expandedParticipants: [] });
      return;
    }
    this.setData({ expandedId: id, participantsLoading: true, expandedParticipants: [] });
    try {
      const res = await merchantService.getParticipants(id);
      const participants = (res.data || []).map(p => ({
        ...p,
        avatar: (p.nick_name || '匿名')[0],
        created_at: (p.created_at || '').substring(0, 10)
      }));
      this.setData({ expandedParticipants: participants, participantsLoading: false });
    } catch (err) {
      this.setData({ participantsLoading: false });
    }
  },

  onCreate() {
    wx.navigateTo({
      url: '/subpackages/merchant-admin/activity-create/activity-create'
    });
  },

  onEdit(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/subpackages/merchant-admin/activity-create/activity-create?id=${id}`
    });
  },

  onDelete(e) {
    const { id, title } = e.currentTarget.dataset;
    wx.showModal({
      title: '删除活动',
      content: `确认删除「${title}」？此操作不可撤销。`,
      confirmColor: '#DC2626',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          await merchantService.deleteActivity(id);
          wx.showToast({ title: '已删除', icon: 'success' });
          const activities = this.data.activities.filter(a => a.id !== id);
          this.setData({ activities });
        } catch (err) { /* handled */ }
      }
    });
  },

  onToggleStatus(e) {
    const { id, status } = e.currentTarget.dataset;
    const newStatus = status === 'active' ? 'paused' : 'active';
    const label = newStatus === 'active' ? '上架' : '暂停';
    wx.showModal({
      title: '确认操作',
      content: `确定要${label}此活动吗？`,
      confirmColor: '#DC2626',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          await merchantService.updateActivityStatus(id, newStatus);
          const activities = this.data.activities.map(a =>
            a.id === id ? { ...a, status: newStatus } : a
          );
          this.setData({ activities });
          wx.showToast({ title: '操作成功', icon: 'success' });
        } catch (err) { /* handled */ }
      }
    });
  },

  onScanCode() {
    wx.scanCode({
      onlyFromCamera: true,
      scanType: ['barCode', 'qrCode'],
      success: (res) => {
        wx.navigateTo({
          url: `/pages/scan/scan?code=${encodeURIComponent(res.result)}`
        });
      },
      fail: (err) => {
        if (err.errMsg !== 'scanCode:fail cancel') {
          wx.showToast({ title: '扫码失败', icon: 'none' });
        }
      }
    });
  }
});
