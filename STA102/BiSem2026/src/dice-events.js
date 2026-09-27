(function () {
  var EVENTS = [
    { id: 'sum7', label: 'the sum is 7', f: function (i, j) { return i + j === 7; } },
    { id: 'sum6', label: 'the sum is 6', f: function (i, j) { return i + j === 6; } },
    { id: 'sum8', label: 'the sum is 8', f: function (i, j) { return i + j === 8; } },
    { id: 'sum10', label: 'the sum is at least 10', f: function (i, j) { return i + j >= 10; } },
    { id: 'even', label: 'the sum is even', f: function (i, j) { return (i + j) % 2 === 0; } },
    { id: 'first-even', label: 'the first die is even', f: function (i) { return i % 2 === 0; } },
    { id: 'second-even', label: 'the second die is even', f: function (i, j) { return j % 2 === 0; } },
    { id: 'first3', label: 'the first die is 3', f: function (i) { return i === 3; } },
    { id: 'double', label: 'a double', f: function (i, j) { return i === j; } },
    { id: 'six', label: 'at least one six', f: function (i, j) { return i === 6 || j === 6; } },
    { id: 'noone', label: 'no die shows a 1', f: function (i, j) { return i !== 1 && j !== 1; } },
    { id: 'bigger', label: 'the first die is bigger', f: function (i, j) { return i > j; } }
  ];
  var OPS = [
    { v: 'A', l: 'A' }, { v: 'B', l: 'B' }, { v: 'U', l: 'A ∪ B' }, { v: 'I', l: 'A ∩ B' },
    { v: 'Ac', l: 'Aᶜ' }, { v: 'AmB', l: 'A \\ B' }, { v: 'X', l: 'A △ B' }, { v: 'G', l: 'A given B' }
  ];
  var A = EVENTS[0], B = EVENTS[5], op = 'U', rolls = new Array(49).fill(0), nRolls = 0, runner = new Sim.Runner();
  ['A', 'B'].forEach(function (id) {
    var s = document.getElementById(id);
    EVENTS.forEach(function (e) { var o = document.createElement('option'); o.value = e.id; o.textContent = e.label; s.appendChild(o); });
    s.value = id === 'A' ? A.id : B.id;
    s.addEventListener('change', function () { var e = EVENTS.filter(function (x) { return x.id === s.value; })[0]; if (id === 'A') A = e; else B = e; draw(); });
  });
  Sim.segmented('op', OPS.map(function (o) { return { value: o.v, label: o.l }; }), op, function (v) { op = v; draw(); });
  function inSet(i, j) {
    var a = A.f(i, j), b = B.f(i, j);
    switch (op) {
      case 'A': return a; case 'B': return b; case 'U': return a || b; case 'I': return a && b;
      case 'Ac': return !a; case 'AmB': return a && !b; case 'X': return a !== b; case 'G': return a && b;
    }
  }
  var grid = new Sim.Canvas('grid', function (w) { return Math.min(w + 20, 450); }, function (ctx, w, h) {
    ctx.clearRect(0, 0, w, h); ctx.fillStyle = Sim.css('--surface'); ctx.fillRect(0, 0, w, h);
    var padT = 40, padL = 44, s = Math.min(w - padL - 8, h - padT - 8), cell = s / 6, ox = padL + (w - padL - 8 - s) / 2, oy = padT;
    ctx.font = '12px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = Sim.css('--ink-3');
    for (var k = 1; k <= 6; k++) { ctx.fillText(String(k), ox + (k - 0.5) * cell, oy - 12); ctx.fillText(String(k), ox - 12, oy + (k - 0.5) * cell); }
    for (var i = 1; i <= 6; i++) for (var j = 1; j <= 6; j++) {
      var x = ox + (i - 1) * cell + 2, y = oy + (j - 1) * cell + 2, cw = cell - 4;
      var given = op === 'G', outB = given && !B.f(i, j), on = inSet(i, j);
      ctx.fillStyle = on ? Sim.slot(1) : (given && !outB ? Sim.css('--s1-wash') : Sim.css('--surface-2'));
      ctx.globalAlpha = outB ? 0.35 : 1;
      ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, cw, cw, 5) : ctx.rect(x, y, cw, cw); ctx.fill();
      ctx.globalAlpha = 1;
      if (given && !outB) { ctx.strokeStyle = Sim.slot(1); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x + 0.75, y + 0.75, cw - 1.5, cw - 1.5, 5) : ctx.rect(x, y, cw, cw); ctx.stroke(); }
      ctx.fillStyle = on ? '#ffffff' : (outB ? Sim.css('--ink-3') : Sim.css('--ink-2'));
      ctx.font = (cell > 50 ? 12 : 10) + 'px system-ui, sans-serif';
      ctx.fillText('(' + i + ',' + j + ')', x + cw / 2, y + cw / 2 - (nRolls ? 7 : 0));
      if (nRolls) { ctx.font = '10px system-ui, sans-serif'; ctx.fillText(String(rolls[i * 7 + j]), x + cw / 2, y + cw / 2 + 9); }
    }
    ctx.fillStyle = Sim.css('--ink-2'); ctx.font = '11px system-ui, sans-serif';
    ctx.fillText('first die →', ox + s / 2, 11);
    ctx.save(); ctx.translate(ox - 32, oy + s / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('← second die', 0, 0); ctx.restore();
  });
  function count(f) { var c = 0; for (var i = 1; i <= 6; i++) for (var j = 1; j <= 6; j++) if (f(i, j)) c++; return c; }
  function draw() {
    var a = count(A.f), b = count(B.f), ab = count(function (i, j) { return A.f(i, j) && B.f(i, j); }), aub = count(function (i, j) { return A.f(i, j) || B.f(i, j); });
    Sim.set('t-a', a); Sim.set('t-b', b); Sim.set('t-ab', ab); Sim.set('t-aub', aub);
    Sim.html('ie', 'Inclusion&ndash;exclusion: |A| + |B| &minus; |A &cap; B| = ' + a + ' + ' + b + ' &minus; ' + ab + ' = <b>' + (a + b - ab) + '</b> = |A &cup; B| &#10003;' +
      (ab === 0 ? '<br>A and B are <b>mutually exclusive</b> (A &cap; B is empty).' : ''));
    var lbl = OPS.filter(function (o) { return o.v === op; })[0].l, selN = count(inSet), simHits = 0, simDen = 0;
    for (var i = 1; i <= 6; i++) for (var j = 1; j <= 6; j++) { if (inSet(i, j)) simHits += rolls[i * 7 + j]; if (op !== 'G' || B.f(i, j)) simDen += rolls[i * 7 + j]; }
    if (op === 'G') {
      Sim.set('t-set-l', 'P(A | B) = |A ∩ B| / |B|'); Sim.set('t-set', b ? ab + '/' + b + ' = ' + Sim.fix(ab / b, 4) : 'undefined (B is empty)');
      Sim.set('t-set-x', 'compare P(A) = ' + a + '/36 = ' + Sim.fix(a / 36, 4));
      Sim.set('t-sim-x', simDen ? 'among the ' + Sim.int(simDen) + ' rolls where B happened' : 'no rolls yet');
    } else {
      Sim.set('t-set-l', 'P(' + lbl + ')'); Sim.set('t-set', selN + '/36 = ' + Sim.fix(selN / 36, 4)); Sim.set('t-set-x', 'equally likely outcomes: count and divide');
      Sim.set('t-sim-x', nRolls ? 'over ' + Sim.int(nRolls) + ' rolls' : 'no rolls yet');
    }
    Sim.set('t-sim', simDen ? Sim.fix(simHits / simDen, 4) : '—');
    var desc = { A: 'A: ' + A.label, B: 'B: ' + B.label, U: 'A ∪ B: ' + A.label + ', or ' + B.label + ' (or both)', I: 'A ∩ B: ' + A.label + ' and ' + B.label,
                 Ac: 'Aᶜ: it is not true that ' + A.label, AmB: 'A \\ B: ' + A.label + ' but not ' + B.label, X: 'A △ B: exactly one of the two',
                 G: 'Only the ' + b + ' outlined squares (where ' + B.label + ') are still possible; the filled ones are also in A.' };
    Sim.set('cap', desc[op] + (nRolls ? '  Small numbers: how many of your rolls landed on each square.' : ''));
    grid.redraw();
  }
  Sim.$$('[data-roll]').forEach(function (b) { b.addEventListener('click', function () {
    var k = +b.dataset.roll; runner.run(k, function () { rolls[Sim.die() * 7 + Sim.die()]++; nRolls++; }, draw, Sim.animated(k, 1)); }); });
  document.getElementById('reset').addEventListener('click', function () { runner.cancel(); rolls = new Array(49).fill(0); nRolls = 0; draw(); });
  draw();
})();
