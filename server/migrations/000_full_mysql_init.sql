/**
 * 完整 MySQL 迁移脚本（合并 001+002+003）
 *
 * 执行方式:
 *   mysql -h rm-uf606r39mc69yc73seo.mysql.rds.aliyuncs.com -P 4001 -u five -p five_db < 000_full_mysql_init.sql
 *
 * 注意：此脚本会先 DROP 所有旧表，请确认数据已备份！
 */
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================
-- 0. 清理旧表
-- ============================
DROP TABLE IF EXISTS admin_logs;
DROP TABLE IF EXISTS message_logs;
DROP TABLE IF EXISTS user_subscriptions;
DROP TABLE IF EXISTS subscription_templates;
DROP TABLE IF EXISTS system_config;
DROP TABLE IF EXISTS refresh_tokens;
DROP TABLE IF EXISTS redemption_records;
DROP TABLE IF EXISTS checkin_records;
DROP TABLE IF EXISTS points_records;
DROP TABLE IF EXISTS activities;
DROP TABLE IF EXISTS merchants;
DROP TABLE IF EXISTS users;

-- ============================
-- 1. 用户表
-- ============================
CREATE TABLE users (
  id                CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  wechat_openid     VARCHAR(128) UNIQUE,
  wechat_unionid    VARCHAR(128),
  phone             VARCHAR(20) UNIQUE,
  nick_name         VARCHAR(100),
  avatar_url        TEXT,
  role              VARCHAR(20) DEFAULT 'user',
  vip_level         INT DEFAULT 0,
  points            INT DEFAULT 0,
  total_points_earned INT DEFAULT 0,
  vip_monthly_quota  INT DEFAULT 0,
  vip_monthly_used   INT DEFAULT 0,
  vip_quota_reset_date DATE DEFAULT (CURDATE()),
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================
-- 2. 商家表
-- ============================
CREATE TABLE merchants (
  id          CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id     CHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        VARCHAR(200) NOT NULL,
  address     TEXT,
  phone       VARCHAR(20),
  description TEXT,
  latitude    DOUBLE,
  longitude   DOUBLE,
  status      VARCHAR(20) DEFAULT 'active',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_merchants_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================
-- 3. 活动表
-- ============================
CREATE TABLE activities (
  id                      CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  merchant_id             CHAR(36) NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  title                   VARCHAR(200) NOT NULL,
  description             TEXT,
  points_required         INT NOT NULL DEFAULT 0,
  gift_name               VARCHAR(200) NOT NULL,
  gift_description        TEXT,
  gift_spec               VARCHAR(200),
  merchant_description    TEXT,
  image_url               TEXT,
  emoji                   VARCHAR(10) DEFAULT '🎁',
  color                   VARCHAR(20) DEFAULT '#EC4899',
  vip_quota               INT DEFAULT 0,
  vip_redeemed_count      INT DEFAULT 0,
  regular_quota           INT DEFAULT 0,
  regular_redeemed_count  INT DEFAULT 0,
  start_time              TIMESTAMP NULL,
  end_time                TIMESTAMP NULL,
  status                  VARCHAR(20) DEFAULT 'active',
  created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_activities_merchant (merchant_id),
  INDEX idx_activities_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================
-- 4. 积分记录表
-- ============================
CREATE TABLE points_records (
  id            CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id       CHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  points        INT NOT NULL,
  type          VARCHAR(50) NOT NULL,
  description   VARCHAR(200),
  reference_id  CHAR(36),
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_points_user (user_id, created_at DESC),
  INDEX idx_points_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================
-- 5. 签到记录表
-- ============================
CREATE TABLE checkin_records (
  id            CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id       CHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  checkin_date  DATE NOT NULL DEFAULT (CURDATE()),
  reward_points INT NOT NULL DEFAULT 10,
  streak_days   INT DEFAULT 1,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_date (user_id, checkin_date),
  INDEX idx_checkin_user (user_id, checkin_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================
-- 6. 兑换记录表
-- ============================
CREATE TABLE redemption_records (
  id            CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id       CHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_id   CHAR(36) REFERENCES activities(id) ON DELETE SET NULL,
  merchant_id   CHAR(36) REFERENCES merchants(id) ON DELETE SET NULL,
  code          VARCHAR(20) UNIQUE NOT NULL,
  points_spent  INT NOT NULL DEFAULT 0,
  redeem_type   VARCHAR(20) DEFAULT 'points',
  status        VARCHAR(20) DEFAULT 'pending',
  confirmed_by  CHAR(36) REFERENCES users(id) ON DELETE SET NULL,
  confirmed_at  TIMESTAMP NULL,
  expires_at    TIMESTAMP NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_redemption_code (code),
  INDEX idx_redemption_user (user_id),
  INDEX idx_redemption_merchant (merchant_id, status),
  INDEX idx_redemption_type (redeem_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================
-- 7. Refresh Token 表
-- ============================
CREATE TABLE refresh_tokens (
  id          CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id     CHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token       VARCHAR(256) UNIQUE NOT NULL,
  expires_at  TIMESTAMP NOT NULL,
  revoked     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_refresh_token_user (user_id),
  INDEX idx_refresh_token_val (token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================
-- 8. 订阅消息模板表
-- ============================
CREATE TABLE subscription_templates (
  id          CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  template_id VARCHAR(64) NOT NULL UNIQUE,
  name        VARCHAR(100) NOT NULL,
  scene       VARCHAR(50) NOT NULL,
  example_data JSON,
  status      VARCHAR(20) DEFAULT 'active',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 预置模板
INSERT INTO subscription_templates (template_id, name, scene, example_data) VALUES
  ('TMPL_ACTIVITY_REMIND', '活动开始提醒', 'activity_remind',
   '{"thing1":{"value":"活动名称"},"time2":{"value":"2024-01-01 10:00"},"thing3":{"value":"温馨提示"}}'),
  ('TMPL_REDEEM_SUCCESS', '兑换成功通知', 'redeem_success',
   '{"thing1":{"value":"星巴克拿铁兑换券"},"character_string2":{"value":"ABCD1234"},"thing3":{"value":"请到店出示兑换码"}}'),
  ('TMPL_CHECKIN_REMIND', '签到提醒', 'checkin_remind',
   '{"thing1":{"value":"每日签到"},"number2":{"value":"10"},"thing3":{"value":"记得来签到哦"}}');

-- ============================
-- 9. 用户订阅记录表
-- ============================
CREATE TABLE user_subscriptions (
  id            CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id       CHAR(36) NOT NULL,
  template_id   VARCHAR(64) NOT NULL,
  scene         VARCHAR(50) NOT NULL,
  accepted      BOOLEAN DEFAULT TRUE,
  subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_template (user_id, template_id),
  INDEX idx_user_subscriptions_user (user_id),
  INDEX idx_user_subscriptions_scene (scene)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================
-- 10. 消息发送记录表
-- ============================
CREATE TABLE message_logs (
  id          CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id     CHAR(36) NOT NULL,
  template_id VARCHAR(64) NOT NULL,
  scene       VARCHAR(50) NOT NULL,
  data        JSON NOT NULL,
  page        VARCHAR(200),
  send_status VARCHAR(20) DEFAULT 'pending',
  error_msg   TEXT,
  sent_at     TIMESTAMP NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_message_logs_user (user_id, created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================
-- 11. 管理员操作日志表
-- ============================
CREATE TABLE admin_logs (
  id              CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  admin_id        CHAR(36) NOT NULL,
  target_user_id  CHAR(36),
  action          VARCHAR(50) NOT NULL,
  detail          JSON,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_admin_logs_admin (admin_id, created_at DESC),
  INDEX idx_admin_logs_target (target_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================
-- 12. 系统配置表
-- ============================
CREATE TABLE system_config (
  `key`       VARCHAR(100) PRIMARY KEY,
  value       JSON NOT NULL,
  description TEXT,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by  CHAR(36)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 预置配置
INSERT INTO system_config (`key`, value, description) VALUES
  ('ad_reward_points', '"20"', '每次广告奖励积分'),
  ('ad_daily_limit', '"5"', '每日广告观看上限'),
  ('checkin_base_points', '"10"', '签到基础积分'),
  ('checkin_streak_bonus', '"50"', '连续7天额外奖励'),
  ('register_bonus_points', '"50"', '新用户注册赠送积分');

-- ============================
-- 13. 插入测试管理员
-- ============================
INSERT INTO users (id, phone, nick_name, role, vip_level, points, total_points_earned) VALUES
  (UUID(), '13800000000', '系统管理员', 'admin', 0, 0, 0);

-- ============================
-- 14. 全局索引（在 InnoDB 已包含大部分索引后，补充复合索引）
-- ============================
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_openid ON users(wechat_openid);
CREATE INDEX idx_users_role ON users(role);

SET FOREIGN_KEY_CHECKS = 1;
