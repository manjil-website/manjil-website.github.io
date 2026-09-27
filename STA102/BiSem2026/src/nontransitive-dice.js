(function () {
  var FACES = { A: [4, 4, 4, 4, 0, 0], B: [3, 3, 3, 3, 3, 3], C: [6, 6, 2, 2, 2, 2], D: [5, 5, 5, 1, 1, 1] }, NAMES = ['A', 'B', 'C', 'D'];
  var BEATER = { A: 'D', B: 'A', C: 'B', D: 'C' };
  function pBeat(x, y) { var w = 0; FACES[x].forEach(function (a) { FACES[y].forEach(function (b) { if (a > b) w++; }); }); return w / 36; }
  var mine = null, g = 0, you = 0, tr = new Sim.Trace(500), runner = new Sim.Runner();
  var host = document.getElementById('dice');
  NAMES.forEach(function (d, k) {
    var b = document.createElement('button'); b.type = 'button'; b.className = 'pick'; b.dataset.die = d;
    b.style.cssText = 'text-align:left;padding:12px 14px;border-radius:10px;border:1px solid var(--border);background:var(--surface);color:var(--ink-1);font:inherit;cursor:pointer';
    b.innerHTML = '<div style="display:flex;align-items:center;gap:8px;font-weight:700;font-size:1.1rem"><span class="swatch" style="width:12px;height:12px;border-radius:3px;background:var(--s' + (k + 1) + ')"></span>Die ' + d +
      '</div><div class="mono" style="margin-top:6px;color:var(--ink-2)">' + FACES[d].join(' · ') + '</div><div class="caption" data-role style="margin-top:4px"></div>';
    b.addEventListener('click', function () { choose(d); });
    host.appendChild(b);
  });
  function face(d) { return FACES[d][Math.floor(Math.random() * 6)]; }
  function choose(d) {
    mine = d; runner.cancel(); g = 0; you = 0; tr = new Sim.Trace(500); Sim.html('last', '');
    Sim.$$('[data-die]').forEach(function (b) {
      var role = b.dataset.die === mine ? 'your die' : b.dataset.die === BEATER[mine] ? 'my die' : '';
      b.style.borderColor = role ? (role === 'your die' ? 'var(--s1)' : 'var(--s2)') : 'var(--border)';
      b.style.borderWidth = role ? '2px' : '1px'; b.querySelector('[data-role]').textContent = role;
    });
    Sim.set('msg', 'You picked die ' + mine + '. I pick die ' + BEATER[mine] + ', which beats it with probability ' + Math.round(36 * pBeat(BEATER[mine], mine)) + '/36 = 2/3.');
    Sim.$$('[data-roll]').forEach(function (b) { b.disabled = false; });
    draw();
  }
  var chart = new Sim.LineChart('chart', { height: 260, xLabel: 'games', yLabel: 'your win rate', yMin: 0, yMax: 1, xLog: true, xMin: 1,
    tipX: function (x) { return 'after ' + Sim.int(x) + ' games'; }, tipY: function (v) { return Sim.fix(v, 3); } });
  function one() { var a = face(mine), b = face(BEATER[mine]); g++; if (a > b) you++; tr.push(g, you / g); return [a, b]; }
  function draw() {
    chart.o.xMax = Math.max(10, g);
    chart.set([{ name: 'your win rate', slot: 1, points: tr.points(g, g ? you / g : undefined).filter(function (p) { return p[1] !== undefined; }) }], [{ y: 1 / 3, label: 'exact 1/3' }]);
    Sim.set('t-g', Sim.int(g)); Sim.set('t-you', g ? Sim.fix(you / g, 4) : '—'); Sim.set('t-me', g ? Sim.fix(1 - you / g, 4) : '—');
  }
  Sim.$$('[data-roll]').forEach(function (b) { b.addEventListener('click', function () {
    if (!mine) return; var k = +b.dataset.roll;
    if (k === 1) { var r = one(); Sim.html('last', '<span>You rolled <b>' + r[0] + '</b>, I rolled <b>' + r[1] + '</b>: ' + (r[0] > r[1] ? 'you win.' : 'I win.') + '</span>'); draw(); return; }
    runner.run(k, one, draw, Sim.animated(k, 1.2)); }); });
  document.getElementById('reset').addEventListener('click', function () { if (mine) choose(mine); });
  function matrix(sim) {
    var h = '<tr><th>row beats column</th>' + NAMES.map(function (c) { return '<th>' + c + '</th>'; }).join('') + '</tr>';
    NAMES.forEach(function (r) {
      h += '<tr><td><b>' + r + '</b></td>' + NAMES.map(function (c) {
        if (r === c) return '<td>—</td>';
        var e = pBeat(r, c), cell = Math.round(36 * e) + '/36' + (sim ? ' (sim ' + Sim.fix(sim[r + c], 3) + ')' : '');
        return '<td style="' + (e > 0.5 ? 'font-weight:700' : 'color:var(--ink-2)') + '">' + cell + '</td>';
      }).join('') + '</tr>';
    });
    Sim.html('matrix', h);
  }
  document.getElementById('all').addEventListener('click', function () {
    var sim = {}; NAMES.forEach(function (r) { NAMES.forEach(function (c) { if (r === c) return; var w = 0; for (var k = 0; k < 10000; k++) if (face(r) > face(c)) w++; sim[r + c] = w / 10000; }); });
    matrix(sim);
  });
  matrix(null); draw();
})();
