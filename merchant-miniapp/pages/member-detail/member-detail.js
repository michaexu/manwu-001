const API = require('../../utils/api');

Page({
  data: {
    member: null,
    memberId: '',
    isLoading: true
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ memberId: options.id });
      this.loadMember(options.id);
    }
  },

  async loadMember(id) {
    this.setData({ isLoading: true });
    try {
      const member = await API.getMemberDetail(id);
      this.setData({ member, isLoading: false });
    } catch (err) {
      this.setData({ isLoading: false });
    }
  }
});
