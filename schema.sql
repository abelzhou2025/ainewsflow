-- Cloudflare D1 Database Schema for Newsflow v2
-- ⚠️  核心合规要求：严禁存储文章正文 (content)，仅存储元数据
-- 文章正文必须"阅后即焚"，仅在请求时实时抓取

CREATE TABLE IF NOT EXISTS links_library (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    source TEXT NOT NULL,
    tags TEXT DEFAULT '[]', -- JSON array string: ["AI", "Tech", "Finance"]
    user_notes TEXT,
    is_featured BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_source ON links_library(source);
CREATE INDEX IF NOT EXISTS idx_is_featured ON links_library(is_featured);
CREATE INDEX IF NOT EXISTS idx_created_at ON links_library(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tags ON links_library(tags);

-- Trigger to update updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_links_library_timestamp
AFTER UPDATE ON links_library
FOR EACH ROW
BEGIN
    UPDATE links_library SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
