# Engine Triage — Post-Antigravity Damage Report

*Audited Jun 10, 1:17–1:30pm against `familiar-dark-game-plan.md`,
`the_familiar_dark_plot.md`, and git HEAD. Static analysis only — runtime
verification still needed for items marked ⚠.*

---

## 0. CRITICAL: files changed DURING this audit

`src/components/PlayMode.tsx` was rewritten on disk at **13:18** (84KB → 128KB)
*while the audit was running* — it went from the antigravity combat-overhaul
version to a much fuller version that includes Q/E camera rotation, schedules,
and containers. **Something (likely an Antigravity session still open) is
actively writing to this project.** Close every other AI/agent session before
touching anything, then commit immediately. Nothing in this repo is committed —
the entire working tree (~6,000 changed lines) is one bad `git checkout` away
from being unrecoverable.

---

## 1. What's PRESENT and looks intact (current files, compiles clean)

| System | Status | Evidence |
| --- | --- | --- |
| **Q/E camera rotation** | ✅ restored (13:18 file) | `cameraQuarterTurns` state, `case "q"`/`case "e"` handlers, damped azimuth in `IsometricCameraRig` — perspective iso, quarter-turn snaps, camera-relative grid movement |
| **Cutscene runtime** | ✅ | 27 of 30 action verbs executed in PlayMode (`screen_fade`, `camera_pan`, `branch`/`label`, `move_entity`, `teleport_player`, `set_player_sprite`, `advance_clock`, `learn_skill`, `set_entity_hidden`, `modify_player_stats`, etc.) |
| **Document reading** | ✅ | `read_document` action handled, `activeDocumentId` overlay, `read_documents` save tracking |
| **NPC schedules runtime** | ✅ (13:18 file) | Schedule entries sorted by hour, applied via `placement.schedule` (PlayMode:148, 1594) |
| **Inventory / skills / save menu / shops / containers / party / faction rep** | ✅ | Full UI overlays + store actions present |
| **Game clock** | ✅ | `clock_minutes`, `advance_clock`, time-of-day conditions |
| **Town story content** | ✅ present | 26 dialogues, 12 cutscenes, 17 entities, 5 items, 1 quest in `familiar_dark_content.ts`; town map wires `cut_arrival`, `cut_office_briefing`, `cut_gaol_entry`, `dia_nessa_bars`, `dia_mouthstone`, etc. **Zero dangling ID references.** |
| **Maps** | ✅ 2 built | `map_town` (57×73) + `map_network_upper` (45×35, Pagan Network) |
| **Sprites & models** | ✅ | Full-res hero/Nessa/Aldric data_url sprites; presets intact |
| **Build health** | ✅ | `tsc --noEmit` clean, `vite build` succeeds |

---

## 2. What's MISSING or BROKEN

### 2.1 Orphaned combat overhaul (dead code) — decide: remove or rewire
Antigravity's turn-based combat lives in `playStore.ts` (`in_combat`,
`combat_queue`, `startCombat`, `advanceTurn`) and `GameRenderer.tsx`
(blue/red turn rings) — but the restored PlayMode **never calls
`startCombat`**. The whole system is unreachable. The old bump-attack path is
what runs. The ring-rendering code reads `saveData.in_combat` every frame for
nothing.
- **Risk:** mixed-session files (`PlayMode` 13:18 vs `GameRenderer`/`playStore`
  12:50–12:51). They compile together but were not written together.
- **Action:** either strip the combat fields/rings, or port the combat trigger
  back into PlayMode deliberately. Do not leave it half-wired.

### 2.2 Journal / codex UI — never existed, still missing
No journal, quest log, or re-readable document UI anywhere (current or git
HEAD). `save.ts` tracks `read_documents` "for the journal" but nothing consumes
it. Plan §10 sizes this M and says to fake it with the office Case File
pattern; the case-file interact trigger is **not** in `town_gen.ts` either.

### 2.3 `play_sound` — schema verb exists, no handler
Defined in `EventActionSchema` but not executed in PlayMode (known §10 gap).
`play_music` works via `audioManager`. One-shot SFX path still needed.

### 2.4 `start_combat` / `custom` actions — schema verbs with no handlers
Same situation as `play_sound`.

### 2.5 Content vs. plan budget — Acts 2–3 simply not built yet
This is **unbuilt work, not damage**, but listing so nothing is presumed lost:

| Asset | Plan target | Current | Gap |
| --- | --- | --- | --- |
| Maps | 7 | 2 (`map_town`, `map_network_upper`) | `map_network_depths`, `map_drowning_pool`, `map_sunken_shrine`, `map_flashback`, `map_pagan_lands` |
| Dialogues | ~38 | 26 | Act 2/3 + NPC act-variants |
| Cutscenes | ~26 | 12 | Scenes 8–19 (widow, flashback, witness-rite, verdict, endings) |
| Documents | ~15 | 4 (`doc_field_note`, `doc_gaol_ledger`, `doc_standing_orders`, `doc_writ`) | ~11 lore/evidence docs |
| Evidence items | ~12 | 5 | rite fragments, Mara's hair, widow's token, house tokens, glass log |
| Quests | 4 (one per zone) | 1 (`quest_investigate`) | 3 |

### 2.6 Spine flags — only Act 1 wired
`act1_assigned` etc. appear in content; Act 2/3 spine flags
(`act2_widow_met`, `act3_rite_done`, `verdict_given`, endings) have no setters
because their scenes don't exist yet.

---

## 3. Stability pass — movement jitter ⚠

Could not reproduce at runtime yet (needs the dev server + manual play), but
static suspects, in probability order:

1. **Mixed-version files.** PlayMode (13:18), GameRenderer (12:51), playStore
   (12:50) come from different sessions. The movement feel depends on three
   tuned constants agreeing across two files:
   `TILE_SLIDE_SPEED = 8.5` (GameRenderer), `PLAYER_STEP_READY_DISTANCE = 0.18`
   and the `MOVEMENT_REPEAT_*` intervals (PlayMode). If antigravity retuned
   either side, held-key movement hitches between tiles (input is gated on the
   *rendered* player being within 0.18 of the logical cell — if slide speed or
   repeat interval changed, the gate stalls every step).
2. **Enemy-proximity repeat suppression.** `isEnemyNearby` disables
   hold-to-move repeat near any living hostile — movement becomes
   one-tap-one-step there *by design*. If jitter only happens near enemies,
   this is it (it's a combat-era leftover; the turn-based system it served is
   now orphaned, see 2.1).
3. **Double camera writers.** PlayMode's `IsometricCameraRig` writes
   `camera.position` every frame; verify no `OrbitControls`/other rig is also
   mounted (the 12:51 PlayMode had OrbitControls; the 13:18 one does not —
   stale HMR state could briefly run both until hard refresh).

**Test protocol:** hard-refresh (Cmd+Shift+R) on http://localhost:5173, hold a
movement key for 10 tiles in the open, then again adjacent to a hostile, then
rotate with Q/E mid-walk. Note which of the three cases stutters.

---

## 4. Recovery & hardening order (triage priority)

1. **Stop the bleeding** — close any other agent/AI session writing to this
   folder. Verify file mtimes stop changing.
2. **Commit everything now** (`git add -A && git commit`) — snapshot before any
   fix. Tag it `post-antigravity-triage`.
3. **Runtime smoke test** — town loads, ceremony cutscene plays, gaol dialogue
   branches, document overlay opens, Q/E rotates, schedules move NPCs as clock
   advances.
4. **Resolve the orphaned combat system** (2.1) — strip or rewire. This also
   likely fixes/removes the enemy-proximity movement weirdness (3.2).
5. **Movement feel pass** (3.1) — retune the three constants together if jitter
   confirmed.
6. **Then** resume the plan: P0 leftovers (`play_sound`), journal-as-Case-File
   trigger, Act 2 content.

---

## 5. Known-good reference points

- **Git HEAD (`68097ba`)** — pre-antigravity engine: has OrbitControls 3D/ISO
  toggle camera (different from the Q/E design), no combat overhaul, no
  schedules runtime. Useful for diffing, *not* a restore target.
- **Current working tree** — fullest feature set, uncommitted.
- `~/.gemini/antigravity/brain/7f0f2dc6-*/walkthrough.md` — antigravity's own
  description of the combat overhaul it added, if rewiring it is ever wanted.
