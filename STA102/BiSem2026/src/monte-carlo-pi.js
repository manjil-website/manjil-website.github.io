(function () {
  var MAXDOTS = 20000, xs = new Float32Array(MAXDOTS), ys = new Float32Array(MAXDOTS), stored = 0;
  var n = 0, inside = 0, trace = new Sim.Trace(700), runner = new Sim.Runner();
  var sq = new Sim.Canvas('square', function (w) { return Math.min(w, 460); }, function (ctx, w, h) {
    var s = Math.min(w, h) - 24, ox = (w - s) / 2, oy = (h - s) / 2;
    ctx.clearRect(0, 0, w, h); ctx.fillStyle = Sim.css('--surface'); ctx.fillRect(0, 0, w, h);
    var cin = Sim.slot(1), cout = Sim.slot(2), r = stored > 5000 ? 1.1 : stored > 1000 ? 1.6 : 2.4;
    for (var i = 0; i < stored; i++) {
      var x = xs[i], y = ys[i];
      ctx.fillStyle = (x * x + y * y <= 1) ? cin : cout;
      ctx.fillRect(ox + x * s - r / 2, oy + (1 - y) * s - r / 2, r, r);
    }
    ctx.strokeStyle = Sim.css('--ink-1'); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(ox, oy + s, s, -Math.PI / 2, 0); ctx.stroke();
    ctx.strokeStyle = Sim.css('--axis'); ctx.lineWidth = 1; ctx.strokeRect(ox + 0.5, oy + 0.5, s, s);
  });
  var chart = new Sim.LineChart('chart', { height: 360, xLabel: 'darts thrown', yLabel: 'estimate of π', xLog: true, xMin: 1, yMin: 2.6, yMax: 3.7,
    tipX: function (x) { return 'after ' + Sim.int(x) + ' darts'; }, tipY: function (v) { return Sim.fix(v, 4); }, title: 'The estimate as darts are added' });
  function draw() {
    chart.o.xMax = Math.max(10, n);
    chart.set([{ name: 'estimate', slot: 1, points: trace.points(n, n ? 4 * inside / n : undefined).filter(function (p) { return p[1] !== undefined; }) }],
              [{ y: Math.PI, label: 'π' }]);
    Sim.set('t-n', Sim.int(n)); Sim.set('t-in', Sim.int(inside));
    var est = n ? 4 * inside / n : NaN;
    Sim.set('t-est', n ? est.toFixed(4) : '—');
    Sim.set('t-err', n ? Sim.fix(Math.abs(est - Math.PI), 4) : '—');
    Sim.set('t-typ', n ? 'typical error ≈ 1.64/√n = ' + Sim.fix(1.642 / Math.sqrt(n), 4) : '');
    sq.redraw();
  }
  function add(k) {
    runner.run(k, function () {
      var x = Math.random(), y = Math.random(); n++;
      if (x * x + y * y <= 1) inside++;
      if (stored < MAXDOTS) { xs[stored] = x; ys[stored] = y; stored++; }
      trace.push(n, 4 * inside / n);
    }, draw, Sim.animated(k, 1.5));
  }
  function reset() { runner.cancel(); n = 0; inside = 0; stored = 0; trace = new Sim.Trace(700); draw(); }
  Sim.$$('[data-add]').forEach(function (b) { b.addEventListener('click', function () { add(+b.dataset.add); }); });
  document.getElementById('reset').addEventListener('click', reset);
  reset();
})();
