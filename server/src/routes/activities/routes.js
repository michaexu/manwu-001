/**
 * 活动路由
 */
const express = require('express');
const router = express.Router();
const { z } = require('zod');
const { authenticate, optionalAuth } = require('../../middleware/auth');
const { validate } = require('../../middleware/validate');
const activityService = require('../../services/activityService');
const subscriptionService = require('../../services/subscriptionService');

/**
 * GET /api/v1/activities/redeem-history
 * 兑换记录（静态路由必须放在 /:id 前面）
 */
router.get('/redeem-history', authenticate, async (req, res, next) => {
  try {
    const { page = 1, page_size = 20, status } = req.query;
    const data = await activityService.getRedeemHistory(
      req.user.id,
      parseInt(page),
      parseInt(page_size),
      status
    );
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/activities
 * 活动列表
 */
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, page_size = 10, merchant_id } = req.query;
    const data = await activityService.getList({
      page: parseInt(page),
      pageSize: parseInt(page_size),
      merchantId: merchant_id
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/activities/:id
 * 活动详情（已登录用户自动附带自己的兑换信息）
 */
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const activity = await activityService.getDetail(req.params.id, req.user?.id);
    res.json({ success: true, data: activity });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/activities/:id/redeem
 * 兑换活动资格（消耗积分/VIP免费）
 * 兑换成功后异步发送订阅消息通知
 */
router.post('/:id/redeem', authenticate, async (req, res, next) => {
  try {
    const result = await activityService.redeem(req.user.id, req.params.id);
    res.json({ success: true, data: result });

    // 异步发送兑换成功通知（不阻塞响应）
    const activity = await activityService.getDetail(req.params.id).catch(() => null);
    if (activity) {
      subscriptionService.sendRedeemSuccess(
        req.user.id,
        activity.gift_name || activity.title,
        result.code
      ).catch(err => console.error('[Subscription] 兑换通知发送失败:', err.message));
    }
  } catch (err) {
    next(err);
  }
});

module.exports = router;
