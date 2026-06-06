/**
 * 积分路由
 */
const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth');
const pointsService = require('../../services/pointsService');

/**
 * GET /api/v1/points/history
 * 积分明细
 */
router.get('/history', authenticate, async (req, res, next) => {
  try {
    const { page = 1, page_size = 20, type } = req.query;
    const data = await pointsService.getHistory(req.user.id, {
      page: parseInt(page),
      pageSize: parseInt(page_size),
      type
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/points/ad-reward
 * 广告积分奖励
 */
router.post('/ad-reward', authenticate, async (req, res, next) => {
  try {
    const result = await pointsService.claimAdReward(req.user.id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/points/rules
 * 积分规则
 */
router.get('/rules', async (req, res, next) => {
  try {
    const rules = await pointsService.getRules();
    res.json({ success: true, data: rules });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
