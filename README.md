# MoveGraph

A working interaction prototype inspired by Hayk’s experience living in seven cities over four years. Built for exploring design decisions for a Product Design Show & Tell.

## Run

Serve the static `dist` directory over HTTP, for example:

```sh
python3 -m http.server 4173 --bind 127.0.0.1 --directory dist
```

Open http://127.0.0.1:4173. No install or build step is required.

## Main interaction

1. Select any editable step in the dependency map. Narrow screens use the same tasks in a linear list.
2. Change its planned completion date in the inspector. The edit immediately starts a safe preview and reveals the comparison timeline, where flexible dates can also be dragged.
3. Follow the directional rule: earlier steps stay put; the selected step and its descendants recalculate.
4. A flexible date normally **follows dependencies**. Editing it creates a **date set by you** that stays pinned until it is changed or returned to automatic scheduling.
5. If an upstream change makes a pinned date impossible, the requested date remains visible, the earliest valid date is explained, and descendants remain blocked until the conflict is repaired.
6. Review and apply the change, then use **Undo change** to restore the prior plan. A delayed housing date still exposes two recovery plans for the fixed check-in.
7. Inspect **Compare local banking options** and decide whether the address should become a prerequisite. The suggestion is hidden from the default map because it is inactive; selecting the task reveals it for review.

The dependency map and inspector stay focused on the current plan. The comparison timeline appears only after an edit, when before-and-after context is useful. Fixed appointments can be rescheduled in the inspector but never move automatically. Completed steps and calculated milestones are read-only.

## Scope and provenance

The San Francisco–Berlin route, October 2026 dates, coordinator note, and dependencies are an illustrative scenario, not a record of Hayk’s actual move or official relocation requirements. Completed steps and travel bookings are fictional. Data is held in memory and resets on refresh. Applying a plan does not alter external bookings.

This prototype was developed with AI assistance. Scheduling uses explicit local rules, not a live AI model. It has no backend or API keys. Supported browsers expose WebMCP tools for reading the plan, staging dates, inspecting steps, returning eligible tasks to automatic scheduling, and discarding a preview. Applying a plan remains in the interface.

`dist/model.mjs` holds scheduling rules; `dist/app.js` holds shared state and interactions. Fonts load from Google Fonts with local sans-serif fallbacks.

## Validation

```sh
node --test tests/model.test.mjs
node --check dist/app.js
node --check dist/model.mjs
```

The model tests cover directional propagation, manual pins, automatic reset, visible conflicts, fixed appointments, suggested dependencies, recovery alternatives, mode-only changes, and invalid dates. UI validation covers later-step editing, conflict repair, preview/review/apply/undo, and responsive layouts.
