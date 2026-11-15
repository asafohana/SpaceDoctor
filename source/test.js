// Checks the shared calculations against the handoff's acceptance fixtures (those a demo without a backend can exercise).
const L = require('./src/logic.js'), assert = require('assert');
const demo = JSON.parse(require('fs').readFileSync(process.argv[2] + '/demo/Synthetic_Demo_Data.json', 'utf8'));
let n = 0; const t = (id, fn) => { fn(); n++; console.log('ok', id); };
t('T01 inclusive endpoints', () => { assert.equal(L.classifyInclusive(10, 10, 20), 'WITHIN_RULE'); assert.equal(L.classifyInclusive(20, 10, 20), 'WITHIN_RULE'); });
t('T02 stored precision', () => { assert.equal(L.classifyInclusive(20, 10, 20) === 'HIGH', false); assert.equal(L.classifyInclusive(20.0001, 10, 20), 'HIGH'); });
t('T03 repeat 2 of 3', () => { const r = L.repeatRule([{ t: 0, v: 21 }, { t: 30, v: 19 }, { t: 60, v: 22 }], { N: 2, M: 3, W: 300, delta: 30, pred: v => v > 20 }); assert.equal(r.state, 'ACTIVE'); assert.equal(r.activations, 1); });
t('T04 replayed sample ignored', () => { const r = L.repeatRule([{ id: 'a', t: 0, v: 21 }, { id: 'a', t: 0, v: 21 }, { id: 'b', t: 30, v: 19 }], { N: 2, M: 3, W: 300, delta: 30, pred: v => v > 20 }); assert.equal(r.state, 'PENDING_CONFIRMATION'); });
t('T10 fluid 1400/2500 in progress', () => { const s = L.fluidSummary(demo.fluid.entries_ml.map(ml => ({ ml })), { ml: demo.fluid.target_ml }, false); assert.equal(s.totalMl, 1400); assert.equal(s.percent, 56); assert.equal(s.state, 'IN_PROGRESS'); });
t('T11 sleep 400 min, 80 short', () => { const s = L.sleepSummary(demo.sleep.intervals, { start: demo.sleep.window_start, end: demo.sleep.window_end, complete: true }, { minutes: 480 }, demo.clock); assert.equal(s.obtained, 400); assert.equal(s.shortfall, 80); assert.equal(s.state, 'BELOW_TARGET'); });
t('T12 overlap counted once', () => { const u = L.unionMinutes([{ start: '2026-11-14T13:00:00Z', end: '2026-11-14T14:00:00Z' }, { start: '2026-11-14T13:30:00Z', end: '2026-11-14T14:00:00Z' }], demo.sleep.window_start, demo.sleep.window_end); assert.equal(u.minutes, 60); assert.equal(u.overlapMinutes, 30); });
t('open window is never a shortfall', () => { const s = L.sleepSummary([], { start: '2026-11-15T12:00:00Z', end: '2026-11-16T12:00:00Z', complete: false }, { minutes: 480 }, demo.clock); assert.equal(s.state, 'IN_PROGRESS'); assert.equal(s.shortfall, null); });
t('T14 exercise 20/25 = 80%', () => assert.equal(L.exercisePercent(20, 25), 80));
t('unsupported unit rejected', () => { assert.equal(L.toMl(1, 'cups'), null); assert.equal(L.toMl(1.5, 'L'), 1500); });
console.log(n + ' checks passed');
