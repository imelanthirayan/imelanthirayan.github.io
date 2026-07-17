// ── Current year in footer ──
document.getElementById('current-year').textContent = new Date().getFullYear();

// ── Theme toggle ──
(function initTheme() {
  const html    = document.documentElement;
  const btn     = document.getElementById('theme-toggle');
  const sunIcon = document.getElementById('theme-icon-sun');
  const moonIcon= document.getElementById('theme-icon-moon');
  if (!btn) return;

  const saved = localStorage.getItem('theme') || 'dark';
  html.setAttribute('data-theme', saved);
  updateIcons(saved);

  btn.addEventListener('click', () => {
    const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    updateIcons(next);
  });

  function updateIcons(theme) {
    const isLight = theme === 'light';
    sunIcon.classList.toggle('hidden', isLight);
    moonIcon.classList.toggle('hidden', !isLight);
  }
})();

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

// ── "More" dropdown toggle ──
const moreToggle   = document.getElementById('more-toggle');
const moreDropdown = document.getElementById('more-dropdown');
if (moreToggle && moreDropdown) {
  moreToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    moreDropdown.classList.toggle('hidden');
  });
  // Close on any link inside dropdown
  moreDropdown.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => moreDropdown.classList.add('hidden'));
  });
  // Close when clicking outside
  document.addEventListener('click', () => moreDropdown.classList.add('hidden'));
}

// ── Highlight active nav link on scroll ──
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-link');
const moreBtn  = document.querySelector('.more-btn');
const MORE_SECTIONS = new Set(['blog', 'media', 'github']);
// Sections not in nav; map to the nearest nav item to highlight
const NAV_ALIAS = { hobbies: 'contact' };

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.getAttribute('id');
      const activeId = NAV_ALIAS[id] || id;
      navLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === `#${activeId}`);
      });
      // Highlight More button when inside its child sections
      if (moreBtn) {
        moreBtn.classList.toggle('more-active', MORE_SECTIONS.has(id));
      }
    }
  });
}, { rootMargin: '-40% 0px -55% 0px' });

sections.forEach(s => observer.observe(s));

// ── Scroll-based navbar background ──
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  const scrolledBg = isLight ? 'rgba(248,250,252,0.97)' : 'rgba(10,10,15,0.92)';
  navbar.querySelector('.glass').style.backgroundColor = window.scrollY > 20 ? scrolledBg : '';
}, { passive: true });

// ── Fade-in on scroll ──
const fadeEls = document.querySelectorAll('article, .glass:not(header .glass):not(.no-fade)');
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

const backToTop = document.getElementById('back-to-top');
const progressRingBar = document.querySelector('.progress-ring-bar');
const RING_CIRCUMFERENCE = 113.097; // 2 * π * 18
window.addEventListener('scroll', () => {
  const scrolled = window.scrollY;
  if (scrolled > 400) {
    backToTop.classList.remove('opacity-0', 'translate-y-4', 'pointer-events-none');
    backToTop.classList.add('opacity-100', 'translate-y-0');
  } else {
    backToTop.classList.add('opacity-0', 'translate-y-4', 'pointer-events-none');
    backToTop.classList.remove('opacity-100', 'translate-y-0');
  }
  if (progressRingBar) {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? scrolled / docHeight : 0;
    progressRingBar.style.strokeDashoffset = RING_CIRCUMFERENCE * (1 - progress);
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

// ════════════════════════════════════════════
// TESTIMONIALS CAROUSEL
// ════════════════════════════════════════════
(function initTestimonialCarousel() {
  const slides = document.getElementById('testimonial-slides');
  const dots   = document.querySelectorAll('#testimonial-dots button');
  const total  = dots.length;
  let current  = 0;

  function collapseAll() {
    document.querySelectorAll('.testimonial-body').forEach(body => {
      body.style.maxHeight = '9rem';
      const fade = body.querySelector('.testimonial-fade');
      if (fade) fade.style.display = '';
    });
    document.querySelectorAll('.testimonial-toggle').forEach(btn => {
      btn.textContent = 'Read more ↓';
    });
  }

  function goTo(index) {
    collapseAll();
    current = (index + total) % total;
    slides.style.transform = `translateX(-${current * 100}%)`;
    dots.forEach((d, i) => {
      d.classList.toggle('bg-brand-400', i === current);
      d.classList.toggle('w-5', i === current);
      d.classList.toggle('bg-white/20', i !== current);
      d.classList.toggle('w-2.5', i !== current);
    });
  }

  document.getElementById('testimonial-prev').addEventListener('click', () => goTo(current - 1));
  document.getElementById('testimonial-next').addEventListener('click', () => goTo(current + 1));
  dots.forEach(d => d.addEventListener('click', () => goTo(+d.dataset.index)));

  // Auto-advance every 6 seconds, paused while any slide is expanded
  let timer = setInterval(() => goTo(current + 1), 6000);
  document.getElementById('testimonial-track').addEventListener('mouseenter', () => clearInterval(timer));
  document.getElementById('testimonial-track').addEventListener('mouseleave', () => {
    const anyExpanded = [...document.querySelectorAll('.testimonial-body')]
      .some(b => b.style.maxHeight === 'none');
    if (!anyExpanded) timer = setInterval(() => goTo(current + 1), 6000);
  });

  goTo(0);
})();

// TESTIMONIAL READ MORE / LESS
// ════════════════════════════════════════════
document.querySelectorAll('.testimonial-toggle').forEach(btn => {
  const body = btn.previousElementSibling;
  const fade = body.querySelector('.testimonial-fade');
  const track = document.getElementById('testimonial-track');
  btn.addEventListener('click', () => {
    const expanded = body.style.maxHeight === 'none';
    body.style.maxHeight = expanded ? '9rem' : 'none';
    fade.style.display = expanded ? '' : 'none';
    btn.textContent = expanded ? 'Read more ↓' : 'Read less ↑';
    // Dispatch a synthetic mouseleave/mouseenter to sync the auto-timer
    track.dispatchEvent(new Event(expanded ? 'mouseleave' : 'mouseenter'));
  });
});

// ════════════════════════════════════════════
// ANIMATIONS
// ════════════════════════════════════════════

// ── Typewriter effect for hero role title ──
(function initTypewriter() {
  const el = document.getElementById('hero-role');
  if (!el) return;
  const text = el.textContent.trim();
  el.textContent = '';
  let i = 0;
  const speed = 60;
  function type() {
    if (i < text.length) {
      el.textContent += text[i++];
      setTimeout(type, speed);
    } else {
      el.classList.remove('typing-active'); // remove cursor when done
    }
  }
  // Start after hero fade-in completes (hero-d4: 0.42s delay + 0.72s duration)
  setTimeout(() => {
    el.classList.add('typing-active');
    type();
  }, 1250);
})();// ── Animated counters ──
(function initCounters() {
  const els = document.querySelectorAll('[data-count-to]');
  if (!els.length) return;
  const counterObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.countTo, 10);
      const suffix = el.dataset.suffix || '';
      const duration = 2800;
      const start = performance.now();
      function tick(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(eased * target) + suffix;
        if (progress < 1) {
          requestAnimationFrame(tick);
        } else {
          el.classList.add('stat-popped');
          el.addEventListener('animationend', () => el.classList.remove('stat-popped'), { once: true });
        }
      }
      requestAnimationFrame(tick);
      counterObserver.unobserve(el);
    });
  }, { threshold: 0.5 });
  els.forEach(el => counterObserver.observe(el));
})();

// ── Staggered skill-badge pop-in on scroll ──
(function initBadgeStagger() {
  document.querySelectorAll('.skill-tags').forEach(container => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.querySelectorAll('.skill-badge').forEach((badge, i) => {
          badge.classList.add('badge-pop');
          badge.style.animationDelay = `${i * 45}ms`;
        });
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.1 });
    observer.observe(container);
  });
})();

// ── Section label line expand on scroll ──
(function initSectionLabels() {
  document.querySelectorAll('.section-label').forEach(label => {
    const lineLeft  = document.createElement('span');
    const lineRight = document.createElement('span');
    lineLeft.className  = 'section-label-line';
    lineRight.className = 'section-label-line';
    label.prepend(lineLeft);
    label.append(lineRight);
    label.dataset.animated = '1';
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          lineLeft.classList.add('expanded');
          lineRight.classList.add('expanded');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    observer.observe(label);
  });
})();
