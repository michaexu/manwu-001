/**
 * 活动服务 — V2：支持 VIP/普通用户双轨兑换
 */
const db = require('../models/db');
const crypto = require('crypto');
const { NotFoundError, ConflictError, ValidationError } = require('../utils/errors');

const activityService = {
  /**
   * 活动列表
   */
  async getList({ page, pageSize, merchantId }) {
    const offset = (page - 1) * pageSize;
    let whereClause = "WHERE a.status = 'active'";
    const params = [];
    let paramIdx = 1;

    if (merchantId) {
      whereClause += ` AND a.merchant_id = $${paramIdx}`;
      params.push(merchantId);
      paramIdx++;
    }

    const countResult = await db.query(
      `SELECT COUNT(*) FROM activities a ${whereClause}`,
      params
    );

    params.push(pageSize, offset);
    const result = await db.query(
      `SELECT a.*, m.name as merchant_name, m.address as merchant_address
       FROM activities a
       JOIN merchants m ON m.id = a.merchant_id
       ${whereClause}
       ORDER BY a.created_at DESC
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      params
    );

    return {
      activities: result.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      pageSize
    };
  },

  /**
   * 活动详情（可选携带当前用户的兑换信息）
   */
  async getDetail(activityId, userId) {
    const result = await db.query(
      `SELECT a.*, m.name as merchant_name, m.address as merchant_address,
              m.phone as merchant_phone, m.description as merchant_description,
              m.latitude, m.longitude
       FROM activities a
       JOIN merchants m ON m.id = a.merchant_id
       WHERE a.id = $1`,
      [activityId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('活动不存在');
    }

    const activity = result.rows[0];

    // 如果用户已登录，查询其兑换信息
    if (userId) {
      const redeemResult = await db.query(
        `SELECT code, points_spent, redeem_type, status, created_at
         FROM redemption_records
         WHERE user_id = $1 AND activity_id = $2
         ORDER BY created_at DESC LIMIT 1`,
        [userId, activityId]
      );
      activity.user_redemption = redeemResult.rows[0] || null;
    } else {
      activity.user_redemption = null;
    }

    return activity;
  },

  /**
   * 兑换活动资格 — V2：区分 VIP 免积分 / 普通积分兑换
   *
   * 逻辑：
   *   VIP 用户 → 优先使用月度免积分额度
   *     - 有剩余免积分次数 AND VIP 名额未满 → 免积分兑换，消耗 1 次月度额度
   *     - 免积分次数用尽 → 回退到积分兑换（消耗 VIP 名额）
   *   普通用户 → 仅积分兑换（消耗普通名额）
   */
  async redeem(userId, activityId) {
    return db.transaction(async (client) => {
      // ── 1. 获取活动信息（行锁） ──
      const actResult = await client.query(
        'SELECT * FROM activities WHERE id = $1 FOR UPDATE',
        [activityId]
      );

      if (actResult.rows.length === 0) {
        throw new NotFoundError('活动不存在');
      }

      const activity = actResult.rows[0];

      if (activity.status !== 'active') {
        throw new ConflictError('活动已结束');
      }

      // ── 2. 获取用户信息（行锁） ──
      const userResult = await client.query(
        `SELECT id, points, vip_level, vip_monthly_quota, vip_monthly_used, vip_quota_reset_date
         FROM users WHERE id = $1 FOR UPDATE`,
        [userId]
      );

      if (userResult.rows.length === 0) {
        throw new NotFoundError('用户不存在');
      }

      const user = userResult.rows[0];
      const isVip = user.vip_level > 0;

      // ── 3. 检查是否已兑换 ──
      const existing = await client.query(
        `SELECT * FROM redemption_records
         WHERE user_id = $1 AND activity_id = $2 AND status IN ('pending', 'confirmed')`,
        [userId, activityId]
      );

      if (existing.rows.length > 0) {
        throw new ConflictError('您已兑换过此活动');
      }

      // ── 4. 判断兑换方式 ──
      let redeemType;        // 'vip_free' | 'points'
      let pointsToSpend = 0;
      let quotaField;       // 更新哪个名额字段
      let quotaLimit;       // 名额上限
      let quotaUsed;        // 当前已用名额

      if (isVip) {
        // VIP 用户：先尝试免积分
        const monthlyRemaining = user.vip_monthly_quota - user.vip_monthly_used;

        if (monthlyRemaining > 0) {
          // 使用 VIP 免积分额度
          quotaField = 'vip_redeemed_count';
          quotaLimit = activity.vip_quota;
          quotaUsed  = activity.vip_redeemed_count;

          if (quotaLimit > 0 && quotaUsed >= quotaLimit) {
            throw new ConflictError('VIP名额已满');
          }

          redeemType = 'vip_free';
          pointsToSpend = 0;
        } else {
          // VIP 免积分次数用尽，回退积分兑换（仍占 VIP 名额）
          quotaField = 'vip_redeemed_count';
          quotaLimit = activity.vip_quota;
          quotaUsed  = activity.vip_redeemed_count;

          if (quotaLimit > 0 && quotaUsed >= quotaLimit) {
            throw new ConflictError('VIP名额已满');
          }

          if (user.points < activity.points_required) {
            throw new ConflictError(`积分不足，需要${activity.points_required}积分（本月免积分次数已用完）`);
          }

          redeemType = 'points';
          pointsToSpend = activity.points_required;
        }
      } else {
        // 普通用户：仅积分兑换
        quotaField = 'regular_redeemed_count';
        quotaLimit = activity.regular_quota;
        quotaUsed  = activity.regular_redeemed_count;

        if (quotaLimit > 0 && quotaUsed >= quotaLimit) {
          throw new ConflictError('普通用户名额已满');
        }

        if (user.points < activity.points_required) {
          throw new ConflictError(`积分不足，需要${activity.points_required}积分`);
        }

        redeemType = 'points';
        pointsToSpend = activity.points_required;
      }

      // ── 5. 执行扣减 ──
      if (redeemType === 'vip_free') {
        // VIP 免积分：扣月度额度
        await client.query(
          'UPDATE users SET vip_monthly_used = vip_monthly_used + 1, updated_at = NOW() WHERE id = $1',
          [userId]
        );
      } else {
        // 积分兑换：扣积分
        await client.query(
          'UPDATE users SET points = points - $1, updated_at = NOW() WHERE id = $2',
          [pointsToSpend, userId]
        );

        // 记录积分消费
        await client.query(
          `INSERT INTO points_records (user_id, points, type, description, reference_id)
           VALUES ($1, $2, 'redeem', $3, $4)`,
          [userId, -pointsToSpend, `兑换活动：${activity.title}`, activityId]
        );
      }

      // ── 6. 生成兑换码 ──
      const code = this.generateRedemptionCode();

      // ── 7. 创建兑换记录 ──
      const redeemInsert = await client.query(
        `INSERT INTO redemption_records
         (user_id, activity_id, merchant_id, code, points_spent, redeem_type, status, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6, 'pending', DATE_ADD(NOW(), INTERVAL 24 HOUR))`,
        [userId, activityId, activity.merchant_id, code, pointsToSpend, redeemType]
      );
      const redeemId = redeemInsert.insertId;
      const redeemResult = await client.query(
        'SELECT * FROM redemption_records WHERE id = $1',
        [redeemId]
      );

      // ── 8. 更新活动已兑换数量 ──
      await client.query(
        `UPDATE activities SET ${quotaField} = ${quotaField} + 1 WHERE id = $1`,
        [activityId]
      );

      // ── 9. 组装返回 ──
      const newPoints = redeemType === 'vip_free' ? user.points : user.points - pointsToSpend;
      const monthlyUsed = redeemType === 'vip_free' ? user.vip_monthly_used + 1 : user.vip_monthly_used;

      return {
        redemption: redeemResult.rows[0],
        code,
        redeemType,
        pointsSpent: pointsToSpend,
        remainingPoints: newPoints,
        vipMonthlyRemaining: isVip ? user.vip_monthly_quota - monthlyUsed : 0
      };
    });
  },

  /**
   * 兑换记录
   */
  async getRedeemHistory(userId, page, pageSize, status) {
    const offset = (page - 1) * pageSize;
    let whereClause = 'WHERE r.user_id = $1';
    const params = [userId];
    let paramIdx = 2;

    if (status) {
      whereClause += ` AND r.status = $${paramIdx}`;
      params.push(status);
      paramIdx++;
    }

    const countResult = await db.query(
      `SELECT COUNT(*) FROM redemption_records r ${whereClause}`,
      params
    );

    params.push(pageSize, offset);
    const result = await db.query(
      `SELECT r.*, a.title as activity_title, a.gift_name,
              m.name as merchant_name
       FROM redemption_records r
       JOIN activities a ON a.id = r.activity_id
       JOIN merchants m ON m.id = r.merchant_id
       ${whereClause}
       ORDER BY r.created_at DESC
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      params
    );

    return {
      records: result.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      pageSize
    };
  },

  /**
   * 生成兑换码 (8位字母数字)
   */
  generateRedemptionCode() {
    return crypto.randomBytes(4)
      .toString('hex')
      .toUpperCase()
      .match(/.{1,4}/g)
      .join('-');
  }
};

module.exports = activityService;
