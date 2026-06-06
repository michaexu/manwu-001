/**
 * 全局错误处理中间件
 */
const { AppError } = require('../utils/errors');

function errorHandler(err, req, res, next) {
  // 记录错误日志
  console.error(`[${req.id}] Error:`, {
    message: err.message,
    code: err.code,
    statusCode: err.statusCode,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  // 已知的业务错误
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      code: err.code,
      message: err.message,
      request_id: req.id
    });
  }

  // JWT相关错误
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      code: 'INVALID_TOKEN',
      message: '无效的认证令牌',
      request_id: req.id
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      code: 'TOKEN_EXPIRED',
      message: '认证令牌已过期',
      request_id: req.id
    });
  }

  // Zod验证错误
  if (err.name === 'ZodError') {
    return res.status(422).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: '请求参数验证失败',
      errors: err.errors,
      request_id: req.id
    });
  }

  // 未知错误
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    code: 'INTERNAL_ERROR',
    message: process.env.NODE_ENV === 'production'
      ? '服务器内部错误'
      : err.message,
    request_id: req.id
  });
}

module.exports = { errorHandler };
