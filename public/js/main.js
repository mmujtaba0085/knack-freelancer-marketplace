/* public/js/main.js — Knack global JS */

// ─── Toast system ─────────────────────────────────────────────────────────────
window.toast = function(msg, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateY(8px)'; el.style.transition = '.2s'; setTimeout(() => el.remove(), 200); }, 3500);
};

// ─── Hamburger nav ────────────────────────────────────────────────────────────
const hamburger = document.getElementById('nav-hamburger');
const mobileMenu = document.getElementById('mobile-menu');
if (hamburger && mobileMenu) {
  hamburger.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', mobileMenu.classList.contains('open'));
  });
  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!hamburger.contains(e.target) && !mobileMenu.contains(e.target)) {
      mobileMenu.classList.remove('open');
    }
  });
}

// ─── Avatar dropdown ──────────────────────────────────────────────────────────
const avatarBtn = document.getElementById('avatar-btn');
const avatarDropdown = document.getElementById('avatar-dropdown');
if (avatarBtn && avatarDropdown) {
  avatarBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    avatarDropdown.classList.toggle('open');
  });
  document.addEventListener('click', () => avatarDropdown.classList.remove('open'));
}

// ─── Notification badge polling ───────────────────────────────────────────────
const badge = document.getElementById('notif-badge');
if (badge) {
  const pollNotifs = async () => {
    try {
      const res = await fetch('/notifications/unread-count');
      if (!res.ok) return;
      const { count } = await res.json();
      badge.textContent = count > 9 ? '9+' : count;
      badge.classList.toggle('visible', count > 0);
    } catch {}
  };
  pollNotifs();
  setInterval(pollNotifs, 30000);
}

// ─── Flash messages as toasts ─────────────────────────────────────────────────
document.querySelectorAll('.flash-success').forEach(el => toast(el.dataset.msg, 'success'));
document.querySelectorAll('.flash-error').forEach(el => toast(el.dataset.msg, 'error'));

// ─── Confirm dangerous actions ────────────────────────────────────────────────
document.querySelectorAll('[data-confirm]').forEach(btn => {
  btn.addEventListener('click', (e) => {
    if (!confirm(btn.dataset.confirm)) e.preventDefault();
  });
});

// ─── Star rating picker ───────────────────────────────────────────────────────
const starWrap = document.getElementById('star-picker');
if (starWrap) {
  const input = document.getElementById('rating-input');
  const stars = starWrap.querySelectorAll('.star-pick');
  stars.forEach((s, i) => {
    s.addEventListener('mouseover', () => highlightStars(i + 1));
    s.addEventListener('mouseout',  () => highlightStars(parseInt(input.value) || 0));
    s.addEventListener('click',     () => { input.value = i + 1; highlightStars(i + 1); });
  });
  function highlightStars(n) {
    stars.forEach((s, i) => s.classList.toggle('filled', i < n));
  }
}
