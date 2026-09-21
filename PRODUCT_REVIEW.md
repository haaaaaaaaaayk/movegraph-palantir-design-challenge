# MoveGraph product review

## Product premise

MoveGraph turns a relocation checklist into a dependency model. It comes from Hayk’s experience living in seven cities over four years: moving tasks rarely fail in isolation, but ordinary checklists hide what a changed date will affect.

The prototype now tests a broader and more useful question: **When any planned date changes, what moves after it, what stays put, and where does a person need to decide?**

The dates, notes, and San Francisco–Berlin scenario are illustrative planning data. They are not official relocation requirements or a record of an actual booking.

## Scheduling model

The product uses one date meaning for tasks: **planned completion**. Arrival is separately labeled as a deadline. This avoids treating a changed constraint as if work had already been rescheduled.

Every editable task is one of three types:

- **Source date.** It has no controlling prerequisite. Housing confirmation is the clearest example.
- **Follows dependencies.** It uses the earliest valid date produced by its prerequisites and stated buffer.
- **Date set by you.** Editing an automatic date pins it. Future upstream changes preserve that date until it becomes impossible.

Fixed appointments never move automatically. Completed tasks and calculated milestones are read-only.

Propagation is directional. A change affects the edited task and its descendants only. Earlier tasks and independent branches remain stable. If a pinned date is earlier than its dependencies allow, MoveGraph preserves the requested date as the user’s intent, shows the earliest valid date, and blocks downstream results until the conflict is repaired.

## End-to-end walkthrough completed

1. **Understand the baseline.** The plan opens on track. Housing is confirmed on 3 October, the check-in is fixed on 8 October, the plan is ready on 10 October, and one AI-suggested dependency requires review.
2. **Select the object first.** Any editable node, Step row, or flexible timeline marker opens the same date control. There is no separate simulation launcher.
3. **Edit a later task.** Moving Internet from 7 to 14 October creates a manual pin. Housing stays on 3 October, the Address Pack stays on 5 October, and Readiness moves to 17 October.
4. **Return to the system rule.** “Follow dependencies again” removes that pin and returns Internet to its earliest valid date, 7 October.
5. **Expose an impossible intent.** Pinning Internet to 6 October preserves the requested date, explains that 7 October is the earliest valid date, and blocks Readiness. The user can use the earliest date or return the task to automatic scheduling.
6. **Change an upstream source.** Moving Housing from 3 to 10 October shifts automatic descendants. The 8 October check-in remains fixed and becomes a visible conflict.
7. **Compare recovery plans.** Option A requests a new check-in on 13 October and leaves a one-day arrival buffer. Option B secures Housing by 5 October and leaves a six-day buffer. Neither option is preselected.
8. **Review, apply, and undo.** The before/after review includes date changes and scheduling-mode changes. Applying updates only the in-memory demo plan; Undo restores the prior dates and pin states.
9. **Review AI input.** “Compare local banking options” is initially independent, so research can happen before the exact address is ready. Selecting it reveals a dotted, inactive suggestion asking whether the address should become a prerequisite for comparing nearby branches.

## Feedback implemented

| Feedback | Product response |
| --- | --- |
| A hypothetical seven-day action is counterintuitive | Removed the scenario launcher. Selecting a step and editing its date now creates the preview directly. |
| Later events should be editable | Housing, Address Pack, Check-in, Internet, and Bank all expose date controls; flexible dates can also be dragged on the timeline. |
| A later edit should not rewrite the past | Propagation runs only downstream. Upstream and independent dates stay unchanged. |
| Upstream edits must still affect later work | Automatic descendants recalculate from their dependencies and buffers. |
| User-set dates need predictable behavior | Editing an automatic date creates a visible manual pin with a “Follow dependencies again” action. |
| Conflicts should remain honest | Impossible pins stay visible with their earliest valid date; descendants block until the conflict is repaired. |
| The timeline should teach the model | It is always visible and states: “Dates flow forward. Earlier steps stay put; dependent steps recalculate.” Saved dates remain as dashed ghosts during a preview. |
| Direct manipulation needed a precise alternative | Flexible dates support timeline drag; every editable task has one native date field for keyboard and exact input. Redundant sliders and plus/minus controls were removed. |
| Fixed dates should not shift silently | The check-in is not draggable and is labeled as a fixed appointment. Rescheduling is explicit in the inspector. |
| AI structure should remain advisory | Inactive suggestions are omitted from the default dependency map. Selecting Banking reveals the proposed link, explains why the address may matter, and lets the user preview its consequence before applying it. |
| Mobile should remain usable | Narrow screens start in the linear Steps view, keep date-edit cues, and have no page-level horizontal overflow. |
| Changes should be safe | All edits are staged, reviewed before apply, and immediately undoable. |

## Current design principles

1. **Edit the object, not a separate mode.** The event itself is the entry point to change.
2. **Propagate forward only.** A downstream change never rewrites an earlier event.
3. **Preserve explicit intent.** Manual dates stay pinned until changed, reset, or shown to be impossible.
4. **Make provenance visible.** Each date states whether it is automatic, set by the user, fixed, independent, or calculated.
5. **Never hide a broken dependency.** Conflicts remain visible and block conclusions that cannot be trusted.
6. **Keep AI advisory.** Suggested structure cannot change the schedule until a person accepts it.
7. **Preview before commit.** Every edit is staged, reviewable, and reversible.

## Three-minute-ready product path

1. Open with the personal problem: seven cities in four years taught Hayk that a move is a system, not a checklist.
2. Select Housing and change 3 October to 10 October.
3. Show the automatic Address Pack and Internet dates moving while the fixed check-in stays on 8 October and becomes a conflict.
4. Compare the two transparent recovery plans by required action and arrival buffer.
5. Apply one option and undo it.
6. Select Internet, move 7 October to 14 October, and show that earlier dates stay unchanged while Readiness moves to 17 October.
7. Use “Follow dependencies again” to remove the pin.
8. Optional closing trust moment: inspect the inactive address-to-banking suggestion and decide whether research should remain independent.

## Why arbitrary event creation remains outside this prototype

Adding a real event is a modeling flow, not a single text field. Honest propagation would need the step name, date meaning, fixed-versus-flexible behavior, prerequisite steps, buffer after each prerequisite, and whether each relationship is confirmed or suggested.

That is a logical next slice. This prototype focuses on the interaction that must work first: changing dates across an existing dependency model without silently rewriting the user’s plan.
