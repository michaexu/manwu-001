/**
 * 商家后台首页
 * 设计参照 Ardot 8:175
 */
const scanService = require('../../services/scan');
const merchantService = require('../../services/merchant');

Page({
  data: {
    statusBarHeight: 20,
    shopName: '',
    stats: {
      activities: 0,
      todayRedeems: 0,
      totalRedeems: 0
    },
    recentActivities: [],
    recentRedeems: [],
    loading: true
  },

  onLoad() {
    const sysInfo = wx.getSystemInfoSync();
    this.setData({ statusBarHeight: sysInfo.statusBarHeight || 20 });
  },

  onShow() {
    const app = getApp();
    if (!app.globalData.isMerchant) {
      wx.showToast({ title: '仅商家可访问', icon: 'none' });
      setTimeout(() => wx.switchTab({ url: '/pages/profile/profile' }), 1500);
      return;
    }

    this.setData({ shopName: app.globalData.merchantInfo?.name || '我的店铺' });
    this.loadData();
  },

  async loadData() {
    try {
      const [actRes, scanRes] = await Promise.all([
        merchantService.getActivities({ page: 1, page_size: 3 }),
        scanService.getScanHistory(1, 3)
      ]);

      const activities = actRes.data?.activities || [];
      const redeems = scanRes.data?.records || [];

      this.setData({
        stats: {
          activities: actRes.data?.total || activities.length,
          todayRedeems: redeems.filter(r => {
            const today = new Date().toDateString();
            return new Date(r.created_at).toDateString() === today;
          }).length,
          totalRedeems: scanRes.data?.total || redeems.length
        },
        recentActivities: activities.slice(0, 3),
        recentRedeems: redeems.slice(0, 3),
        loading: false
      });
    } catch (err) {
      this.setData({ loading: false });
    }
  },

  /** 创建活动 */
  onCreateActivity() {
    wx.navigateTo({
      url: '/subpackages/merchant-admin/activity-create/activity-create'
    });
  },

  /** 查看全部活动 */
  onViewAllActivities() {
    wx.navigateTo({
      url: '/subpackages/merchant-admin/activity-list/activity-list'
    });
  },

  /** 查看全部核销 */
  onViewAllRedeems() {
    wx.navigateTo({
      url: '/subpackages/merchant-admin/scan-history/scan-history'
    });
  },

  /** 扫码 */
  onScanCode() {
    wx.scanCode({
      onlyFromCamera: true,
      scanType: ['barCode', 'qrCode'],
      success: (res) => {
        wx.navigateTo({
          url: `/pages/scan/scan?code=${encodeURIComponent(res.result)}`
        });
      },
      fail: (err) => {
        if (err.errMsg !== 'scanCode:fail cancel') {
          wx.showToast({ title: '扫码失败', icon: 'none' });
        }
      }
    });
  },

  /** 编辑某活动 */
  onEditActivity(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/subpackages/merchant-admin/activity-create/activity-create?id=${id}`
    });
  },

  /** 切换活动状态 */
  async onToggleStatus(e) {
    const { id, status } = e.currentTarget.dataset;
    const newStatus = status === 'active' ? 'inactive' : 'active';

    wx.showModal({
      title: '确认操作',
      content: `确定要${newStatus === 'active' ? '上架' : '下架'}此活动吗？`,
      confirmColor: '#DC2626',
      success: async (modalRes) => {
        if (!modalRes.confirm) return;
        try {
          await merchantService.updateActivityStatus(id, newStatus);
          wx.showToast({ title: '操作成功', icon: 'success' });
          this.loadData();
        } catch (err) { /* handled */ }
      }
    });
  },

  _formatTime(dateStr) {
    const d = new Date(dateStr);
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const h = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${m}-${day} ${h}:${min}`;
  }
});
