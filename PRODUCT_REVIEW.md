# Move-planning prototype: product review

## Product premise

The prototype turns a relocation checklist into a dependency model. It comes from Hayk’s experience living in seven cities over four years: moving tasks rarely fail in isolation, but ordinary checklists hide what a changed date will affect.

The central question is: **When any planned date changes, what should move, what must stay fixed, and where does the person need to decide?**

The Tokyo-to-San Francisco route, dates, notes, and bookings are illustrative planning data. They are not official relocation requirements or a record of Hayk’s actual move.

## Constraint hierarchy

The revised scheduler makes three levels of constraint explicit:

1. **Ready by 17 October is a hard deadline.** The milestone stays on the 17th even when the projected work would finish later. A late projection blocks the plan instead of moving the hard deadline.
2. **Arrival on 18 October is fixed context.** The booked date explains why the readiness deadline matters, but it is not a task that propagation can move.
3. **Task spacing is negotiable.** After a delay, the person chooses the time a task actually needs. The planner may group at most two planned preparation tasks on one day to preserve the hard deadline.

Every editable task also exposes the source of its date:

- **Start date:** no controlling prerequisite, as with Housing.
- **Automatic:** the earliest valid date from active prerequisites and the chosen timing.
- **Pinned:** a date set by the person that stays fixed until changed or returned to automatic scheduling.
- **Fixed appointment:** moves only after an explicit request; the prototype never claims that the external booking changed.
- **Design hypothesis · inactive:** a possible relationship with no scheduling effect until accepted. In this case, the AI-generated baseline treated Banking as independent; Hayk raised the address relationship after challenging that assumption.

Propagation runs forward. Earlier tasks and independent branches remain stable. Impossible pins remain visible with the limiting dependency or deadline and block application until repaired.

## End-to-end walkthrough completed

1. **Read the baseline.** Housing is due 10 October, Address Pack follows on the 12th, Check-in is fixed on the 13th, Internet follows on the 14th, and the plan is ready on the hard 17 October deadline for arrival on the 18th.
2. **Edit the object.** Selecting an editable node opens one native date field. There is no separate simulation launcher.
3. **Delay Housing.** Moving Housing from the 10th to the 12th opens a decision before the scheduler commits to a chain reaction.
4. **State the missing assumption.** The interface asks how much time the Address Pack actually needs: the same day, one day later, or two days later. Each feasible card previews the exact date, any same-day workload, the check-in consequence, and readiness on the 17th.
5. **Compare feasible outcomes.** Same day keeps Address Pack on the 12th and the existing Check-in on the 13th. One day later places Address Pack on the 13th, groups Check-in and Internet on the 14th, and requests a new check-in slot. Two days later places Address Pack and Internet together on the 14th and requests Check-in on the 15th. All three options keep the peak load at two tasks and can meet the 17th; options that require rebooking remain conditional until the requested slot is confirmed.
6. **Choose the full two days.** This option demonstrates that the planner can preserve a realistic task duration by parallelizing compatible work while still meeting the hard deadline.
7. **Review, apply, and undo.** The review shows exact before/after dates and timing changes. Applying updates the in-memory demo plan. Undo restores the previous dates and scheduling modes.
8. **Guard a later task.** Moving Internet from the 14th to the 15th creates a deadline conflict because the plan needs three days after Internet to finish. The projected finish is the 18th, but Ready remains fixed on the 17th. **Use 14 Oct** supplies the latest safe date, and **Follow dependencies** removes the manual pin.
9. **Review a challenged AI assumption.** The AI-generated baseline treated Banking as independent. Hayk challenged that assumption because an address may affect nearby branches and the practical choice of provider. Because this is contextual rather than universally true, the alternative appears as a dotted, inactive relationship. The person can preview it or keep Banking independent before any change is applied.

## Feedback implemented

| Feedback | Product response |
| --- | --- |
| “Ready” cannot occur after move-in | Replaced the movable readiness result with a hard 17 October deadline. Late work now blocks the plan and shows its projected finish. |
| A Housing delay does not prove the Address Pack needs the same delay | Added a direct question with same-day, one-day, and two-day choices. The person supplies the missing duration assumption. |
| Recovery should use the remaining capacity intelligently | The scheduler can group compatible work, capped at two planned preparation tasks per day, and exposes that workload before selection. |
| A valid recovery must preserve readiness | Only options that finish by the 17th and stay within capacity are available. A post-deadline plan cannot be applied. |
| Fixed appointments should not shift silently | Any changed Check-in is labeled as a request that still needs confirmation. |
| A hypothetical seven-day action is counterintuitive | Removed the scenario launcher. Selecting a step and editing its date creates the preview directly. |
| Later events should be editable | Housing, Address Pack, Check-in, Internet, and Bank expose date controls. |
| A later edit should not rewrite the past | Propagation runs only downstream. Upstream and independent dates stay unchanged. |
| User-set dates need predictable behavior | Editing an automatic date creates a visible pin with a **Follow dependencies** action. |
| Conflicts should remain honest | Impossible dates stay visible with the earliest or latest valid date; the plan cannot be applied until repaired. |
| The timeline should teach the model | It appears after an edit, with saved dates shown beside the preview. |
| AI treated Banking as independent, but address context may matter | Hayk's alternative is shown as a dotted, inactive design hypothesis. Preview and apply remain separate human decisions rather than turning either assumption into an automatic rule. |
| Changes should feel safe | All edits are staged, reviewed before apply, and immediately undoable. |
| Mobile should remain usable | Narrow screens use a linear Steps view with the same editing and status information and no page-level horizontal overflow. |

## Current design principles

1. **Protect the declared outcome.** Ready by 17 October is invariant; a plan either meets it or needs repair.
2. **Ask for the assumption that changes the answer.** The Address Pack duration belongs to the person planning the move.
3. **Show the cost of compression.** Same-day work, grouped tasks, and rebooking requests appear before selection.
4. **Edit the object.** The event itself is the entry point to change.
5. **Propagate forward.** A downstream change never rewrites an earlier event.
6. **Preserve explicit intent.** Manual dates stay pinned until changed, reset, or shown to violate a dependency or deadline.
7. **Make provenance visible.** Each date states whether it is automatic, pinned, fixed, independent, complete, or a deadline.
8. **Treat AI output as a hypothesis.** The independent Banking assumption was challenged, and the alternative relationship cannot alter the schedule without review.
9. **Preview before commit.** Every change is staged, reviewable, and reversible.

## Three-minute-ready path

1. Introduce the personal problem: seven cities in four years taught Hayk that a move is a system rather than a checklist.
2. Establish Ready by 17 October as the hard deadline and the 18 October arrival as context.
3. Change Housing from the 10th to the 12th.
4. Compare the same-day, one-day, and two-day Address Pack choices.
5. Choose **2 days later**. Show Address Pack and Internet grouped on the 14th, the Check-in request on the 15th, and readiness on the 17th conditional on that external confirmation.
6. Review the exact change, apply it, and undo it.
7. Move Internet from the 14th to the 15th to demonstrate the deadline guard, then select **Use 14 Oct** and **Follow dependencies**.
8. Inspect the inactive address-to-banking relationship to show how Hayk challenged the AI-generated independent baseline while keeping the alternative reviewable.
9. Close with AI’s role in the process and the next research step.

The recording-ready click sequence and timed narration are in `DEMO_SCRIPT.md`.

## Why arbitrary event creation remains outside this prototype

Adding a real event is a modeling flow rather than a single text field. Honest propagation would need the step name, date meaning, fixed-versus-flexible behavior, prerequisite steps, timing after each prerequisite, daily capacity, and whether each relationship is confirmed or suggested.

That is the next product slice after research. This prototype first proves the critical interaction: changing dates across an existing dependency model while keeping a hard deadline, task capacity, and human decisions visible.
