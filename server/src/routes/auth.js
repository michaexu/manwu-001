const express = require('express');
const router = express.Router();
const AuthService = require('../services/auth');
const { success, fail } = require('../utils/response');

/**
 * 客户版微信登录
 * POST /api/auth/customer/login
 */
router.post('/customer/login', async (req, res, next) => {
  try {
    const { code, userInfo } = req.body;
    if (!code) return fail(res, '缺少登录凭证 code');

    const result = await AuthService.customerLogin(code, userInfo);
    success(res, {
      token: result.token,
      member: {
        id: result.member.id,
        nickname: result.member.nickname,
        avatarUrl: result.member.avatarUrl,
        memberType: result.member.memberType,
        pointsBalance: result.member.pointsBalance
      }
    }, '登录成功');
  } catch (err) {
    next(err);
  }
});

/**
 * 商家版微信登录（需手机号白名单校验）
 * POST /api/auth/merchant/login
 */
router.post('/merchant/login', async (req, res, next) => {
  try {
    const { code, encryptedData, iv } = req.body;
    if (!code || !encryptedData || !iv) {
      return fail(res, '缺少登录参数');
    }

    const result = await AuthService.merchantLoginWithPhone(code, encryptedData, iv);
    success(res, {
      token: result.token,
      operator: {
        id: result.operator.id,
        phone: result.operator.phone,
        nickname: result.operator.nickname
      }
    }, '登录成功');
  } catch (err) {
    next(err);
  }
});

/**
 * 管理员登录
 * POST /api/auth/admin/login
 */
router.post('/admin/login', async (req, res, next) => {
  try {
    const { phone } = req.body;
    if (!phone) return fail(res, '请输入手机号');

    const result = await AuthService.adminLogin(phone);
    success(res, { token: result.token }, '管理员登录成功');
  } catch (err) {
    next(err);
  }
});

/**
 * 客户版手机号注册（手动输入）
 * POST /api/auth/customer/register
 */
router.post('/customer/register', async (req, res, next) => {
  try {
    const { phone, nickname } = req.body;
    if (!phone) return fail(res, '请输入手机号');

    const result = await AuthService.customerRegisterByPhone(phone, nickname);
    success(res, {
      token: result.token,
      member: {
        id: result.member.id,
        nickname: result.member.nickname,
        avatarUrl: result.member.avatarUrl,
        memberType: result.member.memberType,
        pointsBalance: result.member.pointsBalance
      },
      isNew: result.isNew
    }, result.isNew ? '注册成功' : '登录成功');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
