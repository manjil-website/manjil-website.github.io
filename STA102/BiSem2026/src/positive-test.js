(function () {
  var PREV = [0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.15, 0.2], N = 10000;
  var prev = 0.01, sens = 0.95, spec = 0.95, view = 'all', town = null;
  function counts() {
    if (town) return town;
    var sick = Math.round(N * prev), healthy = N - sick;
    var tp = Math.round(sick * sens), fp = Math.round(healthy * (1 - spec));
    return { tp: tp, fn: sick - tp, fp: fp, tn: healthy - fp, simulated: false };
  }
  function simulateTown() {
    var c = { tp: 0, fn: 0, fp: 0, tn: 0, simulated: true };
    for (var i = 0; i < N; i++) {
      if (Math.random() < prev) { if (Math.random() < sens) c.tp++; else c.fn++; }
      else { if (Math.random() < 1 - spec) c.fp++; else c.tn++; }
    }
    return c;
  }
  var GROUPS = [
    { key: 'tp', label: 'sick, tests positive', col: function () { return Sim.slot(2); } },
    { key: 'fp', label: 'healthy, tests positive (false alarm)', col: function () { return Sim.slot(1); } },
    { key: 'fn', label: 'sick, tests negative (missed)', col: function () { return Sim.slot(3); } },
    { key: 'tn', label: 'healthy, tests negative', col: function () { return Sim.css('--neutral'); } }
  ];
  var grid = new Sim.Canvas('grid', function (w) { return view === 'all' ? Math.round((w - 12) / 125 * 80 + 12) : Math.max(220, Math.round(w * 0.36)); }, function (ctx, w, h) {
    ctx.clearRect(0, 0, w, h); ctx.fillStyle = Sim.css('--surface'); ctx.fillRect(0, 0, w, h);
    var c = counts(), list = [];
    var groups = view === 'all' ? GROUPS : GROUPS.slice(0, 2);
    groups.forEach(function (gp) { list.push([c[gp.key], gp.col()]); });
    var total = list.reduce(function (a, b) { return a + b[0]; }, 0); if (!total) return;
    var cols = view === 'all' ? 125 : Math.max(10, Math.ceil(Math.sqrt(total * (w / h))));
    var rows = Math.ceil(total / cols), cell = Math.min((w - 12) / cols, (h - 12) / rows);
    var ox = (w - cell * cols) / 2, oy = (h - cell * rows) / 2, idx = 0, gap = cell > 5 ? 1 : 0;
    list.forEach(function (it) {
      ctx.fillStyle = it[1];
      for (var k = 0; k < it[0]; k++, idx++) {
        var r = Math.floor(idx / cols), q = idx % cols;
        if (view !== 'all' && cell > 6) { ctx.beginPath(); ctx.arc(ox + q * cell + cell / 2, oy + r * cell + cell / 2, cell * 0.4, 0, 7); ctx.fill(); }
        else ctx.fillRect(ox + q * cell, oy + r * cell, cell - gap, cell - gap);
      }
    });
  });
  function draw() {
    var c = counts(), pos = c.tp + c.fp, neg = c.fn + c.tn;
    var ppvX = sens * prev / (sens * prev + (1 - spec) * (1 - prev)), npvX = spec * (1 - prev) / (spec * (1 - prev) + (1 - sens) * prev);
    Sim.set('t-ppv', pos ? Sim.pct(c.tp / pos, 1) : '—');
    Sim.set('t-ppv-x', c.simulated ? 'Bayes’ theorem: ' + Sim.pct(ppvX, 1) + ' in the long run' : 'Bayes’ theorem: ' + Sim.fix(ppvX, 4));
    Sim.set('t-pos', Sim.int(pos)); Sim.set('t-pos-x', Sim.int(c.tp) + ' sick + ' + Sim.int(c.fp) + ' healthy');
    Sim.set('t-npv', neg ? Sim.pct(c.tn / neg, 2) : '—');
    var groups = view === 'all' ? GROUPS : GROUPS.slice(0, 2);
    Sim.html('legend', groups.map(function (gp) {
      return '<span><i style="display:inline-block;width:11px;height:11px;border-radius:3px;margin-right:6px;background:' + gp.col() + '"></i>' + gp.label + ': ' + Sim.int(c[gp.key]) + '</span>';
    }).join(''));
    Sim.html('table', '<tr><th></th><th>tests positive</th><th>tests negative</th><th>total</th></tr>' +
      '<tr><td>sick</td><td>' + Sim.int(c.tp) + '</td><td>' + Sim.int(c.fn) + '</td><td>' + Sim.int(c.tp + c.fn) + '</td></tr>' +
      '<tr><td>healthy</td><td>' + Sim.int(c.fp) + '</td><td>' + Sim.int(c.tn) + '</td><td>' + Sim.int(c.fp + c.tn) + '</td></tr>' +
      '<tr class="hl"><td>total</td><td>' + Sim.int(pos) + '</td><td>' + Sim.int(neg) + '</td><td>' + Sim.int(N) + '</td></tr>');
    Sim.set('mode-cap', c.simulated ? 'A randomly generated town: each person is sick with the chosen probability and then tested. Press again for another town.'
                                    : 'Expected counts in a town of 10,000 (rounded to whole people).');
    grid.resize();
  }
  Sim.bindRange('prev', 'prev-o', function (i) { return (100 * PREV[i]).toString().replace(/(\.\d*?)0+$/, '$1') + '%'; }, function (i) { prev = PREV[i]; town = null; draw(); });
  Sim.bindRange('sens', 'sens-o', function (v) { return v + '%'; }, function (v) { sens = v / 100; town = null; draw(); });
  Sim.bindRange('spec', 'spec-o', function (v) { return v + '%'; }, function (v) { spec = v / 100; town = null; draw(); });
  Sim.segmented('view', [{ value: 'all', label: 'Everyone (10,000)' }, { value: 'pos', label: 'Only the positive tests' }], 'all',
    function (v) { view = v; draw(); });
  document.getElementById('town').addEventListener('click', function () { town = simulateTown(); draw(); });
  document.getElementById('expected').addEventListener('click', function () { town = null; draw(); });
  draw();
})();
