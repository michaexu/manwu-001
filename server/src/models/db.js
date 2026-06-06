/**
 * 数据库连接与查询封装
 * MySQL 版本（使用 mysql2）
 */
const mysql = require('mysql2/promise');
const config = require('../config');

const pool = mysql.createPool({
  host: config.database.host,
  port: config.database.port,
  user: config.database.user,
  password: config.database.password,
  database: config.database.name,
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  connectTimeout: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
});

/**
 * 将 PostgreSQL $N 占位符替换为 MySQL 的 ?
 * 正确处理同一参数被多次引用的情况（如 $1 出现 2 次 → 2 个 ? + 参数值重复）
 * @returns {{ sql: string, params: Array }}
 */
function convertPlaceholders(text, params) {
  if (!params || params.length === 0) return { sql: text, params: params || [] };

  const newParams = [];
  const sql = text.replace(/\$(\d+)/g, (_, num) => {
    const idx = parseInt(num, 10) - 1;
    if (idx < 0 || idx >= params.length) {
      // 参数索引越界，保留原样（通常是 SQL 字符串中无意匹配的 $）
      return '$' + num;
    }
    newParams.push(params[idx]);
    return '?';
  });

  return { sql, params: newParams };
}

/**
 * 判断 SQL 是否为写入语句（INSERT/UPDATE/DELETE/REPLACE）
 */
function isWriteQuery(sql) {
  return /^\s*(INSERT|UPDATE|DELETE|REPLACE|CREATE|ALTER|DROP|TRUNCATE)/i.test(sql);
}

/**
 * 执行查询（兼容 pg 的返回格式 { rows, rowCount }）
 * - SELECT: rows 为数组
 * - INSERT: rows 为数组 [{ insertId, affectedRows }]，方便使用 .rows.insertId
 * - UPDATE/DELETE: 同 INSERT
 */
async function query(text, params) {
  const start = Date.now();
  const { sql, params: mappedParams } = convertPlaceholders(text, params);

  if (isWriteQuery(sql)) {
    const [result] = await pool.query(sql, mappedParams);
    const duration = Date.now() - start;
    if (config.env === 'development' && duration > 100) {
      console.warn(`Slow query (${duration}ms):`, text.substring(0, 100));
    }
    return {
      rows: [{ insertId: result.insertId, affectedRows: result.affectedRows }],
      rowCount: result.affectedRows,
      insertId: result.insertId,
      affectedRows: result.affectedRows,
      fields: [],
    };
  }

  const [rows, fields] = await pool.query(sql, mappedParams);
  const duration = Date.now() - start;

  if (config.env === 'development' && duration > 100) {
    console.warn(`Slow query (${duration}ms):`, text.substring(0, 100));
  }

  return { rows, rowCount: rows.length, fields, insertId: null };
}

/**
 * 事务执行（兼容 pg 的 client 回调模式）
 */
async function transaction(callback) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const client = {
      query: async (text, params) => {
        const { sql, params: mappedParams } = convertPlaceholders(text, params);

        if (isWriteQuery(sql)) {
          const [result] = await connection.query(sql, mappedParams);
          return {
            rows: [{ insertId: result.insertId, affectedRows: result.affectedRows }],
            rowCount: result.affectedRows,
            insertId: result.insertId,
            affectedRows: result.affectedRows,
            fields: [],
          };
        }

        const [rows, fields] = await connection.query(sql, mappedParams);
        return { rows, rowCount: rows.length, fields, insertId: null };
      }
    };
    const result = await callback(client);
    await connection.commit();
    return result;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

module.exports = { query, transaction, pool };
