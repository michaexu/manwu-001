/**
 * 数据库表结构 (PostgreSQL)
 *
 * 执行方式: psql $DATABASE_URL -f migrations/001_init.sql
 */

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wechat_openid VARCHAR(128) UNIQUE,
  wechat_unionid VARCHAR(128),
  phone VARCHAR(20) UNIQUE,
  nick_name VARCHAR(100),
  avatar_url TEXT,
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'merchant', 'admin')),
  vip_level INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0,
  total_points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 商家表
CREATE TABLE IF NOT EXISTS merchants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  name VARCHAR(200) NOT NULL,
  address TEXT,
  phone VARCHAR(20),
  description TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 活动表
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES merchants(id),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  points_required INTEGER NOT NULL,
  gift_name VARCHAR(200) NOT NULL,
  gift_description TEXT,
  image_url TEXT,
  emoji VARCHAR(10) DEFAULT '🎁',
  color VARCHAR(20) DEFAULT '#EC4899',
  total_quota INTEGER DEFAULT 0,
  redeemed_count INTEGER DEFAULT 0,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'ended')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 积分记录表
CREATE TABLE IF NOT EXISTS points_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  points INTEGER NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN (
    'checkin', 'ad_reward', 'redeem', 'vip_bonus', 'admin_grant', 'refund'
  )),
  description VARCHAR(200),
  reference_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 签到记录表
CREATE TABLE IF NOT EXISTS checkin_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  checkin_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reward_points INTEGER NOT NULL DEFAULT 10,
  streak_days INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, checkin_date)
);

-- 兑换记录表
CREATE TABLE IF NOT EXISTS redemption_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  activity_id UUID REFERENCES activities(id),
  merchant_id UUID REFERENCES merchants(id),
  code VARCHAR(20) UNIQUE NOT NULL,
  points_spent INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'expired')),
  confirmed_by UUID REFERENCES users(id),
  confirmed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Refresh Token表
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  token VARCHAR(256) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_users_openid ON users(wechat_openid);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_activities_merchant ON activities(merchant_id);
CREATE INDEX IF NOT EXISTS idx_activities_status ON activities(status);
CREATE INDEX IF NOT EXISTS idx_points_records_user ON points_records(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_checkin_records_user ON checkin_records(user_id, checkin_date);
CREATE INDEX IF NOT EXISTS idx_redemption_code ON redemption_records(code);
CREATE INDEX IF NOT EXISTS idx_redemption_user ON redemption_records(user_id);
CREATE INDEX IF NOT EXISTS idx_redemption_merchant ON redemption_records(merchant_id, status);
