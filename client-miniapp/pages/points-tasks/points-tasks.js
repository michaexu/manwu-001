const API = require('../../utils/api');
const Auth = require('../../utils/auth');

Page({
  data: {
    ads: [],
    memberInfo: null,
    isLoading: true,
    isLoggedIn: false,
    checkInStatus: null,
    checkInLoading: false
  },

  onShow() {
    const member = Auth.getMember();
    this.setData({
      isLoggedIn: !!member,
      memberInfo: member
    });
    this.loadAds();
    if (member) this.loadCheckInStatus();
  },

  async loadCheckInStatus() {
    try {
      const status = await API.getCheckInStatus();
      this.setData({ checkInStatus: status });
    } catch (err) { /* ignore */ }
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

  /**
   * 观看广告领取积分
   */
  handleWatchAd(e) {
    const { ad } = e.currentTarget.dataset;
    if (!ad || !ad.canClaim) {
      wx.showToast({ title: '今日已领取', icon: 'none' });
      return;
    }

    // 未登录引导登录
    if (!Auth.isLoggedIn()) {
      wx.showModal({
        title: '请先登录',
        content: '需要登录后才能领取积分',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) wx.navigateTo({ url: '/pages/phone-register/phone-register' });
        }
      });
      return;
    }

    // 使用微信激励视频广告
    if (wx.createRewardedVideoAd) {
      const videoAd = wx.createRewardedVideoAd({
        adUnitId: ad.adUnitId
      });

      videoAd.onLoad(() => {
        console.log('广告加载成功');
      });

      videoAd.onError((err) => {
        console.error('广告加载失败:', err);
        wx.showToast({ title: '广告加载失败，请稍后再试', icon: 'none' });
      });

      videoAd.onClose(async (res) => {
        if (res && res.isEnded) {
          // 正常播放结束
          wx.showLoading({ title: '发放积分中...', mask: true });
          try {
            const result = await API.earnPoints(ad.id);
            wx.hideLoading();

            // 更新本地积分
            const member = Auth.getMember();
            if (member) {
              member.pointsBalance = result.balanceAfter;
              Auth.saveSession(wx.getStorageSync('token'), member);
              this.setData({ memberInfo: member });
            }

            wx.showToast({ title: `+${result.pointsEarned} 积分`, icon: 'success' });

            // 刷新广告列表
            this.loadAds();
          } catch (err) {
            wx.hideLoading();
          }
        } else {
          wx.showToast({ title: '观看完整视频才能获得积分哦', icon: 'none' });
        }
      });

      videoAd.show().catch(() => {
        // 重新加载
        videoAd.load().then(() => videoAd.show());
      });
    } else {
      wx.showToast({ title: '当前版本不支持激励视频广告', icon: 'none' });
    }
  },

  /**
   * 跳转积分明细
   */
  goToPointsDetail() {
    wx.navigateTo({ url: '/pages/points-detail/points-detail' });
  },

  /**
   * 每日签到
   */
  async handleCheckIn() {
    if (!Auth.isLoggedIn()) {
      wx.showModal({
        title: '请先登录',
        content: '登录后即可签到领取积分',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) wx.navigateTo({ url: '/pages/phone-register/phone-register' });
        }
      });
      return;
    }

    if (this.data.checkInLoading) return;
    this.setData({ checkInLoading: true });

    try {
      const result = await API.checkIn();
      // 更新本地积分
      const member = Auth.getMember();
      if (member) {
        member.pointsBalance = result.balanceAfter;
        Auth.saveSession(wx.getStorageSync('token'), member);
        this.setData({ memberInfo: member });
      }
      wx.showToast({ title: `签到成功 +${result.pointsEarned} 积分`, icon: 'success' });
      this.loadCheckInStatus();
    } catch (err) {
      wx.showToast({ title: err.message || '签到失败', icon: 'none' });
    } finally {
      this.setData({ checkInLoading: false });
    }
  }
});
