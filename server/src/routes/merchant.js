const express = require('express');
const router = express.Router();
const { merchantAuth, adminAuth } = require('../middleware/auth');
const ActivityService = require('../services/activity');
const RegistrationService = require('../services/registration');
const QrCodeService = require('../services/qrcode');
const { success, fail, paginated } = require('../utils/response');

/**
 * 获取活动管理列表（含所有状态）
 * GET /api/merchant/activities
 */
router.get('/activities', merchantAuth, async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20, status } = req.query;
    const result = await ActivityService.getManagementList({
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      status
    });
    paginated(res, result);
  } catch (err) {
    next(err);
  }
});

/**
 * 创建活动
 * POST /api/merchant/activities
 */
router.post('/activities', merchantAuth, async (req, res, next) => {
  try {
    const { title, coverImage, prizeDesc, location, startTime, endTime,
            maxParticipants, vipQuota, regularQuota, pointsRequired, description, status } = req.body;
    if (!title || !location || !startTime || !endTime) {
      return fail(res, '请填写必填字段');
    }
    const activity = await ActivityService.create({
      title, coverImage, prizeDesc, location, startTime, endTime,
      maxParticipants, vipQuota, regularQuota, pointsRequired, description, status
    }, req.operatorId);
    success(res, activity, '创建成功');
  } catch (err) {
    next(err);
  }
});

/**
 * 编辑活动
 * PUT /api/merchant/activities/:id
 */
router.put('/activities/:id', merchantAuth, async (req, res, next) => {
  try {
    const activity = await ActivityService.update(req.params.id, req.body);
    success(res, activity, '更新成功');
  } catch (err) {
    next(err);
  }
});

/**
 * 发布活动
 * POST /api/merchant/activities/:id/publish
 */
router.post('/activities/:id/publish', merchantAuth, async (req, res, next) => {
  try {
    const activity = await ActivityService.setStatus(req.params.id, 'published');
    success(res, activity, '发布成功');
  } catch (err) {
    next(err);
  }
});

/**
 * 下架活动
 * POST /api/merchant/activities/:id/unpublish
 */
router.post('/activities/:id/unpublish', merchantAuth, async (req, res, next) => {
  try {
    const activity = await ActivityService.setStatus(req.params.id, 'unpublished');
    success(res, activity, '已下架');
  } catch (err) {
    next(err);
  }
});

/**
 * 获取活动参与列表
 * GET /api/merchant/activities/:id/registrations
 */
router.get('/activities/:id/registrations', merchantAuth, async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20, status } = req.query;
    const result = await RegistrationService.getActivityRegistrations(req.params.id, {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      status
    });
    paginated(res, result);
  } catch (err) {
    next(err);
  }
});

/**
 * 扫码核销 - 验证二维码
 * POST /api/merchant/verify
 */
router.post('/verify', merchantAuth, async (req, res, next) => {
  try {
    const { qrContent } = req.body;
    if (!qrContent) return fail(res, '缺少二维码内容');

    const result = await QrCodeService.verifyQrCode(qrContent);
    if (!result.valid) {
      return fail(res, result.message);
    }
    success(res, {
      registrationId: result.registration.id,
      member: result.member,
      activity: {
        id: result.activity.id,
        title: result.activity.title,
        location: result.activity.location,
        prizeDesc: result.activity.prizeDesc
      },
      status: result.status,
      claimedAt: result.claimedAt
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 确认核销
 * POST /api/merchant/claim
 */
router.post('/claim', merchantAuth, async (req, res, next) => {
  try {
    const { activityId, registrationId } = req.body;
    if (!activityId || !registrationId) {
      return fail(res, '参数不完整');
    }

    const result = await RegistrationService.claim(activityId, registrationId, req.operatorId);
    success(res, result, '核销成功');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
