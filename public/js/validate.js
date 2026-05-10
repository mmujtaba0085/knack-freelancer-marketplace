/* public/js/validate.js — Client-side form validation */

// ─── Password strength meter ──────────────────────────────────────────────────
const pwInput = document.getElementById('password');
const pwFill  = document.getElementById('pw-strength-fill');
const pwLabel = document.getElementById('pw-strength-label');
if (pwInput) {
  pwInput.addEventListener('input', () => {
    const v = pwInput.value;
    const checks = [v.length >= 8, /[A-Z]/.test(v), /[0-9]/.test(v), /[^A-Za-z0-9]/.test(v)];
    const score  = checks.filter(Boolean).length;
    const states = [
      { label: '',        color: '',                   w: '0%'   },
      { label: 'Weak',    color: 'var(--danger)',       w: '25%'  },
      { label: 'Fair',    color: '#F59E0B',             w: '50%'  },
      { label: 'Good',    color: 'var(--brand)',        w: '75%'  },
      { label: 'Strong',  color: 'var(--success)',      w: '100%' },
    ];
    if (pwFill) { pwFill.style.width = states[score].w; pwFill.style.background = states[score].color; }
    if (pwLabel){ pwLabel.textContent = states[score].label; pwLabel.style.color = states[score].color; }
    pwInput.setCustomValidity(score < 2 ? 'Password is too weak' : '');
  });
}

// ─── Confirm password match ───────────────────────────────────────────────────
const pwConfirm = document.getElementById('password_confirm');
if (pwConfirm && pwInput) {
  const check = () => {
    const errEl = document.getElementById('confirm-error');
    const match = pwInput.value === pwConfirm.value;
    pwConfirm.setCustomValidity(match ? '' : 'Passwords do not match');
    if (errEl) errEl.style.display = match ? 'none' : 'flex';
  };
  pwConfirm.addEventListener('input', check);
  pwInput.addEventListener('input', check);
}

// ─── Real-time required field feedback ───────────────────────────────────────
document.querySelectorAll('.form-input[required], .form-textarea[required]').forEach(input => {
  input.addEventListener('blur', () => {
    const errEl = input.parentElement.querySelector('.form-error');
    if (!errEl) return;
    if (!input.value.trim()) {
      input.classList.add('error');
      errEl.style.display = 'flex';
    } else {
      input.classList.remove('error');
      errEl.style.display = 'none';
    }
  });
  input.addEventListener('input', () => {
    if (input.value.trim()) {
      input.classList.remove('error');
      const errEl = input.parentElement.querySelector('.form-error');
      if (errEl) errEl.style.display = 'none';
    }
  });
});

// ─── Budget: max must exceed min ─────────────────────────────────────────────
const budgetMin = document.getElementById('budget_min');
const budgetMax = document.getElementById('budget_max');
if (budgetMin && budgetMax) {
  const checkBudget = () => {
    const errEl = document.getElementById('budget-error');
    const valid = !budgetMax.value || parseFloat(budgetMax.value) >= parseFloat(budgetMin.value);
    budgetMax.setCustomValidity(valid ? '' : 'Max must be ≥ min');
    if (errEl) errEl.style.display = valid ? 'none' : 'flex';
  };
  budgetMin.addEventListener('input', checkBudget);
  budgetMax.addEventListener('input', checkBudget);
}

// ─── Email format check ───────────────────────────────────────────────────────
document.querySelectorAll('input[type="email"]').forEach(input => {
  input.addEventListener('blur', () => {
    const errEl = input.parentElement.querySelector('.form-error[data-email]');
    if (!errEl) return;
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value);
    input.classList.toggle('error', !valid && input.value.length > 0);
    errEl.style.display = (!valid && input.value.length > 0) ? 'flex' : 'none';
  });
});
