# 会员领物 · 微信小程序

一套完整的"活动发布 → 会员参与 → 到店核销"闭环系统，支持 **VIP 会员** 与 **普通会员** 差异化权益。

## 项目架构

```
001/
├── server/                  # Node.js 后端服务
│   ├── src/
│   │   ├── app.js           # 入口文件
│   │   ├── config/          # 配置（数据库、JWT、微信等）
│   │   ├── database/        # 数据库 schema 和迁移
│   │   ├── middleware/      # 认证中间件（auth、merchantAuth、adminAuth）
│   │   ├── models/          # Sequelize 数据模型（Member、Activity、Registration 等）
│   │   ├── routes/          # 路由层（auth、activities、registrations、points、members、merchant、admin）
│   │   ├── services/        # 业务逻辑层（wechat、auth、activity、registration、points、qrcode、notification、member）
│   │   └── utils/           # 工具函数（response、crypto、errors）
│   ├── package.json
│   └── .env.example
├── client-miniapp/          # 客户版微信小程序
│   ├── pages/
│   │   ├── index/           # 活动广场（首页）
│   │   ├── activity-detail/ # 活动详情
│   │   ├── points-tasks/    # 积分任务（广告位）
│   │   ├── my-participations/ # 我的参与
│   │   ├── qr-code/         # 领奖码展示
│   │   ├── profile/         # 个人中心
│   │   ├── points-detail/   # 积分明细
│   │   └── registration-success/ # 报名成功
│   ├── utils/               # API 封装、Auth 工具、常量
│   └── app.json / app.js / app.wxss
├── merchant-miniapp/        # 商家版微信小程序
│   ├── pages/
│   │   ├── login/           # 手机号白名单登录
│   │   ├── activity-management/ # 活动管理
│   │   ├── activity-create/ # 创建/编辑活动
│   │   ├── activity-detail/ # 活动详情&参与列表
│   │   ├── scan-verify/     # 扫码核销
│   │   ├── verification-confirm/ # 核销确认
│   │   ├── member-management/ # 会员管理
│   │   ├── member-detail/   # 会员详情
│   │   ├── admin/
│   │   │   ├── vip-management/ # VIP 管理
│   │   │   ├── ad-config/      # 广告位配置
│   │   │   └── whitelist/      # 操作员白名单
│   │   └── dashboard/       # 数据看板
│   ├── utils/               # API 封装
│   └── app.json / app.js / app.wxss
└── README.md
```

## 技术栈

| 层 | 技术 |
|----|------|
| 后端框架 | Node.js + Express |
| 数据库 | MySQL 8.0+ (ORM: Sequelize) |
| 小程序端 | 原生微信小程序 |
| 认证方式 | JWT (JSON Web Token) |
| 二维码签名 | HMAC-SHA256 |
| 广告 SDK | 微信流量主激励视频广告 |

## 快速开始

### 1. 后端

```bash
cd server
cp .env.example .env   # 编辑数据库和微信相关配置
npm install
npm run migrate        # 创建数据库表
npm run dev            # 启动开发服务（默认 3000 端口）
```

### 2. 客户版小程序

用 **微信开发者工具** 打开 `client-miniapp/` 目录

- 修改 `project.config.json` 中的 `appid` 为你的微信小程序 AppID
- 修改 `utils/api.js` 中的 `BASE_URL` 为你的后端地址
- 在微信公众平台配置合法域名

### 3. 商家版小程序

用 **微信开发者工具** 打开 `merchant-miniapp/` 目录

- 修改 `project.config.json` 中的 `appid` 为你的微信小程序 AppID
- 修改 `utils/api.js` 中的 `BASE_URL` 为你的后端地址
- 在微信公众平台配置合法域名

## API 文档

### 认证（/api/auth）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/customer/login | 客户版微信登录 |
| POST | /api/auth/merchant/login | 商家版手机号登录 |

### 活动（/api/activities）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET  | /api/activities | 客户端：获取发布中的活动列表 |
| GET  | /api/activities/:id | 客户端：获取活动详情 |

### 报名（/api/registrations）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/registrations | 报名活动 |
| POST | /api/registrations/:id/cancel | 取消报名 |
| GET  | /api/registrations/my | 获取我的参与记录 |
| GET  | /api/registrations/:id/qrcode | 获取领奖码二维码 |

### 积分（/api/points）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET  | /api/points/ads | 获取广告位列表 |
| POST | /api/points/earn | 观看广告领取积分 |
| GET  | /api/points/records | 获取积分明细 |

### 商家管理（/api/merchant）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET  | /api/merchant/activities | 获取活动管理列表 |
| POST | /api/merchant/activities | 创建活动 |
| PUT  | /api/merchant/activities/:id | 编辑活动 |
| POST | /api/merchant/activities/:id/publish | 发布活动 |
| POST | /api/merchant/activities/:id/unpublish | 下架活动 |
| GET  | /api/merchant/activities/:id/registrations | 获取活动参与列表 |
| POST | /api/merchant/verify | 验证二维码 |
| POST | /api/merchant/claim | 确认核销 |

### 会员管理（/api/members）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET  | /api/members | 获取会员列表 |
| GET  | /api/members/:id | 获取会员详情 |
| POST | /api/members/:id/vip/grant | 开通 VIP |
| POST | /api/members/:id/vip/revoke | 撤销 VIP |

### 管理员（/api/admin）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET  | /api/admin/ads | 获取广告位列表 |
| POST | /api/admin/ads | 创建/更新广告位 |
| GET  | /api/admin/whitelist | 获取白名单列表 |
| POST | /api/admin/whitelist | 新增白名单 |
| DELETE | /api/admin/whitelist/:id | 删除白名单 |
| GET  | /api/admin/dashboard | 数据看板 |

## 数据库

共 9 张表：

- **members** - 会员表（支持 regular / vip 两种类型）
- **activities** - 活动表（支持名额分设）
- **registrations** - 报名表（含领奖码与核销状态）
- **points_records** - 积分明细表
- **ads** - 广告位配置表
- **ad_claim_records** - 广告领取记录表
- **vip_logs** - VIP 操作日志表
- **operator_whitelist** - 商家操作员白名单表
- **message_templates** - 订阅消息模板配置表

## 核心业务流程

```
商家创建活动 → 发布 → 客户端可见
                          ↓
                   会员浏览 → 报名
                   （VIP 免积分 / 普通扣积分）
                          ↓
                   生成领奖码（二维码）
                          ↓
                   到店出示二维码
                   商家扫码 → 验证 → 确认核销
                          ↓
                   会员端显示"已核销"
```

## 非功能性特性

- ✅ HMAC-SHA256 二维码签名防伪
- ✅ 报名/积分接口幂等校验
- ✅ 活动名额分会员类型独立控制
- ✅ 积分每日领取上限
- ✅ 报名唯一索引防重复
- ✅ 事务保证数据一致性

## License

MIT
