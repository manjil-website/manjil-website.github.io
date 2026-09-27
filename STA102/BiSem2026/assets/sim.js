/* STA102 probability simulations -- shared helpers.
   Plain script (no modules) so pages also work when opened straight from disk. */
(function (global) {
  'use strict';
  var Sim = {};

  /* ================= theme ================= */
  var THEME_KEY = 'site-theme';          /* shared with the rest of saikia.in */
  var themeChoice = 'system';
  try { themeChoice = localStorage.getItem(THEME_KEY) || 'system'; } catch (e) { themeChoice = 'system'; }
  function applyTheme() {
    var r = document.documentElement;
    if (themeChoice === 'light' || themeChoice === 'dark') r.setAttribute('data-theme', themeChoice);
    else r.removeAttribute('data-theme');
  }
  applyTheme();                       /* runs in <head>, so no flash of the wrong theme */
  function notifyTheme() { document.dispatchEvent(new CustomEvent('sim:theme')); }
  Sim.onTheme = function (fn) { document.addEventListener('sim:theme', fn); };
  function setupThemeButton() {
    var b = document.getElementById('theme-toggle');
    if (!b) return;
    function label() { b.textContent = 'Theme: ' + themeChoice; }
    b.addEventListener('click', function () {
      var order = ['system', 'light', 'dark'];
      themeChoice = order[(order.indexOf(themeChoice) + 1) % 3];
      try { if (themeChoice === 'system') localStorage.removeItem(THEME_KEY); else localStorage.setItem(THEME_KEY, themeChoice); } catch (e) {}
      applyTheme(); label(); notifyTheme();
    });
    label();
    if (global.matchMedia) {
      var mq = global.matchMedia('(prefers-color-scheme: dark)');
      if (mq.addEventListener) mq.addEventListener('change', notifyTheme);
    }
  }
  document.addEventListener('DOMContentLoaded', setupThemeButton);
  Sim.css = function (name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); };
  Sim.slot = function (k) { return Sim.css('--s' + k); };

  /* ================= randomness and maths ================= */
  Sim.rand = function () { return Math.random(); };
  Sim.randInt = function (a, b) { return a + Math.floor(Math.random() * (b - a + 1)); };
  Sim.die = function () { return 1 + Math.floor(Math.random() * 6); };
  Sim.shuffle = function (a) {
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  };
  Sim.range = function (n) { var a = new Array(n); for (var i = 0; i < n; i++) a[i] = i; return a; };
  Sim.choose = function (n, k) {
    if (k < 0 || k > n) return 0;
    k = Math.min(k, n - k); var r = 1;
    for (var i = 1; i <= k; i++) r = r * (n - k + i) / i;
    return r;
  };
  Sim.factorial = function (n) { var r = 1; for (var i = 2; i <= n; i++) r *= i; return r; };

  /* ================= formatting ================= */
  var nf = new Intl.NumberFormat('en-US');
  Sim.int = function (n) { return nf.format(Math.round(n)); };
  Sim.fix = function (x, d) { if (x === null || x === undefined || !isFinite(x)) return '—'; return x.toFixed(d === undefined ? 3 : d); };
  Sim.pct = function (x, d) { if (x === null || x === undefined || !isFinite(x)) return '—'; return (100 * x).toFixed(d === undefined ? 1 : d) + '%'; };
  var SUP = { '-': '\u207b', '0': '\u2070', '1': '\u00b9', '2': '\u00b2', '3': '\u00b3', '4': '\u2074',
              '5': '\u2075', '6': '\u2076', '7': '\u2077', '8': '\u2078', '9': '\u2079' };
  Sim.prob = function (x) {                         /* a probability, readable at any size */
    if (x === null || x === undefined || !isFinite(x)) return '\u2014';
    if (x === 0) return '0';
    if (x >= 0.001) return x.toFixed(4);
    var p = x.toExponential(2).split('e');
    return p[0] + ' \u00d7 10' + p[1].replace('+', '').split('').map(function (c) { return SUP[c] || c; }).join('');
  };
  Sim.sup = function (n) { return String(n).split('').map(function (c) { return SUP[c] || c; }).join(''); };
  Sim.oneIn = function (x) { return (x > 0) ? '1 in ' + Sim.int(1 / x) : '—'; };
  Sim.set = function (id, text) { var e = document.getElementById(id); if (e) e.textContent = text; };
  Sim.html = function (id, h) { var e = document.getElementById(id); if (e) e.innerHTML = h; };
  Sim.$ = function (sel, root) { return (root || document).querySelector(sel); };
  Sim.$$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* ================= running many trials without freezing the page ================= */
  /* runner.run(total, trial, update, {perFrame}) calls trial(i) `total` times, spread over
     animation frames, and update(done, total) after each frame. A new run cancels the old one. */
  Sim.Runner = function () { this.token = 0; this.busy = false; };
  Sim.Runner.prototype.run = function (total, trial, update, opts) {
    opts = opts || {};
    var self = this, my = ++this.token, done = 0;
    var perFrame = opts.perFrame || 0, budget = opts.msPerFrame || 14;
    this.busy = true;
    return new Promise(function (resolve) {
      function frame() {
        if (my !== self.token) { resolve(false); return; }
        if (perFrame) {
          var stop = Math.min(total, done + perFrame);
          for (; done < stop; done++) trial(done);
        } else {
          var t0 = performance.now();
          while (done < total && performance.now() - t0 < budget) {
            var stop2 = Math.min(total, done + 64);
            for (; done < stop2; done++) trial(done);
          }
        }
        if (update) update(done, total);
        if (done < total) requestAnimationFrame(frame);
        else { self.busy = false; resolve(true); }
      }
      requestAnimationFrame(frame);
    });
  };
  Sim.Runner.prototype.cancel = function () { this.token++; this.busy = false; };
  /* an animation that shows convergence: about `seconds` long whatever the size of the batch */
  Sim.animated = function (total, seconds) { return { perFrame: Math.max(1, Math.ceil(total / (60 * (seconds || 1.5)))) }; };

  /* ================= small UI helpers ================= */
  Sim.bindRange = function (input, output, fmt, onInput) {
    var i = typeof input === 'string' ? document.getElementById(input) : input;
    var o = typeof output === 'string' ? document.getElementById(output) : output;
    function show() { if (o) o.textContent = fmt ? fmt(+i.value) : i.value; }
    i.addEventListener('input', function () { show(); if (onInput) onInput(+i.value); });
    show();
    return i;
  };
  Sim.segmented = function (host, options, initial, onChange) {
    var h = typeof host === 'string' ? document.getElementById(host) : host;
    h.classList.add('seg'); h.setAttribute('role', 'group');
    var buttons = options.map(function (op) {
      var b = document.createElement('button'); b.type = 'button'; b.textContent = op.label;
      b.setAttribute('aria-pressed', op.value === initial ? 'true' : 'false');
      b.addEventListener('click', function () {
        buttons.forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
        b.setAttribute('aria-pressed', 'true'); onChange(op.value);
      });
      h.appendChild(b); return b;
    });
    return { set: function (v) { options.forEach(function (op, k) { buttons[k].setAttribute('aria-pressed', op.value === v ? 'true' : 'false'); }); } };
  };
  /* inline SVG of a die face */
  var PIPS = { 1: [[2, 2]], 2: [[1, 1], [3, 3]], 3: [[1, 1], [2, 2], [3, 3]], 4: [[1, 1], [3, 1], [1, 3], [3, 3]],
               5: [[1, 1], [3, 1], [2, 2], [1, 3], [3, 3]], 6: [[1, 1], [3, 1], [1, 2], [3, 2], [1, 3], [3, 3]] };
  Sim.dieSVG = function (n, cls) {
    var s = '<svg class="die ' + (cls || '') + '" viewBox="0 0 40 40" role="img" aria-label="die showing ' + n + '">' +
            '<rect x="2" y="2" width="36" height="36" rx="7"/>';
    (PIPS[n] || []).forEach(function (p) { s += '<circle cx="' + (p[0] * 10) + '" cy="' + (p[1] * 10) + '" r="3.6"/>'; });
    return s + '</svg>';
  };
  /* a crisp canvas that redraws itself on resize and on theme change */
  Sim.Canvas = function (host, height, draw) {
    var h = typeof host === 'string' ? document.getElementById(host) : host;
    var c = document.createElement('canvas'); c.className = 'viz'; h.appendChild(c);
    var self = this; this.canvas = c; this.ctx = c.getContext('2d'); this.draw = draw; this.height = height;
    function resize() {
      var w = h.clientWidth || 600, ht = typeof self.height === 'function' ? self.height(w) : self.height;
      var dpr = global.devicePixelRatio || 1;
      c.style.height = ht + 'px'; c.width = Math.round(w * dpr); c.height = Math.round(ht * dpr);
      self.ctx.setTransform(dpr, 0, 0, dpr, 0, 0); self.w = w; self.h = ht; self.redraw();
    }
    this.redraw = function () { if (self.draw) self.draw(self.ctx, self.w, self.h); };
    this.resize = resize;
    if (global.ResizeObserver) new ResizeObserver(function () { resize(); }).observe(h);
    Sim.onTheme(function () { self.redraw(); });
    resize();
  };

  /* ================= charts (SVG) ================= */
  var NS = 'http://www.w3.org/2000/svg';
  function svgEl(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) if (attrs[k] !== undefined && attrs[k] !== null) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e); return e;
  }
  function niceStep(span, count) {
    var raw = span / Math.max(1, count), mag = Math.pow(10, Math.floor(Math.log10(raw))), r = raw / mag;
    return (r <= 1 ? 1 : r <= 2 ? 2 : r <= 2.5 ? 2.5 : r <= 5 ? 5 : 10) * mag;
  }
  function linTicks(min, max, count) {
    if (!(max > min)) { max = min + 1; }
    var step = niceStep(max - min, count), out = [];
    var start = Math.ceil(min / step - 1e-9) * step;
    for (var v = start; v <= max + step * 1e-9; v += step) out.push(+v.toPrecision(12));
    return out;
  }
  function logTicks(min, max) {
    var out = [], a = Math.floor(Math.log10(min)), b = Math.ceil(Math.log10(max));
    for (var e = a; e <= b; e++) {
      [1, 2, 5].forEach(function (m) { var v = m * Math.pow(10, e); if (v >= min * 0.999 && v <= max * 1.001) out.push(v); });
    }
    if (out.length > 7) out = out.filter(function (v) { return Math.abs(Math.log10(v) % 1) < 1e-9; });
    return out;
  }
  function tickFmt(v) {
    var a = Math.abs(v);
    if (a === 0) return '0';
    if (a >= 1e6) return (v / 1e6).toString().replace(/\.0+$/, '') + 'M';
    if (a >= 1e4) return (v / 1e3).toString().replace(/\.0+$/, '') + 'k';
    if (a >= 1000) return nf.format(v);
    if (a >= 1) return (+v.toPrecision(4)).toString();
    return (+v.toPrecision(3)).toString();
  }
  Sim.tickFmt = tickFmt;
  function colorOf(s) {
    if (s.color) return s.color.indexOf('--') === 0 ? Sim.css(s.color) : s.color;
    if (s.ref) return Sim.css('--ink-2');
    return Sim.slot(s.slot || 1);
  }
  function legendHTML(items) {
    return items.map(function (it) {
      var cls = it.kind === 'box' ? 'box' : it.kind === 'dot' ? 'dot' : (it.dashed ? 'dash' : '');
      var st = it.kind === 'box' || it.kind === 'dot' ? 'background:' + it.color : 'color:' + it.color;
      return '<span><i class="' + cls + '" style="' + st + '"></i>' + it.name + '</span>';
    }).join('');
  }
  function placeTip(tip, wrap, px, py) {
    tip.style.display = 'block';
    var tw = tip.offsetWidth, th = tip.offsetHeight, W = wrap.clientWidth;
    var x = px + 14; if (x + tw > W) x = px - tw - 14; if (x < 0) x = 0;
    var y = py - th - 10; if (y < 0) y = py + 14;
    tip.style.left = x + 'px'; tip.style.top = y + 'px';
  }
  function lowerBound(pts, x) {         /* index of the point whose x is nearest */
    var lo = 0, hi = pts.length - 1;
    if (hi < 0) return -1;
    while (hi - lo > 1) { var mid = (lo + hi) >> 1; if (pts[mid][0] < x) lo = mid; else hi = mid; }
    return (Math.abs(pts[lo][0] - x) <= Math.abs(pts[hi][0] - x)) ? lo : hi;
  }
  function decimate(pts, max) {
    if (pts.length <= max) return pts;
    var step = pts.length / max, out = [];
    for (var i = 0; i < max; i++) out.push(pts[Math.floor(i * step)]);
    out.push(pts[pts.length - 1]);
    return out;
  }

  /* ---------- line chart ----------
     series: [{name, points:[[x,y],...], slot, color, ref (theory: muted dashed), markers (dots only), width}]
     refs:   [{y, label}] horizontal reference lines                                              */
  Sim.LineChart = function (host, opts) {
    this.host = typeof host === 'string' ? document.getElementById(host) : host;
    this.o = Object.assign({ height: 300, xLabel: '', yLabel: '', xLog: false, xMin: null, xMax: null,
                             yMin: null, yMax: null, xFmt: tickFmt, yFmt: tickFmt,
                             tipX: null, tipY: function (v) { return Sim.fix(v, 4); }, title: '' }, opts || {});
    this.series = []; this.refs = [];
    var h = this.host; h.classList.add('chart'); h.innerHTML = '';
    if (this.o.title) { var t = document.createElement('div'); t.className = 'title'; t.textContent = this.o.title; h.appendChild(t); }
    this.legend = document.createElement('div'); this.legend.className = 'legend'; h.appendChild(this.legend);
    this.wrap = document.createElement('div'); this.wrap.className = 'plot'; h.appendChild(this.wrap);
    this.svg = svgEl('svg', { role: 'img' }, this.wrap);
    if (this.o.ariaLabel) this.svg.setAttribute('aria-label', this.o.ariaLabel);
    this.tip = document.createElement('div'); this.tip.className = 'tooltip'; this.wrap.appendChild(this.tip);
    var self = this;
    if (global.ResizeObserver) new ResizeObserver(function () { self.render(); }).observe(this.wrap);
    Sim.onTheme(function () { self.render(); });
  };
  Sim.LineChart.prototype.set = function (series, refs) { this.series = series || []; this.refs = refs || []; this.render(); };
  Sim.LineChart.prototype.render = function () {
    var o = this.o, svg = this.svg, self = this;
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var W = this.wrap.clientWidth || 640, H = o.height;
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); svg.setAttribute('height', H);
    var all = []; this.series.forEach(function (s) { (s.points || []).forEach(function (p) { if (isFinite(p[0]) && isFinite(p[1])) all.push(p); }); });
    var xs = all.map(function (p) { return p[0]; }), ys = all.map(function (p) { return p[1]; });
    this.refs.forEach(function (r) { if (r.y !== undefined) ys.push(r.y); });
    var xMin = o.xMin !== null ? o.xMin : (xs.length ? Math.min.apply(null, xs) : 0);
    var xMax = o.xMax !== null ? o.xMax : (xs.length ? Math.max.apply(null, xs) : 1);
    if (o.xLog) { xMin = Math.max(xMin, 1e-9); if (xMax <= xMin) xMax = xMin * 10; } else if (xMax <= xMin) xMax = xMin + 1;
    var yMin = o.yMin !== null ? o.yMin : (ys.length ? Math.min.apply(null, ys) : 0);
    var yMax = o.yMax !== null ? o.yMax : (ys.length ? Math.max.apply(null, ys) : 1);
    if (yMax <= yMin) { yMax = yMin + 1; }
    var yt = linTicks(yMin, yMax, 5);
    if (o.yMin === null) yMin = Math.min(yMin, yt[0]);
    if (o.yMax === null) yMax = Math.max(yMax, yt[yt.length - 1]);
    yt = yt.filter(function (v) { return v >= yMin - 1e-12 && v <= yMax + 1e-12; });
    var yLabW = Math.max.apply(null, yt.map(function (v) { return o.yFmt(v).length; }).concat([2])) * 6.6 + 12;
    var m = { l: yLabW + (o.yLabel ? 16 : 0), r: 14, t: 12, b: 30 + (o.xLabel ? 16 : 0) };
    var pw = Math.max(40, W - m.l - m.r), ph = Math.max(40, H - m.t - m.b);
    var lx = function (x) { return o.xLog ? Math.log10(x) : x; };
    var X = function (x) { return m.l + (lx(x) - lx(xMin)) / (lx(xMax) - lx(xMin)) * pw; };
    var Y = function (y) { return m.t + (1 - (y - yMin) / (yMax - yMin)) * ph; };
    this._scale = { X: X, Y: Y, m: m, pw: pw, ph: ph, xMin: xMin, xMax: xMax, lx: lx };
    var gGrid = svgEl('g', {}, svg);
    yt.forEach(function (v) {
      svgEl('line', { x1: m.l, x2: m.l + pw, y1: Y(v), y2: Y(v), stroke: Sim.css('--grid'), 'stroke-width': 1, 'shape-rendering': 'crispEdges' }, gGrid);
      var t = svgEl('text', { x: m.l - 8, y: Y(v) + 4, 'text-anchor': 'end', 'class': 'tick' }, gGrid); t.textContent = o.yFmt(v);
    });
    svgEl('line', { x1: m.l, x2: m.l + pw, y1: m.t + ph, y2: m.t + ph, stroke: Sim.css('--axis'), 'stroke-width': 1, 'shape-rendering': 'crispEdges' }, gGrid);
    var xt = o.xLog ? logTicks(xMin, xMax) : linTicks(xMin, xMax, Math.max(3, Math.floor(pw / 90)));
    xt.filter(function (v) { return v >= xMin - 1e-12 && v <= xMax + 1e-12; }).forEach(function (v) {
      var t = svgEl('text', { x: X(v), y: m.t + ph + 17, 'text-anchor': 'middle', 'class': 'tick' }, gGrid); t.textContent = o.xFmt(v);
    });
    if (o.xLabel) { var tx = svgEl('text', { x: m.l + pw / 2, y: H - 4, 'text-anchor': 'middle', 'class': 'axis-title' }, gGrid); tx.textContent = o.xLabel; }
    if (o.yLabel) { var ty = svgEl('text', { x: 12, y: m.t + ph / 2, 'text-anchor': 'middle', 'class': 'axis-title', transform: 'rotate(-90 12 ' + (m.t + ph / 2) + ')' }, gGrid); ty.textContent = o.yLabel; }
    var cid = 'clip' + Math.random().toString(36).slice(2);
    var defs = svgEl('defs', {}, svg), cp = svgEl('clipPath', { id: cid }, defs);
    svgEl('rect', { x: m.l, y: m.t - 6, width: pw, height: ph + 12 }, cp);
    var gData = svgEl('g', { 'clip-path': 'url(#' + cid + ')' }, svg);
    this.refs.forEach(function (r) {
      if (r.y === undefined || r.y < yMin || r.y > yMax) return;
      svgEl('line', { x1: m.l, x2: m.l + pw, y1: Y(r.y), y2: Y(r.y), stroke: Sim.css('--ink-2'), 'stroke-width': 1.25, 'stroke-dasharray': '5 4' }, gData);
    });
    var surface = Sim.css('--surface');
    this.series.forEach(function (s) {
      var pts = (s.points || []).filter(function (p) { return isFinite(p[0]) && isFinite(p[1]) && (!o.xLog || p[0] > 0); });
      if (!pts.length) return;
      var col = colorOf(s);
      if (s.markers) {
        pts.forEach(function (p) { svgEl('circle', { cx: X(p[0]), cy: Y(p[1]), r: s.r || 4.5, fill: col, stroke: surface, 'stroke-width': 2 }, gData); });
        return;
      }
      var d = decimate(pts, Math.max(200, Math.floor(pw * 1.5))).map(function (p, i) { return (i ? 'L' : 'M') + X(p[0]).toFixed(1) + ' ' + Y(p[1]).toFixed(1); }).join('');
      svgEl('path', { d: d, fill: 'none', stroke: col, 'stroke-width': s.width || (s.ref ? 1.5 : 2), 'stroke-linejoin': 'round', 'stroke-linecap': 'round',
                      'stroke-dasharray': s.ref || s.dashed ? '5 4' : null }, gData);
    });
    var gLab = svgEl('g', {}, svg);
    this.refs.forEach(function (r) {
      if (!r.label || r.y === undefined || r.y < yMin || r.y > yMax) return;
      var up = r.below ? 13 : -5;
      var t = svgEl('text', { x: m.l + pw - 4, y: Y(r.y) + up, 'text-anchor': 'end', 'class': 'ref-label' }, gLab); t.textContent = r.label;
    });
    var named = this.series.filter(function (s) { return s.name && !s.noLegend; });
    this.legend.innerHTML = named.length >= 2 || (named.length === 1 && this.o.alwaysLegend) ?
      legendHTML(named.map(function (s) { return { name: s.name, color: colorOf(s), dashed: s.ref || s.dashed, kind: s.markers ? 'dot' : 'line' }; })) : '';
    /* hover layer */
    var gHover = svgEl('g', { 'pointer-events': 'none' }, svg);
    var hit = svgEl('rect', { x: m.l, y: m.t, width: pw, height: ph, fill: 'transparent' }, svg);
    var sorted = this.series.map(function (s) { return (s.points || []).slice().sort(function (a, b) { return a[0] - b[0]; }); });
    function move(ev) {
      var rect = svg.getBoundingClientRect(), px = (ev.clientX - rect.left) * (W / rect.width);
      var fx = (px - m.l) / pw, xv = lx(xMin) + fx * (lx(xMax) - lx(xMin)); if (o.xLog) xv = Math.pow(10, xv);
      while (gHover.firstChild) gHover.removeChild(gHover.firstChild);
      var rows = [], xAt = null;
      self.series.forEach(function (s, k) {
        if (!s.name) return;
        var pts = sorted[k]; var i = lowerBound(pts, xv); if (i < 0) return;
        var p = pts[i]; if (xAt === null) xAt = p[0];
        rows.push({ s: s, p: p });
        svgEl('circle', { cx: X(p[0]), cy: Y(p[1]), r: 4.5, fill: colorOf(s), stroke: surface, 'stroke-width': 2 }, gHover);
      });
      if (xAt === null) return;
      svgEl('line', { x1: X(xAt), x2: X(xAt), y1: m.t, y2: m.t + ph, stroke: Sim.css('--ink-3'), 'stroke-width': 1 }, gHover);
      gHover.insertBefore(gHover.lastChild, gHover.firstChild);
      var head = o.tipX ? o.tipX(xAt) : (o.xLabel ? o.xLabel + ': ' : '') + tickFmt(xAt);
      self.tip.innerHTML = '<div class="tt-h">' + head + '</div>' + rows.map(function (r) {
        return '<div class="tt-row"><i style="background:' + colorOf(r.s) + '"></i>' + r.s.name + '<b>' + o.tipY(r.p[1], r.s) + '</b></div>';
      }).join('');
      var wr = self.wrap.getBoundingClientRect();
      placeTip(self.tip, self.wrap, ev.clientX - wr.left, ev.clientY - wr.top);
    }
    hit.addEventListener('pointermove', move);
    hit.addEventListener('pointerleave', function () { self.tip.style.display = 'none'; while (gHover.firstChild) gHover.removeChild(gHover.firstChild); });
  };

  /* ---------- bar chart ----------
     data: {categories:[...], series:[{name, values, slot}], exact:{name, values}}  */
  Sim.BarChart = function (host, opts) {
    this.host = typeof host === 'string' ? document.getElementById(host) : host;
    this.o = Object.assign({ height: 280, xLabel: '', yLabel: '', yMax: null, yFmt: tickFmt, valFmt: function (v) { return Sim.fix(v, 4); },
                             labelEvery: 1, catLabel: function (c) { return String(c); }, table: true, title: '',
                             tableHead: 'value' }, opts || {});
    var h = this.host; h.classList.add('chart'); h.innerHTML = '';
    if (this.o.title) { var t = document.createElement('div'); t.className = 'title'; t.textContent = this.o.title; h.appendChild(t); }
    this.legend = document.createElement('div'); this.legend.className = 'legend'; h.appendChild(this.legend);
    this.wrap = document.createElement('div'); this.wrap.className = 'plot'; h.appendChild(this.wrap);
    this.svg = svgEl('svg', { role: 'img' }, this.wrap);
    this.tip = document.createElement('div'); this.tip.className = 'tooltip'; this.wrap.appendChild(this.tip);
    if (this.o.table) {
      this.details = document.createElement('details'); this.details.className = 'table-view';
      this.details.innerHTML = '<summary>Show the numbers</summary><div class="table-wrap"></div>'; h.appendChild(this.details);
    }
    this.data = { categories: [], series: [] };
    var self = this;
    if (global.ResizeObserver) new ResizeObserver(function () { self.render(); }).observe(this.wrap);
    Sim.onTheme(function () { self.render(); });
  };
  Sim.BarChart.prototype.set = function (data) { this.data = data; this.render(); this.renderTable(); };
  Sim.BarChart.prototype.renderTable = function () {
    if (!this.details) return;
    var d = this.data, o = this.o, head = '<tr><th>' + (o.xLabel || '') + '</th>';
    d.series.forEach(function (s) { head += '<th>' + s.name + '</th>'; });
    if (d.exact) head += '<th>' + d.exact.name + '</th>';
    var rows = d.categories.map(function (c, i) {
      var r = '<tr><td>' + o.catLabel(c) + '</td>';
      d.series.forEach(function (s) { r += '<td>' + o.valFmt(s.values[i]) + '</td>'; });
      if (d.exact) r += '<td>' + o.valFmt(d.exact.values[i]) + '</td>';
      return r + '</tr>';
    }).join('');
    this.details.querySelector('.table-wrap').innerHTML = '<table class="data">' + head + '</tr>' + rows + '</table>';
  };
  Sim.BarChart.prototype.render = function () {
    var o = this.o, d = this.data, svg = this.svg, self = this;
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var W = this.wrap.clientWidth || 640, H = o.height, n = d.categories.length;
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); svg.setAttribute('height', H);
    var vmax = 0;
    d.series.forEach(function (s) { s.values.forEach(function (v) { if (isFinite(v)) vmax = Math.max(vmax, v); }); });
    if (d.exact) d.exact.values.forEach(function (v) { if (isFinite(v)) vmax = Math.max(vmax, v); });
    var yMax = o.yMax !== null ? o.yMax : (vmax > 0 ? vmax * 1.08 : 1);
    var yt = linTicks(0, yMax, 5); if (o.yMax === null) yMax = Math.max(yMax, yt[yt.length - 1]);
    yt = yt.filter(function (v) { return v <= yMax + 1e-12; });
    var yLabW = Math.max.apply(null, yt.map(function (v) { return o.yFmt(v).length; }).concat([2])) * 6.6 + 12;
    var m = { l: yLabW + (o.yLabel ? 16 : 0), r: 10, t: 12, b: 30 + (o.xLabel ? 16 : 0) };
    var pw = Math.max(40, W - m.l - m.r), ph = Math.max(40, H - m.t - m.b);
    var Y = function (v) { return m.t + (1 - v / yMax) * ph; };
    var band = pw / Math.max(1, n), ns = Math.max(1, d.series.length);
    var bw = Math.min(24, Math.max(1, (band * 0.78 - 2 * (ns - 1)) / ns)), gw = bw * ns + 2 * (ns - 1);
    var g = svgEl('g', {}, svg);
    yt.forEach(function (v) {
      svgEl('line', { x1: m.l, x2: m.l + pw, y1: Y(v), y2: Y(v), stroke: Sim.css('--grid'), 'stroke-width': 1, 'shape-rendering': 'crispEdges' }, g);
      var t = svgEl('text', { x: m.l - 8, y: Y(v) + 4, 'text-anchor': 'end', 'class': 'tick' }, g); t.textContent = o.yFmt(v);
    });
    var every = typeof o.labelEvery === 'function' ? o.labelEvery : function (c, i) { return i % o.labelEvery === 0; };
    d.categories.forEach(function (c, i) {
      if (!every(c, i)) return;
      var t = svgEl('text', { x: m.l + band * (i + 0.5), y: m.t + ph + 17, 'text-anchor': 'middle', 'class': 'tick' }, g); t.textContent = o.catLabel(c);
    });
    if (o.xLabel) { var tx = svgEl('text', { x: m.l + pw / 2, y: H - 4, 'text-anchor': 'middle', 'class': 'axis-title' }, g); tx.textContent = o.xLabel; }
    if (o.yLabel) { var ty = svgEl('text', { x: 12, y: m.t + ph / 2, 'text-anchor': 'middle', 'class': 'axis-title', transform: 'rotate(-90 12 ' + (m.t + ph / 2) + ')' }, g); ty.textContent = o.yLabel; }
    var surface = Sim.css('--surface');
    d.series.forEach(function (s, k) {
      var col = colorOf(s);
      s.values.forEach(function (v, i) {
        if (!(v > 0)) return;
        var x = m.l + band * (i + 0.5) - gw / 2 + k * (bw + 2), y = Y(v), h = m.t + ph - y, r = Math.min(4, bw / 2, h);
        var path = 'M' + x + ' ' + (m.t + ph) + 'V' + (y + r) + 'Q' + x + ' ' + y + ' ' + (x + r) + ' ' + y + 'H' + (x + bw - r) +
                   'Q' + (x + bw) + ' ' + y + ' ' + (x + bw) + ' ' + (y + r) + 'V' + (m.t + ph) + 'Z';
        svgEl('path', { d: path, fill: col }, g);
      });
    });
    if (d.exact) {
      var ink = Sim.css('--ink-1'), ptsE = [];
      d.exact.values.forEach(function (v, i) { if (isFinite(v)) ptsE.push([m.l + band * (i + 0.5), Y(v)]); });
      if (ptsE.length > 1) svgEl('path', { d: ptsE.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(''),
                                            fill: 'none', stroke: Sim.css('--ink-2'), 'stroke-width': 1.25 }, g);
      var rr = band < 10 ? 2.5 : 4;
      ptsE.forEach(function (p) { svgEl('circle', { cx: p[0], cy: p[1], r: rr, fill: ink, stroke: surface, 'stroke-width': 1.5 }, g); });
    }
    svgEl('line', { x1: m.l, x2: m.l + pw, y1: m.t + ph, y2: m.t + ph, stroke: Sim.css('--axis'), 'stroke-width': 1, 'shape-rendering': 'crispEdges' }, g);
    var items = d.series.map(function (s) { return { name: s.name, color: colorOf(s), kind: 'box' }; });
    if (d.exact) items.push({ name: d.exact.name, color: Sim.css('--ink-1'), kind: 'dot' });
    this.legend.innerHTML = items.length >= 2 ? legendHTML(items) : '';
    var hl = svgEl('rect', { x: 0, y: m.t, width: 0, height: ph, fill: Sim.css('--ink-3'), opacity: 0.12, 'pointer-events': 'none', display: 'none' }, svg);
    var hit = svgEl('rect', { x: m.l, y: m.t, width: pw, height: ph, fill: 'transparent' }, svg);
    hit.addEventListener('pointermove', function (ev) {
      var rect = svg.getBoundingClientRect(), px = (ev.clientX - rect.left) * (W / rect.width);
      var i = Math.floor((px - m.l) / band); if (i < 0 || i >= n) return;
      hl.setAttribute('x', m.l + band * i); hl.setAttribute('width', band); hl.setAttribute('display', 'inline');
      var html = '<div class="tt-h">' + (o.xLabel ? o.xLabel + ': ' : '') + o.catLabel(d.categories[i]) + '</div>';
      d.series.forEach(function (s) { html += '<div class="tt-row"><i style="background:' + colorOf(s) + '"></i>' + s.name + '<b>' + o.valFmt(s.values[i]) + '</b></div>'; });
      if (d.exact) html += '<div class="tt-row"><i style="background:' + Sim.css('--ink-1') + ';border-radius:50%"></i>' + d.exact.name + '<b>' + o.valFmt(d.exact.values[i]) + '</b></div>';
      self.tip.innerHTML = html;
      var wr = self.wrap.getBoundingClientRect(); placeTip(self.tip, self.wrap, ev.clientX - wr.left, ev.clientY - wr.top);
    });
    hit.addEventListener('pointerleave', function () { self.tip.style.display = 'none'; hl.setAttribute('display', 'none'); });
  };

  /* a growing trace (x = 1, 2, 3, ...): keeps every point early on, then thins itself out */
  Sim.Trace = function (maxPts) { this.pts = []; this.stride = 1; this.max = maxPts || 700; };
  Sim.Trace.prototype.push = function (x, y) {
    if (x <= 50 || x % this.stride === 0) this.pts.push([x, y]);
    if (this.pts.length > this.max) {
      this.stride *= 2; var st = this.stride;
      this.pts = this.pts.filter(function (p) { return p[0] <= 50 || p[0] % st === 0; });
    }
  };
  Sim.Trace.prototype.points = function (lastX, lastY) {
    var p = this.pts.slice(); if (lastX !== undefined && (!p.length || p[p.length - 1][0] !== lastX)) p.push([lastX, lastY]); return p;
  };

  global.Sim = Sim;
})(window);
