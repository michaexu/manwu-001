/**
 * 认证服务 - 微信登录 + 手机号注册 + Token管理
 */
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const axios = require('axios');
const config = require('../config');
const db = require('../models/db');
const { UnauthorizedError, ConflictError } = require('../utils/errors');

// 开发环境短信验证码存储（生产环境应使用Redis）
const smsCodeStore = new Map();

const authService = {
  /**
   * 手机号注册/登录
   * 流程：wx.login → 获取openid → 手机号验证 → 创建/查找用户 → 生成Token
   */
  async phoneLogin(wxCode, phoneCode) {
    // Step 1: 通过微信code获取openid和session_key
    const wxSession = await this.getWxSession(wxCode);
    const { openid, unionid } = wxSession;

    // Step 2: 通过phoneCode获取手机号（需要微信服务端API）
    const phone = await this.getPhoneNumber(phoneCode);

    // Step 3: 查找或创建用户
    let user = await this.findUserByOpenid(openid);
    if (user) {
      // 更新手机号
      await db.query(
        'UPDATE users SET phone = $1, updated_at = NOW() WHERE id = $2',
        [phone, user.id]
      );
    } else {
      // 创建新用户（默认赠送100积分）
      const insertResult = await db.query(
        `INSERT INTO users (wechat_openid, wechat_unionid, phone, nick_name, points, role)
         VALUES (?, ?, ?, ?, 100, 'user')`,
        [openid, unionid || null, phone, `用户${phone.slice(-4)}`]
      );
      const newId = insertResult.insertId;
      const userResult = await db.query(
        'SELECT u.*, m.id as merchant_id, m.name as merchant_name FROM users u LEFT JOIN merchants m ON m.user_id = u.id WHERE u.id = ?',
        [newId]
      );
      user = userResult.rows[0];
    }

    // Step 4: 生成Token
    const tokens = await this.generateTokens(user);

    return {
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      user: this.sanitizeUser(user)
    };
  },

  /**
   * 微信一键登录（仅需wx.login code，无需手机号）
   * 适用场景：快速体验、非强制手机号注册
   */
  async wechatLogin(wxCode, extraInfo = {}) {
    // Step 1: 获取openid
    const wxSession = await this.getWxSession(wxCode);
    const { openid, unionid } = wxSession;

    // Step 2: 查找或创建用户（无手机号）
    let user = await this.findUserByOpenid(openid);
    let isNewUser = false;

    if (!user) {
      // 创建新用户（无手机号，默认赠送50积分）
      const nickName = extraInfo.nickName || `用户${Date.now().toString(36).slice(-4)}`;
      const insertResult = await db.query(
        `INSERT INTO users (wechat_openid, wechat_unionid, nick_name, avatar_url, points, role)
         VALUES (?, ?, ?, ?, 50, 'user')`,
        [openid, unionid || null, nickName, extraInfo.avatarUrl || null]
      );
      const newId = insertResult.insertId;
      const userResult = await db.query(
        'SELECT u.*, m.id as merchant_id, m.name as merchant_name FROM users u LEFT JOIN merchants m ON m.user_id = u.id WHERE u.id = ?',
        [newId]
      );
      user = userResult.rows[0];
      isNewUser = true;
    }

    // Step 3: 生成Token
    const tokens = await this.generateTokens(user);

    return {
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      user: this.sanitizeUser(user),
      isNewUser
    };
  },

  /**
   * 发送短信验证码
   * 开发环境：固定验证码 123456
   * 生产环境：对接腾讯云短信/阿里云短信
   */
  async sendSmsCode(phone) {
    // 生成6位验证码
    const code = config.env === 'production'
      ? String(Math.floor(100000 + Math.random() * 900000))
      : '123456';

    // 存储验证码（5分钟有效）
    smsCodeStore.set(phone, {
      code,
      expiresAt: Date.now() + 5 * 60 * 1000
    });

    if (config.env !== 'production') {
      console.log(`[DEV] 短信验证码 ${phone}: ${code}`);
    }

    return {
      phone: phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'),
      expiresIn: 300
    };
  },

  /**
   * 短信验证码登录
   */
  async smsLogin(phone, code) {
    // 验证验证码
    const stored = smsCodeStore.get(phone);
    if (!stored) {
      throw new UnauthorizedError('请先发送验证码');
    }
    if (Date.now() > stored.expiresAt) {
      smsCodeStore.delete(phone);
      throw new UnauthorizedError('验证码已过期，请重新发送');
    }
    if (stored.code !== code && config.env !== 'development') {
      throw new UnauthorizedError('验证码错误');
    }

    // 开发环境允许 123456 通过
    if (config.env === 'development' && code === '123456') {
      // pass
    } else if (stored.code !== code) {
      throw new UnauthorizedError('验证码错误');
    }

    smsCodeStore.delete(phone);

    // 查找或创建用户（无微信openid）
    let user = await this.findUserByPhone(phone);
    let isNewUser = false;

    if (!user) {
      const insertResult = await db.query(
        `INSERT INTO users (phone, nick_name, points, role)
         VALUES (?, ?, 50, 'user')`,
        [phone, `用户${phone.slice(-4)}`]
      );
      const newId = insertResult.insertId;
      const userResult = await db.query(
        'SELECT * FROM users WHERE id = ?',
        [newId]
      );
      user = userResult.rows[0];
      isNewUser = true;
    }

    const tokens = await this.generateTokens(user);

    return {
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      user: this.sanitizeUser(user),
      isNewUser
    };
  },

  /**
   * 刷新Token
   */
  async refreshToken(refreshToken) {
    const result = await db.query(
      'SELECT * FROM refresh_tokens WHERE token = $1 AND revoked = false AND expires_at > NOW()',
      [refreshToken]
    );

    if (result.rows.length === 0) {
      throw new UnauthorizedError('refresh_token无效或已过期');
    }

    const tokenRecord = result.rows[0];

    // 撤销旧token
    await db.query('UPDATE refresh_tokens SET revoked = true WHERE id = $1', [tokenRecord.id]);

    // 获取用户
    const userResult = await db.query('SELECT * FROM users WHERE id = $1', [tokenRecord.user_id]);
    if (userResult.rows.length === 0) {
      throw new UnauthorizedError('用户不存在');
    }

    const user = userResult.rows[0];
    const tokens = await this.generateTokens(user);

    return {
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      user: this.sanitizeUser(user)
    };
  },

  /**
   * 获取用户信息
   */
  async getProfile(userId) {
    const result = await db.query(
      `SELECT u.*, m.id as merchant_id, m.name as merchant_name
       FROM users u
       LEFT JOIN merchants m ON m.user_id = u.id
       WHERE u.id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new UnauthorizedError('用户不存在');
    }

    const user = result.rows[0];
    return this.sanitizeUser(user);
  },

  /**
   * 通过微信code获取session
   */
  async getWxSession(code) {
    try {
      const response = await axios.get('https://api.weixin.qq.com/sns/jscode2session', {
        params: {
          appid: config.wechat.appId,
          secret: config.wechat.secret,
          js_code: code,
          grant_type: 'authorization_code'
        }
      });

      if (response.data.errcode) {
        throw new Error(`微信登录失败: ${response.data.errmsg}`);
      }

      return response.data;
    } catch (err) {
      // 开发环境Mock
      if (config.env === 'development') {
        return {
          openid: `dev_openid_${code.slice(0, 8)}`,
          unionid: `dev_unionid_${code.slice(0, 8)}`,
          session_key: 'dev_session_key'
        };
      }
      throw new UnauthorizedError('微信登录失败，请重试');
    }
  },

  /**
   * 通过phoneCode获取手机号
   * 实际需要调用微信 getPhoneNumber 接口
   */
  async getPhoneNumber(phoneCode) {
    try {
      // 获取access_token
      const tokenRes = await axios.get('https://api.weixin.qq.com/cgi-bin/token', {
        params: {
          grant_type: 'client_credential',
          appid: config.wechat.appId,
          secret: config.wechat.secret
        }
      });

      const accessToken = tokenRes.data.access_token;

      // 获取手机号
      const phoneRes = await axios.post(
        `https://api.weixin.qq.com/wxa/business/getuserphonenumber?access_token=${accessToken}`,
        { code: phoneCode }
      );

      if (phoneRes.data.errcode !== 0) {
        throw new Error(`获取手机号失败: ${phoneRes.data.errmsg}`);
      }

      return phoneRes.data.phone_info.phoneNumber;
    } catch (err) {
      console.error('获取手机号失败:', err.message);
      // 开发环境fallback
      if (config.env === 'development') {
        return '13800138000';
      }
      throw new UnauthorizedError('获取手机号失败，请重试');
    }
  },

  /**
   * 通过openid查找用户（含商家信息）
   */
  async findUserByOpenid(openid) {
    const result = await db.query(
      `SELECT u.*, m.id as merchant_id, m.name as merchant_name
       FROM users u
       LEFT JOIN merchants m ON m.user_id = u.id
       WHERE u.wechat_openid = $1`,
      [openid]
    );
    return result.rows[0] || null;
  },

  /**
   * 通过手机号查找用户
   */
  async findUserByPhone(phone) {
    const result = await db.query(
      `SELECT u.*, m.id as merchant_id, m.name as merchant_name
       FROM users u
       LEFT JOIN merchants m ON m.user_id = u.id
       WHERE u.phone = $1`,
      [phone]
    );
    return result.rows[0] || null;
  },

  /**
   * 生成访问令牌和刷新令牌
   */
  async generateTokens(user) {
    const payload = {
      userId: user.id,
      role: user.role,
      merchantId: user.merchant_id || null
    };

    const accessToken = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn
    });

    const refreshToken = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await db.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, refreshToken, expiresAt]
    );

    return { accessToken, refreshToken };
  },

  /**
   * 管理员登录（手机号 + 密码，开发环境不验证密码）
   */
  async adminLogin(phone, password) {
    const user = await this.findUserByPhone(phone);
    if (!user) {
      throw new UnauthorizedError('账号不存在');
    }
    if (user.role !== 'admin') {
      throw new UnauthorizedError('无管理员权限');
    }
    // TODO: 生产环境应验证 password_hash
    const tokens = await this.generateTokens(user);
    return {
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      user: this.sanitizeUser(user)
    };
  },

  /**
   * 清理敏感用户数据
   */
  sanitizeUser(user) {
    return {
      id: user.id,
      nickName: user.nick_name,
      phone: user.phone ? user.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : null,
      avatarUrl: user.avatar_url,
      role: user.role,
      vipLevel: user.vip_level,
      points: user.points,
      // VIP 月度配额信息
      vip: user.vip_level > 0 ? {
        level: user.vip_level,
        monthlyQuota: user.vip_monthly_quota || 0,
        monthlyUsed: user.vip_monthly_used || 0,
        monthlyRemaining: (user.vip_monthly_quota || 0) - (user.vip_monthly_used || 0)
      } : null,
      merchant: user.merchant_id ? {
        id: user.merchant_id,
        name: user.merchant_name
      } : null,
      createdAt: user.created_at
    };
  }
};

module.exports = authService;
