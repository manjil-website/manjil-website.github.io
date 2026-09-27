(function () {
  var MODES = {
    coin:     { label: 'Coin: heads', y: 'fraction of heads', p: 0.5, exact: 0.5, exactTxt: '1/2 = 0.5000', sd: 0.5,
                trial: function () { return Math.random() < 0.5 ? 1 : 0; }, yMin: 0, yMax: 1,
                cap: 'Each run is a separate fair coin. The dashed line is the exact probability 1/2.' },
    die:      { label: 'Die: sixes', y: 'fraction of sixes', exact: 1 / 6, exactTxt: '1/6 ≈ 0.1667', sd: Math.sqrt(5) / 6,
                trial: function () { return Math.random() < 1 / 6 ? 1 : 0; }, yMin: 0, yMax: 0.6,
                cap: 'Each run is a separate fair die. The dashed line is 1/6.' },
    roulette: { label: 'Roulette: ₹1 on red', y: 'average winnings per bet (₹)', exact: -1 / 37, exactTxt: '−1/37 ≈ −0.0270',
                sd: Math.sqrt(1 - 1 / (37 * 37)),
                trial: function () { return Math.random() < 18 / 37 ? 1 : -1; }, yMin: -0.6, yMax: 0.6,
                cap: 'Win ₹1 with probability 18/37, lose ₹1 with probability 19/37. The dashed line is the house edge, −1/37 per bet.' }
  };
  var mode = 'coin', runs = [], runner = new Sim.Runner();
  var chart = new Sim.LineChart('chart', { height: 320, xLabel: 'number of trials', xLog: true,
    tipX: function (x) { return 'after ' + Sim.int(x) + ' trials'; }, tipY: function (v) { return Sim.fix(v, 4); } });

  function reset() {
    runner.cancel();
    var k = +document.getElementById('runs').value; runs = [];
    for (var i = 0; i < k; i++) runs.push({ sum: 0, n: 0, trace: new Sim.Trace(700) });
    draw();
  }
  function draw() {
    var M = MODES[mode], logx = document.getElementById('logx').checked;
    chart.o.xLog = logx; chart.o.yMin = M.yMin; chart.o.yMax = M.yMax; chart.o.yLabel = M.y;
    var n = runs.length ? runs[0].n : 0;
    chart.o.xMin = logx ? 1 : 0; chart.o.xMax = Math.max(n, logx ? 10 : 10);
    var series = runs.map(function (r, i) {
      return { name: 'Run ' + (i + 1), slot: i + 1 > 4 ? ((i % 4) + 1) : i + 1, points: r.trace.points(r.n, r.n ? r.sum / r.n : undefined).filter(function (p) { return p[1] !== undefined; }) };
    });
    if (runs.length === 5) series[4].color = '--ink-3';
    if (document.getElementById('band').checked && n > 0) {
      var up = [], lo = [];
      for (var t = 1; t <= n; t = Math.max(t + 1, Math.floor(t * 1.08))) {
        up.push([t, M.exact + 2 * M.sd / Math.sqrt(t)]); lo.push([t, M.exact - 2 * M.sd / Math.sqrt(t)]);
      }
      up.push([n, M.exact + 2 * M.sd / Math.sqrt(n)]); lo.push([n, M.exact - 2 * M.sd / Math.sqrt(n)]);
      series.push({ name: 'typical range (±2 standard errors)', ref: true, points: up });
      series.push({ ref: true, points: lo, noLegend: true });
    }
    chart.set(series, [{ y: M.exact, label: 'exact ' + M.exactTxt.split(' ')[0] }]);
    Sim.set('t-n', Sim.int(n));
    Sim.set('t-r1', n ? Sim.fix(runs[0].sum / n, 4) : '—');
    var far = 0; runs.forEach(function (r) { if (r.n) far = Math.max(far, Math.abs(r.sum / r.n - M.exact)); });
    Sim.set('t-far', n ? Sim.fix(far, 4) : '—');
    Sim.set('t-exact', M.exactTxt.split(' ').slice(-1)[0]);
    Sim.set('t-exact-sub', M.exactTxt);
    Sim.set('t-r1-label', 'Run 1: ' + M.y);
    Sim.set('cap', M.cap);
  }
  function add(k) {
    var M = MODES[mode];
    runner.run(k, function () {
      for (var i = 0; i < runs.length; i++) { var r = runs[i]; r.sum += M.trial(); r.n++; r.trace.push(r.n, r.sum / r.n); }
    }, draw, Sim.animated(k, 1.6));
  }
  Sim.segmented('mode', Object.keys(MODES).map(function (k) { return { value: k, label: MODES[k].label }; }), 'coin',
    function (v) { mode = v; reset(); });
  Sim.$$('[data-add]').forEach(function (b) { b.addEventListener('click', function () { add(+b.dataset.add); }); });
  document.getElementById('reset').addEventListener('click', reset);
  document.getElementById('runs').addEventListener('change', reset);
  document.getElementById('logx').addEventListener('change', draw);
  document.getElementById('band').addEventListener('change', draw);
  reset();
})();
