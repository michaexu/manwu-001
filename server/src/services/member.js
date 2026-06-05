const { Member, VipLog } = require('../models');
const { generateId } = require('../utils/crypto');
const { NotFoundError, AppError } = require('../utils/errors');

/**
 * 会员管理服务（商家端用）
 */
class MemberService {
  /**
   * 获取会员列表
   */
  async getList({ page = 1, pageSize = 20, keyword, memberType } = {}) {
    const { Op } = require('sequelize');
    const where = {};
    if (memberType) where.memberType = memberType;
    if (keyword) {
      where[Op.or] = [
        { nickname: { [Op.like]: `%${keyword}%` } },
        { phone: { [Op.like]: `%${keyword}%` } }
      ];
    }

    const { rows, count } = await Member.findAndCountAll({
      where,
      attributes: ['id', 'nickname', 'avatarUrl', 'memberType', 'pointsBalance', 'phone', 'createdAt'],
      order: [['created_at', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: pageSize
    });

    return { list: rows, total: count, page, pageSize };
  }

  /**
   * 获取会员详情
   */
  async getDetail(memberId) {
    const member = await Member.findByPk(memberId, {
      attributes: ['id', 'nickname', 'avatarUrl', 'memberType', 'pointsBalance', 'phone', 'createdAt']
    });
    if (!member) throw new NotFoundError('会员不存在');
    return member;
  }

  /**
   * 开通 VIP
   */
  async grantVip(memberId, operatorId) {
    const member = await Member.findByPk(memberId);
    if (!member) throw new NotFoundError('会员不存在');
    if (member.memberType === 'vip') {
      throw new AppError('该会员已是 VIP');
    }

    const { sequelize } = require('../config/database');
    const transaction = await sequelize.transaction();
    try {
      await member.update({ memberType: 'vip' }, { transaction });
      await VipLog.create({
        id: generateId(),
        memberId,
        action: 'grant',
        operatorId
      }, { transaction });
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }

    return { memberId, memberType: 'vip' };
  }

  /**
   * 撤销 VIP
   */
  async revokeVip(memberId, operatorId) {
    const member = await Member.findByPk(memberId);
    if (!member) throw new NotFoundError('会员不存在');
    if (member.memberType === 'regular') {
      throw new AppError('该会员不是 VIP');
    }

    const { sequelize } = require('../config/database');
    const transaction = await sequelize.transaction();
    try {
      await member.update({ memberType: 'regular' }, { transaction });
      await VipLog.create({
        id: generateId(),
        memberId,
        action: 'revoke',
        operatorId
      }, { transaction });
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }

    return { memberId, memberType: 'regular' };
  }

  /**
   * 获取 VIP 操作日志
   */
  async getVipLogs(memberId) {
    if (!memberId) {
      return VipLog.findAll({
        order: [['created_at', 'DESC']],
        limit: 100
      });
    }
    return VipLog.findAll({
      where: { memberId },
      order: [['created_at', 'DESC']]
    });
  }
}

module.exports = new MemberService();
