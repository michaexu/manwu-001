// components/activity-card/activity-card.js
Component({
  properties: {
    activity: {
      type: Object,
      value: {}
    },
    showQuota: {
      type: Boolean,
      value: true
    }
  },

  methods: {
    onTap() {
      const { activity } = this.properties;
      if (activity && activity.id) {
        const app = getApp();
        app.globalData.pendingActivityId = activity.id;
        wx.switchTab({ url: '/pages/activity/activity' });
      }
    }
  }
});
