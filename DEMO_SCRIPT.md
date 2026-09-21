# Three-minute product demo

## Assignment fit

Use **Lens B: Make it click**. Present a personally meaningful problem and a working interaction as evidence of the design thinking. The recording should explain the problem, the design approach and decisions, how AI contributed, the most important interaction, and what would come next. Keep the unlisted YouTube video under three minutes.

This path demonstrates the qualities the Palantir role emphasizes: simplifying a data-dense system, designing the end-to-end interaction down to its recovery states, and explaining decisions and assumptions clearly enough to collaborate with product and engineering partners.

## Before recording

- Use a desktop browser at 100% zoom, ideally around 1440 × 900.
- Reload immediately before recording. Confirm the header says **Tokyo → San Francisco · Arrive 18 Oct**, the plan says **On track**, Housing is 10 Oct, and **Ready by 17 Oct** is visible.
- Housing is selected on load. Keep the cursor visible and move it deliberately.
- Use the date field rather than dragging the timeline; it is easier to follow in a short recording.
- Rehearse once so scrolling does not cover the object you are describing.

## Exact click sequence

| Time | Exact action | What the viewer should notice |
| --- | --- | --- |
| 0:00–0:28 | Do not click. Trace Housing → Address Pack → Check-in and Internet → Ready by 17 Oct. Point to **Arrive 18 Oct** in the header. | A move is modeled as dependencies. Readiness on the 17th is the hard deadline; arrival on the 18th is context. |
| 0:28–0:48 | In the Housing inspector, click **Planned completion**. Choose **12 October 2026**, then press Tab or click outside the field. | The provisional chain reveals why keeping every old gap would fail, then asks for the duration that was previously only an assumption. |
| 0:48–1:17 | Pause on **Same day**, **1 day later**, and **2 days later**. Point to the date, named grouped tasks, Internet timing, and check-in consequence on each card. Click **2 days later**, then click **Compare other options** directly beneath the outcome. Point out that Housing remains on 12 Oct, then click **2 days later** again. | The user can compare timing strategies without restarting the edit or changing the saved plan. The selected plan puts Address Pack and Internet on 14 Oct, requests Check-in on 15 Oct, caps the day at two tasks, and meets 17 Oct if the new slot is confirmed. |
| 1:17–1:38 | Scroll to the blue unsaved-change banner and click **Review change**. Pause on the before/after rows and the readiness result. Click **Apply this plan**. Scroll to the top and click **Undo change**. | The plan is reviewable before commit. Rebooking is still a request, and the entire change is reversible. |
| 1:38–1:58 | Click **Arrange home internet**. Change **Planned completion** from 14 to **15 October 2026**. Point to the deadline warning, then click **Use 14 Oct**. Click **Follow dependencies**. | A later task is editable, but 15 Oct would make the projected finish the 18th. Ready stays fixed on the 17th, the invalid plan cannot be applied, and one click restores the latest safe date. |
| 1:58–2:17 | Click **Compare local banking options**. Point to the dotted line and **Design hypothesis · inactive**. Click **Preview dependency**, then click **Reset preview** in the blue banner. | AI initially treated banking as independent. Hayk challenged that assumption because an address may affect which branches are practical, then kept the possible relationship reviewable. Previewing does not change the saved plan. |
| 2:17–2:50 | Scroll to the top and click **About**. Point to **Constraint hierarchy** and **How AI contributed** while delivering the final lines. Click **Back to the plan** to end. | The demo closes with the design rationale and returns to a trustworthy baseline. |

## Spoken script

**0:00–0:28 — Personal problem and system model**

“Hi, I’m Hayk. In four years, I’ve lived in seven cities, most recently moving from Tokyo to San Francisco. This is a tool I wish I’d had. A move looks like a checklist, but behaves like a dependency system. Housing unlocks an address pack, then check-in and internet. I arrive on October eighteenth, but I must be ready by the seventeenth. That deadline anchors the plan.”

**0:28–1:17 — Delay, decision, and parallel work**

“Housing was due on October tenth. Say confirmation slips two days. The provisional chain shows why keeping every old gap would fail. Then the app asks what it could not infer: does the address pack need the same day, one day, or two days? Each choice shows the dates and workload.

“I can compare the options without losing the staged housing date or changing my saved plan. I’ll keep the full two days. The planner groups the address pack and internet on the fourteenth and requests check-in on the fifteenth. The plan meets the seventeenth if that slot is confirmed, so the interface keeps the uncertainty visible. Parallel work is capped at two planned tasks in one day.”

**1:17–1:38 — Review, apply, and undo**

“Before committing, I can review every difference. Check-in remains a request because this prototype cannot change an external booking. I’ll apply the plan, then undo it. The change is explainable and reversible.”

**1:38–1:58 — Guard a later deadline**

“Later tasks are editable too. Moving internet to the fifteenth would make the work finish on the eighteenth. The app keeps readiness fixed, blocks that plan, and offers the latest safe date: October fourteenth. Then I return the task to automatic scheduling.”

**1:58–2:17 — Keep AI advisory**

“AI first treated banking as independent. I challenged that assumption because my address may affect which branches are practical. The possible link stays dotted and inactive until I review it. Previewing stages its effect without changing my saved plan.”

**2:17–2:50 — Process and next step**

“I used Codex to explore rules, prototype interactions, test edge cases, and critique the experience. The final logic is explicit: the deadline is fixed, spacing is negotiable, and tradeoffs are visible. Next, I’d test the timing choices with people planning real international moves, then use their needs to shape event creation and calendar integration.”

The spoken script is approximately 350 words. At 130–140 words per minute it runs about 2:30–2:42, leaving time for pauses and clicks while remaining under three minutes.
