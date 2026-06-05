const express = require('express');
const router = express.Router();
const MemberService = require('../services/member');
const { merchantAuth, adminAuth } = require('../middleware/auth');
const { success, fail, paginated } = require('../utils/response');

/**
 * 获取会员列表
 * GET /api/members
 */
router.get('/', merchantAuth, async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20, keyword, memberType } = req.query;
    const result = await MemberService.getList({
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      keyword,
      memberType
    });
    paginated(res, result);
  } catch (err) {
    next(err);
  }
});

/**
 * 获取会员详情
 * GET /api/members/:id
 */
router.get('/:id', merchantAuth, async (req, res, next) => {
  try {
    const member = await MemberService.getDetail(req.params.id);
    success(res, member);
  } catch (err) {
    next(err);
  }
});

/**
 * 开通 VIP（管理员操作）
 * POST /api/members/:id/vip/grant
 */
router.post('/:id/vip/grant', adminAuth, async (req, res, next) => {
  try {
    const result = await MemberService.grantVip(req.params.id, req.adminId);
    success(res, result, 'VIP 开通成功');
  } catch (err) {
    next(err);
  }
});

/**
 * 撤销 VIP（管理员操作）
 * POST /api/members/:id/vip/revoke
 */
router.post('/:id/vip/revoke', adminAuth, async (req, res, next) => {
  try {
    const result = await MemberService.revokeVip(req.params.id, req.adminId);
    success(res, result, 'VIP 已撤销');
  } catch (err) {
    next(err);
  }
});

/**
 * 获取 VIP 操作日志
 * GET /api/members/vip-logs
 */
router.get('/vip-logs/:memberId?', adminAuth, async (req, res, next) => {
  try {
    const logs = await MemberService.getVipLogs(req.params.memberId);
    success(res, logs);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
