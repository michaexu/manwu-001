/**
 * 管理员路由
 * VIP分配/回收、用户管理、全局统计看板
 */
const express = require('express');
const router = express.Router();
const { z } = require('zod');
const { authenticate, authorize } = require('../../middleware/auth');
const { validate } = require('../../middleware/validate');
const adminService = require('../../services/adminService');

// 所有路由都需要管理员权限
router.use(authenticate, authorize('admin'));

// ==================== VIP 管理 ====================

const assignVipSchema = z.object({
  userId: z.string().uuid('用户ID格式不正确'),
  vipLevel: z.number().int().min(1, 'VIP等级至少为1').max(10, 'VIP等级最多为10'),
  monthlyQuota: z.number().int().min(0, '月度配额不能为负'),
  reason: z.string().max(200).optional()
});

/**
 * POST /api/v1/admin/vip/assign
 * 分配VIP
 */
router.post('/vip/assign', validate(assignVipSchema), async (req, res, next) => {
  try {
    const { userId, vipLevel, monthlyQuota, reason } = req.validated;
    const result = await adminService.assignVip(req.user.id, userId, {
      vipLevel,
      monthlyQuota,
      reason
    });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

const revokeVipSchema = z.object({
  userId: z.string().uuid('用户ID格式不正确'),
  reason: z.string().max(200).optional()
});

/**
 * POST /api/v1/admin/vip/revoke
 * 回收VIP
 */
router.post('/vip/revoke', validate(revokeVipSchema), async (req, res, next) => {
  try {
    const { userId, reason } = req.validated;
    const result = await adminService.revokeVip(req.user.id, userId, reason);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

const adjustPointsSchema = z.object({
  userId: z.string().uuid('用户ID格式不正确'),
  points: z.number().int().refine(v => v !== 0, '积分变化不能为0'),
  reason: z.string().max(200).optional()
});

/**
 * POST /api/v1/admin/points/adjust
 * 调整用户积分
 */
router.post('/points/adjust', validate(adjustPointsSchema), async (req, res, next) => {
  try {
    const { userId, points, reason } = req.validated;
    const result = await adminService.adjustPoints(req.user.id, userId, { points, reason });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// ==================== 商家管理 ====================

/**
 * GET /api/v1/admin/merchants
 * 商家列表
 */
router.get('/merchants', async (req, res, next) => {
  try {
    const { page = 1, page_size = 20, keyword, status, simple } = req.query;
    if (simple === '1') {
      const list = await adminService.getMerchantList();
      return res.json({ success: true, data: list });
    }
    const result = await adminService.getMerchants({
      page: parseInt(page),
      pageSize: parseInt(page_size),
      keyword,
      status
    });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/admin/merchants/:id
 * 商家详情
 */
router.get('/merchants/:id', async (req, res, next) => {
  try {
    const result = await adminService.getMerchantDetail(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

const createMerchantSchema = z.object({
  name: z.string().min(1, '商家名称不能为空').max(200),
  phone: z.string().min(1, '手机号不能为空'),
  address: z.string().optional(),
  description: z.string().optional(),
  password: z.string().optional()
});

/**
 * POST /api/v1/admin/merchants
 * 创建商家
 */
router.post('/merchants', validate(createMerchantSchema), async (req, res, next) => {
  try {
    const result = await adminService.createMerchant(req.validated);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/v1/admin/merchants/:id
 * 更新商家
 */
router.put('/merchants/:id', async (req, res, next) => {
  try {
    const result = await adminService.updateMerchant(req.params.id, req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/v1/admin/merchants/:id
 * 删除商家
 */
router.delete('/merchants/:id', async (req, res, next) => {
  try {
    await adminService.deleteMerchant(req.params.id);
    res.json({ success: true, message: '商家已删除' });
  } catch (err) {
    next(err);
  }
});

// ==================== 用户管理 ====================

/**
 * GET /api/v1/admin/users
 * 用户列表
 */
router.get('/users', async (req, res, next) => {
  try {
    const { page = 1, page_size = 20, keyword, role, vip_level, sort } = req.query;
    const result = await adminService.getUserList(req.user.id, {
      page: parseInt(page),
      pageSize: parseInt(page_size),
      keyword,
      role,
      vipLevel: vip_level ? parseInt(vip_level) : undefined,
      sort
    });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/admin/users/:id
 * 用户详情
 */
router.get('/users/:id', async (req, res, next) => {
  try {
    const result = await adminService.getUserDetail(req.user.id, req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/v1/admin/users/:id/reset-password
 * 管理员重置用户密码
 */
const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, '密码至少6位').max(50, '密码不能超过50位')
});

router.put('/users/:id/reset-password', validate(resetPasswordSchema), async (req, res, next) => {
  try {
    await adminService.resetUserPassword(req.user.id, req.params.id, req.body.newPassword);
    res.json({ success: true, message: '密码已重置' });
  } catch (err) {
    next(err);
  }
});

// ==================== 全局统计 ====================

/**
 * GET /api/v1/admin/dashboard
 * 全局数据看板
 */
router.get('/dashboard', async (req, res, next) => {
  try {
    const result = await adminService.getDashboard(req.user.id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/admin/logs
 * 管理员操作日志
 */
router.get('/logs', async (req, res, next) => {
  try {
    const { page = 1, page_size = 20 } = req.query;
    const result = await adminService.getAdminLogs(req.user.id, {
      page: parseInt(page),
      pageSize: parseInt(page_size)
    });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/admin/redemptions
 * 全量核销记录
 */
router.get('/redemptions', async (req, res, next) => {
  try {
    const { page = 1, page_size = 20, keyword, status, date_start, date_end } = req.query;
    const result = await adminService.getRedemptions(req.user.id, {
      page: parseInt(page),
      pageSize: parseInt(page_size),
      keyword,
      status,
      dateStart: date_start,
      dateEnd: date_end
    });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/admin/points/history
 * 全量积分流水
 */
router.get('/points/history', async (req, res, next) => {
  try {
    const { page = 1, page_size = 20, type, keyword } = req.query;
    const result = await adminService.getPointsHistory(req.user.id, {
      page: parseInt(page),
      pageSize: parseInt(page_size),
      type,
      keyword
    });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
