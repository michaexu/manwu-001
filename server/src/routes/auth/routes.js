/**
 * 认证路由 - 微信登录 + 手机号注册 + Token刷新
 */
const express = require('express');
const router = express.Router();
const { z } = require('zod');
const { authenticate } = require('../../middleware/auth');
const { validate } = require('../../middleware/validate');
const authService = require('../../services/authService');

// 手机号登录Schema（微信code + 手机号code）
const phoneLoginSchema = z.object({
  code: z.string().min(1, '微信code不能为空'),
  phone_code: z.string().min(1, '手机号code不能为空')
});

// 微信一键登录Schema
const wechatLoginSchema = z.object({
  code: z.string().min(1, '微信code不能为空'),
  nick_name: z.string().optional(),
  avatar_url: z.string().optional()
});

// 短信验证码登录Schema
const smsLoginSchema = z.object({
  phone: z.string().regex(/^1[3-9]\d{9}$/, '手机号格式不正确'),
  code: z.string().length(6, '验证码为6位数字')
});

// 发送短信Schema
const sendSmsSchema = z.object({
  phone: z.string().regex(/^1[3-9]\d{9}$/, '手机号格式不正确')
});

// Token刷新Schema
const refreshSchema = z.object({
  refresh_token: z.string().min(1, 'refresh_token不能为空')
});

// 管理员登录Schema
const adminLoginSchema = z.object({
  phone: z.string().regex(/^1[3-9]\d{9}$/, '手机号格式不正确'),
  password: z.string().optional()
});

// 手机号密码登录Schema
const passwordLoginSchema = z.object({
  phone: z.string().regex(/^1[3-9]\d{9}$/, '手机号格式不正确'),
  password: z.string().min(1, '密码不能为空')
});

/**
 * POST /api/v1/auth/password-login
 * 手机号 + 密码登录（新用户自动注册）
 */
/**
 * POST /api/v1/auth/phone-login
 * 手机号注册/登录（微信code + 手机号code）
 */
router.post('/phone-login', validate(phoneLoginSchema), async (req, res, next) => {
  try {
    const { code, phone_code } = req.validated;
    const result = await authService.phoneLogin(code, phone_code);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/auth/password-login
 * 手机号 + 密码登录（新用户自动注册）
 */
router.post('/password-login', validate(passwordLoginSchema), async (req, res, next) => {
  try {
    const { phone, password } = req.validated;
    const result = await authService.passwordLogin(phone, password);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/auth/wechat-login
 * 微信一键登录（仅需wx.login code，无需手机号）
 */
router.post('/wechat-login', validate(wechatLoginSchema), async (req, res, next) => {
  try {
    const { code, nick_name, avatar_url } = req.validated;
    const result = await authService.wechatLogin(code, { nickName: nick_name, avatarUrl: avatar_url });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/auth/send-sms
 * 发送短信验证码（开发环境模拟）
 */
router.post('/send-sms', validate(sendSmsSchema), async (req, res, next) => {
  try {
    const { phone } = req.validated;
    const result = await authService.sendSmsCode(phone);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/auth/sms-login
 * 短信验证码登录
 */
router.post('/sms-login', validate(smsLoginSchema), async (req, res, next) => {
  try {
    const { phone, code } = req.validated;
    const result = await authService.smsLogin(phone, code);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/auth/refresh
 * 刷新Token
 */
router.post('/refresh', validate(refreshSchema), async (req, res, next) => {
  try {
    const { refresh_token } = req.validated;
    const result = await authService.refreshToken(refresh_token);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/auth/profile
 * 获取用户信息
 */
router.get('/profile', authenticate, async (req, res, next) => {
  try {
    const user = await authService.getProfile(req.user.id);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/auth/admin-login
 * 管理员登录（手机号 + 密码）
 */
router.post('/admin-login', validate(adminLoginSchema), async (req, res, next) => {
  try {
    const { phone, password } = req.validated;
    const result = await authService.adminLogin(phone, password || '');
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
