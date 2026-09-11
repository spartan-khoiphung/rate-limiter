// Keyboard deck in the style of slides-vibe-coding-sops: data-step reveals, #slide.step links,
// N speaker notes, O overview grid, F fullscreen.
(() => {
  const deck = document.getElementById('deck');
  const slides = [...deck.querySelectorAll('.slide')];
  const bar = document.querySelector('.progress i');
  const pager = document.querySelector('.pager');
  const notesPanel = document.querySelector('.notes-panel');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fmt = (n) => n.toLocaleString('vi-VN');

  let current = 0;
  let step = 0;

  const maxStep = (slide) =>
    Math.max(0, ...[...slide.querySelectorAll('[data-step]')].map((n) => Number(n.dataset.step)));

  function countUp(slide) {
    slide.querySelectorAll('[data-count]').forEach((node) => {
      const target = Number(node.dataset.count);
      if (reduceMotion) { node.textContent = fmt(target); return; }
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min(1, (now - start) / 800);
        node.textContent = fmt(Math.round(target * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  function render(slideChanged) {
    slides.forEach((s, i) => s.classList.toggle('active', i === current));
    const slide = slides[current];
    slide.querySelectorAll('[data-step]').forEach((n) => n.classList.toggle('shown', Number(n.dataset.step) <= step));
    if (slideChanged) countUp(slide);
    bar.style.width = `${((current + 1) / slides.length) * 100}%`;
    pager.textContent = `${current + 1} / ${slides.length}`;
    const notes = slide.querySelector('.notes');
    notesPanel.innerHTML = `<h3>Ghi chú người nói · slide ${current + 1}</h3>${notes ? notes.innerHTML : '<p>Không có ghi chú.</p>'}`;
    history.replaceState(null, '', `#${current + 1}.${step}`);
  }

  function go(index, toStep = 0) {
    const changed = index !== current;
    current = Math.max(0, Math.min(slides.length - 1, index));
    step = Math.max(0, Math.min(maxStep(slides[current]), toStep));
    render(changed);
  }

  function next() {
    if (step < maxStep(slides[current])) go(current, step + 1);
    else if (current < slides.length - 1) go(current + 1, 0);
  }

  function prev() {
    if (step > 0) go(current, step - 1);
    else if (current > 0) go(current - 1, maxStep(slides[current - 1]));
  }

  function fit() {
    const s = Math.min((innerWidth - 32) / 1280, (innerHeight - 40) / 720);
    deck.style.setProperty('--s', Math.max(0.2, s).toFixed(4));
  }

  function fromHash() {
    const m = location.hash.match(/^#(\d+)(?:\.(\d+))?$/);
    if (m) go(Number(m[1]) - 1, Number(m[2] || 0));
  }

  const toggleOverview = (on = !document.body.classList.contains('overview')) => {
    document.body.classList.toggle('overview', on);
    if (on) slides[current].scrollIntoView({ block: 'center' });
  };

  document.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey || e.target.matches('input')) return;
    const overview = document.body.classList.contains('overview');
    switch (e.key) {
      case 'ArrowRight': case 'PageDown': case ' ': case 'Enter':
        if (!overview) { e.preventDefault(); next(); } break;
      case 'ArrowLeft': case 'PageUp': case 'Backspace':
        if (!overview) { e.preventDefault(); prev(); } break;
      case 'Home': go(0); break;
      case 'End': go(slides.length - 1, maxStep(slides[slides.length - 1])); break;
      case 'n': case 'N': notesPanel.hidden = !notesPanel.hidden; break;
      case 'o': case 'O': toggleOverview(); break;
      case 'Escape': toggleOverview(false); notesPanel.hidden = true; break;
      case 'f': case 'F':
        if (document.fullscreenElement) document.exitFullscreen();
        else document.documentElement.requestFullscreen?.();
        break;
    }
  });

  deck.addEventListener('click', (e) => {
    if (document.body.classList.contains('overview')) {
      const slide = e.target.closest('.slide');
      if (slide) { go(slides.indexOf(slide)); toggleOverview(false); }
      return;
    }
    if (e.target.closest('button, input, label, a, .code, .tbl')) return;
    next();
  });

  addEventListener('resize', fit);
  addEventListener('hashchange', fromHash);
  fit();
  render(true);
  fromHash();
})();
