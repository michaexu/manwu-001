/**
 * 商家活动列表
 */
const merchantService = require('../../../services/merchant');

Page({
  data: {
    activities: [],
    page: 1,
    pageSize: 20,
    hasMore: true,
    loading: true
  },

  onLoad() {
    this.loadActivities();
  },

  onShow() {
    // 从创建页返回时刷新
    if (this.data.activities.length > 0) {
      this.setData({ page: 1, activities: [], hasMore: true });
      this.loadActivities();
    }
  },

  async loadActivities() {
    const { page, pageSize } = this.data;
    try {
      const res = await merchantService.getActivities({ page, page_size: pageSize });
      const activities = (res.data && res.data.activities) || [];

      this.setData({
        activities: page === 1 ? activities : [...this.data.activities, ...activities],
        hasMore: activities.length >= pageSize,
        loading: false
      });
    } catch (err) {
      this.setData({ loading: false });
    }
  },

  onLoadMore() {
    if (!this.data.hasMore || this.data.loading) return;
    this.setData({ page: this.data.page + 1, loading: true });
    this.loadActivities();
  },

  /** 创建活动 */
  onCreate() {
    wx.navigateTo({
      url: '/subpackages/merchant-admin/activity-create/activity-create'
    });
  },

  /** 编辑 */
  onEdit(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/subpackages/merchant-admin/activity-create/activity-create?id=${id}`
    });
  },

  /** 切换状态 */
  async onToggleStatus(e) {
    const { id, status } = e.currentTarget.dataset;
    const newStatus = status === 'active' ? 'inactive' : 'active';

    wx.showModal({
      title: '确认操作',
      content: `确定要${newStatus === 'active' ? '上架' : '下架'}此活动吗？`,
      confirmColor: '#DC2626',
      success: async (modalRes) => {
        if (!modalRes.confirm) return;
        try {
          await merchantService.updateActivityStatus(id, newStatus);
          wx.showToast({ title: '操作成功', icon: 'success' });
          this.setData({ page: 1, activities: [], hasMore: true });
          this.loadActivities();
        } catch (err) {}
      }
    });
  }
});
