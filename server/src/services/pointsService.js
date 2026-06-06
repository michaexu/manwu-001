/**
 * 积分服务
 */
const db = require('../models/db');
const config = require('../config');
const { ConflictError } = require('../utils/errors');

const pointsService = {
  /**
   * 积分明细
   */
  async getHistory(userId, { page, pageSize, type }) {
    const offset = (page - 1) * pageSize;
    let whereClause = 'WHERE user_id = $1';
    const params = [userId];
    let paramIdx = 2;

    if (type) {
      whereClause += ` AND type = $${paramIdx}`;
      params.push(type);
      paramIdx++;
    }

    const countResult = await db.query(
      `SELECT COUNT(*) FROM points_records ${whereClause}`,
      params
    );

    params.push(pageSize, offset);
    const result = await db.query(
      `SELECT * FROM points_records ${whereClause}
       ORDER BY created_at DESC
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
   * 广告积分奖励
   */
  async claimAdReward(userId) {
    if (!config.ad.enabled) {
      throw new ConflictError('广告奖励功能暂未开启');
    }

    const reward = config.ad.rewardPoints;

    return db.transaction(async (client) => {
      // 增加积分
      await client.query(
        'UPDATE users SET points = points + $1, total_points_earned = total_points_earned + $1, updated_at = NOW() WHERE id = $2',
        [reward, userId]
      );

      // 记录积分流水
      await client.query(
        `INSERT INTO points_records (user_id, points, type, description)
         VALUES ($1, $2, 'ad_reward', '观看广告奖励')`,
        [userId, reward]
      );

      const result = await client.query('SELECT points FROM users WHERE id = $1', [userId]);
      return {
        reward,
        totalPoints: result.rows[0].points
      };
    });
  },

  /**
   * 积分规则
   */
  async getRules() {
    return {
      checkin: 10,
      adReward: config.ad.rewardPoints,
      vipBonus: 'VIP等级 × 5',
      rules: [
        '每日签到可获得10积分',
        '观看完整广告可获得20积分',
        '连续签到7天额外奖励50积分',
        '积分可兑换商家活动礼品'
      ]
    };
  }
};

module.exports = pointsService;
