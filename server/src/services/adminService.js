/**
 * 管理员服务
 * VIP分配/回收、全局统计看板、用户管理
 */
const db = require('../models/db');
const { UnauthorizedError, ForbiddenError, NotFoundError, ConflictError } = require('../utils/errors');

const adminService = {
  // ==================== VIP 管理 ====================

  /**
   * 分配VIP（设置等级和月度配额）
   */
  async assignVip(adminId, targetUserId, { vipLevel, monthlyQuota, reason }) {
    // 校验管理员权限
    await this._verifyAdmin(adminId);

    // 查找目标用户
    const userResult = await db.query('SELECT * FROM users WHERE id = $1', [targetUserId]);
    if (userResult.rows.length === 0) {
      throw new NotFoundError('用户不存在');
    }

    const user = userResult.rows[0];

    // 更新VIP
    await db.query(
      `UPDATE users
       SET vip_level = $1, vip_monthly_quota = $2, vip_monthly_used = 0,
           vip_quota_reset_date = DATE_FORMAT(NOW(), '%Y-%m-01'),
           updated_at = NOW()
       WHERE id = $3`,
      [vipLevel, monthlyQuota, targetUserId]
    );

    // 记录操作日志
    await db.query(
      `INSERT INTO admin_logs (admin_id, target_user_id, action, detail)
       VALUES ($1, $2, 'assign_vip', $3)`,
      [adminId, targetUserId, JSON.stringify({
        previous_level: user.vip_level,
        new_level: vipLevel,
        monthly_quota: monthlyQuota,
        reason: reason || ''
      })]
    );

    return {
      userId: targetUserId,
      previousLevel: user.vip_level,
      newLevel: vipLevel,
      monthlyQuota: monthlyQuota
    };
  },

  /**
   * 回收VIP
   */
  async revokeVip(adminId, targetUserId, reason) {
    await this._verifyAdmin(adminId);

    const userResult = await db.query('SELECT * FROM users WHERE id = $1', [targetUserId]);
    if (userResult.rows.length === 0) {
      throw new NotFoundError('用户不存在');
    }

    const user = userResult.rows[0];
    if (user.vip_level === 0) {
      throw new ConflictError('该用户不是VIP');
    }

    await db.query(
      `UPDATE users
       SET vip_level = 0, vip_monthly_quota = 0, vip_monthly_used = 0, updated_at = NOW()
       WHERE id = $1`,
      [targetUserId]
    );

    await db.query(
      `INSERT INTO admin_logs (admin_id, target_user_id, action, detail)
       VALUES ($1, $2, 'revoke_vip', $3)`,
      [adminId, targetUserId, JSON.stringify({
        previous_level: user.vip_level,
        reason: reason || ''
      })]
    );

    return { userId: targetUserId, previousLevel: user.vip_level, newLevel: 0 };
  },

  /**
   * 调整用户积分（管理员赠送/扣除）
   */
  async adjustPoints(adminId, targetUserId, { points, reason }) {
    await this._verifyAdmin(adminId);

    const userResult = await db.query('SELECT * FROM users WHERE id = $1', [targetUserId]);
    if (userResult.rows.length === 0) {
      throw new NotFoundError('用户不存在');
    }

    const user = userResult.rows[0];
    const newPoints = user.points + points;

    if (newPoints < 0) {
      throw new ConflictError('积分不足，无法扣除');
    }

    return db.transaction(async (client) => {
      await client.query(
        'UPDATE users SET points = $1, updated_at = NOW() WHERE id = $2',
        [newPoints, targetUserId]
      );

      const type = points > 0 ? 'admin_grant' : 'admin_grant';
      await client.query(
        `INSERT INTO points_records (user_id, points, type, description)
         VALUES ($1, $2, 'admin_grant', $3)`,
        [targetUserId, points, reason || `管理员${points > 0 ? '赠送' : '扣除'}积分`]
      );

      await client.query(
        `INSERT INTO admin_logs (admin_id, target_user_id, action, detail)
         VALUES ($1, $2, 'adjust_points', $3)`,
        [adminId, targetUserId, JSON.stringify({
          previous_points: user.points,
          change: points,
          new_points: newPoints,
          reason: reason || ''
        })]
      );

      return { userId: targetUserId, previousPoints: user.points, newPoints, change: points };
    });
  },

  // ==================== 用户管理 ====================

  /**
   * 用户列表（支持搜索和筛选）
   */
  async getUserList(adminId, { page = 1, pageSize = 20, keyword, role, vipLevel, sort = 'created_at' }) {
    await this._verifyAdmin(adminId);

    const offset = (page - 1) * pageSize;
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIdx = 1;

    if (keyword) {
      whereClause += ` AND (u.phone LIKE $${paramIdx} OR u.nick_name LIKE $${paramIdx} OR u.wechat_openid LIKE $${paramIdx})`;
      params.push(`%${keyword}%`);
      paramIdx++;
    }

    if (role) {
      whereClause += ` AND u.role = $${paramIdx}`;
      params.push(role);
      paramIdx++;
    }

    if (vipLevel !== undefined && vipLevel !== null) {
      whereClause += ` AND u.vip_level = $${paramIdx}`;
      params.push(vipLevel);
      paramIdx++;
    }

    // 排序
    const sortMap = {
      created_at: 'u.created_at DESC',
      points: 'u.points DESC',
      vip_level: 'u.vip_level DESC'
    };
    const orderBy = sortMap[sort] || 'u.created_at DESC';

    const countResult = await db.query(
      `SELECT COUNT(*) as count FROM users u ${whereClause}`,
      params
    );

    params.push(pageSize, offset);
    const result = await db.query(
      `SELECT u.id, u.nick_name, u.phone, u.role, u.vip_level,
              u.vip_monthly_quota, u.vip_monthly_used, u.points,
              u.total_points_earned, u.created_at, u.updated_at
       FROM users u ${whereClause}
       ORDER BY ${orderBy}
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      params
    );

    return {
      users: result.rows.map(u => ({
        ...u,
        phone: u.phone ? u.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : null
      })),
      total: parseInt(countResult.rows[0].count),
      page,
      pageSize
    };
  },

  /**
   * 用户详情
   */
  async getUserDetail(adminId, targetUserId) {
    await this._verifyAdmin(adminId);

    const result = await db.query(
      `SELECT u.*, m.id as merchant_id, m.name as merchant_name
       FROM users u
       LEFT JOIN merchants m ON m.user_id = u.id
       WHERE u.id = $1`,
      [targetUserId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('用户不存在');
    }

    const user = result.rows[0];

    // 获取统计信息
    const stats = await db.query(
      `SELECT
         (SELECT COUNT(*) FROM checkin_records WHERE user_id = $1) as total_checkins,
         (SELECT COUNT(*) FROM points_records WHERE user_id = $1 AND type = 'ad_reward') as total_ads,
         (SELECT COUNT(*) FROM redemption_records WHERE user_id = $1) as total_redeems,
         (SELECT SUM(points_spent) FROM redemption_records WHERE user_id = $1) as total_points_spent
       FROM users WHERE id = $1`,
      [targetUserId]
    );

    return {
      ...user,
      phone: user.phone ? user.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : null,
      stats: stats.rows[0]
    };
  },

  // ==================== 全局统计看板 ====================

  /**
   * 全局数据看板
   */
  async getDashboard(adminId) {
    await this._verifyAdmin(adminId);

    const today = new Date().toISOString().split('T')[0];
    const monthStart = new Date();
    monthStart.setDate(1);
    const monthStartStr = monthStart.toISOString().split('T')[0];

    const stats = await db.query(`
      SELECT
        -- 用户统计
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM users WHERE role = 'merchant') as total_merchants,
        (SELECT COUNT(*) FROM users WHERE vip_level > 0) as total_vip_users,
        (SELECT COUNT(*) FROM users WHERE DATE(created_at) = '${today}') as new_users_today,
        (SELECT COUNT(*) FROM users WHERE DATE(created_at) >= '${monthStartStr}') as new_users_month,

        -- 活动统计
        (SELECT COUNT(*) FROM activities) as total_activities,
        (SELECT COUNT(*) FROM activities WHERE status = 'active') as active_activities,
        (SELECT COUNT(*) FROM activities WHERE status = 'ended') as ended_activities,

        -- 兑换统计
        (SELECT COUNT(*) FROM redemption_records) as total_redeems,
        (SELECT COUNT(*) FROM redemption_records WHERE status = 'confirmed') as confirmed_redeems,
        (SELECT COUNT(*) FROM redemption_records WHERE status = 'pending') as pending_redeems,
        (SELECT COUNT(*) FROM redemption_records WHERE DATE(created_at) = '${today}') as redeems_today,
        (SELECT COUNT(*) FROM redemption_records WHERE DATE(created_at) >= '${monthStartStr}') as redeems_month,
        (SELECT SUM(points_spent) FROM redemption_records) as total_points_spent,
        (SELECT COALESCE(SUM(points_spent), 0) FROM redemption_records WHERE DATE(created_at) = '${today}') as points_spent_today,

        -- 积分统计
        (SELECT SUM(points) FROM users) as total_user_points,
        (SELECT CAST(AVG(points) AS SIGNED) FROM users) as avg_user_points,

        -- 签到统计
        (SELECT COUNT(*) FROM checkin_records WHERE checkin_date = '${today}') as checkins_today,
        (SELECT COUNT(*) FROM checkin_records WHERE checkin_date >= '${monthStartStr}') as checkins_month,

        -- 广告统计
        (SELECT COUNT(*) FROM points_records WHERE type = 'ad_reward') as total_ad_views,
        (SELECT COUNT(*) FROM points_records WHERE type = 'ad_reward' AND DATE(created_at) = '${today}') as ad_views_today
    `);

    // 按天统计最近7天数据
    const dailyStats = await db.query(`
      SELECT
        d.date,
        COALESCE(rc.count, 0) as redeems,
        COALESCE(cc.count, 0) as checkins,
        COALESCE(ac.count, 0) as ad_views,
        COALESCE(uc.count, 0) as new_users
      FROM (
        SELECT DATE_SUB(CURDATE(), INTERVAL (t.n) DAY) as date FROM
          (SELECT 0 as n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6) t
      ) d
      LEFT JOIN (
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM redemption_records
        WHERE DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
        GROUP BY DATE(created_at)
      ) rc ON d.date = rc.date
      LEFT JOIN (
        SELECT checkin_date as date, COUNT(*) as count
        FROM checkin_records
        WHERE checkin_date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
        GROUP BY checkin_date
      ) cc ON d.date = cc.date
      LEFT JOIN (
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM points_records
        WHERE type = 'ad_reward' AND DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
        GROUP BY DATE(created_at)
      ) ac ON d.date = ac.date
      LEFT JOIN (
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM users
        WHERE DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
        GROUP BY DATE(created_at)
      ) uc ON d.date = uc.date
      ORDER BY d.date
    `);

    return {
      overview: stats.rows[0],
      daily: dailyStats.rows
    };
  },

  /**
   * 管理员操作日志
   */
  async getAdminLogs(adminId, { page = 1, pageSize = 20 }) {
    await this._verifyAdmin(adminId);

    const offset = (page - 1) * pageSize;

    const countResult = await db.query(
      'SELECT COUNT(*) as count FROM admin_logs WHERE admin_id = $1',
      [adminId]
    );

    const result = await db.query(
      `SELECT al.*, u.nick_name as target_name
       FROM admin_logs al
       LEFT JOIN users u ON al.target_user_id = u.id
       WHERE al.admin_id = $1
       ORDER BY al.created_at DESC
       LIMIT $2 OFFSET $3`,
      [adminId, pageSize, offset]
    );

    return {
      logs: result.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      pageSize
    };
  },

  // ==================== 核销记录 ====================

  /**
   * 全量核销记录（管理员视角）
   */
  async getRedemptions(adminId, { page = 1, pageSize = 20, keyword, status, dateStart, dateEnd }) {
    await this._verifyAdmin(adminId);

    const offset = (page - 1) * pageSize;
    const conditions = [];
    const params = [];

    if (status) {
      params.push(status);
      conditions.push(`rr.status = $${params.length}`);
    }
    if (dateStart) {
      params.push(dateStart);
      conditions.push(`DATE(rr.created_at) >= $${params.length}`);
    }
    if (dateEnd) {
      params.push(dateEnd);
      conditions.push(`DATE(rr.created_at) <= $${params.length}`);
    }
    if (keyword) {
      params.push(`%${keyword}%`);
      conditions.push(`(u.phone LIKE $${params.length} OR u.nick_name LIKE $${params.length} OR a.title LIKE $${params.length})`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await db.query(
      `SELECT COUNT(*) as count
       FROM redemption_records rr
       JOIN users u ON rr.user_id = u.id
       LEFT JOIN activities a ON rr.activity_id = a.id
       ${where}`,
      params
    );

    const result = await db.query(
      `SELECT
         rr.*,
         u.nick_name as user_name,
         u.phone,
         a.title as activity_name,
         m.name as merchant_name
       FROM redemption_records rr
       JOIN users u ON rr.user_id = u.id
       LEFT JOIN activities a ON rr.activity_id = a.id
       LEFT JOIN merchants m ON rr.merchant_id = m.id
       ${where}
       ORDER BY rr.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, pageSize, offset]
    );

    const total = parseInt(countResult.rows[0].count);
    return {
      items: result.rows,
      total,
      page,
      total_pages: Math.ceil(total / pageSize)
    };
  },

  // ==================== 积分流水 ====================

  /**
   * 全量积分流水（管理员视角）
   */
  async getPointsHistory(adminId, { page = 1, pageSize = 20, type, keyword }) {
    await this._verifyAdmin(adminId);

    const offset = (page - 1) * pageSize;
    const conditions = [];
    const params = [];

    if (type) {
      params.push(type);
      conditions.push(`pr.type = $${params.length}`);
    }
    if (keyword) {
      params.push(`%${keyword}%`);
      conditions.push(`(u.phone LIKE $${params.length} OR u.nick_name LIKE $${params.length})`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await db.query(
      `SELECT COUNT(*) as count FROM points_records pr JOIN users u ON pr.user_id = u.id ${where}`,
      params
    );

    const result = await db.query(
      `SELECT pr.*, u.nick_name, u.phone
       FROM points_records pr
       JOIN users u ON pr.user_id = u.id
       ${where}
       ORDER BY pr.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, pageSize, offset]
    );

    const total = parseInt(countResult.rows[0].count);
    return {
      items: result.rows,
      total,
      page,
      total_pages: Math.ceil(total / pageSize)
    };
  },

  // ==================== 辅助方法 ====================

  async _verifyAdmin(userId) {
    const result = await db.query(
      'SELECT role FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new UnauthorizedError('用户不存在');
    }

    if (result.rows[0].role !== 'admin') {
      throw new ForbiddenError('仅管理员可执行此操作');
    }
  }
};

module.exports = adminService;
