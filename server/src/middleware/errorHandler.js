const { AppError } = require('../utils/errors');
const { fail } = require('../utils/response');

/**
 * 全局错误处理中间件
 */
function errorHandler(err, req, res, _next) {
  console.error('[Error]', err.message || err);
  console.error('[Stack]', err.stack);

  // 自定义业务错误
  if (err.isOperational) {
    return fail(res, err.message, err.statusCode, err.code);
  }

  // Sequelize 数据库错误
  if (err.name === 'SequelizeUniqueConstraintError') {
    return fail(res, '数据已存在，请勿重复操作', 409, -2);
  }
  if (err.name === 'SequelizeValidationError') {
    return fail(res, '数据格式错误: ' + err.message, 400, -1);
  }
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return fail(res, '关联数据不存在', 404, -1);
  }

  // 未知错误
  return res.status(500).json({
    code: -1,
    message: '服务器内部错误',
    data: null
  });
}

module.exports = errorHandler;
