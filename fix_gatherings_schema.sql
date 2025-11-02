PRAGMA foreign_keys=OFF;

DROP TABLE IF EXISTS gathering_applications_backup;
DROP TABLE IF EXISTS gathering_likes_backup;

CREATE TABLE gathering_applications_backup AS SELECT * FROM gathering_applications;
CREATE TABLE gathering_likes_backup AS SELECT * FROM gathering_likes;

DROP TABLE gathering_applications;
DROP TABLE gathering_likes;

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

INSERT INTO gatherings_new SELECT * FROM gatherings;

DROP TABLE gatherings;

ALTER TABLE gatherings_new RENAME TO gatherings;

CREATE INDEX idx_gatherings_user_id ON gatherings(user_id);
CREATE INDEX idx_gatherings_special_deal_id ON gatherings(special_deal_id);

CREATE TABLE gathering_applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  gathering_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  answer TEXT,
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (gathering_id) REFERENCES gatherings(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(gathering_id, user_id)
);

CREATE TABLE gathering_likes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  gathering_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (gathering_id) REFERENCES gatherings(id),
  UNIQUE(user_id, gathering_id)
);

INSERT INTO gathering_applications SELECT * FROM gathering_applications_backup;
INSERT INTO gathering_likes SELECT * FROM gathering_likes_backup;

DROP TABLE gathering_applications_backup;
DROP TABLE gathering_likes_backup;

PRAGMA foreign_keys=ON;
