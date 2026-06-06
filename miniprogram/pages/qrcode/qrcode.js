/**
 * 兑换码展示页（用户端）
 * 设计参照 Ardot 2:176
 */
const activityService = require('../../services/activity');

Page({
  data: {
    statusBarHeight: 20,
    redemptionId: '',
    code: '',
    codeSegments: [],
    activityTitle: '',
    giftName: '',
    pointsSpent: 0,
    redeemType: '',
    expiresAt: '',
    loading: true
  },

  onLoad(query) {
    const sysInfo = wx.getSystemInfoSync();
    this.setData({
      statusBarHeight: sysInfo.statusBarHeight || 20,
      redemptionId: query.id || ''
    });

    if (query.id) {
      this.loadRedemption(query.id);
    } else if (query.code) {
      // 直接展示兑换码
      const code = decodeURIComponent(query.code);
      this.setData({ code, codeSegments: this._formatCode(code), loading: false });
    }
  },

  async loadRedemption(id) {
    try {
      const res = await activityService.getRedeemHistory(1, 1);
      // 简化处理：从首次兑换结果或路由参数获取
      const redemption = res.data?.records?.find(r => r.id === parseInt(id));

      if (redemption) {
        const code = redemption.code;
        this.setData({
          code,
          codeSegments: this._formatCode(code),
          activityTitle: redemption.activity_title || '',
          giftName: redemption.gift_name || '',
          pointsSpent: redemption.points_spent || 0,
          redeemType: redemption.redeem_type || 'points',
          expiresAt: redemption.expires_at || '',
          loading: false
        });
      } else if (this.data.code) {
        this.setData({ loading: false });
      }
    } catch (err) {
      this.setData({ loading: false });
    }
  },

  /** 格式化兑换码为分段显示 */
  _formatCode(code) {
    if (!code) return [];
    // 将兑换码按4位分组
    const segments = [];
    for (let i = 0; i < code.length; i += 4) {
      segments.push(code.substring(i, i + 4));
    }
    return segments;
  },

  /** 返回 */
  onBack() {
    wx.navigateBack();
  }
});
