/**
 * AI Concepts Playground — Shared Utilities
 * Namespace: Utils
 */

const Utils = {

  /* ─────────────────────────────────────────
     Dark Mode
  ───────────────────────────────────────── */

  isDark() {
    return document.documentElement.classList.contains('dark');
  },

  setDark(enabled) {
    document.documentElement.classList.toggle('dark', enabled);
    localStorage.setItem('aip_dark', enabled ? '1' : '0');
  },

  toggleDark() {
    this.setDark(!this.isDark());
  },

  loadDarkPreference() {
    const saved = localStorage.getItem('aip_dark');
    if (saved !== null) {
      this.setDark(saved === '1');
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      this.setDark(true);
    }
  },

  /* ─────────────────────────────────────────
     DOM Helpers
  ───────────────────────────────────────── */

  $(sel, ctx = document)  { return ctx.querySelector(sel); },
  $$(sel, ctx = document) { return [...ctx.querySelectorAll(sel)]; },

  on(el, event, fn, opts) {
    if (!el) return () => {};
    el.addEventListener(event, fn, opts);
    return () => el.removeEventListener(event, fn, opts);
  },

  /* ─────────────────────────────────────────
     Notifications  (SweetAlert2 wrappers)
  ───────────────────────────────────────── */

  toast(message, type = 'info') {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: type,
      title: message,
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    });
  },

  comingSoon(title) {
    const dark = this.isDark();
    Swal.fire({
      title: '🚀 Coming Soon!',
      html: `
        <p style="font-size:15px;color:${dark ? '#94a3b8' : '#475569'};">
          <strong style="color:#6366f1;">${title}</strong> is being crafted.<br>
          <span style="font-size:13px;display:block;margin-top:6px;">
            Check back soon for this interactive module!
          </span>
        </p>`,
      confirmButtonText: "Can't wait! →",
      confirmButtonColor: '#6366f1',
      background: dark ? '#1e293b' : '#ffffff',
      color: dark ? '#f1f5f9' : '#0f172a',
      customClass: { popup: 'rounded-2xl', confirmButton: 'rounded-xl' },
    });
  },

  /* ─────────────────────────────────────────
     Math
  ───────────────────────────────────────── */

  clamp:     (v, lo, hi)             => Math.min(Math.max(v, lo), hi),
  lerp:      (a, b, t)               => a + (b - a) * t,
  map:       (v, i0, i1, o0, o1)    => o0 + ((v - i0) / (i1 - i0)) * (o1 - o0),
  random:    (lo, hi)                => Math.random() * (hi - lo) + lo,
  randomInt: (lo, hi)                => Math.floor(Math.random() * (hi - lo + 1)) + lo,
  dist:      (x1, y1, x2, y2)       => Math.hypot(x2 - x1, y2 - y1),
  round:     (v, dp = 2)             => Math.round(v * 10 ** dp) / 10 ** dp,

  /* ─────────────────────────────────────────
     Function Helpers
  ───────────────────────────────────────── */

  debounce(fn, ms = 200) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  },

  throttle(fn, ms = 100) {
    let last = 0;
    return (...args) => {
      const now = Date.now();
      if (now - last >= ms) { last = now; fn(...args); }
    };
  },

  /* ─────────────────────────────────────────
     Formatting
  ───────────────────────────────────────── */

  formatNumber: (n)        => Number(n).toLocaleString(),
  formatPercent:(v, dp=1)  => (v * 100).toFixed(dp) + '%',

  /* ─────────────────────────────────────────
     Colour Helpers
  ───────────────────────────────────────── */

  hexToRgb(hex) {
    const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return r ? { r: parseInt(r[1], 16), g: parseInt(r[2], 16), b: parseInt(r[3], 16) } : null;
  },

  rgba(hex, alpha) {
    const c = this.hexToRgb(hex) ?? { r: 99, g: 102, b: 241 };
    return `rgba(${c.r},${c.g},${c.b},${alpha})`;
  },

  /* ─────────────────────────────────────────
     Tooltip Helper
     Usage: Utils.tooltip(triggerEl, 'Explanation text')
  ───────────────────────────────────────── */

  /**
   * Wraps an element in an aip-tooltip-wrap and appends a tooltip box.
   * Returns the wrapper element.
   */
  tooltip(triggerEl, text) {
    const wrap = document.createElement('span');
    wrap.className = 'aip-tooltip-wrap';
    triggerEl.parentNode?.insertBefore(wrap, triggerEl);
    wrap.appendChild(triggerEl);

    const box = document.createElement('span');
    box.className = 'aip-tooltip-box';
    box.textContent = text;
    wrap.appendChild(box);
    return wrap;
  },

  /**
   * Creates a standalone ⓘ question-mark trigger with a tooltip.
   * Returns the wrapper element ready to insert into the DOM.
   */
  createTooltip(text) {
    const wrap = document.createElement('span');
    wrap.className = 'aip-tooltip-wrap';

    const trigger = document.createElement('span');
    trigger.className = 'aip-tooltip-trigger';
    trigger.setAttribute('role', 'img');
    trigger.setAttribute('aria-label', 'Help: ' + text);
    trigger.textContent = '?';

    const box = document.createElement('span');
    box.className = 'aip-tooltip-box';
    box.textContent = text;

    wrap.appendChild(trigger);
    wrap.appendChild(box);
    return wrap;
  },

  /* ─────────────────────────────────────────
     Canvas Helpers
  ───────────────────────────────────────── */

  /** Resize a canvas to its CSS size, respecting device pixel ratio. */
  resizeCanvas(canvas) {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width  = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    return { ctx, w, h, dpr };
  },
};
