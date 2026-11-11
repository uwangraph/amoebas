-- Tabel metadata foto galeri (file disimpan di R2)
CREATE TABLE IF NOT EXISTS gallery (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	key TEXT NOT NULL UNIQUE,
	title TEXT,
	description TEXT,
	content_type TEXT NOT NULL,
	size INTEGER NOT NULL,
	uploaded_by TEXT,
	created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_gallery_created_at ON gallery (created_at DESC);
