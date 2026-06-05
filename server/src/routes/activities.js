const express = require('express');
const router = express.Router();
const ActivityService = require('../services/activity');
const { auth } = require('../middleware/auth');
const { success, fail, paginated } = require('../utils/response');

/**
 * 获取发布中的活动列表（客户端）
 * GET /api/activities
 */
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const result = await ActivityService.getPublishedList({
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    });
    paginated(res, result);
  } catch (err) {
    next(err);
  }
});

/**
 * 获取活动详情（客户端）
 * GET /api/activities/:id
 */
router.get('/:id', async (req, res, next) => {
  try {
    const activity = await ActivityService.getDetail(req.params.id);
    success(res, activity);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
