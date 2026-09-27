# STA102 probability simulations

Interactive simulations for the slides of **STA102 Probability and Random Variables**
(Ahmedabad University, Monsoon 2026). Every page runs entirely in the browser: plain HTML,
CSS and JavaScript, with no libraries, no build step, no accounts and no tracking.
Pages open straight from disk (double-click `index.html`) and work the same on the website.

## Where this lives

This folder is part of the saikia.in website repository and is served at
**https://saikia.in/STA102/BiSem2026/**. Publishing, the custom domain and DNS are described in the
README at the top of the repository. Each simulation has its own address, such as
`https://saikia.in/STA102/BiSem2026/monty-hall.html`, which can go on a slide or in the LMS.

## What is here

| Page | What it simulates | Slides |
|---|---|---|
| `long-run.html` | Running frequency of heads, sixes and roulette winnings settling on 1/2, 1/6 and −1/37 | Why should anyone care about chance?; Probability and what happens when you learn something |
| `galton.html` | Galton board (binomial hump) and averages of *n* dice turning into a bell curve | Why should anyone care about chance? |
| `monte-carlo-pi.html` | Estimating π with random darts; the error shrinking like 1/√*n* | Why should anyone care about chance? |
| `random-walk.html` | Simple random walks, the √*n* law, and where walks finish | Why should anyone care about chance? |
| `birthday.html` | Shared birthdays in a room, and someone sharing *your* birthday | Why should anyone care about chance?; Probability and what happens when you learn something |
| `monty-hall.html` | Play the game; simulate 3 to 100 doors; a Monty who does not know | Why should anyone care about chance?; Probability and what happens when you learn something |
| `positive-test.html` | Base rates: a town of 10,000 people tested for a rare disease | Why should anyone care about chance?; Probability and what happens when you learn something |
| `de-mere.html` | The Chevalier de Méré's two bets; Galileo's 9 versus 10 with three dice | Why should anyone care about chance?; Probability and what happens when you learn something |
| `dice-events.html` | Events as sets on the 36-square two-dice grid: ∪, ∩, complement, difference, conditioning | Sets: the language of events; Probability and what happens when you learn something |
| `cards.html` | Poker-hand frequencies against exact counts; puzzles about aces in a shuffled deck | Counting; Probability and what happens when you learn something |
| `lottery.html` | A 6-from-49 lottery: matches, jackpots and how many years it takes | Counting |
| `conditioning.html` | Conditional probability by throwing away runs: a peeked die, coin news, two children, Bertrand's box | Probability and what happens when you learn something; Why should anyone care about chance? |
| `simpson.html` | Simpson's paradox with the kidney-stone data; change the mix of patients | Probability and what happens when you learn something |
| `matching.html` | Phones handed back at random: no match about 1/*e* of the time; Poisson number of matches | Additional material; Probability and what happens when you learn something |
| `gamblers-ruin.html` | Gambler's ruin paths and exact formulas; bold play at roulette; deuce; a race to roll a six | Additional material; Probability and what happens when you learn something |
| `nontransitive-dice.html` | Four dice that beat each other in a circle, each with probability 2/3 | Additional material |

Each page shows the simulated value next to the exact answer, has a **Show the numbers** table under every chart,
follows the reader's light/dark setting (the **Theme** button in the header overrides it), and works on phones.

## Editing

The pages are plain HTML, so small wording changes can be made directly in the `.html` files.
For bigger changes, edit the sources and regenerate:

- `src/<page>.body.html`: the text and controls of a page
- `src/<page>.js`: its simulation
- `assets/sim.js`: shared helpers (random numbers, formatting, the line and bar charts, the theme switch)
- `assets/style.css`: colours and layout, with light and dark values at the top
- `build.py`: the list of pages and slide decks; run `python3 build.py` to rebuild every page and `index.html`

To add a simulation, create `src/<slug>.body.html` and `src/<slug>.js`, add a line to `PAGES` in `build.py`, and run the build.
