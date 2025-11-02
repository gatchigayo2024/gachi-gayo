-- 전화번호 인증 시스템으로 전환

-- users 테이블에 phone, phone_verified 필드 추가 (kakao_id는 nullable로 변경)
ALTER TABLE users ADD COLUMN phone_verified INTEGER DEFAULT 0;

-- SMS 인증번호 임시 저장 테이블
CREATE TABLE IF NOT EXISTS sms_verifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  verified INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- 인증번호 조회 최적화를 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_sms_phone_verified ON sms_verifications(phone, verified);
CREATE INDEX IF NOT EXISTS idx_sms_expires ON sms_verifications(expires_at);

-- users 테이블의 phone 인덱스 추가 (이미 있을 수 있음)
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
