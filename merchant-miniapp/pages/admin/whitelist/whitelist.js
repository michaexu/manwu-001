const API = require('../../../utils/api');

Page({
  data: {
    list: [],
    isLoading: true,
    showForm: false,
    phone: '',
    nickname: ''
  },

  onShow() {
    this.loadList();
  },

  async loadList() {
    this.setData({ isLoading: true });
    try {
      const list = await API.getWhitelist();
      this.setData({ list, isLoading: false });
    } catch (err) {
      this.setData({ isLoading: false });
    }
  },

  showAddForm() {
    this.setData({ showForm: true, phone: '', nickname: '' });
  },
  hideForm() { this.setData({ showForm: false }); },

  handlePhoneInput(e) { this.setData({ phone: e.detail.value }); },
  handleNameInput(e) { this.setData({ nickname: e.detail.value }); },

  async handleAdd() {
    const { phone, nickname } = this.data;
    if (!phone) {
      wx.showToast({ title: '请输入手机号', icon: 'none' });
      return;
    }
    try {
      await API.addWhitelist(phone, nickname || phone);
      wx.showToast({ title: '添加成功', icon: 'success' });
      this.setData({ showForm: false });
      this.loadList();
    } catch (err) {}
  },

  handleDelete(e) {
    const { id, phone } = e.currentTarget.dataset;
    wx.showModal({
      title: '删除确认',
      content: `删除 ${phone} 后将立即失去商家端权限`,
      success: async (res) => {
        if (res.confirm) {
          try {
            await API.deleteWhitelist(id);
            wx.showToast({ title: '已删除', icon: 'success' });
            this.loadList();
          } catch (err) {}
        }
      }
    });
  }
});
