// database/migrate.js — run with: node database/migrate.js
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const db = require('../config/db');

const addCol = async (sql, label) => {
  try { await db.query(sql); console.log(`  ✓ ${label}`); }
  catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') console.log(`  ~ ${label} (exists)`);
    else throw e;
  }
};

async function migrate() {
  console.log('\n🔧  Running migrations…\n');

  await db.query(`CREATE TABLE IF NOT EXISTS messages (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    proposal_id INT NULL,
    contract_id INT NULL,
    sender_id   INT NOT NULL,
    body        TEXT,
    file_url    VARCHAR(500) NULL,
    file_type   ENUM('image','pdf','file') NULL,
    file_name   VARCHAR(255) NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX (proposal_id),
    INDEX (contract_id),
    FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE,
    FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id)   REFERENCES users(id)     ON DELETE CASCADE
  )`);
  console.log('  ✓ messages');

  await db.query(`CREATE TABLE IF NOT EXISTS milestones (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    contract_id   INT NOT NULL,
    title         VARCHAR(255) NOT NULL,
    description   TEXT,
    due_date      DATE NULL,
    amount        DECIMAL(10,2) DEFAULT 0.00,
    status        ENUM('pending','submitted','approved','revision_requested') DEFAULT 'pending',
    revision_note TEXT,
    display_order INT DEFAULT 0,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE
  )`);
  console.log('  ✓ milestones');

  await db.query(`CREATE TABLE IF NOT EXISTS change_orders (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    contract_id       INT NOT NULL,
    requested_by      INT NOT NULL,
    reason            TEXT NOT NULL,
    additional_amount DECIMAL(10,2) DEFAULT 0.00,
    extra_days        INT DEFAULT 0,
    status            ENUM('pending','accepted','rejected') DEFAULT 'pending',
    client_note       TEXT,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contract_id)  REFERENCES contracts(id) ON DELETE CASCADE,
    FOREIGN KEY (requested_by) REFERENCES users(id)     ON DELETE CASCADE
  )`);
  console.log('  ✓ change_orders');

  await db.query(`CREATE TABLE IF NOT EXISTS offers (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    client_id     INT NOT NULL,
    freelancer_id INT NOT NULL,
    title         VARCHAR(255) NOT NULL,
    description   TEXT NOT NULL,
    budget        DECIMAL(10,2) NOT NULL,
    deadline      DATE NULL,
    status        ENUM('pending','accepted','declined') DEFAULT 'pending',
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id)     REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (freelancer_id) REFERENCES users(id) ON DELETE CASCADE
  )`);
  console.log('  ✓ offers');

  await db.query(`CREATE TABLE IF NOT EXISTS saved_jobs (
    freelancer_id INT NOT NULL,
    job_id        INT NOT NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (freelancer_id, job_id),
    FOREIGN KEY (freelancer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (job_id)        REFERENCES jobs(id)  ON DELETE CASCADE
  )`);
  console.log('  ✓ saved_jobs');

  await db.query(`CREATE TABLE IF NOT EXISTS portfolio_items (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    freelancer_id INT NOT NULL,
    title         VARCHAR(255) NOT NULL,
    description   TEXT,
    image_url     VARCHAR(500) NULL,
    external_url  VARCHAR(500) NULL,
    display_order INT DEFAULT 0,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (freelancer_id) REFERENCES users(id) ON DELETE CASCADE
  )`);
  console.log('  ✓ portfolio_items');

  await addCol(`ALTER TABLE users ADD COLUMN is_verified TINYINT(1) NOT NULL DEFAULT 1`, 'users.is_verified');
  await addCol(`ALTER TABLE users ADD COLUMN verify_code VARCHAR(6) DEFAULT NULL`, 'users.verify_code');
  await addCol(`ALTER TABLE users ADD COLUMN verify_expires_at TIMESTAMP NULL DEFAULT NULL`, 'users.verify_expires_at');

  await addCol(`ALTER TABLE disputes ADD COLUMN category ENUM('non_delivery','quality','payment','scope','other') DEFAULT 'other' AFTER reason`, 'disputes.category');
  await addCol(`ALTER TABLE disputes ADD COLUMN allow_admin_chat TINYINT DEFAULT 0 AFTER admin_note`, 'disputes.allow_admin_chat');
  await addCol(`ALTER TABLE contracts ADD COLUMN deadline DATE NULL AFTER agreed_budget`, 'contracts.deadline');

  console.log('\n✅  Migrations complete!\n');
  process.exit(0);
}

migrate().catch(err => { console.error('\n❌  Migration failed:', err.message); process.exit(1); });
