/**
 * AI Concepts Playground — UI Components + App Controller
 * Namespaces: Components, AIPlayground
 */

/* ═══════════════════════════════════════════
   Topic Data
═══════════════════════════════════════════ */

const Components = {

  topics: [
    {
      id: 'tokens',
      icon: 'type',
      title: 'Tokens',
      description: 'See how AI breaks text into small pieces called tokens before processing it.',
      time: '8 min',
      difficulty: 'Beginner',
      color: 'pink',
      ready: true,
    },
    {
      id: 'vectors',
      icon: 'hash',
      title: 'Vectors',
      description: 'Understand how AI turns text into lists of numbers to find meaning and similarity.',
      time: '10 min',
      difficulty: 'Beginner',
      color: 'blue',
      ready: true,
    },
    {
      id: 'embeddings',
      icon: 'map-pin',
      title: 'Embeddings',
      description: 'See how AI maps words to points in space — similar words land closer together.',
      time: '10 min',
      difficulty: 'Beginner',
      color: 'teal',
      ready: true,
    },
    {
      id: 'similarity',
      icon: 'ruler',
      title: 'Similarity Metrics',
      description: 'Compare cosine similarity, Euclidean distance, and dot product side by side.',
      time: '10 min',
      difficulty: 'Beginner',
      color: 'orange',
      ready: true,
    },
    {
      id: 'knn',
      icon: 'search',
      title: 'KNN Search',
      description: 'Watch K-Nearest Neighbors find the most similar items to any query in real time.',
      time: '10 min',
      difficulty: 'Beginner',
      color: 'violet',
      ready: true,
    },
    {
      id: 'top-k',
      icon: 'filter',
      title: 'Top-K Search',
      description: 'See how AI scores every item and returns only the best K results — the secret behind fast, relevant search.',
      time: '8 min',
      difficulty: 'Beginner',
      color: 'green',
      ready: true,
    },
    {
      id: 'clustering',
      icon: 'circle-dot',
      title: 'Clustering',
      description: 'Watch items group themselves into clusters based on similarity — no labels needed.',
      time: '10 min',
      difficulty: 'Beginner',
      color: 'blue',
      ready: true,
    },
    {
      id: 'neural-networks',
      icon: 'brain',
      title: 'Neural Networks',
      description: 'See how artificial neurons connect, layer up, and learn patterns from raw data.',
      time: '15 min',
      difficulty: 'Beginner',
      color: 'violet',
      ready: false,
    },
    {
      id: 'gradient-descent',
      icon: 'trending-down',
      title: 'Gradient Descent',
      description: 'Watch an AI navigate a loss landscape and home in on the perfect solution.',
      time: '10 min',
      difficulty: 'Beginner',
      color: 'blue',
      ready: false,
    },
    {
      id: 'activation-functions',
      icon: 'zap',
      title: 'Activation Functions',
      description: 'Explore how neurons decide to fire — the switch that gives AI non-linear power.',
      time: '8 min',
      difficulty: 'Beginner',
      color: 'yellow',
      ready: false,
    },
    {
      id: 'training-loss',
      icon: 'bar-chart-2',
      title: 'Training & Loss',
      description: 'Understand how AI improves itself through trial, error, and measuring its mistakes.',
      time: '12 min',
      difficulty: 'Beginner',
      color: 'green',
      ready: false,
    },
    {
      id: 'classification',
      icon: 'layers',
      title: 'Classification',
      description: 'See how AI draws decision boundaries to separate different categories of data.',
      time: '15 min',
      difficulty: 'Beginner',
      color: 'teal',
      ready: false,
    },
    {
      id: 'decision-trees',
      icon: 'git-branch',
      title: 'Decision Trees',
      description: 'Explore how AI makes decisions through a cascading series of yes/no questions.',
      time: '10 min',
      difficulty: 'Beginner',
      color: 'orange',
      ready: false,
    },
  ],

  difficultyConfig: {
    Beginner:     { cls: 'badge-beginner',     emoji: '🟢' },
    Intermediate: { cls: 'badge-intermediate', emoji: '🟡' },
    Advanced:     { cls: 'badge-advanced',     emoji: '🔴' },
  },

  /* ═══════════════════════════════════════════
     Topic Card Component
  ═══════════════════════════════════════════ */

  createCard(topic) {
    const diff = this.difficultyConfig[topic.difficulty] ?? this.difficultyConfig.Beginner;
    const card = document.createElement('article');
    card.className = `topic-card card-${topic.color}`;
    card.setAttribute('data-id', topic.id);
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `${topic.title} — ${topic.difficulty}`);

    card.innerHTML = `
      <!-- Top row: icon + badges -->
      <div class="flex items-start justify-between gap-3">
        <div class="card-icon">
          <i data-lucide="${topic.icon}" style="width:22px;height:22px;stroke-width:1.8;"></i>
        </div>
        <div class="flex flex-col items-end gap-1.5 pt-0.5">
          ${!topic.ready ? `<span class="badge-soon">Coming Soon</span>` : ''}
          <span class="badge-progress">
            <i data-lucide="star" style="width:9px;height:9px;"></i>
            Future Ready
          </span>
        </div>
      </div>

      <!-- Body -->
      <div class="flex-1">
        <h3 class="card-title mb-2">${topic.title}</h3>
        <p class="card-description">${topic.description}</p>
      </div>

      <!-- Meta -->
      <div class="card-meta">
        <span class="meta-chip">
          <i data-lucide="clock" style="width:13px;height:13px;"></i>
          ${topic.time}
        </span>
        <span class="badge ${diff.cls}">${diff.emoji} ${topic.difficulty}</span>
      </div>

      <!-- CTA Button -->
      <button
        class="card-btn ${topic.ready ? 'card-btn-active' : 'card-btn-disabled'}"
        aria-label="${topic.ready ? 'Explore ' + topic.title : topic.title + ' coming soon'}"
        ${topic.ready ? '' : 'disabled'}
      >
        ${topic.ready
          ? `<span>Explore</span><i data-lucide="arrow-right" style="width:15px;height:15px;"></i>`
          : `<i data-lucide="lock" style="width:14px;height:14px;opacity:.5;"></i><span>Coming Soon</span>`
        }
      </button>
    `;

    /* Events */
    const btn = card.querySelector('.card-btn');
    const go  = () => { if (topic.ready) window.location.href = `./modules/${topic.id}.html`; else Utils.comingSoon(topic.title); };

    card.addEventListener('click', go);
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    btn.addEventListener('click', e => { e.stopPropagation(); go(); });

    return card;
  },

  /* ═══════════════════════════════════════════
     Render All Cards
  ═══════════════════════════════════════════ */

  renderCards(gridId = 'cardsGrid') {
    const grid = document.getElementById(gridId);
    if (!grid) return;

    this.topics.forEach(t => grid.appendChild(this.createCard(t)));

    lucide.createIcons();

    // Attach GSAP hover micro-interactions
    Utils.$$('.topic-card').forEach(c => Animations.addCardHover(c));
  },

  /* ═══════════════════════════════════════════
     Reusable: Explanation Card
     Used inside learning modules.
  ═══════════════════════════════════════════ */

  /**
   * @param {{ title?, body, icon?, type? }} opts
   * type: 'info' | 'tip' | 'warning' | 'key'
   */
  createExplanationCard({ title, body, icon = 'info', type = 'info' }) {
    const palette = {
      info:    { bg: 'rgba(99,102,241,0.06)',  border: 'rgba(99,102,241,0.2)',  color: '#6366f1' },
      tip:     { bg: 'rgba(5,150,105,0.06)',   border: 'rgba(5,150,105,0.2)',   color: '#059669' },
      warning: { bg: 'rgba(217,119,6,0.06)',   border: 'rgba(217,119,6,0.2)',   color: '#d97706' },
      key:     { bg: 'rgba(139,92,246,0.06)',  border: 'rgba(139,92,246,0.2)',  color: '#8b5cf6' },
    };
    const p = palette[type] ?? palette.info;

    const el = document.createElement('div');
    el.style.cssText = `
      padding:1.25rem 1.5rem;
      background:${p.bg};
      border:1px solid ${p.border};
      border-radius:1rem;
      display:flex; gap:0.875rem; align-items:flex-start;
    `;
    el.innerHTML = `
      <div style="color:${p.color};flex-shrink:0;margin-top:2px;">
        <i data-lucide="${icon}" style="width:18px;height:18px;"></i>
      </div>
      <div>
        ${title ? `<div style="font-weight:700;font-size:0.9375rem;margin-bottom:0.3rem;">${title}</div>` : ''}
        <div style="font-size:0.875rem;line-height:1.65;color:#64748b;">${body}</div>
      </div>
    `;
    lucide.createIcons({ nodes: [el] });
    return el;
  },

  /* ═══════════════════════════════════════════
     Reusable: Stats Panel
     Used inside learning modules.
  ═══════════════════════════════════════════ */

  /**
   * @param {Array<{label, value, unit?}>} stats
   */
  createStatsPanel(stats = []) {
    const panel = document.createElement('div');
    panel.style.cssText = `
      display:grid;
      grid-template-columns:repeat(auto-fit, minmax(110px, 1fr));
      gap:0.875rem;
    `;
    stats.forEach(({ label, value, unit = '' }) => {
      const s = document.createElement('div');
      const dark = Utils.isDark();
      s.style.cssText = `
        padding:1rem 0.875rem;
        background:${dark ? '#1e293b' : '#ffffff'};
        border:1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'};
        border-radius:1rem;
        text-align:center;
        box-shadow:0 1px 4px rgba(0,0,0,0.05);
      `;
      s.innerHTML = `
        <div style="font-size:1.5rem;font-weight:800;color:${dark ? '#f1f5f9' : '#0f172a'};">
          ${value}<span style="font-size:0.8125rem;font-weight:500;color:#94a3b8;">${unit}</span>
        </div>
        <div style="font-size:0.7rem;color:#94a3b8;margin-top:0.2rem;text-transform:uppercase;letter-spacing:0.05em;">${label}</div>
      `;
      panel.appendChild(s);
    });
    return panel;
  },

  /* ═══════════════════════════════════════════
     Reusable: Button Factory
  ═══════════════════════════════════════════ */

  createButton({ label, onClick, variant = 'primary', icon, disabled = false } = {}) {
    const btn = document.createElement('button');
    btn.className = variant === 'secondary' ? 'btn-secondary' : 'btn-primary';
    btn.disabled  = disabled;
    if (disabled) btn.style.opacity = '0.5';
    btn.innerHTML = icon
      ? `<i data-lucide="${icon}" style="width:16px;height:16px;"></i>${label}`
      : label;
    btn.addEventListener('click', onClick);
    lucide.createIcons({ nodes: [btn] });
    return btn;
  },

  /* ═══════════════════════════════════════════
     Reusable: Flow Step Row
     Used inside learning modules.
  ═══════════════════════════════════════════ */

  createFlowDiagram(steps = []) {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-wrap:wrap;gap:0.5rem;align-items:center;';

    steps.forEach((step, i) => {
      const node = document.createElement('div');
      node.style.cssText = `
        padding:0.5rem 1rem;
        background:rgba(99,102,241,0.08);
        border:1px solid rgba(99,102,241,0.18);
        border-radius:0.75rem;
        font-size:0.8125rem;
        font-weight:600;
        color:#6366f1;
      `;
      node.textContent = step;
      wrap.appendChild(node);

      if (i < steps.length - 1) {
        const arrow = document.createElement('span');
        arrow.style.cssText = 'color:#94a3b8;font-size:1.1rem;';
        arrow.textContent = '→';
        wrap.appendChild(arrow);
      }
    });
    return wrap;
  },
};

/* ═══════════════════════════════════════════
   App Controller
═══════════════════════════════════════════ */

const AIPlayground = {
  _cleanups: [],

  init() {
    /* 1 — Theme */
    Utils.loadDarkPreference();

    /* 2 — GSAP */
    Animations.init();

    /* 3 — Cards */
    Components.renderCards();

    /* 4 — Hero canvas */
    const cleanCanvas = Visualizations.heroNeuralNet('heroCanvas');
    if (cleanCanvas) this._cleanups.push(cleanCanvas);

    /* 5 — Hero entrance + counters */
    Animations.heroEntrance();
    Animations.heroCounters();

    /* 6 — Scroll effects (after a tick so cards are in DOM) */
    Animations.navbarScroll();
    requestAnimationFrame(() => {
      Animations.cardsReveal();
      Animations.sectionReveal();
    });

    /* 7 — UI bindings */
    this._bindDarkMode();
    this._bindMobileMenu();
    this._bindSmoothScroll();
  },

  /* ─── Dark Mode ──────────────────────────── */

  _bindDarkMode() {
    const sync = () => {
      const dark = Utils.isDark();
      Utils.$$('.icon-sun').forEach(el  => el.classList.toggle('hidden', dark));
      Utils.$$('.icon-moon').forEach(el => el.classList.toggle('hidden', !dark));
    };

    Utils.$$('[data-dark-toggle]').forEach(btn =>
      btn.addEventListener('click', () => { Utils.toggleDark(); sync(); })
    );

    sync();
  },

  /* ─── Mobile Menu ────────────────────────── */

  _bindMobileMenu() {
    const btn  = document.getElementById('mobileMenuBtn');
    const menu = document.getElementById('mobileMenu');
    if (!btn || !menu) return;

    let open = false;
    btn.addEventListener('click', () => {
      open = !open;
      menu.classList.toggle('hidden', !open);
      // swap icon
      const icon = btn.querySelector('[data-lucide]');
      if (icon) {
        icon.setAttribute('data-lucide', open ? 'x' : 'menu');
        lucide.createIcons({ nodes: [btn] });
      }
    });

    // Close on link click
    Utils.$$('a', menu).forEach(a =>
      a.addEventListener('click', () => { open = false; menu.classList.add('hidden'); })
    );
  },

  /* ─── Smooth Scroll ──────────────────────── */

  _bindSmoothScroll() {
    Utils.$$('a[href^="#"]').forEach(a => {
      a.addEventListener('click', e => {
        const id = a.getAttribute('href').slice(1);
        const el = document.getElementById(id);
        if (el) { e.preventDefault(); el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      });
    });
  },

  destroy() {
    this._cleanups.forEach(fn => fn());
    this._cleanups = [];
  },
};
