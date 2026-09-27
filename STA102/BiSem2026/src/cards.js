(function () {
  var RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'], SUITS = ['♣', '♦', '♥', '♠'];
  function cardHTML(c, mark) {
    var r = c % 13, s = Math.floor(c / 13), red = s === 1 || s === 2;
    return '<span class="playing-card' + (red ? ' red' : '') + (mark ? ' mark' : '') + '" aria-label="' + RANKS[r] + SUITS[s] + '"><span>' + RANKS[r] + '</span><span class="suit">' + SUITS[s] + '</span></span>';
  }
  /* ---------- poker ---------- */
  var HANDS = [
    ['Straight flush', 40], ['Four of a kind', 624], ['Full house', 3744], ['Flush', 5108], ['Straight', 10200],
    ['Three of a kind', 54912], ['Two pair', 123552], ['One pair', 1098240], ['High card only', 1302540]];
  var TOTAL = 2598960, counts = new Array(9).fill(0), n = 0, runner = new Sim.Runner(), deck = Sim.range(52);
  function deal5() {                                 /* partial Fisher-Yates */
    for (var i = 0; i < 5; i++) { var j = i + Math.floor(Math.random() * (52 - i)); var t = deck[i]; deck[i] = deck[j]; deck[j] = t; }
    return deck.slice(0, 5);
  }
  function classify(h) {
    var rc = new Array(13).fill(0), suit = Math.floor(h[0] / 13), flush = true, ranks = [];
    h.forEach(function (c) { rc[c % 13]++; if (Math.floor(c / 13) !== suit) flush = false; });
    var shape = rc.filter(function (x) { return x; }).sort(function (a, b) { return b - a; });
    for (var r = 0; r < 13; r++) if (rc[r]) ranks.push(r);
    var straight = shape.length === 5 && (ranks[4] - ranks[0] === 4 || (ranks[4] === 12 && ranks[3] === 3));
    if (straight && flush) return 0;
    if (shape[0] === 4) return 1;
    if (shape[0] === 3 && shape[1] === 2) return 2;
    if (flush) return 3;
    if (straight) return 4;
    if (shape[0] === 3) return 5;
    if (shape[0] === 2 && shape[1] === 2) return 6;
    if (shape[0] === 2) return 7;
    return 8;
  }
  function drawPoker() {
    Sim.set('t-n', Sim.int(n));
    var rows = '<tr><th>hand</th><th>dealt</th><th>simulated</th><th>exact</th><th>exact odds</th></tr>';
    HANDS.forEach(function (h, i) {
      rows += '<tr><td>' + h[0] + '</td><td>' + Sim.int(counts[i]) + '</td><td>' + (n ? Sim.prob(counts[i] / n) : '—') + '</td><td>' +
              Sim.prob(h[1] / TOTAL) + '</td><td>' + Sim.oneIn(h[1] / TOTAL) + '</td></tr>';
    });
    Sim.html('poker', rows);
  }
  document.getElementById('deal1').addEventListener('click', function () {
    var h = deal5(), k = classify(h); counts[k]++; n++;
    h.sort(function (a, b) { return (a % 13) - (b % 13); });
    Sim.html('hand', h.map(function (c) { return cardHTML(c); }).join(''));
    Sim.set('hand-cap', HANDS[k][0] + ' — exact probability ' + Sim.prob(HANDS[k][1] / TOTAL) + ' (' + Sim.oneIn(HANDS[k][1] / TOTAL) + ').');
    drawPoker();
  });
  Sim.$$('[data-deal]').forEach(function (b) { b.addEventListener('click', function () {
    var k = +b.dataset.deal; runner.run(k, function () { counts[classify(deal5())]++; n++; }, drawPoker, Sim.animated(k, 1.2)); }); });
  document.getElementById('reset').addEventListener('click', function () { runner.cancel(); counts = new Array(9).fill(0); n = 0; Sim.html('hand', ''); drawPoker(); });
  drawPoker();

  /* ---------- ace puzzles ---------- */
  var AS = 51, TC = 0;                               /* ace of spades = rank A (12) of spades (3); two of clubs = 0 */
  var PUZ = [
    ['The top two cards are both aces', 1 / 221, '4/52 × 3/51 = 1/221'],
    ['The second card is an ace (the first is unseen)', 1 / 13, '1/13, the same as for the first card'],
    ['The card after the first ace is the ace of spades', 1 / 52, '51!/52! = 1/52'],
    ['The card after the first ace is the two of clubs', 1 / 52, '1/52 as well'],
    ['Dealt into four piles of 13, each pile gets exactly one ace', 39 / 51 * 26 / 50 * 13 / 49, '(39/51)(26/50)(13/49)']];
  var hits = new Array(5).fill(0), d = 0, r2 = new Sim.Runner(), full = Sim.range(52);
  function isAce(c) { return c % 13 === 12; }
  function check(dk) {
    if (isAce(dk[0]) && isAce(dk[1])) hits[0]++;
    if (isAce(dk[1])) hits[1]++;
    var f = 0; while (!isAce(dk[f])) f++;
    if (f < 51) { if (dk[f + 1] === AS) hits[2]++; if (dk[f + 1] === TC) hits[3]++; }
    var piles = [0, 0, 0, 0]; for (var i = 0; i < 52; i++) if (isAce(dk[i])) piles[Math.floor(i / 13)]++;
    if (piles[0] === 1 && piles[1] === 1 && piles[2] === 1 && piles[3] === 1) hits[4]++;
    d++; return f;
  }
  function drawAces() {
    Sim.set('t-d', Sim.int(d));
    var rows = '<tr><th>event</th><th>times</th><th>simulated</th><th>exact</th><th>why</th></tr>';
    PUZ.forEach(function (p, i) {
      rows += '<tr><td>' + p[0] + '</td><td>' + Sim.int(hits[i]) + '</td><td>' + (d ? Sim.fix(hits[i] / d, 4) : '—') + '</td><td>' + Sim.fix(p[1], 4) + '</td><td>' + p[2] + '</td></tr>';
    });
    Sim.html('aces', rows);
  }
  document.getElementById('shuf1').addEventListener('click', function () {
    Sim.shuffle(full); var f = check(full);
    var show = full.slice(0, Math.min(52, f + 2));
    Sim.html('deck', show.map(function (c, i) { return cardHTML(c, i === f || i === f + 1); }).join(''));
    Sim.set('deck-cap', 'The first ace is card ' + (f + 1) + '; the next card is ' + RANKS[full[f + 1] % 13] + SUITS[Math.floor(full[f + 1] / 13)] + ' (both outlined).');
    drawAces();
  });
  Sim.$$('[data-shuf]').forEach(function (b) { b.addEventListener('click', function () {
    var k = +b.dataset.shuf; r2.run(k, function () { Sim.shuffle(full); check(full); }, drawAces, Sim.animated(k, 1.2)); }); });
  document.getElementById('reset2').addEventListener('click', function () { r2.cancel(); hits = new Array(5).fill(0); d = 0; Sim.html('deck', ''); drawAces(); });
  drawAces();
})();
