const express = require('express');
const cors = require('cors');
const config = require('./config');
const errorHandler = require('./middleware/errorHandler');

// 路由
const authRoutes = require('./routes/auth');
const activityRoutes = require('./routes/activities');
const registrationRoutes = require('./routes/registrations');
const pointsRoutes = require('./routes/points');
const memberRoutes = require('./routes/members');
const merchantRoutes = require('./routes/merchant');
const adminRoutes = require('./routes/admin');

// 模型关联
require('./models/index');

const app = express();

// 中间件
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 请求日志
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// 路由注册
app.use('/api/auth', authRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/points', pointsRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/merchant', merchantRoutes);
app.use('/api/admin', adminRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 处理
app.use((req, res) => {
  res.status(404).json({ code: -1, message: '接口不存在', data: null });
});

// 错误处理
app.use(errorHandler);

// 启动服务
async function start() {
  try {
    // 重要：生产环境通过 migrate.js 建表
    // 这里仅启动 HTTP 服务
    app.listen(config.port, '0.0.0.0', () => {
      console.log(`
  ╔═══════════════════════════════════════════╗
  ║  会员领物系统 - 后端服务                    ║
  ║  运行端口: ${config.port}                    ║
  ║  运行环境: ${config.env}                      ║
  ╚═══════════════════════════════════════════╝
      `);
    });
  } catch (err) {
    console.error('启动失败:', err);
    process.exit(1);
  }
}

start();

module.exports = app;
