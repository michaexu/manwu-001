/**
 * 自定义错误类
 */

class AppError extends Error {
  constructor(message, statusCode = 400, code = -1) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class NotFoundError extends AppError {
  constructor(message = '资源不存在') {
    super(message, 404, -1);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = '未授权') {
    super(message, 401, -1);
  }
}

class ForbiddenError extends AppError {
  constructor(message = '无权限') {
    super(message, 403, -1);
  }
}

class ConflictError extends AppError {
  constructor(message = '资源冲突') {
    super(message, 409, -2);
  }
}

module.exports = { AppError, NotFoundError, UnauthorizedError, ForbiddenError, ConflictError };
