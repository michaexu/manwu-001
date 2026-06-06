/**
 * 商家管理服务
 */
const db = require('../models/db');
const { NotFoundError, ForbiddenError } = require('../utils/errors');

const merchantService = {
  /**
   * 创建活动
   */
  async createActivity(merchantId, data) {
    const insertResult = await db.query(
      `INSERT INTO activities
       (merchant_id, title, description, points_required, gift_name, gift_spec,
        gift_description, merchant_description, image_url, emoji, color,
        vip_quota, regular_quota, start_time, end_time)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        merchantId, data.title, data.description, data.points_required,
        data.gift_name, data.gift_spec || null, data.gift_description || null,
        data.merchant_description || null, data.image_url || null,
        data.emoji || '🎁', data.color || '#EC4899',
        data.vip_quota || 0, data.regular_quota || 0,
        data.start_time || null, data.end_time || null
      ]
    );

    const result = await db.query('SELECT * FROM activities WHERE id = ?', [insertResult.insertId]);
    return result.rows[0];
  },

  /**
   * 更新活动
   */
  async updateActivity(merchantId, activityId, data) {
    // 验证所有权（admin 可跳过）
    if (merchantId) {
      const existing = await db.query(
        'SELECT * FROM activities WHERE id = $1 AND merchant_id = $2',
        [activityId, merchantId]
      );
      if (existing.rows.length === 0) {
        throw new NotFoundError('活动不存在或无权限');
      }
    }

    const fields = [];
    const values = [];

    const updatableFields = [
      'title', 'description', 'points_required', 'gift_name',
      'gift_spec', 'gift_description', 'merchant_description',
      'image_url', 'emoji', 'color',
      'vip_quota', 'regular_quota', 'start_time', 'end_time', 'status'
    ];

    for (const field of updatableFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(data[field]);
      }
    }

    if (fields.length === 0) {
      const r = await db.query('SELECT * FROM activities WHERE id = ?', [activityId]);
      return r.rows[0] || null;
    }

    fields.push(`updated_at = NOW()`);
    values.push(activityId);
    // Admin: no merchant filter; merchant: verify ownership
    if (merchantId) {
      values.push(merchantId);
      await db.query(
        `UPDATE activities SET ${fields.join(', ')} WHERE id = ? AND merchant_id = ?`,
        values
      );
    } else {
      await db.query(
        `UPDATE activities SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
    }

    const result = await db.query('SELECT * FROM activities WHERE id = ?', [activityId]);
    return result.rows[0];
  },

  /**
   * 商家活动列表
   */
  async getActivities(merchantId, { page, pageSize, status }) {
    const offset = (page - 1) * pageSize;
    const params = [];
    let whereClause = 'WHERE 1=1';

    // Admin (no merchantId) sees all activities; merchant only sees own
    if (merchantId) {
      whereClause += ' AND merchant_id = $1';
      params.push(merchantId);
    }

    if (status) {
      const idx = params.length + 1;
      whereClause += ` AND status = $${idx}`;
      params.push(status);
    }

    const countResult = await db.query(
      `SELECT COUNT(*) as count FROM activities ${whereClause}`,
      params
    );

    const limitIdx = params.length + 1;
    const offsetIdx = params.length + 2;
    params.push(pageSize, offset);

    const result = await db.query(
      `SELECT * FROM activities ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
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
   * 更新活动状态
   */
  async updateActivityStatus(merchantId, activityId, status) {
    // Admin: no merchant filter; merchant: verify ownership
    if (merchantId) {
      await db.query(
        `UPDATE activities SET status = ?, updated_at = NOW()
         WHERE id = ? AND merchant_id = ?`,
        [status, activityId, merchantId]
      );
    } else {
      await db.query(
        `UPDATE activities SET status = ?, updated_at = NOW() WHERE id = ?`,
        [status, activityId]
      );
    }

    const result = await db.query('SELECT * FROM activities WHERE id = ?', [activityId]);

    if (result.rows.length === 0) {
      throw new NotFoundError('活动不存在或无权限');
    }

    return result.rows[0];
  },

  /**
   * 商家信息
   */
  async getProfile(merchantId) {
    const result = await db.query(
      'SELECT * FROM merchants WHERE id = $1',
      [merchantId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('商家不存在');
    }

    return result.rows[0];
  }
};

module.exports = merchantService;
