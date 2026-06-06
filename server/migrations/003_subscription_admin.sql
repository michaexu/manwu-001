/**
 * 迁移 003：订阅消息 + 管理员日志
 *
 * 执行方式: psql $DATABASE_URL -f migrations/003_subscription_admin.sql
 */

-- ============================
-- 1. 订阅消息模板表
-- ============================
CREATE TABLE IF NOT EXISTS subscription_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id VARCHAR(64) NOT NULL UNIQUE,          -- 微信模板ID
  name VARCHAR(100) NOT NULL,                        -- 模板名称
  scene VARCHAR(50) NOT NULL,                        -- 场景: activity_remind / redeem_success / checkin_remind
  example_data JSONB,                                -- 示例数据
  status VARCHAR(20) DEFAULT 'active',               -- active / inactive
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE subscription_templates IS '订阅消息模板配置';
COMMENT ON COLUMN subscription_templates.scene IS '场景标识: activity_remind=活动提醒, redeem_success=兑换成功, checkin_remind=签到提醒';

-- 预置模板（占位符，实际需在微信公众平台申请后替换）
INSERT INTO subscription_templates (template_id, name, scene, example_data) VALUES
  ('TMPL_ACTIVITY_REMIND', '活动开始提醒', 'activity_remind',
   '{"thing1":{"value":"活动名称"},"time2":{"value":"2024-01-01 10:00"},"thing3":{"value":"温馨提示"}}'),
  ('TMPL_REDEEM_SUCCESS', '兑换成功通知', 'redeem_success',
   '{"thing1":{"value":"星巴克拿铁兑换券"},"character_string2":{"value":"ABCD1234"},"thing3":{"value":"请到店出示兑换码"}}'),
  ('TMPL_CHECKIN_REMIND', '签到提醒', 'checkin_remind',
   '{"thing1":{"value":"每日签到"},"number2":{"value":"10"},"thing3":{"value":"记得来签到哦"}}')
ON CONFLICT (template_id) DO NOTHING;


-- ============================
-- 2. 用户订阅记录表
-- ============================
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  template_id VARCHAR(64) NOT NULL,
  scene VARCHAR(50) NOT NULL,
  accepted BOOLEAN DEFAULT true,                     -- 用户是否同意订阅
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, template_id)
);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_scene ON user_subscriptions(scene);


-- ============================
-- 3. 消息发送记录表
-- ============================
CREATE TABLE IF NOT EXISTS message_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  template_id VARCHAR(64) NOT NULL,
  scene VARCHAR(50) NOT NULL,
  data JSONB NOT NULL,                               -- 发送的消息数据
  page VARCHAR(200),                                 -- 点击跳转页面
  send_status VARCHAR(20) DEFAULT 'pending',         -- pending / success / failed
  error_msg TEXT,                                    -- 失败原因
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_message_logs_user ON message_logs(user_id, created_at DESC);


-- ============================
-- 4. 管理员操作日志表
-- ============================
CREATE TABLE IF NOT EXISTS admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES users(id) NOT NULL,
  target_user_id UUID REFERENCES users(id),
  action VARCHAR(50) NOT NULL,                       -- assign_vip / revoke_vip / update_quota / etc.
  detail JSONB,                                      -- 操作详情
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_logs_admin ON admin_logs(admin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_logs_target ON admin_logs(target_user_id);


-- ============================
-- 5. 系统配置表
-- ============================
CREATE TABLE IF NOT EXISTS system_config (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES users(id)
);

-- 预置配置
INSERT INTO system_config (key, value, description) VALUES
  ('ad_reward_points', '20', '每次广告奖励积分'),
  ('ad_daily_limit', '5', '每日广告观看上限'),
  ('checkin_base_points', '10', '签到基础积分'),
  ('checkin_streak_bonus', '50', '连续7天额外奖励'),
  ('register_bonus_points', '50', '新用户注册赠送积分')
ON CONFLICT (key) DO NOTHING;
