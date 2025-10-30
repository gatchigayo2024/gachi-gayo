-- 독립 같이가요 포스팅을 위해 special_deal_id NULL 허용
-- SQLite는 ALTER COLUMN을 지원하지 않으므로 테이블 재생성 필요

-- 외래 키 제약조건 임시 비활성화
PRAGMA foreign_keys=OFF;

-- 트랜잭션 시작
BEGIN TRANSACTION;

-- 1. 임시 테이블 생성
CREATE TABLE gatherings_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  special_deal_id INTEGER,  -- NOT NULL 제거
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
  status TEXT DEFAULT 'open',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (special_deal_id) REFERENCES special_deals(id)
);

-- 2. 기존 데이터 복사
INSERT INTO gatherings_new 
SELECT * FROM gatherings;

-- 3. 기존 테이블 삭제
DROP TABLE gatherings;

-- 4. 새 테이블 이름 변경
ALTER TABLE gatherings_new RENAME TO gatherings;

-- 5. 인덱스 재생성
CREATE INDEX idx_gatherings_user_id ON gatherings(user_id);
CREATE INDEX idx_gatherings_special_deal_id ON gatherings(special_deal_id);

-- 트랜잭션 커밋
COMMIT;

-- 외래 키 제약조건 다시 활성화
PRAGMA foreign_keys=ON;
