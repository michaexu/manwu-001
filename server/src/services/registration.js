const { Op } = require('sequelize');
const { Member, Activity, Registration, PointsRecord } = require('../models');
const { generateId, generateQrToken } = require('../utils/crypto');
const { NotFoundError, ConflictError, AppError } = require('../utils/errors');

/**
 * 报名服务
 */
class RegistrationService {
  /**
   * 会员报名活动
   */
  async register(memberId, activityId) {
    const member = await Member.findByPk(memberId);
    if (!member) throw new NotFoundError('会员不存在');

    const activity = await Activity.findByPk(activityId);
    if (!activity) throw new NotFoundError('活动不存在');

    // 校验活动状态
    if (activity.status !== 'published') {
      throw new AppError('活动未发布或已结束');
    }

    // 校验活动时间
    const now = new Date();
    if (now > activity.endTime) {
      throw new AppError('活动已结束');
    }

    // 校验是否已报名（幂等）
    const existing = await Registration.findOne({
      where: {
        memberId,
        activityId,
        status: { [Op.in]: ['registered', 'claimed'] }
      }
    });
    if (existing) {
      throw new ConflictError('您已报名该活动，请勿重复报名');
    }

    // 检查名额
    const isVip = member.memberType === 'vip';
    if (isVip) {
      if (activity.vipQuota > 0 && activity.vipCount >= activity.vipQuota) {
        throw new AppError('VIP 名额已满');
      }
    } else {
      if (activity.regularQuota > 0 && activity.regularCount >= activity.regularQuota) {
        throw new AppError('普通会员名额已满');
      }
    }

    // VIP 会员不扣积分
    const pointsCost = isVip ? 0 : activity.pointsRequired;

    // 普通会员校验积分余额
    if (!isVip && pointsCost > 0) {
      if (member.pointsBalance < pointsCost) {
        throw new AppError(`积分不足，需要 ${pointsCost} 积分，当前 ${member.pointsBalance} 积分`, 400, -3);
      }
    }

    // 生成领奖码 token
    const registrationId = generateId();
    const qrToken = generateQrToken(memberId, activityId, registrationId);

    // 使用事务确保数据一致性
    const { sequelize } = require('../config/database');
    const transaction = await sequelize.transaction();

    try {
      // 创建报名记录
      await Registration.create({
        id: registrationId,
        memberId,
        activityId,
        qrToken,
        pointsCost,
        status: 'registered'
      }, { transaction });

      // 更新活动计数
      const updateFields = {
        currentCount: sequelize.literal('current_count + 1'),
        ...(isVip ? { vipCount: sequelize.literal('vip_count + 1') } : { regularCount: sequelize.literal('regular_count + 1') })
      };
      await Activity.update(updateFields, {
        where: { id: activityId },
        transaction
      });

      // 普通会员扣除积分
      if (!isVip && pointsCost > 0) {
        await Member.update(
          { pointsBalance: sequelize.literal(`points_balance - ${pointsCost}`) },
          { where: { id: memberId }, transaction }
        );

        await PointsRecord.create({
          id: generateId(),
          memberId,
          changeType: 'cost_activity',
          changeAmount: -pointsCost,
          balanceAfter: member.pointsBalance - pointsCost,
          refId: activityId,
          remark: `报名活动: ${activity.title}`,
          createdAt: new Date()
        }, { transaction });
      }

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }

    return {
      registrationId,
      qrToken,
      activityId,
      pointsCost,
      activity: {
        title: activity.title,
        location: activity.location,
        startTime: activity.startTime,
        endTime: activity.endTime
      }
    };
  }

  /**
   * 取消报名
   */
  async cancel(memberId, registrationId) {
    const { sequelize } = require('../config/database');

    const registration = await Registration.findOne({
      where: { id: registrationId, memberId, status: 'registered' },
      include: [
        { model: Activity, attributes: ['id', 'title', 'pointsRequired'] },
        { model: Member, attributes: ['id', 'memberType'] }
      ]
    });
    if (!registration) throw new NotFoundError('报名记录不存在或已核销/已取消');

    const activity = registration.Activity;
    const member = registration.Member;
    const isVip = member.memberType === 'vip';

    const transaction = await sequelize.transaction();
    try {
      // 标记为已取消
      await Registration.update(
        { status: 'cancelled', cancelledAt: new Date() },
        { where: { id: registrationId }, transaction }
      );

      // 释放名额
      const updateFields = {
        currentCount: sequelize.literal('GREATEST(current_count - 1, 0)'),
        ...(isVip ? { vipCount: sequelize.literal('GREATEST(vip_count - 1, 0)') } : { regularCount: sequelize.literal('GREATEST(regular_count - 1, 0)') })
      };
      await Activity.update(updateFields, {
        where: { id: activity.id },
        transaction
      });

      // 退还积分
      if (registration.pointsCost > 0) {
        await Member.update(
          { pointsBalance: sequelize.literal(`points_balance + ${registration.pointsCost}`) },
          { where: { id: memberId }, transaction }
        );

        // 获取当前最新积分余额
        const updatedMember = await Member.findByPk(memberId, { transaction });
        await PointsRecord.create({
          id: generateId(),
          memberId,
          changeType: 'refund_cancel',
          changeAmount: registration.pointsCost,
          balanceAfter: updatedMember.pointsBalance,
          refId: activity.id,
          remark: `取消报名: ${activity.title}`
        }, { transaction });
      }

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }

    return { cancelled: true, pointsRefunded: registration.pointsCost };
  }

  /**
   * 核销领奖码
   */
  async claim(activityId, registrationId, operatorId) {
    const { sequelize } = require('../config/database');

    const registration = await Registration.findOne({
      where: { id: registrationId, activityId },
      include: [{ model: Member, attributes: ['id', 'nickname', 'avatarUrl', 'memberType'] }]
    });
    if (!registration) throw new NotFoundError('报名记录不存在');

    if (registration.status === 'claimed') {
      throw new AppError(`该奖品已于 ${registration.claimedAt} 核销`);
    }
    if (registration.status === 'cancelled') {
      throw new AppError('该报名已取消，无法核销');
    }

    const activity = await Activity.findByPk(activityId);
    if (!activity) throw new NotFoundError('活动不存在');

    const transaction = await sequelize.transaction();
    try {
      await Registration.update(
        {
          status: 'claimed',
          claimedAt: new Date(),
          claimedBy: operatorId
        },
        { where: { id: registrationId }, transaction }
      );
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }

    return {
      member: registration.Member,
      activity: { title: activity.title, location: activity.location },
      claimedAt: new Date()
    };
  }

  /**
   * 获取会员的参与记录
   */
  async getMemberRegistrations(memberId, { page = 1, pageSize = 20 } = {}) {
    const { rows, count } = await Registration.findAndCountAll({
      where: { memberId },
      include: [
        {
          model: Activity,
          attributes: ['id', 'title', 'coverImage', 'location', 'startTime', 'endTime', 'pointsRequired']
        }
      ],
      order: [['created_at', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: pageSize
    });

    return {
      list: rows.map(r => ({
        id: r.id,
        activityId: r.activityId,
        qrToken: r.qrToken,
        pointsCost: r.pointsCost,
        status: r.status,
        claimedAt: r.claimedAt,
        cancelledAt: r.cancelledAt,
        createdAt: r.createdAt,
        activity: r.Activity
      })),
      total: count,
      page,
      pageSize
    };
  }

  /**
   * 获取活动的参与列表（商家端用）
   */
  async getActivityRegistrations(activityId, { page = 1, pageSize = 20, status } = {}) {
    const where = { activityId };
    if (status) where.status = status;

    const { rows, count } = await Registration.findAndCountAll({
      where,
      include: [
        {
          model: Member,
          attributes: ['id', 'nickname', 'avatarUrl', 'memberType', 'phone']
        }
      ],
      order: [['created_at', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: pageSize
    });

    return {
      list: rows.map(r => ({
        id: r.id,
        member: r.Member,
        pointsCost: r.pointsCost,
        status: r.status,
        claimedAt: r.claimedAt,
        createdAt: r.createdAt
      })),
      total: count,
      page,
      pageSize
    };
  }
}

module.exports = new RegistrationService();
