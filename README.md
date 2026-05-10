# Knack · Freelancer Gig Management System

> The marketplace for serious work.

A full-stack freelancer marketplace built with Node.js, Express, MySQL, and EJS — submitted as the Web Programming final project.

---

## Team

| Name | Roll Number |
|------|-------------|
| Muhammad Mujtaba | 22i-2123 |
| Shahmeer | 23i-2063 |

---

## Features at a Glance

| Area | What's included |
|------|----------------|
| **Auth** | Signup / Login / Logout, bcrypt hashing, token-based password reset, 30-min session expiry |
| **Three roles** | Client · Freelancer · Admin — fully separate dashboards and nav |
| **Jobs** | Post, edit, close jobs; browse with keyword + category + budget filters |
| **Proposals** | Apply with cover letter & bid; client accepts (auto-creates contract) or declines |
| **Contracts** | Milestones with approve/revision flow, deliverable uploads, completion & review |
| **Messaging** | Per-proposal and per-contract chat with file/image sharing; unified inbox |
| **Direct Offers** | Client sends an offer directly from a freelancer profile; one-click contract creation |
| **Notifications** | In-app bell badge (30 s polling), rate-limited message notifications |
| **Disputes** | Category + reason form; admin resolution panel |
| **Admin** | User management (activate/deactivate/change role), dispute queue, GMV reports |
| **Portfolio** | Freelancer adds up to 8 portfolio items with cover image and external link |
| **Saved Jobs** | Star-toggle on browse; dedicated saved-jobs page |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 18+ |
| Framework | Express 4 |
| Templating | EJS (server-side rendered) |
| Database | MySQL 8 |
| Auth | express-session, bcryptjs, connect-flash |
| Validation | express-validator (server), Vanilla JS (client) |
| File uploads | Multer (diskStorage for chat files) |
| Rate limiting | express-rate-limit |
| Email | Nodemailer (Gmail SMTP) |
| Frontend | Custom CSS design system, Vanilla JS |

---

## Prerequisites

Before you begin, make sure you have the following installed:

1. **Node.js 18 or higher**
   ```
   node --version   # must be v18.x or above
   npm --version    # included with Node
   ```

2. **MySQL 8 or higher**
   ```
   mysql --version  # must be 8.x
   ```

3. **Git** (to clone the repo)

4. **nodemon** (optional, for development auto-restart)
   ```bash
   npm install -g nodemon
   ```

---

## Setup Guide

### Step 1 — Clone the repository

```bash
git clone https://github.com/mmujtaba0085/knack-freelancer-marketplace.git
cd knack-freelancer-marketplace
```

### Step 2 — Install dependencies

```bash
npm install
```

This installs: express, ejs, mysql2, bcryptjs, express-session, connect-flash, express-validator, express-rate-limit, multer, nodemailer, dotenv.

### Step 3 — Configure environment variables

Copy the example env file:

```bash
cp .env.example .env
```

Then open `.env` and fill in every value:

```env
# Server
PORT=3000

# MySQL — match your local MySQL setup
DB_HOST=localhost
DB_USER=root
DB_PASS=yourMySQLpassword
DB_NAME=knack

# Session secret — use any random 32+ character string
SESSION_SECRET=change_this_to_any_long_random_string_32chars

# Nodemailer — for password-reset emails
# Use a Gmail account with an App Password (not your real password)
# To generate an App Password: Google Account → Security → 2-Step Verification → App passwords
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your.gmail@gmail.com
EMAIL_PASS=xxxx_xxxx_xxxx_xxxx   # 16-char App Password

# Base URL (used in reset-password email links)
BASE_URL=http://localhost:3000
```

> **Note:** If you do not configure email, the app runs fine — only the "forgot password" feature will fail silently. All other features work without email.

### Step 4 — Create and migrate the database

Log in to MySQL and run the schema:

```bash
mysql -u root -p < database/schema.sql
```

This creates the `knack` database and all tables:
`users`, `categories`, `skills`, `user_skills`, `jobs`, `proposals`, `contracts`, `deliverables`, `milestones`, `change_orders`, `messages`, `notifications`, `reviews`, `disputes`, `offers`, `saved_jobs`, `portfolio_items`, `password_resets`

If you need to add new columns to an existing database (e.g., after pulling updates):

```bash
node database/migrate.js
```

### Step 5 — Seed test data

```bash
node database/seed.js
```

This inserts:
- **1 admin**, **12 clients**, **20 freelancers** with realistic profiles, skills, and avatars
- **40 jobs** across 8 categories (Design, Development, Writing, Marketing, etc.)
- **~97 proposals** — multiple per job from different freelancers
- **15 active contracts** with milestones and deliverables
- **14 reviews**, **55+ notifications**

### Step 6 — Start the server

**Development** (auto-restarts on file save):
```bash
npm run dev
```

**Production** (no auto-restart):
```bash
npm start
```

Open your browser at: **http://localhost:3000**

---

## Test Accounts

After seeding, these accounts are ready to use:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@knack.com | Admin@123 |
| Client | alice@knack.com | Client@123 |
| Freelancer | maya@knack.com | Freelancer@123 |

> All seeded users share the same password: `Password@123` — the admin, alice, and maya accounts above use the ones listed.

---

## Project Structure

```
knack/
├── server.js                   ← Express entry point, session & middleware setup
├── .env.example                ← Environment variable template
├── package.json
│
├── database/
│   ├── schema.sql              ← Full DB schema (run once to create all tables)
│   ├── migrate.js              ← Adds columns/tables to existing DB safely
│   └── seed.js                 ← Inserts realistic demo data
│
├── config/
│   ├── db.js                   ← mysql2 promise-based connection pool
│   └── mailer.js               ← Nodemailer transporter wrapper
│
├── middleware/
│   ├── auth.js                 ← requireLogin, requireRole, attachUser
│   ├── validate.js             ← express-validator rule chains for all forms
│   └── rateLimiter.js          ← Login/signup brute-force protection
│
├── models/
│   └── notification.model.js   ← createNotification() helper
│
├── controllers/
│   ├── auth.controller.js      ← Signup, login, logout, password reset
│   ├── dashboard.controller.js ← Role-specific dashboard data
│   ├── jobs.controller.js      ← Post, browse, edit, save, search
│   ├── proposals.controller.js ← Apply, accept, reject
│   ├── contracts.controller.js ← Detail, milestones, deliverables, disputes, reviews
│   ├── messages.controller.js  ← Chat, inbox, file upload, polling
│   ├── offers.controller.js    ← Direct offers send/receive/accept
│   ├── profile.controller.js   ← View, edit, avatar, portfolio
│   └── admin.controller.js     ← User mgmt, disputes, reports
│
├── routes/
│   ├── index.js                ← Mounts all route files onto the app
│   ├── auth.routes.js
│   ├── jobs.routes.js
│   ├── proposals.routes.js
│   ├── contracts.routes.js
│   ├── messages.routes.js
│   ├── offers.routes.js
│   ├── profile.routes.js
│   ├── notifications.routes.js
│   ├── client.routes.js
│   ├── freelancer.routes.js
│   ├── admin.routes.js
│   └── pages.routes.js
│
├── views/
│   ├── layouts/
│   │   ├── header.ejs          ← Nav (role-aware), notification bell, avatar dropdown
│   │   └── footer.ejs          ← Footer with links, social, copyright
│   ├── auth/                   ← login, signup, forgot, reset
│   ├── client/                 ← dashboard, post-job, jobs, proposals, contracts, offers
│   ├── freelancer/             ← dashboard, browse, apply, contracts, offers, saved-jobs
│   ├── admin/                  ← dashboard, users, disputes, reports
│   └── shared/                 ← home, about, contact, profile, edit-profile, chat, inbox,
│                                  contract-detail, notifications, 403, 404, error
│
└── public/
    ├── css/style.css           ← Full Knack design system (CSS custom properties)
    ├── js/main.js              ← Nav, toast, notification polling, confirm dialogs
    ├── js/validate.js          ← Client-side form validation
    ├── js/browse.js            ← Live search debounce
    ├── img/default-avatar.svg
    └── uploads/                ← User-uploaded files (gitignored except .gitkeep)
```

---

## Key Security Points

| Criterion | Implementation |
|-----------|---------------|
| Password hashing | bcryptjs at cost factor 12 — `bcrypt.hash(password, 12)` |
| No plaintext | `password_hash` column only; plain password never persisted or logged |
| Secure comparison | `bcrypt.compare(input, hash)` — never `===` string check |
| Password reset | `crypto.randomBytes(32)` token → hashed before DB storage → 1-hour expiry → single use |
| Session security | `httpOnly: true` cookie, 30-min `maxAge`, `session.regenerate()` on login |
| Rate limiting | Login: 10 attempts / 15 min; Signup: 8 accounts / hour |
| Role guards | `requireRole('admin')` middleware returns 403 to all other roles |
| Input sanitization | `express-validator` sanitizes and escapes all form inputs before any DB query |

---

## Git Repository

**GitHub:** https://github.com/mmujtaba0085/knack-freelancer-marketplace

21 commits following [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `chore:`).

---

*© 2025 Knack Technologies — Built with ✦ for serious work.*
