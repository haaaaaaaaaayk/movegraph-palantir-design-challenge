# MoveGraph product review

## Product premise

MoveGraph turns a relocation checklist into a dependency model. It comes from Hayk’s experience living in seven cities over four years: moving tasks rarely fail in isolation, but ordinary checklists hide the consequences of a late prerequisite.

The prototype tests one focused question: **If housing confirmation is delayed by seven days, what shifts, what must stay fixed, and what decision gets the plan back on track?**

The dates, notes, and San Francisco–Berlin scenario are illustrative planning data. They are not official relocation requirements or a record of an actual booking.

## End-to-end walkthrough completed

1. **Understand the baseline.** The plan opens on track. Housing confirmation is due 3 October, the check-in is fixed on 8 October, the plan is ready on 10 October, and one AI-suggested dependency requires review.
2. **Inspect the system.** Selecting a node focuses its upstream and downstream connections and opens its date, source note, dependency rule, and unlocked tasks.
3. **Introduce a disruption.** “Try a 7-day housing delay” moves housing confirmation from 3 to 10 October. “Choose a date” opens the same simulation at the current date for free exploration. In either route, the date field, slider, day buttons, and draggable timeline point remain editable. The address pack and internet recalculate from the chosen date.
4. **Protect a fixed commitment.** The 8 October check-in does not silently move. It becomes a visible conflict because the address pack is not ready until 12 October. The readiness milestone becomes blocked.
5. **Compare recovery plans.** The prototype offers two explicit assumptions:
   - Option A keeps the housing date and requests a new check-in on 13 October. The plan is ready 17 October, leaving a one-day arrival buffer.
   - Option B keeps the existing appointment and secures housing confirmation by 5 October. The plan is ready 12 October, leaving a six-day buffer.
6. **Review the exact change.** Selecting an option reveals a before-and-after list. No option is preselected, so the interface does not imply a recommendation it cannot justify.
7. **Apply and recover.** Applying updates only the in-memory demo plan. A clear outcome replaces the conflict, and Undo restores the previous plan.
8. **Review AI input.** The bank step demonstrates a separate trust pattern: an AI-suggested link is visibly unverified and does not affect dates until the user accepts it. It can be dismissed or reopened.

## Self-critique before refinement

The first version was visually polished and functionally correct, but it made the user work too hard to find the story.

- The personal motivation was buried in the sidebar and About dialog.
- “Simulate a change” did not explain that it would introduce a seven-day delay.
- The initial viewport showed the graph, timeline, inspector, zoom controls, status, and progress at once.
- Recovery choices emphasized dates but not the decision’s most useful outcome: buffer before arrival.
- The first recovery option was already selected, creating an unexplained bias.
- A confirmation checkbox added ceremony even though applying only changed a reversible demo.
- The fixed-versus-flexible rule appeared only after a conflict.
- The bank suggestion was a strong trust moment, but its generic “Review connection” label competed with the main delay story.
- On narrow screens, the dependency map opened clipped horizontally.
- Toggle semantics on graph nodes caused assistive technology to announce ordinary task buttons as checkboxes.

## Feedback implemented

| Feedback | Product response |
| --- | --- |
| Make the value and personal connection immediate | The heading now connects the product to four years across seven cities and explains the shift/fixed/decision model. |
| Explain the scenario before acting | The primary action now says “Try a 7-day housing delay.” The simulation banner shows 3 Oct → 10 Oct. |
| Make manual exploration discoverable | A separate “Choose a date” action opens the editable date controls without first imposing the sample delay. Comparison stays disabled until the user actually changes the plan. |
| Reduce initial density | The timeline stays hidden until a scenario or applied decision makes comparison useful. Zoom controls and the noninteractive completion meter were removed. |
| Clarify the decision | Recovery titles use concrete dates, and each option foregrounds its arrival buffer and required external assumption. |
| Avoid accidental recommendation | Neither recovery is selected by default. The user must choose one before Apply becomes available. |
| Remove needless friction | The acknowledgement checkbox was replaced by a concise statement that this is a reversible demo and changes no external booking. |
| Keep system rules visible | The legend states that fixed dates move only when the user chooses. Revised commitments are labeled “Revised appointment.” |
| Show appropriate skepticism toward AI | The optional bank link is labeled as an AI suggestion, remains inactive by default, and can be accepted, dismissed, or reopened. |
| Improve mobile use | Narrow screens default to the linear Steps view while retaining the Map toggle. |
| Improve accessibility | Graph steps use ordinary button semantics, selected state is included in their accessible label, plan changes announce through a live status region, focus survives rerenders, and key controls and metadata are larger and higher contrast. |

## Current design principles

1. **Preview before commit.** A simulation is visibly separate from the saved plan.
2. **Never hide a broken dependency.** A fixed appointment becomes a conflict; it does not move silently.
3. **Make assumptions inspectable.** Every recovery path states what must be true for it to work.
4. **Keep AI advisory.** Suggested structure cannot change the schedule until a person accepts it.
5. **Show the consequence that matters.** Recovery choices are compared by both changed dates and time remaining before arrival.
6. **Make decisions reversible.** Every applied change can be undone immediately.

## Three-minute-ready product path

The product now supports one compact demonstration arc without requiring a separate presentation mode:

1. Personal problem and dependency map.
2. Seven-day housing delay.
3. Four propagated effects and one fixed-date conflict.
4. Two transparent recovery plans, compared by requirement and arrival buffer.
5. Apply and undo.
6. Optional close: review the AI-suggested bank connection to demonstrate human control.

The interface contains more depth for exploration, but the primary path is deliberately linear and can be completed without using zoom, dragging, or secondary controls.

## Why this prototype does not add arbitrary events

Adding a real event is a modeling flow, not a single text field. To calculate honest consequences, MoveGraph would need to collect:

- the step name and target date;
- whether its date is fixed or allowed to recalculate;
- one or more prerequisite steps;
- the amount of preparation time after each prerequisite; and
- whether the new relationship is confirmed or only suggested.

That capability is a logical next slice, but it is intentionally outside this focused show-and-tell. A superficial “Add event” button would imply flexibility without producing trustworthy propagation. The current prototype demonstrates the harder interaction first: explaining and resolving change across an existing dependency model.
