/**
 * 看广告赚积分
 * 激励视频广告 SDK 集成
 *
 * 流程：加载广告 → 点击观看 → 完整观看回调 → 后端发积分 → 展示奖励
 */
const { api } = require('../../utils/request');
const config = require('../../utils/config');
const app = getApp();

// 广告单元ID（需要在微信公众平台-流量主中创建）
const AD_UNIT_ID = config.adUnitId || 'adunit-xxxxxxxxxxxxxxxx';

Page({
  data: {
    points: 0,
    adLoaded: false,
    adWatching: false,
    rewardPoints: 20,
    todayAdCount: 0,
    maxAdCount: 5,
    history: [],
    showRewardAnim: false,
    lastReward: 0,
    rules: []
  },

  onLoad() {
    this.setData({ points: app.globalData.points || 0 });
    this.initRewardedVideoAd();
    this.loadTodayStatus();
    this.loadRules();
  },

  onUnload() {
    // 页面卸载时销毁广告实例
    if (this._rewardedVideoAd) {
      this._rewardedVideoAd.destroy();
      this._rewardedVideoAd = null;
    }
  },

  /** 初始化激励视频广告 */
  initRewardedVideoAd() {
    // 检查是否支持激励视频广告
    if (!wx.createRewardedVideoAd) {
      console.warn('当前版本不支持激励视频广告');
      return;
    }

    const rewardedVideoAd = wx.createRewardedVideoAd({
      adUnitId: AD_UNIT_ID,
      multiton: false // 全局唯一实例
    });

    this._rewardedVideoAd = rewardedVideoAd;

    // 广告加载成功
    rewardedVideoAd.onLoad(() => {
      console.log('[Ad] 广告加载成功');
      this.setData({ adLoaded: true });

      // 自动预加载下一条广告
      // rewardedVideoAd.load() 在 show() 后会自动执行
    });

    // 广告加载失败
    rewardedVideoAd.onError((err) => {
      console.error('[Ad] 广告加载失败:', err);
      this.setData({ adLoaded: false, adWatching: false });

      // 根据错误码给出不同提示
      const errMsgMap = {
        1000: '后端接口错误',
        1001: '参数错误',
        1002: '广告单元无效',
        1003: '内部错误',
        1004: '无合适的广告',
        1005: '广告组件审核中',
        1006: '广告组件被驳回',
        1007: '广告组件被封禁',
        1008: '广告单元已关闭'
      };
      const msg = errMsgMap[err.errCode] || '广告加载失败，请稍后重试';
      wx.showToast({ title: msg, icon: 'none', duration: 2000 });
    });

    // 用户完整观看了广告
    rewardedVideoAd.onClose((res) => {
      this.setData({ adWatching: false });

      // isEnded 为 true 表示用户完整观看了广告
      if (res && res.isEnded) {
        this.onAdComplete();
      } else {
        wx.showToast({
          title: '需要完整观看广告才能获得奖励哦~',
          icon: 'none',
          duration: 2000
        });
      }
    });
  },

  /** 点击观看广告 */
  onWatchAd() {
    if (this.data.adWatching) return;

    const { todayAdCount, maxAdCount } = this.data;
    if (todayAdCount >= maxAdCount) {
      wx.showToast({
        title: `每天最多观看${maxAdCount}次广告`,
        icon: 'none',
        duration: 2000
      });
      return;
    }

    // 显示广告
    this._rewardedVideoAd.show().catch((err) => {
      console.error('[Ad] 广告展示失败:', err);

      // 广告未加载完成，重新加载
      this.setData({ adLoaded: false });
      this._rewardedVideoAd.load().catch(console.error);

      wx.showToast({
        title: '广告加载中，请稍后再试',
        icon: 'none',
        duration: 2000
      });
    });

    this.setData({ adWatching: true });
  },

  /** 广告完整观看后的回调 */
  async onAdComplete() {
    try {
      wx.showLoading({ title: '发放奖励中...', mask: true });

      // 调用后端接口发放积分
      const res = await api.post('/points/ad-reward');
      const { reward, totalPoints } = res.data;

      wx.hideLoading();

      // 更新全局积分
      app.globalData.points = totalPoints;
      this.setData({
        points: totalPoints,
        todayAdCount: this.data.todayAdCount + 1,
        lastReward: reward,
        showRewardAnim: true
      });

      // 3秒后隐藏奖励动画
      setTimeout(() => {
        this.setData({ showRewardAnim: false });
      }, 3000);

      // 更新今日状态
      this.loadTodayStatus();
    } catch (err) {
      wx.hideLoading();
      // 错误已在 request.js 中 toast，此处仅日志
      console.error('[Ad] 积分发放失败:', err);
    }
  },

  /** 加载今日广告观看次数 */
  async loadTodayStatus() {
    try {
      const res = await api.get('/points/history', {
        type: 'ad_reward',
        page: 1,
        page_size: 20
      });

      // 统计今日广告次数（后端返回的记录按时间降序）
      const today = new Date().toISOString().split('T')[0];
      const todayRecords = (res.data.records || []).filter(r =>
        r.created_at && r.created_at.startsWith(today)
      );

      this.setData({
        todayAdCount: todayRecords.length,
        history: (res.data.records || []).slice(0, 10)
      });
    } catch (err) {
      console.error('加载广告历史失败:', err);
    }
  },

  /** 加载积分规则 */
  async loadRules() {
    try {
      const res = await api.get('/points/rules');
      this.setData({ rules: res.data.rules || [] });
    } catch (err) {
      console.error('加载积分规则失败:', err);
    }
  },

  /** 分享 */
  onShareAppMessage() {
    return {
      title: '看广告赚积分，免费兑换好礼！',
      path: '/pages/index/index'
    };
  }
});
