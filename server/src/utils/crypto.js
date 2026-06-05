const crypto = require('crypto');
const config = require('../config');

/**
 * 生成领奖码签名（HMAC-SHA256）
 * @param {string} memberId
 * @param {string} activityId
 * @param {string} registrationId
 * @returns {string} token
 */
function generateQrToken(memberId, activityId, registrationId) {
  const payload = `${memberId}:${activityId}:${registrationId}:${Date.now()}`;
  const hmac = crypto.createHmac('sha256', config.qr.secret);
  hmac.update(payload);
  return hmac.digest('hex');
}

/**
 * 验证领奖码签名
 * @param {string} token
 * @returns {boolean}
 */
function verifyQrToken(token, memberId, activityId, registrationId) {
  // 在实际场景中，从数据库取出 registration 记录验证
  // 这里只提供签名校验的通用方法
  const expected = crypto
    .createHmac('sha256', config.qr.secret)
    .update(`${memberId}:${activityId}:${registrationId}`)
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}

/**
 * Generate UUID v4
 */
function generateId() {
  const { v4: uuidv4 } = require('uuid');
  return uuidv4().replace(/-/g, '');
}

module.exports = { generateQrToken, verifyQrToken, generateId };
