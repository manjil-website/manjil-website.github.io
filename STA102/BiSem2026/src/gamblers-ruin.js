(function () {
  var I = 10, N = 20, P = 0.5, games = 0, wins = 0, sumLen = 0, maxLen = 0, paths = [], runner = new Sim.Runner();
  function exactP(i, n, p) { if (Math.abs(p - 0.5) < 1e-12) return i / n; var r = (1 - p) / p; return (1 - Math.pow(r, i)) / (1 - Math.pow(r, n)); }
  function exactM(i, n, p) { if (Math.abs(p - 0.5) < 1e-12) return i * (n - i); var q = 1 - p; return (i - n * exactP(i, n, p)) / (q - p); }
  function play(record) {
    var x = I, t = 0, path = record ? [[0, x]] : null;
    while (x > 0 && x < N && t < 5e6) { x += Math.random() < P ? 1 : -1; t++; if (record) path.push([t, x]); }
    games++; sumLen += t; if (t > maxLen) maxLen = t; if (x >= N) wins++;
    return path;
  }
  var pchart = new Sim.LineChart('pchart', { height: 300, xLabel: 'round', yLabel: 'fortune', title: 'Some games',
    tipX: function (x) { return 'round ' + Sim.int(x); }, tipY: function (v) { return String(v); } });
  var curve = new Sim.LineChart('curve', { height: 260, xLabel: 'starting fortune i', yLabel: 'P(reach N)', yMin: 0, yMax: 1, xMin: 0,
    title: 'Chance of reaching the target from each starting point', tipX: function (x) { return 'start at ' + x; }, tipY: function (v) { return Sim.fix(v, 4); } });
  function draw() {
    pchart.o.yMin = 0; pchart.o.yMax = N; pchart.o.xMin = 0;
    pchart.o.xMax = paths.length ? Math.max.apply(null, paths.map(function (p) { return p[p.length - 1][0]; })) : 10;
    pchart.set(paths.map(function (p, k) { return { name: 'Game ' + (k + 1), slot: k + 1, points: p }; }),
               [{ y: N, label: 'target N = ' + N, below: true }, { y: 0, label: 'ruin' }]);
    var pts = []; for (var i = 0; i <= N; i++) pts.push([i, exactP(i, N, P)]);
    var ser = [{ name: 'exact', slot: 1, points: pts }];
    if (games) ser.push({ name: 'simulated at i = ' + I, slot: 2, markers: true, points: [[I, wins / games]] });
    curve.o.xMax = N; curve.set(ser);
    Sim.set('t-g', Sim.int(games));
    var ep = exactP(I, N, P), em = exactM(I, N, P);
    Sim.set('t-win', games ? Sim.fix(wins / games, 4) : '—');
    Sim.set('t-win-x', 'exact ' + (Math.abs(P - 0.5) < 1e-12 ? 'i/N = ' : '(1−rⁱ)/(1−rᴺ) = ') + Sim.fix(ep, 4));
    Sim.set('t-len', games ? Sim.fix(sumLen / games, 1) : '—');
    Sim.set('t-len-x', 'exact ' + Sim.fix(em, 1));
    Sim.set('t-max', games ? Sim.int(maxLen) : '—');
  }
  function reset() { runner.cancel(); games = wins = sumLen = maxLen = 0; paths = []; draw(); }
  var iIn = document.getElementById('i'), nIn = document.getElementById('N'), pIn = document.getElementById('p');
  function sync() { iIn.max = N - 1; if (I > N - 1) { I = N - 1; iIn.value = I; } Sim.set('i-o', I); Sim.set('N-o', N); Sim.set('p-o', P.toFixed(3)); }
  Sim.bindRange(iIn, 'i-o', null, function (v) { I = v; reset(); });
  Sim.bindRange(nIn, 'N-o', null, function (v) { N = v; sync(); reset(); });
  Sim.bindRange(pIn, 'p-o', function (v) { return v.toFixed(3); }, function (v) { P = v; reset(); });
  var PRE = { fair: [10, 20, 0.5], red: [10, 20, 18 / 37], ravi: [50, 100, 18 / 37], deuce: [2, 4, 0.55], ross: [5, 15, 0.6] };
  Sim.segmented('presets', [{ value: 'fair', label: 'Fair coin' }, { value: 'red', label: 'Red at roulette' },
    { value: 'ravi', label: 'Ravi: ₹50 → ₹100' }, { value: 'deuce', label: 'Deuce (p = 0.55)' }, { value: 'ross', label: 'Ross: 5 vs 10, p = 0.6' }], 'fair',
    function (v) { var s = PRE[v]; N = s[1]; nIn.value = N; sync(); I = s[0]; iIn.value = I; P = s[2]; pIn.value = P; sync(); reset(); });
  document.getElementById('paths').addEventListener('click', function () { paths = []; for (var k = 0; k < 4; k++) paths.push(play(true)); draw(); });
  Sim.$$('[data-games]').forEach(function (b) { b.addEventListener('click', function () {
    var k = +b.dataset.games; runner.run(k, function () { play(false); }, draw, Sim.animated(k, 1.5)); }); });
  document.getElementById('reset').addEventListener('click', reset);
  sync(); draw();

  /* ---------- bold play ---------- */
  var STAKES = [1, 2, 5, 10, 25, 50], bw = STAKES.map(function () { return 0; }), bn = 0, brun = new Sim.Runner();
  var bchart = new Sim.BarChart('boldchart', { height: 260, xLabel: 'stake per bet (₹)', yLabel: 'P(reach ₹100)',
    catLabel: function (c) { return '₹' + c; }, valFmt: function (v) { return Sim.fix(v, 3); } });
  function bdraw() {
    bchart.set({ categories: STAKES, series: [{ name: 'simulated', slot: 1, values: bw.map(function (w) { return bn ? w / bn : 0; }) }],
                 exact: { name: 'exact', values: STAKES.map(function (s) { return exactP(50 / s, 100 / s, 18 / 37); }) } });
  }
  document.getElementById('bold').addEventListener('click', function () {
    brun.run(2000, function () {
      STAKES.forEach(function (s, k) { var x = 50 / s, n = 100 / s; while (x > 0 && x < n) x += Math.random() < 18 / 37 ? 1 : -1; if (x >= n) bw[k]++; });
      bn++;
    }, bdraw, Sim.animated(2000, 1.5));
  });
  document.getElementById('bold-reset').addEventListener('click', function () { brun.cancel(); bw = STAKES.map(function () { return 0; }); bn = 0; bdraw(); });
  bdraw();

  /* ---------- race to a six ---------- */
  var rn = 0, ra = 0, rlen = 0, rrun = new Sim.Runner(), five = false;
  function race() {
    var t = 0;
    while (true) {
      t++; var a = Sim.die(); if (a === 6 || (five && a === 5)) { ra++; break; }
      t++; if (Sim.die() === 6) break;
    }
    rn++; rlen += t;
  }
  function rdraw() {
    Sim.set('r-n', Sim.int(rn)); Sim.set('r-a', rn ? Sim.fix(ra / rn, 4) : '—'); Sim.set('r-len', rn ? Sim.fix(rlen / rn, 2) : '—');
    Sim.set('r-a-x', five ? 'exact: work it out with first-step analysis, then compare' : 'exact 6/11 = 0.5455');
  }
  Sim.$$('[data-races]').forEach(function (b) { b.addEventListener('click', function () { var k = +b.dataset.races; rrun.run(k, race, rdraw, Sim.animated(k, 1)); }); });
  function rreset() { rrun.cancel(); rn = ra = rlen = 0; rdraw(); }
  document.getElementById('race-reset').addEventListener('click', rreset);
  document.getElementById('five').addEventListener('change', function (e) { five = e.target.checked; rreset(); });
  rdraw();
})();
