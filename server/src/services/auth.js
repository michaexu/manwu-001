const jwt = require('jsonwebtoken');
const config = require('../config');
const { Member, OperatorWhitelist } = require('../models');
const WeChatService = require('./wechat');
const { generateId } = require('../utils/crypto');
const { UnauthorizedError, ForbiddenError } = require('../utils/errors');

/**
 * 认证服务
 */
class AuthService {
  /**
   * 客户版微信登录
   * @param {string} code - 临时登录凭证
   * @param {object} userInfo - 用户信息（昵称、头像）
   * @returns {Promise<{token, member}>}
   */
  async customerLogin(code, userInfo = {}) {
    const { openid } = await WeChatService.getCustomerSession(code);

    // 查找或创建会员
    let member = await Member.findOne({ where: { openid } });
    if (!member) {
      member = await Member.create({
        id: generateId(),
        openid,
        nickname: userInfo.nickName || '微信用户',
        avatarUrl: userInfo.avatarUrl || '',
        memberType: 'regular',
        pointsBalance: 0
      });
    } else if (userInfo.nickName || userInfo.avatarUrl) {
      // 更新用户信息
      await member.update({
        nickname: userInfo.nickName || member.nickname,
        avatarUrl: userInfo.avatarUrl || member.avatarUrl
      });
    }

    // 生成 JWT
    const token = jwt.sign(
      { memberId: member.id, memberType: member.memberType },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    return { token, member };
  }

  /**
   * 商家版微信登录（含手机号白名单校验）
   * @param {string} code - 临时登录凭证
   * @returns {Promise<{token, operator}>}
   */
  async merchantLogin(code) {
    const { sessionKey, openid } = await WeChatService.getMerchantSession(code);

    // 注意：实际场景中客户端应获取 encryptedData 和 iv 传入
    // 这里示意通过 openid 找到已绑定的手机号，或从 whitelist 校验
    // 真实流程：
    // 1. 先 wx.login 拿到 code
    // 2. 再通过手机号快捷登录组件获取 encryptedData + iv
    // 3. 用 sessionKey 解密得到手机号
    // 4. 校验手机号是否在白名单中

    // 由于手机号需要客户端传递，这里设计为接收 phone 参数
    // 简化实现，实际应解密获取

    throw new Error('商家版登录需要传递手机号，请使用 merchantLoginWithPhone');
  }

  /**
   * 商家版手机号登录
   * @param {string} code - 临时登录凭证
   * @param {string} encryptedData
   * @param {string} iv
   * @returns {Promise<{token, operator}>}
   */
  async merchantLoginWithPhone(code, encryptedData, iv) {
    const { sessionKey } = await WeChatService.getMerchantSession(code);
    const phone = await WeChatService.decryptPhoneNumber(sessionKey, encryptedData, iv);

    // 检查手机号白名单
    const whitelist = await OperatorWhitelist.findOne({
      where: { phone, isActive: true }
    });
    if (!whitelist) {
      throw new ForbiddenError('暂无权限，请联系管理员');
    }

    const token = jwt.sign(
      {
        operatorId: whitelist.id,
        phone: whitelist.phone,
        isMerchant: true
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    return { token, operator: whitelist };
  }

  /**
   * 客户版手机号注册/登录
   * 通过微信 getPhoneNumber 组件获取手机号，注册或登录
   * @param {string} code - wx.login 获取的 code
   * @param {string} encryptedData - 微信手机号加密数据
   * @param {string} iv - 加密向量
   * @returns {Promise<{token, member}>}
   */
  async customerRegisterWithPhone(code, encryptedData, iv, userInfo = {}) {
    const { openid } = await WeChatService.getCustomerSession(code);
    let phone = '';

    // 开发模式或正式模式解密
    try {
      const { sessionKey } = await WeChatService.getCustomerSession(code);
      phone = await WeChatService.decryptPhoneNumber(sessionKey, encryptedData, iv);
    } catch (e) {
      if (e.message && e.message.includes('mock')) {
        phone = '13800000000';
      }
    }

    // 查找是否已有此 openid 或手机号
    let member = await Member.findOne({ where: { openid } });
    if (!member && phone) {
      member = await Member.findOne({ where: { phone } });
    }

    if (!member) {
      // 新注册
      member = await Member.create({
        id: generateId(),
        openid,
        phone: phone || '',
        nickname: userInfo.nickName || phone || '微信用户',
        avatarUrl: userInfo.avatarUrl || '',
        memberType: 'regular',
        pointsBalance: 0
      });
    } else {
      // 更新信息
      const updates = {};
      if (phone && !member.phone) updates.phone = phone;
      if (userInfo.nickName) updates.nickname = userInfo.nickName;
      if (userInfo.avatarUrl) updates.avatarUrl = userInfo.avatarUrl;
      if (Object.keys(updates).length > 0) {
        await member.update(updates);
      }
    }

    const token = jwt.sign(
      { memberId: member.id, memberType: member.memberType },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    return { token, member };
  }

  /**
   * 客户版手机号直接注册（手动输入）
   * POST /api/auth/customer/register
   */
  async customerRegisterByPhone(phone, nickname = '') {
    let member = await Member.findOne({ where: { phone } });
    if (member) {
      // 已存在，直接登录
      const token = jwt.sign(
        { memberId: member.id, memberType: member.memberType },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );
      return { token, member, isNew: false };
    }

    member = await Member.create({
      id: generateId(),
      openid: 'phone_' + phone,
      phone,
      nickname: nickname || phone,
      avatarUrl: '',
      memberType: 'regular',
      pointsBalance: 0
    });

    const token = jwt.sign(
      { memberId: member.id, memberType: member.memberType },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    return { token, member, isNew: true };
  }

  /**
   * 管理员登录（手机号校验）
   * @param {string} phone
   * @returns {Promise<{token}>}
   */
  async adminLogin(phone) {
    if (phone !== config.admin.phone) {
      throw new UnauthorizedError('管理员账号无效');
    }

    const token = jwt.sign(
      { adminId: 'admin', phone, isAdmin: true },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    return { token };
  }
}

module.exports = new AuthService();
