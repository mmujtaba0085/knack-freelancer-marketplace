# Knack · Freelancer Gig Management System

> The marketplace for serious work.

A full-stack web application connecting clients and freelancers — built for the university Web Programming course final project.

---

## Features

### Core
- **Three-role system** — Client, Freelancer, Admin with fully separate dashboards
- **Job marketplace** — Clients post jobs; freelancers browse, filter, and apply
- **Proposal system** — Cover letters, bid amounts, accept/reject workflow
- **Contract management** — Milestone progress bars, deliverable uploads, completion flow
- **Review & rating system** — 5-star reviews on completed contracts

### Security (rubric §4–7, 21–22)
- `bcrypt` password hashing at salt rounds 12 — plaintext never stored
- `bcrypt.compare()` for login — never string equality
- `express-session` with 30-min inactivity expiry and `httpOnly` cookies
- Session `regenerate()` on login — prevents session fixation
- Token-based password reset — crypto token hashed before DB storage, expires in 1 hour, single-use

### Access Control (rubric §8–12)
- Role stored in DB (`ENUM('client','freelancer','admin')`)
- `requireLogin` middleware on every protected route
- `requireRole('admin')` middleware — returns 403 to all other roles
- Frontend nav links change dynamically per role
- Admin panel completely inaccessible to clients and freelancers

### Validation (rubric §13–15)
- **Server-side**: `express-validator` chains on every form (sanitized, type-checked)
- **Client-side**: Real-time password strength meter, email format check, budget cross-validation
- Inline error messages per field — no generic alerts

### Advanced Features
- **AI match score** — weighted formula (skill overlap 60% + rating 20% + budget fit 20%)
- **Debounced live search** — job browse updates on keypress, no page reload
- **Chart.js dashboards** — earnings/spend charts per role, admin GMV reports
- **Real-time notification polling** — bell badge updates every 30 seconds
- **Toast notification system** — global slide-up toasts for all actions
- **File upload** — freelancers can attach deliverables (multer, 10MB limit)
- **Dispute system** — raise disputes on contracts, admin resolution panel
- **Responsive design** — mobile-first, hamburger nav, stacked layouts on small screens

---

## Tech Stack

| Layer      | Technology                                           |
|------------|------------------------------------------------------|
| Backend    | Node.js, Express 4                                   |
| Templating | EJS (server-side rendered)                           |
| Database   | MySQL 8 with indexes and FK constraints              |
| Auth       | express-session, bcrypt, connect-flash               |
| Validation | express-validator (server), Vanilla JS (client)      |
| Security   | express-rate-limit, multer (file sanitization)       |
| Frontend   | Custom CSS design system, Chart.js (CDN), Vanilla JS |
| Email      | Nodemailer (password reset)                          |

---

## Setup

### 1. Prerequisites
- Node.js 18+
- MySQL 8+

### 2. Clone & install
```bash
git clone https://github.com/yourusername/knack.git
cd knack
npm install
```

### 3. Configure environment
```bash
cp .env.example .env
# Edit .env with your database credentials and session secret
```

### 4. Set up database
```bash
mysql -u root -p < database/schema.sql
```

### 5. Seed test data
```bash
node database/seed.js
```

### 6. Start the server
```bash
npm run dev     # development (nodemon)
npm start       # production
```

Visit: **http://localhost:3000**

---

## Test Accounts

| Role       | Email                  | Password        |
|------------|------------------------|-----------------|
| Admin      | admin@knack.com        | Admin@123       |
| Client     | client@knack.com       | Client@123      |
| Freelancer | maya@knack.com         | Freelancer@123  |

---

## Project Structure

```
knack/
├── server.js               ← Entry point
├── .env.example            ← Environment template
├── database/
│   ├── schema.sql          ← Full DB schema + seed categories
│   └── seed.js             ← Test users and sample jobs
├── config/
│   ├── db.js               ← MySQL connection pool
│   └── mailer.js           ← Nodemailer wrapper
├── middleware/
│   ├── auth.js             ← requireLogin, requireRole, attachUser
│   ├── validate.js         ← express-validator rule chains
│   └── rateLimiter.js      ← Login brute-force protection
├── routes/                 ← One file per domain area
├── controllers/            ← Business logic
├── models/                 ← DB query functions
├── views/                  ← EJS templates
│   ├── layouts/            ← header.ejs, footer.ejs
│   ├── auth/               ← login, signup, forgot, reset
│   ├── client/             ← dashboard, jobs, proposals, contracts
│   ├── freelancer/         ← dashboard, browse, apply, contracts
│   ├── admin/              ← dashboard, users, disputes, reports
│   └── shared/             ← home, about, contact, profile, 403, 404
└── public/
    ├── css/style.css       ← Full Knack design system
    ├── js/main.js          ← Nav, toasts, notifications
    ├── js/validate.js      ← Client-side validation
    └── js/browse.js        ← Debounced live search
```

---

## Git Commit History

This project follows [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: project scaffold, db schema and base express server
feat: user signup and login with bcrypt password hashing
feat: session management, role middleware and 403 guards
feat: password reset with crypto token and 1hr expiry
feat: job posting form with server and client validation
feat: freelancer browse page with debounced live search and match score
feat: proposal submission and accept/reject by client
feat: role-specific dashboards with Chart.js analytics
feat: notification polling system and toast UI
feat: admin user management with activate/deactivate and role change
feat: contracts system with milestone progress and deliverable upload
feat: reviews, ratings and dispute resolution
feat: responsive navbar, footer, home/about/contact pages
fix: session regeneration on login to prevent fixation attack
docs: README with full setup guide and feature documentation
```

---

## Security Notes

- All passwords hashed with bcrypt (cost factor 12)
- Password reset tokens hashed with bcrypt before DB storage
- Sessions use `httpOnly` cookies (inaccessible to JavaScript)
- Session expires after 30 minutes of inactivity
- Login rate-limited to 10 attempts per 15 minutes
- All form inputs sanitized via express-validator before DB queries
- File uploads sanitized (filename normalization, 10MB size limit)

---

*Built with ✦ — Knack Technologies*
