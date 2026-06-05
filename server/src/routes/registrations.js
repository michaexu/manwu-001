const express = require('express');
const router = express.Router();
const RegistrationService = require('../services/registration');
const QrCodeService = require('../services/qrcode');
const { auth } = require('../middleware/auth');
const { success, fail, paginated } = require('../utils/response');

/**
 * 报名活动
 * POST /api/registrations
 */
router.post('/', auth, async (req, res, next) => {
  try {
    const { activityId } = req.body;
    if (!activityId) return fail(res, '缺少活动 ID');

    const result = await RegistrationService.register(req.memberId, activityId);
    success(res, result, '报名成功');
  } catch (err) {
    next(err);
  }
});

/**
 * 取消报名
 * POST /api/registrations/:id/cancel
 */
router.post('/:id/cancel', auth, async (req, res, next) => {
  try {
    const result = await RegistrationService.cancel(req.memberId, req.params.id);
    success(res, result, '取消报名成功');
  } catch (err) {
    next(err);
  }
});

/**
 * 获取我的参与记录
 * GET /api/registrations/my
 */
router.get('/my', auth, async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const result = await RegistrationService.getMemberRegistrations(req.memberId, {
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    });
    paginated(res, result);
  } catch (err) {
    next(err);
  }
});

/**
 * 获取领奖码二维码
 * GET /api/registrations/:id/qrcode
 */
router.get('/:id/qrcode', auth, async (req, res, next) => {
  try {
    const result = await QrCodeService.generateQrCode(req.params.id);
    success(res, result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
