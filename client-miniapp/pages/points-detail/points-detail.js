const API = require('../../utils/api');
const Auth = require('../../utils/auth');
const { POINTS_TYPE_TEXT } = require('../../utils/constants');

Page({
  data: {
    records: [],
    page: 1,
    totalPages: 1,
    isLoading: false,
    typeText: POINTS_TYPE_TEXT,
    currentBalance: 0,
    filterType: ''
  },

  onLoad() {
    const member = Auth.getMember();
    if (member) {
      this.setData({ currentBalance: member.pointsBalance || 0 });
    }
    this.loadRecords(true);
  },

  onShow() {
    const member = Auth.getMember();
    if (member && member.pointsBalance !== this.data.currentBalance) {
      this.setData({ currentBalance: member.pointsBalance });
    }
    this.loadRecords(true);
  },

  async loadRecords(refresh = false) {
    if (this.data.isLoading) return;
    if (refresh) this.setData({ page: 1, records: [] });

    this.setData({ isLoading: true });
    try {
      const result = await API.getPointsRecords(this.data.page, this.data.filterType);
      this.setData({
        records: refresh ? result.list : [...this.data.records, ...result.list],
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
      this.loadRecords();
    }
  },

  filterByType(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({ filterType: type, page: 1 });
    this.loadRecords(true);
  }
});
