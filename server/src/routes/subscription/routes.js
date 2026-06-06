/**
 * 订阅消息路由
 */
const express = require('express');
const router = express.Router();
const { z } = require('zod');
const { authenticate } = require('../../middleware/auth');
const { validate } = require('../../middleware/validate');
const subscriptionService = require('../../services/subscriptionService');

const recordSchema = z.object({
  acceptMap: z.record(z.string(), z.enum(['accept', 'reject', 'ban']))
});

/**
 * POST /api/v1/subscription/record
 * 记录用户订阅授权（小程序端调用）
 */
router.post('/record', authenticate, validate(recordSchema), async (req, res, next) => {
  try {
    const { acceptMap } = req.validated;
    const result = await subscriptionService.recordSubscription(req.user.id, acceptMap);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/subscription/my
 * 获取当前用户的订阅状态
 */
router.get('/my', authenticate, async (req, res, next) => {
  try {
    const subscriptions = await subscriptionService.getUserSubscriptions(req.user.id);
    res.json({ success: true, data: subscriptions });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/subscription/templates
 * 获取所有可用的订阅模板
 */
router.get('/templates', async (req, res, next) => {
  try {
    const templates = await subscriptionService.getTemplates();
    res.json({
      success: true,
      data: templates.map(t => ({
        templateId: t.template_id,
        name: t.name,
        scene: t.scene
      }))
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
