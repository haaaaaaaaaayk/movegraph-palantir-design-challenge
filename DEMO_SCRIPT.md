# MoveGraph three-minute pitch

## Assignment fit

MoveGraph answers **Lens B: Make it click**. It turns a tangled relocation system into a legible, usable dependency model. It is also working software, which goes beyond the clickable-prototype requirement. The submission should feel like a pitch with a focused proof, not a tour of every screen.

## Recording setup

- Use a desktop browser at 100% zoom with the window about 1440 × 900.
- Reload immediately before recording so the original plan is visible and **Confirm your housing** is selected.
- Keep the cursor visible. Pause over changed nodes and recovery assumptions long enough for them to be read.
- Use the date field rather than dragging timeline markers; exact input is easier for viewers to follow.

## Exact click path

| Time | Action | What should appear |
| --- | --- | --- |
| 0:00–0:25 | Do not click yet. Introduce the personal problem and Lens B over the baseline map. | Tokyo → San Francisco, an on-track plan, and explicit dependencies. |
| 0:25–0:45 | **Confirm your housing** is already selected. Click **Planned completion**, choose **10 October 2026**, then press Tab or click outside the field. | Address pack and Internet move later. The fixed 8 Oct check-in becomes a red conflict. Readiness is blocked. The blue preview banner and timeline appear. |
| 0:45–1:20 | Click **Compare recovery plans** in the blue banner. Pause on both visible cards, then click only **Option A · keep earlier work**. | Both options expose their action, assumption, dates, and arrival buffer. Option A requests check-in on 13 Oct and leaves a one-day buffer. Option B requires housing by 5 Oct and leaves a six-day buffer. Selecting A reveals its exact before/after changes. |
| 1:20–1:35 | Click **Apply option A**, then click **Undo change** at the top right. | The rebooked plan saves without claiming an external booking changed; Undo restores every original date and mode. |
| 1:35–1:52 | Click **Arrange home internet**. Click its date field, choose **14 October 2026**, then press Tab. | Internet becomes pinned. Housing, address pack, and check-in stay unchanged; only readiness moves to 17 Oct. |
| 1:52–1:59 | Click **Follow dependencies** in the inspector. | Internet returns to 7 Oct and the preview closes. |
| 1:59–2:20 | Click **Compare local banking options**, point to the dotted edge, then click **Preview dependency**. | The illustrative AI suggestion changes only the staged draft. Point to **Review change**, then click **Reset preview**; commitment would require that separate review-and-apply step. |
| 2:20–2:55 | Leave the baseline on screen. Explain the concrete AI collaboration, the design decisions you retained, and the deterministic rules that keep the result inspectable. | The final frame is the clean, on-track plan. |

## Spoken script

**0:00–0:25 — Why and framing**  
“Over four years, I lived in seven cities. Every move looked like a checklist, but one late step could quietly break several others. For Palantir’s ‘Make it click’ lens, I built MoveGraph, a working dependency model for a Tokyo-to-San Francisco move. Change one date, see what follows, and keep control of the decision.”

**0:25–1:20 — The hard interaction**  
“I’ll move housing from October third to the tenth. Automatic tasks move forward, but the fixed check-in does not silently move. It becomes a visible conflict, and readiness is withheld because it can no longer be trusted. MoveGraph compares two recoveries: preserve later housing and request a new appointment, or preserve the appointment by securing housing earlier. Both show their assumption and arrival buffer before I commit.”

**1:20–1:35 — Safe commitment**  
“I’ll apply the first plan. This updates my plan; it does not pretend the appointment was rebooked. The whole decision is immediately reversible.”

**1:35–1:59 — Editing a later event**  
“A later edit behaves differently. If I pin Internet to October fourteenth, nothing upstream changes; only readiness moves. ‘Follow dependencies’ releases that boundary. Forward-only propagation makes direct editing predictable.”

**1:59–2:20 — Human judgment around AI**  
“During ideation, AI suggested that choosing a bank might depend on my address. I encoded that as unverified: dotted and inactive. Previewing changes only the staged draft; a separate review and apply would commit it. There is no live AI scheduler.”

**2:20–2:55 — Process and close**  
“I used Codex to generate alternatives, implement and test the dependency engine, and critique the interaction. I made the product calls: rejecting a generic seven-day simulator, enabling direct edits to later events, and requiring forward-only propagation, preview, and undo. The scheduler uses explicit local rules, so every outcome is explainable. With more time, I would add event creation and test with people planning real international moves. MoveGraph makes a tangled decision legible without taking agency away.”

This script is about 300 words. At a calm pace, it leaves time for the visual pauses and clicks while staying below three minutes.
