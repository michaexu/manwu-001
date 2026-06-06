// components/points-card/points-card.js
Component({
  properties: {
    points: { type: Number, value: 0 },
    vip: { type: Object, value: null },
    showVipQuota: { type: Boolean, value: true }
  },

  methods: {
    onTapAd() {
      wx.navigateTo({ url: '/pages/ad-reward/ad-reward' });
    },
    onTapCheckin() {
      wx.navigateTo({ url: '/pages/checkin/checkin' });
    }
  }
});
