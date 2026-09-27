(function () {
  var walks = new Sim.LineChart('walks', { height: 320, xLabel: 'step', yLabel: 'position',
    tipX: function (x) { return 'step ' + Sim.int(x); }, tipY: function (v) { return String(v); } });
  function newWalks() {
    var k = +document.getElementById('k').value, n = +document.getElementById('steps').value, series = [];
    for (var j = 0; j < k; j++) {
      var s = 0, pts = [[0, 0]];
      for (var i = 1; i <= n; i++) { s += Math.random() < 0.5 ? 1 : -1; pts.push([i, s]); }
      series.push({ name: 'Walk ' + (j + 1), slot: j + 1, points: pts });
    }
    if (document.getElementById('sq').checked) {
      var up = [], lo = []; for (var t = 0; t <= n; t += Math.max(1, Math.floor(n / 200))) { up.push([t, Math.sqrt(t)]); lo.push([t, -Math.sqrt(t)]); }
      series.push({ name: '±√n (typical distance)', ref: true, points: up }); series.push({ ref: true, noLegend: true, points: lo });
    }
    walks.o.xMin = 0; walks.o.xMax = n; walks.set(series, [{ y: 0 }]);
  }
  Sim.bindRange('steps', 'steps-o', null, newWalks);
  document.getElementById('new').addEventListener('click', newWalks);
  document.getElementById('k').addEventListener('change', newWalks);
  document.getElementById('sq').addEventListener('change', newWalks);
  newWalks();

  var N = 100, M = 0, sumsq = [], finals = {}, runner = new Sim.Runner();
  var rms = new Sim.LineChart('rms', { height: 300, xLabel: 'step n', yLabel: 'distance from the start', title: 'Root-mean-square distance',
    tipX: function (x) { return 'step ' + x; }, tipY: function (v) { return Sim.fix(v, 3); } });
  var fin = new Sim.BarChart('final', { height: 300, xLabel: 'final position', yLabel: 'fraction of walks', title: 'Where the walks finish',
    valFmt: function (v) { return Sim.fix(v, 4); }, labelEvery: function (c) { return c % 10 === 0; } });
  function reset() { runner.cancel(); M = 0; sumsq = new Float64Array(N + 1); finals = {}; draw(); }
  function draw() {
    var sim = [], th = [];
    for (var i = 0; i <= N; i++) { th.push([i, Math.sqrt(i)]); if (M) sim.push([i, Math.sqrt(sumsq[i] / M)]); }
    rms.o.xMin = 0; rms.o.xMax = N; rms.o.yMin = 0;
    rms.set([{ name: 'simulated', slot: 1, points: sim }, { name: '√n', ref: true, points: th }]);
    var cats = [], vals = [], ex = [];
    var R = Math.min(N, 2 * Math.ceil(2 * Math.sqrt(N)));       /* show about four standard deviations */
    fin.o.labelEvery = function (c) { return c % (R > 40 ? 20 : 10) === 0; };
    for (var x = -R; x <= R; x += 2) { cats.push(x); vals.push(M ? (finals[x] || 0) / M : 0); ex.push(Sim.choose(N, (N + x) / 2) / Math.pow(2, N)); }
    fin.set({ categories: cats, series: [{ name: 'simulated', slot: 1, values: vals }], exact: { name: 'exact', values: ex } });
    Sim.set('t-m', Sim.int(M));
    Sim.set('t-rms', M ? Sim.fix(Math.sqrt(sumsq[N] / M), 2) : '—'); Sim.set('t-rms-x', '√' + N + ' = ' + Sim.fix(Math.sqrt(N), 2));
    Sim.set('t-zero', M ? Sim.pct((finals[0] || 0) / M, 2) : '—');
    Sim.set('t-zero-x', 'exact C(' + N + ',' + (N / 2) + ')/2' + Sim.sup(N) + ' = ' + Sim.pct(Sim.choose(N, N / 2) / Math.pow(2, N), 2));
  }
  function many(k) {
    runner.run(k, function () {
      var s = 0; for (var i = 1; i <= N; i++) { s += Math.random() < 0.5 ? 1 : -1; sumsq[i] += s * s; }
      finals[s] = (finals[s] || 0) + 1; M++;
    }, draw, Sim.animated(k, 1.2));
  }
  Sim.bindRange('N', 'N-o', null, function (v) { N = v; reset(); });
  Sim.$$('[data-many]').forEach(function (b) { b.addEventListener('click', function () { many(+b.dataset.many); }); });
  document.getElementById('reset').addEventListener('click', reset);
  reset();
})();
