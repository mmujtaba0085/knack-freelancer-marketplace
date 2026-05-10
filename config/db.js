// config/db.js — MySQL connection pool with promise support
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:     process.env.DB_HOST || 'localhost',
  user:     process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'knack',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+00:00',
});

// Convenience wrapper: returns [rows, fields]
pool.query = pool.query.bind(pool);

module.exports = pool;
