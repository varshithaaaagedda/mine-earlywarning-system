const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// On Vercel Serverless environment, file system is read-only except /tmp
let dbPath = process.env.DATABASE_PATH;

if (!dbPath) {
  if (process.env.VERCEL) {
    dbPath = '/tmp/subsidence.db';
  } else {
    dbPath = path.join(__dirname, 'subsidence.db');
  }
}

// Ensure target database directory exists
try {
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
} catch (e) {
  console.warn('⚠️ Warning: Cannot create DB directory, falling back to /tmp/subsidence.db');
  dbPath = '/tmp/subsidence.db';
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error connecting to SQLite database:', err.message);
  } else {
    console.log(`✅ SQLite Database connected at: ${dbPath}`);
  }
});

// Promisify SQLite methods for async/await usage
const queryAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
};

const queryGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const queryRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

module.exports = {
  db,
  dbPath,
  queryAll,
  queryGet,
  queryRun
};
