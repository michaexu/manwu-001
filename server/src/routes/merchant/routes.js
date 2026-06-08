/**
 * 商家管理路由
 */
const express = require('express');
const router = express.Router();
const { z } = require('zod');
const { authenticate, authorize } = require('../../middleware/auth');
const { validate } = require('../../middleware/validate');
const merchantService = require('../../services/merchantService');

const activitySchema = z.object({
  title: z.string().min(1, '活动标题不能为空').max(100),
  description: z.string().min(1, '活动描述不能为空').max(500),
  points_required: z.number().int().min(1, '所需积分必须大于0'),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  vip_quota: z.number().int().min(0).optional().default(0),
  regular_quota: z.number().int().min(0).optional().default(0),
  gift_name: z.string().min(1, '礼品名称不能为空'),
  gift_spec: z.string().max(200).optional(),
  gift_description: z.string().max(1000).optional(),
  merchant_description: z.string().max(500).optional(),
  image_url: z.string().optional(),
  gift_image_url: z.string().optional(),
  emoji: z.string().optional(),
  color: z.string().optional()
});

const uploadSchema = z.object({
  fileName: z.string().min(1),
  data: z.string().min(1)  // base64 encoded image data
});

/**
 * POST /api/v1/merchant/activities
 * 创建活动 [需要商家或管理员角色]
 * admin 需要在请求体中提供 merchant_id
 */
router.post('/activities', authenticate, authorize('merchant', 'admin'), validate(activitySchema), async (req, res, next) => {
  try {
    const merchantId = req.user.merchantId || req.body.merchant_id;
    if (!merchantId) {
      return res.status(422).json({ success: false, message: '请指定所属商家' });
    }
    const activity = await merchantService.createActivity(merchantId, req.validated);
    res.json({ success: true, data: activity });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/v1/merchant/activities/:id
 * 更新活动
 */
router.put('/activities/:id', authenticate, authorize('merchant', 'admin'), async (req, res, next) => {
  try {
    const result = await merchantService.updateActivity(
      req.user.merchantId,
      req.params.id,
      req.body
    );
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/merchant/dashboard
 * 商家仪表盘统计
 */
router.get('/dashboard', authenticate, authorize('merchant', 'admin'), async (req, res, next) => {
  try {
    const data = await merchantService.getDashboard(req.user.merchantId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/merchant/activities
 * 商家活动列表
 */
router.get('/activities', authenticate, authorize('merchant', 'admin'), async (req, res, next) => {
  try {
    const { page = 1, page_size = 10, status, keyword } = req.query;
    const data = await merchantService.getActivities(
      req.user.merchantId,
      { page: parseInt(page), pageSize: parseInt(page_size), status, keyword }
    );
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/merchant/activities/:id
 * 单个活动详情
 */
router.get('/activities/:id', authenticate, authorize('merchant', 'admin'), async (req, res, next) => {
  try {
    const activity = await merchantService.getActivity(req.user.merchantId, req.params.id);
    res.json({ success: true, data: activity });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/v1/merchant/activities/:id/status
 * 更新活动状态
 */
router.put('/activities/:id/status', authenticate, authorize('merchant', 'admin'), async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['active', 'paused', 'ended'].includes(status)) {
      return res.status(422).json({ success: false, message: '无效的状态值' });
    }
    const result = await merchantService.updateActivityStatus(
      req.user.merchantId, req.params.id, status
    );
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/v1/merchant/activities/:id
 * 删除活动
 */
router.delete('/activities/:id', authenticate, authorize('merchant', 'admin'), async (req, res, next) => {
  try {
    await merchantService.deleteActivity(req.user.merchantId, req.params.id);
    res.json({ success: true, message: '活动已删除' });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/merchant/profile
 * 商家信息
 */
router.get('/profile', authenticate, authorize('merchant', 'admin'), async (req, res, next) => {
  try {
    const profile = await merchantService.getProfile(req.user.merchantId);
    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/merchant/upload
 * 上传图片（base64 → 文件）
 */
router.post('/upload', authenticate, authorize('merchant', 'admin'), validate(uploadSchema), async (req, res, next) => {
  try {
    const url = await merchantService.uploadImage(req.validated.fileName, req.validated.data);
    res.json({ success: true, data: { url } });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/merchant/activities/:id/participants
 * 活动参与者列表
 */
router.get('/activities/:id/participants', authenticate, authorize('merchant', 'admin'), async (req, res, next) => {
  try {
    const participants = await merchantService.getActivityParticipants(
      req.user.merchantId, req.params.id
    );
    res.json({ success: true, data: participants });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
