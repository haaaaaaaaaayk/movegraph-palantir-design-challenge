# Move-planning dependency prototype

A working interaction prototype inspired by Hayk’s experience living in seven cities over four years. It was created for a Palantir Product Design Show & Tell and uses a Tokyo-to-San Francisco move to explore a difficult planning question: when one date changes, what should move, what must stay fixed, and what decision belongs to the person?

## Run

Serve the static `dist` directory over HTTP:

```sh
python3 -m http.server 4173 --bind 127.0.0.1 --directory dist
```

Open http://127.0.0.1:4173. No install or build step is required.

## Scheduling rules

- **17 October is the hard ready-by deadline.** It never moves in response to a delayed task.
- **18 October is the booked arrival date.** It provides context for the plan; the schedule must already be ready on the 17th.
- A change propagates forward through active dependencies. Earlier and independent work stays unchanged.
- A person may pin a flexible task to a date. An impossible pin remains visible as a conflict rather than silently changing another commitment.
- The planner may compress work to at most **two planned preparation tasks on one day** when that is required to protect the deadline.
- A fixed appointment moves only after the interface explains that a new slot must be requested. The prototype never represents that request as a confirmed booking.
- Suggested AI relationships remain inactive until the person reviews them.

## Main interaction

The baseline is ready on 17 October for an 18 October arrival: Housing on the 10th, Address Pack on the 12th, Check-in on the 13th, and Internet on the 14th.

1. Select **Confirm your housing** and change its planned completion from 10 to 12 October.
2. Choose how much time the address pack needs: **Same day**, **1 day later**, or **2 days later**. Every available choice can meet 17 October, shows its date and named grouped workload, and makes any check-in request visible before selection.
3. Choose **2 days later** to preserve the full preparation time. The preview places Address Pack and Internet together on 14 October and requests Check-in on the 15th. The plan meets the fixed 17 October deadline if that external slot is confirmed. No day has more than two planned preparation tasks.
4. Select **Review change** to inspect the exact before-and-after dates, apply the plan, and use **Undo change** to restore the baseline.
5. Select **Arrange home internet** and move it from 14 to 15 October. The interface blocks the change because Internet must be complete by the 14th to preserve the ready-by deadline. Select **Use 14 Oct**, then **Follow dependencies** to return it to automatic scheduling.
6. Select **Compare local banking options** to inspect an AI-suggested address dependency. The dotted relationship is inactive; **Preview dependency** stages it, and **Reset preview** discards it.

The dependency map and inspector stay focused on the current plan. A comparison timeline appears only after an edit, with saved dates beside the preview. Narrow screens present the same tasks as a linear list. Completed steps and the ready-by deadline are read-only.

## Scope and provenance

The route, dates, coordinator note, and dependencies are an illustrative scenario. They are not a record of Hayk’s actual move or official relocation requirements. Completed steps and travel bookings are fictional. Data is held in memory and resets on refresh. Applying a plan does not alter external bookings.

This prototype was developed with AI assistance. AI helped structure the scenario, explore scheduling alternatives, identify edge cases, implement the prototype, and critique the interaction. The running schedule uses explicit local rules rather than a live model. It has no backend or API keys. Supported browsers expose WebMCP tools for reading the plan, staging dates, choosing address-pack timing, inspecting steps, returning eligible tasks to automatic scheduling, and discarding a preview. Applying a plan remains an explicit interface action.

`dist/model.mjs` holds the scheduling rules; `dist/app.js` holds shared state and interactions. The interface applies the supplied design system with a 1200px grid, an 8px spacing rhythm, neutral surfaces, restrained elevation, and semantic status colors. It requests Alliance No.1 and No.2 when installed and uses metric-controlled Arial fallbacks because no distributable Alliance files were included with the design reference.

## Validation

```sh
node --test tests/model.test.mjs
node --check dist/app.js
node --check dist/model.mjs
```

The model tests cover the fixed deadline and arrival date, the three address-pack timing choices, the two-task daily capacity, deadline guards, directional propagation, manual pins, fixed appointments, suggested dependencies, recovery alternatives, and invalid dates. UI validation covers the Housing 10→12 flow, review/apply/undo, the Internet 15 deadline guard and **Use 14 Oct** repair, the inactive banking suggestion, and responsive layouts.
