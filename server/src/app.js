/**
 * 应用入口
 */
require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const config = require('./config');
const { requestIdMiddleware } = require('./middleware/requestId');
const { errorHandler } = require('./middleware/errorHandler');

// 路由
const authRoutes = require('./routes/auth/routes');
const homeRoutes = require('./routes/home/routes');
const activityRoutes = require('./routes/activities/routes');
const pointsRoutes = require('./routes/points/routes');
const checkinRoutes = require('./routes/checkin/routes');
const scanRoutes = require('./routes/scan/routes');
const merchantRoutes = require('./routes/merchant/routes');
const subscriptionRoutes = require('./routes/subscription/routes');
const adminRoutes = require('./routes/admin/routes');

const app = express();

// 安全中间件 - 自定义CSP允许CDN外部资源
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      frameSrc: ["'self'"],
    },
  },
}));
app.use(cors({
  origin: config.cors.origins,
  credentials: true
}));

// 请求日志
app.use(morgan('short'));

// 请求ID
app.use(requestIdMiddleware);

// 限流
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

// Body解析
app.use(express.json({ limit: '1mb' }));

// 根路径重定向到管理后台
app.get('/', (req, res) => res.redirect('/admin'));

// 健康检查
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.get('/ready', async (req, res) => {
  // 检查数据库连接
  const db = require('./models/db');
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (err) {
    res.status(503).json({ status: 'degraded', database: 'disconnected' });
  }
});

// 商家Web后台静态文件
const adminDir = path.resolve(__dirname, '../../admin');
app.use('/admin', express.static(adminDir));
// SPA fallback: /admin/* -> /admin/index.html
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(adminDir, 'index.html'));
});

// API路由
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/home', homeRoutes);
app.use('/api/v1/activities', activityRoutes);
app.use('/api/v1/points', pointsRoutes);
app.use('/api/v1/checkin', checkinRoutes);
app.use('/api/v1/scan', scanRoutes);
app.use('/api/v1/merchant', merchantRoutes);
app.use('/api/v1/subscription', subscriptionRoutes);
app.use('/api/v1/admin', adminRoutes);

// 全局错误处理
app.use(errorHandler);

// 启动服务
const server = app.listen(config.server.port, () => {
  console.log(`Server running on port ${config.server.port} [${config.env}]`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = app;
