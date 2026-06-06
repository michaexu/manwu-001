/**
 * 迁移 002：会员体系 + 活动属性扩展
 *
 * 执行方式: psql $DATABASE_URL -f migrations/002_membership_activity_v2.sql
 */

-- ============================
-- 1. 用户表：新增 VIP 月度配额度
-- ============================
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS vip_monthly_quota INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS vip_monthly_used  INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS vip_quota_reset_date DATE DEFAULT DATE_TRUNC('month', NOW())::DATE;

COMMENT ON COLUMN users.vip_monthly_quota    IS 'VIP 每月免积分参与次数上限（0=非VIP）';
COMMENT ON COLUMN users.vip_monthly_used     IS '当月已使用的免积分次数';
COMMENT ON COLUMN users.vip_quota_reset_date IS '配额重置日期，每月 1 日重置';

-- 创建月度配额重置函数
CREATE OR REPLACE FUNCTION reset_vip_monthly_quota()
RETURNS TRIGGER AS $$
BEGIN
  -- 如果到了新的月份，重置已使用次数
  IF DATE_TRUNC('month', NEW.updated_at)::DATE > OLD.vip_quota_reset_date THEN
    NEW.vip_monthly_used := 0;
    NEW.vip_quota_reset_date := DATE_TRUNC('month', NEW.updated_at)::DATE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 用户表触发器：每次更新自动检查是否需要重置月度配额
DROP TRIGGER IF EXISTS trg_reset_vip_quota ON users;
CREATE TRIGGER trg_reset_vip_quota
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION reset_vip_monthly_quota();


-- ============================
-- 2. 活动表：拆分 VIP/普通名额 + 新增属性
-- ============================

-- 2a. 重命名旧字段 → 新字段（带默认值迁移）
ALTER TABLE activities
  RENAME COLUMN total_quota TO vip_quota;

ALTER TABLE activities
  RENAME COLUMN redeemed_count TO vip_redeemed_count;

-- 2b. 新增普通用户字段
ALTER TABLE activities
  ADD COLUMN IF NOT EXISTS regular_quota          INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS regular_redeemed_count INTEGER DEFAULT 0;

-- 2c. 新增活动属性字段
ALTER TABLE activities
  ADD COLUMN IF NOT EXISTS gift_spec            VARCHAR(200),
  ADD COLUMN IF NOT EXISTS merchant_description TEXT;

-- 2d. 更新注释
COMMENT ON COLUMN activities.vip_quota              IS 'VIP 专属名额数（0=不限制）';
COMMENT ON COLUMN activities.vip_redeemed_count     IS 'VIP 已兑换数';
COMMENT ON COLUMN activities.regular_quota          IS '普通用户名额数（0=不限制）';
COMMENT ON COLUMN activities.regular_redeemed_count IS '普通用户已兑换数';
COMMENT ON COLUMN activities.gift_spec              IS '礼物规格（型号/尺寸/颜色等）';
COMMENT ON COLUMN activities.merchant_description   IS '商家介绍';
COMMENT ON COLUMN activities.points_required        IS '普通用户参与所需积分（VIP免积分时忽略）';
COMMENT ON COLUMN activities.gift_name              IS '礼物名称';
COMMENT ON COLUMN activities.gift_description       IS '礼物详细介绍';


-- ============================
-- 3. 兑换记录表：区分兑换类型
-- ============================
ALTER TABLE redemption_records
  ADD COLUMN IF NOT EXISTS redeem_type VARCHAR(20) DEFAULT 'points'
    CHECK (redeem_type IN ('points', 'vip_free'));

COMMENT ON COLUMN redemption_records.redeem_type IS '兑换类型：points=积分兑换, vip_free=VIP免积分';
COMMENT ON COLUMN redemption_records.points_spent IS '消耗积分（VIP免积分时为0）';


-- ============================
-- 4. 商家表：补充介绍字段
-- ============================
ALTER TABLE merchants
  ADD COLUMN IF NOT EXISTS description TEXT;

COMMENT ON COLUMN merchants.description IS '商家详细介绍';


-- ============================
-- 5. 新增索引
-- ============================
CREATE INDEX IF NOT EXISTS idx_redemption_type ON redemption_records(redeem_type);
CREATE INDEX IF NOT EXISTS idx_activities_quotas ON activities(vip_quota, regular_quota);
