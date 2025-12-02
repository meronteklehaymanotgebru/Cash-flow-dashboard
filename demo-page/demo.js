const CAROUSEL_INTERVAL = 6000;
const CAROUSEL_RESUME_DELAY = 3000;

/* helpers */
function debounce(fn, wait = 120) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
}

function trackEvent(name, props = {}) {
  try { if (window.gtag) window.gtag('event', name, props); } catch(e){}
  try { if (window.productAnalytics && typeof window.productAnalytics.track === 'function') window.productAnalytics.track(name, props); } catch(e){}
}

/* CTA wiring */
function wireCTAs() {
  document.querySelectorAll('[data-calendly]').forEach(btn => {
    btn.addEventListener('click', () => {
      const url = btn.dataset.calendly;
      trackEvent('click_book_call', { location: btn.id || 'unknown' });
      window.open(url, '_blank', 'noopener');
    });
  });

  document.querySelectorAll('[data-dashboard]').forEach(btn => {
    btn.addEventListener('click', () => {
      const url = btn.dataset.dashboard;
      trackEvent('click_start_dashboard', { location: btn.id || 'unknown' });
      window.location.href = url;
    });
  });
}

/* HOW IT WORKS placement with safe handling when SVG hidden (<=1024px) */
function setupHowItWorks() {
  const svg = document.getElementById('timeline-svg');
  const path = document.getElementById('timeline-path');
  const dot = document.getElementById('moving-dot');
  const container = document.getElementById('timeline-cards');
  const cards = Array.from(document.querySelectorAll('.how-card'));
  if (!container || !cards.length) return null;

  const nodeTopOffsets = [70, 35, 0];
  const nodeBottomOffsets = [0, 18, 45];

  function svgVisible() {
    if (!svg) return false;
    const style = window.getComputedStyle(svg);
    return style && style.display !== 'none' && window.innerWidth > 1024;
  }

  function getNodePts() {
    if (!path) return [];
    const total = path.getTotalLength();
    return [
      path.getPointAtLength(total * (60/1200)),
      path.getPointAtLength(total * (560/1200)),
      path.getPointAtLength(total * (1140/1200))
    ];
  }

  function toClient(pt) {
    const r = svg.getBoundingClientRect();
    return { x: (pt.x / svg.viewBox.baseVal.width) * r.width + r.left, y: (pt.y / svg.viewBox.baseVal.height) * r.height + r.top, rect: r };
  }

  function positionCards() {
    // If SVG is hidden or viewport small, stack cards (no absolute positioning)
    if (!svgVisible()) {
      cards.forEach(c => {
        c.style.position = 'static';
        c.style.left = '';
        c.style.top = '';
      });
      // hide dot when svg not visible
      if (dot) dot.style.opacity = 0;
      return;
    }

    // otherwise compute absolute positions
    const pts = getNodePts();
    if (!pts || !pts.length) return;

    const rect = container.getBoundingClientRect();
    const topLiftBase = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--top-lift-base')) || 95;
    const bottomGapBase = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--bottom-gap-base')) || 72;
    const hGap = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--card-h-gap')) || 48;
    const vGap = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--card-gap')) || 36;

    // group cards by node in DOM order
    const groups = { '1': [], '2': [], '3': [] };
    cards.forEach(c => {
      const n = c.dataset.node || '1';
      groups[n] = groups[n] || [];
      groups[n].push(c);
      c.style.position = 'absolute';
    });

    Object.keys(groups).forEach((nodeKey, idx) => {
      const list = groups[nodeKey];
      const pt = pts[idx];
      const clientPt = toClient(pt);
      const baseLeft = clientPt.x - rect.left;

      if (list[0]) {
        const topCard = list[0];
        const w = topCard.getBoundingClientRect().width || parseInt(getComputedStyle(topCard).width) || 320;
        const h = topCard.getBoundingClientRect().height || parseInt(getComputedStyle(topCard).height) || 140;
        let left = baseLeft - (w/2);
        left = Math.max(6, Math.min(left, rect.width - w - 6));
        const top = (clientPt.y - rect.top) - (topLiftBase + (nodeTopOffsets[idx] || 0)) - h;
        topCard.style.left = `${Math.round(left)}px`;
        topCard.style.top = `${Math.round(top)}px`;
      }

      if (list[1]) {
        const botCard = list[1];
        const w = botCard.getBoundingClientRect().width || parseInt(getComputedStyle(botCard).width) || 320;
        let left = baseLeft - (w/2);
        left = Math.max(6, Math.min(left, rect.width - w - 6));
        const top = (clientPt.y - rect.top) + (bottomGapBase + (nodeBottomOffsets[idx] || 0));
        botCard.style.left = `${Math.round(left)}px`;
        botCard.style.top = `${Math.round(top)}px`;
      }

      if (list.length > 2) {
        let prev = list[1] || list[0];
        for (let i = 2; i < list.length; i++) {
          const c = list[i];
          const prevRect = prev.getBoundingClientRect();
          const cw = c.getBoundingClientRect().width || parseInt(getComputedStyle(c).width) || 320;
          let left = baseLeft - (cw/2);
          left = Math.max(6, Math.min(left, rect.width - cw - 6));
          const top = (prevRect.top - rect.top) + prevRect.height + vGap;
          c.style.left = `${Math.round(left)}px`;
          c.style.top = `${Math.round(top)}px`;
          prev = c;
        }
      }
    });

    // horizontal enforcement
    function enforce(rowElems) {
      const arr = rowElems.map(el => ({ el, left: el.getBoundingClientRect().left, width: el.getBoundingClientRect().width }))
                         .sort((a,b) => a.left - b.left);
      for (let i = 1; i < arr.length; i++) {
        const prev = arr[i-1], cur = arr[i];
        const minLeft = prev.left + prev.width + hGap;
        if (cur.left < minLeft) {
          const shift = minLeft - cur.left;
          cur.left += shift;
          cur.el.style.left = `${Math.round(cur.left - rect.left)}px`;
        }
      }
      arr.forEach(item => {
        const curLeft = parseFloat(item.el.style.left || 0);
        const clamped = Math.max(6, Math.min(curLeft, rect.width - item.width - 6));
        item.el.style.left = `${Math.round(clamped)}px`;
      });
    }

    const topRow = [groups['1'][0], groups['2'][0], groups['3'][0]].filter(Boolean);
    const bottomRow = [groups['1'][1], groups['2'][1], groups['3'][1]].filter(Boolean);
    enforce(topRow);
    enforce(bottomRow);
  }

  // observe path but no-op if svg hidden
  if (path) {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          if (!svgVisible()) {
            // when hidden, just run position (which will stack)
            positionCards();
            obs.disconnect();
            return;
          }
          const total = path.getTotalLength();
          path.style.strokeDasharray = total;
          path.style.strokeDashoffset = total;
          requestAnimationFrame(()=> {
            path.style.transition = 'stroke-dashoffset 1.6s cubic-bezier(.2,.9,.2,1)';
            path.style.strokeDashoffset = '0';
          });
          setTimeout(positionCards, 260);
          obs.disconnect();
        }
      });
    }, { threshold: 0.12 });
    io.observe(path);

    // pointer feedback: show moving dot at midpoint on hover (desktop only)
    path.addEventListener('mouseenter', () => {
      if (!svgVisible()) return;
      const total = path.getTotalLength();
      const mid = path.getPointAtLength(total * 0.5);
      const dot = document.getElementById('moving-dot');
      dot.setAttribute('cx', mid.x);
      dot.setAttribute('cy', mid.y);
      dot.style.opacity = 1;
    });
    path.addEventListener('mouseleave', () => {
      const dot = document.getElementById('moving-dot');
      if (document.querySelector('.how-card.active')) return;
      dot.style.opacity = 0;
    });
  }

  return debounce(positionCards, 120);
}

/* carousel (unchanged) */
function initCarousel() {
  const track = document.getElementById('carousel-track');
  if (!track) return null;
  const items = Array.from(track.querySelectorAll('.testimonial'));
  const dotsContainer = document.getElementById('carousel-dots');
  const prev = document.getElementById('carousel-prev');
  const next = document.getElementById('carousel-next');
  if (!items.length) return null;

  dotsContainer.innerHTML = '';
  items.forEach((_, i) => {
    const d = document.createElement('button');
    d.className = 'dot';
    d.setAttribute('aria-label', `Show testimonial ${i+1}`);
    d.dataset.index = i;
    dotsContainer.appendChild(d);
  });
  const dots = Array.from(dotsContainer.children);

  let idx = 0;
  let autoplayTimer = null;
  let resumeTimer = null;
  let userInteracted = false;

  function show(i) {
    items.forEach((it, j) => it.setAttribute('aria-hidden', j === i ? 'false' : 'true'));
    dots.forEach((d, j) => d.classList.toggle('active', j === i));
    idx = i;
  }

  function nextItem() { show((idx + 1) % items.length); }
  function prevItem() { show((idx - 1 + items.length) % items.length); }

  function startAutoplay() {
    stopAutoplay();
    autoplayTimer = setInterval(() => {
      if (!userInteracted) nextItem();
    }, CAROUSEL_INTERVAL);
  }

  function stopAutoplay() { if (autoplayTimer) { clearInterval(autoplayTimer); autoplayTimer = null; } }

  function userActionPause() {
    userInteracted = true;
    stopAutoplay();
    if (resumeTimer) clearTimeout(resumeTimer);
    resumeTimer = setTimeout(() => { userInteracted = false; startAutoplay(); }, CAROUSEL_RESUME_DELAY);
  }

  dots.forEach(d => d.addEventListener('click', (e) => { show(Number(d.dataset.index)); userActionPause(); }));
  prev && prev.addEventListener('click', () => { prevItem(); userActionPause(); });
  next && next.addEventListener('click', () => { nextItem(); userActionPause(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { prevItem(); userActionPause(); }
    if (e.key === 'ArrowRight') { nextItem(); userActionPause(); }
  });

  track.addEventListener('mouseenter', () => { stopAutoplay(); });
  track.addEventListener('mouseleave', () => { if (!userInteracted) startAutoplay(); });
  track.addEventListener('focusin', () => { stopAutoplay(); }, true);
  track.addEventListener('focusout', () => { if (!userInteracted) startAutoplay(); }, true);

  show(0);
  startAutoplay();

  return { start: startAutoplay, stop: stopAutoplay };
}

/* Init */
document.addEventListener('DOMContentLoaded', () => {
  wireCTAs();
  const reposition = setupHowItWorks();
  if (reposition) {
    window.addEventListener('resize', reposition);
    window.addEventListener('orientationchange', () => setTimeout(reposition, 260));
  }
  initCarousel();
});