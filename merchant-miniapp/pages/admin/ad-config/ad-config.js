const API = require('../../../utils/api');

Page({
  data: {
    ads: [],
    isLoading: true,
    formVisible: false,
    editAd: null,
    form: {
      name: '',
      adUnitId: '',
      pointsReward: 10,
      dailyLimit: 1,
      isActive: true
    }
  },

  onShow() {
    this.loadAds();
  },

  async loadAds() {
    this.setData({ isLoading: true });
    try {
      const ads = await API.getAds();
      this.setData({ ads, isLoading: false });
    } catch (err) {
      this.setData({ isLoading: false });
    }
  },

  showCreateForm() {
    this.setData({
      formVisible: true,
      editAd: null,
      form: { name: '', adUnitId: '', pointsReward: 10, dailyLimit: 1, isActive: true }
    });
  },

  showEditForm(e) {
    const ad = e.currentTarget.dataset.ad;
    this.setData({
      formVisible: true,
      editAd: ad,
      form: {
        name: ad.name,
        adUnitId: ad.adUnitId,
        pointsReward: ad.pointsReward,
        dailyLimit: ad.dailyLimit,
        isActive: ad.isActive
      }
    });
  },

  hideForm() {
    this.setData({ formVisible: false });
  },

  handleInput(e) {
    const { field } = e.currentTarget.dataset;
    const value = e.detail.value;
    this.setData({ [`form.${field}`]: value });
  },

  handleToggleActive() {
    this.setData({ 'form.isActive': !this.data.form.isActive });
  },

  async handleSave() {
    const { form, editAd } = this.data;
    if (!form.name || !form.adUnitId) {
      wx.showToast({ title: '请填写完整信息', icon: 'none' });
      return;
    }

    const payload = { ...form, id: editAd?.id };
    payload.pointsReward = parseInt(payload.pointsReward) || 0;
    payload.dailyLimit = parseInt(payload.dailyLimit) || 1;

    try {
      await API.saveAd(payload);
      wx.showToast({ title: editAd ? '更新成功' : '创建成功', icon: 'success' });
      this.setData({ formVisible: false });
      this.loadAds();
    } catch (err) {}
  }
});
