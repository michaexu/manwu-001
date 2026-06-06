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

  computed: {},

  methods: {
    onTap() {
      const { activity } = this.properties;
      if (activity && activity.id) {
        wx.navigateTo({
          url: `/pages/activity/activity?id=${activity.id}`
        });
      }
    }
  }
});
