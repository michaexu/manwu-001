const API = require('../../utils/api');
const Auth = require('../../utils/auth');

Page({
  data: {
    activity: null,
    memberInfo: null,
    isLoading: true,
    isVip: false,
    isRegistered: false,
    registrationId: null,
    registrationStatus: '',
    coverError: false
  },

  onLoad(options) {
    const { id } = options;
    if (id) {
      this.setData({ activityId: id });
      this.loadData(id);
    }
  },

  onShow() {
    const member = Auth.getMember();
    this.setData({
      memberInfo: member,
      isVip: member ? member.memberType === 'vip' : false
    });
  },

  async loadData(activityId) {
    this.setData({ isLoading: true });
    try {
      const activity = await API.getActivityDetail(activityId);
      const member = Auth.getMember();

      let isRegistered = false;
      let registrationId = null;
      let registrationStatus = '';
      try {
        const myRegs = await API.getMyRegistrations(1);
        if (myRegs.list) {
          const found = myRegs.list.find(r => r.activityId === activityId);
          if (found) {
            isRegistered = true;
            registrationId = found.id;
            registrationStatus = found.status;
          }
        }
      } catch (e) { /* ignore */ }

      this.setData({
        activity,
        memberInfo: member,
        isVip: member ? member.memberType === 'vip' : false,
        isRegistered,
        registrationId,
        registrationStatus,
        isLoading: false
      });
    } catch (err) {
      this.setData({ isLoading: false });
      wx.navigateBack();
    }
  },

  handleRegister() {
    const { memberInfo } = this.data;
    if (!memberInfo) {
      wx.showModal({
        title: '请先登录',
        content: '需要登录后才能参加活动',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({ url: '/pages/phone-register/phone-register' });
          }
        }
      });
      return;
    }

    const { activity } = this.data;

    if (this.data.isVip) {
      wx.showModal({
        title: '确认报名',
        content: '即将参加该活动',
        success: async (res) => {
          if (res.confirm) await this.doRegister();
        }
      });
      return;
    }

    if (activity.pointsRequired > 0) {
      if (memberInfo.pointsBalance < activity.pointsRequired) {
        wx.showModal({
          title: '积分不足',
          content: `需要 ${activity.pointsRequired} 积分，当前 ${memberInfo.pointsBalance} 积分`,
          confirmText: '去赚积分',
          success: (res) => {
            if (res.confirm) {
              wx.switchTab({ url: '/pages/points-tasks/points-tasks' });
            }
          }
        });
        return;
      }

      wx.showModal({
        title: '确认报名',
        content: `将消耗 ${activity.pointsRequired} 积分参加该活动`,
        success: async (res) => {
          if (res.confirm) await this.doRegister();
        }
      });
    } else {
      wx.showModal({
        title: '确认报名',
        content: '即将参加该活动',
        success: async (res) => {
          if (res.confirm) await this.doRegister();
        }
      });
    }
  },

  async doRegister() {
    wx.showLoading({ title: '报名中...', mask: true });
    try {
      const result = await API.registerActivity(this.data.activityId);
      wx.hideLoading();

      if (this.data.memberInfo) {
        this.data.memberInfo.pointsBalance = (this.data.memberInfo.pointsBalance || 0) - (result.pointsCost || 0);
        Auth.saveSession(wx.getStorageSync('token'), this.data.memberInfo);
      }

      wx.navigateTo({
        url: `/pages/registration-success/registration-success?activityId=${this.data.activityId}&registrationId=${result.registrationId}&title=${encodeURIComponent(this.data.activity.title)}&location=${encodeURIComponent(this.data.activity.location)}`
      });

      this.setData({
        isRegistered: true,
        registrationId: result.registrationId,
        registrationStatus: 'registered'
      });
    } catch (err) {
      wx.hideLoading();
    }
  },

  goToQrCode() {
    if (this.data.registrationId) {
      wx.navigateTo({
        url: `/pages/qr-code/qr-code?registrationId=${this.data.registrationId}`
      });
    }
  },

  onCoverError() {
    this.setData({ coverError: true });
  }
});
