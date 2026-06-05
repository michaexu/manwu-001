const axios = require('axios');
const crypto = require('crypto');
const config = require('../config');

/**
 * 判断是否为开发环境（微信凭据未配置）
 */
function isDevMode() {
  const { appId, secret } = config.wechat.customer;
  return !appId || appId.includes('your_') || appId === 'placeholder';
}

/**
 * 开发模式：从 code 生成 mock openid
 */
function mockSession(code) {
  const hash = crypto.createHash('md5').update(code || 'dev').digest('hex');
  return {
    openid: 'mock_openid_' + hash.substring(0, 16),
    sessionKey: 'mock_session_' + hash.substring(0, 16)
  };
}

/**
 * 微信服务 - 封装微信 API 调用
 */
class WeChatService {
  /**
   * 获取微信 session（客户版）
   * @param {string} code - 临时登录凭证
   * @returns {Promise<{openid, session_key}>}
   */
  async getCustomerSession(code) {
    // 开发模式：凭据未配置时使用 mock
    if (isDevMode()) {
      console.log('[微信] 开发模式：使用 mock openid');
      return mockSession(code);
    }

    const { appId, secret } = config.wechat.customer;
    const url = 'https://api.weixin.qq.com/sns/jscode2session';
    const { data } = await axios.get(url, {
      params: { appid: appId, secret, js_code: code, grant_type: 'authorization_code' }
    });
    if (data.errcode) {
      throw new Error(`微信登录失败: ${data.errmsg}`);
    }
    return { openid: data.openid, sessionKey: data.session_key };
  }

  /**
   * 获取微信 session（商家版）
   */
  async getMerchantSession(code) {
    // 开发模式：凭据未配置时使用 mock
    if (isDevMode()) {
      console.log('[微信] 开发模式：使用 mock session');
      return mockSession(code);
    }

    const { appId, secret } = config.wechat.merchant;
    const url = 'https://api.weixin.qq.com/sns/jscode2session';
    const { data } = await axios.get(url, {
      params: { appid: appId, secret, js_code: code, grant_type: 'authorization_code' }
    });
    if (data.errcode) {
      throw new Error(`微信登录失败: ${data.errmsg}`);
    }
    return { openid: data.openid, sessionKey: data.session_key };
  }

  /**
   * 获取手机号（解密）
   * @param {string} sessionKey
   * @param {string} encryptedData
   * @param {string} iv
   * @returns {Promise<string>} phoneNumber
   */
  async decryptPhoneNumber(sessionKey, encryptedData, iv) {
    // 开发模式：返回 mock 手机号
    if (isDevMode()) {
      return '13800000000';
    }

    const decipher = crypto.createDecipheriv('aes-128-cbc', Buffer.from(sessionKey, 'base64'), Buffer.from(iv, 'base64'));
    decipher.setAutoPadding(true);
    let decrypted = decipher.update(Buffer.from(encryptedData, 'base64'));
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    const result = JSON.parse(decrypted.toString('utf8'));
    return result.phoneNumber;
  }

  /**
   * 发送订阅消息
   * @param {string} appId - 小程序 AppID
   * @param {string} openid - 目标用户 OpenID
   * @param {string} templateId - 模板 ID
   * @param {object} data - 模板数据
   * @param {string} page - 跳转页面路径
   */
  async sendSubscribeMessage(appId, openid, templateId, data, page = '') {
    // 获取 access_token
    const secret = appId === config.wechat.customer.appId
      ? config.wechat.customer.secret
      : config.wechat.merchant.secret;
    const tokenUrl = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${secret}`;
    const { data: tokenData } = await axios.get(tokenUrl);
    if (tokenData.errcode) {
      throw new Error(`获取 access_token 失败: ${tokenData.errmsg}`);
    }

    const sendUrl = 'https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=' + tokenData.access_token;
    const { data: sendResult } = await axios.post(sendUrl, {
      touser: openid,
      template_id: templateId,
      page,
      data
    });
    return sendResult;
  }

  /**
   * 获取微信广告回调的验证凭证
   * 注：微信激励视频广告通过服务端回调验证，需配置回调地址
   */
  verifyAdReward(adData) {
    // 此处为广告奖励回调验证逻辑
    // 实际应用中需要验证微信回调的签名
    return true;
  }
}

module.exports = new WeChatService();
