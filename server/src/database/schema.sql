-- ============================================
-- 会员领物微信小程序 - 数据库建表脚本
-- 数据库：MySQL 8.0+
-- 注意：数据库名为 five（由 migrate.js 自动创建/连接）
-- ============================================

-- --------------------------------------------
-- 1. 会员表
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS members (
    id              VARCHAR(36) PRIMARY KEY,
    openid          VARCHAR(64) UNIQUE NOT NULL COMMENT '微信 OpenID',
    nickname        VARCHAR(50) COMMENT '微信昵称',
    avatar_url      VARCHAR(500) COMMENT '微信头像 URL',
    phone           VARCHAR(20) COMMENT '手机号',
    member_type     ENUM('regular', 'vip') DEFAULT 'regular' COMMENT '会员类型',
    points_balance  INT DEFAULT 0 COMMENT '积分余额',
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_member_type (member_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='会员表';

-- --------------------------------------------
-- 2. 活动表
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS activities (
    id              VARCHAR(36) PRIMARY KEY,
    title           VARCHAR(100) NOT NULL COMMENT '活动名称',
    cover_image     VARCHAR(500) COMMENT '活动封面图',
    prize_desc      TEXT COMMENT '奖品描述',
    location        VARCHAR(200) COMMENT '领取地点',
    start_time      DATETIME NOT NULL COMMENT '领取开始时间',
    end_time        DATETIME NOT NULL COMMENT '领取结束时间',
    max_participants INT DEFAULT 0 COMMENT '总参与上限（0=不限）',
    vip_quota       INT DEFAULT 0 COMMENT 'VIP 专属名额（0=不限）',
    regular_quota   INT DEFAULT 0 COMMENT '普通会员名额（0=不限）',
    points_required INT DEFAULT 0 COMMENT '普通会员所需积分',
    description     TEXT COMMENT '活动说明',
    status          ENUM('draft', 'published', 'unpublished', 'ended') DEFAULT 'draft' COMMENT '活动状态',
    current_count   INT DEFAULT 0 COMMENT '当前报名总人数',
    vip_count       INT DEFAULT 0 COMMENT 'VIP 已报名人数',
    regular_count   INT DEFAULT 0 COMMENT '普通会员已报名人数',
    created_by      VARCHAR(36) COMMENT '操作员 ID',
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_time_range (start_time, end_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='活动表';

-- --------------------------------------------
-- 3. 活动报名表（含领奖码）
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS registrations (
    id              VARCHAR(36) PRIMARY KEY,
    member_id       VARCHAR(36) NOT NULL COMMENT '会员 ID',
    activity_id     VARCHAR(36) NOT NULL COMMENT '活动 ID',
    qr_token        VARCHAR(128) UNIQUE NOT NULL COMMENT '领奖码 token（HMAC-SHA256 签名）',
    points_cost     INT DEFAULT 0 COMMENT '实际消耗积分（VIP 为 0）',
    status          ENUM('registered', 'claimed', 'cancelled') DEFAULT 'registered' COMMENT '参与状态',
    claimed_at      DATETIME COMMENT '核销时间',
    claimed_by      VARCHAR(36) COMMENT '核销操作员 ID',
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    cancelled_at    DATETIME COMMENT '取消时间',
    UNIQUE KEY uk_member_activity (member_id, activity_id, status),
    INDEX idx_activity_id (activity_id),
    INDEX idx_member_id (member_id),
    INDEX idx_status (status),
    CONSTRAINT fk_reg_member FOREIGN KEY (member_id) REFERENCES members(id),
    CONSTRAINT fk_reg_activity FOREIGN KEY (activity_id) REFERENCES activities(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='活动报名表';

-- --------------------------------------------
-- 4. 积分明细表
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS points_records (
    id              VARCHAR(36) PRIMARY KEY,
    member_id       VARCHAR(36) NOT NULL COMMENT '会员 ID',
    change_type     ENUM('earn_ad', 'cost_activity', 'refund_cancel', 'admin_adjust') NOT NULL COMMENT '变动类型',
    change_amount   INT NOT NULL COMMENT '变动数量（正=获得，负=消耗）',
    balance_after   INT NOT NULL COMMENT '变动后余额',
    ref_id          VARCHAR(36) COMMENT '关联 ID（广告 ID 或活动 ID）',
    remark          VARCHAR(200) COMMENT '备注',
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_member_id (member_id),
    INDEX idx_change_type (change_type),
    CONSTRAINT fk_points_member FOREIGN KEY (member_id) REFERENCES members(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='积分明细表';

-- --------------------------------------------
-- 5. 广告位配置表
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS ads (
    id              VARCHAR(36) PRIMARY KEY,
    name            VARCHAR(100) NOT NULL COMMENT '广告位名称',
    ad_unit_id      VARCHAR(100) NOT NULL COMMENT '微信流量主广告单元 ID',
    points_reward   INT NOT NULL DEFAULT 0 COMMENT '观看后奖励积分',
    daily_limit     INT DEFAULT 1 COMMENT '每人每日领取上限',
    is_active       BOOLEAN DEFAULT TRUE COMMENT '是否启用',
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='广告位配置表';

-- --------------------------------------------
-- 6. 广告领取记录表
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS ad_claim_records (
    id              VARCHAR(36) PRIMARY KEY,
    member_id       VARCHAR(36) NOT NULL COMMENT '会员 ID',
    ad_id           VARCHAR(36) NOT NULL COMMENT '广告 ID',
    claimed_date    DATE NOT NULL COMMENT '领取日期（用于每日限制）',
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_member_ad_date (member_id, ad_id, claimed_date),
    INDEX idx_member_id (member_id),
    CONSTRAINT fk_claim_member FOREIGN KEY (member_id) REFERENCES members(id),
    CONSTRAINT fk_claim_ad FOREIGN KEY (ad_id) REFERENCES ads(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='广告领取记录表';

-- --------------------------------------------
-- 7. VIP 操作日志表
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS vip_logs (
    id              VARCHAR(36) PRIMARY KEY,
    member_id       VARCHAR(36) NOT NULL COMMENT '会员 ID',
    action          ENUM('grant', 'revoke') NOT NULL COMMENT '操作类型',
    operator_id     VARCHAR(36) COMMENT '操作员 ID',
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_member_id (member_id),
    CONSTRAINT fk_vip_log_member FOREIGN KEY (member_id) REFERENCES members(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='VIP 操作日志表';

-- --------------------------------------------
-- 8. 商家操作员白名单表
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS operator_whitelist (
    id              VARCHAR(36) PRIMARY KEY,
    phone           VARCHAR(20) UNIQUE NOT NULL COMMENT '手机号',
    nickname        VARCHAR(50) COMMENT '操作员昵称',
    is_active       BOOLEAN DEFAULT TRUE COMMENT '是否启用',
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商家操作员白名单表';

-- --------------------------------------------
-- 9. 订阅消息模板配置表
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS message_templates (
    id              VARCHAR(36) PRIMARY KEY,
    type            ENUM('signup_success', 'activity_reminder', 'claim_success') NOT NULL UNIQUE COMMENT '通知类型',
    template_id     VARCHAR(100) NOT NULL COMMENT '微信订阅消息模板 ID',
    is_active       BOOLEAN DEFAULT TRUE COMMENT '是否启用',
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订阅消息模板配置表';

-- --------------------------------------------
-- 10. 每日签到表
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS check_ins (
    id              VARCHAR(36) PRIMARY KEY,
    member_id       VARCHAR(36) NOT NULL COMMENT '会员 ID',
    checkin_date    DATE NOT NULL COMMENT '签到日期',
    points_earned   INT DEFAULT 1 COMMENT '获得积分',
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_member_date (member_id, checkin_date),
    INDEX idx_member_id (member_id),
    CONSTRAINT fk_checkin_member FOREIGN KEY (member_id) REFERENCES members(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='每日签到表';

-- --------------------------------------------
-- 积分变动类型增加签到（手动执行于已有数据库）
-- ALTER TABLE points_records MODIFY COLUMN change_type
--   ENUM('earn_ad','cost_activity','refund_cancel','admin_adjust','earn_checkin') NOT NULL;
