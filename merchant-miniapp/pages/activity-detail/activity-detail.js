const API = require('../../utils/api');

Page({
  data: {
    activity: null,
    registrations: [],
    page: 1,
    totalPages: 1,
    isLoading: true,
    activityId: '',
    filterStatus: '',
    tabs: [
      { label: '全部', value: '' },
      { label: '已报名', value: 'registered' },
      { label: '已核销', value: 'claimed' },
      { label: '已取消', value: 'cancelled' }
    ]
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ activityId: options.id });
      this.loadActivity(options.id);
      this.loadRegistrations(true);
    }
  },

  async loadActivity(id) {
    try {
      const result = await API.getActivities(1);
      const found = result.list.find(a => a.id === id);
      if (found) {
        this.setData({ activity: found });
      }
    } catch (err) {}
  },

  async loadRegistrations(refresh = false) {
    if (refresh) this.setData({ page: 1, registrations: [] });
    this.setData({ isLoading: true });
    try {
      const result = await API.getActivityRegistrations(
        this.data.activityId,
        this.data.page,
        this.data.filterStatus
      );
      this.setData({
        registrations: refresh ? result.list : [...this.data.registrations, ...result.list],
        totalPages: result.totalPages,
        isLoading: false
      });
    } catch (err) {
      this.setData({ isLoading: false });
    }
  },

  filterByStatus(e) {
    const status = e.currentTarget.dataset.status;
    this.setData({ filterStatus: status });
    this.loadRegistrations(true);
  },

  goToEdit() {
    wx.navigateTo({
      url: `/pages/activity-create/activity-create?id=${this.data.activityId}`
    });
  }
});
