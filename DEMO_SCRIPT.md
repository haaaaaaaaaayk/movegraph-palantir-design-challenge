# Three-minute product demo

## Assignment fit

Use **Lens B: Make it click**. Present a personally meaningful problem and a working interaction as evidence of the design thinking. The recording should explain the problem, the design approach and decisions, how AI contributed, the most important interaction, and what would come next. Keep the unlisted YouTube video under three minutes.

This path demonstrates the qualities the Palantir role emphasizes: simplifying a data-dense system, designing the end-to-end interaction down to its recovery states, and explaining decisions and assumptions clearly enough to collaborate with product and engineering partners.

## What you actually changed

The pattern across the whole process was consistent: you used the prototype, found where it made an unjustified assumption, and turned that critique into an explicit product rule. You changed the product at four levels: the entry interaction, the scheduling model, the trust and recovery flow, and the visual hierarchy.

- **Chose a defensible problem.** You compared several directions and rejected Run Lens because it would require invented health data. The move planner came directly from living in seven cities over four years.
- **Reframed the product question.** The first concept asked the user to simulate a preset delay. You changed it to: when any date changes, what moves, what stays fixed, and what still needs a human decision?
- **Changed the interaction model.** You replaced the scripted seven-day simulation with direct date editing, made later tasks editable, and required changes to propagate forward rather than rewrite earlier events.
- **Defined a real constraint model.** You separated automatic, user-pinned, fixed-appointment, and fixed-deadline dates; made 17 October invariant; distinguished earliest valid dates from latest safe dates; capped planned work at two tasks per day; and kept appointment changes visibly unconfirmed.
- **Asked instead of pretending to know.** A Housing delay does not prove that the Address Pack needs the old two-day gap. You made the user choose zero, one, or two days and preview the workload and appointment consequences of each choice.
- **Challenged AI rather than accepting it.** AI initially treated Banking as independent. You renamed the task from choosing a bank to comparing options, argued that an address may affect the practical branch choice, and kept that relationship as a reviewable design hypothesis because it is not universally true.
- **Designed for trust and recovery.** You added Preview, Review, Apply, Reset, and Undo; kept impossible dates visible instead of silently overwriting them; and added **Compare other options** after discovering that the first timing flow was a one-way door.
- **Made the visualization earn its space.** You kept the dependency map, made the timeline appear only when there is a saved plan to compare with a preview, and exposed changes in dates, timing, and control.
- **Simplified the visual system.** You removed the MoveGraph branding, sidebar, decorative elements, repeated copy, and redundant controls, then applied the supplied Palantir `DESIGN.md` reference and adapted the experience for narrow screens and keyboard use.
- **Scoped event creation honestly.** You raised the need to add events, then recognized that a trustworthy event needs more than a title and date: it needs dependencies, timing, flexibility, ownership, capacity, and confirmation state. That became the next product slice instead of a superficial form.
- **Made the rules buildable.** The decisions became deterministic local scheduling rules with 20 model tests. That shows the ability to turn design rationale into behavior that product and engineering partners can inspect.
- **Used AI as a collaborator.** AI helped generate directions, model alternatives, implement the prototype, test edge cases, and critique iterations. You set the direction and challenged outputs that did not hold up.

## Before recording

- Use a desktop browser at 100% zoom, ideally around 1440 × 900.
- Reload immediately before recording. Confirm the header says **Tokyo → San Francisco · Arrive 18 Oct**, the plan says **On track**, Housing is 10 Oct, and **Ready by 17 Oct** is visible.
- Housing is selected on load. Keep the cursor visible and move it deliberately.
- Use the date field rather than dragging the timeline; it is easier to follow in a short recording.
- Rehearse once so scrolling does not cover the object you are describing.

## Exact click sequence

| Time | Exact action | What the viewer should notice |
| --- | --- | --- |
| 0:00–0:28 | Do not click. Point to **Tokyo → San Francisco · Arrive 18 Oct**, then trace Housing → Address Pack → Check-in and Internet → Ready by 17 Oct. | This is a dependency system built around a hard deadline, rather than a checklist. |
| 0:28–0:43 | In the selected Housing inspector, click **Planned completion**, choose **12 October 2026**, then press Tab or click outside the field. | A real date edit starts the scenario. The product asks for missing information instead of assuming every later task should move by two days. |
| 0:43–1:20 | Pause on the three choices. Click **2 days later**, point to the grouped work and requested Check-in, click **Compare other options**, then click **2 days later** again. Click **Review change**, show the before/after rows, click **Apply this plan**, and click **Undo change**. | The strongest interaction gets enough time to breathe: compare strategies, expose uncertainty, review before commit, and reverse the result. |
| 1:20–1:39 | Click **Compare local banking options** and point to the dotted relationship and **Design hypothesis**. | AI supplied the independent baseline; Hayk challenged it and kept his alternative reviewable rather than presenting it as fact. |
| 1:39–2:50 | Click **About**. Leave it open while explaining the iteration process and the division between AI speed and human judgment. Click **Back to the plan** at the end. | The product becomes evidence of critical thinking, interaction design, visual editing, and technical collaboration. |

## Spoken script

**0:00–0:17 — Personal problem**

“Hi, I’m Hayk. During university I lived in seven cities over four years. I could track tasks, but not how one delay affected the rest. So I built the tool I wish I’d had: dependencies, not a checklist.”

**0:17–0:28 — Example and system**

“This example maps a Tokyo-to-San Francisco move around one hard deadline: I arrive October eighteenth, so I must be ready by the seventeenth.”

**0:28–1:20 — Delay, choice, and reversibility**

“Say Housing slips from the tenth to the twelfth. The tool asks what it can’t know: how much time do I need for the address pack—zero, one, or two days?

“I’ll choose two. The pack and internet share the fourteenth, within my two-task cap, and check-in becomes an unconfirmed request for the fifteenth. I can compare options without losing my Housing change, review, apply, and undo. Editing a later task only affects what follows.”

**1:20–1:39 — Challenge AI**

“AI first treated banking as independent of my address. I challenged that because location can affect branch choice. Since that varies, I kept the link as a reviewable hypothesis.”

**1:39–1:55 — Choose the direction**

“I brainstormed several directions with AI, then filtered them against the brief, Palantir’s work, and my experience. I dropped Run Lens because without wearable data I’d be inventing evidence.”

**1:55–2:33 — Iterate through critique**

“The first version was crowded and scripted: a preset seven-day delay, only Housing was editable, and the timeline didn’t help. I replaced the simulation with direct date editing and forward-only propagation. I caught Ready landing on the nineteenth after an eighteenth arrival, so the seventeenth became fixed. I added a way back from preview, made the timeline compare plans, removed extra branding, and applied the supplied design reference.”

**2:33–2:50 — AI’s role and next step**

“AI sped up exploration, implementation, and rule testing; I set the direction and challenged outputs that didn’t hold up. The product uses explicit rules, not a live model. Next I’d test it with movers and learn what trustworthy event creation needs.”

The spoken script is approximately 303 words. At a conversational pace with the planned clicks and pauses, it should run about 2:40–2:50.
