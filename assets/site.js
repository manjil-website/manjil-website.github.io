/* saikia.in -- theme switch (shared with the simulations) and the Galton board on the homepage.
   Plain script, no libraries: pages work on GitHub Pages and when opened straight from disk. */
(function () {
  'use strict';

  /* ---------------- theme: system -> light -> dark ---------------- */
  var KEY = 'site-theme', choice = 'system', listeners = [];
  try { choice = localStorage.getItem(KEY) || 'system'; } catch (e) { choice = 'system'; }
  function apply() {
    var r = document.documentElement;
    if (choice === 'light' || choice === 'dark') r.setAttribute('data-theme', choice); else r.removeAttribute('data-theme');
  }
  apply();                                   /* loaded in <head>, so there is no flash of the wrong theme */
  function notify() { listeners.forEach(function (f) { f(); }); }
  function css(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }

  document.addEventListener('DOMContentLoaded', function () {
    var b = document.getElementById('theme-toggle');
    if (b) {
      var label = function () { b.textContent = 'Theme: ' + choice; };
      b.addEventListener('click', function () {
        var order = ['system', 'light', 'dark'];
        choice = order[(order.indexOf(choice) + 1) % 3];
        try { if (choice === 'system') localStorage.removeItem(KEY); else localStorage.setItem(KEY, choice); } catch (e) {}
        apply(); label(); notify();
      });
      label();
    }
    if (window.matchMedia) {
      var mq = window.matchMedia('(prefers-color-scheme: dark)');
      if (mq.addEventListener) mq.addEventListener('change', notify);
    }
    var y = document.getElementById('year');
    if (y) y.textContent = String(new Date().getFullYear());
    var host = document.getElementById('galton');
    if (host) galton(host);
  });

  /* ---------------- Galton board ---------------- */
  function galton(host) {
    var ROWS = 10, BATCH = 150;
    var canvas = document.createElement('canvas');
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', 'A Galton board: balls bounce left or right at random off ten rows of pegs and pile up into a bell-shaped histogram.');
    host.insertBefore(canvas, host.firstChild);
    var ctx = canvas.getContext('2d');
    var bins = [], balls = [], queued = 0, landed = 0, W = 0, H = 0, raf = 0, lastT = 0, spawnAcc = 0;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var countEl = document.getElementById('galton-count');
    var C = [];                                      /* binomial probabilities C(ROWS, k) / 2^ROWS */
    (function () { var c = 1; for (var k = 0; k <= ROWS; k++) { C.push(c / Math.pow(2, ROWS)); c = c * (ROWS - k) / (k + 1); } })();
    for (var k = 0; k <= ROWS; k++) bins.push(0);

    function geom() {
      var dx = W / (ROWS + 2.2), top = 16, dy = Math.min(dx * 0.82, (H * 0.5 - top) / (ROWS - 1));
      return { dx: dx, dy: dy, top: top, pegBottom: top + (ROWS - 1) * dy, binTop: top + (ROWS - 1) * dy + dy * 0.9, floor: H - 4 };
    }
    function size() {
      var w = host.clientWidth - 24; if (w <= 0) return;
      var dpr = window.devicePixelRatio || 1;
      W = w; H = Math.round(w * 0.74);
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    }
    function xAt(rights, row, g) { return W / 2 + (rights - row / 2) * g.dx; }
    function newBall() { var path = []; for (var i = 0; i < ROWS; i++) path.push(Math.random() < 0.5 ? 0 : 1); return { path: path, t: 0 }; }
    function rightsBefore(b, row) { var r = 0; for (var i = 0; i < row && i < ROWS; i++) r += b.path[i]; return r; }
    function land(b) { bins[rightsBefore(b, ROWS)]++; landed++; }

    function draw() {
      if (!W) return;
      var g = geom(), s1 = css('--s1'), ink3 = css('--ink-3'), axis = css('--axis'), grid = css('--grid'), surf = css('--surface');
      ctx.clearRect(0, 0, W, H); ctx.fillStyle = surf; ctx.fillRect(0, 0, W, H);
      /* pegs */
      ctx.fillStyle = axis;
      for (var r = 0; r < ROWS; r++) for (var j = 0; j <= r; j++) {
        ctx.beginPath(); ctx.arc(xAt(j, r, g), g.top + r * g.dy, Math.max(2, g.dx * 0.07), 0, 2 * Math.PI); ctx.fill();
      }
      /* bin walls and floor */
      ctx.strokeStyle = grid; ctx.lineWidth = 1;
      for (var k = 0; k <= ROWS + 1; k++) {
        var xw = W / 2 + (k - 0.5 - ROWS / 2) * g.dx;
        ctx.beginPath(); ctx.moveTo(xw, g.binTop); ctx.lineTo(xw, g.floor); ctx.stroke();
      }
      ctx.strokeStyle = axis; ctx.beginPath(); ctx.moveTo(W / 2 - (ROWS / 2 + 0.5) * g.dx, g.floor); ctx.lineTo(W / 2 + (ROWS / 2 + 0.5) * g.dx, g.floor); ctx.stroke();
      /* piles: bars with rounded tops, scaled so the tallest expected pile fits */
      var avail = g.floor - g.binTop - 6, total = Math.max(landed + queued + balls.length, 1);
      var maxBin = 0; bins.forEach(function (v) { if (v > maxBin) maxBin = v; });
      var unit = avail / Math.max(maxBin, C[ROWS / 2] * total * 1.08, 1);
      var bw = g.dx * 0.62;
      ctx.fillStyle = s1;
      bins.forEach(function (v, k) {
        if (!v) return;
        var h = v * unit, x = W / 2 + (k - ROWS / 2) * g.dx - bw / 2, y = g.floor - h, rr = Math.min(4, h / 2, bw / 2);
        ctx.beginPath(); ctx.moveTo(x, g.floor); ctx.lineTo(x, y + rr); ctx.quadraticCurveTo(x, y, x + rr, y);
        ctx.lineTo(x + bw - rr, y); ctx.quadraticCurveTo(x + bw, y, x + bw, y + rr); ctx.lineTo(x + bw, g.floor); ctx.closePath(); ctx.fill();
      });
      /* the binomial shape the piles are heading for */
      if (landed > 0) {
        ctx.strokeStyle = ink3; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]); ctx.beginPath();
        for (var q = 0; q <= ROWS; q++) {
          var px = W / 2 + (q - ROWS / 2) * g.dx, py = g.floor - C[q] * landed * unit;
          if (q === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke(); ctx.setLineDash([]);
      }
      /* balls in flight */
      var br = Math.max(3, g.dx * 0.13);
      ctx.fillStyle = s1;
      balls.forEach(function (b) {
        var row = Math.floor(b.t), f = b.t - row, x, y;
        if (row < ROWS) {
          var r0 = rightsBefore(b, row), x0 = xAt(r0, row, g), x1 = xAt(r0 + b.path[row], row + 1, g);
          x = x0 + (x1 - x0) * f;
          var y0 = g.top + row * g.dy - br - 2, y1 = g.top + (row + 1) * g.dy - br - 2;
          y = y0 + (y1 - y0) * f - Math.sin(Math.PI * f) * g.dy * 0.35;   /* a small hop off each peg */
        } else {
          x = xAt(rightsBefore(b, ROWS), ROWS, g); y = g.pegBottom + g.dy * (f + 0.2);
        }
        ctx.beginPath(); ctx.arc(x, y, br, 0, 2 * Math.PI); ctx.fill();
      });
      if (countEl) countEl.textContent = landed.toLocaleString('en-US') + (landed === 1 ? ' ball' : ' balls');
    }

    function step(t) {
      var dt = lastT ? Math.min(50, t - lastT) : 16; lastT = t;
      spawnAcc += dt;
      while (queued > 0 && spawnAcc >= 38) { balls.push(newBall()); queued--; spawnAcc -= 38; }
      if (!queued) spawnAcc = 0;
      var speed = dt / 70;                                  /* rows per frame */
      balls = balls.filter(function (b) { b.t += speed; if (b.t >= ROWS + 1) { land(b); return false; } return true; });
      draw();
      if (balls.length || queued) raf = requestAnimationFrame(step); else { raf = 0; lastT = 0; }
    }
    function drop(n) {
      if (reduce) { for (var i = 0; i < n; i++) land(newBall()); draw(); return; }
      queued += n;
      if (!raf) raf = requestAnimationFrame(step);
    }
    var again = document.getElementById('galton-drop');
    if (again) again.addEventListener('click', function () { drop(BATCH); });
    listeners.push(draw);
    if (window.ResizeObserver) new ResizeObserver(size).observe(host); else window.addEventListener('resize', size);
    size();
    drop(BATCH);
  }
})();
