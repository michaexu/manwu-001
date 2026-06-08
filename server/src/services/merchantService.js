/**
 * 商家管理服务
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const db = require('../models/db');
const { NotFoundError, ForbiddenError } = require('../utils/errors');

/**
 * ISO 8601 转 MySQL datetime 格式
 */
function toMysqlDatetime(isoStr) {
  if (!isoStr) return null;
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return null;
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

const UPLOAD_DIR = path.resolve(__dirname, '../../../uploads');

const merchantService = {
  /**
   * 创建活动
   */
  async createActivity(merchantId, data) {
    const insertResult = await db.query(
      `INSERT INTO activities
       (merchant_id, title, description, points_required, gift_name, gift_spec,
        gift_description, merchant_description, image_url, gift_image_url, emoji, color,
        vip_quota, regular_quota, start_time, end_time)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
      [
        merchantId, data.title, data.description, data.points_required,
        data.gift_name, data.gift_spec || null, data.gift_description || null,
        data.merchant_description || null, data.image_url || null,
        data.gift_image_url || null,
        data.emoji || '🎁', data.color || '#EC4899',
        data.vip_quota || 0, data.regular_quota || 0,
        toMysqlDatetime(data.start_time), toMysqlDatetime(data.end_time)
      ]
    );

    const result = await db.query('SELECT * FROM activities WHERE id = $1', [insertResult.insertId]);
    return result.rows[0];
  },

  /**
   * 更新活动
   */
  async updateActivity(merchantId, activityId, data) {
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
      'image_url', 'gift_image_url', 'emoji', 'color',
      'vip_quota', 'regular_quota', 'start_time', 'end_time', 'status'
    ];

    for (const field of updatableFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = $${values.length + 1}`);
        const isDatetime = (field === 'start_time' || field === 'end_time');
        values.push(isDatetime ? toMysqlDatetime(data[field]) : data[field]);
      }
    }

    if (fields.length === 0) {
      const r = await db.query('SELECT * FROM activities WHERE id = $1', [activityId]);
      return r.rows[0] || null;
    }

    fields.push(`updated_at = NOW()`);
    values.push(activityId);
    if (merchantId) {
      values.push(merchantId);
      await db.query(
        `UPDATE activities SET ${fields.join(', ')} WHERE id = $${values.length - 1} AND merchant_id = $${values.length}`,
        values
      );
    } else {
      await db.query(
        `UPDATE activities SET ${fields.join(', ')} WHERE id = $${values.length}`,
        values
      );
    }

    const result = await db.query('SELECT * FROM activities WHERE id = $1', [activityId]);
    return result.rows[0];
  },

  /**
   * 商家活动列表（含参与人数）
   */
  async getActivities(merchantId, { page, pageSize, status, keyword }) {
    const offset = (page - 1) * pageSize;
    const params = [];
    let whereClause = 'WHERE 1=1';

    if (merchantId) {
      whereClause += ' AND a.merchant_id = $1';
      params.push(merchantId);
    }

    if (status) {
      const idx = params.length + 1;
      whereClause += ` AND a.status = $${idx}`;
      params.push(status);
    }

    if (keyword) {
      const idx = params.length + 1;
      whereClause += ` AND a.title LIKE $${idx}`;
      params.push(`%${keyword}%`);
    }

    const countResult = await db.query(
      `SELECT COUNT(*) as count FROM activities a ${whereClause}`,
      params
    );

    const limitIdx = params.length + 1;
    const offsetIdx = params.length + 2;
    params.push(pageSize, offset);

    const result = await db.query(
      `SELECT a.*,
        (SELECT COUNT(*) FROM redemption_records WHERE activity_id = a.id) as participant_count
       FROM activities a ${whereClause}
       ORDER BY a.created_at DESC
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
   * 获取单个活动
   */
  async getActivity(merchantId, activityId) {
    const whereClause = merchantId
      ? 'AND a.merchant_id = $2'
      : '';
    const params = merchantId ? [activityId, merchantId] : [activityId];

    const result = await db.query(
      `SELECT a.* FROM activities a WHERE a.id = $1 ${whereClause}`,
      params
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('活动不存在或无权限');
    }

    return result.rows[0];
  },

  /**
   * 获取活动参与者列表
   */
  async getActivityParticipants(merchantId, activityId) {
    // 验证活动属于该商家
    const act = await db.query(
      'SELECT id FROM activities WHERE id = $1 AND merchant_id = $2',
      [activityId, merchantId]
    );
    if (act.rows.length === 0) throw new NotFoundError('活动不存在或无权限');

    const result = await db.query(
      `SELECT r.id, r.code, r.points_spent, r.redeem_type, r.status, r.created_at,
              u.nick_name, u.phone
       FROM redemption_records r
       JOIN users u ON u.id = r.user_id
       WHERE r.activity_id = $1
       ORDER BY r.created_at DESC`,
      [activityId]
    );

    return result.rows.map(r => ({
      ...r,
      phone: r.phone ? r.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : null
    }));
  },

  /**
   * 上传图片（base64 → 文件）
   */
  uploadImage(fileName, base64Data) {
    return new Promise((resolve, reject) => {
      // 移除 data:image/xxx;base64, 前缀（如果有）
      const matches = base64Data.match(/^data:image\/(\w+);base64,(.+)$/);
      const ext = matches ? matches[1] : 'jpg';
      const raw = matches ? matches[2] : base64Data;

      const buf = Buffer.from(raw, 'base64');
      const uniqueName = `${crypto.randomBytes(12).toString('hex')}.${ext}`;
      const filePath = path.join(UPLOAD_DIR, uniqueName);

      fs.writeFile(filePath, buf, (err) => {
        if (err) return reject(err);
        resolve(`/uploads/${uniqueName}`);
      });
    });
  },

  /**
   * 更新活动状态
   */
  async updateActivityStatus(merchantId, activityId, status) {
    if (merchantId) {
      await db.query(
        `UPDATE activities SET status = $1, updated_at = NOW()
         WHERE id = $2 AND merchant_id = $3`,
        [status, activityId, merchantId]
      );
    } else {
      await db.query(
        `UPDATE activities SET status = $1, updated_at = NOW() WHERE id = $2`,
        [status, activityId]
      );
    }

    const result = await db.query('SELECT * FROM activities WHERE id = $1', [activityId]);

    if (result.rows.length === 0) {
      throw new NotFoundError('活动不存在或无权限');
    }

    return result.rows[0];
  },

  /**
   * 删除活动
   */
  async deleteActivity(merchantId, activityId) {
    if (merchantId) {
      const result = await db.query(
        'DELETE FROM activities WHERE id = $1 AND merchant_id = $2',
        [activityId, merchantId]
      );
      if (result.affectedRows === 0) {
        throw new NotFoundError('活动不存在或无权限');
      }
    } else {
      const result = await db.query(
        'DELETE FROM activities WHERE id = $1',
        [activityId]
      );
      if (result.affectedRows === 0) {
        throw new NotFoundError('活动不存在');
      }
    }
  },

  /**
   * 商家仪表盘统计
   */
  async getDashboard(merchantId) {
    // 活动概览
    const actResult = await db.query(
      `SELECT
        COUNT(*) as total_activities,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_activities,
        SUM(CASE WHEN status = 'paused' THEN 1 ELSE 0 END) as paused_activities,
        SUM(CASE WHEN status = 'ended' THEN 1 ELSE 0 END) as ended_activities
       FROM activities WHERE merchant_id = $1`,
      [merchantId]
    );
    const actStats = actResult.rows[0] || {};

    // 兑换统计
    const redeemResult = await db.query(
      `SELECT
        COUNT(*) as total_redemptions,
        SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_redemptions,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_redemptions,
        SUM(CASE WHEN redeem_type = 'vip_free' THEN 1 ELSE 0 END) as vip_redemptions,
        SUM(CASE WHEN redeem_type = 'points' THEN 1 ELSE 0 END) as points_redemptions,
        COALESCE(SUM(points_spent), 0) as total_points_spent
       FROM redemption_records WHERE merchant_id = $1`,
      [merchantId]
    );
    const redeemStats = redeemResult.rows[0] || {};

    // 月度趋势（近6个月）
    const monthlyTrend = await db.query(
      `SELECT
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as count,
        SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed
       FROM redemption_records
       WHERE merchant_id = $1 AND created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
       GROUP BY DATE_FORMAT(created_at, '%Y-%m')
       ORDER BY month ASC`,
      [merchantId]
    );

    // TOP 活动（按参与人数）
    const topActivities = await db.query(
      `SELECT a.id, a.title, a.emoji, a.color, a.status,
        COUNT(r.id) as participant_count,
        SUM(CASE WHEN r.status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_count
       FROM activities a
       LEFT JOIN redemption_records r ON r.activity_id = a.id
       WHERE a.merchant_id = $1
       GROUP BY a.id, a.title, a.emoji, a.color, a.status
       ORDER BY participant_count DESC
       LIMIT 5`,
      [merchantId]
    );

    return {
      activities: actStats,
      redemptions: redeemStats,
      monthlyTrend: monthlyTrend.rows,
      topActivities: topActivities.rows
    };
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
