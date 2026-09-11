// Charts and interactive widgets. Every chart draws marks, ticks and labels from one linear scale.
(() => {
  const NS = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs = {}, parent, text) => {
    const node = document.createElementNS(NS, tag);
    for (const k in attrs) node.setAttribute(k, attrs[k]);
    if (text != null) node.textContent = text;
    if (parent) parent.appendChild(node);
    return node;
  };
  const scale = (d0, d1, r0, r1) => (v) => r0 + ((v - d0) / (d1 - d0)) * (r1 - r0);
  const fmt = (n, digits = 0) => n.toLocaleString('en-US', { maximumFractionDigits: digits, minimumFractionDigits: digits });
  const $ = (id) => document.getElementById(id);

  // Deterministic so the chart looks the same on every load and in print.
  function rng(seed) {
    return () => {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Slide 3: 10 callers hit acquire() at t=0 against a 5-token bucket refilled at 5/s.
  function tokenGantt(svg) {
    const W = 600, H = 330, L = 96, R = 40, T = 10, B = 40;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const x = scale(0, 1200, L, W - R);
    const rows = 10, rh = (H - T - B) / rows;
    for (let t = 0; t <= 1200; t += 200) {
      el('line', { x1: x(t), x2: x(t), y1: T, y2: H - B, class: 'sv-grid' }, svg);
      el('text', { x: x(t), y: H - B + 24, class: 'sv-tick', 'text-anchor': 'middle' }, svg, `${t} ms`);
    }
    el('line', { x1: L, x2: W - R, y1: H - B, y2: H - B, class: 'sv-axis' }, svg);
    for (let i = 0; i < rows; i++) {
      // Tokens after the first five reservations go negative; each caller sleeps its own deficit.
      const wait = i < 5 ? 0 : (i - 4) * 200;
      const cy = T + rh * i + rh / 2;
      const g = el('g', i < 5 ? {} : { 'data-step': 1 }, svg);
      el('text', { x: L - 14, y: cy + 4.5, class: 'sv-tick', 'text-anchor': 'end' }, g, `caller ${i + 1}`);
      if (wait > 0) el('rect', { x: x(0), y: cy - 5, width: x(wait) - x(0), height: 10, rx: 5, class: 'sv-wait' }, g);
      el('circle', { cx: x(wait), cy, r: 7, class: 'sv-mark' }, g);
    }
  }

  // Slide 5: ideal leaky bucket vs. a sweep that batches with integer division (delay = i / k).
  function leaky(svg) {
    const W = 600, H = 250, L = 168, R = 24, T = 14, B = 40, k = 3, n = 20;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const x = scale(0, 7, L, W - R);
    for (let s = 0; s <= 7; s++) {
      el('line', { x1: x(s), x2: x(s), y1: T, y2: H - B, class: 'sv-grid' }, svg);
      el('text', { x: x(s), y: H - B + 24, class: 'sv-tick', 'text-anchor': 'middle' }, svg, `${s}s`);
    }
    el('line', { x1: L, x2: W - R, y1: H - B, y2: H - B, class: 'sv-axis' }, svg);

    const y1 = 58, y2 = 150;
    el('text', { x: L - 16, y: y1 - 2, class: 'sv-lbl', 'text-anchor': 'end' }, svg, 'Ideal leaky bucket');
    el('text', { x: L - 16, y: y1 + 16, class: 'sv-lbl-sm', 'text-anchor': 'end' }, svg, 'even, every 333 ms');
    el('text', { x: L - 16, y: y2 - 2, class: 'sv-lbl', 'text-anchor': 'end' }, svg, 'Batched sweep');
    el('text', { x: L - 16, y: y2 + 16, class: 'sv-lbl-sm', 'text-anchor': 'end' }, svg, `groups of ${k} per second`);
    for (let i = 0; i < n; i++) {
      el('circle', { cx: x(i / k), cy: y1 + 4, r: 6, class: 'sv-ink' }, svg);
      const sec = Math.floor(i / k);
      el('circle', { cx: x(sec), cy: y2 - 14 + (i % k) * 18, r: 6, class: 'sv-mark' }, svg);
    }
  }

  // Slide 6: a naive expireAfterWrite window starts at the key's first hit, not on the clock.
  function fixedWindow(svg) {
    const W = 600, H = 330, L = 44, R = 76, T = 40, B = 44;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const x = scale(0, 40, L, W - R); // seconds after 09:59:40
    const y = scale(0, 11, H - B, T);
    el('rect', { x: x(0), y: T, width: x(20) - x(0), height: H - B - T, class: 'sv-band' }, svg);
    el('text', { x: x(0) + 8, y: T + 18, class: 'sv-lbl-sm' }, svg, 'Window A · opened 09:45:00');
    const bandB = el('g', { 'data-step': 1 }, svg);
    el('rect', { x: x(25), y: T, width: x(40) - x(25), height: H - B - T, class: 'sv-band-hot' }, bandB);
    el('text', { x: x(25) + 8, y: T + 18, class: 'sv-lbl-sm' }, bandB, 'Window B · opened 10:00:05');

    for (let c = 0; c <= 10; c += 2) {
      el('line', { x1: L, x2: W - R, y1: y(c), y2: y(c), class: 'sv-grid' }, svg);
      el('text', { x: L - 10, y: y(c) + 4.5, class: 'sv-tick', 'text-anchor': 'end' }, svg, c);
    }
    const ticks = [[0, '09:59:40'], [10, '09:59:50'], [20, '10:00:00'], [30, '10:00:10'], [40, '10:00:20']];
    ticks.forEach(([s, label]) => el('text', { x: x(s), y: H - B + 24, class: 'sv-tick', 'text-anchor': 'middle' }, svg, label));
    el('line', { x1: L, x2: W - R, y1: H - B, y2: H - B, class: 'sv-axis' }, svg);
    el('line', { x1: L, x2: W - R, y1: y(10), y2: y(10), class: 'sv-limit' }, svg);
    el('text', { x: W - R + 8, y: y(10) + 5, class: 'sv-hot' }, svg, 'limit 10');

    el('text', { x: x(0) + 8, y: y(1) + 4, class: 'sv-lbl-sm' }, svg, '← 1st hit at 09:45:00');
    const gap = 0.75;
    for (let c = 2; c <= 10; c++) el('circle', { cx: x(10 + (c - 2) * gap), cy: y(c), r: 5.5, class: 'sv-ink' }, svg);
    const stepB = el('g', { 'data-step': 1 }, svg);
    for (let c = 1; c <= 10; c++) el('circle', { cx: x(25 + (c - 1) * gap), cy: y(c), r: 5.5, class: 'sv-mark' }, stepB);

    const first = 10, last = 25 + 9 * gap;
    const brace = el('g', { 'data-step': 2 }, svg);
    const by = y(10) - 20;
    el('path', { d: `M${x(first)} ${by + 8} V${by} H${x(last)} V${by + 8}`, class: 'sv-line' }, brace);
    el('text', { x: (x(first) + x(last)) / 2, y: by - 8, class: 'sv-lbl', 'text-anchor': 'middle' }, brace,
      `19 hits in ${Math.round(last - first)} seconds, none of them rejected`);
  }

  // Slide 9: request timestamps kept in a sorted set; anything older than now − 15m is trimmed.
  function slidingLog(svg) {
    const W = 600, H = 190, L = 20, R = 20, T = 30, B = 44;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const x = scale(0, 30, L, W - R);
    const times = [2, 4.5, 6, 9, 11.5, 13.5, 16, 17.5, 19, 22, 23.5, 26, 27.5, 29.2];
    el('rect', { x: x(15), y: T, width: x(30) - x(15), height: H - B - T, rx: 10, class: 'sv-band-hot' }, svg);
    const live = times.filter((t) => t >= 15).length;
    el('text', { x: x(15) + 10, y: T + 20, class: 'sv-lbl' }, svg, `last 15 minutes: ${live} timestamps`);
    el('text', { x: x(0) + 4, y: T + 20, class: 'sv-lbl-sm' }, svg, 'trimmed by score');
    el('line', { x1: L, x2: W - R, y1: H - B, y2: H - B, class: 'sv-axis' }, svg);
    times.forEach((t) => {
      const old = t < 15;
      el('circle', { cx: x(t), cy: T + 62, r: 7, class: old ? 'sv-old' : 'sv-mark' }, svg);
      if (old) el('line', { x1: x(t) - 7, x2: x(t) + 7, y1: T + 69, y2: T + 55, class: 'sv-strike' }, svg);
    });
    [[0, 'now − 30 min', 'start'], [15, 'now − 15 min', 'middle'], [30, 'now', 'end']].forEach(([t, label, anchor]) =>
      el('text', { x: x(t), y: H - B + 24, class: 'sv-tick', 'text-anchor': anchor }, svg, label));
  }

  // Slide 10: estimate = current + previous × (1 − elapsed / window).
  function slidingCounter() {
    const prev = $('sw-prev'), curr = $('sw-curr'), elapsed = $('sw-el');
    const svg = $('sw-bar');
    const W = 520, H = 92, L = 0, R = 30, LIMIT = 10, MAX = 20;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const x = scale(0, MAX, L, W - R);
    el('rect', { x: x(0), y: 20, width: x(MAX) - x(0), height: 34, rx: 8, class: 'sv-band' }, svg);
    const rCurr = el('rect', { x: x(0), y: 20, height: 34, rx: 8, class: 'sv-mark' }, svg);
    const rPrev = el('rect', { y: 20, height: 34, class: 'sv-bar-ink' }, svg);
    el('line', { x1: x(LIMIT), x2: x(LIMIT), y1: 8, y2: 66, class: 'sv-limit' }, svg);
    el('text', { x: x(LIMIT), y: 84, class: 'sv-hot', 'text-anchor': 'middle' }, svg, 'limit 10');
    [0, 5, 15, 20].forEach((v) => el('text', { x: x(v), y: 84, class: 'sv-tick', 'text-anchor': v === 0 ? 'start' : 'middle' }, svg, v));

    function update() {
      const p = Number(prev.value), c = Number(curr.value), e = Number(elapsed.value);
      const weighted = p * (1 - e / 15);
      const est = c + weighted;
      $('sw-prev-o').textContent = p;
      $('sw-curr-o').textContent = c;
      $('sw-el-o').textContent = `${e} min`;
      const cw = Math.min(x(c), x(MAX)) - x(0);
      rCurr.setAttribute('width', Math.max(0, cw));
      rPrev.setAttribute('x', x(0) + cw);
      rPrev.setAttribute('width', Math.max(0, Math.min(x(est), x(MAX)) - x(0) - cw));
      $('sw-est').textContent = fmt(est, 1);
      $('sw-calc').innerHTML = `${c} + ${p} × (1 − ${e}/15) = <b>${fmt(est, 1)}</b>`;
      const pass = est < LIMIT;
      const v = $('sw-verdict');
      v.textContent = pass ? 'Allowed' : 'Rejected';
      v.className = pass ? 'chip ok' : 'chip risk';
    }
    [prev, curr, elapsed].forEach((i) => i.addEventListener('input', update));
    update();
  }

  // Slides 15 and 17: histogram of retry arrivals with a mode switch.
  function histogram({ svg, seg, readout, domain: [a, b], bin, ymax, yStep, xStep, xUnit, modes, describe }) {
    const W = 1100, H = 300, L = 60, R = 16, T = 12, B = 40;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const x = scale(a, b, L, W - R);
    const y = scale(0, ymax, H - B, T);
    for (let v = 0; v <= ymax; v += yStep) {
      el('line', { x1: L, x2: W - R, y1: y(v), y2: y(v), class: 'sv-grid' }, svg);
      el('text', { x: L - 10, y: y(v) + 4.5, class: 'sv-tick', 'text-anchor': 'end' }, svg, fmt(v));
    }
    for (let v = a; v <= b; v += xStep) {
      el('text', { x: x(v), y: H - B + 24, class: 'sv-tick', 'text-anchor': 'middle' }, svg, `${v}${xUnit}`);
    }
    el('line', { x1: L, x2: W - R, y1: H - B, y2: H - B, class: 'sv-axis' }, svg);
    const n = Math.round((b - a) / bin);
    const bw = x(a + bin) - x(a);
    const bars = Array.from({ length: n }, (_, i) =>
      el('rect', { x: x(a + i * bin) + 1, width: Math.max(1, bw - 2), y: y(0), height: 0, rx: 2, class: 'sv-bar' }, svg));

    function show(key) {
      const counts = new Array(n).fill(0);
      modes[key]().forEach((t) => {
        const i = Math.floor((t - a) / bin);
        if (i >= 0 && i < n) counts[i]++;
      });
      counts.forEach((c, i) => {
        const top = y(Math.min(c, ymax));
        bars[i].setAttribute('y', top);
        bars[i].setAttribute('height', y(0) - top);
        bars[i].style.y = `${top}px`;
        bars[i].style.height = `${y(0) - top}px`;
      });
      const peak = Math.max(...counts);
      readout.innerHTML = describe(peak, a + counts.indexOf(peak) * bin, key);
      seg.querySelectorAll('button').forEach((btn) => btn.setAttribute('aria-pressed', String(btn.dataset.mode === key)));
    }
    seg.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (btn) show(btn.dataset.mode);
    });
    show(seg.querySelector('button').dataset.mode);
  }

  function herd() {
    const CLIENTS = 1000, BASES = [30, 60, 120];
    const schedule = (jitter) => {
      const r = rng(7), out = [];
      for (let i = 0; i < CLIENTS; i++) {
        let t = 0;
        BASES.forEach((base) => { t += jitter(base, r); out.push(t); });
      }
      return out;
    };
    histogram({
      svg: $('herd'), seg: $('herd-seg'), readout: $('herd-readout'),
      domain: [0, 300], bin: 5, ymax: 1000, yStep: 250, xStep: 30, xUnit: 's',
      modes: {
        none: () => schedule((base) => base),
        equal: () => schedule((base, r) => base / 2 + r() * (base / 2)),
        full: () => schedule((base, r) => r() * base),
      },
      describe: (peak, at) => `Peak: <b>${fmt(peak)}</b> requests in one 5-second bin, starting at t = ${at}s`,
    });
  }

  function retryAfter() {
    const JOBS = 400, RETRY_AFTER = 60;
    histogram({
      svg: $('ra'), seg: $('ra-seg'), readout: $('ra-readout'),
      domain: [55, 80], bin: 1, ymax: 400, yStep: 100, xStep: 5, xUnit: 's',
      modes: {
        exact: () => new Array(JOBS).fill(RETRY_AFTER),
        jitter: () => { const r = rng(11); return Array.from({ length: JOBS }, () => RETRY_AFTER + r() * RETRY_AFTER * 0.2); },
      },
      describe: (peak, at) => `Peak: <b>${fmt(peak)}</b> retries in one 1-second bin, at t = ${at}s`,
    });
  }

  tokenGantt($('gantt'));
  leaky($('leaky'));
  fixedWindow($('fixed'));
  slidingLog($('swlog'));
  slidingCounter();
  herd();
  retryAfter();
})();
