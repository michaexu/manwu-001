const API = require('../../utils/api');

Page({
  data: {
    verifyData: null,
    member: null,
    activity: null,
    registrationId: '',
    activityId: '',
    isClaiming: false
  },

  onLoad(options) {
    if (options.data) {
      try {
        const data = JSON.parse(decodeURIComponent(options.data));
        this.setData({
          verifyData: data,
          member: data.member,
          activity: data.activity,
          registrationId: data.registrationId || data.registration?.id,
          activityId: data.activity?.id
        });
      } catch (err) {
        wx.showToast({ title: '数据解析失败', icon: 'none' });
        setTimeout(() => wx.navigateBack(), 1500);
      }
    }
  },

  /**
   * 确认核销
   */
  handleConfirm() {
    wx.showModal({
      title: '确认核销',
      content: `确认将奖品发放给 ${this.data.member?.nickname}？`,
      success: async (res) => {
        if (res.confirm) {
          this.setData({ isClaiming: true });
          try {
            const result = await API.confirmClaim(this.data.activityId, this.data.registrationId);
            wx.showToast({ title: '核销成功！', icon: 'success' });
            this.setData({ isClaiming: false });

            // 延迟返回
            setTimeout(() => {
              wx.navigateBack({ delta: 2 }); // 返回扫码页
            }, 1500);
          } catch (err) {
            this.setData({ isClaiming: false });
          }
        }
      }
    });
  }
});
