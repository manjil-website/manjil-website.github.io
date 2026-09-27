(function () {
  var k = 23, tallies = {}, last = null, runner = new Sim.Runner();
  var DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31], MON = 'JFMAMJJASOND';
  function pAny(n) { var q = 1; for (var i = 0; i < n; i++) q *= (365 - i) / 365; return 1 - q; }
  function pYou(n) { return 1 - Math.pow(364 / 365, n - 1); }
  function room(n) { var b = new Array(n); for (var i = 0; i < n; i++) b[i] = Math.floor(Math.random() * 365); return b; }
  function evalRoom(b) {
    var seen = new Uint8Array(365), any = false, you = false;
    for (var i = 0; i < b.length; i++) { if (seen[b[i]]) any = true; seen[b[i]]++; if (i > 0 && b[i] === b[0]) you = true; }
    return { any: any, you: you };
  }
  var cal = new Sim.Canvas('cal', function (w) { return Math.max(250, Math.min(360, w * 0.58)); }, function (ctx, w, h) {
    ctx.clearRect(0, 0, w, h); ctx.fillStyle = Sim.css('--surface'); ctx.fillRect(0, 0, w, h);
    var lab = 18, cw = (w - lab - 12) / 31, ch = (h - 16) / 12, cnt = new Array(365).fill(0);
    if (last) last.forEach(function (d) { cnt[d]++; });
    var day = 0;
    ctx.font = '11px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (var m = 0; m < 12; m++) {
      ctx.fillStyle = Sim.css('--ink-3'); ctx.fillText(MON[m], 9, 8 + m * ch + ch / 2);
      for (var d = 0; d < 31; d++) {
        var x = lab + d * cw + 1, y = 8 + m * ch + 1, ww = cw - 2, hh = ch - 2;
        if (d >= DAYS[m]) continue;
        var c = cnt[day];
        ctx.fillStyle = c >= 2 ? Sim.slot(2) : c === 1 ? Sim.slot(1) : Sim.css('--surface-2');
        ctx.fillRect(x, y, ww, hh);
        if (last && day === last[0]) { ctx.strokeStyle = Sim.css('--ink-1'); ctx.lineWidth = 2; ctx.strokeRect(x + 1, y + 1, ww - 2, hh - 2); }
        if (c >= 2 && ww > 10) { ctx.fillStyle = '#fff'; ctx.fillText(String(c), x + ww / 2, y + hh / 2 + 0.5); }
        day++;
      }
    }
  });
  var chart = new Sim.LineChart('chart', { height: 340, xLabel: 'people in the room', yMin: 0, yMax: 1, xMin: 0, xMax: 100,
    tipX: function (x) { return x + ' people'; }, tipY: function (v) { return Sim.fix(v, 3); }, title: 'Exact probabilities, with your simulations' });
  function draw() {
    var a = [], y = []; for (var n = 1; n <= 100; n++) { a.push([n, pAny(n)]); y.push([n, pYou(n)]); }
    var sa = [], sy = [];
    Object.keys(tallies).forEach(function (n) { var t = tallies[n]; if (t.rooms) { sa.push([+n, t.any / t.rooms]); sy.push([+n, t.you / t.rooms]); } });
    chart.set([{ name: 'some two people share (exact)', slot: 1, points: a },
               { name: 'someone shares person 1’s (exact)', slot: 2, points: y },
               { name: 'simulated (two share)', slot: 1, markers: true, points: sa },
               { name: 'simulated (person 1)', slot: 2, markers: true, points: sy }], [{ y: 0.5, label: '1/2' }]);
    var t = tallies[k] || { rooms: 0, any: 0, you: 0 };
    Sim.set('t-rooms', Sim.int(t.rooms));
    Sim.set('t-any', t.rooms ? Sim.fix(t.any / t.rooms, 3) : '—'); Sim.set('t-any-x', 'exact ' + Sim.fix(pAny(k), 4));
    Sim.set('t-you', t.rooms ? Sim.fix(t.you / t.rooms, 3) : '—'); Sim.set('t-you-x', 'exact 1 − (364/365)' + Sim.sup(k - 1) + ' = ' + Sim.fix(pYou(k), 4));
    cal.redraw();
  }
  function tally(res) { var t = tallies[k] || (tallies[k] = { rooms: 0, any: 0, you: 0 }); t.rooms++; if (res.any) t.any++; if (res.you) t.you++; }
  document.getElementById('one').addEventListener('click', function () {
    last = room(k); var r = evalRoom(last); tally(r);
    var shared = {}; last.forEach(function (d) { shared[d] = (shared[d] || 0) + 1; });
    var nShared = Object.keys(shared).filter(function (d) { return shared[d] >= 2; }).length;
    Sim.set('cal-cap', r.any ? nShared + (nShared === 1 ? ' day is' : ' days are') + ' shared (orange). Person 1’s birthday is outlined'
      + (r.you ? ' — and somebody shares it.' : '; nobody shares it.') : 'No shared birthdays in this room. Person 1’s birthday is outlined.');
    draw();
  });
  Sim.$$('[data-rooms]').forEach(function (b) { b.addEventListener('click', function () {
    var n = +b.dataset.rooms;
    runner.run(n, function () { tally(evalRoom(room(k))); }, draw, Sim.animated(n, 1.2));
  }); });
  document.getElementById('reset').addEventListener('click', function () { runner.cancel(); tallies = {}; last = null; Sim.set('cal-cap', 'Press Fill one room to see where the birthdays fall.'); draw(); });
  Sim.bindRange('k', 'k-o', null, function (v) { k = v; runner.cancel(); last = null; draw(); });
  draw();
})();
