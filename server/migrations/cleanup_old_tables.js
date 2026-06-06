const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: 'rm-uf606r39mc69yc73seo.mysql.rds.aliyuncs.com',
    port: 4001, user: 'five', password: '1ky5218siqbw4k8w3Z', database: 'five_db',
    multipleStatements: true
  });

  const ourTables = ['users','merchants','activities','points_records','checkin_records',
    'redemption_records','refresh_tokens','subscription_templates','user_subscriptions',
    'message_logs','admin_logs','system_config'];

  const [all] = await conn.query('SHOW TABLES');
  const allTables = all.map(t => Object.values(t)[0]);
  const toDrop = allTables.filter(t => !ourTables.includes(t));

  if (toDrop.length === 0) {
    console.log('没有残留旧表');
  } else {
    console.log('清理旧表:', toDrop.join(', '));
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    for (const t of toDrop) {
      await conn.query('DROP TABLE IF EXISTS `' + t + '`');
    }
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('已清理 ' + toDrop.length + ' 张旧表');
  }

  const [final] = await conn.query('SHOW TABLES');
  console.log('\n最终表数量:', final.length);
  for (const t of final) {
    const name = Object.values(t)[0];
    const [cnt] = await conn.query('SELECT COUNT(*) as c FROM `' + name + '`');
    console.log('  ' + name + ': ' + cnt[0].c + ' 行');
  }

  await conn.end();
  console.log('\n🎉 数据库已清理完毕!');
})().catch(e => { console.error('❌', e.message); process.exit(1); });
