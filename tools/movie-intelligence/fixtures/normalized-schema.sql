-- Issue #11 schema contract; synthetic test databases only. Not a migration.
CREATE TABLE movies (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  original_title TEXT,
  year INTEGER,
  created_at TEXT,
  updated_at TEXT
);
CREATE TABLE external_ids (
  movie_id INTEGER NOT NULL,
  source TEXT NOT NULL,
  external_id TEXT NOT NULL,
  url TEXT,
  last_synced_at TEXT,
  PRIMARY KEY (source, external_id),
  UNIQUE (movie_id, source),
  FOREIGN KEY (movie_id) REFERENCES movies(id)
);
CREATE TABLE user_movies (
  movie_id INTEGER PRIMARY KEY,
  watched INTEGER NOT NULL DEFAULT 0,
  watchlist INTEGER NOT NULL DEFAULT 0,
  my_rating REAL,
  watchlist_added_at TEXT,
  watched_at TEXT,
  updated_at TEXT,
  FOREIGN KEY (movie_id) REFERENCES movies(id)
);
