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
      const records = res.data?.records || [];

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
  },

  _formatTime(dateStr) {
    const d = new Date(dateStr);
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const h = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${m}-${day} ${h}:${min}`;
  }
});
