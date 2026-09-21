# Three-minute move planner video

## What the assignment asks for

Use **Lens B: Make it click**. Present this as a pitch for a personally meaningful solution, while showing the working product as proof. The video must explain the problem, the design approach and decisions, the role of AI, the most important interaction, and what you would do next. Keep the unlisted YouTube video under three minutes.

## Before recording

- Use a desktop browser at 100% zoom, ideally around 1440 × 900.
- Reload immediately before recording. The plan should say **On track**, with Housing on 10 Oct and arrival on 18 Oct.
- Keep the cursor visible and move it deliberately. Do not read every label on screen.
- Use the exact date field for the demo. The timeline drag interaction exists, but the field is clearer on video.

## Exact actions

| Time | What to do | What the viewer should notice |
| --- | --- | --- |
| 0:00–0:32 | Do not click. Briefly trace the three stages and their arrows. Point to **Start date**, **Automatic**, **Fixed appointment**, **Suggested · inactive**, and **Calculated**. | The graph exposes dependencies and the source of each date. The header keeps the 18 Oct arrival visible. |
| 0:32–1:03 | Housing is already selected. Click **Planned completion**, choose **12 October 2026**, then press Tab. Scroll just enough to show **Timeline preview**, then return to the blue banner. | Address Pack moves 12 → 14 Oct; Internet moves 14 → 16 Oct. The 13 Oct fixed check-in becomes a conflict. Arrival stays on 18 Oct. Saved and preview dates remain visible together. |
| 1:03–1:38 | Click **Compare recovery plans**. Pause on both cards, then click **Option A · keep earlier work**. | Option A requests check-in on 15 Oct and makes Readiness 19 Oct, one day after arrival. Option B restores Housing to 10 Oct and keeps a one-day buffer. Each assumption is explicit. |
| 1:38–1:53 | Click **Apply option A**, then click **Undo change** at the top right. | The app records **Rebooking needed**; it does not claim a booking changed. Undo restores all dates and modes. |
| 1:53–2:12 | Click **Arrange home internet**. Change its date from 14 to **16 October 2026**. Then click **Follow dependencies**. | Earlier work stays put; only Readiness moves to 19 Oct. Internet stays pinned until it returns to automatic scheduling. |
| 2:12–2:31 | Click **Compare local banking options**. Point to the dotted edge, click **Preview dependency**, point to **Review change**, then click **Reset preview**. | The illustrative AI suggestion is inactive by default. Preview changes only the draft; saving still requires review and apply. |
| 2:31–2:56 | Leave the restored baseline visible while explaining how Codex was used and what you would build next. | End on a calm, on-track plan. |

## Spoken script

**0:00–0:32 — Personal problem and product model**

“Hey, I’m Hayk. Over four years I lived in seven cities, most recently moving from Tokyo to San Francisco. This is the tool I wish I’d had. A move looks like a checklist, but behaves like a dependency system. Housing unlocks an address pack, which unlocks check-in and internet. My flight is booked for October eighteenth, so arrival is a fixed constraint.”

**0:32–1:03 — A two-day delay**

“Housing is due October tenth. Let’s say it slips two days. I edit that event to the twelfth. The address pack moves from the twelfth to the fourteenth, and internet moves to the sixteenth. Check-in stays fixed on the thirteenth, so the app surfaces a conflict. Readiness is blocked, while the timeline preserves the saved dates beside my preview.”

**1:03–1:53 — Decide, apply, and undo**

“Now I can compare two recovery plans. I can keep the delay and request check-in on the fifteenth, becoming ready one day after arrival. Or I can protect the appointment by securing housing on the tenth, restoring a one-day buffer. Each option states its assumption before I commit. I’ll apply the first. It records that rebooking is needed; it doesn’t pretend the booking changed. Undo restores the plan.”

**1:53–2:12 — Change a later event**

“A later deadline can change too. I pin internet to the sixteenth; earlier steps stay untouched, and only readiness moves. ‘Follow dependencies’ releases my override. Changes flow forward, not backward.”

**2:12–2:31 — Keep AI advisory**

“AI suggested that choosing a bank might depend on my address. I kept that link dotted and inactive. I can preview it, but saving still requires my review and approval. The person remains in control.”

**2:31–2:56 — How AI helped and what is next**

“I used Codex to explore alternatives, implement and test the dependency engine, and critique the interaction. I chose to remove the confusing seven-day simulation, let people edit planned steps directly, and add preview and undo. The scheduling logic stays explicit and explainable. Next, I’d add event creation and test this with people planning real international moves.”

The spoken script is 310 words, leaving a buffer for pauses and clicks while staying below three minutes at a natural pace.
