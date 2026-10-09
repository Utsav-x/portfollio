/* Every demo on the page. No dependencies, no network. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const T = (ms) => (reduce ? 0 : ms);
  const rupee = (paise) => '₹' + (paise / 100).toLocaleString('en-IN');
  const el = (tag, attrs = {}, html = '') => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    n.innerHTML = html;
    return n;
  };
  const SVG = 'http://www.w3.org/2000/svg';
  const sv = (tag, attrs = {}) => {
    const n = document.createElementNS(SVG, tag);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    return n;
  };

  /* ── Theme ─────────────────────────────────────────────────────────── */
  $('#theme').addEventListener('click', () => {
    const root = document.documentElement;
    const dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    root.dataset.theme = dark ? 'light' : 'dark';
    try { localStorage.setItem('theme', root.dataset.theme); } catch (e) {}
  });

  /* ── Name: letter-by-letter rise ───────────────────────────────────── */
  let d = 0;
  $$('[data-split]').forEach((span) => {
    const text = span.textContent;
    span.textContent = '';
    for (const ch of text) {
      const c = el('span', { class: 'ch', 'aria-hidden': 'true' }, ch);
      c.style.animationDelay = `${(d += 38)}ms`;
      span.appendChild(c);
    }
  });

  /* ── Scroll reveal, bars, nav state ────────────────────────────────── */
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('in');
      if (e.target.matches('.m')) {
        $('.after', e.target).style.setProperty('--s', e.target.dataset.after);
      }
      io.unobserve(e.target);
    }
  }, { threshold: 0.15 });
  $$('.reveal').forEach((n) => io.observe(n));

  const navLinks = $$('.routes a');
  const navIO = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      navLinks.forEach((a) => a.setAttribute('aria-current', a.getAttribute('href') === '#' + e.target.id ? 'true' : 'false'));
    }
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('main section[id], footer[id]').forEach((s) => navIO.observe(s));

  /* ── Ledger accordion ──────────────────────────────────────────────── */
  $$('#ledger > li > button').forEach((b) => b.addEventListener('click', () => {
    const li = b.parentElement;
    const open = !li.classList.contains('open');
    li.classList.toggle('open', open);
    b.setAttribute('aria-expanded', String(open));
  }));

  /* ══ Hero trace ════════════════════════════════════════════════════ */
  {
    const svg = $('#trace-svg'), log = $('#trace-log');
    const N = {
      browser:  [62, 180, 'browser', 'client'],
      nginx:    [184, 180, 'nginx', 'gunicorn'],
      llm:      [184, 42, 'llm api', 'openai · gemini'],
      django:   [316, 84, 'django', 'drf · views'],
      channels: [316, 276, 'channels', 'websocket'],
      postgres: [452, 84, 'postgres', 'pgvector'],
      redis:    [452, 276, 'redis', 'lua · hashes'],
      celery:   [580, 180, 'celery', 'worker · beat'],
      source:   [580, 318, 'source', '3rd-party api'],
    };
    const E = [['browser','nginx'],['nginx','django'],['nginx','channels'],['django','llm'],['django','postgres'],['django','redis'],
      ['channels','redis'],['redis','celery'],['celery','postgres'],['celery','source']];
    const key = (a, b) => [a, b].sort().join('-');
    const edges = {};
    const gE = sv('g'), gN = sv('g');
    for (const [a, b] of E) {
      const l = sv('line', { class: 'edge', x1: N[a][0], y1: N[a][1], x2: N[b][0], y2: N[b][1] });
      gE.appendChild(l); edges[key(a, b)] = l;
    }
    const nodes = {};
    for (const [k, [x, y, t, s]] of Object.entries(N)) {
      const g = sv('g', { class: 'node' });
      g.appendChild(sv('rect', { x: x - 54, y: y - 21, width: 108, height: 42, rx: 9 }));
      const t1 = sv('text', { x, y: y - 2, 'text-anchor': 'middle' }); t1.textContent = t;
      const t2 = sv('text', { x, y: y + 12, 'text-anchor': 'middle', class: 'sub' }); t2.textContent = s;
      g.append(t1, t2); gN.appendChild(g); nodes[k] = g;
    }
    const packet = sv('circle', { r: 5, class: 'packet', cx: -20, cy: -20 });
    svg.append(gE, gN, packet);

    const R = {
      bid: [['browser','nginx','wss upgrade · /ws/listing/42'],['nginx','channels','consumer.receive {bid: 1650000}'],['channels','redis','EVALSHA place_bid → accepted · seq=42'],
        ['redis','channels','PUBLISH listing:42 → leaderboard'],['channels','nginx','group_send to 38 sockets'],['nginx','browser','“You are leading”'],
        ['redis','celery','beat · drain_bids(42): LRANGE bids:42'],['celery','postgres','INSERT 2 bids (seq 41..42) · persisted_seq=42']],
      ask: [['browser','nginx','POST /chat/ask'],['nginx','django','ChatView · auth · org scope'],['django','llm','embed(question)'],['llm','django','vector[1536]'],
        ['django','postgres','ORDER BY embedding <=> $1 LIMIT 3'],['postgres','django','3 chunks · tool: query_emissions()'],['django','llm','grounded completion'],
        ['llm','django','answer + citations'],['django','nginx','200 · stream'],['nginx','browser','rendered answer']],
      etl: [['celery','source','beat · etl.run → GET /records?since=…'],['source','celery','2,314 records'],['celery','postgres','pandas transform → validate → upsert'],
        ['postgres','django','run 100% · 0 rejected'],['django','nginx','SSE event: progress'],['nginx','browser','progress bar → done']],
      view: [['browser','nginx','GET /listing/42'],['nginx','django','ListingView'],['django','redis','HINCRBY views:2026100920 42 1 (never raises)'],
        ['redis','django','ok'],['django','postgres','SELECT listing 42'],['postgres','django','row'],['django','nginx','200'],['nginx','browser','page · 41ms']],
    };
    let run = 0, auto = !reduce, visible = true;
    const line = (msg, ms) => {
      const row = el('div', {}, `<span class="t">+${String(ms).padStart(3, ' ')}ms</span> <span class="k">${msg.replace(/</g, '&lt;')}</span>`);
      log.appendChild(row);
      while (log.children.length > 7) log.firstChild.remove();
    };
    const move = (a, b, dur) => new Promise((res) => {
      if (!dur) return res();
      const [x1, y1] = N[a], [x2, y2] = N[b]; const t0 = performance.now();
      const step = (t) => {
        const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
        packet.setAttribute('cx', x1 + (x2 - x1) * e); packet.setAttribute('cy', y1 + (y2 - y1) * e);
        p < 1 ? requestAnimationFrame(step) : res();
      };
      requestAnimationFrame(step);
    });
    async function play(name) {
      const id = ++run;
      $$('.trace-actions button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.route === name)));
      Object.values(edges).forEach((l) => l.classList.remove('lit'));
      Object.values(nodes).forEach((n) => n.classList.remove('hot'));
      log.innerHTML = '';
      let ms = 0;
      for (const [a, b, msg] of R[name]) {
        if (id !== run) return;
        edges[key(a, b)].classList.add('lit');
        nodes[a].classList.add('hot');
        await move(a, b, T(420));
        nodes[a].classList.remove('hot'); nodes[b].classList.add('hot');
        ms += 1 + Math.round(Math.random() * 9) + (b === 'llm' || a === 'llm' ? 180 : 0) + (a === 'source' ? 240 : 0);
        line(`${b.padEnd(8, ' ')} ${msg}`, ms);
        await sleep(T(160));
      }
      packet.setAttribute('cx', -20);
    }
    const order = ['bid', 'ask', 'etl', 'view'];
    let i = 0;
    $$('.trace-actions button').forEach((b) => b.addEventListener('click', () => { auto = false; play(b.dataset.route); }));
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(svg);
    (async function loop() {
      await play(order[0]);
      while (auto) {
        await sleep(2600);
        if (!auto) break;
        if (visible && !document.hidden) await play(order[(i = (i + 1) % order.length)]);
      }
    })();
  }

  /* ══ Bid race simulator ════════════════════════════════════════════ */
  {
    const B = [
      { id: 'Asha', amt: 1600000, c: 'oklch(0.75 0.12 200)' },
      { id: 'Bilal', amt: 1600000, c: 'oklch(0.78 0.13 80)' },
      { id: 'Kabir', amt: 1650000, c: 'oklch(0.75 0.13 320)' },
    ];
    const ui = { bidders: $('#bidders'), kv: $('#kv'), buffer: $('#buffer'), pg: $('#pg'), cnt: $('#pg-count'), log: $('#sim-log'), verdict: $('#verdict'),
      fire: $('#fire'), drain: $('#drain'), crash: $('#crash'), reset: $('#reset') };
    let mode = 'lua', S, busy = false, epoch = 0;

    const fresh = () => ({ price: 1590000, leader: 'Meera', seq: 40, persisted: 40, buffer: [],
      pg: [{ seq: 39, who: 'Ravi', amt: 1540000 }, { seq: 40, who: 'Meera', amt: 1590000 }], status: {} });

    function renderKV(flash) {
      const rows = [['price_paise', S.price.toLocaleString('en-IN') + ` (${rupee(S.price)})`], ['leader', S.leader],
        ['seq', mode === 'lua' ? S.seq : '(none)'], ['persisted_seq', mode === 'lua' ? S.persisted : '(none)']];
      ui.kv.innerHTML = rows.map(([k, v]) => `<dt>${k}</dt><dd class="${flash && flash.includes(k) ? 'flash' : ''}">${v}</dd>`).join('');
    }
    function renderBuffer() {
      ui.buffer.innerHTML = '<span class="lbl">LIST bids:42 (buffer)</span>' +
        (S.buffer.length ? S.buffer.map((b) => `<span class="tok">${b.seq ?? '?'} · ${b.who} ${rupee(b.amt)}</span>`).join('') : '<span class="tok ghost">empty</span>');
    }
    function renderPG(newFrom = Infinity) {
      const seen = {};
      ui.pg.innerHTML = S.pg.map((r, i) => {
        const k = r.amt; const dupe = seen[k]; seen[k] = true;
        return `<tr class="${i >= newFrom ? 'new' : ''} ${dupe ? 'dupe' : ''}"><td>${r.seq ?? '?'}</td><td>${r.who}</td><td>${rupee(r.amt)}${dupe ? ' ⚠' : ''}</td></tr>`;
      }).join('');
      ui.cnt.textContent = `${S.pg.length} rows`;
    }
    function renderBidders() {
      ui.bidders.innerHTML = B.map((b) => {
        const st = S.status[b.id] || {};
        return `<div class="bidder ${st.cls || ''}" data-b="${b.id}"><span class="av" style="color:${b.c}">${b.id[0]}</span>
          <span><b style="font-size:.85rem">${b.id}</b><br><span class="amt">${rupee(b.amt)}</span></span><span class="res">${st.txt || 'idle'}</span></div>`;
      }).join('');
    }
    const say = (html) => { ui.log.insertAdjacentHTML('beforeend', `<div>${html}</div>`); ui.log.scrollTop = ui.log.scrollHeight; };
    const setStatus = (who, cls, txt) => { S.status[who] = { cls, txt }; renderBidders(); };
    const sending = (who, on) => { const n = $(`[data-b="${who}"]`, ui.bidders); if (n) n.classList.toggle('sending', on); };
    const verdict = (cls, txt) => { ui.verdict.className = 'verdict ' + cls; ui.verdict.textContent = txt; };
    const btns = (fire, drain, crash) => { ui.fire.disabled = !fire; ui.drain.disabled = !drain; ui.crash.disabled = !crash; };

    function reset() {
      epoch++; busy = false; S = fresh(); ui.log.innerHTML = '';
      say(`<span class="hi">listing:42</span> open · ${rupee(S.price)} · leader Meera · mode <span class="hi">${mode === 'lua' ? 'EVALSHA place_bid' : 'GET → check → SET'}</span>`);
      renderKV(); renderBuffer(); renderPG(); renderBidders();
      verdict('', mode === 'lua' ? 'Atomic mode. Fire the bids and watch Bilal get rejected cleanly.' : 'Naive mode. Fire the bids and watch the interleave.');
      btns(true, false, false);
    }

    const step = async (ms = 520) => { await sleep(T(ms)); };

    async function fire() {
      if (busy) return; busy = true; btns(false, false, false); const my = epoch;
      const live = () => my === epoch;
      say('<span class="hi">— 3 bids arrive within 2ms —</span>');
      if (mode === 'naive') {
        const [a, b, k] = B;
        sending('Asha', true); sending('Bilal', true);
        say(`worker-1 · Asha  · HGET price → ${rupee(S.price)}`); await step(); if (!live()) return;
        say(`worker-2 · Bilal · HGET price → ${rupee(S.price)}  <span class="bad">(same stale read)</span>`); await step(); if (!live()) return;
        say(`worker-1 · Asha  · ${rupee(a.amt)} > ${rupee(S.price)} ✓`); await step(400);
        say(`worker-2 · Bilal · ${rupee(b.amt)} > ${rupee(S.price)} ✓  <span class="bad">(checked against stale price)</span>`); await step(400); if (!live()) return;
        S.price = a.amt; S.leader = 'Asha'; S.buffer.push({ who: 'Asha', amt: a.amt }); renderKV(['price_paise', 'leader']); renderBuffer();
        sending('Asha', false); setStatus('Asha', 'ok', 'leading');
        say(`worker-1 · Asha  · HSET price ${rupee(a.amt)} leader Asha → notify “you're leading”`); await step(); if (!live()) return;
        S.leader = 'Bilal'; S.buffer.push({ who: 'Bilal', amt: b.amt }); renderKV(['leader']); renderBuffer();
        sending('Bilal', false); setStatus('Bilal', 'ok', 'leading'); setStatus('Asha', 'lie', 'told leading ✗');
        say(`worker-2 · Bilal · HSET price ${rupee(b.amt)} leader Bilal → notify “you're leading”  <span class="bad">(Asha's write overwritten)</span>`); await step(); if (!live()) return;
        sending('Kabir', true); await step(300);
        S.price = k.amt; S.leader = 'Kabir'; S.buffer.push({ who: 'Kabir', amt: k.amt }); renderKV(['price_paise', 'leader']); renderBuffer();
        sending('Kabir', false); setStatus('Kabir', 'ok', 'leading'); setStatus('Bilal', 'no', 'outbid');
        say(`worker-3 · Kabir · GET → check → SET ${rupee(k.amt)}`);
        verdict('bad', 'Lost update. Asha and Bilal were both told they led at ₹16,000, and two "accepted" bids now sit at the same price. Land that in the closing second and you have a disputed sale.');
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
      if (!live()) return;
      busy = false; btns(false, true, true);
    }

    async function drain(crash) {
      if (busy) return; busy = true; btns(false, false, false); const my = epoch; const live = () => my === epoch;
      say(`<span class="hi">celery · drain_bids(42)${crash ? ' · (this worker will be killed)' : ''}</span>`); await step(400);
      const batch = mode === 'lua' ? S.buffer.filter((b) => b.seq > S.persisted) : [...S.buffer];
      say(`LRANGE bids:42 → ${S.buffer.length} items${mode === 'lua' ? ` · keep seq > persisted_seq (${S.persisted}) → ${batch.length}` : ' · no seq to check'}`); await step(); if (!live()) return;
      const from = S.pg.length;
      if (batch.length) {
        S.pg.push(...batch.map((b) => ({ ...b }))); renderPG(from);
        say(`<span class="ok">BEGIN; INSERT ${batch.length} rows; COMMIT</span>`);
      } else {
        say('<span class="ok">nothing new · INSERT skipped (no-op)</span>');
      }
      await step(); if (!live()) return;
      if (mode === 'lua' && batch.length) { S.persisted = batch[batch.length - 1].seq; renderKV(['persisted_seq']); say(`HSET listing:42 persisted_seq ${S.persisted}`); await step(400); }
      if (crash) {
        say('<span class="bad">✕ SIGKILL: worker died after COMMIT, before LTRIM. Buffer is still full.</span>');
        if (mode === 'lua') verdict('', 'The worker died before trimming the buffer. Celery will retry the drain. Will it double-insert? Press Drain.');
        else verdict('bad', 'The worker died before trimming. With nothing to tell old bids from new ones, the retry has no choice but to insert them again. Press Drain.');
        busy = false; btns(false, true, false); return;
      }
      S.buffer = []; renderBuffer(); say('LTRIM bids:42 → empty');
      const dupes = S.pg.length - new Set(S.pg.map((r) => r.who + r.amt + (r.seq ?? ''))).size;
      if (mode === 'lua') verdict('good', batch.length ? `Persisted. Postgres matches Redis exactly: ${S.pg.length} rows, no gaps, no duplicates.` : 'Re-drain inserted 0 rows: every buffered seq was already at or below persisted_seq. Crash-safe by construction.');
      else verdict('bad', dupes ? `Postgres now holds ${dupes} duplicate bid${dupes > 1 ? 's' : ''} from the retry, on top of two "winning" bids at ₹16,000.` : 'Postgres has two accepted bids at ₹16,000 (⚠). The history disagrees with what bidders were told.');
      busy = false; btns(false, false, false);
    }

    $$('#sim .seg button').forEach((b) => b.addEventListener('click', () => {
      mode = b.dataset.mode;
      $$('#sim .seg button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      reset();
    }));
    ui.fire.addEventListener('click', fire);
    ui.drain.addEventListener('click', () => drain(false));
    ui.crash.addEventListener('click', () => drain(true));
    ui.reset.addEventListener('click', reset);
    reset();
  }

  /* ══ ETL + trigram entity resolution ═══════════════════════════════ */
  {
    const RAW = [
      ['Hot Wheels', "'67 Camaro", '1:64', 'Carded', 'a'],
      ['HOT WHEELS ', '67 camaro', '1/64', 'carded', 'a'],
      ['Hot Wheels', '67 Chevy Camaro', '1:64', 'Carded', 'a'],
      ['Hot Wheels', '67 Camaro', '1:64', 'Loose', 'b'],
      ['Matchbox', '67 Camaro', '1:64', 'Carded', 'c'],
      ['Hot Wheels', 'Twin Mill', '1:64', 'Carded', 'd'],
      ['Hot Wheels', 'Twin Duel', '1:64', 'Carded', 'e'],
    ]; // last column = ground truth identity, used only to flag wrong merges/splits
    const norm = (s) => s.toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9: ]+/g, ' ').replace(/\s+/g, ' ').trim();
    const normScale = (s) => s.replace('/', ':').trim();
    const trigrams = (s) => {
      const out = new Set();
      for (const w of s.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)) {
        const p = '  ' + w + ' ';
        for (let i = 0; i < p.length - 2; i++) out.add(p.slice(i, i + 3));
      }
      return out;
    };
    const sim = (a, b) => { const A = trigrams(a), B = trigrams(b); let n = 0; A.forEach((t) => B.has(t) && n++); return n / (A.size + B.size - n || 1); };
    const fnv = (s) => { let h = 0x811c9dc5; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 0x01000193); } return (h >>> 0).toString(16).padStart(8, '0'); };
    const hash = async (s) => {
      try { const b = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(s)); return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('').slice(0, 10); }
      catch (e) { return fnv(s); }
    };

    const body = $('#etl-body'), ents = $('#entities'), th = $('#etl-th'), thOut = $('#etl-th-out');
    const c = { ins: $('#c-ins'), mrg: $('#c-mrg'), unc: $('#c-unc'), run: $('#c-run') };
    let store, runs, running = false, prepared;

    async function prepare() {
      prepared = await Promise.all(RAW.map(async ([brand, name, scale, pack, truth]) => {
        const n = { brand: norm(brand), name: norm(name), scale: normScale(scale), pack: norm(pack) };
        return { raw: [brand, name, scale, pack].join(','), n, truth, key: await hash(`${n.brand}|${n.name}|${n.scale}|${n.pack}`), bucket: `${n.brand}|${n.scale}|${n.pack}` };
      }));
    }
    const resetStore = () => { store = { keys: new Map(), entities: [] }; runs = 0; };

    function decide(r) {
      if (store.keys.has(r.key)) {
        const e = store.keys.get(r.key);
        return { kind: e.seenThisRun ? 'exact' : 'same', e };
      }
      let best = null, bs = 0;
      for (const e of store.entities) {
        if (e.bucket !== r.bucket) continue;
        const s = sim(r.n.name, e.name);
        if (s > bs) { bs = s; best = e; }
      }
      if (best && bs >= +th.value) return { kind: 'fuzzy', e: best, score: bs };
      return { kind: 'new', score: best ? bs : null, near: best };
    }
    function apply(r, d) {
      if (d.kind === 'new') {
        const e = { name: r.n.name, label: `${r.n.brand} · ${r.n.name}`, bucket: r.bucket, rows: 1, truths: new Set([r.truth]), seenThisRun: true };
        store.entities.push(e); store.keys.set(r.key, e); return e;
      }
      if (d.kind === 'fuzzy') { d.e.rows++; d.e.truths.add(r.truth); store.keys.set(r.key, d.e); return d.e; }
      if (d.kind === 'exact') { d.e.rows++; d.e.truths.add(r.truth); return d.e; }
      return d.e;
    }
    const matchCell = (r, d) => {
      if (d.kind === 'exact') return 'key hit (this run)';
      if (d.kind === 'same') return 'key hit (already loaded)';
      if (d.kind === 'fuzzy') return `trigram <span class="score">${d.score.toFixed(2)}</span> vs “${d.e.name}”`;
      return d.score != null ? `best in bucket <span class="score">${d.score.toFixed(2)}</span> &lt; ${(+th.value).toFixed(2)}` : 'no candidate in bucket';
    };
    const actionCell = (d) => ({ new: '<span class="tag new">INSERT</span>', exact: '<span class="tag exact">MERGE · exact</span>',
      fuzzy: '<span class="tag fuzzy">MERGE · fuzzy</span>', same: '<span class="tag same">UNCHANGED</span>' })[d.kind];

    function renderEntities() {
      ents.innerHTML = store.entities.map((e) => {
        const wrong = e.truths.size > 1;
        return `<div class="entity"><b>${e.label}</b><span>${e.bucket.split('|').slice(1).join(' · ')} · ${e.rows} source row${e.rows > 1 ? 's' : ''}</span>${wrong ? '<em>⚠ false merge: two different castings</em>' : ''}</div>`;
      }).join('');
      // a missed duplicate = one truth spread over several entities in the same bucket
      const byTruth = {};
      store.entities.forEach((e) => e.truths.forEach((t) => (byTruth[t] = (byTruth[t] || 0) + 1)));
      if (Object.values(byTruth).some((n) => n > 1)) ents.insertAdjacentHTML('beforeend', '<div class="entity" style="border-style:dashed"><b>⚠ missed duplicate</b><span>a real variant stayed split. Threshold too strict.</span></div>');
    }

    async function run(animate) {
      if (running) return; running = true;
      if (!prepared) await prepare();
      store.entities.forEach((e) => (e.seenThisRun = false));
      runs++;
      let ins = 0, mrg = 0, unc = 0;
      body.innerHTML = prepared.map((r) => `<tr><td class="raw">${r.raw}</td><td class="pending">${r.n.brand} | ${r.n.name} | ${r.n.scale} | ${r.n.pack}</td><td class="pending key">${r.key}</td><td class="pending"></td><td class="pending"></td></tr>`).join('');
      const trs = $$('tr', body);
      for (let i = 0; i < prepared.length; i++) {
        const r = prepared[i], tds = $$('td', trs[i]);
        const d = decide(r);
        tds[3].innerHTML = matchCell(r, d); tds[4].innerHTML = actionCell(d);
        for (let j = 1; j < 5; j++) {
          if (animate) { tds[j].classList.add('active'); await sleep(T(150)); tds[j].classList.remove('active'); }
          tds[j].classList.remove('pending');
        }
        apply(r, d);
        if (d.kind === 'new') ins++; else if (d.kind === 'same') unc++; else mrg++;
        c.ins.textContent = ins; c.mrg.textContent = mrg; c.unc.textContent = unc;
        if (animate) renderEntities();
      }
      c.run.textContent = runs;
      renderEntities();
      $('#etl-run').textContent = 'Run it again';
      running = false;
    }
    $('#etl-run').addEventListener('click', () => run(true));
    th.addEventListener('input', () => {
      thOut.textContent = (+th.value).toFixed(2);
      if (running) return;
      resetStore(); run(false);
    });
    resetStore();
    prepare().then(() => {
      body.innerHTML = prepared.map((r) => `<tr><td class="raw">${r.raw}</td><td class="pending">waiting</td><td class="pending key">·</td><td class="pending">·</td><td class="pending">·</td></tr>`).join('');
    });
  }

  /* ══ RAG walk-through ══════════════════════════════════════════════ */
  {
    const svg = $('#rag-svg'), steps = $$('#rag-steps li'), ans = $('#rag-answer');
    let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const C = { gri: [110, 92, 'oklch(0.78 0.13 29)'], brsr: [300, 110, 'oklch(0.78 0.12 240)'], meth: [205, 238, 'oklch(0.8 0.12 150)'] };
    const LABELS = {
      gri: ['GRI 305-2 · energy indirect (Scope 2) GHG', 'GRI 305-2 · market-based method', 'GRI 305 · base year & recalculation', 'GRI 305-1 · direct (Scope 1)'],
      brsr: ['BRSR P6 · Scope 1 & 2 emissions + intensity', 'BRSR P6 · energy consumption', 'BRSR · reporting boundary'],
      meth: ['Grid emission factors by state', 'Purchased electricity methodology'],
    };
    const pts = [];
    for (const [k, [cx, cy, col]] of Object.entries(C)) {
      for (let i = 0; i < 20; i++) {
        const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * 62;
        const p = { k, x: cx + Math.cos(a) * r * 1.2, y: cy + Math.sin(a) * r * 0.85, col, label: LABELS[k][i] };
        p.n = sv('circle', { cx: p.x, cy: p.y, r: 3.2, fill: col, class: 'pt', opacity: 0.55 });
        pts.push(p);
      }
    }
    const gL = sv('g'), gP = sv('g'), gT = sv('g');
    pts.forEach((p) => gP.appendChild(p.n));
    const q = sv('g', { opacity: 0 });
    q.append(sv('circle', { r: 7, fill: 'none', stroke: 'oklch(0.97 0 0)', 'stroke-width': 2 }), sv('circle', { r: 2.5, fill: 'oklch(0.97 0 0)' }));
    svg.append(gL, gP, q, gT);

    const Q = [
      { at: [118, 80], k: 3, near: 'gri', tool: null,
        embed: 'route → knowledge (no account data needed)',
        answer: 'GRI 305-2 asks for gross location-based Scope 2 emissions in tCO₂e, market-based figures where applicable, the gases included, the base year, the emission-factor sources and the consolidation approach. [GRI 305-2 · 305 base-year chunk]' },
      { at: null, k: 0, near: null,
        embed: 'route → platform data (asks about “our” numbers)',
        tool: 'query_emissions(scope=2, periods=["2026-Q2","2026-Q3"])\n→ SELECT period, SUM(co2e_t) … GROUP BY period\n← Q2 412.6 · Q3 468.1',
        answer: 'Scope 2 rose 13.5% quarter on quarter, from 412.6 to 468.1 tCO₂e. Most of it is purchased electricity; ask me which site drove it. (demo data)' },
      { at: [262, 128], k: 3, near: 'brsr',
        embed: 'route → both (data question + standard question)',
        tool: 'query_emissions(scope=2, group_by="site", periods=["2026-Q2","2026-Q3"])\n← Pune plant +41.2 t of +55.5 t',
        answer: 'The Pune plant accounts for 41.2 of the 55.5 tCO₂e increase. And yes: BRSR Principle 6 asks for total Scope 1 and 2 emissions and intensity, so it will show in your next BRSR report. [BRSR P6 chunk] (demo data)' },
    ];
    let qid = 0;
    const setStep = (s, state, code = '') => {
      const li = steps.find((x) => x.dataset.s === s);
      li.className = state; $('code', li).textContent = code;
    };
    async function ask(i) {
      const my = ++qid, cfg = Q[i];
      $$('.rag-q button').forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.q === i)));
      steps.forEach((li) => { li.className = ''; $('code', li).textContent = ''; });
      gL.innerHTML = ''; gT.innerHTML = ''; q.setAttribute('opacity', 0);
      pts.forEach((p) => { p.n.setAttribute('r', 3.2); p.n.setAttribute('opacity', 0.55); });
      ans.innerHTML = '<span class="cur"></span>';
      const live = () => my === qid;

      setStep('embed', 'on', cfg.embed); await sleep(T(700)); if (!live()) return;
      if (cfg.at) {
        q.setAttribute('transform', `translate(${cfg.at[0]} ${cfg.at[1]})`); q.setAttribute('opacity', 1);
        const ranked = pts.filter((p) => p.label).map((p) => ({ p, d: Math.hypot(p.x - cfg.at[0], p.y - cfg.at[1]) * (p.k === cfg.near ? 0.6 : 1) })).sort((a, b) => a.d - b.d).slice(0, cfg.k);
        setStep('search', 'on', 'SELECT chunk FROM kb\nORDER BY embedding <=> $1 LIMIT ' + cfg.k);
        $('#rag-k').textContent = 'top-k: ' + cfg.k;
        pts.forEach((p) => p.n.setAttribute('opacity', 0.22));
        for (const { p } of ranked) {
          if (!live()) return;
          gL.appendChild(sv('line', { x1: cfg.at[0], y1: cfg.at[1], x2: p.x, y2: p.y, stroke: 'oklch(0.97 0 0)', 'stroke-opacity': 0.6, 'stroke-width': 1.2, 'stroke-dasharray': '3 3' }));
          p.n.setAttribute('r', 6); p.n.setAttribute('opacity', 1);
          const t = sv('text', { x: Math.min(p.x + 9, 250), y: p.y - 8, fill: 'oklch(0.93 0.01 262)', 'font-size': 10, 'font-family': 'Martian Mono, monospace' });
          t.textContent = p.label; gT.appendChild(t);
          await sleep(T(320));
        }
      } else {
        setStep('search', 'skip', 'skipped: nothing to retrieve');
        $('#rag-k').textContent = 'top-k: 0';
      }
      await sleep(T(500)); if (!live()) return;
      if (cfg.tool) { setStep('tool', 'on', cfg.tool); await sleep(T(1000)); } else setStep('tool', 'skip', 'skipped: no account data asked');
      if (!live()) return;
      setStep('llm', 'on', 'answer only from retrieved chunks + tool rows');
      const text = cfg.answer; ans.textContent = '';
      const cur = el('span', { class: 'cur' });
      for (let j = 0; j <= text.length; j += reduce ? text.length : 3) {
        if (!live()) return;
        ans.textContent = text.slice(0, j); ans.appendChild(cur);
        await sleep(14);
      }
      ans.textContent = text;
    }
    $$('.rag-q button').forEach((b) => b.addEventListener('click', () => ask(+b.dataset.q)));
    let started = false;
    new IntersectionObserver(([e]) => { if (e.isIntersecting && !started) { started = true; ask(1); } }, { threshold: 0.4 }).observe(svg);

    /* support agent */
    const M = [
      { answer: 'Sellers dispatch within the window shown on the listing, and tracking appears under Orders once it ships.', escalate: false, source: 'faq:shipping' },
      { answer: "I've passed this to our payments team. You'll hear back on this thread.", escalate: true, reason: 'financial' },
    ];
    const pre = $('#sup-json');
    const showM = (i) => {
      const m = M[i];
      pre.innerHTML = '{\n' + Object.entries(m).map(([k, v]) => {
        const val = typeof v === 'boolean' ? `<span class="${v ? 'f' : 't'}">${v}</span>` : `<span class="s">"${v}"</span>`;
        return `  <span class="k">"${k}"</span>: ${val}`;
      }).join(',\n') + '\n}' + (m.escalate ? '\n<span class="f">→ routed to a human · AI stops replying</span>' : '\n<span class="t">→ sent · grounded in cached KB</span>');
      $$('#sup-seg button').forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.m === i)));
    };
    $$('#sup-seg button').forEach((b) => b.addEventListener('click', () => showM(+b.dataset.m)));
    showM(0);
  }

  /* ══ Time-decayed trending ═════════════════════════════════════════ */
  {
    const H = 504; // 21 days of hourly buckets; index 0 = now
    let s = 3; const rnd = () => ((s = (s * 48271) % 2147483647) / 2147483647);
    const make = (total, w) => {
      const raw = Array.from({ length: H }, (_, h) => w(h) * (0.6 + rnd() * 0.8));
      const sum = raw.reduce((a, b) => a + b, 0);
      return raw.map((v) => (v / sum) * total);
    };
    const L = [
      { id: 'char', name: 'Base Set Charizard', note: '300 views · steady for 3 weeks', v: make(300, (h) => 1 + h / 300) },
      { id: 'twin', name: 'Twin Mill (carded)', note: '180 views · last 7 days', v: make(180, (h) => (h < 168 ? 1 : 0.02)) },
      { id: 'lbwk', name: 'LBWK Skyline · just listed', note: '120 views · last 24 hours', v: make(120, (h) => (h < 24 ? 3 - h / 12 : 0)) },
    ];
    L.forEach((l) => (l.total = l.v.reduce((a, b) => a + b, 0)));
    const chart = $('#trend-chart'), hl = $('#hl'), hlOut = $('#hl-out'), down = $('#redis-down');
    const BINS = 84, per = H / BINS;

    chart.innerHTML = L.map((l) => `<div class="series"><div class="lab">${l.name}<small>${l.note}</small></div><svg viewBox="0 0 ${BINS} 40" preserveAspectRatio="none" data-s="${l.id}"></svg></div>`).join('') +
      `<div class="series"><div class="lab">decay weight<small id="wlab"></small></div><svg viewBox="0 0 ${BINS} 40" preserveAspectRatio="none" id="wsvg"><path class="decay-fill"/><path class="decay-path" vector-effect="non-scaling-stroke"/></svg></div>` +
      `<div class="axis"><span></span><div><span>21 days ago</span><span>14d</span><span>7d</span><span>now</span></div></div>`;
    const maxBin = Math.max(...L.flatMap((l) => Array.from({ length: BINS }, (_, b) => l.v.slice(b * per, b * per + per).reduce((a, c) => a + c, 0))));
    const bars = {};
    for (const l of L) {
      const g = $(`svg[data-s="${l.id}"]`, chart); bars[l.id] = [];
      for (let b = 0; b < BINS; b++) {
        const v = l.v.slice(b * per, b * per + per).reduce((a, c) => a + c, 0);
        const h = Math.max(0.6, Math.sqrt(v / maxBin) * 38);
        const x = BINS - 1 - b; // left = oldest
        const r = sv('rect', { x: x + 0.12, y: 40 - h, width: 0.76, height: h });
        g.appendChild(r); bars[l.id].push(r);
      }
    }
    const rankList = $('#rank-list'), lifeList = $('#life-list');
    const ROW = 52;
    const mkList = (ol) => {
      ol.style.height = L.length * ROW + 'px';
      const map = {};
      for (const l of L) {
        const li = el('li', { style: 'position:absolute;left:0;right:0;top:0' }, `<span class="p"></span><span><span class="nm">${l.name}</span><div class="meter"></div></span><span class="sc"></span>`);
        ol.appendChild(li); map[l.id] = li;
      }
      return map;
    };
    const RL = mkList(rankList), LL = mkList(lifeList);
    const place = (map, scored, fmt) => {
      const max = Math.max(...scored.map((x) => x.s)) || 1;
      scored.sort((a, b) => b.s - a.s).forEach((x, i) => {
        const li = map[x.l.id];
        li.style.transform = `translateY(${i * ROW}px)`;
        $('.p', li).textContent = i + 1;
        $('.sc', li).textContent = fmt(x.s);
        $('.meter', li).style.transform = `scaleX(${x.s / max})`;
      });
    };
    const fmtH = (h) => (h < 24 ? Math.round(h) + 'h' : (h / 24).toFixed(h < 72 ? 1 : 0).replace('.0', '') + 'd');
    function update() {
      const half = Math.pow(H, hl.value / 100);
      hlOut.textContent = fmtH(half);
      $('#wlab').textContent = `0.5^(age / ${fmtH(half)})`;
      const w = (h) => Math.pow(0.5, h / half);
      let dPath = '';
      for (let b = 0; b <= BINS; b++) { const x = BINS - b; const y = 40 - w(b * per) * 38; dPath += (b ? 'L' : 'M') + x + ' ' + y.toFixed(2); }
      $('#wsvg .decay-path').setAttribute('d', dPath);
      $('#wsvg .decay-fill').setAttribute('d', dPath + `L0 40 L${BINS} 40 Z`);
      const isDown = down.checked;
      for (const l of L) bars[l.id].forEach((r, b) => r.style.opacity = isDown ? 0.25 : (0.25 + 0.75 * w(b * per)).toFixed(2));
      $('#rank').classList.toggle('down', isDown);
      $('#req').textContent = isDown ? 'GET 200 · fallback' : 'GET 200 · 4ms';
      const scored = L.map((l) => ({ l, s: isDown ? l.total : l.v.reduce((a, v, h) => a + v * w(h), 0) }));
      place(RL, scored, (v) => v.toFixed(1));
      place(LL, L.map((l) => ({ l, s: l.total })), (v) => Math.round(v) + ' views');
    }
    hl.addEventListener('input', update); down.addEventListener('change', update);
    update();
  }

  /* ══ Shipped: browser tabs + phone cycles ══════════════════════════ */
  {
    const tabs = $$('.tabs button'), imgs = $$('#viewport img'), url = $('#url');
    let cur = 0, autoTab = !reduce;
    const show = (i) => {
      cur = i;
      tabs.forEach((t, j) => t.setAttribute('aria-selected', String(j === i)));
      imgs.forEach((m, j) => m.classList.toggle('on', j === i));
      url.textContent = imgs[i].dataset.url;
    };
    tabs.forEach((t) => t.addEventListener('click', () => { autoTab = false; show(+t.dataset.i); }));
    const vis = { on: false };
    new IntersectionObserver(([e]) => (vis.on = e.isIntersecting)).observe($('#viewport'));
    if (!reduce) {
      setInterval(() => { if (autoTab && vis.on && !document.hidden) show((cur + 1) % imgs.length); }, 4200);
      $$('[data-cycle]').forEach((scr, k) => {
        const ims = $$('img', scr); let j = 0;
        setTimeout(() => setInterval(() => {
          if (!vis.on || document.hidden) return;
          ims[j].classList.remove('on'); j = (j + 1) % ims.length; ims[j].classList.add('on');
        }, 3400), k * 1700);
      });
    }
  }

  /* ══ Hire form (FormSubmit, AJAX) + view counter (GoatCounter) ═════ */
  {
    const form = $('#hire'), status = $('#hire-status'), send = $('#hire-send');
    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      if (form._honey.value) return;               // bot filled the trap
      send.disabled = true; status.className = 'form-status'; status.textContent = 'POST /hire …';
      const data = Object.fromEntries(new FormData(form));
      delete data._honey;
      try {
        const res = await fetch(form.action.replace('formsubmit.co/', 'formsubmit.co/ajax/'), {
          method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok || String(body.success) === 'false') throw new Error(body.message || res.status);
        try { window.goatcounter && window.goatcounter.count({ path: 'hire-form-sent', title: data.kind, event: true }); } catch (e) {}
        form.classList.add('sent');
        form.innerHTML = `<div class="sent-msg"><code>201 Created</code><b>Thanks, ${data.name.split(' ')[0].replace(/[<>&"]/g, '')}. Request received.</b>
          <p style="margin:0;color:var(--ink-2)">It's in my inbox now. I'll reply to ${data.email.replace(/[<>&"]/g, '')}.</p></div>`;
      } catch (e) {
        send.disabled = false; status.className = 'form-status err';
        status.innerHTML = 'Couldn’t send that. Email me directly: <a href="mailto:upipersaniya@gmail.com">upipersaniya@gmail.com</a>';
      }
    });

    // Public total from GoatCounter; stays "200 OK" if blocked or not enabled yet.
    const views = $('#views');
    fetch('https://utsavp.goatcounter.com/counter/TOTAL.json')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((j) => { if (j && j.count) views.textContent = `200 OK · viewed ${j.count} times`; })
      .catch(() => {});
  }
})();
