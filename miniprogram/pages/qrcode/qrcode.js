/**
 * 兑换码展示页（用户端）
 */
const { drawQR } = require('../../utils/qrcode');

Page({
  data: {
    statusBarHeight: 20,
    code: '',
    codeSegments: [],
    activityTitle: '',
    giftName: '',
    pointsSpent: 0,
    redeemType: ''
  },

  onLoad(query) {
    const { statusBarHeight } = wx.getWindowInfo();
    this.setData({ statusBarHeight });

    if (query.code) {
      const code = decodeURIComponent(query.code);
      const giftName = query.gift ? decodeURIComponent(query.gift) : '';
      this.setData({
        code,
        codeSegments: this._formatCode(code),
        giftName,
        activityTitle: giftName,
        redeemType: query.type || 'points',
        pointsSpent: parseInt(query.spent) || 0
      });
    }
  },

  onReady() {
    if (!this.data.code) return;
    this._renderQR();
  },

  _formatCode(code) {
    if (!code) return [];
    const segs = [];
    for (let i = 0; i < code.length; i += 4) {
      segs.push(code.substring(i, i + 4));
    }
    return segs;
  },

  _renderQR() {
    const query = wx.createSelectorQuery();
    query.select('#qrCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res || !res[0] || !res[0].node) {
          console.error('Canvas 节点获取失败');
          return;
        }
        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');

        // 设置物理像素（高清屏适配）
        const dpr = wx.getWindowInfo().pixelRatio;
        const displayWidth = 280;
        const displayHeight = 280;
        canvas.width = displayWidth * dpr;
        canvas.height = displayHeight * dpr;
        ctx.scale(dpr, dpr);

        drawQR(this.data.code, ctx, displayWidth);
      });
  },

  onBack() {
    wx.navigateBack();
  }
});
