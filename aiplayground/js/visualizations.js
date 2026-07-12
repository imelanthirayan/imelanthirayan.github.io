/**
 * AI Concepts Playground - Visualization Utilities  (Canvas + D3)
 * Namespace: Visualizations
 */

const Visualizations = {

  /* ─────────────────────────────────────────
     Hero Neural-Network Canvas Animation
  ───────────────────────────────────────── */

  heroNeuralNet(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;

    const ctx = canvas.getContext('2d');
    let rafId;
    let nodes = [];
    let frame = 0;

    const CFG = {
      count:        58,
      connectDist:  145,
      speed:        0.32,
      activateEvery: 38,   // frames
    };

    /* --- resize ---------------------------------------------------- */
    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      spawnNodes();
    };

    /* --- node factory ---------------------------------------------- */
    function spawnNodes() {
      nodes = Array.from({ length: CFG.count }, () => ({
        x:    Math.random() * canvas.width,
        y:    Math.random() * canvas.height,
        vx:   (Math.random() - 0.5) * CFG.speed,
        vy:   (Math.random() - 0.5) * CFG.speed,
        r:    Utils.random(1.6, 3.4),
        base: Utils.random(0.18, 0.48),
        pulse: 0,       // 0 → peak → 0
        rising: false,
      }));
    }

    /* --- activate a random node ------------------------------------ */
    function activate() {
      const n = nodes[Math.floor(Math.random() * nodes.length)];
      n.pulse = 0.01;
      n.rising = true;
    }

    /* --- update ----------------------------------------------------- */
    function update() {
      frame++;
      if (frame % CFG.activateEvery === 0) activate();

      nodes.forEach(n => {
        n.x += n.vx;
        n.y += n.vy;

        // soft wrap
        if (n.x < -20) n.x = canvas.width  + 20;
        if (n.x > canvas.width  + 20) n.x = -20;
        if (n.y < -20) n.y = canvas.height + 20;
        if (n.y > canvas.height + 20) n.y = -20;

        // pulse lifecycle: rise → peak → decay
        if (n.rising) {
          n.pulse = Math.min(n.pulse + 0.035, 1);
          if (n.pulse >= 1) n.rising = false;
        } else if (n.pulse > 0) {
          n.pulse = Math.max(n.pulse - 0.018, 0);
        }
      });
    }

    /* --- draw ------------------------------------------------------- */
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      /* connections */
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const d = Utils.dist(a.x, a.y, b.x, b.y);
          if (d >= CFG.connectDist) continue;

          const t     = 1 - d / CFG.connectDist;
          const pulse = Math.max(a.pulse, b.pulse);
          const hot   = pulse > 0;

          if (hot) {
            ctx.strokeStyle = `rgba(139,92,246,${t * (0.18 + pulse * 0.55)})`;
            ctx.lineWidth   = 0.8 + pulse * 1.4;
            ctx.shadowBlur  = 5 * pulse;
            ctx.shadowColor = 'rgba(139,92,246,0.7)';
          } else {
            ctx.strokeStyle = `rgba(148,163,184,${t * 0.18})`;
            ctx.lineWidth   = 0.65;
            ctx.shadowBlur  = 0;
          }

          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      ctx.shadowBlur = 0;

      /* nodes */
      nodes.forEach(n => {
        const p    = n.pulse;
        const glow = p > 0;

        if (glow) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r * (2.8 + p * 3.5), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(139,92,246,${0.1 * p})`;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r + (glow ? p * 1.6 : 0), 0, Math.PI * 2);

        if (glow) {
          ctx.fillStyle  = `rgba(167,139,250,${n.base + p * 0.52})`;
          ctx.shadowBlur = 9 * p;
          ctx.shadowColor = 'rgba(139,92,246,0.85)';
        } else {
          ctx.fillStyle = `rgba(148,163,184,${n.base})`;
          ctx.shadowBlur = 0;
        }

        ctx.fill();
        ctx.shadowBlur = 0;
      });
    }

    /* --- loop ------------------------------------------------------- */
    function loop() { update(); draw(); rafId = requestAnimationFrame(loop); }

    const onResize = Utils.debounce(resize, 200);
    window.addEventListener('resize', onResize);
    resize();
    loop();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
    };
  },

  /* ─────────────────────────────────────────
     D3 - Base SVG Factory
  ───────────────────────────────────────── */

  /**
   * Creates a <svg> inside `containerSel` with inner margin group.
   * Returns { svg, W, H, margin } where W/H are inner dimensions.
   */
  createSVG(containerSel, {
    width,
    height,
    margin = { top: 24, right: 24, bottom: 48, left: 52 },
  } = {}) {
    if (typeof d3 === 'undefined') return null;

    const container = d3.select(containerSel);
    container.select('svg').remove(); // clear previous

    const node = container.node();
    const totalW = width  ?? node.clientWidth;
    const totalH = height ?? node.clientHeight;
    const W = totalW - margin.left - margin.right;
    const H = totalH - margin.top  - margin.bottom;

    const svg = container
      .append('svg')
      .attr('width',  totalW)
      .attr('height', totalH)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    return { svg, W, H, margin };
  },

  /* ─────────────────────────────────────────
     D3 - Scale Factory
  ───────────────────────────────────────── */

  /** type: 'linear' | 'log' | 'sqrt' | 'ordinal' | 'band' | 'time' */
  createScale(type, domain, range) {
    if (typeof d3 === 'undefined') return null;
    const map = {
      linear:  d3.scaleLinear,
      log:     d3.scaleLog,
      sqrt:    d3.scaleSqrt,
      ordinal: d3.scaleOrdinal,
      band:    d3.scaleBand,
      time:    d3.scaleTime,
    };
    return (map[type] ?? d3.scaleLinear)().domain(domain).range(range);
  },

  /* ─────────────────────────────────────────
     D3 - Axis Helper
  ───────────────────────────────────────── */

  /** orientation: 'bottom' | 'top' | 'left' | 'right' */
  appendAxis(svg, scale, orientation, {
    transform, ticks, tickFormat,
  } = {}) {
    if (typeof d3 === 'undefined') return null;

    const axisFns = {
      bottom: d3.axisBottom,
      top:    d3.axisTop,
      left:   d3.axisLeft,
      right:  d3.axisRight,
    };
    const axis = axisFns[orientation](scale);
    if (ticks)      axis.ticks(ticks);
    if (tickFormat) axis.tickFormat(tickFormat);

    const isDark  = Utils.isDark();
    const txtCol  = isDark ? '#94a3b8' : '#64748b';
    const lineCol = isDark ? 'rgba(148,163,184,0.18)' : 'rgba(100,116,139,0.14)';

    const g = svg.append('g');
    if (transform) g.attr('transform', transform);
    g.call(axis);

    g.selectAll('text')
      .style('fill', txtCol)
      .style('font-size', '11px')
      .style('font-family', 'Inter, sans-serif');
    g.selectAll('line, path').style('stroke', lineCol);

    return g;
  },

  /* ─────────────────────────────────────────
     D3 - Grid Lines
  ───────────────────────────────────────── */

  drawGrid(svg, xScale, yScale, { W, H } = {}) {
    if (typeof d3 === 'undefined') return;

    const isDark = Utils.isDark();
    const col    = isDark ? 'rgba(148,163,184,0.09)' : 'rgba(100,116,139,0.07)';

    svg.append('g').selectAll('line')
      .data(yScale.ticks(5)).join('line')
      .attr('x1', 0).attr('x2', W)
      .attr('y1', d => yScale(d)).attr('y2', d => yScale(d))
      .style('stroke', col).style('stroke-width', 1);

    svg.append('g').selectAll('line')
      .data(xScale.ticks(5)).join('line')
      .attr('y1', 0).attr('y2', H)
      .attr('x1', d => xScale(d)).attr('x2', d => xScale(d))
      .style('stroke', col).style('stroke-width', 1);
  },

  /* ─────────────────────────────────────────
     D3 - Animated Transition Helper
  ───────────────────────────────────────── */

  transition(selection, duration = 600) {
    if (typeof d3 === 'undefined') return selection;
    return selection.transition().duration(duration).ease(d3.easeCubicOut);
  },

  /* ─────────────────────────────────────────
     D3 - Colour Scales
  ───────────────────────────────────────── */

  colorScale(type = 'categorical') {
    if (typeof d3 === 'undefined') return () => '#6366f1';
    return {
      categorical: d3.scaleOrdinal(d3.schemeTableau10),
      sequential:  (t) => d3.interpolateViridis(t),
      diverging:   (t) => d3.interpolateRdYlBu(1 - t),
      cool:        (t) => d3.interpolateCool(t),
      warm:        (t) => d3.interpolateWarm(t),
    }[type] ?? d3.scaleOrdinal(d3.schemeTableau10);
  },

  /* ─────────────────────────────────────────
     Canvas - Round Rect Helper
  ───────────────────────────────────────── */

  roundRect(ctx, x, y, w, h, r = 8) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  },
};
