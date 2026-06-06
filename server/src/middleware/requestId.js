/**
 * 请求ID中间件 - 为每个请求分配唯一ID用于日志追踪
 */
const { v4: uuidv4 } = require('uuid');

function requestIdMiddleware(req, res, next) {
  req.id = req.headers['x-request-id'] || uuidv4();
  res.setHeader('X-Request-Id', req.id);
  next();
}

module.exports = { requestIdMiddleware };
