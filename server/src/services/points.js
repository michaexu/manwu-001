const { Op } = require('sequelize');
const { Member, PointsRecord, Ad, AdClaimRecord, CheckIn } = require('../models');
const { generateId } = require('../utils/crypto');
const { AppError } = require('../utils/errors');

/**
 * 积分服务
 */
class PointsService {
  /**
   * 通过观看广告获取积分
   */
  async earnFromAd(memberId, adId) {
    const member = await Member.findByPk(memberId);
    if (!member) throw new AppError('会员不存在');

    const ad = await Ad.findByPk(adId);
    if (!ad || !ad.isActive) throw new AppError('广告位不存在或未启用');

    // 校验每日领取上限
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayClaims = await AdClaimRecord.count({
      where: {
        memberId,
        adId,
        claimedDate: today
      }
    });

    if (todayClaims >= ad.dailyLimit) {
      throw new AppError('今日已领取该广告积分，明天再来吧');
    }

    const sequelize = require('../config/database');
    const transaction = await sequelize.transaction();

    try {
      // 记录广告领取
      await AdClaimRecord.create({
        id: generateId(),
        memberId,
        adId,
        claimedDate: today
      }, { transaction });

      // 增加积分
      const newBalance = member.pointsBalance + ad.pointsReward;
      await Member.update(
        { pointsBalance: sequelize.literal(`points_balance + ${ad.pointsReward}`) },
        { where: { id: memberId }, transaction }
      );

      // 记录积分变动
      await PointsRecord.create({
        id: generateId(),
        memberId,
        changeType: 'earn_ad',
        changeAmount: ad.pointsReward,
        balanceAfter: newBalance,
        refId: adId,
        remark: `观看广告: ${ad.name}`
      }, { transaction });

      await transaction.commit();

      return {
        pointsEarned: ad.pointsReward,
        balanceAfter: newBalance,
        adName: ad.name
      };
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  /**
   * 获取积分明细
   */
  async getRecords(memberId, { page = 1, pageSize = 20, type } = {}) {
    const where = { memberId };
    if (type) where.changeType = type;

    const { rows, count } = await PointsRecord.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: pageSize
    });

    return {
      list: rows.map(r => ({
        id: r.id,
        changeType: r.changeType,
        changeAmount: r.changeAmount,
        balanceAfter: r.balanceAfter,
        refId: r.refId,
        remark: r.remark,
        createdAt: r.createdAt
      })),
      total: count,
      page,
      pageSize
    };
  }

  /**
   * 获取当前可用的广告位列表
   */
  async getAvailableAds(memberId) {
    const ads = await Ad.findAll({ where: { isActive: true } });
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 查找今日已领取记录
    const claims = await AdClaimRecord.findAll({
      where: {
        memberId,
        claimedDate: today,
        adId: { [Op.in]: ads.map(a => a.id) }
      }
    });
    const claimedAdIds = new Set(claims.map(c => c.adId));

    return ads.map(ad => ({
      id: ad.id,
      name: ad.name,
      adUnitId: ad.adUnitId,
      pointsReward: ad.pointsReward,
      dailyLimit: ad.dailyLimit,
      todayClaimed: claimedAdIds.has(ad.id),
      canClaim: !claimedAdIds.has(ad.id)
    }));
  }

  /**
   * 签到获取积分
   * 每天签到送 1 积分
   */
  async checkIn(memberId) {
    const member = await Member.findByPk(memberId);
    if (!member) throw new AppError('会员不存在');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().slice(0, 10);

    // 检查今日是否已签到
    const existing = await CheckIn.findOne({
      where: { memberId, checkinDate: todayStr }
    });
    if (existing) {
      throw new AppError('今日已签到，明天再来吧');
    }

    const POINTS_PER_CHECKIN = 1;
    const sequelize = require('../config/database');
    const transaction = await sequelize.transaction();

    try {
      // 记录签到
      await CheckIn.create({
        id: generateId(),
        memberId,
        checkinDate: todayStr,
        pointsEarned: POINTS_PER_CHECKIN
      }, { transaction });

      // 增加积分
      const newBalance = member.pointsBalance + POINTS_PER_CHECKIN;
      await Member.update(
        { pointsBalance: sequelize.literal(`points_balance + ${POINTS_PER_CHECKIN}`) },
        { where: { id: memberId }, transaction }
      );

      // 记录积分变动
      await PointsRecord.create({
        id: generateId(),
        memberId,
        changeType: 'earn_checkin',
        changeAmount: POINTS_PER_CHECKIN,
        balanceAfter: newBalance,
        remark: '每日签到'
      }, { transaction });

      await transaction.commit();

      return {
        pointsEarned: POINTS_PER_CHECKIN,
        balanceAfter: newBalance
      };
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  /**
   * 获取签到状态
   */
  async getCheckInStatus(memberId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().slice(0, 10);

    // 今日是否已签到
    const todayCheckIn = await CheckIn.findOne({
      where: { memberId, checkinDate: todayStr }
    });

    // 连续签到天数（从今天往前数）
    let streak = 0;
    const checkDate = new Date(todayStr);
    while (true) {
      const dateStr = checkDate.toISOString().slice(0, 10);
      const record = await CheckIn.findOne({
        where: { memberId, checkinDate: dateStr }
      });
      if (!record) break;
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    return {
      checkedInToday: !!todayCheckIn,
      streak,
      pointsPerCheckIn: 1
    };
  }
}

module.exports = new PointsService();
