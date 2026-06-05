/**
 * 统一响应格式
 */

/** 成功响应 */
function success(res, data = null, message = '操作成功', statusCode = 200) {
  return res.status(statusCode).json({
    code: 0,
    message,
    data
  });
}

/** 失败响应 */
function fail(res, message = '操作失败', statusCode = 400, code = -1) {
  return res.status(statusCode).json({
    code,
    message,
    data: null
  });
}

/** 分页响应 */
function paginated(res, { list, total, page, pageSize }) {
  return res.status(200).json({
    code: 0,
    message: '获取成功',
    data: {
      list,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    }
  });
}

module.exports = { success, fail, paginated };
