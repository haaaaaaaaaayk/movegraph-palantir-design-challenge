# MoveGraph

A working interaction prototype inspired by Hayk’s experience living in seven cities over four years. Built for exploring design decisions for a Product Design Show & Tell.

## Run

Serve the static `dist` directory over HTTP, for example:

```sh
python3 -m http.server 4173 --bind 127.0.0.1 --directory dist
```

Open http://127.0.0.1:4173. No install or build step is required.

## Main interaction

1. Select **Simulate a change** to delay housing confirmation from October 3 to October 10.
2. Follow the affected dependencies. The fixed October 8 appointment stays in place and becomes a conflict.
3. Select **Compare ways forward**. Compare rebooking with obtaining earlier confirmation.
4. Acknowledge the selected scenario’s assumptions and apply it. **Undo change** restores the prior plan.
5. Inspect the bank task and accept or dismiss its suggested dependency. Suggested links do not alter the schedule until accepted.

The map, timeline, steps view, and detail panel share the same state. The date field, slider, buttons, and draggable housing date provide alternative inputs.

## Scope and provenance

The San Francisco–Berlin route, October 2026 dates, coordinator note, and dependencies are an illustrative scenario, not a record of Hayk’s actual move or official relocation requirements. Completed steps and travel bookings are fictional. Data is held in memory and resets on refresh. Applying a plan does not alter external bookings.

This prototype was developed with AI assistance. Scheduling uses explicit local rules, not a live AI model. It has no backend or API keys. Supported browsers expose four WebMCP tools for reading, staging, inspecting, and discarding a scenario. Applying a plan remains in the interface.

`dist/model.mjs` holds scheduling rules; `dist/app.js` holds shared state and interactions. Fonts load from Google Fonts with local sans-serif fallbacks.

## Validation

```sh
node --test tests/model.test.mjs
node --check dist/app.js
node --check dist/model.mjs
```

The model tests cover propagation, fixed appointments, independent tasks, suggested dependencies, recovery alternatives, late arrival readiness, and invalid dates. UI validation covers preview/compare/apply/undo and responsive layouts.
