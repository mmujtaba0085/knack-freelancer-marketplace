-- Knack · Complete Database Schema
-- Run: mysql -u root -p < database/schema.sql

CREATE DATABASE IF NOT EXISTS knack CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE knack;

-- ─── Users ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(120) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('client','freelancer','admin') NOT NULL DEFAULT 'freelancer',
  is_active     TINYINT(1) NOT NULL DEFAULT 1,
  avatar_url    VARCHAR(500) DEFAULT NULL,
  bio           TEXT DEFAULT NULL,
  headline      VARCHAR(200) DEFAULT NULL,
  location      VARCHAR(120) DEFAULT NULL,
  hourly_rate   DECIMAL(10,2) DEFAULT NULL,
  availability  ENUM('open','busy','unavailable') DEFAULT 'open',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE UNIQUE INDEX idx_user_email ON users(email);

-- ─── Categories ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id    INT AUTO_INCREMENT PRIMARY KEY,
  name  VARCHAR(80) NOT NULL,
  icon  VARCHAR(10) DEFAULT '✦',
  slug  VARCHAR(80) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- ─── Skills ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS skills (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(80) NOT NULL,
  category_id INT,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_skills (
  user_id  INT NOT NULL,
  skill_id INT NOT NULL,
  PRIMARY KEY (user_id, skill_id),
  FOREIGN KEY (user_id)  REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─── Jobs ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS jobs (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  client_id   INT NOT NULL,
  category_id INT,
  title       VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  budget_min  DECIMAL(10,2) DEFAULT 0,
  budget_max  DECIMAL(10,2) DEFAULT 0,
  deadline    DATE DEFAULT NULL,
  level       ENUM('entry','intermediate','expert') DEFAULT 'intermediate',
  status      ENUM('open','in_progress','completed','cancelled') DEFAULT 'open',
  skills_text VARCHAR(500) DEFAULT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_jobs_status     ON jobs(status);
CREATE INDEX idx_jobs_category   ON jobs(category_id);
CREATE INDEX idx_jobs_client     ON jobs(client_id);

-- ─── Proposals ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS proposals (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  job_id          INT NOT NULL,
  freelancer_id   INT NOT NULL,
  cover_letter    TEXT NOT NULL,
  proposed_budget DECIMAL(10,2) NOT NULL,
  estimated_days  INT NOT NULL,
  status          ENUM('pending','accepted','rejected') DEFAULT 'pending',
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id)        REFERENCES jobs(id) ON DELETE CASCADE,
  FOREIGN KEY (freelancer_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_proposal (job_id, freelancer_id)
) ENGINE=InnoDB;

CREATE INDEX idx_proposals_job        ON proposals(job_id);
CREATE INDEX idx_proposals_freelancer ON proposals(freelancer_id);

-- ─── Contracts ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contracts (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  job_id         INT NOT NULL,
  proposal_id    INT NOT NULL,
  client_id      INT NOT NULL,
  freelancer_id  INT NOT NULL,
  agreed_budget  DECIMAL(10,2) NOT NULL,
  milestone_pct  INT DEFAULT 0,
  status         ENUM('active','completed','disputed','cancelled') DEFAULT 'active',
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id)        REFERENCES jobs(id) ON DELETE CASCADE,
  FOREIGN KEY (proposal_id)   REFERENCES proposals(id) ON DELETE CASCADE,
  FOREIGN KEY (client_id)     REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (freelancer_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─── Deliverables ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS deliverables (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  contract_id INT NOT NULL,
  file_url    VARCHAR(500) DEFAULT NULL,
  message     TEXT,
  status      ENUM('pending','approved','revision') DEFAULT 'pending',
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─── Reviews ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  contract_id INT NOT NULL,
  reviewer_id INT NOT NULL,
  reviewee_id INT NOT NULL,
  rating      TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_review (contract_id, reviewer_id),
  FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewee_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_reviews_reviewee ON reviews(reviewee_id);

-- ─── Notifications ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  type       ENUM('proposal','accepted','rejected','contract','review','payment','dispute','system') DEFAULT 'system',
  message    TEXT NOT NULL,
  link       VARCHAR(500) DEFAULT NULL,
  is_read    TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read);

-- ─── Password Resets ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS password_resets (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used       TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─── Disputes ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS disputes (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  contract_id INT NOT NULL,
  raised_by   INT NOT NULL,
  reason      TEXT NOT NULL,
  status      ENUM('open','investigating','resolved','closed') DEFAULT 'open',
  admin_note  TEXT DEFAULT NULL,
  severity    ENUM('low','med','high') DEFAULT 'low',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE,
  FOREIGN KEY (raised_by)   REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─── Seed Data ───────────────────────────────────────────────────────────────
INSERT INTO categories (name, icon, slug) VALUES
  ('Design & Brand', '✦', 'design'),
  ('Engineering',    '/>', 'engineering'),
  ('Writing',        '¶',  'writing'),
  ('Video & Motion', '▶', 'video'),
  ('Marketing',      '◎', 'marketing'),
  ('Product',        '◇', 'product'),
  ('Audio',          '♪', 'audio'),
  ('Data & AI',      '∑', 'data-ai');

INSERT INTO skills (name, category_id) VALUES
  ('Brand Identity', 1), ('Logo Design', 1), ('Packaging', 1), ('Typography', 1), ('Figma', 1),
  ('React', 2), ('Node.js', 2), ('Python', 2), ('iOS / Swift', 2), ('Webflow', 2),
  ('Copywriting', 3), ('Technical Writing', 3), ('Editing', 3),
  ('Motion Graphics', 4), ('Video Editing', 4), ('After Effects', 4),
  ('SEO', 5), ('Social Media', 5), ('Email Marketing', 5),
  ('Product Strategy', 6), ('UX Research', 6), ('Wireframing', 6),
  ('Podcast Editing', 7), ('Sound Design', 7),
  ('Machine Learning', 8), ('Data Analysis', 8), ('SQL', 8);
