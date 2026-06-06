require('dotenv').config();
const path = require('path');

/**
 * 配置中心
 * 支持 MySQL / PostgreSQ L / SQLite
 */
const env = process.env.NODE_ENV || 'development';

const config = {
  env,

  // ========== 服务器 ==========
  server: {
    port: parseInt(process.env.PORT) || 3001,
    host: '0.0.0.0',
  },

  // ========== 数据库 ==========
  database: {
    // MySQL（阿里云 RDS）
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'five_db',

    // 兼容旧 PG 配置（如果 .env 仍使用 DATABASE_URL）
    url: process.env.DATABASE_URL || null,
  },

  // ========== JWT ==========
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-prod',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  // ========== 微信小程序 ==========
  wechat: {
    appid: process.env.WECHAT_APPID || '',
    secret: process.env.WECHAT_SECRET || '',
  },

  // ========== 微信支付（可选）==========
  wechatPay: {
    mchid: process.env.WECHAT_MCHID || '',
    apiKey: process.env.WECHAT_API_KEY || '',
    certPath: process.env.WECHAT_CERT_PATH || '',
  },

  // ========== 短信服务 ==========
  sms: {
    provider: process.env.SMS_PROVIDER || 'tencent',  // tencent | aliyun
    secretId: process.env.SMS_SECRET_ID || '',
    secretKey: process.env.SMS_SECRET_KEY || '',
    signName: process.env.SMS_SIGN_NAME || '',
    templateCode: process.env.SMS_TEMPLATE_CODE || '',
    endpoint: process.env.SMS_ENDPOINT || '',
  },

  // ========== 广告奖励 ==========
  adReward: {
    enabled: process.env.ENABLE_AD_REWARD === 'true',
    points: parseInt(process.env.AD_REWARD_POINTS) || 20,
    dailyLimit: parseInt(process.env.AD_DAILY_LIMIT) || 5,
  },

  // ========== 管理 ==========
  admin: {
    // 初始管理员手机号（首次运行时自动创建）
    initialPhone: process.env.ADMIN_INITIAL_PHONE || '',
    initialPassword: process.env.ADMIN_INITIAL_PASSWORD || 'admin123456',
  },

  // ========== CORS ==========
  cors: {
    origins: (process.env.CORS_ORIGINS || '*').split(',').map(s => s.trim()),
  },

  // ========== 日志 ==========
  logging: {
    level: env === 'production' ? 'info' : 'debug',
    slowQueryThreshold: 100,  // ms
  },
};

module.exports = config;
