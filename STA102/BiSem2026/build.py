#!/usr/bin/env python3
"""Assemble the simulation pages from src/<slug>.body.html + src/<slug>.js."""
import json, os, html

DECKS = [
  ("first",   "Why should anyone care about chance?", "The opening deck: long-run frequency, order out of chaos, and four puzzles."),
  ("sets",    "Sets: the language of events", "Sample spaces, events and set operations on the two-dice grid."),
  ("count",   "Counting", "Permutations, combinations and the numbers behind cards and lotteries."),
  ("cond",    "Probability and what happens when you learn something", "Axioms, equally likely outcomes, conditioning and total probability."),
  ("extra",   "Additional material", "The matching problem, the gambler's ruin and non-transitive dice."),
]
PAGES = [
  # slug, title, card text, primary deck, also-in
  ("long-run", "The long run", "Toss a coin, roll a die or bet on red thousands of times and watch the running fraction settle.", "first", ["cond"]),
  ("galton", "Order out of chaos", "A Galton board, and the averages of several dice turning into a bell curve.", "first", []),
  ("monte-carlo-pi", "Estimating π with darts", "Throw random darts at a square and count how many land inside the quarter circle.", "first", []),
  ("random-walk", "Random walks", "Step left or right at random. How far do you get after n steps? About √n.", "first", []),
  ("birthday", "The birthday problem", "Fill a room with random birthdays. How often do two people share one — and how often does someone share yours?", "first", ["cond"]),
  ("monty-hall", "Monty Hall", "Play the game yourself, then simulate thousands of games with 3 to 100 doors.", "first", ["cond"]),
  ("positive-test", "The positive test", "A 95%-accurate test for a rare disease, drawn as a town of 10,000 people.", "first", ["cond"]),
  ("de-mere", "De Méré and Galileo", "The Chevalier's two bets, and why three dice total 10 slightly more often than 9.", "first", ["cond"]),
  ("dice-events", "Events on the two-dice grid", "Pick events A and B, see unions, intersections and complements, then roll to check.", "sets", ["cond"]),
  ("cards", "Poker hands and card puzzles", "Deal thousands of hands and shuffle thousands of decks: full houses, flushes and the first ace.", "count", ["cond"]),
  ("lottery", "The lottery", "Pick six numbers from 49 and play for as many weeks as you like.", "count", []),
  ("conditioning", "Conditioning by throwing runs away", "Peek at a die, hear the news about two coin tosses, and open Bertrand's boxes.", "cond", ["first"]),
  ("simpson", "Simpson's paradox", "Why treatment A wins for small stones and for large stones, but loses overall.", "cond", []),
  ("matching", "The matching problem", "Hand phones back at random. Nobody gets their own about 37% of the time, whatever the class size.", "extra", ["cond"]),
  ("gamblers-ruin", "The gambler's ruin", "Bet one unit at a time until you hit a target or go broke; bold play; deuce; a race to roll a six.", "extra", ["cond"]),
  ("nontransitive-dice", "Non-transitive dice", "Four dice that beat each other in a circle. Pick one; I'll pick the one that beats it.", "extra", []),
]
DECK_TITLE = {d[0]: d[1] for d in DECKS}

FAVICON = ("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E"
           "%3Crect x='3' y='3' width='34' height='34' rx='8' fill='%232a78d6'/%3E"
           "%3Ccircle cx='13' cy='13' r='3.6' fill='white'/%3E%3Ccircle cx='20' cy='20' r='3.6' fill='white'/%3E"
           "%3Ccircle cx='27' cy='27' r='3.6' fill='white'/%3E%3C/svg%3E")

def shell(title, desc, body, script, prevnext=""):
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(title)} · STA102 simulations</title>
<meta name="description" content="{html.escape(desc)}">
<link rel="icon" href="{FAVICON}">
<link rel="stylesheet" href="assets/style.css">
<script src="assets/sim.js"></script>
</head>
<body>
<header class="site">
  <a class="home" href="index.html">STA102 <span>· Probability simulations</span></a>
  <nav><a href="index.html">All simulations</a><a href="../index.html">Course page</a><button id="theme-toggle" class="theme-btn" type="button">Theme: system</button></nav>
</header>
<main class="page">
{body}
{prevnext}
</main>
<footer class="site-foot">STA102 Probability and Random Variables · Ahmedabad University · Monsoon 2026 ·
<a href="../../index.html">saikia.in</a>. Every simulation runs in your browser; nothing is sent anywhere.</footer>
{('<script>' + chr(10) + script + chr(10) + '</script>') if script else ''}
</body>
</html>
"""

def build():
    order = [p[0] for p in PAGES if os.path.exists(f"src/{p[0]}.body.html")]
    meta = {p[0]: p for p in PAGES}
    for i, slug in enumerate(order):
        _, title, card, deck, also = meta[slug]
        body = open(f"src/{slug}.body.html").read()
        script = open(f"src/{slug}.js").read() if os.path.exists(f"src/{slug}.js") else ""
        decks = [deck] + also
        src = " and ".join(f"<b>{DECK_TITLE[d]}</b>" for d in decks)
        body = body.replace("{{SOURCE}}", f'<p class="source">From the slides: {src}.</p>')
        prv = meta[order[i-1]] if i > 0 else None
        nxt = meta[order[i+1]] if i + 1 < len(order) else None
        pn = '<nav class="prevnext" style="display:flex;justify-content:space-between;gap:12px;margin-top:34px;font-size:0.92rem">'
        pn += (f'<a href="{prv[0]}.html">← {prv[1]}</a>' if prv else '<span></span>')
        pn += (f'<a href="{nxt[0]}.html">{nxt[1]} →</a>' if nxt else '<span></span>') + '</nav>'
        open(f"{slug}.html", "w").write(shell(title, card, body, script, pn))
    # index
    parts = ['<h1>Probability simulations</h1>',
             '<p class="lede">Interactive simulations for the STA102 slides. Press a button and thousands of '
             'random experiments run in your browser; watch the long-run frequencies settle on the values the '
             'slides prove.</p>',
             '<p class="source">Each page names the slides it belongs to. Everything is self-contained: no '
             'accounts, no downloads, no tracking.</p>']
    for key, dt, sub in DECKS:
        items = [p for p in PAGES if p[3] == key and os.path.exists(f"src/{p[0]}.body.html")]
        if not items: continue
        parts.append(f'<section class="deck" id="{key}"><h2>{dt}</h2><p class="deck-sub">{sub}</p><div class="cards">')
        for slug, title, card, deck, also in items:
            tag = ("Also: " + "; ".join(DECK_TITLE[a] for a in also)) if also else ""
            parts.append(f'<a class="card" href="{slug}.html"><h3>{title}</h3><p>{card}</p>'
                         + (f'<span class="tag">{tag}</span>' if tag else '') + '</a>')
        parts.append('</div></section>')
    open("index.html", "w").write(shell("Probability simulations", "Interactive probability simulations for STA102.",
                                        "\n".join(parts), ""))
    print("built", len(order), "pages + index")

if __name__ == "__main__":
    build()
