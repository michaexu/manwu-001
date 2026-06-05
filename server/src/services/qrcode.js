const QRCode = require('qrcode');
const config = require('../config');
const { Registration } = require('../models');
const { NotFoundError } = require('../utils/errors');

/**
 * 领奖码服务
 */
class QrCodeService {
  /**
   * 生成领奖码二维码（base64 图片）
   * @param {string} registrationId - 报名记录 ID
   * @returns {Promise<{qrDataUrl, qrToken}>}
   */
  async generateQrCode(registrationId) {
    const registration = await Registration.findByPk(registrationId);
    if (!registration) throw new NotFoundError('报名记录不存在');

    // 构建二维码内容
    const content = JSON.stringify({
      type: 'claim_code',
      member_id: registration.memberId,
      activity_id: registration.activityId,
      registration_id: registration.id,
      token: registration.qrToken,
      generated_at: new Date().toISOString()
    });

    const dataUrl = await QRCode.toDataURL(content, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 300,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    return { qrDataUrl: dataUrl, qrToken: registration.qrToken };
  }

  /**
   * 验证并解析领奖码
   * @param {string} qrContent - 扫描到的二维码内容
   * @returns {Promise<{valid, registration, member, activity}>}
   */
  async verifyQrCode(qrContent) {
    try {
      const data = JSON.parse(qrContent);
      if (data.type !== 'claim_code') {
        return { valid: false, message: '无效的领奖码' };
      }

      const registration = await Registration.findOne({
        where: { id: data.registration_id }
      });

      if (!registration) {
        return { valid: false, message: '报名记录不存在' };
      }

      // 验证 token
      const crypto = require('crypto');
      const expected = crypto
        .createHmac('sha256', config.qr.secret)
        .update(`${data.member_id}:${data.activity_id}:${data.registration_id}:${new Date(registration.createdAt).getTime()}`)
        .digest('hex');

      if (registration.qrToken !== data.token) {
        return { valid: false, message: '领奖码验证失败，请联系会员重新获取' };
      }

      const { Member, Activity } = require('../models');
      const member = await Member.findByPk(registration.memberId, {
        attributes: ['id', 'nickname', 'avatarUrl', 'memberType', 'phone']
      });
      const activity = await Activity.findByPk(registration.activityId);

      return {
        valid: true,
        registration,
        member,
        activity,
        status: registration.status,
        claimedAt: registration.claimedAt
      };
    } catch (err) {
      return { valid: false, message: '二维码内容格式错误' };
    }
  }
}

module.exports = new QrCodeService();
