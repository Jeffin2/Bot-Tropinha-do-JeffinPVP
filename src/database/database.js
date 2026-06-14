const Database = require("better-sqlite3");
const path = require("path");

const db = new Database(
    path.join(__dirname, "killer.db")
);

db.exec(`
CREATE TABLE IF NOT EXISTS users (
    user_id TEXT PRIMARY KEY,
    wallet INTEGER DEFAULT 0,
    bank INTEGER DEFAULT 0,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0
)
`);

try {
    db.prepare(`
        ALTER TABLE users
        ADD COLUMN wins INTEGER DEFAULT 0
    `).run();
} catch {}

try {
    db.prepare(`
        ALTER TABLE users
        ADD COLUMN losses INTEGER DEFAULT 0
    `).run();
} catch {}

module.exports = db;