/* Every animation and demo on the page. No dependencies. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const T = (ms) => (reduce ? 0 : ms);
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => 1 - Math.pow(1 - clamp(t), 3);
  const seg = (t, a, b) => clamp((t - a) / (b - a));           // sub-progress of t inside [a, b]
  const rupee = (paise) => '₹' + Math.round(paise / 100).toLocaleString('en-IN');
  const inr = (n) => '₹' + n.toLocaleString('en-IN');
  const el = (tag, attrs = {}, html = '') => { const n = document.createElement(tag); for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v); n.innerHTML = html; return n; };
  const SVG = 'http://www.w3.org/2000/svg';
  const sv = (tag, attrs = {}, text) => { const n = document.createElementNS(SVG, tag); for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v); if (text != null) n.textContent = text; return n; };
  const mv = (n, x, y, extra = '') => { n.style.transform = `translate(${x}px, ${y}px) ${extra}`; };
  const onScreen = (node, cb) => new IntersectionObserver(([e]) => cb(e.isIntersecting)).observe(node);

  /* ── Theme ─────────────────────────────────────────────────────────── */
  $('#theme').addEventListener('click', () => {
    const root = document.documentElement;
    const dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    root.dataset.theme = dark ? 'light' : 'dark';
    try { localStorage.setItem('theme', root.dataset.theme); } catch (e) {}
  });

  /* ── Role-tailored links: ?role=data | ai | backend ─────────────────── */
  const ROLES = {
    data: { h: 'Data engineer. I build pipelines that run unattended and <em>never corrupt a load</em>.', pdf: 'Utsav_Pipersaniya_Data_Engineer.pdf', order: ['data', 'backend', 'backend', 'ai'] },
    ai: { h: 'AI engineer. I ship LLM features <em>grounded in real data</em>, not guesses.', pdf: 'Utsav_Pipersaniya_AI_Engineer.pdf', order: ['ai', 'backend', 'data', 'backend'] },
  };
  const params = new URLSearchParams(location.search);
  const role = ROLES[params.get('role')];
  if (role) {
    $('#headline').innerHTML = role.h;
    ['#resume-link', '#resume-link-2'].forEach((s) => ($(s).href = 'assets/resume/' + role.pdf));
    const tiles = $$('#proof .tile');
    const prio = { data: { data: 0, backend: 1, ai: 3 }, ai: { ai: 0, backend: 1, data: 2 } }[params.get('role')];
    tiles.forEach((t, i) => (t.style.order = prio[t.dataset.order] * 10 + i));
    if (params.get('role') === 'data') tiles.forEach((t) => t.dataset.order === 'data' && t.classList.remove('wide'));
  }
  $('#came-from').value = [params.get('role') && 'role=' + params.get('role'), params.get('ref') && 'ref=' + params.get('ref'), document.referrer && 'referrer=' + document.referrer].filter(Boolean).join(' · ') || 'direct';

  /* ── Name: letter-by-letter rise ───────────────────────────────────── */
  let d = 0;
  $$('[data-split]').forEach((span) => {
    const text = span.textContent; span.textContent = '';
    for (const ch of text) { const c = el('span', { class: 'ch', 'aria-hidden': 'true' }, ch); c.style.animationDelay = `${(d += 34)}ms`; span.appendChild(c); }
  });

  /* ── Reveal, nav state, ledger ─────────────────────────────────────── */
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.12 });
  $$('.reveal').forEach((n) => io.observe(n));
  const navLinks = $$('.routes a');
  const navIO = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) navLinks.forEach((a) => a.setAttribute('aria-current', String(a.getAttribute('href') === '#' + e.target.id)));
  }), { rootMargin: '-45% 0px -50% 0px' });
  $$('main > section[id]').forEach((s) => navIO.observe(s));
  $$('#ledger > li > button').forEach((b) => b.addEventListener('click', () => {
    const li = b.parentElement, open = !li.classList.contains('open');
    li.classList.toggle('open', open); b.setAttribute('aria-expanded', String(open));
  }));

  /* ══ Hero proof tiles (self-running loops) ══════════════════════════ */
  {
    let heroOn = true; onScreen($('.hero'), (v) => (heroOn = v));
    const live = () => heroOn && !document.hidden;

    // bid ticker
    const price = $('#tb-price'), lead = $('#tb-lead'), feed = $('#tb-feed');
    const EV = [['Asha', 16000, 1], ['Bilal', 16000, 0], ['Kabir', 16500, 1], ['Ravi', 16400, 0], ['Meera', 17000, 1], ['Asha', 17000, 0], ['Bilal', 17500, 1]];
    let cur = 15900, k = 0, seq = 40;
    const tickBid = () => {
      if (!live()) return;
      if (k === EV.length) { k = 0; cur = 15900; seq = 40; feed.innerHTML = ''; price.textContent = inr(cur); lead.textContent = 'leader: Meera'; return; }
      const [who, amt] = EV[k++]; const ok = amt > cur;
      if (ok) { cur = amt; seq++; price.textContent = inr(cur); price.classList.remove('bump'); void price.offsetWidth; price.classList.add('bump'); lead.textContent = `leader: ${who} · seq ${seq}`; }
      feed.appendChild(el('li', { class: ok ? 'ok' : 'no' }, `<span>${who} ${inr(amt)}</span><b>${ok ? 'accepted' : 'rejected'}</b>`));
      while (feed.children.length > 3) feed.firstChild.remove();
    };
    // etl
    const count = $('#te-count'), pipe = $('#te-pipe');
    [0, 33, 66, 100].forEach((x) => { const s = el('span', { class: 'st' }); s.style.left = `calc(${x}% - ${x / 100 * 16}px)`; pipe.appendChild(s); });
    const recs = Array.from({ length: 5 }, () => pipe.appendChild(el('span', { class: 'rec' })));
    let t0 = performance.now();
    const loopEtl = (now) => {
      if (live()) {
        const t = ((now - t0) / 4200) % 1;
        count.textContent = Math.round(2314 * ease(Math.min(1, t / 0.75))).toLocaleString('en-IN');
        recs.forEach((r, i) => { const x = ((t * 1.6 + i * 0.2) % 1); r.style.left = `calc(${x * 100}% - ${x * 8}px)`; r.style.opacity = x > 0.92 ? 0 : 1; });
      }
      requestAnimationFrame(loopEtl);
    };
    // sql
    const after = $('#ts-after'); let fast = false;
    after.textContent = 'after · ~240 ms';
    const tickSql = () => { if (!live()) return; fast = !fast; after.style.clipPath = `inset(0 ${fast ? 50 : 0}% 0 0 round 4px)`; };
    // ai
    const ans = $('#ta-ans');
    const A = 'Scope 2 rose 13.5% (412.6 → 468.1 tCO₂e), mostly purchased electricity. [live platform data · demo]';
    let ai = 0;
    const tickAi = () => {
      if (!live()) return;
      ai = ai > A.length + 40 ? 0 : ai + 2;
      const shown = A.slice(0, Math.min(ai, A.length));
      ans.innerHTML = shown.replace('13.5%', '<b>13.5%</b>') + (ai < A.length ? '<span class="cur"></span>' : '');
    };
    if (reduce) {
      price.textContent = inr(17500); lead.textContent = 'leader: Bilal · seq 44'; count.textContent = '2,314';
      after.style.clipPath = 'inset(0 50% 0 0 round 4px)'; ans.textContent = A;
    } else {
      setInterval(tickBid, 1500); requestAnimationFrame(loopEtl); setInterval(tickSql, 2600); setInterval(tickAi, 45);
      setTimeout(tickSql, 900);
    }
  }

  /* ══ Scroll stories ═════════════════════════════════════════════════ */
  const SCENES = {};

  /* ── 01 Bid scene ──────────────────────────────────────────────────── */
  SCENES.bid = (() => {
    const svg = $('#bid-svg');
    const Y = [96, 186, 276], QX = 196;
    const B = [['Asha', 1600000], ['Bilal', 1600000], ['Kabir', 1650000]];
    // static scaffolding
    svg.append(
      sv('path', { class: 'sv-line', d: 'M84 96 H262 M84 186 H262 M84 276 H262 M374 186 H420 M320 296 V330 M380 352 H520' }),
    );
    B.forEach(([n], i) => {
      svg.append(sv('circle', { cx: 50, cy: Y[i], r: 22, class: 'sv-blue' }), sv('text', { x: 50, y: Y[i] + 5, 'text-anchor': 'middle', class: 'sv-txt sv-on-blue' }, n[0]),
        sv('text', { x: 50, y: Y[i] + 38, 'text-anchor': 'middle', class: 'sv-lab' }, n));
    });
    const gate = sv('rect', { x: 266, y: 62, width: 108, height: 236, rx: 14, class: 'sv-box' });
    const gTitle = sv('text', { x: 320, y: 84, 'text-anchor': 'middle', class: 'sv-lab' }, 'redis');
    const gL1 = sv('text', { x: 320, y: 182, 'text-anchor': 'middle', class: 'sv-txt' }, 'GET → check');
    const gL2 = sv('text', { x: 320, y: 200, 'text-anchor': 'middle', class: 'sv-txt' }, '→ SET');
    const gL3 = sv('text', { x: 320, y: 104, 'text-anchor': 'middle', class: 'sv-lab' }, 'two at once');
    svg.append(gate, gTitle, gL1, gL2, gL3);
    svg.append(sv('rect', { x: 420, y: 62, width: 200, height: 236, rx: 14, class: 'sv-box' }), sv('text', { x: 438, y: 88, class: 'sv-lab' }, 'CURRENT BID · listing 42'));
    const bPrice = sv('text', { x: 438, y: 134, class: 'sv-big' }, '₹15,900');
    const bLead = sv('text', { x: 438, y: 160, class: 'sv-txt' }, 'leader: Meera');
    svg.append(bPrice, bLead);
    const badges = [0, 1, 2].map((i) => {
      const g = sv('g', { class: 'sv-move' });
      const r = sv('rect', { x: 436, y: 178 + i * 36, width: 170, height: 28, rx: 8 });
      const t = sv('text', { x: 450, y: 197 + i * 36, class: 'sv-txt', 'font-size': 12 });
      g.append(r, t); svg.append(g); return { g, r, t };
    });
    const setBadge = (i, txt, kind) => {
      const b = badges[i]; b.g.style.opacity = txt ? 1 : 0; if (!txt) return;
      b.t.textContent = txt;
      b.r.setAttribute('class', kind === 'warn' ? 'sv-tang' : kind === 'no' ? 'sv-box' : 'sv-blue');
      b.t.setAttribute('class', 'sv-txt ' + (kind === 'warn' ? 'sv-on-tang' : kind === 'no' ? '' : 'sv-on-blue'));
    };
    // buffer + postgres
    svg.append(sv('text', { x: 266, y: 322, class: 'sv-lab' }, 'buffer (redis list)'));
    svg.append(sv('rect', { x: 266, y: 332, width: 240, height: 40, rx: 10, class: 'sv-box' }));
    svg.append(sv('path', { class: 'sv-box', d: 'M530 318 v62 a40 11 0 0 0 80 0 v-62' }), sv('ellipse', { cx: 570, cy: 318, rx: 40, ry: 11, class: 'sv-box' }));
    svg.append(sv('text', { x: 570, y: 352, 'text-anchor': 'middle', class: 'sv-lab' }, 'postgres'));
    const pgRows = sv('text', { x: 570, y: 370, 'text-anchor': 'middle', class: 'sv-txt' }, '40 rows');
    svg.append(pgRows);
    const toks = [0, 1].map((i) => {
      const g = sv('g', { class: 'sv-move' });
      g.append(sv('rect', { x: -32, y: -12, width: 64, height: 24, rx: 7, class: 'sv-tang' }), sv('text', { x: 0, y: 4, 'text-anchor': 'middle', class: 'sv-txt sv-on-tang', 'font-size': 11 }, i ? '42 Kabir' : '41 Asha'));
      svg.append(g); return g;
    });
    const crash = sv('text', { x: 266, y: 404, class: 'sv-txt', fill: 'currentColor' }, '');
    crash.setAttribute('class', 'sv-txt'); svg.append(crash);
    // pills
    const pills = B.map(([n, amt]) => {
      const g = sv('g', { class: 'sv-move' });
      g.append(sv('rect', { x: 0, y: -15, width: 92, height: 30, rx: 15, class: 'sv-tang' }), sv('text', { x: 46, y: 5, 'text-anchor': 'middle', class: 'sv-txt sv-on-tang' }, rupee(amt)));
      svg.append(g); return g;
    });
    const strike = pills.map((g) => { const l = sv('line', { x1: 6, y1: 0, x2: 86, y2: 0, stroke: 'currentColor', 'stroke-width': 2.5, class: 'sv-ink' }); l.style.stroke = 'var(--ink)'; l.style.opacity = 0; g.append(l); return l; });

    const setGate = (atomic) => {
      gate.setAttribute('class', atomic ? 'sv-blue' : 'sv-box');
      gate.style.strokeDasharray = atomic ? '' : '6 6';
      [gL1, gL2].forEach((t) => t.setAttribute('class', 'sv-txt' + (atomic ? ' sv-on-blue' : '')));
      gTitle.setAttribute('class', 'sv-lab' + (atomic ? ' sv-on-blue' : ''));
      gL3.setAttribute('class', 'sv-lab' + (atomic ? ' sv-on-blue' : ''));
      gL1.textContent = atomic ? 'EVALSHA' : 'GET → check';
      gL2.textContent = atomic ? 'place_bid' : '→ SET';
      gL3.textContent = atomic ? 'one at a time' : 'two at once';
    };
    const pill = (i, x, op = 1, struck = false) => { mv(pills[i], x, Y[i]); pills[i].style.opacity = op; strike[i].style.opacity = struck ? 1 : 0; };

    return (p, i, t) => {
      const e = ease(t / 0.85);
      let price = 1590000, leader = 'Meera';
      [0, 1, 2].forEach((b) => setBadge(b, ''));
      toks.forEach((g) => (g.style.opacity = 0));
      crash.textContent = ''; pgRows.textContent = '40 rows';
      if (i === 0) {
        setGate(false);
        B.forEach((_, k) => pill(k, lerp(84, QX - 20, ease(t * 1.4 - k * 0.18))));
      } else if (i === 1) {
        setGate(false);
        const m = ease(seg(t, 0, 0.55));
        pill(0, lerp(QX - 20, 330, m), t > 0.62 ? 0 : 1); pill(1, lerp(QX - 20, 330, m), t > 0.62 ? 0 : 1); pill(2, QX - 20);
        if (t > 0.6) { price = 1600000; leader = 'Asha? Bilal?'; setBadge(0, 'Asha · told: leading', 'warn'); setBadge(1, 'Bilal · told: leading', 'warn'); setBadge(2, '⚠ two winners, one price', 'no'); }
      } else if (i === 2) {
        setGate(true);
        const a = seg(t, 0, 0.28), b = seg(t, 0.3, 0.6), k = seg(t, 0.62, 0.9);
        pill(0, lerp(QX - 20, 330, ease(a)), a >= 1 ? 0 : 1);
        const bx = b < 0.5 ? lerp(QX - 20, 250, ease(b * 2)) : lerp(250, 120, ease((b - 0.5) * 2));
        pill(1, bx, 1, b > 0.5);
        pill(2, lerp(QX - 20, 330, ease(k)), k >= 1 ? 0 : 1);
        if (a >= 1) { price = 1600000; leader = 'Asha · seq 41'; setBadge(0, 'Asha · accepted · seq 41'); }
        if (b > 0.5) setBadge(1, 'Bilal · rejected', 'no');
        if (k >= 1) { price = 1650000; leader = 'Kabir · seq 42'; setBadge(2, 'Kabir · accepted · seq 42'); }
      } else {
        setGate(true);
        pill(0, 330, 0); pill(1, 120, 0.35, true); pill(2, 330, 0);
        price = 1650000; leader = 'Kabir · seq 42';
        setBadge(0, 'Asha · accepted · seq 41'); setBadge(1, 'Bilal · rejected', 'no'); setBadge(2, 'Kabir · accepted · seq 42');
        const m = ease(seg(t, 0.25, 0.7));
        toks.forEach((g, j) => { g.style.opacity = m >= 1 ? 0 : 1; mv(g, lerp(310 + j * 74, 570, m), lerp(352, 330, m)); });
        if (m >= 1) pgRows.textContent = '42 rows';
        if (t > 0.78) crash.textContent = 'worker crash → retry → 0 duplicates (seq ≤ persisted)';
      }
      bPrice.textContent = rupee(price); bLead.textContent = 'leader: ' + leader;
      $('#bid-cap').textContent = `step ${i + 1} / 4`;
    };
  })();

  /* ── 02 ETL scene ──────────────────────────────────────────────────── */
  SCENES.etl = (() => {
    const svg = $('#etl-svg');
    const ST = [[60, 'source API'], [185, 'extract'], [320, 'transform'], [455, 'validate'], [580, 'postgres']];
    svg.append(sv('path', { class: 'sv-line', d: 'M60 150 H580' }));
    const boxes = ST.map(([x, label], i) => {
      const r = sv('rect', { x: x - 48, y: 112, width: 96, height: 76, rx: 12, class: 'sv-box' });
      const t = sv('text', { x, y: 104, 'text-anchor': 'middle', class: 'sv-lab' }, label);
      svg.append(r, t); return r;
    });
    const stat = ST.map(([x]) => { const t = sv('text', { x, y: 206, 'text-anchor': 'middle', class: 'sv-lab' }, ''); svg.append(t); return t; });
    svg.append(sv('rect', { x: 412, y: 248, width: 86, height: 66, rx: 10, class: 'sv-box' }), sv('text', { x: 455, y: 240, 'text-anchor': 'middle', class: 'sv-lab' }, 'quarantine'));
    const done = sv('g', { class: 'sv-move' });
    done.append(sv('rect', { x: 516, y: 248, width: 112, height: 66, rx: 10, class: 'sv-tang' }),
      sv('text', { x: 572, y: 276, 'text-anchor': 'middle', class: 'sv-txt sv-on-tang' }, 'run complete'),
      sv('text', { x: 572, y: 296, 'text-anchor': 'middle', class: 'sv-lab sv-on-tang' }, 'SSE → 100%'));
    svg.append(done);
    // record card
    svg.append(sv('rect', { x: 12, y: 248, width: 384, height: 120, rx: 12, class: 'sv-box' }));
    const cardT = sv('text', { x: 26, y: 270, class: 'sv-lab' }, 'one record');
    const c1 = sv('text', { x: 26, y: 298, class: 'sv-lab', 'font-size': 10.5 }), c2 = sv('text', { x: 26, y: 322, class: 'sv-txt', 'font-size': 11.5 }), c3 = sv('text', { x: 26, y: 346, class: 'sv-lab', 'font-size': 10.5 });
    svg.append(cardT, c1, c2, c3);
    const tally = sv('text', { x: 12, y: 400, class: 'sv-txt' }, ''); svg.append(tally);
    const N = 20, BAD = new Set([4, 13]);
    const recs = Array.from({ length: N }, (_, k) => {
      const g = sv('g', { class: 'sv-move' });
      const r = sv('rect', { x: -6, y: -6, width: 12, height: 12, rx: 2.5 });
      g.append(r); svg.append(g); return { g, r, k, rot: ((k * 47) % 50) - 25, dy: ((k % 5) - 2) * 10 };
    });
    const CARD = [
      ['raw  {"site":" PUNE plant ","qty":"1,204 kWh","date":"03/07/26"}', 'pulled by Celery Beat · 02:00 IST', ''],
      ['raw  {"site":" PUNE plant ","qty":"1,204 kWh","date":"03/07/26"}', 'clean {site: "Pune Plant", qty_kwh: 1204.0, date: 2026-07-03}', 'pandas: strip · title-case · to_numeric · to_datetime'],
      ['raw  {"site": null, "qty": "N/A"}', '✕ quarantined: site missing, qty not numeric', 'logged with the source row id, never loaded'],
      ['INSERT … ON CONFLICT (source_id) DO UPDATE', 'idempotent: re-running the same batch changes nothing', 'progress streamed to the browser over SSE'],
    ];
    return (p, i, t) => {
      const P = clamp(p * 1.08);
      let ext = 0, clean = 0, quar = 0, loaded = 0, slot = 0, q = 0;
      for (const rc of recs) {
        const s = clamp(P * 1.18 - rc.k * 0.009);
        let x = lerp(60, 580, s), y = 150 + rc.dy, rot = rc.rot, cls = 'messy';
        if (s > 0.12) ext++;
        if (x >= 320) { rot = 0; cls = 'clean'; clean++; }
        if (BAD.has(rc.k) && x >= 455) { const j = q++; x = 434 + j * 22; y = 286; rot = 0; cls = 'bad'; quar++; clean--; }
        else if (s >= 1) { const j = slot++; x = 546 + (j % 6) * 13; y = 128 + Math.floor(j / 6) * 15; loaded++; }
        mv(rc.g, x, y, `rotate(${rot}deg)`);
        rc.r.setAttribute('class', cls === 'clean' ? 'sv-blue' : cls === 'bad' ? 'sv-tang' : 'sv-box');
        rc.r.style.stroke = cls === 'messy' ? 'var(--tang-deep)' : '';
      }
      boxes.forEach((b, j) => { b.style.strokeWidth = j === i + 1 ? 3.5 : 2; b.style.stroke = j === i + 1 ? 'var(--tang-deep)' : ''; });
      stat[1].textContent = ext ? `${ext} pulled` : ''; stat[2].textContent = clean ? `${clean} clean` : ''; stat[3].textContent = quar ? `${quar} rejected` : ''; stat[4].textContent = loaded ? `${loaded} loaded` : '';
      const [a, b, c] = CARD[i]; c1.textContent = a; c2.textContent = b; c3.textContent = c;
      c2.style.fill = i === 2 ? 'var(--tang-deep)' : '';
      tally.textContent = `scaled down: 20 records shown · real runs move thousands · ${quar} quarantined · 0 corrupted`;
      done.style.opacity = i === 3 && t > 0.6 ? 1 : 0;
      $('#etl-cap').textContent = `step ${i + 1} / 4`;
    };
  })();

  /* ── 03 Query scene (HTML) ─────────────────────────────────────────── */
  SCENES.query = (() => {
    const code = $('#q-code'), bars = $('#wf-bars'), nQ = $('#wf-n'), plan = $('#plan'), ms = $('#ms'), gauge = $('#gauge'), delta = $('#delta');
    const NQ = 51, TOTAL = 480;
    const B = Array.from({ length: NQ }, (_, k) => {
      const i = el('i', { class: k === 0 ? 'main' : '' });
      i.style.top = `${2 + k * (96 / NQ)}%`; i.style.height = '3px'; i.style.left = `${(6 + k * 8.6) / TOTAL * 100}%`; i.style.width = `${(k === 0 ? 18 : 6.5) / TOTAL * 100}%`;
      bars.appendChild(i); return i;
    });
    const CODE = [
      '<span class="dim"># views.py</span>\nreports = Report.objects.filter(org=org)\n<span class="kw">for</span> r <span class="kw">in</span> reports:\n    rows.append((r.site.name, r.total))  <span class="add"># +1 query per row</span>',
      'reports = (Report.objects.filter(org=org)\n           <span class="add">.select_related("site")</span>       <span class="dim"># one JOIN</span>\n           <span class="add">.prefetch_related("entries")</span>) <span class="dim"># one batched IN</span>\n<span class="kw">for</span> r <span class="kw">in</span> reports: …                <span class="dim"># 0 extra queries</span>',
      '<span class="kw">EXPLAIN ANALYZE</span> SELECT … FROM emissions\n  WHERE org_id = 42 AND period >= \'2026-04-01\';\n<span class="add">CREATE INDEX emissions_org_period_idx</span>\n<span class="add">  ON emissions (org_id, period);</span>',
      '<span class="dim"># same endpoint, before → after</span>\np50   480 ms  →  ~240 ms   <span class="dim">(illustrative)</span>\n<span class="add">measured across the platform: ~50% faster</span>\n<span class="dim">+ long-running jobs moved to Celery: ~60% shorter</span>',
    ];
    let lastI = -1;
    return (p, i, t) => {
      if (i !== lastI) { code.innerHTML = CODE[i]; lastI = i; }
      const e = ease(t / 0.85);
      let v;
      if (i === 0) {
        const shown = Math.round(NQ * e);
        B.forEach((b, k) => { b.style.opacity = k < shown ? 1 : 0; b.style.transform = `scaleX(${k < shown ? 1 : 0})`; b.style.left = `${(6 + k * 8.6) / TOTAL * 100}%`; b.style.width = `${(k === 0 ? 18 : 6.5) / TOTAL * 100}%`; b.style.top = `${2 + k * (96 / NQ)}%`; b.style.height = '3px'; });
        nQ.textContent = `${shown} queries`; v = 30 + (TOTAL - 30) * e;
        plan.innerHTML = 'what Postgres receives:<div class="node bad">SELECT … FROM site WHERE id = $1 &nbsp;× 50</div>';
      } else if (i === 1) {
        B.forEach((b, k) => {
          if (k > 1) { b.style.opacity = 1 - e; b.style.transform = `scaleX(${1 - e})`; return; }
          b.style.opacity = 1; b.style.transform = 'scaleX(1)'; b.style.height = `${lerp(3, 16, e)}px`;
          b.style.top = k === 0 ? '20%' : '55%';
          b.style.left = k === 0 ? '1%' : `${lerp(2.9, 34, e)}%`;
          b.style.width = k === 0 ? `${lerp(3.75, 32, e)}%` : `${lerp(1.4, 30, e)}%`;
        });
        nQ.textContent = e > 0.5 ? '2 queries' : '51 → 2 queries'; v = lerp(TOTAL, 330, e);
        plan.innerHTML = 'what Postgres receives:<div class="node good">1 × JOIN site</div><div class="node good">1 × WHERE report_id IN (…)</div>';
      } else if (i === 2) {
        B.forEach((b, k) => { if (k > 1) { b.style.opacity = 0; return; } b.style.height = '16px'; b.style.top = k === 0 ? '20%' : '55%'; b.style.left = k === 0 ? '1%' : `${lerp(34, 18, e)}%`; b.style.width = k === 0 ? `${lerp(32, 16, e)}%` : `${lerp(30, 24, e)}%`; });
        nQ.textContent = '2 queries'; v = lerp(330, 252, e);
        plan.innerHTML = 'EXPLAIN:<div class="node ' + (e > 0.5 ? 'good' : 'bad') + '">' + (e > 0.5 ? 'Index Scan using emissions_org_period_idx · cost 1,184' : 'Seq Scan on emissions · rows 2.1M · cost 48,210') + '</div>';
      } else {
        B.forEach((b, k) => { if (k > 1) { b.style.opacity = 0; return; } b.style.height = '16px'; b.style.top = k === 0 ? '20%' : '55%'; b.style.left = k === 0 ? '1%' : '18%'; b.style.width = k === 0 ? '16%' : '24%'; });
        nQ.textContent = '2 queries'; v = lerp(252, 240, e);
        plan.innerHTML = 'result:<div class="node good">51 → 2 queries</div><div class="node good">seq scan → index scan</div>';
      }
      ms.textContent = `${Math.round(v)} ms`;
      gauge.style.transform = `scaleX(${v / TOTAL})`;
      delta.textContent = i === 3 && t > 0.3 ? '≈ 50% faster than before' : i >= 1 ? `${Math.round((1 - v / TOTAL) * 100)}% faster so far` : '';
    };
  })();

  /* ── Story driver: scroll position → step + progress ───────────────── */
  {
    const stories = $$('.story').map((sec) => ({ sec, ol: $('.steps', sec), steps: $$('.steps li', sec), scene: SCENES[sec.dataset.story] }));
    if (reduce) {
      stories.forEach((s) => { s.sec.classList.add('static'); s.scene(1, 3, 1); s.steps.forEach((li) => li.classList.add('on')); });
    } else {
      let queued = false;
      const tick = () => {
        queued = false;
        for (const s of stories) {
          const r = s.sec.getBoundingClientRect();
          if (r.bottom < -50 || r.top > innerHeight + 50) continue;
          const p = clamp(-r.top / (r.height - innerHeight));
          const n = s.steps.length, i = Math.min(n - 1, Math.floor(p * n)), t = clamp(p * n - i);
          s.ol.style.setProperty('--p', p.toFixed(3));
          s.steps.forEach((li, j) => { li.classList.toggle('on', j === i); li.classList.toggle('done', j < i); });
          s.scene(p, i, t);
        }
      };
      const q = () => { if (!queued) { queued = true; requestAnimationFrame(tick); } };
      addEventListener('scroll', q, { passive: true }); addEventListener('resize', q);
      stories.forEach((s) => s.scene(0, 0, 0));
      tick();
    }
  }

  /* ══ Bid race simulator (try it) ════════════════════════════════════ */
  {
    const B = [{ id: 'Asha', amt: 1600000, c: 'oklch(0.8 0.1 200)' }, { id: 'Bilal', amt: 1600000, c: 'oklch(0.82 0.13 80)' }, { id: 'Kabir', amt: 1650000, c: 'oklch(0.78 0.13 320)' }];
    const ui = { bidders: $('#bidders'), kv: $('#kv'), buffer: $('#buffer'), pg: $('#pg'), cnt: $('#pg-count'), log: $('#sim-log'), verdict: $('#verdict'), fire: $('#fire'), drain: $('#drain'), crash: $('#crash'), reset: $('#reset') };
    let mode = 'lua', S, busy = false, epoch = 0;
    const fresh = () => ({ price: 1590000, leader: 'Meera', seq: 40, persisted: 40, buffer: [], pg: [{ seq: 39, who: 'Ravi', amt: 1540000 }, { seq: 40, who: 'Meera', amt: 1590000 }], status: {} });
    function renderKV(flash) {
      const rows = [['price_paise', S.price.toLocaleString('en-IN') + ` (${rupee(S.price)})`], ['leader', S.leader], ['seq', mode === 'lua' ? S.seq : '(none)'], ['persisted_seq', mode === 'lua' ? S.persisted : '(none)']];
      ui.kv.innerHTML = rows.map(([k, v]) => `<dt>${k}</dt><dd class="${flash && flash.includes(k) ? 'flash' : ''}">${v}</dd>`).join('');
    }
    function renderBuffer() { ui.buffer.innerHTML = '<span class="lbl">LIST bids:42 (buffer)</span>' + (S.buffer.length ? S.buffer.map((b) => `<span class="tok">${b.seq ?? '?'} · ${b.who} ${rupee(b.amt)}</span>`).join('') : '<span class="tok ghost">empty</span>'); }
    function renderPG(newFrom = Infinity) {
      const seen = {};
      ui.pg.innerHTML = S.pg.map((r, i) => { const dupe = seen[r.amt]; seen[r.amt] = true; return `<tr class="${i >= newFrom ? 'new' : ''} ${dupe ? 'dupe' : ''}"><td>${r.seq ?? '?'}</td><td>${r.who}</td><td>${rupee(r.amt)}${dupe ? ' ⚠' : ''}</td></tr>`; }).join('');
      ui.cnt.textContent = `${S.pg.length} rows`;
    }
    function renderBidders() {
      ui.bidders.innerHTML = B.map((b) => { const st = S.status[b.id] || {}; return `<div class="bidder ${st.cls || ''}" data-b="${b.id}"><span class="av" style="color:${b.c}">${b.id[0]}</span><span><b style="font-size:.85rem">${b.id}</b><br><span class="amt">${rupee(b.amt)}</span></span><span class="res">${st.txt || 'idle'}</span></div>`; }).join('');
    }
    const say = (h) => { ui.log.insertAdjacentHTML('beforeend', `<div>${h}</div>`); ui.log.scrollTop = ui.log.scrollHeight; };
    const setStatus = (w, cls, txt) => { S.status[w] = { cls, txt }; renderBidders(); };
    const sending = (w, on) => { const n = $(`[data-b="${w}"]`, ui.bidders); if (n) n.classList.toggle('sending', on); };
    const verdict = (cls, txt) => { ui.verdict.className = 'verdict ' + cls; ui.verdict.textContent = txt; };
    const btns = (f, d, c) => { ui.fire.disabled = !f; ui.drain.disabled = !d; ui.crash.disabled = !c; };
    const step = (ms = 520) => sleep(T(ms));
    function reset() {
      epoch++; busy = false; S = fresh(); ui.log.innerHTML = '';
      say(`<span class="hi">listing:42</span> open · ${rupee(S.price)} · leader Meera · mode <span class="hi">${mode === 'lua' ? 'EVALSHA place_bid' : 'GET → check → SET'}</span>`);
      renderKV(); renderBuffer(); renderPG(); renderBidders();
      verdict('', mode === 'lua' ? 'Atomic mode. Fire the bids and watch Bilal get rejected cleanly.' : 'Naive mode. Fire the bids and watch the interleave.');
      btns(true, false, false);
    }
    async function fire() {
      if (busy) return; busy = true; btns(false, false, false); const my = epoch, live = () => my === epoch;
      say('<span class="hi">3 bids arrive within 2ms</span>');
      if (mode === 'naive') {
        const [a, b, k] = B;
        sending('Asha', true); sending('Bilal', true);
        say(`worker-1 · Asha  · HGET price → ${rupee(S.price)}`); await step(); if (!live()) return;
        say(`worker-2 · Bilal · HGET price → ${rupee(S.price)}  <span class="bad">(same stale read)</span>`); await step(); if (!live()) return;
        say(`worker-1 · Asha  · ${rupee(a.amt)} > ${rupee(S.price)} ✓`); await step(400);
        say(`worker-2 · Bilal · ${rupee(b.amt)} > ${rupee(S.price)} ✓  <span class="bad">(checked against stale price)</span>`); await step(400); if (!live()) return;
        S.price = a.amt; S.leader = 'Asha'; S.buffer.push({ who: 'Asha', amt: a.amt }); renderKV(['price_paise', 'leader']); renderBuffer();
        sending('Asha', false); setStatus('Asha', 'ok', 'leading');
        say(`worker-1 · Asha  · HSET price ${rupee(a.amt)} leader Asha → “you're leading”`); await step(); if (!live()) return;
        S.leader = 'Bilal'; S.buffer.push({ who: 'Bilal', amt: b.amt }); renderKV(['leader']); renderBuffer();
        sending('Bilal', false); setStatus('Bilal', 'ok', 'leading'); setStatus('Asha', 'lie', 'told leading ✗');
        say(`worker-2 · Bilal · HSET price ${rupee(b.amt)} leader Bilal → “you're leading”  <span class="bad">(Asha's write overwritten)</span>`); await step(); if (!live()) return;
        sending('Kabir', true); await step(300);
        S.price = k.amt; S.leader = 'Kabir'; S.buffer.push({ who: 'Kabir', amt: k.amt }); renderKV(['price_paise', 'leader']); renderBuffer();
        sending('Kabir', false); setStatus('Kabir', 'ok', 'leading'); setStatus('Bilal', 'no', 'outbid');
        say(`worker-3 · Kabir · GET → check → SET ${rupee(k.amt)}`);
        verdict('bad', 'Lost update. Asha and Bilal were both told they led at ₹16,000, and two "accepted" bids sit at the same price. In the closing second, that is a disputed sale.');
      } else {
        for (const b of B) {
          if (!live()) return;
          sending(b.id, true); await step(380);
          if (b.amt > S.price) {
            S.seq += 1; S.price = b.amt; S.leader = b.id; S.buffer.push({ seq: S.seq, who: b.id, amt: b.amt });
            renderKV(['price_paise', 'leader', 'seq']); renderBuffer();
            Object.keys(S.status).forEach((w) => { if (S.status[w].cls === 'ok') setStatus(w, 'no', 'outbid'); });
            setStatus(b.id, 'ok', `accepted · seq ${S.seq}`);
            say(`EVALSHA place_bid ${b.amt} ${b.id} → <span class="ok">{1, ${S.seq}}</span> accepted`);
          } else {
            setStatus(b.id, 'no', 'rejected');
            say(`EVALSHA place_bid ${b.amt} ${b.id} → <span class="bad">{0, ${S.price}}</span> must beat ${rupee(S.price)}  <span class="hi">(ran after Asha's script, never during)</span>`);
          }
          sending(b.id, false); await step(420);
        }
        verdict('good', 'One leader at every instant. Bilal saw the true price and was rejected; every accepted bid got the next seq. Now drain, or crash the drain.');
      }
      if (!live()) return; busy = false; btns(false, true, true);
    }
    async function drain(crash) {
      if (busy) return; busy = true; btns(false, false, false); const my = epoch, live = () => my === epoch;
      say(`<span class="hi">celery · drain_bids(42)${crash ? ' · (this worker will be killed)' : ''}</span>`); await step(400);
      const batch = mode === 'lua' ? S.buffer.filter((b) => b.seq > S.persisted) : [...S.buffer];
      say(`LRANGE bids:42 → ${S.buffer.length} items${mode === 'lua' ? ` · keep seq > persisted_seq (${S.persisted}) → ${batch.length}` : ' · no seq to check'}`); await step(); if (!live()) return;
      const from = S.pg.length;
      if (batch.length) { S.pg.push(...batch.map((b) => ({ ...b }))); renderPG(from); say(`<span class="ok">BEGIN; INSERT ${batch.length} rows; COMMIT</span>`); }
      else say('<span class="ok">nothing new · INSERT skipped (no-op)</span>');
      await step(); if (!live()) return;
      if (mode === 'lua' && batch.length) { S.persisted = batch[batch.length - 1].seq; renderKV(['persisted_seq']); say(`HSET listing:42 persisted_seq ${S.persisted}`); await step(400); }
      if (crash) {
        say('<span class="bad">✕ SIGKILL: worker died after COMMIT, before LTRIM. Buffer is still full.</span>');
        verdict(mode === 'lua' ? '' : 'bad', mode === 'lua' ? 'The worker died before trimming the buffer. Celery will retry. Will it double-insert? Press Drain.' : 'The worker died before trimming. With nothing to tell old bids from new ones, the retry inserts them again. Press Drain.');
        busy = false; btns(false, true, false); return;
      }
      S.buffer = []; renderBuffer(); say('LTRIM bids:42 → empty');
      const dupes = S.pg.length - new Set(S.pg.map((r) => r.who + r.amt + (r.seq ?? ''))).size;
      if (mode === 'lua') verdict('good', batch.length ? `Persisted. Postgres matches Redis exactly: ${S.pg.length} rows, no gaps, no duplicates.` : 'Re-drain inserted 0 rows: every buffered seq was already at or below persisted_seq. Crash-safe by construction.');
      else verdict('bad', dupes ? `Postgres now holds ${dupes} duplicate bid${dupes > 1 ? 's' : ''} from the retry, on top of two "winning" bids at ₹16,000.` : 'Postgres has two accepted bids at ₹16,000 (⚠). The history disagrees with what bidders were told.');
      busy = false; btns(false, false, false);
    }
    $$('#sim .seg button').forEach((b) => b.addEventListener('click', () => { mode = b.dataset.mode; $$('#sim .seg button').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); reset(); }));
    ui.fire.addEventListener('click', fire); ui.drain.addEventListener('click', () => drain(false)); ui.crash.addEventListener('click', () => drain(true)); ui.reset.addEventListener('click', reset);
    reset();
  }

  /* ══ ETL + trigram entity resolution (try it) ═══════════════════════ */
  {
    const RAW = [['Hot Wheels', "'67 Camaro", '1:64', 'Carded', 'a'], ['HOT WHEELS ', '67 camaro', '1/64', 'carded', 'a'], ['Hot Wheels', '67 Chevy Camaro', '1:64', 'Carded', 'a'],
      ['Hot Wheels', '67 Camaro', '1:64', 'Loose', 'b'], ['Matchbox', '67 Camaro', '1:64', 'Carded', 'c'], ['Hot Wheels', 'Twin Mill', '1:64', 'Carded', 'd'], ['Hot Wheels', 'Twin Duel', '1:64', 'Carded', 'e']];
    const norm = (s) => s.toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9: ]+/g, ' ').replace(/\s+/g, ' ').trim();
    const trigrams = (s) => { const out = new Set(); for (const w of s.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)) { const p = '  ' + w + ' '; for (let i = 0; i < p.length - 2; i++) out.add(p.slice(i, i + 3)); } return out; };
    const sim = (a, b) => { const A = trigrams(a), Bt = trigrams(b); let n = 0; A.forEach((t) => Bt.has(t) && n++); return n / (A.size + Bt.size - n || 1); };
    const fnv = (s) => { let h = 0x811c9dc5; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 0x01000193); } return (h >>> 0).toString(16).padStart(8, '0'); };
    const hash = async (s) => { try { const b = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(s)); return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('').slice(0, 10); } catch (e) { return fnv(s); } };
    const body = $('#etl-body'), ents = $('#entities'), th = $('#etl-th'), thOut = $('#etl-th-out');
    const c = { ins: $('#c-ins'), mrg: $('#c-mrg'), unc: $('#c-unc'), run: $('#c-run') };
    let store, runs, running = false, prepared;
    async function prepare() {
      prepared = await Promise.all(RAW.map(async ([brand, name, scale, pack, truth]) => {
        const n = { brand: norm(brand), name: norm(name), scale: scale.replace('/', ':').trim(), pack: norm(pack) };
        return { raw: [brand, name, scale, pack].join(','), n, truth, key: await hash(`${n.brand}|${n.name}|${n.scale}|${n.pack}`), bucket: `${n.brand}|${n.scale}|${n.pack}` };
      }));
    }
    const resetStore = () => { store = { keys: new Map(), entities: [] }; runs = 0; };
    function decide(r) {
      if (store.keys.has(r.key)) { const e = store.keys.get(r.key); return { kind: e.seenThisRun ? 'exact' : 'same', e }; }
      let best = null, bs = 0;
      for (const e of store.entities) { if (e.bucket !== r.bucket) continue; const s = sim(r.n.name, e.name); if (s > bs) { bs = s; best = e; } }
      if (best && bs >= +th.value) return { kind: 'fuzzy', e: best, score: bs };
      return { kind: 'new', score: best ? bs : null };
    }
    function apply(r, d) {
      if (d.kind === 'new') { const e = { name: r.n.name, label: `${r.n.brand} · ${r.n.name}`, bucket: r.bucket, rows: 1, truths: new Set([r.truth]), seenThisRun: true }; store.entities.push(e); store.keys.set(r.key, e); return; }
      if (d.kind === 'fuzzy') { d.e.rows++; d.e.truths.add(r.truth); store.keys.set(r.key, d.e); return; }
      if (d.kind === 'exact') { d.e.rows++; d.e.truths.add(r.truth); }
    }
    const matchCell = (d) => d.kind === 'exact' ? 'key hit (this run)' : d.kind === 'same' ? 'key hit (already loaded)' : d.kind === 'fuzzy' ? `trigram <span class="score">${d.score.toFixed(2)}</span> vs “${d.e.name}”` : d.score != null ? `best in bucket <span class="score">${d.score.toFixed(2)}</span> &lt; ${(+th.value).toFixed(2)}` : 'no candidate in bucket';
    const actionCell = (d) => ({ new: '<span class="tag new">INSERT</span>', exact: '<span class="tag exact">MERGE · exact</span>', fuzzy: '<span class="tag fuzzy">MERGE · fuzzy</span>', same: '<span class="tag same">UNCHANGED</span>' })[d.kind];
    function renderEntities() {
      ents.innerHTML = store.entities.map((e) => `<div class="entity"><b>${e.label}</b><span>${e.bucket.split('|').slice(1).join(' · ')} · ${e.rows} source row${e.rows > 1 ? 's' : ''}</span>${e.truths.size > 1 ? '<em>⚠ false merge: two different castings</em>' : ''}</div>`).join('');
      const byTruth = {}; store.entities.forEach((e) => e.truths.forEach((t) => (byTruth[t] = (byTruth[t] || 0) + 1)));
      if (Object.values(byTruth).some((n) => n > 1)) ents.insertAdjacentHTML('beforeend', '<div class="entity" style="border-style:dashed"><b>⚠ missed duplicate</b><span>a real variant stayed split. Threshold too strict.</span></div>');
    }
    async function run(animate) {
      if (running) return; running = true;
      if (!prepared) await prepare();
      store.entities.forEach((e) => (e.seenThisRun = false)); runs++;
      let ins = 0, mrg = 0, unc = 0;
      body.innerHTML = prepared.map((r) => `<tr><td class="raw">${r.raw}</td><td class="pending">${r.n.brand} | ${r.n.name} | ${r.n.scale} | ${r.n.pack}</td><td class="pending key">${r.key}</td><td class="pending"></td><td class="pending"></td></tr>`).join('');
      const trs = $$('tr', body);
      for (let i = 0; i < prepared.length; i++) {
        const r = prepared[i], tds = $$('td', trs[i]), dd = decide(r);
        tds[3].innerHTML = matchCell(dd); tds[4].innerHTML = actionCell(dd);
        for (let j = 1; j < 5; j++) { if (animate) { tds[j].classList.add('active'); await sleep(T(140)); tds[j].classList.remove('active'); } tds[j].classList.remove('pending'); }
        apply(r, dd);
        if (dd.kind === 'new') ins++; else if (dd.kind === 'same') unc++; else mrg++;
        c.ins.textContent = ins; c.mrg.textContent = mrg; c.unc.textContent = unc;
        if (animate) renderEntities();
      }
      c.run.textContent = runs; renderEntities(); $('#etl-run').textContent = 'Run it again'; running = false;
    }
    $('#etl-run').addEventListener('click', () => run(true));
    th.addEventListener('input', () => { thOut.textContent = (+th.value).toFixed(2); if (!running) { resetStore(); run(false); } });
    resetStore();
    prepare().then(() => { body.innerHTML = prepared.map((r) => `<tr><td class="raw">${r.raw}</td><td class="pending">waiting</td><td class="pending key">·</td><td class="pending">·</td><td class="pending">·</td></tr>`).join(''); });
  }

  /* ══ RAG walk-through + support agent ═══════════════════════════════ */
  {
    const svg = $('#rag-svg'), steps = $$('#rag-steps li'), ans = $('#rag-answer');
    let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const C = { gri: [110, 92, 'oklch(0.78 0.15 52)'], brsr: [300, 110, 'oklch(0.72 0.14 266)'], meth: [205, 238, 'oklch(0.8 0.1 165)'] };
    const LABELS = { gri: ['GRI 305-2 · energy indirect (Scope 2) GHG', 'GRI 305-2 · market-based method', 'GRI 305 · base year & recalculation', 'GRI 305-1 · direct (Scope 1)'], brsr: ['BRSR P6 · Scope 1 & 2 emissions + intensity', 'BRSR P6 · energy consumption', 'BRSR · reporting boundary'], meth: ['Grid emission factors by state', 'Purchased electricity methodology'] };
    const pts = [];
    for (const [k, [cx, cy, col]] of Object.entries(C)) for (let i = 0; i < 20; i++) {
      const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * 62;
      const p = { k, x: cx + Math.cos(a) * r * 1.2, y: cy + Math.sin(a) * r * 0.85, label: LABELS[k][i] };
      p.n = sv('circle', { cx: p.x, cy: p.y, r: 3.2, fill: col, class: 'pt', opacity: 0.55 }); pts.push(p);
    }
    const gL = sv('g'), gP = sv('g'), gT = sv('g'); pts.forEach((p) => gP.appendChild(p.n));
    const q = sv('g', { opacity: 0 }); q.append(sv('circle', { r: 7, fill: 'none', stroke: 'oklch(0.97 0.01 85)', 'stroke-width': 2 }), sv('circle', { r: 2.5, fill: 'oklch(0.97 0.01 85)' }));
    svg.append(gL, gP, q, gT);
    const Q = [
      { at: [118, 80], k: 3, near: 'gri', tool: null, embed: 'route → knowledge (no account data needed)', answer: 'GRI 305-2 asks for gross location-based Scope 2 emissions in tCO₂e, market-based figures where applicable, the gases included, the base year, the emission-factor sources and the consolidation approach. [GRI 305-2 · 305 base-year chunk]' },
      { at: null, k: 0, embed: 'route → platform data (asks about “our” numbers)', tool: 'query_emissions(scope=2, periods=["2026-Q2","2026-Q3"])\n→ SELECT period, SUM(co2e_t) … GROUP BY period\n← Q2 412.6 · Q3 468.1', answer: 'Scope 2 rose 13.5% quarter on quarter, from 412.6 to 468.1 tCO₂e. Most of it is purchased electricity; ask me which site drove it. (demo data)' },
      { at: [262, 128], k: 3, near: 'brsr', embed: 'route → both (data question + standard question)', tool: 'query_emissions(scope=2, group_by="site", periods=["2026-Q2","2026-Q3"])\n← Pune plant +41.2 t of +55.5 t', answer: 'The Pune plant accounts for 41.2 of the 55.5 tCO₂e increase. And yes: BRSR Principle 6 asks for total Scope 1 and 2 emissions and intensity, so it will show in your next BRSR report. [BRSR P6 chunk] (demo data)' },
    ];
    let qid = 0;
    const setStep = (s, state, code = '') => { const li = steps.find((x) => x.dataset.s === s); li.className = state; $('code', li).textContent = code; };
    async function ask(i) {
      const my = ++qid, cfg = Q[i], live = () => my === qid;
      $$('.rag-q button').forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.q === i)));
      steps.forEach((li) => { li.className = ''; $('code', li).textContent = ''; });
      gL.innerHTML = ''; gT.innerHTML = ''; q.setAttribute('opacity', 0);
      pts.forEach((p) => { p.n.setAttribute('r', 3.2); p.n.setAttribute('opacity', 0.55); });
      ans.innerHTML = '<span class="cur"></span>';
      setStep('embed', 'on', cfg.embed); await sleep(T(700)); if (!live()) return;
      if (cfg.at) {
        q.setAttribute('transform', `translate(${cfg.at[0]} ${cfg.at[1]})`); q.setAttribute('opacity', 1);
        const ranked = pts.filter((p) => p.label).map((p) => ({ p, d: Math.hypot(p.x - cfg.at[0], p.y - cfg.at[1]) * (p.k === cfg.near ? 0.6 : 1) })).sort((a, b) => a.d - b.d).slice(0, cfg.k);
        setStep('search', 'on', 'SELECT chunk FROM kb\nORDER BY embedding <=> $1 LIMIT ' + cfg.k); $('#rag-k').textContent = 'top-k: ' + cfg.k;
        pts.forEach((p) => p.n.setAttribute('opacity', 0.22));
        for (const { p } of ranked) {
          if (!live()) return;
          gL.appendChild(sv('line', { x1: cfg.at[0], y1: cfg.at[1], x2: p.x, y2: p.y, stroke: 'oklch(0.97 0.01 85)', 'stroke-opacity': 0.6, 'stroke-width': 1.2, 'stroke-dasharray': '3 3' }));
          p.n.setAttribute('r', 6); p.n.setAttribute('opacity', 1);
          gT.appendChild(sv('text', { x: Math.min(p.x + 9, 250), y: p.y - 8, fill: 'oklch(0.93 0.015 85)', 'font-size': 10, 'font-family': 'Martian Mono, monospace' }, p.label));
          await sleep(T(320));
        }
      } else { setStep('search', 'skip', 'skipped: nothing to retrieve'); $('#rag-k').textContent = 'top-k: 0'; }
      await sleep(T(500)); if (!live()) return;
      if (cfg.tool) { setStep('tool', 'on', cfg.tool); await sleep(T(1000)); } else setStep('tool', 'skip', 'skipped: no account data asked');
      if (!live()) return;
      setStep('llm', 'on', 'answer only from retrieved chunks + tool rows');
      const text = cfg.answer, cur = el('span', { class: 'cur' }); ans.textContent = '';
      for (let j = 0; j <= text.length; j += reduce ? text.length : 3) { if (!live()) return; ans.textContent = text.slice(0, j); ans.appendChild(cur); await sleep(14); }
      ans.textContent = text;
    }
    $$('.rag-q button').forEach((b) => b.addEventListener('click', () => ask(+b.dataset.q)));
    let started = false;
    new IntersectionObserver(([e]) => { if (e.isIntersecting && !started) { started = true; ask(1); } }, { threshold: 0.4 }).observe(svg);

    const M = [
      { answer: 'Sellers dispatch within the window shown on the listing, and tracking appears under Orders once it ships.', escalate: false, source: 'faq:shipping' },
      { answer: "I've passed this to our payments team. You'll hear back on this thread.", escalate: true, reason: 'financial' },
    ];
    const pre = $('#sup-json');
    const showM = (i) => {
      const m = M[i];
      pre.innerHTML = '{\n' + Object.entries(m).map(([k, v]) => `  <span class="k">"${k}"</span>: ${typeof v === 'boolean' ? `<span class="${v ? 'f' : 't'}">${v}</span>` : `<span class="s">"${v}"</span>`}`).join(',\n') + '\n}' + (m.escalate ? '\n<span class="f">→ routed to a human · AI stops replying</span>' : '\n<span class="t">→ sent · grounded in cached KB</span>');
      $$('#sup-seg button').forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.m === i)));
    };
    $$('#sup-seg button').forEach((b) => b.addEventListener('click', () => showM(+b.dataset.m)));
    showM(0);
  }

  /* ══ Shipped: browser tabs + phone cycles ═══════════════════════════ */
  {
    const tabs = $$('.tabs button'), imgs = $$('#viewport img'), url = $('#url');
    let cur = 0, autoTab = !reduce, vis = false;
    const show = (i) => { cur = i; tabs.forEach((t, j) => t.setAttribute('aria-selected', String(j === i))); imgs.forEach((m, j) => m.classList.toggle('on', j === i)); url.textContent = imgs[i].dataset.url; };
    tabs.forEach((t) => t.addEventListener('click', () => { autoTab = false; show(+t.dataset.i); }));
    onScreen($('#viewport'), (v) => (vis = v));
    if (!reduce) {
      setInterval(() => { if (autoTab && vis && !document.hidden) show((cur + 1) % imgs.length); }, 4200);
      $$('[data-cycle]').forEach((scr, k) => {
        const ims = $$('img', scr); let j = 0;
        setTimeout(() => setInterval(() => { if (!vis || document.hidden) return; ims[j].classList.remove('on'); j = (j + 1) % ims.length; ims[j].classList.add('on'); }, 3400), k * 1700);
      });
    }
  }

  /* ══ Hire form (FormSubmit) + view counter (GoatCounter) ════════════ */
  {
    const form = $('#hire'), status = $('#hire-status'), send = $('#hire-send');
    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      if (form._honey.value) return;
      send.disabled = true; status.className = 'form-status'; status.textContent = 'Sending…';
      const data = Object.fromEntries(new FormData(form)); delete data._honey;
      try {
        const res = await fetch(form.action.replace('formsubmit.co/', 'formsubmit.co/ajax/'), { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) });
        const body = await res.json().catch(() => ({}));
        if (!res.ok || String(body.success) === 'false') throw new Error(body.message || res.status);
        try { window.goatcounter && window.goatcounter.count({ path: 'hire-form-sent', title: data.kind, event: true }); } catch (e) {}
        const esc = (s) => s.replace(/[<>&"]/g, '');
        form.innerHTML = `<div class="sent-msg"><code>201 Created</code><b>Thanks, ${esc(data.name.split(' ')[0])}. Request received.</b><p style="margin:0;color:var(--ink-2)">It's in my inbox now. I'll reply to ${esc(data.email)}.</p></div>`;
      } catch (e) {
        send.disabled = false; status.className = 'form-status err';
        status.innerHTML = 'Couldn’t send that. Email me directly: <a href="mailto:upipersaniya@gmail.com">upipersaniya@gmail.com</a>';
      }
    });
    fetch('https://utsavp.goatcounter.com/counter/TOTAL.json')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((j) => { if (j && j.count) $('#views').textContent = `Hire · viewed ${j.count} times`; })
      .catch(() => {});
  }
})();
