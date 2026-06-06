/**
 * 认证中间件
 */
const jwt = require('jsonwebtoken');
const config = require('../config');
const { UnauthorizedError, ForbiddenError } = require('../utils/errors');

/**
 * JWT认证中间件 - 必须登录
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('请先登录');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = {
      id: decoded.userId,
      role: decoded.role,
      merchantId: decoded.merchantId
    };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new UnauthorizedError('登录已过期，请重新登录');
    }
    throw new UnauthorizedError('无效的认证令牌');
  }
}

/**
 * 可选认证 - 不强制登录
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = {
      id: decoded.userId,
      role: decoded.role,
      merchantId: decoded.merchantId
    };
  } catch (err) {
    // 忽略token错误
  }
  next();
}

/**
 * 角色授权中间件
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      throw new UnauthorizedError('请先登录');
    }
    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError('无权限执行此操作');
    }
    next();
  };
}

module.exports = { authenticate, optionalAuth, authorize };
