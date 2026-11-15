/* SpaceDoctor Focus v3 — working demo. Synthetic data only. Not for clinical use. */
(function () {
  'use strict';
  var L = window.SDLogic, DEMO = window.SD_DEMO, FEAT = window.SD_FEATURES, VIZ = window.SD_VIZ, ICONS = window.SD_ICONS;
  var NOW = DEMO.clock, KEY = 'spacedoctor-focus-v3-demo', ACTOR = 'Astronaut A (demo)';
  var ROUTES = {
    dashboard: { title: 'Dashboard', icon: 'D01' },
    vitals: { title: 'Vitals & Symptoms', icon: 'W01', wf: 'W01' },
    sleep: { title: 'Sleep & Fatigue', icon: 'W02', wf: 'W02' },
    hydration: { title: 'Hydration & Appetite', icon: 'W03', wf: 'W03' },
    exercise: { title: 'Exercise & Recovery', icon: 'W04', wf: 'W04' },
    wellbeing: { title: 'Well-being & Support', icon: 'W05', wf: 'W05' }
  };
  var BLOCKED = ['care', 'nutrition', 'medication', 'consultations', 'food', 'circadian', 'equipment', 'support-agreements'];
  var METRICS = {
    heart_rate: { label: 'Heart rate', unit: 'bpm', units: ['bpm'], plaus: [25, 230], dec: 0, viz: 'V01' },
    blood_pressure: { label: 'Blood pressure', unit: 'mmHg', units: ['mmHg'], plaus: [60, 260], plaus2: [30, 160], dec: 0, viz: 'V02' },
    respiratory_rate: { label: 'Respiratory rate', unit: 'breaths/min', units: ['breaths/min'], plaus: [4, 60], dec: 0, viz: 'V03' },
    temperature: { label: 'Temperature', unit: 'degC', units: ['degC', 'degF'], plaus: [33, 42], dec: 1, viz: 'V04' },
    spo2: { label: 'Oxygen saturation', unit: '%', units: ['%'], plaus: [50, 100], dec: 0, viz: 'V05' }
  };
  var STORED = {
    heart_rate: 'Heart rate', blood_pressure_systolic: 'Blood pressure (systolic)', blood_pressure_diastolic: 'Blood pressure (diastolic)',
    respiratory_rate: 'Respiratory rate', temperature: 'Temperature', spo2: 'Oxygen saturation'
  };
  var FATIGUE = { 1: 'not tired', 2: 'slightly tired', 3: 'moderate', 4: 'very tired', 5: 'extremely tired' };
  var MOOD = { 1: 'low', 2: 'rather low', 3: 'neutral', 4: 'good', 5: 'very good' };

  /* ---------- helpers ---------- */
  function esc(s) { return String(s === undefined || s === null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function ico(id) { return '<span class="ico" aria-hidden="true">' + (ICONS[id] || '') + '</span>'; }
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function p2(n) { return (n < 10 ? '0' : '') + n; }
  function hm(iso) { var d = new Date(iso); return p2(d.getUTCHours()) + ':' + p2(d.getUTCMinutes()); }
  function dm(iso) { var d = new Date(iso); return d.getUTCDate() + ' ' + MON[d.getUTCMonth()]; }
  function fmt(iso) { return dm(iso) + ', ' + hm(iso) + ' UTC'; }
  function toInput(iso) { return new Date(iso).toISOString().slice(0, 16); }
  function fromInput(v) { if (!v) return null; var d = new Date(v + ':00Z'); return isNaN(d.getTime()) ? null : d.toISOString().replace('.000Z', 'Z'); }
  function ms(iso) { return new Date(iso).getTime(); }
  function addMin(iso, m) { return new Date(ms(iso) + m * 60000).toISOString().replace('.000Z', 'Z'); }
  function unitLabel(u) { return u === 'degC' ? '°C' : u === 'degF' ? '°F' : u; }
  function num(v) { if (v === '' || v === null || v === undefined) return NaN; return Number(v); }
  function litres(ml) { return (Math.round(ml / 100) / 10).toFixed(1); }

  /* ---------- state ---------- */
  function seed() {
    var obs = DEMO.observations.map(function (o) { return Object.assign({ history: [] }, o); });
    var recStart = '2026-11-14T16:15:00Z';
    DEMO.exercise.recovery_hr.forEach(function (r, i) {
      obs.push({ id: 'rec-hr-' + i, metric: 'heart_rate', value: r.bpm, unit: 'bpm', observed_at: addMin(recStart, r.minute), received_at: addMin(recStart, r.minute),
        source: 'synthetic-fixture', method: 'demo', context: 'recovery', quality: 'VALID', revision: 1, history: [], sessionId: 'ex-2', minute: r.minute });
    });
    var ft = ['2026-11-15T08:00:00Z', '2026-11-15T11:00:00Z', '2026-11-15T13:45:00Z'];
    var s = DEMO.exercise.sessions;
    return {
      v: 2, seq: 100, obs: obs,
      pain: [{ id: 'pain-0', location: 'Not specified', scale: DEMO.exercise.pain.scale, score: DEMO.exercise.pain.value, change: '', duration: '', note: 'Synthetic post-exercise report', time: '2026-11-14T16:20:00Z', sessionId: 'ex-2' }],
      sleep: DEMO.sleep.intervals.map(function (iv, i) { return { id: 'sl-' + i, start: iv.start, end: iv.end, kind: i ? 'nap' : 'sleep', source: 'synthetic self-report', revision: 1, history: [] }; }),
      complete: (function () { var c = {}; c[DEMO.sleep.window_start] = DEMO.sleep.complete; return c; })(),
      sleepTarget: { minutes: DEMO.sleep.target_minutes, source: DEMO.sleep.target_source, version: 'demo-1' },
      fatigue: [],
      fluid: DEMO.fluid.entries_ml.map(function (ml, i) { return { id: 'fl-' + i, ml: ml, value: ml, unit: 'mL', type: 'Water', time: ft[i], source: 'synthetic-fixture', revision: 1, history: [] }; }),
      fluidTarget: { ml: DEMO.fluid.target_ml, source: DEMO.fluid.target_source, version: 'demo-1', start: '2026-11-15T00:00:00Z', end: '2026-11-16T00:00:00Z' },
      appetite: [{ id: 'ap-0', category: DEMO.appetite.category, change: '', barriers: '', note: '', time: '2026-11-15T13:45:00Z', source: DEMO.appetite.source }],
      plan: s.map(function (x) { return { activity: x.activity, minutes: x.planned_min }; }),
      planMeta: { source: 'Synthetic demo plan', version: 'demo-1' },
      sessions: [
        { id: 'ex-1', activity: s[0].activity, start: '2026-11-14T15:20:00Z', end: '2026-11-14T15:50:00Z', performed: s[0].performed_min, planned: s[0].planned_min, status: 'complete', planVersion: 'demo-1', note: '' },
        { id: 'ex-2', activity: s[1].activity, start: '2026-11-14T15:55:00Z', end: '2026-11-14T16:15:00Z', performed: s[1].performed_min, planned: s[1].planned_min, status: 'partial', planVersion: 'demo-1', note: '' }
      ],
      exertion: [{ id: 'exr-0', sessionId: 'ex-2', scale: DEMO.exercise.exertion.scale, value: DEMO.exercise.exertion.value, time: '2026-11-14T16:20:00Z' }],
      recovery: [],
      wellbeing: [{ id: 'wb-0', scale: DEMO.wellbeing.scale, value: DEMO.wellbeing.value, time: '2026-11-15T13:30:00Z' }],
      recs: [], followups: [], audit: []
    };
  }
  var S, storageOk = true;
  function load() {
    try { var raw = localStorage.getItem(KEY); if (raw) { var o = JSON.parse(raw); if (o && o.v === 2) return o; } } catch (e) { storageOk = false; }
    return null;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { storageOk = false; } }
  function uid(p) { S.seq += 1; return p + '-' + S.seq; }
  function audit(action, detail) { S.audit.unshift({ time: NOW, actor: ACTOR, action: action, detail: detail || '' }); if (S.audit.length > 200) S.audit.length = 200; }

  var ui = { route: 'dashboard', asst: { open: false, path: null, explain: null, msgs: [], ctx: true }, dialog: null, edit: null, metric: 'heart_rate', ctxFilter: 'rest', flash: null };

  /* ---------- derived values (one calculation for dashboard and detail) ---------- */
  function winStart(iso) {
    var d = new Date(iso), a = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12, 0, 0);
    if (d.getTime() < a) a -= 86400000;
    return new Date(a).toISOString().replace('.000Z', 'Z');
  }
  function sleepWindows() {
    var set = {}; set[winStart(NOW)] = 1;
    S.sleep.forEach(function (iv) { set[winStart(iv.start)] = 1; set[winStart(addMin(iv.end, -1))] = 1; });
    return Object.keys(set).sort().map(function (st) {
      var w = { start: st, end: addMin(st, 1440), complete: !!S.complete[st] };
      w.sum = L.sleepSummary(S.sleep, w, S.sleepTarget, NOW);
      w.items = S.sleep.filter(function (iv) { return ms(iv.end) > ms(w.start) && ms(iv.start) < ms(w.end); });
      return w;
    });
  }
  function lastClosedWindow() { var c = sleepWindows().filter(function (w) { return w.sum.closed; }); return c[c.length - 1] || null; }
  function fluidToday() {
    var t = S.fluidTarget, list = S.fluid.filter(function (e) { return ms(e.time) >= ms(t.start) && ms(e.time) < ms(t.end); });
    var sum = L.fluidSummary(list, t, ms(t.end) <= ms(NOW)); sum.entries = list; return sum;
  }
  function activeObs() { return S.obs.filter(function (o) { return o.quality === 'VALID'; }); }
  function latest(metric, ctx) {
    var l = activeObs().filter(function (o) { return o.metric === metric && (!ctx || o.context === ctx); });
    l.sort(function (a, b) { return ms(a.observed_at) - ms(b.observed_at); });
    return l[l.length - 1] || null;
  }
  function series(metric, ctx) {
    var l = activeObs().filter(function (o) { return o.metric === metric && o.context === ctx; });
    l.sort(function (a, b) { return ms(a.observed_at) - ms(b.observed_at); });
    return l;
  }
  function lastSessionDay() {
    if (!S.sessions.length) return [];
    var sorted = S.sessions.slice().sort(function (a, b) { return ms(a.start) - ms(b.start); });
    var day = sorted[sorted.length - 1].start.slice(0, 10);
    return sorted.filter(function (x) { return x.start.slice(0, 10) === day; });
  }
  function sessionLabel(id) { var x = S.sessions.filter(function (s) { return s.id === id; })[0]; return x ? x.activity + ' · ' + fmt(x.start) : 'No session'; }
  function latestOf(list) { return list.slice().sort(function (a, b) { return ms(a.time) - ms(b.time); })[list.length - 1] || null; }

  /* Recommendations: one episode per closed sleep window; identical data never adds a new unread item. */
  function syncRecs() {
    var derived = {};
    sleepWindows().forEach(function (w) {
      if (w.sum.state === 'BELOW_TARGET') derived['sleep-period-' + w.start] = { shortfall: w.sum.shortfall, obtained: w.sum.obtained, start: w.start, end: w.end };
    });
    var have = {};
    S.recs.forEach(function (r) {
      if (r.state === 'SUPERSEDED') return;
      var d = derived[r.key];
      if (!d) { r.state = 'SUPERSEDED'; r.note = 'Corrected records: the shortfall no longer applies.'; audit('Recommendation superseded', r.key); }
      else if (d.shortfall !== r.shortfall) { r.state = 'SUPERSEDED'; r.note = 'Superseded by corrected sleep records.'; audit('Recommendation superseded', r.key); }
      else have[r.key] = true;
    });
    Object.keys(derived).forEach(function (k) {
      if (have[k]) return;
      var d = derived[k], ver = S.recs.filter(function (r) { return r.key === k; }).length + 1;
      S.recs.unshift({ id: uid('rec'), key: k, version: ver, state: 'UNREAD', ack: false, created: NOW, shortfall: d.shortfall, obtained: d.obtained, start: d.start, end: d.end,
        target: S.sleepTarget.minutes, source: S.sleepTarget.source + ' · version ' + S.sleepTarget.version });
    });
  }
  function openRecs() { return S.recs.filter(function (r) { return r.state !== 'SUPERSEDED'; }); }
  function unreadCount() { return S.recs.filter(function (r) { return r.state === 'UNREAD'; }).length; }
  function verificationItems() { return S.obs.filter(function (o) { return o.quality === 'NEEDS_VERIFICATION'; }); }
  function commit(msg) { syncRecs(); save(); ui.flash = msg || null; ui.edit = null; renderMain(); renderOverlay(); }

  /* ---------- charts ---------- */
  function niceRange(vals, pad) {
    var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
    if (lo === hi) { lo -= 1; hi += 1; }
    var span = hi - lo, step = Math.pow(10, Math.floor(Math.log(span) / Math.LN10));
    if (span / step > 6) step *= 2; else if (span / step < 2.5) step /= 2;
    lo = Math.floor((lo - (pad || 0)) / step) * step; hi = Math.ceil((hi + (pad || 0)) / step) * step;
    if ((hi - lo) / step > 6) { step *= 2; lo = Math.floor(lo / step) * step; hi = Math.ceil(hi / step) * step; }
    var ticks = []; for (var t = lo; t <= hi + 1e-9; t += step) ticks.push(Math.round(t * 100) / 100);
    return { lo: lo, hi: hi, ticks: ticks };
  }
  function lineChart(o) {
    var W = o.w || 520, H = o.h || 190, ml = 46, mr = 16, mt = 16, mb = 38;
    var all = []; o.series.forEach(function (s) { s.points.forEach(function (p) { all.push(p); }); });
    if (!all.length) return '<div class="empty">No compatible records to plot yet.</div>';
    var r = niceRange(all.map(function (p) { return p.y; }), o.pad || 0);
    var xs = all.map(function (p) { return p.x; }), x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs);
    if (x0 === x1) { x0 -= 1; x1 += 1; }
    function X(x) { return ml + (x - x0) / (x1 - x0) * (W - ml - mr); }
    function Y(y) { return mt + (r.hi - y) / (r.hi - r.lo) * (H - mt - mb); }
    var g = '';
    r.ticks.forEach(function (t) { g += '<line class="gridl" x1="' + ml + '" x2="' + (W - mr) + '" y1="' + Y(t) + '" y2="' + Y(t) + '"/><text x="' + (ml - 6) + '" y="' + (Y(t) + 4) + '" text-anchor="end">' + t + '</text>'; });
    g += '<line class="axis" x1="' + ml + '" x2="' + ml + '" y1="' + mt + '" y2="' + (H - mb) + '"/><line class="axis" x1="' + ml + '" x2="' + (W - mr) + '" y1="' + (H - mb) + '" y2="' + (H - mb) + '"/>';
    var first = o.series[0].points;
    var step = Math.max(1, Math.ceil(first.length / 7));
    first.forEach(function (p, i) { if (i % step === 0 || i === first.length - 1) g += '<text x="' + X(p.x) + '" y="' + (H - mb + 15) + '" text-anchor="middle">' + esc(p.xl) + '</text>'; });
    g += '<text x="' + ((ml + W - mr) / 2) + '" y="' + (H - 4) + '" text-anchor="middle">' + esc(o.xLabel) + '</text>';
    g += '<text x="12" y="' + ((mt + H - mb) / 2) + '" text-anchor="middle" transform="rotate(-90 12 ' + ((mt + H - mb) / 2) + ')">' + esc(o.yLabel) + '</text>';
    o.series.forEach(function (s) {
      var d = s.points.map(function (p, i) { return (i ? 'L' : 'M') + X(p.x).toFixed(1) + ' ' + Y(p.y).toFixed(1); }).join(' ');
      g += '<path d="' + d + '" fill="none" stroke="' + s.color + '" stroke-width="2.5" stroke-linejoin="round"/>';
      s.points.forEach(function (p) { g += '<circle cx="' + X(p.x).toFixed(1) + '" cy="' + Y(p.y).toFixed(1) + '" r="4" fill="' + s.color + '"><title>' + esc(p.xl + ': ' + p.y + ' ' + o.unit) + '</title></circle>'; });
    });
    var rows = '';
    o.series.forEach(function (s) { s.points.forEach(function (p) { rows += '<tr><td>' + esc(s.name) + '</td><td>' + esc(p.tl || p.xl) + '</td><td>' + p.y + ' ' + esc(o.unit) + '</td></tr>'; }); });
    var legend = o.series.length > 1 ? '<div class="chips">' + o.series.map(function (s) { return '<span class="chip"><i style="width:14px;height:4px;background:' + s.color + ';display:inline-block"></i>' + esc(s.name) + '</span>'; }).join('') + '</div>' : '';
    return legend + '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(o.title) + '">' + g + '</svg>' +
      '<details class="alt"><summary>View as table</summary><div class="tablewrap"><table><tr><th>Series</th><th>' + esc(o.xLabel) + '</th><th>Value</th></tr>' + rows + '</table></div></details>';
  }
  function sleepBars(wins, target, small) {
    if (!wins.length) return '<div class="empty">No closed and complete reporting window yet.</div>';
    var W = small ? 400 : 520, H = small ? 180 : 190, ml = 40, mr = 16, mt = 18, mb = 34, max = 10;
    wins.forEach(function (w) { max = Math.max(max, Math.ceil(w.sum.obtained / 60) + 1); });
    function Y(h) { return mt + (max - h) / max * (H - mt - mb); }
    var g = '';
    for (var t = 0; t <= max; t += 2) g += '<line class="gridl" x1="' + ml + '" x2="' + (W - mr) + '" y1="' + Y(t) + '" y2="' + Y(t) + '"/><text x="' + (ml - 6) + '" y="' + (Y(t) + 4) + '" text-anchor="end">' + t + '</text>';
    var bw = Math.min(70, (W - ml - mr) / wins.length - 14), slot = (W - ml - mr) / wins.length;
    wins.forEach(function (w, i) {
      var h = w.sum.obtained / 60, x = ml + slot * i + (slot - bw) / 2;
      g += '<rect x="' + x + '" y="' + Y(h) + '" width="' + bw + '" height="' + (Y(0) - Y(h)) + '" rx="4" fill="#86B7FF"><title>' + L.fmtDuration(w.sum.obtained) + '</title></rect>';
      g += '<text x="' + (x + bw / 2) + '" y="' + (Y(h) - 5) + '" text-anchor="middle" style="fill:#F5F7FA;font-weight:700">' + (Math.round(h * 10) / 10) + ' h</text>';
      g += '<text x="' + (x + bw / 2) + '" y="' + (H - mb + 15) + '" text-anchor="middle">to ' + dm(w.end) + '</text>';
    });
    if (target) {
      var th = target.minutes / 60;
      g += '<line x1="' + ml + '" x2="' + (W - mr) + '" y1="' + Y(th) + '" y2="' + Y(th) + '" stroke="#63D5C6" stroke-width="2" stroke-dasharray="6 5"/><text x="' + (W - mr) + '" y="' + (Y(th) - 6) + '" text-anchor="end" style="fill:#63D5C6">Demo target ' + th + ' h</text>';
    }
    g += '<text x="12" y="' + ((mt + H - mb) / 2) + '" text-anchor="middle" transform="rotate(-90 12 ' + ((mt + H - mb) / 2) + ')">Hours</text>';
    var rows = wins.map(function (w) { return '<tr><td>' + fmt(w.start) + ' to ' + fmt(w.end) + '</td><td>' + L.fmtDuration(w.sum.obtained) + '</td></tr>'; }).join('');
    return '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Obtained sleep per closed reporting window against the demo target">' + g + '</svg>' +
      '<details class="alt"><summary>View as table</summary><table><tr><th>Reporting window</th><th>Obtained sleep</th></tr>' + rows + '</table></details>';
  }
  function bar(pct, label, s2) { return '<div class="bar' + (s2 ? ' s2' : '') + '" role="img" aria-label="' + esc(label) + '"><i style="width:' + Math.max(0, Math.min(100, pct)) + '%"></i><span>' + pct + '%</span></div>'; }

  /* ---------- shared fragments ---------- */
  function sec(id, body, extra) {
    var f = FEAT[id];
    return '<section class="card c12 sec" id="f-' + id + '"><h3>' + ico(id) + esc(f.title) + ' <code>' + id + '</code></h3><p class="desc">' + esc(extra || firstSentence(f.description)) + '</p>' + body + '</section>';
  }
  function firstSentence(t) { var i = t.indexOf('. '); return i > 0 ? t.slice(0, i + 1) : t; }
  function prov(time, source, quality) { return '<span>' + esc(source) + ' · ' + fmt(time) + (quality ? ' · quality: ' + esc(quality) : '') + '</span>'; }
  function flash() { if (!ui.flash) return ''; var m = ui.flash; ui.flash = null; return '<p class="ok" role="status">' + esc(m) + '</p>'; }
  function sessionOptions(blank) {
    return (blank ? '<option value="">No linked session</option>' : '') + S.sessions.slice().reverse().map(function (x) { return '<option value="' + x.id + '">' + esc(x.activity + ' · ' + fmt(x.start)) + '</option>'; }).join('');
  }
  function painForm() {
    return '<form class="f" data-form="pain" novalidate>' +
      '<label>Body location<select name="location"><option>Head</option><option>Neck</option><option>Shoulder</option><option>Back</option><option>Chest</option><option>Abdomen</option><option>Arm</option><option>Hand</option><option>Hip</option><option>Leg</option><option>Knee</option><option>Foot</option><option>Other</option></select></label>' +
      '<label>Score, 0 to 10 (demo scale, optional)<input name="score" type="number" min="0" max="10" step="1" inputmode="numeric"></label>' +
      '<label>Change<select name="change"><option value="new">New</option><option value="same">Same</option><option value="better">Better</option><option value="worse">Worse</option></select></label>' +
      '<label>Duration so far<input name="duration" placeholder="e.g. 20 min"></label>' +
      '<label>Time (UTC)<input name="time" type="datetime-local" value="' + toInput(NOW) + '"></label>' +
      '<label>Linked session<select name="session">' + sessionOptions(true) + '</select></label>' +
      '<label class="wide">Note (optional)<input name="note"></label>' +
      '<p class="err" role="alert"></p><div class="acts wide"><button class="btn primary">Report pain</button><button type="button" class="btn urgent" data-act="urgent">Request assistance</button></div></form>';
  }
  function painList() {
    if (!S.pain.length) return '<div class="empty">No pain reports recorded.</div>';
    var rows = S.pain.slice().sort(function (a, b) { return ms(b.time) - ms(a.time); }).map(function (p) {
      return '<tr><td>' + fmt(p.time) + '</td><td>' + esc(p.location) + '</td><td>' + (p.score === null ? 'Score not reported' : p.score + ' / 10') + '</td><td>' + esc(p.scale) + '</td><td>' + esc(p.change || '—') + '</td><td>' + esc(p.sessionId ? sessionLabel(p.sessionId) : '—') + '</td><td>' + esc(p.note || '') + '</td></tr>';
    }).join('');
    return '<div class="tablewrap"><table><tr><th>Time</th><th>Location</th><th>Score</th><th>Scale</th><th>Change</th><th>Session</th><th>Note</th></tr>' + rows + '</table></div><p class="muted small">A missing score is never shown as zero. A normal vital sign does not close a pain report.</p>';
  }
  function recCard(r, actions) {
    var sup = r.state === 'SUPERSEDED';
    return '<div class="item' + (sup ? '' : ' amber') + '"><div class="row"><span class="pill ' + (sup ? 'neutral' : 'amber') + '">' + (sup ? 'SUPERSEDED' : 'REVIEW') + '</span><b>Sleep below demo target by ' + L.fmtDuration(r.shortfall) + '</b></div>' +
      '<p class="small">Reason: the closed, complete reporting window ' + fmt(r.start) + ' to ' + fmt(r.end) + ' recorded ' + L.fmtDuration(r.obtained) + ' of sleep against a target of ' + L.fmtDuration(r.target) + '.</p>' +
      '<p class="small muted">Source: ' + esc(r.source) + ' · rule mode PERIOD · version ' + r.version + ' · issued ' + fmt(r.created) + ' · ' + (r.state === 'UNREAD' ? 'unread' : r.state === 'READ' ? 'read' : 'superseded') + (r.ack ? ' · acknowledged' : '') + '</p>' +
      '<p class="small muted">This is a plan-review finding from synthetic data, not a diagnosis.' + (r.note ? ' ' + esc(r.note) : '') + (r.ack && !sup ? ' Acknowledging does not close the follow-up.' : '') + '</p>' +
      (actions && !sup ? '<div class="row">' + (r.state === 'UNREAD' ? '<button class="btn small" data-act="rec-read" data-id="' + r.id + '">Mark as read</button>' : '') + (!r.ack ? '<button class="btn small" data-act="rec-ack" data-id="' + r.id + '">Acknowledge</button>' : '') + '<a class="btn small" href="#sleep">Open sleep records</a><a class="btn small" href="#vitals" data-goto="f-M01F07">Record follow-up</a></div>' : '') + '</div>';
  }
  function auditBlock() {
    var rows = S.audit.slice(0, 25).map(function (a) { return '<tr><td>' + fmt(a.time) + '</td><td>' + esc(a.actor) + '</td><td>' + esc(a.action) + '</td><td>' + esc(a.detail) + '</td></tr>'; }).join('');
    return '<section class="card c12"><details class="alt"><summary>Change history for this demo session (' + S.audit.length + ')</summary>' + (rows ? '<div class="tablewrap"><table><tr><th>Demo time</th><th>Who</th><th>Action</th><th>Detail</th></tr>' + rows + '</table></div>' : '<p>No changes yet. Edits and corrections you make are listed here.</p>') + '</details></section>';
  }

  /* ---------- dashboard ---------- */
  function attention() {
    var out = '';
    openRecs().forEach(function (r) { out += '<div class="att"><span class="mark">⚠ Review item:</span><span>completed sleep period ' + L.fmtDuration(r.shortfall) + ' below demo target</span><a class="btn small" href="#sleep">Open sleep</a></div>'; });
    var v = verificationItems();
    if (v.length) out += '<div class="att"><span class="mark">⚠ Data verification:</span><span>' + v.length + ' reading' + (v.length > 1 ? 's need' : ' needs') + ' checking before it can be used</span><a class="btn small" href="#vitals" data-goto="f-M01F03">Open checks</a></div>';
    var f = S.followups.filter(function (x) { return x.status !== 'closed'; });
    if (f.length) out += '<div class="att"><span class="mark">Follow-up:</span><span>' + f.length + ' open follow-up item' + (f.length > 1 ? 's' : '') + '</span><a class="btn small" href="#vitals" data-goto="f-M01F07">Open follow-ups</a></div>';
    return '<div class="attention" aria-label="Attention items">' + (out || '<div class="att none">No current review items. This is not a statement about health.</div>') + '</div>';
  }
  function foot(left, viz, route) {
    return '<div class="card-foot">' + left + '<span class="acts"><button class="btn small" data-act="explain" data-viz="' + viz + '">Explain</button><a class="btn small outline" href="#' + route + '">Open workflow</a></span></div>';
  }
  function hrChart(list, title) {
    return lineChart({ w: 400, h: 180, title: title, unit: 'bpm', xLabel: 'Time (UTC)', yLabel: 'bpm', pad: 2,
      series: [{ name: 'Heart rate', color: '#86B7FF', points: list.map(function (o) { return { x: ms(o.observed_at), y: o.value, xl: hm(o.observed_at), tl: fmt(o.observed_at) }; }) }] });
  }
  function tile(label, o, unit, dec) { return '<div class="tile">' + label + '<b>' + (o ? (dec ? o.value.toFixed(dec) : o.value) + ' ' + unit : 'No reading') + '</b></div>'; }
  function panelVitals() {
    var hr = latest('heart_rate', 'rest'), list = series('heart_rate', 'rest').slice(-12);
    var sys = latest('blood_pressure_systolic'), dia = latest('blood_pressure_diastolic');
    return '<section class="card c4"><div class="card-head">' + ico('W01') + '<div><h2>Vitals &amp; Symptoms</h2><p>Recent resting measurements</p></div></div>' +
      '<div><span class="muted">Heart rate (resting)</span><div class="big">' + (hr ? hr.value + ' <small>bpm</small>' : '<small>No reading</small>') + '</div></div>' +
      hrChart(list, 'Resting heart-rate trend in beats per minute') +
      '<div class="tiles">' + '<div class="tile">Blood pressure<b>' + (sys && dia ? sys.value + '/' + dia.value + ' mmHg' : 'No reading') + '</b></div>' +
      tile('SpO₂', latest('spo2'), '%') + tile('Temperature', latest('temperature'), '°C', 1) + tile('Respiratory rate', latest('respiratory_rate'), '/min') + '</div>' +
      '<p class="note"><span class="pill neutral">Reference not configured</span><span>No baseline or clinical range is supplied, so values are shown without a “within range” label.</span></p>' +
      foot(hr ? prov(hr.observed_at, hr.source, hr.quality) : '<span>No readings</span>', 'V01', 'vitals') + '</section>';
  }
  function panelSleep() {
    var w = lastClosedWindow(), wins = sleepWindows().filter(function (x) { return x.sum.closed && x.complete; }).slice(-7), fat = latestOf(S.fatigue);
    var head, state = '';
    if (!w) head = '<div class="big"><small>No closed reporting window</small></div>';
    else {
      head = '<div class="big">' + L.fmtDuration(w.sum.obtained) + '</div><p class="muted">24-hour window closed ' + fmt(w.end) + '</p>';
      if (w.sum.state === 'BELOW_TARGET') state = '<p class="warn">⚠ ' + L.fmtDuration(w.sum.shortfall) + ' below demo target</p>';
      else if (w.sum.state === 'MET_TARGET') state = '<p class="muted">Demo target of ' + L.fmtDuration(S.sleepTarget.minutes) + ' reached for this window.</p>';
      else if (w.sum.state === 'CLOSED_NOT_ATTESTED') state = '<p><span class="pill neutral">Not yet marked complete</span> <span class="muted small">No target comparison until the window is marked complete.</span></p>';
    }
    var naps = w ? w.items.filter(function (i) { return i.kind === 'nap'; }) : [], napMin = naps.length ? L.unionMinutes(naps, w.start, w.end).minutes : 0;
    return '<section class="card c4"><div class="card-head">' + ico('W02') + '<div><h2>Sleep &amp; Fatigue</h2><p>Obtained sleep for completed windows, naps counted once</p></div></div>' + head + state + sleepBars(wins, S.sleepTarget, true) +
      '<div class="chips"><span class="chip">' + ico('M06F05') + 'Fatigue: ' + (fat ? '<b>' + FATIGUE[fat.value] + '</b> (' + fat.value + ' of 5)' : 'no check-in recorded') + '</span><span class="chip">' + ico('M06F03') + (napMin ? 'Nap included: <b>' + napMin + ' min</b>' : 'No nap in this window') + '</span></div>' +
      foot('<span>Sleep diary · target: ' + esc(S.sleepTarget.source) + '</span>', 'V07', 'sleep') + '</section>';
  }
  function panelHydration() {
    var f = fluidToday(), ap = latestOf(S.appetite), last = latestOf(f.entries);
    return '<section class="card c4 last"><div class="card-head">' + ico('W03') + '<div><h2>Hydration &amp; Appetite</h2><p>Logged fluids against the demo daily target</p></div></div>' +
      '<div class="big">' + litres(f.totalMl) + ' <small>/ ' + litres(S.fluidTarget.ml) + ' L</small></div><p class="muted">Logged fluids / demo daily target</p>' +
      bar(f.percent, f.percent + ' percent of the demo fluid target logged') +
      '<p class="note"><span class="pill neutral">' + (f.state === 'IN_PROGRESS' ? 'In progress' : 'Window closed') + '</span><span>Today’s log is still open, so no shortfall is assessed.</span></p>' +
      '<p>' + ico('M08F04') + ' Appetite: ' + (ap ? '<span class="accentc">' + esc(ap.category) + '</span> <span class="muted small">(self-report, ' + fmt(ap.time) + ')</span>' : '<span class="muted">not reported</span>') + '</p>' +
      '<p class="muted small">Fluid intake is not measured hydration status.</p>' +
      foot('<span>Fluid log · ' + (last ? fmt(last.time) : 'no entries today') + '</span>', 'V10', 'hydration') + '</section>';
  }
  function sessionBars(list) {
    if (!list.length) return '<div class="empty">No exercise sessions recorded.</div>';
    return list.map(function (x, i) {
      var pct = L.exercisePercent(x.performed, x.planned);
      return '<div class="barrow"><b>' + esc(x.activity) + '</b>' + (pct === null ? '<span class="muted small">No plan for this activity</span>' : bar(Math.min(pct, 100), x.activity + ': ' + x.performed + ' of ' + x.planned + ' planned minutes', i % 2)) +
        '<span class="v">' + x.performed + (x.planned ? ' / ' + x.planned : '') + ' min' + (pct !== null ? ' · ' + pct + '%' : '') + ' · ' + esc(x.status) + '</span></div>';
    }).join('');
  }
  function recoveryChart(sessionId) {
    var l = activeObs().filter(function (o) { return o.sessionId === sessionId && o.metric === 'heart_rate'; }).sort(function (a, b) { return a.minute - b.minute; });
    if (!l.length) return '<div class="empty">No linked heart-rate readings for this session.</div>';
    return lineChart({ title: 'Heart rate after the session, in beats per minute', unit: 'bpm', xLabel: 'Minutes after session', yLabel: 'bpm', pad: 2,
      series: [{ name: 'Heart rate', color: '#86B7FF', points: l.map(function (o) { return { x: o.minute, y: o.value, xl: String(o.minute), tl: o.minute + ' min' }; }) }] });
  }
  function panelExercise() {
    var day = lastSessionDay(), lastS = day[day.length - 1], ex = latestOf(S.exertion), pn = latestOf(S.pain);
    var linked = S.sessions.slice().reverse().filter(function (x) { return S.obs.some(function (o) { return o.sessionId === x.id; }); })[0];
    return '<section class="card c6"><div class="card-head">' + ico('W04') + '<div><h2>Exercise &amp; Recovery</h2><p>Completed activity against the demo plan</p></div></div>' + sessionBars(day) +
      '<div><b>Recovery heart rate</b>' + (linked ? ' <span class="muted small">(' + esc(linked.activity) + ' session)</span>' : '') + '</div>' + (linked ? recoveryChart(linked.id) : '<div class="empty">No linked readings.</div>') +
      '<div class="chips"><span class="chip">' + ico('M09F05') + 'Exertion: ' + (ex ? '<b>' + ex.value + ' / 10</b>' : 'not reported') + '</span><span class="chip">' + ico('M16F01') + 'Pain: ' + (pn ? (pn.score === null ? 'reported, no score' : '<b>' + pn.score + ' / 10</b>') : 'no report') + '</span></div>' +
      '<p class="muted small">Exertion and pain are separate demo scales. Finishing a session does not show readiness or medical clearance.</p>' +
      foot('<span>Exercise log · ' + (lastS ? fmt(lastS.end) : 'no sessions') + '</span>', 'V12', 'exercise') + '</section>';
  }
  function moodScale(v) {
    var h = '<div class="scale" role="img" aria-label="' + (v ? 'Self-reported mood ' + v + ' of 5' : 'No check-in') + '">';
    for (var i = 1; i <= 5; i++) h += '<div class="' + (i === v ? 'on' : '') + '"><i></i>' + i + (i === 1 ? '<br>Low' : i === 5 ? '<br>Good' : '') + '</div>';
    return h + '</div>';
  }
  function panelWellbeing() {
    var w = latestOf(S.wellbeing);
    return '<section class="card c6"><div class="card-head">' + ico('W05') + '<div><h2>Well-being &amp; Support</h2><p>Private, voluntary check-in</p></div></div>' +
      '<p style="font-size:22px;text-align:center">Self-reported mood: ' + (w ? '<span class="accentc">' + MOOD[w.value] + '</span>' : '<span class="muted">no check-in (unknown)</span>') + '</p>' + moodScale(w ? w.value : 0) +
      '<p class="muted" style="text-align:center">Shared only through an explicit choice. There is no “normal” mood band.</p>' +
      '<div class="row" style="justify-content:center"><a class="btn outline" href="#wellbeing" data-goto="f-M23F01">New check-in</a><a class="btn outline" href="#wellbeing" data-goto="f-M23F02">View support options</a></div>' +
      foot('<span>' + (w ? 'Self-report · ' + fmt(w.time) : 'No check-in') + '</span>', 'V16', 'wellbeing') + '</section>';
  }
  function pageDashboard() {
    return attention() + '<div class="grid">' + panelVitals() + panelSleep() + panelHydration() + panelExercise() + panelWellbeing() + '</div>' +
      '<p class="foot-note">Concept demo · synthetic readings and targets · not for clinical use. There is no overall health score by design.</p>';
  }

  /* ---------- vitals ---------- */
  function obsTable() {
    var rows = S.obs.slice().sort(function (a, b) { return ms(b.observed_at) - ms(a.observed_at); }).slice(0, 40).map(function (o) {
      var rej = o.quality === 'REJECTED', acts = '';
      if (ui.edit && ui.edit.id === o.id && ui.edit.type === 'obs') {
        return '<tr><td colspan="8"><form class="f" data-form="obs-correct" data-id="' + o.id + '" novalidate><label>Corrected value (' + esc(unitLabel(o.unit)) + ')<input name="value" type="number" step="any" value="' + o.value + '"></label><label>Reason<input name="reason" placeholder="Why is it corrected?"></label><p class="err" role="alert"></p><div class="acts"><button class="btn primary">Save correction</button><button type="button" class="btn" data-act="cancel-edit">Cancel</button></div></form></td></tr>';
      }
      if (ui.edit && ui.edit.id === o.id && ui.edit.type === 'unrel') {
        return '<tr><td colspan="8"><form class="f" data-form="obs-unrel" data-id="' + o.id + '" novalidate><label class="wide">Reason this reading is unreliable<input name="reason" placeholder="e.g. sensor slipped"></label><p class="err" role="alert"></p><div class="acts"><button class="btn primary">Mark unreliable</button><button type="button" class="btn" data-act="cancel-edit">Cancel</button></div></form></td></tr>';
      }
      if (!rej) acts = '<button class="btn small" data-act="edit" data-type="obs" data-id="' + o.id + '">Correct</button> <button class="btn small" data-act="edit" data-type="unrel" data-id="' + o.id + '">Mark unreliable</button>' + (o.quality === 'NEEDS_VERIFICATION' ? ' <button class="btn small" data-act="obs-verify" data-id="' + o.id + '">Verify</button>' : '');
      var q = o.quality === 'VALID' ? 'Valid' : o.quality === 'NEEDS_VERIFICATION' ? '<span class="warn">Needs verification</span>' : '<span class="muted">Unreliable</span>';
      return '<tr><td>' + fmt(o.observed_at) + '</td><td>' + esc(STORED[o.metric] || o.metric) + '</td><td class="' + (rej ? 'strike' : '') + '"><b>' + o.value + '</b> ' + esc(unitLabel(o.unit)) + (o.original ? '<br><span class="muted small">entered as ' + esc(o.original) + '</span>' : '') + '</td><td>' + esc(o.context) + (o.sessionId ? '<br><span class="muted small">' + esc(sessionLabel(o.sessionId)) + '</span>' : '') + '</td><td>' + esc(o.source) + ' / ' + esc(o.method) + '</td><td>' + q + (o.qualityReason ? '<br><span class="muted small">' + esc(o.qualityReason) + '</span>' : '') + '</td><td>' + o.revision + (o.history.length ? '<br><span class="muted small">was ' + esc(o.history.map(function (h) { return h.value; }).join(', ')) + '</span>' : '') + '</td><td>' + acts + '</td></tr>';
    }).join('');
    return '<div class="tablewrap"><table><tr><th>Time</th><th>Measurement</th><th>Value</th><th>Context</th><th>Source / method</th><th>Quality</th><th>Rev.</th><th>Actions</th></tr>' + rows + '</table></div>';
  }
  function trend() {
    var m = ui.metric, def = METRICS[m], ctx = ui.ctxFilter, ser;
    function pts(metric) { return series(metric, ctx).map(function (o) { return { x: ms(o.observed_at), y: o.value, xl: hm(o.observed_at), tl: fmt(o.observed_at) }; }); }
    if (m === 'blood_pressure') ser = [{ name: 'Systolic', color: '#86B7FF', points: pts('blood_pressure_systolic') }, { name: 'Diastolic', color: '#63D5C6', points: pts('blood_pressure_diastolic') }];
    else ser = [{ name: def.label, color: '#86B7FF', points: pts(m) }];
    var sel = '<div class="row"><label class="small muted">Measurement <select data-change="metric" style="min-height:44px;background:#16181D;border:1px solid #7D899B;border-radius:8px;padding:6px 10px;color:#F5F7FA">' + Object.keys(METRICS).map(function (k) { return '<option value="' + k + '"' + (k === m ? ' selected' : '') + '>' + METRICS[k].label + '</option>'; }).join('') + '</select></label>' +
      '<label class="small muted">Context <select data-change="ctx" style="min-height:44px;background:#16181D;border:1px solid #7D899B;border-radius:8px;padding:6px 10px;color:#F5F7FA">' + ['rest', 'exercise', 'recovery'].map(function (c) { return '<option' + (c === ctx ? ' selected' : '') + '>' + c + '</option>'; }).join('') + '</select></label><button class="btn small" data-act="explain" data-viz="' + def.viz + '">Explain this chart</button></div>';
    return sel + lineChart({ title: def.label + ' trend, ' + ctx + ' context', unit: unitLabel(def.unit), xLabel: 'Time (UTC)', yLabel: unitLabel(def.unit), pad: m === 'temperature' ? 0.2 : 2, series: ser }) +
      '<p class="note"><span class="pill neutral">Reference not configured</span><span>No approved reference range or personal baseline is loaded. Readings from different contexts are never mixed on one line.</span></p>';
  }
  function followups() {
    var list = S.followups.map(function (f) {
      var closing = ui.edit && ui.edit.id === f.id && ui.edit.type === 'fu-close';
      return '<div class="item"><div class="row"><span class="pill ' + (f.status === 'closed' ? 'neutral' : 'amber') + '">' + esc(f.status.toUpperCase()) + '</span><b>' + esc(f.subject) + '</b></div><p class="small">Action: ' + esc(f.action || '—') + ' · Owner: ' + esc(f.owner) + ' · Review by ' + fmt(f.due) + '</p>' +
        (f.status === 'closed' ? '<p class="small muted">Closed by ' + esc(f.closedBy) + ': ' + esc(f.closeReason) + '</p>' :
          closing ? '<form class="f" data-form="fu-close" data-id="' + f.id + '" novalidate><label>Closure reason / evidence<input name="reason"></label><label>Authorized by<input name="author"></label><p class="err" role="alert"></p><div class="acts"><button class="btn primary">Close follow-up</button><button type="button" class="btn" data-act="cancel-edit">Cancel</button></div></form>' :
          '<div class="row">' + (f.status === 'pending' ? '<button class="btn small" data-act="fu-status" data-status="in progress" data-id="' + f.id + '">Mark in progress</button>' : '') + (f.status !== 'reviewed' ? '<button class="btn small" data-act="fu-status" data-status="reviewed" data-id="' + f.id + '">Mark reviewed</button>' : '') + '<button class="btn small" data-act="edit" data-type="fu-close" data-id="' + f.id + '">Close if authorized</button></div>') + '</div>';
    }).join('');
    var subj = openRecs().map(function (r) { return '<option>Sleep below demo target (' + dm(r.end) + ' window)</option>'; }).join('') + '<option>Pain report</option><option>Appetite change</option><option>Vital-sign reading</option><option>Recovery observation</option>';
    return (list || '<div class="empty">No follow-up items yet.</div>') +
      '<form class="f" data-form="followup" novalidate><label>Concerning<select name="subject">' + subj + '</select></label><label>Action<input name="action" placeholder="What will be done"></label><label>Owner<input name="owner" placeholder="Who is responsible"></label><label>Review by (UTC)<input name="due" type="datetime-local" value="' + toInput(addMin(NOW, 1440)) + '"></label><p class="err" role="alert"></p><div class="acts wide"><button class="btn primary">Record follow-up</button></div></form>';
  }
  function pageVitals() {
    var mopts = Object.keys(METRICS).map(function (k) { return '<option value="' + k + '">' + METRICS[k].label + '</option>'; }).join('');
    var form = '<form class="f" data-form="obs" novalidate><label>Measurement<select name="metric" data-change="obs-metric">' + mopts + '</select></label>' +
      '<label><span data-l1>Value</span><input name="value" type="number" step="any" inputmode="decimal"></label>' +
      '<label data-dia hidden>Diastolic<input name="value2" type="number" step="any" inputmode="decimal"></label>' +
      '<label>Unit<select name="unit"><option>bpm</option></select></label>' +
      '<label>Context<select name="context"><option>rest</option><option>exercise</option><option>recovery</option></select></label>' +
      '<label>Method / device<input name="method" value="manual entry"></label>' +
      '<label>Observed (UTC)<input name="time" type="datetime-local" value="' + toInput(NOW) + '"></label>' +
      '<p class="err" role="alert"></p><div class="acts wide"><button class="btn primary">Save measurement</button><span class="muted small">Live devices are not connected in this demo; entries are manual.</span></div></form>';
    var ver = verificationItems();
    var recs = S.recs.length ? S.recs.map(function (r) { return recCard(r, true); }).join('') : '<div class="empty">No rule-based concerns. No clinical alert rules are configured in this demo.</div>';
    return '<div class="grid">' +
      sec('M01F01', flash() + form + obsTable()) +
      sec('M01F02', trend()) +
      sec('M01F03', ver.length ? ver.map(function (o) { return '<div class="item amber"><b>' + esc(STORED[o.metric]) + ' ' + o.value + ' ' + esc(unitLabel(o.unit)) + ' · ' + fmt(o.observed_at) + '</b><p class="small">' + esc(o.qualityReason) + ' It is kept visible but cannot create a confirmed low or high finding. Use Verify or Mark unreliable in the table above.</p></div>'; }).join('') : '<div class="empty">No readings are waiting for verification.</div>') +
      sec('M01F04', '<div class="empty">No approved measurement schedule is configured in this demo, so there are no reminders to show.</div>') +
      sec('M01F05', recs + '<p class="muted small">Only the demo sleep-target review can appear here. Real alert thresholds are not supplied, so vital signs are never classified.</p>') +
      sec('M01F06', '<div class="row"><button class="btn urgent" data-act="urgent">' + ico('S09') + 'Urgent assistance</button><span class="muted small">Opens straight away, without the Assistant and without any sensor reading.</span></div>') +
      sec('M01F07', followups()) +
      sec('M16F01', painForm() + painList()) + auditBlock() + '</div>';
  }

  /* ---------- sleep ---------- */
  function strip(w) {
    var a = ms(w.start), span = ms(w.end) - a, h = '';
    w.items.forEach(function (iv) {
      var s = Math.max(ms(iv.start), a), e = Math.min(ms(iv.end), ms(w.end));
      h += '<i class="' + (iv.kind === 'nap' ? 'nap' : '') + '" style="left:' + ((s - a) / span * 100) + '%;width:' + ((e - s) / span * 100) + '%" title="' + esc(iv.kind + ' ' + hm(iv.start) + '–' + hm(iv.end)) + '"></i>';
    });
    return '<div class="strip" role="img" aria-label="Sleep and nap intervals in this window">' + h + '</div><div class="strip-ax"><span>12:00</span><span>18:00</span><span>00:00</span><span>06:00</span><span>12:00 UTC</span></div>';
  }
  function pageSleep() {
    var wins = sleepWindows().slice().reverse();
    var cards = wins.map(function (w) {
      var s = w.sum, st;
      if (s.state === 'IN_PROGRESS') st = '<span class="pill neutral">In progress</span> <span class="muted small">Open window: no target comparison yet.</span>';
      else if (s.state === 'CLOSED_NOT_ATTESTED') st = '<span class="pill neutral">Closed, not marked complete</span> <button class="btn small" data-act="win-complete" data-id="' + w.start + '">Mark period complete</button>';
      else if (s.state === 'BELOW_TARGET') st = '<span class="pill amber">Review</span> <span class="warn">' + L.fmtDuration(s.shortfall) + ' below demo target</span>';
      else if (s.state === 'MET_TARGET') st = '<span class="pill">Complete</span> <span class="muted small">Demo target reached.</span>';
      else st = '<span class="pill neutral">Target not configured</span>';
      return '<div class="item"><div class="row"><b>' + fmt(w.start) + ' → ' + fmt(w.end) + '</b></div><div class="row"><span class="big" style="font-size:24px">' + L.fmtDuration(s.obtained) + '</span><span class="muted">obtained of ' + L.fmtDuration(S.sleepTarget.minutes) + ' target</span></div><div class="row">' + st + '</div>' + strip(w) +
        (s.overlapMinutes ? '<p class="small muted">' + ico('M06F03') + ' ' + s.overlapMinutes + ' overlapping minutes were counted once.</p>' : '') + '</div>';
    }).join('');
    var form = '<form class="f" data-form="sleep" novalidate><label>Type<select name="kind"><option value="sleep">Sleep</option><option value="nap">Nap</option></select></label><label>Fell asleep (UTC)<input name="start" type="datetime-local" value="' + toInput(addMin(NOW, -60)) + '"></label><label>Woke up (UTC)<input name="end" type="datetime-local" value="' + toInput(NOW) + '"></label><label>Source<select name="source"><option>self-report</option><option>wearable estimate</option></select></label><p class="err" role="alert"></p><div class="acts wide"><button class="btn primary">Log sleep</button><span class="muted small">Enter actual sleep, not time in bed.</span></div></form>';
    var rows = S.sleep.slice().sort(function (a, b) { return ms(b.start) - ms(a.start); }).map(function (iv) {
      if (ui.edit && ui.edit.id === iv.id) return '<tr><td colspan="6"><form class="f" data-form="sleep-edit" data-id="' + iv.id + '" novalidate><label>Fell asleep (UTC)<input name="start" type="datetime-local" value="' + toInput(iv.start) + '"></label><label>Woke up (UTC)<input name="end" type="datetime-local" value="' + toInput(iv.end) + '"></label><label>Reason<input name="reason"></label><p class="err" role="alert"></p><div class="acts"><button class="btn primary">Save interval</button><button type="button" class="btn" data-act="cancel-edit">Cancel</button></div></form></td></tr>';
      return '<tr><td>' + esc(iv.kind) + '</td><td>' + fmt(iv.start) + '</td><td>' + fmt(iv.end) + '</td><td>' + L.fmtDuration(Math.round((ms(iv.end) - ms(iv.start)) / 60000)) + '</td><td>' + esc(iv.source) + ' · rev. ' + iv.revision + '</td><td><button class="btn small" data-act="edit" data-type="sleep" data-id="' + iv.id + '">Edit interval</button></td></tr>';
    }).join('');
    var fat = S.fatigue.slice().sort(function (a, b) { return ms(b.time) - ms(a.time); });
    var fform = '<form class="f" data-form="fatigue" novalidate><label>How tired are you? (demo fatigue scale 1–5)<select name="value">' + [1, 2, 3, 4, 5].map(function (i) { return '<option value="' + i + '">' + i + ' — ' + FATIGUE[i] + '</option>'; }).join('') + '</select></label><label>Time (UTC)<input name="time" type="datetime-local" value="' + toInput(NOW) + '"></label><p class="err" role="alert"></p><div class="acts"><button class="btn primary">Record fatigue</button><button type="button" class="btn" data-act="skip" data-what="Fatigue check-in">Skip</button></div></form>';
    return '<div class="grid">' +
      sec('M46F03', flash() + sleepBars(wins.filter(function (w) { return w.sum.closed && w.complete; }).reverse().slice(-7), S.sleepTarget) + cards + '<p class="muted small">Target: ' + L.fmtDuration(S.sleepTarget.minutes) + ' per 24-hour window · ' + esc(S.sleepTarget.source) + ' · version ' + esc(S.sleepTarget.version) + ' · read-only. <button class="btn link" data-act="explain" data-viz="V07">Explain</button></p>') +
      sec('M06F01', form + '<div class="tablewrap"><table><tr><th>Type</th><th>Start</th><th>End</th><th>Length</th><th>Source</th><th></th></tr>' + rows + '</table></div>') +
      sec('M06F03', '<p class="small">Add naps with the form above (Type: Nap). Totals join overlapping entries so no minute is counted twice, and your original entries are kept as entered. Example: a 60-minute and a 30-minute entry that share 30 minutes total 60 minutes.</p>') +
      sec('M06F05', fform + (fat.length ? '<div class="tablewrap"><table><tr><th>Time</th><th>Rating</th><th>Scale</th></tr>' + fat.map(function (f) { return '<tr><td>' + fmt(f.time) + '</td><td>' + f.value + ' — ' + FATIGUE[f.value] + '</td><td>demo fatigue scale 1–5</td></tr>'; }).join('') + '</table></div>' : '<div class="empty">No fatigue check-in recorded. A skipped check-in stays unknown and never raises a concern.</div>')) + auditBlock() + '</div>';
  }

  /* ---------- hydration ---------- */
  function pageHydration() {
    var f = fluidToday(), t = S.fluidTarget;
    var form = '<form class="f" data-form="fluid" novalidate><label>Drink<select name="type"><option>Water</option><option>Juice</option><option>Tea or coffee</option><option>Electrolyte drink</option><option>Other</option></select></label><label>Amount<input name="value" type="number" step="any" min="0" inputmode="decimal"></label><label>Unit<select name="unit"><option>mL</option><option>L</option><option>US fl oz</option></select></label><label>Time (UTC)<input name="time" type="datetime-local" value="' + toInput(NOW) + '"></label><p class="err" role="alert"></p><div class="acts wide"><button class="btn primary">Log fluid</button></div></form>';
    var rows = S.fluid.slice().sort(function (a, b) { return ms(b.time) - ms(a.time); }).map(function (e) {
      if (ui.edit && ui.edit.id === e.id) return '<tr><td colspan="6"><form class="f" data-form="fluid-correct" data-id="' + e.id + '" novalidate><label>Corrected amount<input name="value" type="number" step="any" value="' + e.value + '"></label><label>Unit<select name="unit">' + ['mL', 'L', 'US fl oz'].map(function (u) { return '<option' + (u === e.unit ? ' selected' : '') + '>' + u + '</option>'; }).join('') + '</select></label><label>Reason<input name="reason"></label><p class="err" role="alert"></p><div class="acts"><button class="btn primary">Save correction</button><button type="button" class="btn" data-act="cancel-edit">Cancel</button></div></form></td></tr>';
      return '<tr><td>' + fmt(e.time) + '</td><td>' + esc(e.type) + '</td><td><b>' + Math.round(e.ml) + ' mL</b>' + (e.unit !== 'mL' ? '<br><span class="muted small">entered as ' + e.value + ' ' + esc(e.unit) + '</span>' : '') + '</td><td>' + esc(e.source) + '</td><td>' + e.revision + (e.history.length ? '<br><span class="muted small">was ' + esc(e.history.map(function (h) { return h.value + ' ' + h.unit; }).join(', ')) + '</span>' : '') + '</td><td><button class="btn small" data-act="edit" data-type="fluid" data-id="' + e.id + '">Correct volume</button></td></tr>';
    }).join('');
    var aform = '<form class="f" data-form="appetite" novalidate><label>Appetite<select name="category"><option>usual</option><option>reduced</option><option>increased</option><option>none</option></select></label><label>Change<select name="change"><option value="">No change</option><option>less than usual</option><option>more than usual</option></select></label><label>Eating barriers<select name="barriers"><option value="">None</option><option>Nausea</option><option>No time</option><option>Food not appealing</option><option>Other</option></select></label><label>Time (UTC)<input name="time" type="datetime-local" value="' + toInput(NOW) + '"></label><label class="wide">Note (optional)<input name="note"></label><p class="err" role="alert"></p><div class="acts wide"><button class="btn primary">Record appetite</button><button type="button" class="btn" data-act="appetite-review">Request review</button></div></form>';
    var arows = S.appetite.slice().sort(function (a, b) { return ms(b.time) - ms(a.time); }).map(function (a) { return '<tr><td>' + fmt(a.time) + '</td><td>' + esc(a.category) + '</td><td>' + esc(a.change || 'no change') + '</td><td>' + esc(a.barriers || 'none') + '</td><td>' + esc(a.note || '') + '</td></tr>'; }).join('');
    return '<div class="grid">' +
      sec('M08F03', flash() + '<div class="row"><span class="big">' + Math.round(f.totalMl) + ' <small>mL logged today</small></span><span class="pill neutral">' + (f.state === 'IN_PROGRESS' ? 'In progress' : 'Window closed') + '</span></div>' + bar(f.percent, f.percent + ' percent of the demo fluid target logged') + '<p class="muted small">' + f.percent + '% of the ' + t.ml + ' mL demo target. This is logged intake, not a measured hydration level, and an unfinished day is never assessed as a shortfall. <button class="btn link" data-act="explain" data-viz="V10">Explain</button></p>' + form + '<div class="tablewrap"><table><tr><th>Time</th><th>Drink</th><th>Amount</th><th>Source</th><th>Rev.</th><th></th></tr>' + rows + '</table></div>') +
      sec('M08F06', '<div class="item"><div class="row"><b>' + t.ml + ' mL (' + litres(t.ml) + ' L) per day</b><span class="pill neutral">Read-only</span></div><p class="small muted">Window ' + fmt(t.start) + ' → ' + fmt(t.end) + ' · source: ' + esc(t.source) + ' · version ' + esc(t.version) + '. Demo target only; it cannot be edited here.</p></div>') +
      sec('M08F04', aform + '<div class="tablewrap"><table><tr><th>Time</th><th>Appetite</th><th>Change</th><th>Barriers</th><th>Note</th></tr>' + arows + '</table></div><p class="muted small">Appetite is a self-report. It never changes the fluid total and cannot show a nutrient deficiency.</p>') + auditBlock() + '</div>';
  }

  /* ---------- exercise ---------- */
  function pageExercise() {
    var plan = '<div class="tablewrap"><table><tr><th>Activity</th><th>Planned duration</th><th>Source</th></tr>' + S.plan.map(function (p) { return '<tr><td>' + esc(p.activity) + '</td><td>' + p.minutes + ' min</td><td>' + esc(S.planMeta.source) + ' · version ' + esc(S.planMeta.version) + ' · read-only</td></tr>'; }).join('') + '</table></div>';
    var sform = '<form class="f" data-form="session" novalidate><label>Activity<select name="activity">' + S.plan.map(function (p) { return '<option>' + esc(p.activity) + '</option>'; }).join('') + '</select></label><label>Start (UTC)<input name="start" type="datetime-local" value="' + toInput(addMin(NOW, -30)) + '"></label><label>End (UTC)<input name="end" type="datetime-local" value="' + toInput(NOW) + '"></label><label>Status<select name="status"><option>complete</option><option>partial</option><option>interrupted</option></select></label><label class="wide">Note (optional)<input name="note"></label><p class="err" role="alert"></p><div class="acts wide"><button class="btn primary">Save session</button></div></form>';
    var srows = S.sessions.slice().sort(function (a, b) { return ms(b.start) - ms(a.start); }).map(function (x) { var pct = L.exercisePercent(x.performed, x.planned); return '<tr><td>' + esc(x.activity) + '</td><td>' + fmt(x.start) + '</td><td>' + fmt(x.end) + '</td><td><b>' + x.performed + ' / ' + x.planned + ' min</b></td><td>' + (pct === null ? '—' : pct + '%') + '</td><td>' + esc(x.status) + '</td><td>plan ' + esc(x.planVersion) + '</td></tr>'; }).join('');
    var linked = S.sessions.slice().reverse().filter(function (x) { return S.obs.some(function (o) { return o.sessionId === x.id; }); })[0];
    var rform = '<form class="f" data-form="response" novalidate><label>Session<select name="session">' + sessionOptions(false) + '</select></label><label>Phase<select name="phase"><option>recovery</option><option>exercise</option><option>rest</option></select></label><label>Heart rate (bpm)<input name="value" type="number" step="1" inputmode="numeric"></label><label>Minutes after session end<input name="minute" type="number" step="1" min="0" value="0"></label><p class="err" role="alert"></p><div class="acts wide"><button class="btn primary">Record response</button><a class="btn" href="#vitals">Open linked measurements</a></div></form>';
    var eform = '<form class="f" data-form="exertion" novalidate><label>Session<select name="session">' + sessionOptions(false) + '</select></label><label>Perceived exertion, 0 to 10 (demo scale)<input name="value" type="number" min="0" max="10" step="1" inputmode="numeric"></label><p class="err" role="alert"></p><div class="acts"><button class="btn primary">Record exertion</button></div></form>';
    var erows = S.exertion.slice().reverse().map(function (e) { return '<tr><td>' + esc(sessionLabel(e.sessionId)) + '</td><td>' + e.value + ' / 10</td><td>' + esc(e.scale) + '</td></tr>'; }).join('');
    var cform = '<form class="f" data-form="recovery" novalidate><label>Session<select name="session">' + sessionOptions(false) + '</select></label><label>How recovered do you feel?<select name="state"><option>not recovered</option><option>partly recovered</option><option>fully recovered</option></select></label><label>Time (UTC)<input name="time" type="datetime-local" value="' + toInput(NOW) + '"></label><label class="wide">Symptoms or note (optional)<input name="note"></label><p class="err" role="alert"></p><div class="acts wide"><button class="btn primary">Log recovery</button></div></form>';
    var crows = S.recovery.slice().reverse().map(function (r) { return '<tr><td>' + fmt(r.time) + '</td><td>' + esc(sessionLabel(r.sessionId)) + '</td><td>' + esc(r.state) + '</td><td>' + esc(r.note || '') + '</td></tr>'; }).join('');
    return '<div class="grid">' +
      sec('M09F01', flash() + plan + '<p class="muted small">Plans come from outside the app and cannot be edited here.</p>') +
      sec('M09F02', sessionBars(lastSessionDay()) + sform + '<div class="tablewrap"><table><tr><th>Activity</th><th>Start</th><th>End</th><th>Done / planned</th><th>Share</th><th>Status</th><th>Plan</th></tr>' + srows + '</table></div><p class="muted small"><button class="btn link" data-act="explain" data-viz="V12">Explain</button></p>') +
      sec('M09F04', (linked ? '<p><b>' + esc(sessionLabel(linked.id)) + '</b></p>' + recoveryChart(linked.id) : '<div class="empty">No linked readings yet.</div>') + rform + '<p class="muted small">Each reading is stored once and also appears in Vitals with its exercise context. Lines join real readings only.</p>') +
      sec('M09F05', eform + (erows ? '<div class="tablewrap"><table><tr><th>Session</th><th>Exertion</th><th>Scale</th></tr>' + erows + '</table></div>' : '') + '<h4 style="margin-top:8px">Pain</h4>' + painForm() + painList()) +
      sec('M09F06', cform + (crows ? '<div class="tablewrap"><table><tr><th>Time</th><th>Session</th><th>Self-reported recovery</th><th>Note</th></tr>' + crows + '</table></div>' : '<div class="empty">No recovery observation recorded, so recovery is unknown. There is no readiness score.</div>')) + auditBlock() + '</div>';
  }

  /* ---------- well-being ---------- */
  function pageWellbeing() {
    var list = S.wellbeing.slice().sort(function (a, b) { return ms(b.time) - ms(a.time); }), w = list[0];
    var form = '<form class="f" data-form="wellbeing" novalidate><label>How is your mood? (demo scale 1–5)<select name="value">' + [1, 2, 3, 4, 5].map(function (i) { return '<option value="' + i + '"' + (i === 3 ? ' selected' : '') + '>' + i + ' — ' + MOOD[i] + '</option>'; }).join('') + '</select></label><label>Time (UTC)<input name="time" type="datetime-local" value="' + toInput(NOW) + '"></label><label>Sharing<select name="share"><option>Private — not shared</option></select></label><p class="err" role="alert"></p><div class="acts wide"><button class="btn primary">Check in</button><button type="button" class="btn" data-act="skip" data-what="Well-being check-in">Skip</button></div></form>';
    var chart = list.length > 1 ? lineChart({ title: 'Your own mood check-ins on the demo 1 to 5 scale', unit: 'of 5', xLabel: 'Time (UTC)', yLabel: 'Rating', pad: 0, series: [{ name: 'Mood', color: '#63D5C6', points: list.slice().reverse().map(function (x) { return { x: ms(x.time), y: x.value, xl: hm(x.time), tl: fmt(x.time) }; }) }] }) : '';
    return '<div class="grid">' +
      sec('M23F01', flash() + '<p class="note"><span class="pill">Private</span><span>Check-ins are optional and visible only to you in this demo. Skipping is recorded as unknown, never as a problem.</span></p><p style="font-size:20px">Latest: ' + (w ? '<span class="accentc">' + MOOD[w.value] + '</span> (' + w.value + ' of 5) · ' + fmt(w.time) : '<span class="muted">no check-in</span>') + '</p>' + moodScale(w ? w.value : 0) + form + chart +
        '<div class="tablewrap"><table><tr><th>Time</th><th>Rating</th><th>Scale</th></tr>' + list.map(function (x) { return '<tr><td>' + fmt(x.time) + '</td><td>' + x.value + ' — ' + MOOD[x.value] + '</td><td>' + esc(x.scale) + '</td></tr>'; }).join('') + '</table></div>') +
      sec('M23F02', '<div class="empty">No reviewed support resources or contact routes are configured in this demo. Nothing is sent to anyone from this page. For anything urgent, use <button class="btn link" data-act="urgent">Urgent assistance</button>.</div>') + auditBlock() + '</div>';
  }
  function pageBlocked(r) {
    return '<div class="card"><h2>Not available</h2><p>“' + esc(r) + '” is not part of SpaceDoctor Focus v3. This version has five workflows: Vitals &amp; Symptoms, Sleep &amp; Fatigue, Hydration &amp; Appetite, Exercise &amp; Recovery and Well-being &amp; Support.</p><p><a class="btn primary" href="#dashboard">Back to the dashboard</a></p></div>';
  }

  /* ---------- shell ---------- */
  function renderMain() {
    var r = ui.route, def = ROUTES[r];
    var nav = Object.keys(ROUTES).map(function (k) { return '<a href="#' + k + '"' + (k === r ? ' aria-current="page"' : '') + '>' + ico(ROUTES[k].icon) + '<span>' + esc(ROUTES[k].title) + '</span></a>'; }).join('');
    var body = !def ? pageBlocked(r) : r === 'dashboard' ? pageDashboard() : r === 'vitals' ? pageVitals() : r === 'sleep' ? pageSleep() : r === 'hydration' ? pageHydration() : r === 'exercise' ? pageExercise() : pageWellbeing();
    var title = r === 'dashboard' ? 'Personal Health Dashboard' : def ? def.title : 'Not available';
    document.getElementById('app').innerHTML =
      '<div class="shell"><aside class="rail"><img class="logo" src="' + window.SD_LOGO + '" alt="SpaceDoctor"><div class="account">' + ico('U01') + '<div><b>Astronaut A</b><span>Personal account</span></div></div><nav class="nav" aria-label="Main">' + nav + '</nav>' +
      '<div class="rail-foot">Demo data is saved in this browser only' + (storageOk ? '' : ' (storage unavailable: changes last until you close the page)') + '.<br><button class="btn small" data-act="reset-ask">Reset demo data</button></div></aside>' +
      '<main class="main" id="main"><header class="topbar"><div><h1>' + (def && r !== 'dashboard' ? ico(def.icon) : '') + esc(title) + ' <span class="pill">DEMO DATA</span></h1><p class="sub">SpaceDoctor Focus v3 · ' + fmt(NOW).replace(',', ' 2026,') + ' · frozen demo clock</p></div>' +
      '<div class="top-right"><div class="status"><b>Monitoring limited</b>Browser demo, no background service</div><div class="status">Subject<br><span style="color:#F5F7FA">Astronaut A</span></div><button class="btn urgent" data-act="urgent">' + ico('S09') + 'Urgent assistance</button></div></header>' + body + '</main></div>';
    var m = document.querySelector('[data-change="obs-metric"]'); if (m) syncMetricForm(m);
  }
  function syncMetricForm(sel) {
    var form = sel.form, def = METRICS[sel.value];
    form.unit.innerHTML = def.units.map(function (u) { return '<option value="' + u + '">' + unitLabel(u) + '</option>'; }).join('');
    form.querySelector('[data-dia]').hidden = sel.value !== 'blood_pressure';
    form.querySelector('[data-l1]').textContent = sel.value === 'blood_pressure' ? 'Systolic' : 'Value';
  }

  /* ---------- assistant, dialogs ---------- */
  function explainText(id) {
    var v = VIZ.filter(function (x) { return x.id === id; })[0]; if (!v) return 'That chart is not part of SpaceDoctor Focus v3.';
    var t = '<b>' + esc(v.title) + '</b> (' + esc(unitLabel(v.unit)) + '). ';
    if (id === 'V01') { var hr = latest('heart_rate', 'rest'), n = series('heart_rate', 'rest').length; t += 'The line joins your ' + n + ' resting heart-rate readings. ' + (hr ? 'The latest is ' + hr.value + ' bpm at ' + fmt(hr.observed_at) + '. ' : '') + 'No personal baseline or clinical reference is configured, so the app does not say whether this is within a range.'; }
    else if (id === 'V07') { var w = lastClosedWindow(); t += w ? 'Sleep entries in the window ending ' + fmt(w.end) + ' add up to ' + L.fmtDuration(w.sum.obtained) + ', with naps counted once. ' + (w.sum.state === 'BELOW_TARGET' ? 'That is ' + L.fmtDuration(w.sum.shortfall) + ' under the demo target of ' + L.fmtDuration(S.sleepTarget.minutes) + '. ' : '') + 'Only closed, complete windows are compared with the target. This is a plan-review finding, not a diagnosis.' : 'There is no closed reporting window yet.'; }
    else if (id === 'V10') { var f = fluidToday(); t += 'You logged ' + Math.round(f.totalMl) + ' mL of the ' + S.fluidTarget.ml + ' mL demo target, which is ' + f.percent + '%. The day is still in progress, so no shortfall is assessed. The bar shows logged intake, not a measured hydration level.'; }
    else if (id === 'V12') { t += lastSessionDay().map(function (x) { return x.activity + ': ' + x.performed + ' of ' + x.planned + ' planned minutes (' + L.exercisePercent(x.performed, x.planned) + '%, ' + x.status + ')'; }).join('; ') + '. The recovery line joins only the heart-rate readings actually linked to the session. Nothing here shows readiness or medical clearance.'; }
    else if (id === 'V16') { var wb = latestOf(S.wellbeing); t += wb ? 'Your latest voluntary check-in was ' + wb.value + ' of 5 (“' + MOOD[wb.value] + '”) at ' + fmt(wb.time) + '. It is private, and there is no “normal” band.' : 'No check-in is recorded; that is treated as unknown.'; }
    else t += esc(v.rules);
    return t;
  }
  function asstBody() {
    var a = ui.asst, h = '';
    if (a.ctx) h += '<div class="ctx"><span>Context: Astronaut A · ' + esc(ROUTES[ui.route] ? ROUTES[ui.route].title : 'Not available') + ' · ' + fmt(NOW) + (a.explain ? ' · chart ' + a.explain : '') + '</span><button class="btn small" data-act="asst-clear">Clear</button></div>';
    h += '<div class="paths"><button class="btn" data-act="asst-path" data-path="recs">' + ico('M01F05') + 'Recent Health Recommendations' + (unreadCount() ? ' (' + unreadCount() + ' unread)' : '') + '</button><button class="btn" data-act="asst-path" data-path="emergency">' + ico('S09') + 'Emergency First Aid &amp; Medical Kits</button><button class="btn" data-act="asst-path" data-path="help">' + ico('M09F01') + 'Workflow &amp; Measurement Help</button><button class="btn" data-act="asst-path" data-path="about">' + ico('A01') + 'About SpaceDoctor Assistant</button></div>';
    if (a.explain && a.path === 'explain') h += '<div class="bubble">' + explainText(a.explain) + '</div>';
    if (a.path === 'recs') h += '<h3>Recent Health Recommendations</h3>' + (S.recs.length ? S.recs.map(function (r) { return recCard(r, true); }).join('') : '<div class="empty">No recommendations have been issued.</div>');
    if (a.path === 'emergency') h += '<h3>Emergency First Aid &amp; Medical Kits</h3><div class="item"><p><b>No approved first-aid procedures or medical-kit inventory are loaded in this demo.</b></p><p class="small">The Assistant does not write treatment steps or guess kit contents. The assistance contact route is not configured. In a real emergency, follow your mission’s own procedures and contact route.</p></div>';
    if (a.path === 'help') {
      var wf = ROUTES[ui.route] && ROUTES[ui.route].wf, ids = Object.keys(FEAT).filter(function (k) { return wf ? FEAT[k].group === wf : /^W0/.test(FEAT[k].group); });
      h += '<h3>Workflow &amp; Measurement Help</h3><p class="small muted">' + (wf ? 'Features on this page:' : 'All active features:') + '</p>' + ids.map(function (k) { return '<div class="item"><b>' + ico(k) + ' ' + esc(FEAT[k].title) + '</b><p class="small">' + esc(FEAT[k].description) + '</p></div>'; }).join('');
    }
    if (a.path === 'about') h += '<h3>About SpaceDoctor Assistant</h3><div class="item small"><p><b>What it can do:</b> explain the charts and records in the five active workflows, list recommendation history, and describe each feature. These answers are built from fixed rules.</p><p><b>What it cannot do:</b> diagnose, prescribe, change plans, contact anyone, or bring back removed features such as medication or nutrition tracking.</p><p><b>AI chat:</b> unavailable. No AI service is connected in this demo.</p><p><b>Monitoring:</b> limited. A browser page cannot watch your data when it is closed.</p><p><b>Data:</b> synthetic demo records for “Astronaut A”, stored only in this browser.</p></div>';
    a.msgs.forEach(function (m) { h += '<div class="bubble' + (m.me ? ' me' : '') + '">' + m.html + '</div>'; });
    return h;
  }
  function answer(q) {
    var s = q.toLowerCase();
    if (/medic|dose|drug|pill|tablet|prescri|consult|handover/.test(s)) return 'Medication and care tools are outside SpaceDoctor Focus v3, so I can’t help with medication plans or doses.';
    if (/nutri|calor|protein|food|meal|body.?mass|weight/.test(s)) return 'Food, nutrient and body-mass tracking are outside SpaceDoctor Focus v3. This version logs fluids and a self-reported appetite only.';
    if (/circadian|duty|schedule|equipment/.test(s)) return 'That is outside SpaceDoctor Focus v3.';
    if (/diagnos|am i (ok|sick|ill|healthy)/.test(s)) return 'I can’t diagnose or judge your health. I can explain the records and charts on screen.';
    if (/emergenc|urgent|help me|first aid/.test(s)) return 'Use the Urgent assistance button at the top of the page. No approved procedures are loaded in this demo.';
    return 'Free-text AI chat is unavailable here because no AI service is connected. The four buttons above and the Explain buttons on each chart work without it.';
  }
  function renderOverlay() {
    var a = ui.asst, n = unreadCount(), h = '';
    if (!a.open) h += '<button class="launcher" data-act="asst-open" aria-label="Open SpaceDoctor Assistant' + (n ? ', ' + n + ' unread recommendation' + (n > 1 ? 's' : '') : '') + '" title="SpaceDoctor Assistant">' + ico('A01') + '<span>SpaceDoctor<br>Assistant</span>' + (n ? '<span class="badge">' + (n > 99 ? '99+' : n) + '</span>' : '') + '</button>';
    else h += '<aside class="panel" role="dialog" aria-label="SpaceDoctor Assistant"><div class="panel-head"><h2>' + ico('A01') + 'SpaceDoctor Assistant</h2><button class="btn small" data-act="asst-close" aria-label="Close Assistant">Close</button></div><div class="panel-body" id="asst-body">' + asstBody() + '</div><div class="panel-foot"><form data-form="ask"><input name="q" aria-label="Ask the Assistant" placeholder="Ask about this page…"><button class="btn primary">Send</button></form></div></aside>';
    if (ui.dialog === 'urgent') h += '<div class="overlay"><div class="dialog" role="alertdialog" aria-labelledby="ug-t"><h2 id="ug-t" style="color:#FF6B61">' + ico('S09') + 'Urgent assistance</h2><p><b>No approved urgent procedure is configured in this demo.</b></p><p>Assistance contact route: <b>not configured</b>. Medical kit details: <b>not configured</b>.</p><p>This screen opens immediately, without any reading and without the Assistant. In a real situation, follow your mission’s own emergency procedure and contact route. Nothing has been sent to anyone.</p><div class="row"><button class="btn primary" data-act="dialog-close" data-autofocus>Close</button></div></div></div>';
    if (ui.dialog === 'reset') h += '<div class="overlay"><div class="dialog plain" role="alertdialog" aria-labelledby="rs-t"><h2 id="rs-t">Reset demo data?</h2><p>This removes everything you entered and restores the original synthetic records.</p><div class="row"><button class="btn primary" data-act="reset-do">Reset</button><button class="btn" data-act="dialog-close" data-autofocus>Cancel</button></div></div></div>';
    document.getElementById('overlay').innerHTML = h;
    var af = document.querySelector('#overlay [data-autofocus]'); if (af) af.focus();
  }

  /* ---------- actions ---------- */
  function byId(list, id) { return list.filter(function (x) { return x.id === id; })[0]; }
  document.addEventListener('click', function (ev) {
    var g = ev.target.closest('[data-goto]'); if (g) ui.goto = g.getAttribute('data-goto');
    var el = ev.target.closest('[data-act]'); if (!el) return;
    var act = el.getAttribute('data-act'), id = el.getAttribute('data-id');
    if (act === 'urgent') { ui.dialog = 'urgent'; renderOverlay(); }
    else if (act === 'dialog-close') { ui.dialog = null; renderOverlay(); }
    else if (act === 'reset-ask') { ui.dialog = 'reset'; renderOverlay(); }
    else if (act === 'reset-do') { S = seed(); ui.dialog = null; ui.asst.msgs = []; audit('Demo data reset', ''); commit('Demo data restored.'); }
    else if (act === 'asst-open') { ui.asst.open = true; renderOverlay(); var c = document.querySelector('.panel .btn'); if (c) c.focus(); }
    else if (act === 'asst-close') { ui.asst.open = false; renderOverlay(); var l = document.querySelector('.launcher'); if (l) l.focus(); }
    else if (act === 'asst-clear') { ui.asst.ctx = false; ui.asst.explain = null; ui.asst.msgs = []; if (ui.asst.path === 'explain') ui.asst.path = null; renderOverlay(); }
    else if (act === 'asst-path') { ui.asst.path = el.getAttribute('data-path'); renderOverlay(); }
    else if (act === 'explain') { ui.asst.open = true; ui.asst.ctx = true; ui.asst.path = 'explain'; ui.asst.explain = el.getAttribute('data-viz'); renderOverlay(); }
    else if (act === 'rec-read') { var r = byId(S.recs, id); if (r && r.state === 'UNREAD') { r.state = 'READ'; save(); renderMain(); renderOverlay(); } }
    else if (act === 'rec-ack') { var r2 = byId(S.recs, id); if (r2) { r2.ack = true; if (r2.state === 'UNREAD') r2.state = 'READ'; audit('Recommendation acknowledged', r2.key); save(); renderMain(); renderOverlay(); } }
    else if (act === 'edit') { ui.edit = { type: el.getAttribute('data-type'), id: id }; renderMain(); var f = document.querySelector('#main form[data-id="' + id + '"] input'); if (f) f.focus(); }
    else if (act === 'cancel-edit') { ui.edit = null; renderMain(); }
    else if (act === 'obs-verify') { var o = byId(S.obs, id); o.quality = 'VALID'; o.qualityReason = 'Verified by ' + ACTOR; audit('Reading verified', STORED[o.metric] + ' ' + o.value); commit('Reading verified.'); }
    else if (act === 'win-complete') { S.complete[id] = true; audit('Sleep period marked complete', fmt(id)); commit('Period marked complete.'); }
    else if (act === 'fu-status') { var fu = byId(S.followups, id); fu.status = el.getAttribute('data-status'); audit('Follow-up ' + fu.status, fu.subject); commit('Follow-up updated.'); }
    else if (act === 'skip') { audit(el.getAttribute('data-what') + ' skipped', 'Recorded as unknown'); commit(el.getAttribute('data-what') + ' skipped. Nothing was recorded and no concern is raised.'); }
    else if (act === 'appetite-review') { S.followups.unshift({ id: uid('fu'), subject: 'Appetite change', action: 'Review requested by the user', owner: 'Unassigned — needs an owner', due: addMin(NOW, 1440), status: 'pending' }); audit('Appetite review requested', ''); commit('Review requested. It is listed under Follow-up tracking in Vitals & Symptoms.'); }
  });
  document.addEventListener('change', function (ev) {
    var c = ev.target.getAttribute && ev.target.getAttribute('data-change'); if (!c) return;
    if (c === 'obs-metric') syncMetricForm(ev.target);
    else if (c === 'metric') { ui.metric = ev.target.value; renderMain(); scrollTo('f-M01F02'); }
    else if (c === 'ctx') { ui.ctxFilter = ev.target.value; renderMain(); scrollTo('f-M01F02'); }
  });
  document.addEventListener('keydown', function (ev) {
    if (ev.key !== 'Escape') return;
    if (ui.dialog) { ui.dialog = null; renderOverlay(); }
    else if (ui.asst.open) { ui.asst.open = false; renderOverlay(); var l = document.querySelector('.launcher'); if (l) l.focus(); }
  });
  function scrollTo(id) { var e = document.getElementById(id); if (e) e.scrollIntoView(); }
  function fail(form, msg) { form.querySelector('.err').textContent = msg; return false; }

  var FORMS = {
    obs: function (f, form) {
      var def = METRICS[f.metric], v = num(f.value), t = fromInput(f.time);
      if (!def) return fail(form, 'Choose a measurement.');
      if (!isFinite(v)) return fail(form, 'Enter a number for the value.');
      if (def.units.indexOf(f.unit) < 0) return fail(form, 'That unit is not supported for ' + def.label.toLowerCase() + '.');
      if (!t) return fail(form, 'Enter the time of the measurement.');
      if (ms(t) > ms(NOW) + 300000) return fail(form, 'The time is in the future on the demo clock (' + fmt(NOW) + ').');
      var parts = [], orig = null;
      if (f.metric === 'blood_pressure') {
        var d = num(f.value2);
        if (!isFinite(d)) return fail(form, 'Enter both systolic and diastolic values.');
        if (d >= v) return fail(form, 'Diastolic must be lower than systolic.');
        parts = [['blood_pressure_systolic', v, def.plaus], ['blood_pressure_diastolic', d, def.plaus2]];
      } else {
        if (f.metric === 'spo2' && (v > 100 || v < 0)) return fail(form, 'Oxygen saturation must be between 0 and 100%.');
        if (v <= 0) return fail(form, 'The value must be greater than zero.');
        if (f.unit === 'degF') { orig = v + ' °F'; v = Math.round(L.fToC(v) * 100) / 100; }
        parts = [[f.metric, v, def.plaus]];
      }
      parts.forEach(function (p) {
        var odd = p[1] < p[2][0] || p[1] > p[2][1];
        S.obs.push({ id: uid('obs'), metric: p[0], value: p[1], unit: def.unit, original: orig, observed_at: t, received_at: NOW, source: 'manual', method: f.method || 'manual entry', context: f.context,
          quality: odd ? 'NEEDS_VERIFICATION' : 'VALID', qualityReason: odd ? 'Outside the plausible entry range; please check the value and unit.' : '', revision: 1, history: [], actor: ACTOR });
        audit('Measurement saved', STORED[p[0]] + ' ' + p[1] + ' ' + unitLabel(def.unit));
      });
      return 'Measurement saved.';
    },
    'obs-correct': function (f, form) {
      var o = byId(S.obs, form.getAttribute('data-id')), v = num(f.value);
      if (!isFinite(v) || v <= 0) return fail(form, 'Enter a valid corrected value.');
      if (!f.reason.trim()) return fail(form, 'Give a reason for the correction.');
      o.history.push({ value: o.value, at: NOW, reason: f.reason }); o.value = v; o.revision += 1;
      audit('Measurement corrected', STORED[o.metric] + ' → ' + v + ' (' + f.reason + ')'); return 'Correction saved as revision ' + o.revision + '.';
    },
    'obs-unrel': function (f, form) {
      var o = byId(S.obs, form.getAttribute('data-id'));
      if (!f.reason.trim()) return fail(form, 'Give a reason.');
      o.quality = 'REJECTED'; o.qualityReason = f.reason; audit('Reading marked unreliable', STORED[o.metric] + ' ' + o.value + ' (' + f.reason + ')'); return 'Reading marked unreliable. It stays visible but is not used.';
    },
    pain: function (f, form) {
      var t = fromInput(f.time), sc = f.score === '' ? null : num(f.score);
      if (!t) return fail(form, 'Enter the time.');
      if (sc !== null && (!isFinite(sc) || sc < 0 || sc > 10 || sc % 1)) return fail(form, 'The score must be a whole number from 0 to 10, or left empty.');
      S.pain.push({ id: uid('pain'), location: f.location, scale: 'demo-0-to-10', score: sc, change: f.change, duration: f.duration, note: f.note, time: t, sessionId: f.session || null });
      audit('Pain reported', f.location + (sc === null ? ', no score' : ', ' + sc + '/10')); return 'Pain report saved.';
    },
    followup: function (f, form) {
      var due = fromInput(f.due);
      if (!f.owner.trim()) return fail(form, 'An owner is required.');
      if (!due) return fail(form, 'A review date is required.');
      S.followups.unshift({ id: uid('fu'), subject: f.subject, action: f.action, owner: f.owner, due: due, status: 'pending' });
      audit('Follow-up recorded', f.subject + ' · owner ' + f.owner); return 'Follow-up recorded.';
    },
    'fu-close': function (f, form) {
      var fu = byId(S.followups, form.getAttribute('data-id'));
      if (!f.reason.trim() || !f.author.trim()) return fail(form, 'Closing needs a reason and the name of the person authorizing it.');
      fu.status = 'closed'; fu.closeReason = f.reason; fu.closedBy = f.author; audit('Follow-up closed', fu.subject + ' · ' + f.author); return 'Follow-up closed.';
    },
    sleep: function (f, form) {
      var s = fromInput(f.start), e = fromInput(f.end);
      if (!s || !e) return fail(form, 'Enter both times.');
      if (ms(e) <= ms(s)) return fail(form, 'Wake-up time must be after the time you fell asleep.');
      if (ms(e) > ms(NOW) + 300000) return fail(form, 'That is in the future on the demo clock (' + fmt(NOW) + ').');
      if (ms(e) - ms(s) > 16 * 3600000) return fail(form, 'More than 16 hours in one entry looks wrong. Please check the times.');
      var ov = 0; S.sleep.forEach(function (iv) { ov += Math.max(0, Math.min(ms(e), ms(iv.end)) - Math.max(ms(s), ms(iv.start))); });
      ov = Math.round(ov / 60000);
      if (ov > 0 && form.getAttribute('data-ok') !== s + e) { form.setAttribute('data-ok', s + e); return fail(form, 'This overlaps an existing entry by ' + ov + ' min. Overlapping minutes are counted once and both entries are kept. Press “Log sleep” again to save.'); }
      S.sleep.push({ id: uid('sl'), start: s, end: e, kind: f.kind, source: f.source, revision: 1, history: [] });
      audit('Sleep logged', f.kind + ' ' + fmt(s) + ' → ' + fmt(e)); return 'Sleep entry saved.';
    },
    'sleep-edit': function (f, form) {
      var iv = byId(S.sleep, form.getAttribute('data-id')), s = fromInput(f.start), e = fromInput(f.end);
      if (!s || !e || ms(e) <= ms(s)) return fail(form, 'Wake-up time must be after the time you fell asleep.');
      if (!f.reason.trim()) return fail(form, 'Give a reason for the change.');
      iv.history.push({ start: iv.start, end: iv.end, reason: f.reason }); iv.start = s; iv.end = e; iv.revision += 1;
      audit('Sleep interval edited', fmt(s) + ' → ' + fmt(e) + ' (' + f.reason + ')'); return 'Interval updated. Totals were recalculated.';
    },
    fatigue: function (f, form) {
      var t = fromInput(f.time); if (!t) return fail(form, 'Enter the time.');
      S.fatigue.push({ id: uid('fat'), value: Number(f.value), time: t }); audit('Fatigue recorded', f.value + ' of 5'); return 'Fatigue check-in saved.';
    },
    fluid: function (f, form) {
      var v = num(f.value), t = fromInput(f.time), ml = L.toMl(v, f.unit);
      if (!isFinite(v) || v <= 0) return fail(form, 'Enter an amount greater than zero.');
      if (ml === null) return fail(form, 'That unit is not supported.');
      if (ml > 5000) return fail(form, 'More than 5 L in one entry looks wrong. Please check the amount and unit.');
      if (!t) return fail(form, 'Enter the time.');
      S.fluid.push({ id: uid('fl'), ml: ml, value: v, unit: f.unit, type: f.type, time: t, source: 'manual', revision: 1, history: [] });
      audit('Fluid logged', v + ' ' + f.unit + ' ' + f.type); return 'Fluid entry saved.';
    },
    'fluid-correct': function (f, form) {
      var e = byId(S.fluid, form.getAttribute('data-id')), v = num(f.value), ml = L.toMl(v, f.unit);
      if (!isFinite(v) || v <= 0 || ml === null) return fail(form, 'Enter a valid amount.');
      if (!f.reason.trim()) return fail(form, 'Give a reason for the correction.');
      e.history.push({ value: e.value, unit: e.unit, reason: f.reason }); e.value = v; e.unit = f.unit; e.ml = ml; e.revision += 1;
      audit('Fluid entry corrected', v + ' ' + f.unit + ' (' + f.reason + ')'); return 'Correction saved. The total was recalculated.';
    },
    appetite: function (f, form) {
      var t = fromInput(f.time); if (!t) return fail(form, 'Enter the time.');
      S.appetite.push({ id: uid('ap'), category: f.category, change: f.change, barriers: f.barriers, note: f.note, time: t, source: 'self-report' });
      audit('Appetite recorded', f.category); return 'Appetite report saved.';
    },
    session: function (f, form) {
      var s = fromInput(f.start), e = fromInput(f.end);
      if (!s || !e) return fail(form, 'Enter start and end times.');
      if (ms(e) <= ms(s)) return fail(form, 'The end must be after the start.');
      if (ms(e) > ms(NOW) + 300000) return fail(form, 'That is in the future on the demo clock (' + fmt(NOW) + ').');
      if (S.sessions.some(function (x) { return x.activity === f.activity && x.start === s; })) return fail(form, 'A ' + f.activity + ' session with this start time already exists.');
      var p = S.plan.filter(function (x) { return x.activity === f.activity; })[0], min = Math.round((ms(e) - ms(s)) / 60000);
      S.sessions.push({ id: uid('ex'), activity: f.activity, start: s, end: e, performed: min, planned: p ? p.minutes : 0, status: f.status, planVersion: S.planMeta.version, note: f.note });
      audit('Exercise session saved', f.activity + ' ' + min + ' min, ' + f.status); return 'Session saved: ' + min + ' minutes.';
    },
    response: function (f, form) {
      var x = byId(S.sessions, f.session), v = num(f.value), m = num(f.minute);
      if (!x) return fail(form, 'Choose a session.');
      if (!isFinite(v) || v <= 0) return fail(form, 'Enter a heart-rate value.');
      if (!isFinite(m) || m < 0) return fail(form, 'Enter the minutes after the session end.');
      var odd = v < 25 || v > 230, t = addMin(x.end, m);
      S.obs.push({ id: uid('obs'), metric: 'heart_rate', value: v, unit: 'bpm', observed_at: t, received_at: NOW, source: 'manual', method: 'manual entry', context: f.phase, quality: odd ? 'NEEDS_VERIFICATION' : 'VALID', qualityReason: odd ? 'Outside the plausible entry range; please check the value.' : '', revision: 1, history: [], sessionId: x.id, minute: m });
      audit('Exercise response recorded', v + ' bpm, ' + m + ' min after ' + x.activity); return 'Response saved and linked to the session.';
    },
    exertion: function (f, form) {
      var v = num(f.value); if (!byId(S.sessions, f.session)) return fail(form, 'Choose a session.');
      if (!isFinite(v) || v < 0 || v > 10 || v % 1) return fail(form, 'Exertion must be a whole number from 0 to 10.');
      S.exertion.push({ id: uid('exr'), sessionId: f.session, scale: 'demo-0-to-10', value: v, time: NOW }); audit('Exertion recorded', v + '/10'); return 'Exertion saved.';
    },
    recovery: function (f, form) {
      var t = fromInput(f.time); if (!byId(S.sessions, f.session)) return fail(form, 'Choose a session.'); if (!t) return fail(form, 'Enter the time.');
      S.recovery.push({ id: uid('rcv'), sessionId: f.session, state: f.state, note: f.note, time: t }); audit('Recovery logged', f.state); return 'Recovery observation saved.';
    },
    wellbeing: function (f, form) {
      var t = fromInput(f.time); if (!t) return fail(form, 'Enter the time.');
      S.wellbeing.push({ id: uid('wb'), scale: 'demo-1-to-5', value: Number(f.value), time: t }); audit('Well-being check-in', 'Private entry saved'); return 'Check-in saved. It stays private.';
    }
  };
  document.addEventListener('submit', function (ev) {
    var form = ev.target, name = form.getAttribute('data-form'); if (!name) return;
    ev.preventDefault();
    var f = {}; Array.prototype.forEach.call(form.elements, function (el) { if (el.name) f[el.name] = el.value; });
    if (name === 'ask') {
      var q = (f.q || '').trim(); if (!q) return;
      ui.asst.msgs.push({ me: true, html: esc(q) }); ui.asst.msgs.push({ html: esc(answer(q)) }); renderOverlay();
      var b = document.getElementById('asst-body'); if (b) b.scrollTop = b.scrollHeight; var i = document.querySelector('.panel-foot input'); if (i) i.focus();
      return;
    }
    var sec0 = form.closest('section'), anchor = sec0 && sec0.id;
    var msg = FORMS[name](f, form);
    if (msg) { commit(msg); if (anchor) scrollTo(anchor); }
  });

  function route() {
    var h = (location.hash || '').replace(/^#\/?/, '').toLowerCase();
    ui.route = h || 'dashboard'; ui.edit = null;
    renderMain(); renderOverlay();
    if (ui.goto) { scrollTo(ui.goto); ui.goto = null; } else window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);
  S = load() || seed(); syncRecs(); save();
  window.SDApp = { state: function () { return S; }, blocked: BLOCKED };
  route();
})();
