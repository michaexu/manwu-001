const API = require('../../utils/api');

Page({
  data: {
    qrDataUrl: '',
    registrationInfo: null,
    isLoading: true
  },

  onLoad(options) {
    const { registrationId } = options;
    if (registrationId) {
      this.loadQrCode(registrationId);
    }
  },

  async loadQrCode(registrationId) {
    this.setData({ isLoading: true });
    try {
      const result = await API.getQrCode(registrationId);

      // 获取报名详情中的活动信息
      const myRegs = await API.getMyRegistrations(1);
      let registrationInfo = null;
      if (myRegs.list) {
        registrationInfo = myRegs.list.find(r => r.id === registrationId);
      }

      this.setData({
        qrDataUrl: result.qrDataUrl,
        registrationInfo,
        isLoading: false
      });
    } catch (err) {
      this.setData({ isLoading: false });
    }
  },

  /**
   * 保存二维码到相册
   */
  handleSave() {
    const { qrDataUrl } = this.data;
    if (!qrDataUrl) return;

    // base64 转文件
    const fs = wx.getFileSystemManager();
    const timestamp = Date.now();
    const filePath = `${wx.env.USER_DATA_PATH}/qr_${timestamp}.png`;

    fs.writeFile({
      filePath,
      data: qrDataUrl.replace(/^data:image\/\w+;base64,/, ''),
      encoding: 'base64',
      success() {
        wx.saveImageToPhotosAlbum({
          filePath,
          success() {
            wx.showToast({ title: '已保存到相册', icon: 'success' });
          },
          fail() {
            wx.showToast({ title: '保存失败，请开启相册权限', icon: 'none' });
          }
        });
      },
      fail() {
        wx.showToast({ title: '生成图片失败', icon: 'none' });
      }
    });
  }
});
