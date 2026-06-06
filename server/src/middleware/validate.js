/**
 * 请求验证中间件 (基于Zod)
 */
const { ValidationError } = require('../utils/errors');

function validate(schema) {
  return (req, res, next) => {
    try {
      req.validated = schema.parse(req.body);
      next();
    } catch (err) {
      if (err.name === 'ZodError') {
        const message = err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
        throw new ValidationError(message);
      }
      throw err;
    }
  };
}

module.exports = { validate };
