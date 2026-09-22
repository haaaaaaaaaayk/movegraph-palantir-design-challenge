# Move-planning prototype: design process

This is interview and demo preparation for the Palantir Product Design Show & Tell. It documents the actual iteration path: what the first prototype assumed, what Hayk challenged while using it, what changed, and how AI contributed. The dates and move details in the prototype are illustrative. No external user study was conducted for this exercise.

The exact first working build is preserved in `archive/first-prototype/` from commit `d86a5ab`, so the demo can show the original interaction beside the current product rather than reconstructing a before state.

## Why this was the right problem

The brief asks candidates to use AI to build something personally meaningful and explain the problem, decisions, challenges, and AI collaboration in a three-minute video. I chose **Lens B: Make it click** because the strongest opportunity was not another dashboard; it was making a tangled decision system understandable.

I explored several directions first. An art-logistics tool could use museum data, but it was less connected to the operational decisions in Palantir's work. Run Lens had a real personal hook - my heart rate felt higher when I ran in San Francisco - but without wearable data I would have had to invent the evidence. The move-planning concept was both authentic and structurally relevant. In four years I lived in seven cities, and I knew the frustration of learning that one delayed step can quietly invalidate several later plans.

The product question became:

> When any date changes, what should move, what must stay fixed, and where does the person need to decide?

That framing let me demonstrate three skills central to the role: simplifying a complex, data-dense system; designing precise interactions and states; and explaining decisions clearly enough to work with product and engineering partners.

## How the design changed

| Iteration | What I saw or challenged | Design decision | Skill demonstrated |
| --- | --- | --- | --- |
| **1. Model the move as a graph** | A checklist shows tasks, but it hides why dates move together. | I represented the move as connected objects: Housing unlocks an Address Pack; the pack constrains Check-in and Internet; those tasks lead to readiness. | Systems thinking and information architecture. |
| **2. Build a first working story** | The first version used a preset seven-day Housing delay, highlighted affected links, held a fixed appointment in place, and offered recovery plans. It proved the model, but the experience began with the prototype's scenario rather than the person's intent. | I kept preview, review, apply, and undo as the safety structure, then reconsidered how a change should begin. | End-to-end prototyping and safe decision design. |
| **3. Make the initial view legible** | The early screen showed a sidebar, graph, timeline, inspector, status, controls, and decorative story elements at once. Recovery choices also carried an unexplained default and extra confirmation ceremony. | I hid comparison until it was useful, removed that unexplained recovery default and redundant confirmation step, clarified fixed versus flexible dates, and improved focus, labels, contrast, and the narrow-screen Steps view. | Visual hierarchy, accessibility, and self-critique. |
| **4. Remove the artificial simulation** | While using the product, I found “simulate a seven-day delay” counterintuitive. A person already knows which event changed; they should edit that event. | I removed the separate launcher. Selecting a task now exposes one precise date field, and an edit immediately creates a staged preview. | Direct manipulation and simpler interaction design. |
| **5. Let later events change too** | Housing was initially the only meaningful input. That implied every problem starts upstream and made the product feel scripted. | Housing, Address Pack, Check-in, Internet, and Banking became editable. Changes propagate only forward: editing a later task does not rewrite earlier history. | Directional logic and respect for user intent. |
| **6. Explain who controls each date** | Automatic recalculation becomes untrustworthy when a user cannot tell why a date moved. A later task date may also change independently. | Dates now expose provenance: start date, automatic, user-pinned, fixed appointment, complete, or deadline. A manual date remains pinned until the person changes it or chooses **Follow dependencies**. Impossible pins remain visible and block application. | State design, microcopy, and edge-case reasoning. |
| **7. Challenge the banking assumption** | The AI-generated baseline treated Banking as independent of the address. I challenged that: an address can affect which branches are nearby and which option is practical, so applying before Housing is confirmed can be counterintuitive. This is not universally true, especially for online banking. | I turned my alternative into a reviewable hypothesis rather than a rule. The address relationship is dotted; a person can preview it or keep Banking independent before anything changes. | Critical judgment, AI skepticism, and communicating uncertainty. |
| **8. Remove decoration and apply a system** | The product still looked like a branded concept page. The sidebar, MoveGraph logo and name, ornamental elements, repeated copy, and extra controls competed with the decision. | I removed the brand chrome and kept a compact route header, graph, inspector, contextual timeline, and status. I then applied the supplied system: a 1200px grid, 8px spacing rhythm, neutral surfaces, restrained elevation, near-square controls, and semantic status colors. The route changed to Tokyo → San Francisco to match my story. | Visual editing, consistency, and purposeful restraint. |
| **9. Correct the core scheduling logic** | A preview could say “Ready” on 19 October even though arrival was on the 18th. That was logically unacceptable. | I made **Ready by 17 October** an invariant deadline and kept arrival on the 18th as fixed context. A late task now creates a conflict, shows the projected finish, blocks Apply, and offers the latest safe date where possible. | Critical reasoning and constraint design. |
| **10. Ask instead of inventing a duration** | Moving Housing from the 10th to the 12th does not prove the Address Pack needs the same two-day gap. Automatic propagation was making a decision the product could not know. | The interface asks whether the pack needs the same day, one day, or two days. Each option previews exact dates, grouped work, and any Check-in consequence. The planner may place compatible work in parallel, capped at two planned tasks per day. A changed appointment remains a request until confirmed. | Human-centered decision support and transparent tradeoffs. |
| **11. Restore comparison after a choice** | After selecting one timing option, the preview became a one-way door. I could not return to inspect the other two without restarting. | I added **Compare other options** beside the selected outcome and in the unsaved-change banner. It reopens the choices while preserving Housing on 12 October and leaving the saved plan untouched; the previously previewed option remains identifiable. | Recovery design, reversibility, and interaction completeness. |

## How I used AI

AI was useful because I treated it as a fast collaborator, not the product owner.

- **Divergence:** AI helped generate and compare project directions against the brief, Palantir's operational domains, and my personal experience.
- **Problem modeling:** It helped turn relocation tasks into a graph, enumerate date states, and explore recovery paths and scheduling edge cases.
- **Prototyping:** It translated decisions into a working HTML, CSS, and JavaScript prototype, responsive states, copy, and deterministic scheduling rules.
- **Critique and verification:** I asked it to walk the experience as a product designer, inspect failure states, test the rule model, and revise the three-minute path.
- **Documentation:** It helped keep the interaction rules, demo sequence, and limitations explicit as the product changed.

My role was to decide whether the output made sense. The most revealing moments came from disagreement: I rejected a concept that would require fabricated running data, removed the arbitrary seven-day interaction, demanded later-task editing, challenged the AI's independent Banking assumption, caught the post-arrival readiness error, constrained daily workload, and asked for a way back after previewing one option. The final experience is therefore evidence of judgment applied to AI output, not acceptance of whatever the model generated first.

The product itself does not use a live model. Its schedule is driven by explicit local rules so every date can be explained and tested. AI helped design and implement those rules; it does not make hidden runtime decisions for the user.

## Why this demonstrates fit for the role

### 1. Interaction and visual design for complex systems

The final interface makes several kinds of state visible without requiring the person to understand the scheduling engine: active relationships and reviewable design hypotheses, automatic and pinned dates, fixed appointments, deadline conflicts, provisional requests, saved and previewed plans, and undo. The visual design was simplified until those distinctions carried the screen.

### 2. Critical, iterative problem solving

Each major revision came from finding a contradiction in use, not polishing a fixed concept. I changed the entry model, propagation rules, constraint hierarchy, workload policy, and recovery flow when the behavior did not match how a real decision should work. The Banking example also shows that I can question AI while preserving uncertainty instead of replacing one unsupported rule with another.

### 3. End-to-end ownership and technical communication

I moved from problem selection through interaction rules, visual system, implementation, tests, responsive behavior, and a concise demo. Decisions were expressed as rules an engineer could implement: propagation runs forward; a pin preserves explicit intent; readiness is fixed; daily capacity is two; appointments never silently rebook; preview does not mutate the saved plan. That translation from rationale to product behavior is the core collaboration skill I want to show.

## Evidence and honest limits

The process used the assignment brief, the supplied role description and Palantir offering list, my lived experience, repeated task walkthroughs, visual critique, and automated rule tests. It did **not** include interviews or usability sessions with other movers, and the scenario dates are illustrative.

With more time, I would test three questions with people planning international moves:

1. Do people understand automatic, pinned, and fixed dates, as well as reviewable design hypotheses, without explanation?
2. Do the three timing choices support a real decision, or should the product ask for a custom duration and capacity?
3. What information is required to add a new event honestly - fixed versus flexible behavior, prerequisites, timing, ownership, and external confirmation?

That research should shape event creation and calendar integration. I deliberately left arbitrary event creation outside this prototype because a title and date alone would imply reliable propagation without collecting the rules needed to make it trustworthy.

## Concise interview version

“I started with a visually polished dependency dashboard and a preset seven-day housing delay. When I used it, I realized the interaction was scripted: only Housing really changed, later task dates were not editable, and the model could move ‘Ready’ past arrival. I used AI to prototype quickly and enumerate alternatives, but I treated every output as a hypothesis. I replaced the launcher with direct date editing, added forward-only propagation and explicit pins, made 17 October a hard deadline, and asked the user to choose the Address Pack timing instead of inventing it. I also challenged AI's assumption that Banking was independent of the address, but kept my alternative as a reviewable relationship because it is not universally true. Finally, I removed the decorative chrome and added a way to compare timing options without losing the staged change. The result shows how I simplify a complex system, reason through edge cases, and turn design rationale into testable product behavior.”
