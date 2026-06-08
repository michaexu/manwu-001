/**
 * 积分明细页
 * 设计参照 Ardot 8:119
 */
const pointsService = require('../../services/points');

Page({
  data: {
    statusBarHeight: 20,
    balance: 0,
    activeTab: 'all',   // all | income | expense
    records: [],
    page: 1,
    pageSize: 20,
    hasMore: true,
    loading: true
  },

  onLoad() {
    const sysInfo = wx.getSystemInfoSync();
    this.setData({ statusBarHeight: sysInfo.statusBarHeight || 20 });
    this.loadData();
  },

  onShow() {
    // 更新积分余额
    const app = getApp();
    if (app.globalData.points !== undefined) {
      this.setData({ balance: app.globalData.points });
    }
  },

  async loadData() {
    const { page, pageSize, activeTab } = this.data;
    try {
      const res = await pointsService.getHistory(page, pageSize);
      const { balance, records, total } = res.data;

      const filtered = this._filterRecords(records, activeTab);

      this.setData({
        balance: balance || this.data.balance,
        records: page === 1 ? filtered : [...this.data.records, ...filtered],
        hasMore: records && records.length >= pageSize,
        loading: false
      });
    } catch (err) {
      this.setData({ loading: false });
    }
  },

  /** 切换 Tab */
  onTabChange(e) {
    const tab = e.currentTarget.dataset.tab;
    if (tab === this.data.activeTab) return;

    this.setData({ activeTab: tab, page: 1, records: [], hasMore: true, loading: true });
    this.loadData();
  },

  /** 加载更多 */
  onLoadMore() {
    if (!this.data.hasMore || this.data.loading) return;
    this.setData({ page: this.data.page + 1, loading: true });
    this.loadData();
  },

  /** 返回 */
  onBack() {
    wx.navigateBack();
  },

  /** 过滤记录 */
  _filterRecords(records, tab) {
    if (tab === 'all') return records;
    return records.filter(r => {
      if (tab === 'income') return r.points > 0;
      if (tab === 'expense') return r.points < 0;
      return true;
    });
  },

  /** 按日期分组 */
  get groupedRecords() {
    const { records } = this.data;
    const groups = [];
    let currentDate = '';
    let currentGroup = null;

    records.forEach(record => {
      const rec = Object.assign({}, record, { created_at: (record.created_at || '').substring(0, 10) });
      const date = this._formatGroupDate(rec.created_at);
      if (date !== currentDate) {
        currentDate = date;
        currentGroup = { date, items: [] };
        groups.push(currentGroup);
      }
      currentGroup.items.push(rec);
    });

    return groups;
  },

  _formatGroupDate(dateStr) {
    if (!dateStr) return '';
    return dateStr.substring(0, 10);
  },
  },

  /** 获取类型图标 */
  _getTypeIcon(type) {
    const icons = {
      checkin: '📅',
      ad: '📺',
      redeem: '🎁',
      bonus: '🎉',
      refund: '↩️'
    };
    return icons[type] || '📌';
  },

  /** 获取类型名称 */
  _getTypeName(type) {
    const names = {
      checkin: '每日签到',
      ad: '观看广告',
      redeem: '兑换活动',
      bonus: '活动奖励',
      refund: '积分退还'
    };
    return names[type] || '积分变动';
  }
});
