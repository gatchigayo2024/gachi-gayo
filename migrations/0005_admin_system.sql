-- 관리자 계정 테이블
CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 사용자 차단 테이블
CREATE TABLE IF NOT EXISTS blocked_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  admin_id INTEGER NOT NULL,
  reason TEXT,
  blocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (admin_id) REFERENCES admins(id)
);

-- 지인들과 같이가기 신청 테이블
CREATE TABLE IF NOT EXISTS group_chat_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  deal_id INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (deal_id) REFERENCES special_deals(id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_blocked_users_user_id ON blocked_users(user_id);
CREATE INDEX IF NOT EXISTS idx_group_chat_requests_status ON group_chat_requests(status);
