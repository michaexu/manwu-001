/**
 * 自定义错误类
 */
class AppError extends Error {
  constructor(message, code, statusCode) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class NotFoundError extends AppError {
  constructor(message = '资源不存在') {
    super(message, 'NOT_FOUND', 404);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = '未授权访问') {
    super(message, 'UNAUTHORIZED', 401);
  }
}

class ForbiddenError extends AppError {
  constructor(message = '无权限') {
    super(message, 'FORBIDDEN', 403);
  }
}

class ValidationError extends AppError {
  constructor(message = '参数验证失败') {
    super(message, 'VALIDATION_ERROR', 422);
  }
}

class ConflictError extends AppError {
  constructor(message = '资源冲突') {
    super(message, 'CONFLICT', 409);
  }
}

module.exports = {
  AppError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
  ConflictError
};
