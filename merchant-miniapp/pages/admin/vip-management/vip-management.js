const API = require('../../../utils/api');

Page({
  data: {
    members: [],
    page: 1,
    totalPages: 1,
    isLoading: false,
    keyword: ''
  },

  onShow() {
    this.loadMembers(true);
  },

  async loadMembers(refresh = false) {
    if (this.data.isLoading) return;
    if (refresh) this.setData({ page: 1, members: [] });
    this.setData({ isLoading: true });
    try {
      const result = await API.getMembers(this.data.page, this.data.keyword);
      this.setData({
        members: refresh ? result.list : [...this.data.members, ...result.list],
        totalPages: result.totalPages,
        isLoading: false
      });
    } catch (err) {
      this.setData({ isLoading: false });
    }
  },

  handleSearch(e) {
    this.setData({ keyword: e.detail.value });
  },
  onSearchConfirm() {
    this.loadMembers(true);
  },

  handleToggleVip(e) {
    const { id, isVip, nickname } = e.currentTarget.dataset;
    const action = isVip ? '撤销' : '开通';
    const confirmText = isVip
      ? `确定撤销 ${nickname} 的 VIP 权限？撤销后将恢复为普通会员`
      : `确定为 ${nickname} 开通 VIP 权限？`;

    wx.showModal({
      title: `${action} VIP`,
      content: confirmText,
      success: async (res) => {
        if (res.confirm) {
          try {
            if (isVip) {
              await API.revokeVip(id);
            } else {
              await API.grantVip(id);
            }
            wx.showToast({ title: `${action}成功`, icon: 'success' });
            this.loadMembers(true);
          } catch (err) {}
        }
      }
    });
  }
});
