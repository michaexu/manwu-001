const API = require('../../utils/api');

Page({
  data: {
    isEdit: false,
    activityId: '',
    form: {
      title: '',
      coverImage: '',
      prizeDesc: '',
      location: '',
      startTime: '',
      endTime: '',
      maxParticipants: 0,
      vipQuota: 0,
      regularQuota: 0,
      pointsRequired: 0,
      description: ''
    },
    submitting: false
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ isEdit: true, activityId: options.id });
      this.loadActivity(options.id);
      wx.setNavigationBarTitle({ title: '编辑活动' });
    }
  },

  async loadActivity(id) {
    try {
      const act = await API.getActivities(1);
      // 暂时用列表查找，后续可加详情接口
      wx.showToast({ title: '加载中...', icon: 'loading' });
      // 简化处理
    } catch (err) {}
  },

  handleInput(e) {
    const { field } = e.currentTarget.dataset;
    const value = e.detail.value;
    this.setData({ [`form.${field}`]: value });
  },

  handleSaveDraft() {
    this.handleSave('draft');
  },

  handlePublish() {
    this.handleSave('published');
  },

  async handleSave(status) {
    const { form } = this.data;
    if (!form.title || !form.location || !form.startTime || !form.endTime) {
      wx.showToast({ title: '请填写必要字段', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });
    try {
      if (this.data.isEdit) {
        await API.updateActivity(this.data.activityId, { ...form, status });
      } else {
        await API.createActivity({ ...form, status });
      }
      wx.showToast({ title: status === 'draft' ? '已保存草稿' : '发布成功', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 1000);
    } catch (err) {
      this.setData({ submitting: false });
    }
  }
});
