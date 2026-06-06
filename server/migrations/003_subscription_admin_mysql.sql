/**
 * 迁移 003：订阅消息 + 管理员日志
 *
 * MySQL 版本
 * 执行方式: mysql -h <host> -u <user> -p five_db < migrations/003_subscription_admin_mysql.sql
 */

-- ============================
-- 1. 订阅消息模板表
-- ============================
CREATE TABLE IF NOT EXISTS subscription_templates (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  template_id VARCHAR(64) NOT NULL UNIQUE,          -- 微信模板ID
  name VARCHAR(100) NOT NULL,                        -- 模板名称
  scene VARCHAR(50) NOT NULL,                        -- 场景: activity_remind / redeem_success / checkin_remind
  example_data JSON,                                  -- 示例数据
  status VARCHAR(20) DEFAULT 'active',               -- active / inactive
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 预置模板（占位符，实际需在微信公众平台申请后替换）
INSERT IGNORE INTO subscription_templates (template_id, name, scene, example_data) VALUES
  ('TMPL_ACTIVITY_REMIND', '活动开始提醒', 'activity_remind',
   '{"thing1":{"value":"活动名称"},"time2":{"value":"2024-01-01 10:00"},"thing3":{"value":"温馨提示"}}'),
  ('TMPL_REDEEM_SUCCESS', '兑换成功通知', 'redeem_success',
   '{"thing1":{"value":"星巴克拿铁兑换券"},"character_string2":{"value":"ABCD1234"},"thing3":{"value":"请到店出示兑换码"}}'),
  ('TMPL_CHECKIN_REMIND', '签到提醒', 'checkin_remind',
   '{"thing1":{"value":"每日签到"},"number2":{"value":"10"},"thing3":{"value":"记得来签到哦"}}');


-- ============================
-- 2. 用户订阅记录表
-- ============================
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  template_id VARCHAR(64) NOT NULL,
  scene VARCHAR(50) NOT NULL,
  accepted BOOLEAN DEFAULT TRUE,                      -- 用户是否同意订阅
  subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_template (user_id, template_id),
  KEY idx_user_subscriptions_user (user_id),
  KEY idx_user_subscriptions_scene (scene),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 如果不需要外键约束（高性能场景），用下面的版本：
-- CREATE TABLE IF NOT EXISTS user_subscriptions (
--   id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
--   user_id CHAR(36) NOT NULL,
--   template_id VARCHAR(64) NOT NULL,
--   scene VARCHAR(50) NOT NULL,
--   accepted BOOLEAN DEFAULT TRUE,
--   subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
--   UNIQUE KEY uk_user_template (user_id, template_id),
--   KEY idx_user_subscriptions_user (user_id),
--   KEY idx_user_subscriptions_scene (scene)
-- );


-- ============================
-- 3. 消息发送记录表
-- ============================
CREATE TABLE IF NOT EXISTS message_logs (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  template_id VARCHAR(64) NOT NULL,
  scene VARCHAR(50) NOT NULL,
  data JSON NOT NULL,                                  -- 发送的消息数据
  page VARCHAR(200),                                   -- 点击跳转页面
  send_status VARCHAR(20) DEFAULT 'pending',           -- pending / success / failed
  error_msg TEXT,                                      -- 失败原因
  sent_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  KEY idx_message_logs_user (user_id, created_at DESC),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


-- ============================
-- 4. 管理员操作日志表
-- ============================
CREATE TABLE IF NOT EXISTS admin_logs (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  admin_id CHAR(36) NOT NULL,
  target_user_id CHAR(36),
  action VARCHAR(50) NOT NULL,                        -- assign_vip / revoke_vip / update_quota / etc.
  detail JSON,                                         -- 操作详情
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  KEY idx_admin_logs_admin (admin_id, created_at DESC),
  KEY idx_admin_logs_target (target_user_id),
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE SET NULL
);


-- ============================
-- 5. 系统配置表
-- ============================
CREATE TABLE IF NOT EXISTS system_config (
  `key` VARCHAR(100) PRIMARY KEY,
  value JSON NOT NULL,
  description TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by CHAR(36),
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 预置配置
INSERT IGNORE INTO system_config (`key`, value, description) VALUES
  ('ad_reward_points', '"20"', '每次广告奖励积分'),
  ('ad_daily_limit', '"5"', '每日广告观看上限'),
  ('checkin_base_points', '"10"', '签到基础积分'),
  ('checkin_streak_bonus', '"50"', '连续7天额外奖励'),
  ('register_bonus_points', '"50"', '新用户注册赠送积分');
