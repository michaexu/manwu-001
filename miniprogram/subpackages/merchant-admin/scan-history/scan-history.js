/**
 * 商家核销记录
 */
const scanService = require('../../../services/scan');

Page({
  data: {
    records: [],
    page: 1,
    pageSize: 20,
    hasMore: true,
    loading: true
  },

  onLoad() {
    this.loadHistory();
  },

  async loadHistory() {
    const { page, pageSize } = this.data;
    try {
      const res = await scanService.getScanHistory(page, pageSize);
      const records = ((res.data && res.data.records) || []).map(r => Object.assign(r, {
        created_at: (r.created_at || '').substring(0, 10),
        confirmed_at: r.confirmed_at ? r.confirmed_at.substring(0, 10) : ''
      }));

      this.setData({
        records: page === 1 ? records : [...this.data.records, ...records],
        hasMore: records.length >= pageSize,
        loading: false
      });
    } catch (err) {
      this.setData({ loading: false });
    }
  },

  onLoadMore() {
    if (!this.data.hasMore || this.data.loading) return;
    this.setData({ page: this.data.page + 1, loading: true });
    this.loadHistory();
  },

  /** 查看详情 */
  onTapRecord(e) {
    const { code } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/scan/scan?code=${encodeURIComponent(code)}`
    });
  }
});
