// ── Current year in footer ──
document.getElementById('current-year').textContent = new Date().getFullYear();

// ── Mobile menu toggle ──
const menuToggle  = document.getElementById('menu-toggle');
const mobileMenu  = document.getElementById('mobile-menu');
const iconOpen    = document.getElementById('menu-icon-open');
const iconClose   = document.getElementById('menu-icon-close');

menuToggle.addEventListener('click', () => {
  const isOpen = mobileMenu.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(isOpen));
  iconOpen.classList.toggle('hidden', isOpen);
  iconClose.classList.toggle('hidden', !isOpen);
});

// ── Close mobile menu on link click ──
document.querySelectorAll('.mobile-nav-link').forEach(link => {
  link.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
    iconOpen.classList.remove('hidden');
    iconClose.classList.add('hidden');
  });
});

// ── Highlight active nav link on scroll ──
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-link');

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.getAttribute('id');
      navLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
      });
    }
  });
}, { rootMargin: '-40% 0px -55% 0px' });

sections.forEach(s => observer.observe(s));

// ── Scroll-based navbar background ──
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  if (window.scrollY > 20) {
    navbar.querySelector('.glass').style.backgroundColor = 'rgba(10,10,15,0.92)';
  } else {
    navbar.querySelector('.glass').style.backgroundColor = '';
  }
}, { passive: true });

// ── Fade-in on scroll ──
const fadeEls = document.querySelectorAll('article, .glass:not(header .glass)');
const fadeObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
      fadeObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.08 });

fadeEls.forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = 'opacity 0.55s ease, transform 0.55s ease';
  fadeObserver.observe(el);
});

// ════════════════════════════════════════════
// MEDIUM BLOG FEED
// Uses rss2json.com to bypass CORS on the Medium RSS feed.
// ════════════════════════════════════════════
(function loadMediumPosts() {
  const FEED_URL  = 'https://medium.com/feed/@elanthirayan';
  const API_URL   = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(FEED_URL)}`;

  const grid    = document.getElementById('blog-grid');
  const loading = document.getElementById('blog-loading');
  const error   = document.getElementById('blog-error');

  // Category → colour map (matches skill-badge palette)
  const TAG_COLORS = {
    'ai': '#f9a8d4', 'machine-learning': '#f9a8d4', 'neural-networks': '#f9a8d4',
    'cloud': '#7dd3fc', 'azure': '#7dd3fc', 'hpc': '#7dd3fc',
    'unity': '#86efac', 'unity-game-development': '#86efac', 'game-development': '#86efac',
    'database': '#fcd34d', 'graph-database': '#fcd34d',
    'web': '#a5b4fc', 'http': '#a5b4fc', 'http-status-code': '#a5b4fc',
    '3d': '#67e8f9', 'openusd': '#67e8f9', 'rendering': '#67e8f9',
    'default': '#a5b4fc',
  };

  function tagColor(tag) {
    const t = tag.toLowerCase().replace(/\s+/g, '-');
    return TAG_COLORS[t] || TAG_COLORS['default'];
  }

  function stripHtml(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    return (div.textContent || div.innerText || '').replace(/\s+/g, ' ').trim();
  }

  function truncate(str, max) {
    if (!str || str.length <= max) return str;
    return str.slice(0, max).replace(/\s+\S*$/, '') + '…';
  }

  function formatDate(dateStr) {
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch { return ''; }
  }

  const ACCENTS = [
    'from-brand-500 to-accent-400',
    'from-rose-500 to-orange-400',
    'from-cyan-500 to-teal-400',
    'from-amber-500 to-yellow-400',
    'from-violet-500 to-purple-400',
    'from-sky-500 to-blue-400',
  ];

  const ICONS = {
    ai: `<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>`,
    cloud: `<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999A5.002 5.002 0 003 15z"/></svg>`,
    code: `<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>`,
    default: `<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>`,
  };

  function pickIcon(cats) {
    const c = (cats || []).join(' ').toLowerCase();
    if (c.match(/ai|machine.learning|neural|nlp|gpt|llm/)) return ICONS.ai;
    if (c.match(/cloud|azure|aws|hpc|devops|airflow/)) return ICONS.cloud;
    if (c.match(/code|programming|api|http|web|javascript|python/)) return ICONS.code;
    return ICONS.default;
  }

  function buildCard(item, idx) {
    const title   = item.title || 'Untitled';
    const link    = item.link  || '#';
    const date    = formatDate(item.pubDate);
    const cats    = (item.categories || []).slice(0, 3);
    const snippet = truncate(stripHtml(item.description || item.content || ''), 160);
    const accent  = ACCENTS[idx % ACCENTS.length];
    const icon    = pickIcon(item.categories);
    const thumb   = item.thumbnail;

    const tagsHtml = cats.map(tag => {
      const col = tagColor(tag);
      return `<span class="tech-badge" style="border-color:${col}33;color:${col};background:${col}15;">${tag}</span>`;
    }).join('');

    const thumbHtml = thumb
      ? `<div class="relative h-40 overflow-hidden">
           <img src="${thumb}" alt="${title}" loading="lazy" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
           <div class="absolute inset-0 bg-gradient-to-t from-white/60 to-transparent"></div>
         </div>`
      : '';

    return `
    <article class="glass glass-hover rounded-2xl overflow-hidden flex flex-col group">
      <div class="h-1.5 bg-gradient-to-r ${accent}"></div>
      ${thumbHtml}
      <div class="p-5 flex flex-col flex-1">
        <div class="flex items-start gap-3 mb-3">
          <div class="w-9 h-9 rounded-lg bg-brand-500/15 border border-brand-500/20 flex items-center justify-center flex-shrink-0 text-brand-400">
            ${icon}
          </div>
          <div class="flex-1 min-w-0">
            ${date ? `<time class="text-xs text-slate-600 font-mono">${date}</time>` : ''}
            <h3 class="text-sm font-semibold text-slate-200 leading-snug mt-0.5 line-clamp-2 group-hover:text-brand-300 transition-colors">${title}</h3>
          </div>
        </div>
        ${snippet ? `<p class="text-xs text-slate-600 leading-relaxed mb-4 flex-1 line-clamp-3">${snippet}</p>` : '<div class="flex-1"></div>'}
        ${tagsHtml ? `<div class="flex flex-wrap gap-1.5 mb-4">${tagsHtml}</div>` : ''}
        <a href="${link}" target="_blank" rel="noopener noreferrer"
           class="mt-auto inline-flex items-center gap-1.5 text-xs font-semibold text-brand-400 hover:text-brand-300 transition-colors group/link">
          Read article
          <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 transition-transform group-hover/link:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
        </a>
      </div>
    </article>`;
  }

  fetch(API_URL)
    .then(r => { if (!r.ok) throw new Error('Network error'); return r.json(); })
    .then(data => {
      loading.classList.add('hidden');
      if (data.status !== 'ok' || !data.items || data.items.length === 0) throw new Error('No items');
      const posts = data.items.slice(0, 6);
      grid.innerHTML = posts.map((item, i) => buildCard(item, i)).join('');
      grid.classList.remove('hidden');
      grid.querySelectorAll('article').forEach((el) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.55s ease, transform 0.55s ease';
        fadeObserver.observe(el);
      });
      document.getElementById('blog-show-more').style.display = 'block';
    })
    .catch(() => {
      loading.classList.add('hidden');
      error.classList.remove('hidden');
    });
})();

// ════════════════════════════════════════════
// YOUTUBE FEED
// Uses rss2json.com to bypass CORS on the YouTube RSS feed.
// Channel: @ElanthirayanMadhavan  |  ID: UCGxrfvamHDZuyq2E5ZV1H0w
// ════════════════════════════════════════════
(function loadYouTubeVideos() {
  const YT_FEED = 'https://www.youtube.com/feeds/videos.xml?channel_id=UCGxrfvamHDZuyq2E5ZV1H0w';
  const YT_API  = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(YT_FEED)}`;

  const ytGrid    = document.getElementById('yt-grid');
  const ytLoading = document.getElementById('yt-loading');
  const ytError   = document.getElementById('yt-error');

  function ytFormatDate(dateStr) {
    try { return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch { return ''; }
  }

  function extractVideoId(link) {
    const m = (link || '').match(/[?&]v=([^&]+)/);
    return m ? m[1] : null;
  }

  function buildVideoCard(item) {
    const title = item.title || 'Untitled';
    const link  = item.link  || '#';
    const date  = ytFormatDate(item.pubDate);
    const vidId = extractVideoId(link);
    const thumb = vidId
      ? `https://i.ytimg.com/vi/${vidId}/hqdefault.jpg`
      : (item.thumbnail || '');

    return `
    <article class="glass glass-hover rounded-2xl overflow-hidden flex flex-col group">
      <a href="${link}" target="_blank" rel="noopener noreferrer" class="relative block overflow-hidden" aria-label="Watch: ${title}">
        <img src="${thumb}" alt="${title}" loading="lazy"
             class="w-full aspect-video object-cover transition-transform duration-500 group-hover:scale-105" />
        <div class="absolute inset-0 bg-gradient-to-t from-white/30 via-white/10 to-transparent"></div>
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="w-12 h-12 rounded-full bg-red-600/90 flex items-center justify-center shadow-lg
                      transition-transform duration-300 group-hover:scale-110 group-hover:bg-red-500">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-white translate-x-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
        <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500 to-rose-400
                    scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
      </a>
      <div class="p-4 flex flex-col flex-1">
        ${date ? `<time class="text-xs text-slate-600 font-mono mb-1.5">${date}</time>` : ''}
        <h3 class="text-sm font-semibold text-slate-200 leading-snug line-clamp-2 group-hover:text-red-300 transition-colors flex-1">
          ${title}
        </h3>
        <a href="${link}" target="_blank" rel="noopener noreferrer"
           class="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-red-400 hover:text-red-300 transition-colors group/link">
          Watch on YouTube
          <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 transition-transform group-hover/link:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
        </a>
      </div>
    </article>`;
  }

  fetch(YT_API)
    .then(r => { if (!r.ok) throw new Error('Network error'); return r.json(); })
    .then(data => {
      ytLoading.classList.add('hidden');
      if (data.status !== 'ok' || !data.items || data.items.length === 0) throw new Error('No items');
      ytGrid.innerHTML = data.items.slice(0, 6).map(v => buildVideoCard(v)).join('');
      ytGrid.classList.remove('hidden');
      ytGrid.querySelectorAll('article').forEach((el) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.55s ease, transform 0.55s ease';
        fadeObserver.observe(el);
      });
      document.getElementById('yt-show-more').style.display = 'block';
    })
    .catch(() => {
      ytLoading.classList.add('hidden');
      ytError.classList.remove('hidden');
    });
})();

// ════════════════════════════════════════════
// GITHUB REPOSITORIES
// Uses the public GitHub REST API (no CORS issues for public repos).
// Username: imelanthirayan
// ════════════════════════════════════════════
(function loadGitHubRepos() {
  const GH_API = 'https://api.github.com/users/imelanthirayan/repos?sort=updated&per_page=9&type=public';

  const grid    = document.getElementById('gh-grid');
  const loading = document.getElementById('gh-loading');
  const error   = document.getElementById('gh-error');

  const LANG_COLORS = {
    'JavaScript': '#f7df1e', 'TypeScript': '#3178c6', 'Python': '#3572A5',
    'HTML': '#e34c26', 'CSS': '#563d7c', 'C#': '#178600',
    'Java': '#b07219', 'Go': '#00ADD8', 'Rust': '#dea584',
    'Shell': '#89e051', 'Vue': '#41b883', 'Svelte': '#ff3e00',
  };

  const ACCENTS = [
    'from-teal-500 to-cyan-400',
    'from-cyan-500 to-sky-400',
    'from-teal-600 to-teal-400',
    'from-sky-500 to-cyan-400',
    'from-cyan-600 to-teal-400',
    'from-teal-500 to-sky-400',
  ];

  function formatDate(dateStr) {
    try { return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch { return ''; }
  }

  function buildRepoCard(repo, idx) {
    const name        = repo.name || 'Untitled';
    const description = repo.description || '';
    const link        = repo.html_url || '#';
    const homepage    = repo.homepage || '';
    const language    = repo.language || '';
    const stars       = repo.stargazers_count || 0;
    const forks       = repo.forks_count || 0;
    const topics      = (repo.topics || []).slice(0, 3);
    const updated     = formatDate(repo.updated_at);
    const accent      = ACCENTS[idx % ACCENTS.length];
    const langColor   = LANG_COLORS[language] || '#2dd4bf';

    const topicsHtml = topics.map(t =>
      `<span class="tech-badge" style="border-color:${langColor}33;color:${langColor};background:${langColor}15;">${t}</span>`
    ).join('');

    const langBadge = language
      ? `<span class="inline-flex items-center gap-1 text-xs text-slate-600">
           <span class="w-2.5 h-2.5 rounded-full flex-shrink-0" style="background:${langColor};"></span>
           ${language}
         </span>`
      : '';

    const statsHtml = `
      <div class="flex items-center gap-3 text-xs text-slate-600">
        ${langBadge}
        ${stars > 0 ? `<span class="inline-flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          ${stars}
        </span>` : ''}
        ${forks > 0 ? `<span class="inline-flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 3v9a3 3 0 003 3h6m0 0V9m0 6l3-3m-3 3l-3-3"/></svg>
          ${forks}
        </span>` : ''}
      </div>`;

    const liveLink = homepage
      ? `<a href="${homepage}" target="_blank" rel="noopener noreferrer"
            class="inline-flex items-center gap-1.5 text-xs font-semibold text-accent-400 hover:text-accent-300 transition-colors group/link">
           Live
           <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
         </a>`
      : '';

    return `
    <article class="glass glass-hover rounded-2xl overflow-hidden flex flex-col group">
      <div class="h-1.5 bg-gradient-to-r ${accent}"></div>
      <div class="p-5 flex flex-col flex-1">
        <div class="flex items-start gap-3 mb-3">
          <div class="w-9 h-9 rounded-lg bg-teal-500/15 border border-teal-500/20 flex items-center justify-center flex-shrink-0 text-teal-400">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
          </div>
          <div class="flex-1 min-w-0">
            ${updated ? `<time class="text-xs text-slate-600 font-mono">Updated ${updated}</time>` : ''}
            <h3 class="text-sm font-semibold text-slate-200 leading-snug mt-0.5 truncate group-hover:text-teal-300 transition-colors">${name}</h3>
          </div>
        </div>
        ${description ? `<p class="text-xs text-slate-600 leading-relaxed mb-4 flex-1 line-clamp-3">${description}</p>` : '<div class="flex-1"></div>'}
        ${topicsHtml ? `<div class="flex flex-wrap gap-1.5 mb-4">${topicsHtml}</div>` : ''}
        <div class="mt-auto flex items-center justify-between gap-2 flex-wrap">
          ${statsHtml}
          <div class="flex items-center gap-3">
            ${liveLink}
            <a href="${link}" target="_blank" rel="noopener noreferrer"
               class="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-400 hover:text-teal-300 transition-colors group/link">
              View repo
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 transition-transform group-hover/link:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
            </a>
          </div>
        </div>
      </div>
    </article>`;
  }

  fetch(GH_API, { headers: { 'Accept': 'application/vnd.github+json' } })
    .then(r => { if (!r.ok) throw new Error('Network error'); return r.json(); })
    .then(repos => {
      loading.classList.add('hidden');
      const publicRepos = repos.filter(r => !r.fork && !r.name.endsWith('.github.io')).slice(0, 6);
      if (!publicRepos.length) throw new Error('No repos');
      grid.innerHTML = publicRepos.map((repo, i) => buildRepoCard(repo, i)).join('');
      grid.classList.remove('hidden');
      grid.querySelectorAll('article').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.55s ease, transform 0.55s ease';
        fadeObserver.observe(el);
      });
      document.getElementById('gh-show-more').style.display = 'block';
    })
    .catch(() => {
      loading.classList.add('hidden');
      error.classList.remove('hidden');
    });
})();
const backToTop = document.getElementById('back-to-top');
window.addEventListener('scroll', () => {
  if (window.scrollY > 400) {
    backToTop.classList.remove('opacity-0', 'translate-y-4', 'pointer-events-none');
    backToTop.classList.add('opacity-100', 'translate-y-0');
  } else {
    backToTop.classList.add('opacity-0', 'translate-y-4', 'pointer-events-none');
    backToTop.classList.remove('opacity-100', 'translate-y-0');
  }
});
backToTop.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ── Mobile: show more cards ──
function toggleMobileCards(gridId, btnWrapperId) {
  const grid = document.getElementById(gridId);
  const btn = document.querySelector(`#${btnWrapperId} button`);
  const expanded = grid.classList.toggle('show-all');
  btn.textContent = expanded ? 'Show less ↑' : 'Show more ↓';
  if (!expanded) {
    grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// ── Experience "Read more" toggle (always injected; CSS hides button on desktop) ──
document.querySelectorAll('.exp-ul').forEach(ul => {
  const wrap = document.createElement('div');
  wrap.className = 'exp-ul-wrap';
  ul.parentNode.insertBefore(wrap, ul);
  wrap.appendChild(ul);

  // Pull the tech-badges div (next sibling) into the wrap so it collapses too
  const techBadges = wrap.nextElementSibling;
  if (techBadges && techBadges.classList.contains('flex')) {
    wrap.appendChild(techBadges);
  }

  const btn = document.createElement('button');
  btn.textContent = 'Read more';
  btn.className = 'exp-read-more text-xs text-brand-400 hover:text-brand-300 mt-2 transition-colors';
  btn.addEventListener('click', () => {
    wrap.classList.toggle('expanded');
    btn.textContent = wrap.classList.contains('expanded') ? 'Show less' : 'Read more';
  });
  wrap.parentNode.insertBefore(btn, wrap.nextSibling);
});

// ── Skill panel badge "Read more" toggle (CSS collapses on mobile) ──
document.querySelectorAll('.skill-tags').forEach(wrap => {
  const btn = document.createElement('button');
  btn.textContent = 'Read more';
  btn.className = 'skill-read-more text-xs text-brand-400 hover:text-brand-300 mt-2 transition-colors';
  btn.addEventListener('click', () => {
    wrap.classList.toggle('expanded');
    btn.textContent = wrap.classList.contains('expanded') ? 'Show less' : 'Read more';
  });
  wrap.parentNode.insertBefore(btn, wrap.nextSibling);
});

// ── About bio "Read more" toggle (CSS hides button on desktop) ──
const aboutBio = document.querySelector('.about-bio-wrap');
if (aboutBio) {
  const btn = document.createElement('button');
  btn.textContent = 'Read more';
  btn.className = 'about-read-more text-xs text-brand-400 hover:text-brand-300 mt-3 transition-colors';
  btn.addEventListener('click', () => {
    aboutBio.classList.toggle('expanded');
    btn.textContent = aboutBio.classList.contains('expanded') ? 'Show less' : 'Read more';
  });
  aboutBio.parentNode.insertBefore(btn, aboutBio.nextSibling);
}
