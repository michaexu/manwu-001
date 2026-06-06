/**
 * 兑换记录页
 * 显示用户所有兑换记录（待核销/已核销/已取消/已过期）
 */
const { api } = require('../../utils/request');
const app = getApp();

Page({
  data: {
    records: [],
    activeTab: 'all',
    tabs: [
      { key: 'all', label: '全部' },
      { key: 'pending', label: '待核销' },
      { key: 'confirmed', label: '已核销' },
      { key: 'cancelled', label: '已取消' }
    ],
    page: 1,
    total: 0,
    hasMore: true,
    loading: false,
    statusMap: {
      pending: { label: '待核销', color: '#D97706', bg: '#FEF3C7' },
      confirmed: { label: '已核销', color: '#059669', bg: '#D1FAE5' },
      cancelled: { label: '已取消', color: '#64748B', bg: '#F1F5F9' },
      expired: { label: '已过期', color: '#EF4444', bg: '#FEE2E2' }
    }
  },

  onLoad() {
    this.loadRecords();
  },

  onPullDownRefresh() {
    this.setData({ page: 1, records: [], hasMore: true });
    this.loadRecords().then(() => wx.stopPullDownRefresh());
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadRecords();
    }
  },

  /** 切换Tab */
  onTabChange(e) {
    const { tab } = e.currentTarget.dataset;
    if (tab === this.data.activeTab) return;
    this.setData({ activeTab: tab, page: 1, records: [], hasMore: true });
    this.loadRecords();
  },

  /** 加载兑换记录 */
  async loadRecords() {
    if (this.data.loading) return;
    this.setData({ loading: true });

    try {
      const { activeTab, page } = this.data;
      const params = { page, page_size: 20 };
      if (activeTab !== 'all') {
        params.status = activeTab;
      }

      const res = await api.get('/activities/redeem-history', params);
      const newRecords = res.data.records || [];

      this.setData({
        records: page === 1 ? newRecords : [...this.data.records, ...newRecords],
        total: res.data.total || 0,
        hasMore: newRecords.length >= 20,
        page: page + 1,
        loading: false
      });
    } catch (err) {
      this.setData({ loading: false });
    }
  },

  /** 查看详情 */
  onTapRecord(e) {
    const { code } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/qrcode/qrcode?code=${code}` });
  }
});
