const API = require('../../utils/api');

Page({
  data: {
    members: [],
    page: 1,
    totalPages: 1,
    isLoading: false,
    keyword: '',
    memberType: ''
  },

  onShow() {
    this.checkLogin();
    this.loadMembers(true);
  },

  checkLogin() {
    if (!getApp().isLoggedIn()) {
      wx.redirectTo({ url: '/pages/login/login' });
    }
  },

  async loadMembers(refresh = false) {
    if (this.data.isLoading) return;
    if (refresh) this.setData({ page: 1, members: [] });

    this.setData({ isLoading: true });
    try {
      const result = await API.getMembers(this.data.page, this.data.keyword, this.data.memberType);
      this.setData({
        members: refresh ? result.list : [...this.data.members, ...result.list],
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
      this.loadMembers();
    }
  },

  handleSearch(e) {
    this.setData({ keyword: e.detail.value });
  },

  onSearchConfirm() {
    this.loadMembers(true);
  },

  goToDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/member-detail/member-detail?id=${id}` });
  }
});
