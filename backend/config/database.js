const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const dbPath = process.env.DATABASE_PATH || './database.sqlite';

class Database {
  constructor() {
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err.message);
      } else {
        console.log('Connected to SQLite database.');
        this.initTables();
      }
    });
  }

  initTables() {
    const tables = [
      `CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        title TEXT,
        model_used TEXT
      )`,
      
      `CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        content TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
        model TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        token_count INTEGER DEFAULT 0,
        content_type TEXT DEFAULT 'text',
        image_metadata TEXT,
        FOREIGN KEY (session_id) REFERENCES sessions (id)
      )`,
      
      `CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS api_keys (
        provider TEXT PRIMARY KEY,
        key_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    // Create tables synchronously to ensure they exist before proceeding
    let tablesCreated = 0;
    const totalTables = tables.length;

    tables.forEach((sql, index) => {
      this.db.run(sql, (err) => {
        if (err) {
          console.error(`Error creating table ${index + 1}:`, err.message);
        } else {
          console.log(`Created table ${index + 1}/${totalTables}`);
        }
        
        tablesCreated++;
        if (tablesCreated === totalTables) {
          // Add new columns for existing installations
          this.updateSchema();
          // Insert default settings only after all tables are created
          setTimeout(() => this.initDefaultSettings(), 200);
        }
      });
    });
  }

  updateSchema() {
    // Add new columns for existing installations (migration)
    const alterQueries = [
      `ALTER TABLE messages ADD COLUMN content_type TEXT DEFAULT 'text'`,
      `ALTER TABLE messages ADD COLUMN image_metadata TEXT`
    ];

    alterQueries.forEach((sql, index) => {
      this.db.run(sql, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.warn(`Schema update ${index + 1} failed (this may be expected):`, err.message);
        } else if (!err) {
          console.log(`Schema updated: Added column ${index + 1}`);
        }
      });
    });
  }

  initDefaultSettings() {
    const defaultSettings = [
      ['default_model', 'gpt-3.5-turbo'],
      ['max_tokens', '2000'],
      ['temperature', '0.7'],
      ['logging_enabled', 'true']
    ];

    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)
    `);

    defaultSettings.forEach(([key, value]) => {
      stmt.run(key, value);
    });

    stmt.finalize();
  }

  getDatabase() {
    return this.db;
  }

  close() {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) {
          reject(err);
        } else {
          console.log('Database connection closed.');
          resolve();
        }
      });
    });
  }
}

module.exports = Database; 