// components/empty-state/empty-state.js
Component({
  properties: {
    icon: { type: String, value: '📭' },
    title: { type: String, value: '暂无数据' },
    hint: { type: String, value: '' },
    showButton: { type: Boolean, value: false },
    buttonText: { type: String, value: '去逛逛' }
  },

  methods: {
    onButtonTap() {
      this.triggerEvent('action');
    }
  }
});
