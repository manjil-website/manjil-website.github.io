(function () {
  var S = { A: [81 / 87, 192 / 263], B: [234 / 270, 55 / 80] };
  var chart = new Sim.BarChart('chart', { height: 280, yLabel: 'success rate', yMax: 1, valFmt: function (v) { return Sim.pct(v, 1); },
    yFmt: function (v) { return Math.round(v * 100) + '%'; } });
  function draw() {
    var wa = +document.getElementById('wa').value / 100, wb = +document.getElementById('wb').value / 100;
    var oa = S.A[0] * (1 - wa) + S.A[1] * wa, ob = S.B[0] * (1 - wb) + S.B[1] * wb;
    chart.set({ categories: ['small stones', 'large stones', 'overall'], series: [
      { name: 'Treatment A', slot: 1, values: [S.A[0], S.A[1], oa] }, { name: 'Treatment B', slot: 2, values: [S.B[0], S.B[1], ob] }] });
    Sim.set('t-a', Sim.pct(oa, 1)); Sim.set('t-b', Sim.pct(ob, 1));
    Sim.set('t-a-x', '93.1% × ' + Math.round(100 * (1 - wa)) + '% + 73.0% × ' + Math.round(100 * wa) + '%');
    Sim.set('t-b-x', '86.7% × ' + Math.round(100 * (1 - wb)) + '% + 68.8% × ' + Math.round(100 * wb) + '%');
    var w = Math.abs(oa - ob) < 0.0005 ? 'a tie' : (oa > ob ? 'A' : 'B');
    Sim.set('t-w', w === 'a tie' ? 'Neither' : 'Treatment ' + w);
    Sim.set('t-w-x', w === 'B' ? 'Simpson’s paradox: A is better in each group' : 'Agrees with the comparison inside each group');
  }
  Sim.bindRange('wa', 'wa-o', function (v) { return v + '%'; }, draw);
  Sim.bindRange('wb', 'wb-o', function (v) { return v + '%'; }, draw);
  function setBoth(a, b) { document.getElementById('wa').value = a; document.getElementById('wb').value = b;
    Sim.set('wa-o', a + '%'); Sim.set('wb-o', b + '%'); draw(); }
  document.getElementById('study').addEventListener('click', function () { setBoth(75, 23); });
  document.getElementById('same').addEventListener('click', function () { setBoth(49, 49); });
  draw();
})();
