(function () {
  /* ---------- the interactive game ---------- */
  var st, rec = { stay: [0, 0], sw: [0, 0] };
  var doorsEl = document.getElementById('doors');
  doorsEl.style.cssText = 'display:flex;gap:14px;flex-wrap:wrap;margin:8px 0 10px';
  function newGame() {
    st = { car: Sim.randInt(0, 2), pick: null, open: null, phase: 'pick', final: null };
    document.getElementById('choice').hidden = true;
    Sim.set('msg', 'Pick a door.'); drawDoors();
  }
  function drawDoors() {
    doorsEl.innerHTML = '';
    for (var d = 0; d < 3; d++) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'pick';
      var opened = (st.open === d) || st.phase === 'done';
      var inside = d === st.car ? 'CAR' : 'goat';
      b.style.cssText = 'width:110px;height:150px;border-radius:10px;font:inherit;font-weight:650;cursor:pointer;' +
        'border:2px solid ' + (d === st.pick ? 'var(--s1)' : 'var(--border)') + ';' +
        'background:' + (opened ? 'var(--surface-2)' : 'var(--s1-wash)') + ';color:var(--ink-1);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px';
      b.innerHTML = '<span style="font-size:0.8rem;color:var(--ink-2)">door ' + (d + 1) + '</span>' +
        '<span style="font-size:1.25rem' + (opened && d === st.car ? ';color:var(--s2)' : '') + '">' + (opened ? inside : '?') + '</span>' +
        (d === st.pick ? '<span style="font-size:0.75rem;color:var(--ink-2)">' + (st.phase === 'done' ? 'your final door' : 'your pick') + '</span>' : '');
      b.disabled = st.phase !== 'pick';
      (function (dd) { b.addEventListener('click', function () { choose(dd); }); })(d);
      doorsEl.appendChild(b);
    }
  }
  function choose(d) {
    st.pick = d;
    var others = [0, 1, 2].filter(function (x) { return x !== d && x !== st.car; });
    st.open = others[Math.floor(Math.random() * others.length)];
    st.phase = 'decide';
    var other = [0, 1, 2].filter(function (x) { return x !== d && x !== st.open; })[0];
    Sim.set('msg', 'Monty opens door ' + (st.open + 1) + ': a goat. Stay with door ' + (d + 1) + ' or switch to door ' + (other + 1) + '?');
    document.getElementById('choice').hidden = false; drawDoors();
  }
  function decide(sw) {
    if (st.phase !== 'decide') return;
    var other = [0, 1, 2].filter(function (x) { return x !== st.pick && x !== st.open; })[0];
    if (sw) st.pick = other;
    var win = st.pick === st.car; st.phase = 'done';
    var r = sw ? rec.sw : rec.stay; r[0]++; if (win) r[1]++;
    Sim.set('msg', (win ? 'You win the car!' : 'A goat. The car was behind door ' + (st.car + 1) + '.') + ' Press New game to play again.');
    document.getElementById('choice').hidden = true; drawDoors(); drawRecord();
  }
  function drawRecord() {
    function row(name, r, ex) { return '<tr><td>' + name + '</td><td>' + r[0] + '</td><td>' + r[1] + '</td><td>' + (r[0] ? Sim.pct(r[1] / r[0], 0) : '—') + '</td><td>' + ex + '</td></tr>'; }
    Sim.html('record', '<tr><th>your strategy</th><th>games</th><th>wins</th><th>win rate</th><th>in the long run</th></tr>' +
      row('stayed', rec.stay, '1/3') + row('switched', rec.sw, '2/3'));
  }
  document.getElementById('stay').addEventListener('click', function () { decide(false); });
  document.getElementById('switch').addEventListener('click', function () { decide(true); });
  document.getElementById('again').addEventListener('click', newGame);
  document.getElementById('clear').addEventListener('click', function () { rec = { stay: [0, 0], sw: [0, 0] }; drawRecord(); });
  newGame(); drawRecord();

  /* ---------- simulation ---------- */
  var n = 3, ign = false, g = 0, dropped = 0, stayW = 0, swW = 0, trS = new Sim.Trace(600), trW = new Sim.Trace(600), runner = new Sim.Runner();
  var chart = new Sim.LineChart('chart', { height: 300, xLabel: 'games that count', yMin: 0, yMax: 1, xLog: true, xMin: 1,
    tipX: function (x) { return 'after ' + Sim.int(x) + ' games'; }, tipY: function (v) { return Sim.fix(v, 3); } });
  function exact() { return ign ? [0.5, 0.5] : [1 / n, (n - 1) / n]; }
  function reset() { runner.cancel(); g = 0; dropped = 0; stayW = 0; swW = 0; trS = new Sim.Trace(600); trW = new Sim.Trace(600); draw(); }
  function draw() {
    var ex = exact();
    Sim.set('rules', ign ? 'Monty opens ' + (n - 2) + ' of the other doors at random. If the car is among them, the game is thrown away.'
                         : 'Monty opens ' + (n - 2) + ' of the other ' + (n - 1) + ' doors, always showing goats, and leaves one closed for you to switch to.');
    chart.o.xMax = Math.max(10, g);
    chart.set([{ name: 'stay', slot: 1, points: trS.points(g, g ? stayW / g : undefined).filter(function (p) { return p[1] !== undefined; }) },
               { name: 'switch', slot: 2, points: trW.points(g, g ? swW / g : undefined).filter(function (p) { return p[1] !== undefined; }) }],
              ign ? [{ y: 0.5, label: 'exact 1/2 for both' }] :
                    [{ y: ex[0], label: 'stay: exact 1/' + n, below: true }, { y: ex[1], label: 'switch: exact ' + (n - 1) + '/' + n }]);
    Sim.set('t-g', Sim.int(g)); Sim.set('t-drop', ign ? Sim.int(dropped) + ' thrown away (car revealed)' : '');
    Sim.set('t-stay', g ? Sim.fix(stayW / g, 3) : '—'); Sim.set('t-sw', g ? Sim.fix(swW / g, 3) : '—');
    Sim.set('t-stay-x', 'exact ' + (ign ? '1/2' : '1/' + n) + ' = ' + Sim.fix(ex[0], 3));
    Sim.set('t-sw-x', 'exact ' + (ign ? '1/2' : (n - 1) + '/' + n) + ' = ' + Sim.fix(ex[1], 3));
  }
  function game() {
    var car = Math.floor(Math.random() * n), pick = Math.floor(Math.random() * n), left;
    if (!ign) {
      if (pick !== car) left = car;
      else { left = Math.floor(Math.random() * (n - 1)); if (left >= pick) left++; }
    } else {
      left = Math.floor(Math.random() * (n - 1)); if (left >= pick) left++;
      if (car !== pick && car !== left) { dropped++; return; }        /* Monty revealed the car */
    }
    g++; if (pick === car) stayW++; if (left === car) swW++;
    trS.push(g, stayW / g); trW.push(g, swW / g);
  }
  Sim.$$('[data-games]').forEach(function (b) { b.addEventListener('click', function () {
    var k = +b.dataset.games; runner.run(k, game, draw, Sim.animated(k, 1.4)); }); });
  document.getElementById('reset').addEventListener('click', reset);
  document.getElementById('ignorant').addEventListener('change', function (e) { ign = e.target.checked; reset(); });
  Sim.bindRange('n', 'n-o', null, function (v) { n = v; reset(); });
  reset();
})();
