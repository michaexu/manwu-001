/**
 * 首页服务 - 聚合首页数据 (V2: 含VIP配额信息)
 */
const db = require('../models/db');

const homeService = {
  async getHomeData(userId, page, pageSize) {
    const offset = (page - 1) * pageSize;

    // 并行获取活动列表
    const activitiesPromise = db.query(
      `SELECT a.*, m.name as merchant_name
       FROM activities a
       JOIN merchants m ON m.id = a.merchant_id
       WHERE a.status = 'active'
       ORDER BY a.created_at DESC
       LIMIT $1 OFFSET $2`,
      [pageSize, offset]
    );

    // 获取用户信息（如果已登录）
    let userPromise = Promise.resolve(null);
    if (userId) {
      userPromise = db.query(
        `SELECT points, vip_level, nick_name, vip_monthly_quota, vip_monthly_used
         FROM users WHERE id = $1`,
        [userId]
      );
    }

    const [activitiesResult, userResult] = await Promise.all([
      activitiesPromise,
      userPromise
    ]);

    const user = userResult?.rows?.[0] || null;

    const vip = (user && user.vip_level > 0) ? {
      level: user.vip_level,
      monthlyQuota: user.vip_monthly_quota || 0,
      monthlyUsed: user.vip_monthly_used || 0,
      monthlyRemaining: (user.vip_monthly_quota || 0) - (user.vip_monthly_used || 0)
    } : null;

    return {
      points: user?.points || 0,
      vipLevel: user?.vip_level || 0,
      vip,
      userName: user?.nick_name || null,
      activities: activitiesResult.rows
    };
  }
};

module.exports = homeService;
