/**
 * 首页路由
 */
const express = require('express');
const router = express.Router();
const { authenticate, optionalAuth } = require('../../middleware/auth');
const homeService = require('../../services/homeService');

/**
 * GET /api/v1/home
 * 首页数据（积分、活动列表）
 */
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { page = 1, page_size = 10 } = req.query;
    const userId = req.user?.id;
    const data = await homeService.getHomeData(userId, parseInt(page), parseInt(page_size));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
