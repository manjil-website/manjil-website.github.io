(function () {
  var n = 10, hist = [], total = 0, sumM = 0, runner = new Sim.Runner();
  function Pn(m) { var s = 0, t = 1; for (var k = 0; k <= m; k++) { if (k) t /= k; s += (k % 2 ? -1 : 1) * t; } return s; }
  function exactK(k) { return Pn(n - k) / Sim.factorial(k); }
  var perm = [];
  function handout() { perm = Sim.shuffle(Sim.range(n)); var m = 0; for (var i = 0; i < n; i++) if (perm[i] === i) m++; return m; }
  var KMAX = function () { return Math.min(n, 7); };
  var dist = new Sim.BarChart('dist', { height: 280, xLabel: 'number of matches', yLabel: 'fraction of handouts', title: 'How many get their own phone',
    valFmt: function (v) { return Sim.fix(v, 4); } });
  var curve = new Sim.LineChart('curve', { height: 300, xLabel: 'number of students n', yMin: 0, yMax: 0.6, xMin: 1, xMax: 20,
    title: 'P(nobody gets their own), exact', tipX: function (x) { return x + ' students'; }, tipY: function (v) { return Sim.fix(v, 4); } });
  function draw() {
    var cats = [], sim = [], ex = [];
    for (var k = 0; k <= KMAX(); k++) { cats.push(k); sim.push(total ? (hist[k] || 0) / total : 0); ex.push(exactK(k)); }
    dist.set({ categories: cats, series: [{ name: 'simulated', slot: 1, values: sim }], exact: { name: 'exact Pₙ₋ₖ / k!', values: ex } });
    var pts = []; for (var m = 1; m <= 20; m++) pts.push([m, Pn(m)]);
    var series = [{ name: 'exact', slot: 1, points: pts }];
    if (total && n <= 20) series.push({ name: 'your simulation', slot: 2, markers: true, points: [[n, (hist[0] || 0) / total]] });
    curve.set(series, [{ y: 1 / Math.E, label: '1/e ≈ 0.368', below: true }]);
    Sim.set('t-h', Sim.int(total));
    Sim.set('t-none', total ? Sim.fix((hist[0] || 0) / total, 4) : '—');
    Sim.set('t-none-x', 'exact ' + Sim.fix(Pn(n), 4) + ' · 1/e = 0.3679');
    Sim.set('t-avg', total ? Sim.fix(sumM / total, 3) : '—');
  }
  function record(m) { hist[m] = (hist[m] || 0) + 1; total++; sumM += m; }
  function showPeople(m) {
    var h = '';
    for (var i = 0; i < n; i++) {
      var hit = perm[i] === i;
      h += '<div style="display:flex;flex-direction:column;align-items:center;width:34px;font-size:0.78rem;color:var(--ink-2)">' +
           '<div style="width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:650;' +
           (hit ? 'background:var(--s2);color:#fff' : 'background:var(--surface-2);color:var(--ink-1)') + '">' + (i + 1) + '</div>' +
           '<div style="margin-top:2px;' + (hit ? 'font-weight:700;color:var(--ink-1)' : '') + '">' + (perm[i] + 1) + '</div></div>';
    }
    Sim.html('people', h);
    Sim.set('people-cap', m === 0 ? 'Nobody got their own phone this time.' : m + (m === 1 ? ' student' : ' students') + ' got their own phone back (highlighted).');
  }
  document.getElementById('once').addEventListener('click', function () { var m = handout(); record(m); showPeople(m); draw(); });
  Sim.$$('[data-many]').forEach(function (b) { b.addEventListener('click', function () {
    var k = +b.dataset.many; runner.run(k, function () { record(handout()); }, draw, Sim.animated(k, 1.2)); }); });
  function reset() { runner.cancel(); hist = []; total = 0; sumM = 0; Sim.html('people', ''); Sim.set('people-cap', 'Press Hand back once. Each circle is a student; the number below is whose phone they got.'); draw(); }
  document.getElementById('reset').addEventListener('click', reset);
  Sim.bindRange('n', 'n-o', null, function (v) { n = v; reset(); });
  draw();
})();
