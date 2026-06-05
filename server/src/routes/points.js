const express = require('express');
const router = express.Router();
const PointsService = require('../services/points');
const { auth } = require('../middleware/auth');
const { success, fail, paginated } = require('../utils/response');

/**
 * 获取可用的广告位列表
 * GET /api/points/ads
 */
router.get('/ads', auth, async (req, res, next) => {
  try {
    const ads = await PointsService.getAvailableAds(req.memberId);
    success(res, ads);
  } catch (err) {
    next(err);
  }
});

/**
 * 通过观看广告领取积分
 * POST /api/points/earn
 */
router.post('/earn', auth, async (req, res, next) => {
  try {
    const { adId } = req.body;
    if (!adId) return fail(res, '缺少广告 ID');

    const result = await PointsService.earnFromAd(req.memberId, adId);
    success(res, result, '积分领取成功');
  } catch (err) {
    next(err);
  }
});

/**
 * 获取积分明细
 * GET /api/points/records
 */
router.get('/records', auth, async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20, type } = req.query;
    const result = await PointsService.getRecords(req.memberId, {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      type
    });
    paginated(res, result);
  } catch (err) {
    next(err);
  }
});

/**
 * 签到获取积分（每天一次）
 * POST /api/points/checkin
 */
router.post('/checkin', auth, async (req, res, next) => {
  try {
    const result = await PointsService.checkIn(req.memberId);
    success(res, result, '签到成功');
  } catch (err) {
    next(err);
  }
});

/**
 * 获取签到状态
 * GET /api/points/checkin/status
 */
router.get('/checkin/status', auth, async (req, res, next) => {
  try {
    const result = await PointsService.getCheckInStatus(req.memberId);
    success(res, result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
