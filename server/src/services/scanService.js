/**
 * 扫码核销服务
 */
const db = require('../models/db');
const { NotFoundError, ConflictError, ForbiddenError } = require('../utils/errors');

const scanService = {
  /**
   * 商家扫码确认核销
   */
  async confirmRedemption(merchantId, merchantUserId, code) {
    return db.transaction(async (client) => {
      // 查找兑换记录
      const redeemResult = await client.query(
        `SELECT r.*, a.title as activity_title, a.gift_name,
                u.nick_name, u.phone
         FROM redemption_records r
         JOIN activities a ON a.id = r.activity_id
         JOIN users u ON u.id = r.user_id
         WHERE r.code = $1
         FOR UPDATE`,
        [code]
      );

      if (redeemResult.rows.length === 0) {
        throw new NotFoundError('无效的兑换码');
      }

      const redemption = redeemResult.rows[0];

      // 验证是否属于本商家
      if (redemption.merchant_id !== merchantId) {
        throw new ForbiddenError('此兑换码不属于您的商家');
      }

      // 验证状态
      if (redemption.status === 'confirmed') {
        throw new ConflictError('此兑换码已核销');
      }

      if (redemption.status === 'cancelled') {
        throw new ConflictError('此兑换码已取消');
      }

      if (new Date(redemption.expires_at) < new Date()) {
        throw new ConflictError('此兑换码已过期');
      }

      // 确认核销
      await client.query(
        `UPDATE redemption_records
         SET status = 'confirmed', confirmed_by = $1, confirmed_at = NOW(), updated_at = NOW()
         WHERE id = $2`,
        [merchantUserId, redemption.id]
      );

      return {
        code: redemption.code,
        status: 'confirmed',
        activityTitle: redemption.activity_title,
        giftName: redemption.gift_name,
        userName: redemption.nick_name,
        userPhone: redemption.phone
      };
    });
  },

  /**
   * 获取兑换码详情（商家扫码后查看）
   */
  async getRedemptionDetail(code) {
    const result = await db.query(
      `SELECT r.*, a.title as activity_title, a.gift_name, a.gift_description,
              a.points_required, u.nick_name, u.phone as user_phone
       FROM redemption_records r
       JOIN activities a ON a.id = r.activity_id
       JOIN users u ON u.id = r.user_id
       WHERE r.code = $1`,
      [code]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('无效的兑换码');
    }

    const detail = result.rows[0];
    return {
      ...detail,
      userPhone: detail.user_phone ? detail.user_phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : null
    };
  },

  /**
   * 商家核销记录
   */
  async getScanHistory(merchantId, page, pageSize) {
    const offset = (page - 1) * pageSize;

    const countResult = await db.query(
      'SELECT COUNT(*) FROM redemption_records WHERE merchant_id = $1',
      [merchantId]
    );

    const result = await db.query(
      `SELECT r.*, a.title as activity_title, a.gift_name,
              u.nick_name as user_name, u.phone as user_phone
       FROM redemption_records r
       JOIN activities a ON a.id = r.activity_id
       JOIN users u ON u.id = r.user_id
       WHERE r.merchant_id = $1
       ORDER BY CASE WHEN r.confirmed_at IS NULL THEN 1 ELSE 0 END, r.confirmed_at DESC, r.created_at DESC
       LIMIT $2 OFFSET $3`,
      [merchantId, pageSize, offset]
    );

    return {
      records: result.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      pageSize
    };
  }
};

module.exports = scanService;
