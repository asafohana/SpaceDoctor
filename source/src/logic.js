/* SpaceDoctor Focus v3 demo — deterministic calculations shared by dashboard and detail pages. */
(function (root) {
  'use strict';
  var MIN = 60000;

  function ms(iso) { return new Date(iso).getTime(); }

  /* Union sleep intervals, clipped to a reporting window. Overlapping minutes count once. */
  function unionMinutes(intervals, winStart, winEnd) {
    var ws = ms(winStart), we = ms(winEnd), raw = 0;
    var clipped = [];
    intervals.forEach(function (iv) {
      var s = Math.max(ms(iv.start), ws), e = Math.min(ms(iv.end), we);
      if (e > s) { clipped.push([s, e]); raw += e - s; }
    });
    clipped.sort(function (a, b) { return a[0] - b[0]; });
    var merged = [];
    clipped.forEach(function (c) {
      var last = merged[merged.length - 1];
      if (last && c[0] <= last[1]) last[1] = Math.max(last[1], c[1]);
      else merged.push([c[0], c[1]]);
    });
    var total = merged.reduce(function (t, m) { return t + (m[1] - m[0]); }, 0);
    return {
      minutes: Math.round(total / MIN),
      overlapMinutes: Math.round((raw - total) / MIN),
      merged: merged
    };
  }

  /* PERIOD rule: only a closed and complete window can be compared with a target. */
  function sleepSummary(intervals, win, target, nowIso) {
    var u = unionMinutes(intervals, win.start, win.end);
    var closed = ms(win.end) <= ms(nowIso);
    var out = { obtained: u.minutes, overlapMinutes: u.overlapMinutes, closed: closed, complete: !!win.complete, state: 'IN_PROGRESS', shortfall: null };
    if (!closed) out.state = 'IN_PROGRESS';
    else if (!win.complete) out.state = 'CLOSED_NOT_ATTESTED';
    else if (!target) out.state = 'NO_TARGET';
    else if (u.minutes < target.minutes) { out.state = 'BELOW_TARGET'; out.shortfall = target.minutes - u.minutes; }
    else out.state = 'MET_TARGET';
    return out;
  }

  var VOLUME = { 'mL': 1, 'L': 1000, 'US fl oz': 29.5735 };
  function toMl(value, unit) {
    if (!isFinite(value) || !(unit in VOLUME)) return null;
    return value * VOLUME[unit];
  }

  function fluidSummary(entries, target, complete) {
    var total = entries.reduce(function (t, e) { return t + e.ml; }, 0);
    var out = { totalMl: total, percent: null, state: complete ? 'CLOSED' : 'IN_PROGRESS' };
    if (target && target.ml > 0) out.percent = Math.round(total / target.ml * 100);
    return out;
  }

  function exercisePercent(performed, planned) {
    if (!(planned > 0)) return null;
    return Math.round(performed / planned * 100);
  }

  /* Inclusive interval [L,U]: low x<L, within L<=x<=U, high x>U. Never use rounded display values. */
  function classifyInclusive(x, L, U) {
    if (typeof x !== 'number' || !isFinite(x)) return 'UNKNOWN';
    if (x < L) return 'LOW';
    if (x > U) return 'HIGH';
    return 'WITHIN_RULE';
  }

  /* REPEAT(N, M, W, delta): among the last M eligible independent samples inside window W,
     at least N must qualify and be separated by at least delta seconds. Duplicate ids never add a sample. */
  function repeatRule(samples, cfg) {
    var seen = {}, list = [];
    samples.forEach(function (s) {
      var id = s.id !== undefined ? s.id : s.t + ':' + s.v;
      if (seen[id]) return;
      seen[id] = true; list.push(s);
    });
    list.sort(function (a, b) { return a.t - b.t; });
    var activations = 0, active = false;
    for (var i = 0; i < list.length; i++) {
      var win = list.filter(function (s) { return s.t <= list[i].t && s.t > list[i].t - cfg.W; }).slice(-cfg.M);
      var q = [];
      win.forEach(function (s) {
        if (cfg.pred(s.v) && (!q.length || s.t - q[q.length - 1].t >= cfg.delta)) q.push(s);
      });
      var ok = win.length >= cfg.M && q.length >= cfg.N;
      if (ok && !active) { active = true; activations++; }
    }
    return { state: active ? 'ACTIVE' : 'PENDING_CONFIRMATION', activations: activations };
  }

  function fToC(f) { return (f - 32) * 5 / 9; }

  function fmtDuration(min) {
    var h = Math.floor(min / 60), m = min % 60;
    if (h && m) return h + ' h ' + m + ' min';
    if (h) return h + ' h';
    return m + ' min';
  }

  var api = {
    unionMinutes: unionMinutes, sleepSummary: sleepSummary, toMl: toMl, fluidSummary: fluidSummary,
    exercisePercent: exercisePercent, classifyInclusive: classifyInclusive, repeatRule: repeatRule,
    fToC: fToC, fmtDuration: fmtDuration
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SDLogic = api;
})(typeof window !== 'undefined' ? window : globalThis);
