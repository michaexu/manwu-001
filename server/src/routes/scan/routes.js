/**
 * 扫码核销路由
 */
const express = require('express');
const router = express.Router();
const { z } = require('zod');
const { authenticate, authorize } = require('../../middleware/auth');
const { validate } = require('../../middleware/validate');
const scanService = require('../../services/scanService');

const confirmSchema = z.object({
  code: z.string().min(1, '兑换码不能为空')
});

/**
 * POST /api/v1/scan/confirm
 * 商家扫码确认核销 [需要商家角色]
 */
router.post('/confirm', authenticate, authorize('merchant', 'admin'), validate(confirmSchema), async (req, res, next) => {
  try {
    const { code } = req.validated;
    const result = await scanService.confirmRedemption(req.user.merchantId, req.user.id, code);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/scan/redemption/:code
 * 获取兑换码详情（商家视角）
 */
router.get('/redemption/:code', authenticate, authorize('merchant', 'admin'), async (req, res, next) => {
  try {
    const detail = await scanService.getRedemptionDetail(req.params.code);
    res.json({ success: true, data: detail });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/scan/history
 * 商家核销记录
 */
router.get('/history', authenticate, authorize('merchant', 'admin'), async (req, res, next) => {
  try {
    const { page = 1, page_size = 20 } = req.query;
    const data = await scanService.getScanHistory(
      req.user.merchantId,
      parseInt(page),
      parseInt(page_size)
    );
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
