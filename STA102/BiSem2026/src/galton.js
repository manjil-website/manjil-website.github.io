(function () {
  /* ---------------- Galton board ---------------- */
  var R = 10, P = 0.5, bins = [], balls = [], landed = 0, pending = 0, raf = 0, sumBins = 0;
  function expected(k) { return landed * Sim.choose(R, k) * Math.pow(P, k) * Math.pow(1 - P, R - k); }
  function resetBoard() { bins = new Array(R + 1).fill(0); balls = []; landed = 0; pending = 0; sumBins = 0; board.redraw(); tiles(); }
  function geom(w, h) {
    var dx = Math.min(44, (w - 40) / (R + 1)), top = 26, dy = Math.min(dx * 0.9, (h * 0.5) / R);
    return { dx: dx, dy: dy, top: top, cx: w / 2, binTop: top + R * dy + 16, binBottom: h - 22 };
  }
  var board = new Sim.Canvas('board', function (w) { return Math.max(360, Math.min(520, w * 0.62)); }, function (ctx, w, h) {
    var g = geom(w, h);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = Sim.css('--surface'); ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = Sim.css('--ink-3');
    for (var r = 0; r < R; r++) for (var k = 0; k <= r; k++) {
      ctx.beginPath(); ctx.arc(g.cx + (k - r / 2) * g.dx, g.top + r * g.dy, Math.max(2, g.dx * 0.08), 0, 7); ctx.fill();
    }
    /* bins */
    var maxC = 1; for (var j = 0; j <= R; j++) maxC = Math.max(maxC, bins[j], expected(j));
    var H = g.binBottom - g.binTop, bw = Math.min(24, g.dx * 0.62);
    ctx.strokeStyle = Sim.css('--axis'); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(g.cx - (R / 2 + 0.6) * g.dx, g.binBottom + 0.5); ctx.lineTo(g.cx + (R / 2 + 0.6) * g.dx, g.binBottom + 0.5); ctx.stroke();
    ctx.fillStyle = Sim.slot(1);
    for (j = 0; j <= R; j++) {
      var x = g.cx + (j - R / 2) * g.dx, hh = bins[j] / maxC * H;
      if (hh > 0) { roundTop(ctx, x - bw / 2, g.binBottom - hh, bw, hh, Math.min(4, bw / 2, hh)); }
    }
    if (landed > 0) {
      ctx.strokeStyle = Sim.css('--ink-2'); ctx.lineWidth = 1.25; ctx.beginPath();
      for (j = 0; j <= R; j++) { var ex = g.cx + (j - R / 2) * g.dx, ey = g.binBottom - expected(j) / maxC * H; if (j) ctx.lineTo(ex, ey); else ctx.moveTo(ex, ey); }
      ctx.stroke();
      for (j = 0; j <= R; j++) {
        var ex2 = g.cx + (j - R / 2) * g.dx, ey2 = g.binBottom - expected(j) / maxC * H;
        ctx.fillStyle = Sim.css('--surface'); ctx.beginPath(); ctx.arc(ex2, ey2, 5, 0, 7); ctx.fill();
        ctx.fillStyle = Sim.css('--ink-1'); ctx.beginPath(); ctx.arc(ex2, ey2, 3.5, 0, 7); ctx.fill();
      }
    }
    ctx.fillStyle = Sim.css('--ink-3'); ctx.font = '11px system-ui, sans-serif'; ctx.textAlign = 'center';
    for (j = 0; j <= R; j++) ctx.fillText(String(j), g.cx + (j - R / 2) * g.dx, g.binBottom + 15);
    /* balls in flight */
    ctx.fillStyle = Sim.slot(2);
    balls.forEach(function (b) { var q = ballPos(b, g); ctx.beginPath(); ctx.arc(q[0], q[1], Math.max(3, g.dx * 0.13), 0, 7); ctx.fill(); });
  });
  function roundTop(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h); ctx.closePath(); ctx.fill();
  }
  function ballPos(b, g) {
    var t = Math.min(b.t, R), r = Math.floor(t), f = t - r;
    var right = 0; for (var i = 0; i < r && i < R; i++) right += b.path[i];
    var x0 = g.cx + (right - r / 2) * g.dx, y0 = g.top + r * g.dy - g.dy * 0.35;
    if (b.t >= R) {                                  /* falling into the bin */
      var fall = Math.min(1, (b.t - R) / 1.2);
      return [x0, y0 + fall * (g.binBottom - y0 - 6)];
    }
    var step = b.path[r] ? 1 : 0;
    var x1 = g.cx + (right + step - (r + 1) / 2) * g.dx, y1 = g.top + (r + 1) * g.dy - g.dy * 0.35;
    return [x0 + (x1 - x0) * f, y0 + (y1 - y0) * f - Math.sin(Math.PI * f) * g.dy * 0.35];
  }
  function newBall() { var path = []; for (var i = 0; i < R; i++) path.push(Math.random() < P ? 1 : 0); return { path: path, t: 0 }; }
  var last = 0;
  function tick(ts) {
    var dt = last ? Math.min(0.05, (ts - last) / 1000) : 0.016; last = ts;
    var spawn = Math.min(pending, Math.max(1, Math.ceil(pending / 40)));
    for (var s = 0; s < spawn; s++) balls.push(newBall());
    pending -= spawn;
    var speed = 9;                                    /* rows per second */
    balls.forEach(function (b) { b.t += speed * dt; });
    balls = balls.filter(function (b) {
      if (b.t >= R + 1.2) { var k = b.path.reduce(function (a, c) { return a + c; }, 0); bins[k]++; landed++; sumBins += k; return false; }
      return true;
    });
    board.redraw(); tiles();
    if (balls.length || pending) raf = requestAnimationFrame(tick); else { raf = 0; last = 0; }
  }
  function drop(k) { pending += k; if (!raf) { last = 0; raf = requestAnimationFrame(tick); } }
  function instant(k) {
    for (var i = 0; i < k; i++) { var c = 0; for (var r = 0; r < R; r++) if (Math.random() < P) c++; bins[c]++; landed++; sumBins += c; }
    board.redraw(); tiles();
  }
  function tiles() {
    Sim.set('g-n', Sim.int(landed));
    Sim.set('g-mean', landed ? Sim.fix(sumBins / landed, 3) : '—');
    Sim.set('g-mean-x', 'exact R·p = ' + Sim.fix(R * P, 2));
    var mx = -1, arg = '—'; bins.forEach(function (c, j) { if (c > mx && c > 0) { mx = c; arg = String(j); } });
    Sim.set('g-mode', arg);
    var rows = '<table class="data"><tr><th>bin</th><th>balls</th><th>expected</th></tr>';
    for (var j = 0; j <= R; j++) rows += '<tr><td>' + j + '</td><td>' + Sim.int(bins[j]) + '</td><td>' + Sim.fix(expected(j), 1) + '</td></tr>';
    Sim.html('g-table', rows + '</table>');
  }
  Sim.bindRange('rows', 'rows-o', null, function (v) { R = v; resetBoard(); });
  Sim.bindRange('p', 'p-o', function (v) { return v.toFixed(2); }, function (v) { P = v; resetBoard(); });
  Sim.$$('[data-drop]').forEach(function (b) { b.addEventListener('click', function () { drop(+b.dataset.drop); }); });
  document.getElementById('instant').addEventListener('click', function () { instant(10000); });
  document.getElementById('g-reset').addEventListener('click', function () { resetBoard(); });
  resetBoard();

  /* ---------------- averages of dice ---------------- */
  var nd = 2, counts = [], rolls = 0, s1 = 0, s2 = 0, runner = new Sim.Runner();
  var dchart = new Sim.BarChart('dchart', { height: 280, xLabel: 'average of the dice', yLabel: 'fraction of rolls',
    valFmt: function (v) { return Sim.fix(v, 4); },
    catLabel: function (c) { return (c / nd).toFixed(nd > 1 ? 2 : 0).replace(/\.?0+$/, ''); },
    labelEvery: function (c) { return c % nd === 0; } });
  function exactDist(n) {                          /* distribution of the sum of n dice */
    var d = [1];
    for (var k = 0; k < n; k++) { var e = new Array(d.length + 6).fill(0); d.forEach(function (p, s) { for (var f = 1; f <= 6; f++) e[s + f] += p / 6; }); d = e; }
    return d;                                       /* index = sum */
  }
  function resetDice() { runner.cancel(); counts = new Array(6 * nd + 1).fill(0); rolls = 0; s1 = 0; s2 = 0; drawDice(); }
  function drawDice() {
    var ex = exactDist(nd), cats = [], sim = [], exv = [];
    for (var s = nd; s <= 6 * nd; s++) { cats.push(s); sim.push(rolls ? counts[s] / rolls : 0); exv.push(ex[s]); }
    dchart.set({ categories: cats, series: [{ name: 'simulated', values: sim, slot: 1 }], exact: { name: 'exact', values: exv } });
    Sim.set('d-n', Sim.int(rolls));
    Sim.set('d-mean', rolls ? Sim.fix(s1 / rolls, 3) : '—');
    var v = rolls > 1 ? (s2 - s1 * s1 / rolls) / (rolls - 1) : NaN;
    Sim.set('d-sd', rolls > 1 ? Sim.fix(Math.sqrt(v), 3) : '—');
    Sim.set('d-sd-x', 'exact √(35/12)/√n = ' + Sim.fix(Math.sqrt(35 / 12 / nd), 3));
  }
  function roll(k) {
    runner.run(k, function () {
      var s = 0; for (var i = 0; i < nd; i++) s += 1 + Math.floor(Math.random() * 6);
      counts[s]++; rolls++; var a = s / nd; s1 += a; s2 += a * a;
    }, drawDice, Sim.animated(k, 1.2));
  }
  Sim.bindRange('nd', 'nd-o', null, function (v) { nd = v; resetDice(); });
  Sim.$$('[data-roll]').forEach(function (b) { b.addEventListener('click', function () { roll(+b.dataset.roll); }); });
  document.getElementById('d-reset').addEventListener('click', resetDice);
  resetDice();
})();
