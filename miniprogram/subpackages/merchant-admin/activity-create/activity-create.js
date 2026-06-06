/**
 * 商家端 - 活动创建/编辑
 * 支持：VIP/普通用户分名额、礼物规格、商家介绍
 */
const { api } = require('../../../utils/request');

Page({
  data: {
    isEdit: false,
    activityId: '',
    submitting: false,

    // 表单数据
    form: {
      title: '',
      description: '',
      emoji: '🎁',
      color: '#DC2626',
      image_url: '',
      // 礼品信息
      gift_name: '',
      gift_spec: '',
      gift_description: '',
      // 参与条件
      points_required: 100,
      vip_quota: 0,
      regular_quota: 0,
      // 商家介绍
      merchant_description: '',
      // 时间
      start_time: '',
      end_time: ''
    },

    // 可选颜色
    colorOptions: [
      { value: '#DC2626', label: '红色' },
      { value: '#EC4899', label: '粉色' },
      { value: '#D97706', label: '金色' },
      { value: '#2563EB', label: '蓝色' },
      { value: '#059669', label: '绿色' },
      { value: '#7C3AED', label: '紫色' }
    ],

    // 可选图标
    emojiOptions: ['🎁', '🎂', '🍰', '☕', '🍕', '🎬', '🎵', '💎', '🌟', '🎯']
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ isEdit: true, activityId: options.id });
      this.loadActivity(options.id);
    }
  },

  /** 加载已有活动（编辑模式） */
  async loadActivity(id) {
    try {
      const res = await api.get(`/merchant/activities/${id}`);
      const activity = res.data;
      this.setData({
        form: {
          title: activity.title || '',
          description: activity.description || '',
          emoji: activity.emoji || '🎁',
          color: activity.color || '#DC2626',
          image_url: activity.image_url || '',
          gift_name: activity.gift_name || '',
          gift_spec: activity.gift_spec || '',
          gift_description: activity.gift_description || '',
          points_required: activity.points_required || 100,
          vip_quota: activity.vip_quota || 0,
          regular_quota: activity.regular_quota || 0,
          merchant_description: activity.merchant_description || '',
          start_time: activity.start_time || '',
          end_time: activity.end_time || ''
        }
      });
    } catch (err) {
      wx.showToast({ title: '加载活动失败', icon: 'none' });
    }
  },

  /** 表单字段更新 */
  handleInput(e) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;
    this.setData({ [`form.${field}`]: value });
  },

  /** 数字字段更新 */
  handleNumberInput(e) {
    const { field } = e.currentTarget.dataset;
    const value = parseInt(e.detail.value) || 0;
    this.setData({ [`form.${field}`]: value });
  },

  /** 选择颜色 */
  handleColorSelect(e) {
    const { color } = e.currentTarget.dataset;
    this.setData({ 'form.color': color });
  },

  /** 选择图标 */
  handleEmojiSelect(e) {
    const { emoji } = e.currentTarget.dataset;
    this.setData({ 'form.emoji': emoji });
  },

  /** 选择时间 */
  handleDateChange(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  /** 提交表单 */
  async handleSubmit() {
    const { form, isEdit, activityId, submitting } = this.data;
    if (submitting) return;

    // 基础校验
    if (!form.title.trim()) {
      wx.showToast({ title: '请输入活动标题', icon: 'none' });
      return;
    }
    if (!form.description.trim()) {
      wx.showToast({ title: '请输入活动描述', icon: 'none' });
      return;
    }
    if (!form.gift_name.trim()) {
      wx.showToast({ title: '请输入礼品名称', icon: 'none' });
      return;
    }
    if (!form.points_required || form.points_required < 1) {
      wx.showToast({ title: '所需积分必须大于0', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });

    try {
      const url = isEdit
        ? `/merchant/activities/${activityId}`
        : '/merchant/activities';
      const method = isEdit ? 'put' : 'post';

      await api[method](url, {
        title: form.title.trim(),
        description: form.description.trim(),
        emoji: form.emoji,
        color: form.color,
        image_url: form.image_url || undefined,
        gift_name: form.gift_name.trim(),
        gift_spec: form.gift_spec.trim() || undefined,
        gift_description: form.gift_description.trim() || undefined,
        points_required: form.points_required,
        vip_quota: form.vip_quota || 0,
        regular_quota: form.regular_quota || 0,
        merchant_description: form.merchant_description.trim() || undefined,
        start_time: form.start_time || undefined,
        end_time: form.end_time || undefined
      });

      wx.showToast({
        title: isEdit ? '更新成功' : '创建成功',
        icon: 'success'
      });

      setTimeout(() => wx.navigateBack(), 1500);
    } catch (err) {
      this.setData({ submitting: false });
    }
  }
});
