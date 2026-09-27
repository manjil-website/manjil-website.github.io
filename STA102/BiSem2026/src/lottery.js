(function () {
  var mine = [], runner = new Sim.Runner(), counts = new Array(7).fill(0), weeks = 0, jack = 0, best = -1;
  var C49 = Sim.choose(49, 6), EX = []; for (var k = 0; k <= 6; k++) EX.push(Sim.choose(6, k) * Sim.choose(43, 6 - k) / C49);
  var board = document.getElementById('board'), cells = [];
  for (var i = 1; i <= 49; i++) {
    var b = document.createElement('button'); b.type = 'button'; b.className = 'pick'; b.textContent = i;
    b.style.cssText = 'height:38px;border-radius:50%;border:1px solid var(--border);background:var(--surface);color:var(--ink-1);font:inherit;font-weight:600;cursor:pointer';
    (function (n) { b.addEventListener('click', function () { toggle(n); }); })(i);
    board.appendChild(b); cells.push(b);
  }
  function paint() {
    cells.forEach(function (b, i) { var on = mine.indexOf(i + 1) >= 0;
      b.style.background = on ? 'var(--s1)' : 'var(--surface)'; b.style.color = on ? '#fff' : 'var(--ink-1)'; b.setAttribute('aria-pressed', on); });
    Sim.set('pick-help', mine.length === 6 ? 'Your numbers: ' + mine.slice().sort(function (a, b) { return a - b; }).join(', ') + '.' : 'Choose ' + (6 - mine.length) + ' more number' + (6 - mine.length === 1 ? '' : 's') + ', or press Quick pick.');
    Sim.$$('#draw1,[data-weeks]').forEach(function (x) { x.disabled = mine.length !== 6; });
  }
  function toggle(n) { var at = mine.indexOf(n); if (at >= 0) mine.splice(at, 1); else if (mine.length < 6) mine.push(n); reset(); paint(); }
  function quick() { mine = Sim.shuffle(Sim.range(49).map(function (x) { return x + 1; })).slice(0, 6); reset(); paint(); }
  var pool = Sim.range(49).map(function (x) { return x + 1; });
  function drawSix() { for (var i = 0; i < 6; i++) { var j = i + Math.floor(Math.random() * (49 - i)); var t = pool[i]; pool[i] = pool[j]; pool[j] = t; } return pool.slice(0, 6); }
  var mineSet = new Uint8Array(50);
  function week() {
    var d = drawSix(), m = 0; for (var i = 0; i < 6; i++) if (mineSet[d[i]]) m++;
    counts[m]++; weeks++; if (m === 6) jack++; if (m > best) best = m; return { d: d, m: m };
  }
  var chart = new Sim.BarChart('chart', { height: 260, xLabel: 'numbers matched', yLabel: 'fraction of weeks', table: false,
    valFmt: function (v) { return Sim.prob(v); } });
  function draw() {
    chart.set({ categories: [0, 1, 2, 3, 4, 5, 6], series: [{ name: 'simulated', slot: 1, values: counts.map(function (c) { return weeks ? c / weeks : 0; }) }],
                exact: { name: 'exact', values: EX } });
    Sim.set('t-w', Sim.int(weeks)); Sim.set('t-y', weeks ? '≈ ' + Sim.int(weeks / 52) + ' years of weekly play' : '');
    Sim.set('t-best', best < 0 ? '—' : best + ' of 6'); Sim.set('t-jack', Sim.int(jack));
    var rows = '<tr><th>matched</th><th>weeks</th><th>simulated</th><th>exact</th><th>exact odds</th></tr>';
    for (var k = 0; k <= 6; k++) rows += '<tr><td>' + k + '</td><td>' + Sim.int(counts[k]) + '</td><td>' + (weeks ? Sim.prob(counts[k] / weeks) : '—') + '</td><td>' + Sim.prob(EX[k]) + '</td><td>' + Sim.oneIn(EX[k]) + '</td></tr>';
    Sim.html('table', rows);
  }
  function reset() { runner.cancel(); counts = new Array(7).fill(0); weeks = 0; jack = 0; best = -1; mineSet = new Uint8Array(50); mine.forEach(function (n) { mineSet[n] = 1; }); Sim.html('last', ''); draw(); }
  document.getElementById('draw1').addEventListener('click', function () {
    var r = week();
    Sim.html('last', r.d.slice().sort(function (a, b) { return a - b; }).map(function (x) { return '<span class="' + (mineSet[x] ? 'kept fav' : '') + '">' + x + '</span>'; }).join('') +
      '<span style="border:0">&rarr; ' + r.m + ' matched</span>');
    draw();
  });
  Sim.$$('[data-weeks]').forEach(function (b) { b.addEventListener('click', function () { var k = +b.dataset.weeks; runner.run(k, week, draw, Sim.animated(k, 1.4)); }); });
  document.getElementById('reset').addEventListener('click', reset);
  document.getElementById('quick').addEventListener('click', quick);
  document.getElementById('clear').addEventListener('click', function () { mine = []; reset(); paint(); });
  quick();
})();
