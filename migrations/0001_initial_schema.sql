-- 사용자 테이블
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kakao_id TEXT UNIQUE,
  name TEXT NOT NULL,
  phone TEXT UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 특가 할인 포스팅 테이블
CREATE TABLE IF NOT EXISTS special_deals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  subtitle TEXT,
  content TEXT NOT NULL,
  images TEXT NOT NULL, -- JSON array of image URLs
  place_name TEXT NOT NULL,
  place_address TEXT NOT NULL,
  place_lat REAL,
  place_lng REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 같이가요 포스팅 테이블
CREATE TABLE IF NOT EXISTS gatherings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  special_deal_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  date_text TEXT NOT NULL,
  time_text TEXT NOT NULL,
  place_name TEXT NOT NULL,
  place_address TEXT NOT NULL,
  place_lat REAL,
  place_lng REAL,
  max_people INTEGER DEFAULT 4,
  current_people INTEGER DEFAULT 1,
  question TEXT,
  status TEXT DEFAULT 'open', -- 'open', 'closed'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (special_deal_id) REFERENCES special_deals(id)
);

-- 같이가요 신청 테이블
CREATE TABLE IF NOT EXISTS gathering_applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  gathering_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  answer TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (gathering_id) REFERENCES gatherings(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(gathering_id, user_id)
);

-- 좋아요 테이블 (특가 할인)
CREATE TABLE IF NOT EXISTS deal_likes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  special_deal_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (special_deal_id) REFERENCES special_deals(id),
  UNIQUE(user_id, special_deal_id)
);

-- 좋아요 테이블 (같이가요)
CREATE TABLE IF NOT EXISTS gathering_likes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  gathering_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (gathering_id) REFERENCES gatherings(id),
  UNIQUE(user_id, gathering_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_users_kakao_id ON users(kakao_id);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_gatherings_user_id ON gatherings(user_id);
CREATE INDEX IF NOT EXISTS idx_gatherings_special_deal_id ON gatherings(special_deal_id);
CREATE INDEX IF NOT EXISTS idx_gathering_applications_gathering_id ON gathering_applications(gathering_id);
CREATE INDEX IF NOT EXISTS idx_gathering_applications_user_id ON gathering_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_deal_likes_user_id ON deal_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_deal_likes_special_deal_id ON deal_likes(special_deal_id);
CREATE INDEX IF NOT EXISTS idx_gathering_likes_user_id ON gathering_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_gathering_likes_gathering_id ON gathering_likes(gathering_id);
