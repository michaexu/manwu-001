Page({
  data: {
    activityTitle: '',
    location: '',
    registrationId: '',
    activityId: ''
  },

  onLoad(options) {
    this.setData({
      activityTitle: decodeURIComponent(options.title || ''),
      location: decodeURIComponent(options.location || ''),
      registrationId: options.registrationId || '',
      activityId: options.activityId || ''
    });

    // 弹出订阅消息授权
    this.requestSubscribe();
  },

  /**
   * 请求订阅消息授权
   */
  requestSubscribe() {
    wx.requestSubscribeMessage({
      tmplIds: [
        // 替换为你在微信公众平台申请的模板 ID
        // 'your_signup_success_tmpl_id',
        // 'your_activity_reminder_tmpl_id',
        // 'your_claim_success_tmpl_id'
      ],
      success(res) {
        console.log('订阅消息授权结果:', res);
      },
      fail(err) {
        console.log('订阅消息授权失败:', err);
      }
    });
  },

  /**
   * 查看领奖码
   */
  goToQrCode() {
    if (this.data.registrationId) {
      wx.navigateTo({
        url: `/pages/qr-code/qr-code?registrationId=${this.data.registrationId}`
      });
    }
  },

  /**
   * 返回活动详情
   */
  goBack() {
    wx.navigateBack();
  },

  /**
   * 返回首页
   */
  goHome() {
    wx.switchTab({ url: '/pages/index/index' });
  }
});
