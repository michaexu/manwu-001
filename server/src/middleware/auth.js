const jwt = require('jsonwebtoken');
const config = require('../config');
const { Member } = require('../models');
const { UnauthorizedError } = require('../utils/errors');

/**
 * JWT 认证中间件
 * 验证用户端（客户版/商家版）登录 Token
 */
async function auth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('请先登录');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.secret);

    const member = await Member.findByPk(decoded.memberId);
    if (!member) {
      throw new UnauthorizedError('用户不存在');
    }

    req.member = member;
    req.memberId = member.id;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('登录已过期，请重新登录'));
    }
    next(err);
  }
}

/**
 * 商家操作员认证中间件
 * 验证商家版操作员身份
 */
async function merchantAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('请先登录商家版');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.secret);

    if (!decoded.isMerchant) {
      throw new UnauthorizedError('无商家操作员权限');
    }

    req.operatorId = decoded.operatorId;
    req.operatorPhone = decoded.phone;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('登录已过期，请重新登录'));
    }
    next(err);
  }
}

/**
 * 管理员认证中间件
 * 验证管理员身份
 */
async function adminAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('请先登录');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.secret);

    if (!decoded.isAdmin) {
      throw new UnauthorizedError('无管理员权限');
    }

    req.adminId = decoded.adminId;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('登录已过期，请重新登录'));
    }
    next(err);
  }
}

module.exports = { auth, merchantAuth, adminAuth };
