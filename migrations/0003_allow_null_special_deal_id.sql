PRAGMA foreign_keys=OFF;

CREATE TABLE gatherings_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  special_deal_id INTEGER,
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
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO gatherings_new 
SELECT * FROM gatherings;

DROP TABLE gatherings;

ALTER TABLE gatherings_new RENAME TO gatherings;

CREATE INDEX idx_gatherings_user_id ON gatherings(user_id);
CREATE INDEX idx_gatherings_special_deal_id ON gatherings(special_deal_id);

PRAGMA foreign_keys=ON;
