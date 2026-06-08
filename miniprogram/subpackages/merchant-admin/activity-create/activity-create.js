/**
 * 商家端 - 活动创建/编辑（含图片上传）
 */
const merchantService = require('../../../services/merchant');

Page({
  data: {
    isEdit: false,
    activityId: '',
    submitting: false,

    form: {
      title: '',
      description: '',
      emoji: '🎁',
      color: '#DC2626',
      image_url: '',
      gift_name: '',
      gift_spec: '',
      gift_description: '',
      gift_image_url: '',
      points_required: 100,
      vip_quota: 0,
      regular_quota: 0,
      start_time: '',
      end_time: ''
    },

    emojiOptions: ['🎁', '🎂', '🍰', '☕', '🍕', '🎬', '🎵', '💎', '🌟', '🎯'],
    colorOptions: [
      { value: '#DC2626', label: '红色' },
      { value: '#EC4899', label: '粉色' },
      { value: '#D97706', label: '金色' },
      { value: '#2563EB', label: '蓝色' },
      { value: '#059669', label: '绿色' },
      { value: '#7C3AED', label: '紫色' }
    ],

    uploading: { image: false, gift: false }
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ isEdit: true, activityId: options.id });
      this.loadActivity(options.id);
    }
  },

  async loadActivity(id) {
    try {
      const res = await merchantService.getActivity(id);
      const a = res.data;
      this.setData({
        form: {
          title: a.title || '',
          description: a.description || '',
          emoji: a.emoji || '🎁',
          color: a.color || '#DC2626',
          image_url: a.image_url || '',
          gift_name: a.gift_name || '',
          gift_spec: a.gift_spec || '',
          gift_description: a.gift_description || '',
          gift_image_url: a.gift_image_url || '',
          points_required: a.points_required || 100,
          vip_quota: a.vip_quota || 0,
          regular_quota: a.regular_quota || 0,
          start_time: a.start_time ? a.start_time.substring(0, 10) : '',
          end_time: a.end_time ? a.end_time.substring(0, 10) : ''
        }
      });
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  /** 选择并上传图片 */
  uploadImage(e) {
    const field = e.currentTarget.dataset.field;
    const that = this;
    wx.showActionSheet({
      itemList: ['拍照', '从相册选择'],
      success(res) {
        const sourceType = res.tapIndex === 0 ? ['camera'] : ['album'];
        wx.chooseMedia({
          count: 1,
          mediaType: ['image'],
          sourceType,
          sizeType: ['compressed'],
          success(res) {
            const tempFilePath = res.tempFiles[0].tempFilePath;
            // 读取为 base64
            const fs = wx.getFileSystemManager();
            const base64 = fs.readFileSync(tempFilePath, 'base64');
            const ext = tempFilePath.split('.').pop() || 'jpg';
            const fileName = `${Date.now()}.${ext}`;
            const dataUri = `data:image/${ext};base64,${base64}`;

            that.setData({ [`uploading.${field}`]: true });
            wx.showLoading({ title: '上传中...' });

            merchantService.uploadImage(fileName, dataUri).then(res => {
              wx.hideLoading();
              that.setData({
                [`form.${field}`]: res.data.url,
                [`uploading.${field}`]: false
              });
              wx.showToast({ title: '上传成功', icon: 'success' });
            }).catch(err => {
              wx.hideLoading();
              that.setData({ [`uploading.${field}`]: false });
              wx.showToast({ title: '上传失败', icon: 'none' });
            });
          }
        });
      }
    });
  },

  handleInput(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  handleNumberInput(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({ [`form.${field}`]: parseInt(e.detail.value) || 0 });
  },

  handleEmojiSelect(e) {
    this.setData({ 'form.emoji': e.currentTarget.dataset.emoji });
  },

  handleColorSelect(e) {
    this.setData({ 'form.color': e.currentTarget.dataset.color });
  },

  handleDateChange(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  async handleSubmit() {
    const { form, isEdit, activityId, submitting } = this.data;
    if (submitting) return;

    if (!form.title.trim()) { wx.showToast({ title: '请输入活动标题', icon: 'none' }); return; }
    if (!form.gift_name.trim()) { wx.showToast({ title: '请输入礼品名称', icon: 'none' }); return; }
    if (!form.points_required || form.points_required < 1) { wx.showToast({ title: '所需积分必须大于0', icon: 'none' }); return; }

    this.setData({ submitting: true });

    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || form.title.trim(),
        emoji: form.emoji,
        color: form.color,
        image_url: form.image_url || undefined,
        gift_name: form.gift_name.trim(),
        gift_spec: form.gift_spec.trim() || undefined,
        gift_description: form.gift_description.trim() || undefined,
        gift_image_url: form.gift_image_url || undefined,
        points_required: form.points_required,
        vip_quota: form.vip_quota || 0,
        regular_quota: form.regular_quota || 0,
        start_time: form.start_time || undefined,
        end_time: form.end_time || undefined
      };

      const method = isEdit ? 'updateActivity' : 'createActivity';
      const args = isEdit ? [activityId, payload] : [payload];
      await merchantService[method](...args);

      wx.showToast({ title: isEdit ? '更新成功' : '创建成功', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 1200);
    } catch (err) {
      this.setData({ submitting: false });
    }
  }
});
