/**
 * 数据库迁移脚本
 * 直接连接已存在的数据库，执行 schema.sql 建表
 */
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const config = require('../config');

async function migrate() {
  const { host, port, user, password, name } = config.database;

  console.log(`⏳ 连接数据库 \`${name}\` @ ${host}:${port} ...`);

  const connection = await mysql.createConnection({
    host, port, user, password,
    database: name,
    multipleStatements: true
  });

  const sqlPath = path.join(__dirname, 'schema.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log('⏳ 开始执行建表...');
  try {
    await connection.query(sql);
    console.log('✅ 所有表创建完成！');
  } catch (err) {
    console.error('❌ 建表失败:', err.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

migrate();
