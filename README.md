# SpaceDoctor Focus v3 — working demo

SpaceDoctor is an astronaut health-monitoring concept built for the NASA Space Apps challenge. This repository holds a working browser demo of the reduced "Focus v3" scope: one dashboard, five health workflows and a built-in assistant.

> **Demo only.** All readings and targets are synthetic records for a fictitious "Astronaut A". The app contains no real medical thresholds, makes no diagnoses and is not for clinical use. It is not approved or certified by NASA.

## How to run it

1. Download or clone this repository.
2. Double-click `index.html`.

It opens in your web browser. There is nothing to install and no server or internet connection is needed: the logo, icons, demo data, styles and code are all inside that one file.

## What you can do in it

- **Personal Health Dashboard** — five panels, one per workflow, plus a strip for items that need review.
- **Vitals & Symptoms** — enter heart rate, blood pressure, respiratory rate, temperature and oxygen saturation; correct or reject readings; view trends; report pain; track follow-ups.
- **Sleep & Fatigue** — log sleep and naps, compare closed 24-hour windows with the demo target, record a fatigue check-in.
- **Hydration & Appetite** — log fluids in mL, L or US fl oz against the demo daily target; record appetite.
- **Exercise & Recovery** — view the read-only demo plan, log sessions, link recovery heart-rate readings, record exertion and recovery.
- **Well-being & Support** — a private, optional mood check-in.
- **SpaceDoctor Assistant** — the launcher in the bottom-right corner, with four paths (recent recommendations, emergency first aid, workflow help, about) and an Explain button on each chart.
- **Urgent assistance** — available from every page.

The demo clock is frozen at 15 November 2026, 14:00 UTC. What you enter is saved in your own browser only; **Reset demo data** in the left rail restores the original records.

## How it behaves

- Overlapping sleep entries are joined, so no minute is counted twice.
- Sleep is compared with its target only for a closed and complete window; an unfinished day of fluid logging is never assessed as a shortfall.
- No reference ranges are configured, so vital signs are shown without a "within range" label.
- Missing or skipped entries stay "unknown". They are never treated as zero or as healthy.
- Readings outside a plausible range are flagged for verification and kept out of headline values until checked.
- Corrections keep the earlier value and a reason, and appear in the change history.

## What this demo leaves out

This is a lighter build than the full v3 specification:

- No server, database, sign-in, permissions or offline sync queue.
- No AI chat. The Assistant answers from fixed rules and says free-text chat is unavailable.
- Routine reminders, support options and emergency procedures show "not configured", because no approved content was supplied for them.
- Features removed from v3 (medication and care, food and nutrient tracking, body mass, circadian planning, equipment analytics) are intentionally absent.

## Repository layout

| Path | What it is |
|---|---|
| `index.html` | The complete, ready-to-run app |
| `source/src/app.js` | Pages, forms, charts and the Assistant |
| `source/src/logic.js` | Shared calculations (sleep totals, fluid totals, exercise share, rule checks) |
| `source/src/styles.css` | Visual theme |
| `source/build.js` | Combines the source and the handoff assets into `index.html` |
| `source/test.js` | Checks the calculations against the handoff's expected results |

## Rebuilding after a change (optional)

You only need this if you edit the files under `source/`. It requires [Node.js](https://nodejs.org) and a copy of the `SpaceDoctor_Focus_Handoff_v3` package, which supplies the logo, icons, demo data and feature descriptions. That package is not included in this repository.

```bash
cd source
node build.js /path/to/SpaceDoctor_Focus_Handoff_v3 ../index.html
node test.js  /path/to/SpaceDoctor_Focus_Handoff_v3
```

`build.js` writes a new `index.html`; `test.js` runs the calculation checks and prints the number that passed.
