const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

(async () => {
  const sql = fs.readFileSync(path.join(__dirname, '000_full_mysql_init.sql'), 'utf8');
  
  const conn = await mysql.createConnection({
    host: 'rm-uf606r39mc69yc73seo.mysql.rds.aliyuncs.com',
    port: 4001,
    user: 'five',
    password: '1ky5218siqbw4k8w3Z',
    database: 'five_db',
    multipleStatements: true
  });
  
  console.log('✅ 已连接，执行迁移...');
  await conn.query(sql);
  console.log('✅ 迁移完成!\n');
  
  // 验证
  const [tables] = await conn.query('SHOW TABLES');
  console.log('新表数量:', tables.length);
  for (const t of tables) {
    const name = Object.values(t)[0];
    const [cnt] = await conn.query(`SELECT COUNT(*) as c FROM \`${name}\``);
    console.log(`  ${name}: ${cnt[0].c} 行`);
  }
  
  await conn.end();
  console.log('\n🎉 数据库初始化成功!');
})().catch(e => { console.error('❌', e.message); process.exit(1); });
