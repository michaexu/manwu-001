const API = require('../../utils/api');

Page({
  data: {
    activities: [],
    page: 1,
    totalPages: 1,
    isLoading: false,
    filterStatus: '',
    statusOptions: [
      { label: '全部', value: '' },
      { label: '进行中', value: 'published' },
      { label: '草稿', value: 'draft' },
      { label: '已结束', value: 'ended' },
      { label: '已下架', value: 'unpublished' }
    ]
  },

  onShow() {
    this.checkLogin();
    this.loadActivities(true);
  },

  checkLogin() {
    if (!getApp().isLoggedIn()) {
      wx.redirectTo({ url: '/pages/login/login' });
    }
  },

  onPullDownRefresh() {
    this.loadActivities(true).then(() => wx.stopPullDownRefresh());
  },

  async loadActivities(refresh = false) {
    if (this.data.isLoading) return;
    if (refresh) this.setData({ page: 1, activities: [] });

    this.setData({ isLoading: true });
    try {
      const result = await API.getActivities(this.data.page, this.data.filterStatus);
      this.setData({
        activities: refresh ? result.list : [...this.data.activities, ...result.list],
        totalPages: result.totalPages,
        isLoading: false
      });
    } catch (err) {
      this.setData({ isLoading: false });
    }
  },

  onReachBottom() {
    if (this.data.page < this.data.totalPages) {
      this.setData({ page: this.data.page + 1 });
      this.loadActivities();
    }
  },

  filterByStatus(e) {
    const status = e.currentTarget.dataset.status;
    this.setData({ filterStatus: status });
    this.loadActivities(true);
  },

  goToCreate() {
    wx.navigateTo({ url: '/pages/activity-create/activity-create' });
  },

  goToDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/activity-detail/activity-detail?id=${id}` });
  },

  handlePublish(e) {
    const { id } = e.currentTarget.dataset;
    wx.showModal({
      title: '发布活动',
      content: '发布后用户端可见，确认发布？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await API.publishActivity(id);
            wx.showToast({ title: '发布成功', icon: 'success' });
            this.loadActivities(true);
          } catch (err) { /* handled by api */ }
        }
      }
    });
  },

  handleUnpublish(e) {
    const { id } = e.currentTarget.dataset;
    wx.showModal({
      title: '下架活动',
      content: '下架后用户端不再显示，已报名用户保留记录，确认下架？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await API.unpublishActivity(id);
            wx.showToast({ title: '已下架', icon: 'success' });
            this.loadActivities(true);
          } catch (err) { /* handled by api */ }
        }
      }
    });
  }
});
