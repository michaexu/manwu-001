const { Op } = require('sequelize');
const { Activity, Registration } = require('../models');
const { generateId } = require('../utils/crypto');
const { NotFoundError, ConflictError } = require('../utils/errors');

/**
 * 活动服务
 */
class ActivityService {
  /**
   * 查询客户端可见的活动列表
   */
  async getPublishedList({ page = 1, pageSize = 20 } = {}) {
    const now = new Date();
    const where = {
      status: 'published',
      end_time: { [Op.gte]: now }
    };

    const { rows, count } = await Activity.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: pageSize,
      attributes: [
        'id', 'title', 'coverImage', 'location', 'startTime', 'endTime',
        'vipQuota', 'regularQuota', 'pointsRequired', 'status',
        'vipCount', 'regularCount', 'currentCount', 'createdAt'
      ]
    });

    return {
      list: rows.map(a => this.formatActivity(a)),
      total: count,
      page,
      pageSize
    };
  }

  /**
   * 获取活动详情
   */
  async getDetail(activityId) {
    const activity = await Activity.findByPk(activityId);
    if (!activity) throw new NotFoundError('活动不存在');
    return this.formatActivity(activity);
  }

  /**
   * 商家端：获取活动管理列表（含所有状态）
   */
  async getManagementList({ page = 1, pageSize = 20, status } = {}) {
    const where = {};
    if (status) where.status = status;

    const { rows, count } = await Activity.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: pageSize
    });

    return {
      list: rows.map(a => this.formatActivity(a, true)),
      total: count,
      page,
      pageSize
    };
  }

  /**
   * 商家端：创建活动
   */
  async create(data, operatorId) {
    const activity = await Activity.create({
      id: generateId(),
      title: data.title,
      coverImage: data.coverImage,
      prizeDesc: data.prizeDesc,
      location: data.location,
      startTime: data.startTime,
      endTime: data.endTime,
      maxParticipants: data.maxParticipants || 0,
      vipQuota: data.vipQuota || 0,
      regularQuota: data.regularQuota || 0,
      pointsRequired: data.pointsRequired || 0,
      description: data.description || '',
      status: data.status || 'draft',
      createdBy: operatorId
    });

    return activity;
  }

  /**
   * 商家端：编辑活动
   */
  async update(activityId, data) {
    const activity = await Activity.findByPk(activityId);
    if (!activity) throw new NotFoundError('活动不存在');

    // 已发布的活动只能修改非核心字段
    if (activity.status === 'published') {
      const allowed = ['description', 'coverImage', 'prizeDesc'];
      const updates = {};
      for (const key of allowed) {
        if (data[key] !== undefined) updates[key] = data[key];
      }
      await activity.update(updates);
    } else {
      await activity.update(data);
    }

    return activity;
  }

  /**
   * 发布/下架活动
   */
  async setStatus(activityId, status) {
    const activity = await Activity.findByPk(activityId);
    if (!activity) throw new NotFoundError('活动不存在');
    if (status === 'published' && activity.status === 'draft') {
      // 检查必填字段
      if (!activity.title || !activity.location || !activity.startTime || !activity.endTime) {
        throw new Error('请完善活动信息后再发布');
      }
    }
    await activity.update({ status });
    return activity;
  }

  /**
   * 格式化活动数据
   */
  formatActivity(activity, isMerchant = false) {
    const remainingVip = activity.vipQuota === 0
      ? '不限'
      : Math.max(0, activity.vipQuota - activity.vipCount);
    const remainingRegular = activity.regularQuota === 0
      ? '不限'
      : Math.max(0, activity.regularQuota - activity.regularCount);

    const base = {
      id: activity.id,
      title: activity.title,
      coverImage: activity.coverImage,
      prizeDesc: activity.prizeDesc,
      location: activity.location,
      startTime: activity.startTime,
      endTime: activity.endTime,
      maxParticipants: activity.maxParticipants,
      vipQuota: activity.vipQuota,
      regularQuota: activity.regularQuota,
      pointsRequired: activity.pointsRequired,
      vipRemaining: remainingVip,
      regularRemaining: remainingRegular,
      status: activity.status,
      createdAt: activity.createdAt
    };

    if (isMerchant) {
      return {
        ...base,
        description: activity.description,
        currentCount: activity.currentCount,
        vipCount: activity.vipCount,
        regularCount: activity.regularCount,
        createdBy: activity.createdBy,
        updatedAt: activity.updatedAt
      };
    }

    return base;
  }
}

module.exports = new ActivityService();
