(function () {
  function coin() { return Math.random() < 0.5 ? 'H' : 'T'; }
  var EXPS = [
    { id: 'dice', title: 'Peek at one die',
      intro: 'Two dice are rolled. A friend peeks and tells you the first die shows a 3. What is the chance that the total is 8?',
      sample: function () { return [Sim.die(), Sim.die()]; },
      show: function (o) { return '(' + o[0] + ',' + o[1] + ')'; },
      event: { label: 'the total is 8', f: function (o) { return o[0] + o[1] === 8; }, exact: 5 / 36, exactTxt: '5/36' },
      infos: [{ label: 'the first die shows 3', f: function (o) { return o[0] === 3; }, exact: 1 / 6, exactTxt: '1/6' }] },
    { id: 'coins', title: 'Two coin tosses, two pieces of news',
      intro: 'A fair coin is tossed twice. What is the chance of two heads, given each piece of news?',
      sample: function () { return coin() + coin(); },
      show: function (o) { return o; },
      event: { label: 'both tosses are heads', f: function (o) { return o === 'HH'; }, exact: 1 / 4, exactTxt: '1/4' },
      infos: [{ label: 'the first toss was heads', f: function (o) { return o[0] === 'H'; }, exact: 1 / 2, exactTxt: '1/2' },
              { label: 'at least one toss was heads', f: function (o) { return o.indexOf('H') >= 0; }, exact: 1 / 3, exactTxt: '1/3' }] },
    { id: 'kids', title: 'Two children',
      intro: 'A family has two children (elder first), each equally likely to be a girl or a boy. What is the chance both are girls?',
      sample: function () { return (Math.random() < 0.5 ? 'G' : 'B') + (Math.random() < 0.5 ? 'G' : 'B'); },
      show: function (o) { return o; },
      event: { label: 'both are girls', f: function (o) { return o === 'GG'; }, exact: 1 / 4, exactTxt: '1/4' },
      infos: [{ label: 'at least one is a girl', f: function (o) { return o.indexOf('G') >= 0; }, exact: 1 / 3, exactTxt: '1/3' },
              { label: 'the elder is a girl', f: function (o) { return o[0] === 'G'; }, exact: 1 / 2, exactTxt: '1/2' }] },
    { id: 'box', title: "Bertrand's box",
      intro: 'Three boxes: gold&ndash;gold, silver&ndash;silver, gold&ndash;silver. Pick a box at random and pull out one of its two coins at random. It is gold. What is the chance the other coin in that box is gold too?',
      sample: function () { var b = ['GG', 'SS', 'GS'][Math.floor(Math.random() * 3)], i = Math.random() < 0.5 ? 0 : 1; return { box: b, drawn: b[i], other: b[1 - i] }; },
      show: function (o) { return o.box + ':' + (o.drawn === 'G' ? 'gold' : 'silver'); },
      event: { label: 'the other coin is gold', f: function (o) { return o.other === 'G'; }, exact: 1 / 2, exactTxt: '1/2' },
      infos: [{ label: 'the coin you drew is gold', f: function (o) { return o.drawn === 'G'; }, exact: 2 / 3, exactTxt: '2/3' }],
      extra: true }
  ];
  var host = document.getElementById('experiments');
  EXPS.forEach(function (E) {
    var sec = document.createElement('section'); sec.className = 'panel';
    sec.innerHTML = '<h2>' + E.title + '</h2><p class="intro">' + E.intro + '</p>' +
      '<div class="controls">' + (E.infos.length > 1 ? '<div id="' + E.id + '-news"></div>' : '<span class="pill">Information: ' + E.infos[0].label + '</span>') + '</div>' +
      '<div class="controls"><div class="group">' +
      '<button class="btn" type="button" data-n="1">Run once</button><button class="btn" type="button" data-n="100">Run 100 times</button>' +
      '<button class="btn" type="button" data-n="10000">Run 10,000</button><button class="btn ghost" type="button" data-reset>Reset</button></div></div>' +
      '<div class="log" id="' + E.id + '-log" aria-live="polite"></div>' +
      '<p class="caption" style="margin-top:0">Struck out: runs where the information is false (thrown away). Outlined: kept, and ' + E.event.label + '.</p>' +
      '<div class="tiles">' +
      '<div class="tile"><div class="tile-label">Runs</div><div class="tile-value" data-t="runs">0</div></div>' +
      '<div class="tile"><div class="tile-label">Kept (information true)</div><div class="tile-value" data-t="kept">0</div></div>' +
      '<div class="tile key"><div class="tile-label">P(' + E.event.label + ' | <span data-t="info"></span>)</div><div class="tile-value" data-t="cond">&mdash;</div><div class="tile-sub" data-t="condx"></div></div>' +
      '<div class="tile"><div class="tile-label">Without the information: P(' + E.event.label + ')</div><div class="tile-value" data-t="unc">&mdash;</div><div class="tile-sub">exact ' + E.event.exactTxt + ' = ' + Sim.fix(E.event.exact, 4) + '</div></div>' +
      '</div>' + (E.extra ? '<div class="table-wrap"><table class="data" id="box-table"></table></div>' : '');
    host.appendChild(sec);
    var state = { info: 0 }, runner = new Sim.Runner();
    function reset() { runner.cancel(); state.runs = 0; state.kept = 0; state.fav = 0; state.ev = 0; state.log = []; state.src = { GG: 0, SS: 0, GS: 0 }; draw(); }
    function run1(record) {
      var o = E.sample(), I = E.infos[state.info], kept = I.f(o), fav = E.event.f(o);
      state.runs++; if (fav) state.ev++;
      if (kept) { state.kept++; if (fav) state.fav++; if (E.extra) state.src[o.box]++; }
      if (record) { state.log.push({ t: E.show(o), kept: kept, fav: kept && fav }); if (state.log.length > 18) state.log.shift(); }
    }
    function draw() {
      var I = E.infos[state.info], q = function (a) { return sec.querySelector('[data-t="' + a + '"]'); };
      q('runs').textContent = Sim.int(state.runs); q('kept').textContent = Sim.int(state.kept);
      q('info').textContent = I.label;
      q('cond').textContent = state.kept ? Sim.fix(state.fav / state.kept, 4) : '—';
      q('condx').textContent = 'exact ' + I.exactTxt + ' = ' + Sim.fix(I.exact, 4) + (state.kept ? '  (' + Sim.int(state.fav) + ' of ' + Sim.int(state.kept) + ' kept runs)' : '');
      q('unc').textContent = state.runs ? Sim.fix(state.ev / state.runs, 4) : '—';
      document.getElementById(E.id + '-log').innerHTML = state.log.map(function (l) {
        return '<span class="' + (l.kept ? 'kept' + (l.fav ? ' fav' : '') : 'drop') + '">' + l.t + '</span>'; }).join('');
      if (E.extra) {
        var tot = state.src.GG + state.src.GS;
        document.getElementById('box-table').innerHTML = '<tr><th>box the gold coin came from</th><th>times</th><th>share</th><th>exact</th></tr>' +
          '<tr><td>gold&ndash;gold</td><td>' + Sim.int(state.src.GG) + '</td><td>' + (tot ? Sim.fix(state.src.GG / tot, 3) : '—') + '</td><td>2/3</td></tr>' +
          '<tr><td>gold&ndash;silver</td><td>' + Sim.int(state.src.GS) + '</td><td>' + (tot ? Sim.fix(state.src.GS / tot, 3) : '—') + '</td><td>1/3</td></tr>';
      }
    }
    if (E.infos.length > 1) Sim.segmented(E.id + '-news', E.infos.map(function (I, k) { return { value: k, label: 'News: ' + I.label }; }), 0,
      function (v) { state.info = v; reset(); });
    Sim.$$('[data-n]', sec).forEach(function (b) { b.addEventListener('click', function () {
      var k = +b.dataset.n; if (k === 1) { run1(true); draw(); return; }
      runner.run(k, function (i) { run1(i >= k - 18); }, draw, Sim.animated(k, 1)); }); });
    sec.querySelector('[data-reset]').addEventListener('click', reset);
    reset();
  });
})();
