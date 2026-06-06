/**
 * 签到服务
 */
const db = require('../models/db');
const { ConflictError } = require('../utils/errors');

const checkinService = {
  /**
   * 执行签到
   */
  async doCheckin(userId) {
    const today = new Date().toISOString().split('T')[0];

    return db.transaction(async (client) => {
      // 检查今日是否已签到
      const existing = await client.query(
        'SELECT * FROM checkin_records WHERE user_id = $1 AND checkin_date = $2',
        [userId, today]
      );

      if (existing.rows.length > 0) {
        throw new ConflictError('今日已签到');
      }

      // 计算连续签到天数
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const yesterdayCheckin = await client.query(
        'SELECT streak_days FROM checkin_records WHERE user_id = $1 AND checkin_date = $2',
        [userId, yesterdayStr]
      );

      let streakDays = 1;
      if (yesterdayCheckin.rows.length > 0) {
        streakDays = yesterdayCheckin.rows[0].streak_days + 1;
      }

      // 计算奖励积分（连续7天额外奖励）
      let rewardPoints = 10; // 基础签到10分
      if (streakDays % 7 === 0) {
        rewardPoints += 50; // 连续7天额外50分
      }

      // 创建签到记录
      await client.query(
        `INSERT INTO checkin_records (user_id, checkin_date, reward_points, streak_days)
         VALUES ($1, $2, $3, $4)`,
        [userId, today, rewardPoints, streakDays]
      );

      // 增加用户积分
      await client.query(
        'UPDATE users SET points = points + $1, total_points_earned = total_points_earned + $1, updated_at = NOW() WHERE id = $2',
        [rewardPoints, userId]
      );

      // 记录积分流水
      await client.query(
        `INSERT INTO points_records (user_id, points, type, description)
         VALUES ($1, $2, 'checkin', $3)`,
        [userId, rewardPoints, `每日签到（连续${streakDays}天）`]
      );

      const result = await client.query('SELECT points FROM users WHERE id = $1', [userId]);
      return {
        reward: rewardPoints,
        streakDays,
        totalPoints: result.rows[0].points
      };
    });
  },

  /**
   * 今日签到状态
   */
  async getTodayStatus(userId) {
    const today = new Date().toISOString().split('T')[0];

    const result = await db.query(
      'SELECT * FROM checkin_records WHERE user_id = $1 AND checkin_date = $2',
      [userId, today]
    );

    const checkedIn = result.rows.length > 0;
    return {
      checkedIn,
      reward: checkedIn ? result.rows[0].reward_points : 10,
      streakDays: checkedIn ? result.rows[0].streak_days : 0
    };
  },

  /**
   * 签到历史
   */
  async getHistory(userId, month) {
    let whereClause = 'WHERE user_id = $1';
    const params = [userId];

    if (month) {
      whereClause += ` AND DATE_FORMAT(checkin_date, '%Y-%m') = ?`;
      params.push(month);
    }

    const result = await db.query(
      `SELECT * FROM checkin_records ${whereClause}
       ORDER BY checkin_date DESC`,
      params
    );

    return result.rows;
  }
};

module.exports = checkinService;
