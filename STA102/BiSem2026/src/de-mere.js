(function () {
  var PA = 1 - Math.pow(5 / 6, 4), PB = 1 - Math.pow(35 / 36, 24);
  var g = 0, wa = 0, wb = 0, trA = new Sim.Trace(600), trB = new Sim.Trace(600), runner = new Sim.Runner(), lastA = null, lastB = null;
  var chart = new Sim.LineChart('chart', { height: 300, xLabel: 'games', yLabel: 'fraction of games won', xLog: true, xMin: 1, yMin: 0.3, yMax: 0.7,
    tipX: function (x) { return 'after ' + Sim.int(x) + ' games'; }, tipY: function (v) { return Sim.fix(v, 4); } });
  function playA() { var r = []; for (var i = 0; i < 4; i++) r.push(Sim.die()); return r; }
  function playB() { for (var i = 1; i <= 24; i++) { if (Sim.die() === 6 && Sim.die() === 6) return i; } return 0; }
  function one() {
    lastA = playA(); lastB = playB(); g++;
    if (lastA.indexOf(6) >= 0) wa++; if (lastB) wb++;
    trA.push(g, wa / g); trB.push(g, wb / g);
  }
  function draw() {
    chart.o.xMax = Math.max(10, g);
    chart.set([{ name: 'Bet A', slot: 1, points: trA.points(g, g ? wa / g : undefined).filter(function (p) { return p[1] !== undefined; }) },
               { name: 'Bet B', slot: 2, points: trB.points(g, g ? wb / g : undefined).filter(function (p) { return p[1] !== undefined; }) }],
              [{ y: PA, label: 'A exact 0.518' }, { y: PB, label: 'B exact 0.491', below: true }]);
    Sim.set('t-g', Sim.int(g));
    Sim.set('t-a', g ? Sim.fix(wa / g, 4) : '—'); Sim.set('t-b', g ? Sim.fix(wb / g, 4) : '—');
    function money(w) { var v = 2 * w - g; return (v >= 0 ? '+' : '−') + '₹' + Sim.int(Math.abs(v)); }
    Sim.set('t-prof', g ? money(wa) + ', ' + money(wb) : '—');
    if (lastA) {
      Sim.html('lastA', lastA.map(function (d) { return Sim.dieSVG(d, d === 6 ? 'hit' : ''); }).join(''));
      Sim.set('lastA-c', lastA.indexOf(6) >= 0 ? 'A six appeared: Bet A wins.' : 'No six: Bet A loses.');
      Sim.set('lastB', lastB ? 'A double six appeared on throw ' + lastB + ' of 24: Bet B wins.' : 'No double six in 24 throws of two dice: Bet B loses.');
    } else { Sim.html('lastA', ''); Sim.set('lastA-c', ''); Sim.set('lastB', ''); }
  }
  Sim.$$('[data-play]').forEach(function (b) { b.addEventListener('click', function () {
    var k = +b.dataset.play; if (k === 1) { one(); draw(); } else runner.run(k, one, draw, Sim.animated(k, 1.4)); }); });
  document.getElementById('reset').addEventListener('click', function () { runner.cancel(); g = wa = wb = 0; trA = new Sim.Trace(600); trB = new Sim.Trace(600); lastA = lastB = null; draw(); });
  draw();

  /* Galileo */
  var EX = new Array(19).fill(0);
  for (var a = 1; a <= 6; a++) for (var b = 1; b <= 6; b++) for (var c = 1; c <= 6; c++) EX[a + b + c]++;
  var cnt = new Array(19).fill(0), n = 0, gr = new Sim.Runner();
  var gchart = new Sim.BarChart('gchart', { height: 280, xLabel: 'total of three dice', yLabel: 'fraction of throws',
    valFmt: function (v) { return Sim.fix(v, 4); } });
  function gdraw() {
    var cats = [], sim = [], ex = [];
    for (var s = 3; s <= 18; s++) { cats.push(s); sim.push(n ? cnt[s] / n : 0); ex.push(EX[s] / 216); }
    gchart.set({ categories: cats, series: [{ name: 'simulated', slot: 1, values: sim }], exact: { name: 'exact (count / 216)', values: ex } });
    Sim.set('g-n', Sim.int(n));
    Sim.set('g-9', n ? Sim.fix(cnt[9] / n, 4) : '—'); Sim.set('g-10', n ? Sim.fix(cnt[10] / n, 4) : '—');
    var d = cnt[10] - cnt[9]; Sim.set('g-d', n ? (d >= 0 ? '+' : '−') + Sim.int(Math.abs(d)) : '—');
    Sim.set('g-d-x', n ? 'expected about +' + Sim.int(n * 2 / 216) : '');
  }
  Sim.$$('[data-throw]').forEach(function (b) { b.addEventListener('click', function () {
    var k = +b.dataset.throw;
    gr.run(k, function () { cnt[Sim.die() + Sim.die() + Sim.die()]++; n++; }, gdraw, Sim.animated(k, 1.2)); }); });
  document.getElementById('g-reset').addEventListener('click', function () { gr.cancel(); cnt = new Array(19).fill(0); n = 0; gdraw(); });
  gdraw();
})();
