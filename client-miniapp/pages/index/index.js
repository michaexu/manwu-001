// 活动广场页面
const API = require('../../utils/api');
const Auth = require('../../utils/auth');

Page({
  data: {
    activities: [],
    page: 1,
    totalPages: 1,
    isLoading: false,
    memberInfo: null
  },

  onLoad() {
    this.loadActivities(true);
  },

  onShow() {
    this.loadActivities(true);
    // 刷新登录态显示
    const member = Auth.getMember();
    if (member) {
      this.setData({ memberInfo: member });
    }
  },

  async loadActivities(refresh = false) {
    if (this.data.isLoading) return;
    if (refresh) this.setData({ page: 1, activities: [] });

    this.setData({ isLoading: true });
    try {
      const result = await API.getActivities(this.data.page);
      this.setData({
        activities: refresh ? result.list : [...this.data.activities, ...result.list],
        totalPages: result.totalPages,
        isLoading: false
      });
    } catch (err) {
      this.setData({ isLoading: false });
    }
  },

  onPullDownRefresh() {
    this.loadActivities(true).then(() => wx.stopPullDownRefresh());
  },

  onReachBottom() {
    if (this.data.page < this.data.totalPages) {
      this.setData({ page: this.data.page + 1 });
      this.loadActivities();
    }
  },

  goToDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/activity-detail/activity-detail?id=${id}` });
  },

  onCoverError(e) {
    const idx = e.currentTarget.dataset.index;
    const key = `activities[${idx}]._coverError`;
    this.setData({ [key]: true });
  }
});
