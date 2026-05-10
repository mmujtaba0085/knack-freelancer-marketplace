/* public/js/browse.js — Debounced live job search */

const searchInput    = document.getElementById('job-search');
const categoryFilter = document.getElementById('category-filter');
const levelFilter    = document.getElementById('level-filter');
const jobGrid        = document.getElementById('job-grid');
const resultCount    = document.getElementById('result-count');

if (!searchInput || !jobGrid) { /* not on browse page */ }
else {
  let debounceTimer;

  const renderJobs = (jobs) => {
    if (!jobs.length) {
      jobGrid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-state-icon">◎</div>
          <h3>No jobs found</h3>
          <p>Try adjusting your search or filters.</p>
        </div>`;
      if (resultCount) resultCount.textContent = '0 jobs';
      return;
    }
    if (resultCount) resultCount.textContent = `${jobs.length} job${jobs.length !== 1 ? 's' : ''}`;
    jobGrid.innerHTML = jobs.map(j => `
      <a href="/jobs/${j.id}" class="job-card card-lift" style="display:block">
        <div class="flex items-center justify-between mb-8">
          <span class="badge badge-open">${j.category_name || 'General'}</span>
          <span class="text-muted text-sm">${timeAgo(j.created_at)}</span>
        </div>
        <div class="job-card-title">${escHtml(j.title)}</div>
        <div class="job-card-meta">
          <span>by ${escHtml(j.client_name)}</span>
        </div>
        <div class="flex items-center justify-between mt-16">
          <span class="job-card-budget">$${Number(j.budget_min).toLocaleString()}–$${Number(j.budget_max).toLocaleString()}</span>
          <span class="badge badge-${j.level}">${j.level}</span>
        </div>
      </a>
    `).join('');
  };

  const doSearch = async () => {
    const params = new URLSearchParams({
      q:        searchInput.value,
      category: categoryFilter ? categoryFilter.value : '',
      level:    levelFilter    ? levelFilter.value    : '',
    });
    try {
      jobGrid.innerHTML = Array(6).fill(0).map(() => `
        <div class="card"><div class="skeleton sk-title"></div><div class="skeleton sk-text"></div><div class="skeleton sk-text-sm"></div></div>
      `).join('');
      const res  = await fetch('/api/jobs/search?' + params);
      const jobs = await res.json();
      renderJobs(jobs);
    } catch { toast('Search failed', 'error'); }
  };

  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(doSearch, 320);
  });
  if (categoryFilter) categoryFilter.addEventListener('change', doSearch);
  if (levelFilter)    levelFilter.addEventListener('change', doSearch);

  function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 30)  return `${days}d ago`;
    return `${Math.floor(days / 30)}mo ago`;
  }

  function escHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
}
