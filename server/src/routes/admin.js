const express = require('express');
const router = express.Router();
const { adminAuth } = require('../middleware/auth');
const { Ad, OperatorWhitelist, Member, Activity, Registration } = require('../models');
const { generateId } = require('../utils/crypto');
const { success, fail } = require('../utils/response');

/**
 * 广告位管理
 */

// 获取广告位列表
router.get('/ads', adminAuth, async (req, res, next) => {
  try {
    const ads = await Ad.findAll({ order: [['created_at', 'DESC']] });
    success(res, ads);
  } catch (err) {
    next(err);
  }
});

// 创建/更新广告位
router.post('/ads', adminAuth, async (req, res, next) => {
  try {
    const { id, name, adUnitId, pointsReward, dailyLimit, isActive } = req.body;
    if (id) {
      const ad = await Ad.findByPk(id);
      if (!ad) return fail(res, '广告位不存在');
      await ad.update({ name, adUnitId, pointsReward, dailyLimit, isActive });
      success(res, ad, '更新成功');
    } else {
      const ad = await Ad.create({
        id: generateId(),
        name, adUnitId,
        pointsReward: pointsReward || 0,
        dailyLimit: dailyLimit || 1,
        isActive: isActive !== false
      });
      success(res, ad, '创建成功');
    }
  } catch (err) {
    next(err);
  }
});

/**
 * 操作员白名单管理
 */

// 获取白名单列表
router.get('/whitelist', adminAuth, async (req, res, next) => {
  try {
    const list = await OperatorWhitelist.findAll({ order: [['created_at', 'DESC']] });
    success(res, list);
  } catch (err) {
    next(err);
  }
});

// 新增白名单
router.post('/whitelist', adminAuth, async (req, res, next) => {
  try {
    const { phone, nickname } = req.body;
    if (!phone) return fail(res, '请输入手机号');

    const existing = await OperatorWhitelist.findOne({ where: { phone } });
    if (existing) return fail(res, '该手机号已存在');

    const item = await OperatorWhitelist.create({
      id: generateId(),
      phone,
      nickname: nickname || phone,
      isActive: true
    });
    success(res, item, '添加成功');
  } catch (err) {
    next(err);
  }
});

// 删除白名单
router.delete('/whitelist/:id', adminAuth, async (req, res, next) => {
  try {
    const item = await OperatorWhitelist.findByPk(req.params.id);
    if (!item) return fail(res, '记录不存在');
    await item.destroy();
    success(res, null, '删除成功，该手机号已失去商家端权限');
  } catch (err) {
    next(err);
  }
});

// 启停白名单
router.put('/whitelist/:id/toggle', adminAuth, async (req, res, next) => {
  try {
    const item = await OperatorWhitelist.findByPk(req.params.id);
    if (!item) return fail(res, '记录不存在');
    await item.update({ isActive: !item.isActive });
    success(res, item, item.isActive ? '已启用' : '已禁用');
  } catch (err) {
    next(err);
  }
});

/**
 * 数据看板
 */
router.get('/dashboard', adminAuth, async (req, res, next) => {
  try {
    const memberCount = await Member.count();
    const vipCount = await Member.count({ where: { memberType: 'vip' } });
    const activityCount = await Activity.count();
    const totalRegistrations = await Registration.count();
    const claimedCount = await Registration.count({ where: { status: 'claimed' } });
    const cancelledCount = await Registration.count({ where: { status: 'cancelled' } });

    const totalPoints = await require('../models/PointsRecord').sum('changeAmount', {
      where: { changeType: 'earn_ad' }
    }) || 0;

    success(res, {
      memberCount,
      vipCount,
      regularCount: memberCount - vipCount,
      activityCount,
      totalRegistrations,
      claimedCount,
      cancelledCount,
      claimRate: totalRegistrations > 0 ? ((claimedCount / totalRegistrations) * 100).toFixed(1) : 0,
      totalPointsEarned: totalPoints
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
