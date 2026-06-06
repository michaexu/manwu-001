/**
 * 签到路由
 */
const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth');
const checkinService = require('../../services/checkinService');

/**
 * POST /api/v1/checkin
 * 执行签到
 */
router.post('/', authenticate, async (req, res, next) => {
  try {
    const result = await checkinService.doCheckin(req.user.id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/checkin/today-status
 * 今日签到状态
 */
router.get('/today-status', authenticate, async (req, res, next) => {
  try {
    const status = await checkinService.getTodayStatus(req.user.id);
    res.json({ success: true, data: status });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/checkin/history
 * 签到历史
 */
router.get('/history', authenticate, async (req, res, next) => {
  try {
    const { month } = req.query;
    const data = await checkinService.getHistory(req.user.id, month);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
