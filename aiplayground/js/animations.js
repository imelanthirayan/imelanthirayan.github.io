/**
 * AI Concepts Playground - Animation Utilities  (GSAP)
 * Namespace: Animations
 */

const Animations = {
  _ready: false,

  init() {
    if (this._ready || typeof gsap === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);
    this._ready = true;
  },

  /* ─────────────────────────────────────────
     Core Presets
  ───────────────────────────────────────── */

  fadeInUp(targets, { y = 40, duration = 0.8, delay = 0, stagger = 0, ease = 'power3.out' } = {}) {
    return gsap.fromTo(targets,
      { y, opacity: 0 },
      { y: 0, opacity: 1, duration, delay, stagger, ease, clearProps: 'transform,opacity' }
    );
  },

  fadeIn(targets, { duration = 0.6, delay = 0, stagger = 0 } = {}) {
    return gsap.fromTo(targets,
      { opacity: 0 },
      { opacity: 1, duration, delay, stagger, ease: 'power2.out' }
    );
  },

  scaleIn(targets, { fromScale = 0.82, duration = 0.55, delay = 0, stagger = 0.06 } = {}) {
    return gsap.fromTo(targets,
      { scale: fromScale, opacity: 0 },
      { scale: 1, opacity: 1, duration, delay, stagger, ease: 'back.out(1.7)' }
    );
  },

  slideInLeft(targets, { x = -50, duration = 0.7, delay = 0, stagger = 0 } = {}) {
    return gsap.fromTo(targets,
      { x, opacity: 0 },
      { x: 0, opacity: 1, duration, delay, stagger, ease: 'power3.out' }
    );
  },

  /* ─────────────────────────────────────────
     Counter
  ───────────────────────────────────────── */

  counter(el, target, { duration = 1.5, delay = 0, prefix = '', suffix = '' } = {}) {
    const proxy = { v: 0 };
    return gsap.to(proxy, {
      v: target,
      duration,
      delay,
      ease: 'power2.out',
      onUpdate() { el.textContent = prefix + Math.round(proxy.v) + suffix; },
    });
  },

  /* ─────────────────────────────────────────
     Scroll Reveals
  ───────────────────────────────────────── */

  scrollReveal(targets, { y = 50, duration = 0.8, stagger = 0.1, start = 'top 82%' } = {}) {
    if (!targets || (Array.isArray(targets) && !targets.length)) return;
    const trigger = Array.isArray(targets) ? targets[0] : targets;
    return gsap.fromTo(targets,
      { y, opacity: 0 },
      {
        y: 0, opacity: 1, duration, ease: 'power3.out', stagger,
        scrollTrigger: { trigger, start, toggleActions: 'play none none none' },
      }
    );
  },

  /* ─────────────────────────────────────────
     Hero Entrance Sequence
  ───────────────────────────────────────── */

  heroEntrance() {
    const ids = ['#heroBadge','#heroTitle','#heroSubtitle','#heroCTAs','#heroStats'];
    gsap.set(ids, { y: 28, opacity: 0 });

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' }, delay: 0.15 });
    tl.to('#heroBadge',    { opacity: 1, y: 0, duration: 0.7 })
      .to('#heroTitle',    { opacity: 1, y: 0, duration: 0.9 }, '-=0.45')
      .to('#heroSubtitle', { opacity: 1, y: 0, duration: 0.75 }, '-=0.5')
      .to('#heroCTAs',     { opacity: 1, y: 0, duration: 0.7 }, '-=0.4')
      .to('#heroStats',    { opacity: 1, y: 0, duration: 0.6 }, '-=0.3');
    return tl;
  },

  /* ─────────────────────────────────────────
     Navbar Scroll Effect
  ───────────────────────────────────────── */

  navbarScroll() {
    const nav = document.getElementById('navbar');
    if (!nav) return;
    ScrollTrigger.create({
      start: 'top -64',
      onEnter:     () => nav.classList.add('nav-scrolled'),
      onLeaveBack: () => nav.classList.remove('nav-scrolled'),
    });
  },

  /* ─────────────────────────────────────────
     Card Reveal
  ───────────────────────────────────────── */

  cardsReveal() {
    const cards = Utils.$$('.topic-card');
    if (!cards.length) return;
    this.scrollReveal(cards, { y: 60, duration: 0.72, stagger: 0.09, start: 'top 86%' });
  },

  /* ─────────────────────────────────────────
     Hero Stat Counters
  ───────────────────────────────────────── */

  heroCounters() {
    Utils.$$('.stat-number').forEach((el, i) => {
      const target = parseInt(el.dataset.target ?? '0', 10);
      this.counter(el, target, { delay: 0.85 + i * 0.15 });
    });
  },

  /* ─────────────────────────────────────────
     Section Header Reveal
  ───────────────────────────────────────── */

  sectionReveal() {
    const els = Utils.$$('.section-reveal');
    if (!els.length) return;
    this.scrollReveal(els, { stagger: 0.12, start: 'top 87%' });
  },

  /* ─────────────────────────────────────────
     Card Hover Micro-interactions (GSAP)
  ───────────────────────────────────────── */

  addCardHover(card) {
    const icon = card.querySelector('.card-icon');
    if (!icon) return;
    card.addEventListener('mouseenter', () =>
      gsap.to(icon, { scale: 1.14, rotation: -8, duration: 0.3, ease: 'back.out(2)' })
    );
    card.addEventListener('mouseleave', () =>
      gsap.to(icon, { scale: 1, rotation: 0, duration: 0.3, ease: 'power2.out' })
    );
  },

  /* ─────────────────────────────────────────
     Confetti Celebration
     Fires colorful particles from a given origin.
  ───────────────────────────────────────── */

  celebrate({ count = 60, originX = 0.5, originY = 0.4 } = {}) {
    const colors = ['#6366f1','#a78bfa','#34d399','#f59e0b','#f472b6','#60a5fa','#fb923c'];

    const container = document.createElement('div');
    container.setAttribute('aria-hidden', 'true');
    container.style.cssText =
      'position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden;';
    document.body.appendChild(container);

    for (let i = 0; i < count; i++) {
      const el = document.createElement('div');
      const color  = colors[i % colors.length];
      const size   = Utils.random(6, 14);
      const isCirc = Math.random() > 0.5;
      el.style.cssText = `
        position:absolute;
        width:${size}px;height:${size}px;
        background:${color};
        border-radius:${isCirc ? '50%' : '2px'};
        left:${originX * 100}%;
        top:${originY * 100}%;
        opacity:1;
      `;
      container.appendChild(el);

      const angle    = Math.random() * Math.PI * 2;
      const dist     = Utils.random(120, 480);
      const duration = Utils.random(0.9, 1.6);

      gsap.to(el, {
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist - Utils.random(80, 220),
        rotation: Utils.random(-540, 540),
        opacity: 0,
        duration,
        delay: Math.random() * 0.25,
        ease: 'power2.out',
      });
    }

    setTimeout(() => container.remove(), 2200);
  },

  /* ─────────────────────────────────────────
     Pulse Highlight
     Adds a glowing ring-pulse to any element.
  ───────────────────────────────────────── */

  pulseHighlight(el, color = '#6366f1') {
    if (!el || typeof gsap === 'undefined') return;
    gsap.fromTo(el,
      { boxShadow: `0 0 0 0 ${color}88` },
      { boxShadow: `0 0 0 14px ${color}00`, duration: 0.75, ease: 'power2.out' }
    );
  },

  /* ─────────────────────────────────────────
     Typewriter
     Animates text character-by-character.
     Returns a cancel function.
  ───────────────────────────────────────── */

  typewriter(el, text, { speed = 38, cursor = true, onDone } = {}) {
    if (!el) return () => {};
    el.textContent = '';
    if (cursor) el.classList.add('aip-cursor');

    let i = 0;
    const tick = setInterval(() => {
      el.textContent += text[i++];
      if (i >= text.length) {
        clearInterval(tick);
        if (cursor) setTimeout(() => el.classList.remove('aip-cursor'), 800);
        onDone?.();
      }
    }, speed);

    return () => { clearInterval(tick); el.classList.remove('aip-cursor'); };
  },

  /* ─────────────────────────────────────────
     Shimmer (loading skeleton pulse)
  ───────────────────────────────────────── */

  shimmer(el) {
    if (!el || typeof gsap === 'undefined') return;
    el.classList.add('aip-shimmer');
    return () => el.classList.remove('aip-shimmer');
  },
};
