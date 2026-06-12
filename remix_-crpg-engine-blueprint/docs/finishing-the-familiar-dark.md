# Finishing The Familiar Dark — Execution Plan

*Written Jun 11, 2026, against v0.8.0 (commit `948db680`). This is the
working document for taking the game from "Act 1 vertical slice" to
"shipped." It supersedes the phase table in `familiar-dark-game-plan.md`
(which remains canon for design intent) and assumes the reader is a fresh
session with no memory of how we got here. Companion docs:
`the_familiar_dark_plot.md` (story canon), `ai-authoring-guide.md` (engine
reference), `familiar-dark-game-plan.md` (design rationale).*

---

## 0. Ground rules (read before touching anything)

1. **Multiple AI agents edit this repo.** Files drift between sessions.
   Re-read any file immediately before editing it. Never edit from memory
   or from a summary.
2. **Commit at every green checkpoint.** A checkpoint is: `tsc --noEmit`
   clean + `vite build` clean + the relevant beat verified in the browser.
   Verification commands (run in `remix_-crpg-engine-blueprint/`):
   ```
   export PATH="/opt/homebrew/bin:$PATH"
   ./node_modules/.bin/tsc --noEmit
   ./node_modules/.bin/vite build
   ```
   Preview server: launch config `crpg-engine` (port 5179).
3. **Bump `metadata.version` whenever seed content changes** in a way old
   flags would corrupt (it wipes saves by design — correct between phases).
   Current: `0.8.0`. Suggested: P2 → 0.9.x, P3 → 0.10.x, town pass →
   0.11.x, ship candidate → 1.0.0.
4. **All cross-references are unvalidated strings.** Every `cutscene_id`,
   `dialogue_id`, `entity_id`, `item_id`, `document_id` you write in a map
   generator MUST exist in `familiar_dark_content.ts` / `game.ts` in the
   same commit. The Act 1 slice broke three times because a generator
   referenced content another session had deleted. Grep before you commit:
   every `cut_`, `dia_`, `ent_`, `itm_`, `doc_` id used in `*_gen.ts` must
   have a definition.
5. **The runtime test pattern** (fast story-beat testing without playing
   from the start): the run save is zustand-persist JSON at localStorage
   key `crpg-run-save` (`raw.state.saveData`). Stage `current_map_id`,
   `player.cell`, and `flags`, reload, Play → Continue Game. Spine flags
   are listed in §9.
6. **The one rule from the plan doc still governs scope:** every scene must
   change what the player believes about Nessa, Aldric, or the world.
   Anything that doesn't gets cut without discussion.

---

## 1. Where the game stands (verified, v0.8.0)

### Systems — working and runtime-verified
- **Turn-queue combat**: engages within `THREAT_RADIUS` (6), initiative by
  speed, player → party → enemies in sequence; the player commands Aldric
  on his turn (movement, bump attack, his three unique skills); enemies
  resolve on a 340 ms beat; disengage past `CHASE_RADIUS` (8); fleeing
  through a map exit ends combat. Turn banner, initiative strip, party
  panel, per-actor hotbar, damage popups, hit flashes, hurt vignette.
- **Overworld simulation**: energy pump (suspended in combat), game clock,
  NPC schedules, chase AI, music switcher (combat ⇄ ambient with restore).
- **Story machinery**: cutscene runner (27 verbs incl. `teleport_player`,
  `branch`/`label`, `screen_fade`, `camera_pan`, `modify_player_stats`,
  `learn_skill`, `set_entity_hidden`, `advance_clock`), condition layer
  (`ConditionSchema`) on dialogue options / triggers / shops, multi-trigger
  cells (first *eligible* fires), on_load triggers that defer to running
  cutscenes, save slots, containers, ground items, documents, shops,
  faction rep, class system (Scholar/Warrior/Mystic via ceremony).
- **Authoring**: two hand-sculpted mesh kits (`witnessKit` — sun-bleached
  Greek surface; `networkKit` — violet catacomb underworld), Model Maker,
  Sprite Creator, Model QA gallery.

### Content — built
- **Maps (3)**: `map_town` (full hub: gate, agora, gaol, scriptorium, inn,
  rowhouses, cordon, Mouthstone, ~12 NPCs), `map_network_upper` (121×101:
  Surface Seam, Grand Processional, Flooded Cisterns, Ossuary Maze, Crypt
  Chapel, Omphalos Antechamber), `map_network_depths` (Long Gallery,
  Ossuary Crossing, Cistern, Shrine Row + hidden passage, Omphalos
  Rotunda, Mara's Basement).
- **Act 1 playable start to finish**: ceremony + class oath → briefing
  (sets `act1_assigned`) → Nessa at the bars (+ carried-stone branch) →
  trapdoor descent (Scene 4) → dungeon → Mara's basement (Scene 6: pan,
  ledger, `itm_rite_fragment_1`, `act1_rite_text`, Bound Remnant fight) →
  office return (Scene 7: `act1_complete`, `dia_office_after`).
- **Evidence chain live**: carried stone, two rite fragments (second leaf
  proves Mara was willing — Crypt Chapel, hinted by the Mystic-only
  cyberghost), three family marks (Rusk/Fen/Vey), votive collection,
  glass shards, 8 documents. Nessa has two evidence-gated trust beats
  (`nessa_trust_1/2`).
- **Bestiary**: rite remnants ×7, candle-eaten ×4, partial conversions ×5,
  Bound Remnant, plus the friendly cyberghost.
- ~60 dialogues, 22 cutscenes, 25 sprites (incl. `spr_drowned_echo`,
  `spr_witness`, `spr_mouthstone` — some Act 2/3 art already exists).

### Known debts (carry forward, don't lose)
- `play_sound` and `start_combat` cutscene verbs are schema-only no-ops.
- No journal/codex UI (`read_documents` is tracked but nothing consumes it).
- Exits are unconditional (zone gating is done with triggers — fine).
- One remnant in old saves wandered out of bounds pre-v0.8.0 (fixed by
  version wipe; current AI is bounds-checked).
- `start_spawn_id` honored only at fresh-save time; editor map selection
  still overrides the story start inside the editor app (intended).
- Inventory has no item *count* cap and no equipment; that is by design —
  do not add an equipment system (see §0.6).

---

## 2. Engine work remaining (do these inside the phase that needs them)

| # | Feature | Size | Needed by | Notes |
|---|---------|------|-----------|-------|
| E1 | `play_sound` one-shot path in `audioManager` + cutscene verb | S | P5 (polish), earlier if free | `playSound(url, volume)`, fire-and-forget `new Audio`; wire the existing schema verb in the cutscene runner. |
| E2 | **Journal / Case File panel** | M | P3 (verdict needs re-readable evidence) | Don't build a codex UI. Build a "Case File" overlay listing `save.read_documents` (re-open any read doc) + quest state line + evidence key-items. One button in the top-right HUD cluster. ~1 component, reads existing state. |
| E3 | Inn rest | XS | P2 | Interact trigger at the inn bed → cutscene: `screen_fade out` → `advance_clock 480` → `heal_player 99` → fade in → log line. All verbs exist. |
| E4 | Water traversal flavor | XS | P2 | Drowning Pool wants wade cells: just author shallow-water floor tiles (walkable `obj_pool_shallows`) vs deep water (blocking). No swim system — cut per plan §10. |
| E5 | `summon` payload for the boss | S | P3 (optional) | Plan gives the Bound Remnant adds via `summon`. Combat shipped without it; if time allows: in skill/enemy resolution, a `summon` payload sets `hidden:false` on pre-placed hidden adds. Pre-place adds with `set_entity_hidden` instead if cut. |
| E6 | Enemy variety hooks | S | P2 | `target_tags` on payloads exists in schema; river spirits "only hurt by sacred skills" = give them high defense (8+) so basic attacks deal 1, and author sacred skills with damage 6+. No new engine code. |
| E7 | Ending screen | XS | P3 | Fake per plan: fade-to-black → final document → title return. Add one `return_to_title` cutscene verb OR just leave the player in a terminal map. Verb is ~10 lines in the runner + schema enum entry. |
| E8 | Balance levers audit | XS | P5 | One pass over `minutes_per_turn`, potion heal (5), enemy stats table (§7). |

Everything else the remaining acts need already exists. **Do not** start
statuses, equipment, XP/levels, doors, or conditional exits — the plan
ships without them and progression is carried by story flags + class
relics + the two stat-modifying ceremony branches.

---

## 3. Phase P1.5 — Act 1 closure polish (half a day)

Small items that finish the slice before new terrain:

1. **Fen alcove interaction** (`map_network_upper`, Shrine 2 at [35,44]):
   add an interact trigger → small cutscene reading a new
   `doc_fen_votive_count` (the Fen family's tally of offerings — texture
   for the "generational" reveal). Mirrors `trg_family_rites`.
2. **Wayside candle in the Depths** is placed; add one in the upper
   Ossuary Maze entrance (`ent_save` at ~[22,12]) — the maze + antechamber
   gauntlet is long for one checkpoint.
3. **Nessa visit after the dungeon** currently works via the hub; add one
   *unprompted* line node if `act1_complete` (she's heard the writ moved) —
   gate an extra option "The Church knows about the under-town now."
   setting nothing; pure mood.
4. **Aldric party-talk variants**: `dia_aldric_party` should branch its
   first node on `act1_rite_text` / `act1_complete` (he gets quieter).
   This is the cheapest "the world remembers" win and sets the pattern
   used by the town pass (§6).
5. **Depths exit throat check**: walk upper→depths→upper in the browser;
   spawn/exit pairs were corrected in 0.8.0 but only the upper side was
   runtime-tested.
6. Run `/code-review` on the combat + trigger engine changes from 0.8.0.

---

## 4. Phase P2 — Act 2: The Drowning Pool (the biggest remaining build)

Target: 3–4 sessions. Version → 0.9.0 when the first map lands.

### 4.1 New model kit: the River Kit (`src/utils/riverKit.ts`)

Same discipline as the other kits (true meshes, palette + `sculpt` wrapper
copied from `networkKit.ts`, helpers imported from `witnessKit.ts`).
Palette: night-river teals, drowned greys, reed greens gone silver,
waterlogged cedar, votive-paper white, fracture-violet kept rare.

| Object id | What it is | Collision |
|---|---|---|
| `obj_rv_floor_bank` | wet silt bank floor | none (tile) |
| `obj_rv_floor_shallows` | walkable shallow water (animated material) | none (tile) |
| `obj_rv_water_deep` | deep channel water | single (blocking tile) |
| `obj_rv_wall_levee` | timber-and-stone levee wall | wall |
| `obj_rv_reeds` | tall reed clump | none (walk-through, vision flavor) |
| `obj_rv_reed_curtain` | dense reed wall | single (soft maze walls) |
| `obj_rv_votive_post` | leaning post hung with offerings | single |
| `obj_rv_prayer_branch` | branch with tied prayer strips | none |
| `obj_rv_drowned_furniture` | flood-ruined table/chair tangle | single |
| `obj_rv_widow_hearth` | the widow's half-drowned hearth | single |
| `obj_rv_boat_wreck` | sunken ferry skiff | single, 2-cell footprint |
| `obj_rv_shrine_sunken` | algae-eaten marble shrine front | single |
| `obj_rv_glass_reed` | reed turned to Grid glass (emissive) | none |
| `obj_rv_pool_stone` | the drowning-stone (scene anchor) | single |
| `obj_rv_mist_low` | ground-mist billboard patch | none |

Register in `presets.ts` next to `createPaganNetworkKit()`. ~15 models.
The flashback map reuses this kit with the *witnessKit* bright marble
floors — that contrast IS the flashback's look. No flashback-specific kit.

### 4.2 Maps

**`map_drowning_pool` (~55×45) — `drowning_pool_gen.ts`.** Overworld-feel:
generous sightlines, reed mazes instead of walls. Regions:
- **East road-in** (from town west bridge): step-trigger gate requiring
  `act1_complete` lives on the TOWN side (Aldric's refusal line is the
  locked door — `cut_road_west_locked` / `cut_road_west_go`, mirror the
  trapdoor's two-trigger pattern).
- **The reed flats**: wandering drowned dead (×3), votive posts, prayer
  branches, scattered `itm_votive` ×3, one `ent_save` candle at the road.
- **The widow's house** (north bank, half-flooded): exterior porch +
  2-room interior, `obj_rv_widow_hearth`, her placement + schedule (she
  walks the bank at night — that's when `dia_widow` says more; see 4.4).
- **The drowning site** (west pool): `obj_rv_pool_stone`, the flashback
  step-trigger ring (gated `act2_widow_met`, once), drowned echo placed
  nearby but *passive* until after the flashback (place hidden, reveal via
  `set_entity_hidden` in the flashback-exit cutscene).
- **The sunken entrance** (south): interact trigger gated
  `act2_widow_met` → teleport into the shrine ("breathe the way the
  drowned do").
- Exits: east edge → `map_town` (`spawn_from_pool`, add to town spawns +
  carve the west bridge road in `town_gen.ts`); sunken entrance is
  cutscene-teleport, not an exit.

**`map_sunken_shrine` (~30×30) — `sunken_shrine_gen.ts`.** Water dungeon:
catacomb walls from `networkKit` + river kit floors — the two cultures
meeting underwater is the point. Rooms: entry airlock → flooded nave
(shallows lanes between deep channels — the corridor design is lanes) →
votive store-room (container: `itm_widow_token` + votives) → the heart:
flashback trigger chamber with `obj_rv_shrine_sunken` and the echo
encounter. Enemies: drowned dead ×4, river spirits ×2 (high defense, see
E6), glass-touched pike ×2 (fast, only on shallows cells — place their
patrols there).

**`map_flashback` (~25×20) — `flashback_gen.ts`.** The river bank, years
ago, **bright**: witnessKit marble + olive trees + laurel, daylight set by
its own light rig? No — keep the global rig; brightness comes from pale
floors and `screen_fade` color `#FFFFFF` in/out. Linear walk: bank path →
the boy at the water → the wave — all staged in `cut_flashback` (below).
No enemies. No exits (cutscene-teleport both ways, per plan §3).

### 4.3 Cast and bestiary additions (`familiar_dark_content.ts`)

| id | sprite | notes |
|---|---|---|
| `ent_widow` | new `spr_widow` (SpriteCreator: grey shawl, lantern) | `is_npc`, dialogue `dia_widow`, schedule: hearth by day, bank cells at night |
| `ent_drowned_dead_1..4` | `spr_drowned_echo` | hp 10, atk 4, def 1, spd 7 |
| `ent_river_spirit_1..2` | `spr_ghost` (tinted variant ok) | hp 12, atk 3, **def 8**, spd 9 — sacred-skill gate via E6 |
| `ent_glass_pike_1..2` | new `spr_glass_pike` (small, fast) | hp 6, atk 5, def 0, spd 16 |
| `ent_echo_boy` | `spr_drowned_echo` | `is_npc: true` **and** a hostile twin `ent_echo_boy_hostile` (hidden) — the pacify-or-fight encounter: dialogue first; the "calm him" option needs `skl_still_echo` known or `itm_widow_token` (condition `any`); failing options swap visibility of the two via cutscene and start the fight |
| young Nessa | none | flashback player body = `set_player_sprite spr_nessa` + `modify_player_stats` down, party emptied |

New items: `itm_widow_token` (key), `itm_reed_whistle` (flavor/trade),
Act 2 evidence: `itm_river_offering` (stackable votive variant ok to cut).
New documents (~5): `doc_widow_letters`, `doc_river_count` (offerings
ledger), `doc_witness_rite` (the widow's teaching — the Act 3 key),
`doc_boy_marker` (the drowning marker stone), `doc_flashback_close`
(Nessa's memory, given on exit — optional).

### 4.4 Scenes 8–13 (cutscene/dialogue wiring)

Use the established patterns: two-trigger gates, `branch` on spine flags,
once-flags via `set_switch`.

| Scene | id(s) | Wiring |
|---|---|---|
| 8. Road west | `cut_road_west_go` | fade, teleport to pool, river music (`music_tracks.river` exists), one Aldric line (`dia_road_west`), set `act2_started` |
| 9. ★ The widow | `dia_widow` + `cut_widow_met` | Hub dialogue; options gated `time_of_day: ["night","witching_hour"]` say more (the engine supports this today). Teaching the witness-rite: option requires having shown her `itm_rite_fragment_1` (has_item) → `read_document doc_witness_rite`, set `act2_widow_met`, `witness_rite_known` |
| 10. Shrine descent | `cut_shrine_enter` | gated interact at sunken entrance; teleport; the dungeon is the scene |
| 11. ★ The flashback | `cut_flashback_in` / `cut_flashback_out` | in: fade **white**, `remove_party_member ent_aldric`, `set_player_sprite spr_nessa`, `modify_player_stats` (drop attack/hp to child-size), teleport to `map_flashback`; the memory plays as step-triggers along the bank path (3 micro-dialogues: `dia_fb_bank`, `dia_fb_boy`, `dia_fb_water`); out (step on the final cell): fade white, restore sprite, restore stats (inverse deltas), `add_party_member ent_aldric`, teleport back, set `act2_flashback_seen`, reveal the drowned echo near the pool stone |
| 12. ★ Second cell visit | extend `dia_nessa_bars` | new hub option gated `act2_flashback_seen` → `node_saw_river` chain → set `nessa_trust_3`. **This is the emotional hinge — write it last, longest.** |
| 13. Aldric refuses | `cut_office_refuse` + `dia_office_refuse` | office wideTrigger #3 gated `act2_flashback_seen` (the two existing office triggers disarm correctly — same pattern); he cannot follow; sets `act2_complete`, `aldric_strain_2`; ALSO fire the town re-dress flags (see §6) |

### 4.5 P2 exit criteria
- Full Act 2 playable from `act1_complete` save-stage to `act2_complete`
  without console intervention.
- Flashback in/out leaves stats, sprite, and party exactly restored
  (verify numbers in the HUD before/after).
- River spirits unkillable by basic attack but die to Sacred Line /
  Witness Flame; pike never leave shallows.
- Inn rest works (E3). Version 0.9.x, committed, `/code-review` run.

---

## 5. Phase P3 — Act 3, verdict, and both endings (2–3 sessions)

### 5.1 The cordon (scene 14)
Town map already has the cordon + `ent_guard_cordon`. Add: approach
step-trigger gated `act2_complete` (before: existing standing-orders
text). `cut_cordon_hair`: pan along the cordon, `read_document
doc_glass_log` (new — the glass-touched guard's log), `give_item
itm_mara_hair`, set `act3_hair_taken`. The glass-fused remains: place 2–3
`obj_net_glass_kneeler` inside the cordon line now (they read as the
Glass dead from outside it — no new models needed).

### 5.2 ★★ The witness-rite (scene 15) — the climax
One big cutscene `cut_witness_rite`, triggered at the ritual ground
(interact, gated `act3_hair_taken` + `witness_rite_known`). Staging, all
with existing verbs:
1. fade out → `move_entity` Aldric + (optionally guards) to the ritual
   ground → teleport player there → fade in → rite music (`play_music`).
2. `camera_pan` to the circle. Dialogue `dia_witness_rite` carries the
   rite line-by-line.
3. **Evidence branches**: `branch` on `act1_rite_text`,
   `act2_flashback_seen`, `has_item itm_rite_fragment_2`,
   `has_item itm_votive, item_count: 5`, `nessa_trust_2` — each adds a
   labeled dialogue segment of Mara's echo (more truth per evidence held).
   This is where the whole evidence economy pays off; write one extra
   Mara line per flag, converging on the shared label.
4. "**I opened.**" → `wait 2500` (the long hold) → Aldric's refusal
   happens HERE (`dia_witness_rite` final nodes) → fade out → set
   `act3_rite_done`.
5. The deduction beat from plan §5: BEFORE this trigger unlocks, Nessa's
   hub gets "Tell her what you believe happened" (3 sub-options; the true
   one — *love opened the door* — requires nothing, but choosing it sets
   `player_named_truth`, which adds the best Mara line in step 3).

### 5.3 The verdict + the choice (scenes 16–17)
`cut_verdict` (on_load or step at the gaol after `act3_rite_done`):
procedural, paperwork-flat on purpose. `move_entity` Nessa along the
spine to the Mouthstone (4–5 `move_entity` + `wait` beats; player follows
freely — do NOT lock movement, the powerlessness is walking behind).
`adjust_faction_rep church ±` by whether the player protests (one dialogue
option pair). Set `verdict_given`, `set_entity_hidden` Nessa's gaol
placement, place her at the Mouthstone. `dia_mouthstone_choice`: two
options, no take-backs → `ending_run_after` | `ending_let_go`.

### 5.4 The endings
**Run After** — `map_pagan_lands` (~55×50, `pagan_lands_gen.ts`): sparse;
one road, standing stones, dead pines (witnessKit `deadTree` + networkKit
steles do most of it — add at most `obj_pl_standing_stone` and
`obj_pl_far_light` to a tiny kit if needed). Exiles: `ent_exile_1..3`
(hp 12/atk 5/def 2/spd 10), one **obstacle** finale (`ent_lands_answer`,
hp 24 — not a boss, the land saying no). At the far light: Nessa,
`dia_ending_run_after`, closing fade on her line → terminal document
`doc_epilogue_run` (E7).
**Let Her Go** — no new map. `cut_ending_let_go`: long fade,
`advance_clock` to dawn, town wakes (this is why schedules exist), Aldric
at the office `dia_ending_let_go`, the case filed (`read_document
doc_case_closed`), shop reopens, cordon stays. Terminal screen via E7.

### 5.5 P3 exit criteria
Both endings reachable from an `act2_complete` stage; every evidence flag
demonstrably changes the rite scene (test matrix: rite with 0 flags vs
all flags — line counts differ); journal panel (E2) shipped so the
verdict-era player can re-read what they hold. Version 0.10.x.

---

## 6. Phase P4 — The town pass (1–2 sessions, pure content)

The "town remembers" pillar, all condition-driven, no map edits:
1. **Act variants for the 12 named NPCs** (`ent_elder`, `ent_ferryman`,
   `ent_gaoler`, `ent_guard_gate`, `ent_guard_cordon`, `ent_innkeep`,
   `ent_mason`, `ent_merchant`, `ent_mother`, `ent_pilgrim`, `ent_priest`,
   + the children's rhyme): node_1 of each dialogue gets option/text
   variants gated on `act1_complete`, `act2_complete`, `verdict_given`.
   Three short lines per NPC per act ≈ ~100 lines of writing. Use the
   Aldric party-talk pattern from P1.5.
2. **Schedules**: shopfolk / churchfolk / night-folk patterns on every
   placement (several exist; finish the set). Act 3: shop closes early —
   schedule entries can't be condition-gated, so author the act-3 guard
   doubling as pre-placed hidden guards revealed by `cut_office_refuse`
   (`set_entity_hidden false`), and shop price climb via existing
   `price_modifiers` on `act2_complete`.
3. **The smuggler**: `ent_smuggler` (new sprite), inn at night only
   (schedule + `time_of_day` gates), trades glass shards for potions/keys
   via dialogue options with `has_item` conditions + `remove_item`/
   `give_item` cutscenes (the plan's pattern; shops can't take items).
4. **Witching Hour scenes**: one optional micro-scene per act, step
   triggers near the Mouthstone gated `time_of_day: ["witching_hour"]` +
   act flag. Cheap, enormous mood.
5. **Case File** (E2's content): 4 versions of `doc_case_file` selected by
   act-flag branches at Aldric's office table trigger.

---

## 7. Phase P5 — Balance, audio, polish, ship (1–2 sessions)

### 7.1 Numbers (single source: this table; tune in place)
| Actor | HP | ATK | DEF | SPD | Where |
|---|---|---|---|---|---|
| Player base | 20 | 5 | 2 | 10 | `initSave` defaults |
| Scholar / Warrior / Mystic deltas | −4hp +6mp / +6hp +2atk −6mp / +4mp +2spd −1atk | | | | `cut_arrival` oath |
| Aldric | 22 | 4 | 2 | 9 | content |
| Rite remnant | 8 | 4 | 1 | 8 | Act 1 floor |
| Candle-eaten | 5 | 3 | 0 | 14 | swarms |
| Partial conversion | 16 | 5 | 3 | 5 | walls |
| Bound Remnant | 30 | 6 | 2 | 7 | boss |
| Drowned dead | 10 | 4 | 1 | 7 | Act 2 |
| River spirit | 12 | 3 | 8 | 9 | sacred-gated |
| Glass pike | 6 | 5 | 0 | 16 | shallows only |
| Exile / lands-answer | 12 / 24 | 5 / 6 | 2 / 2 | 10 / 8 | epilogue |

Checks: a Warrior should clear the ossuary maze without potions; a
Scholar should need the candle; the Bound Remnant should take 2 party
rounds minimum and force one Brother's Oath. Crit is 10%/1.5× and skill
damage = payload + ⌊atk/2⌋ − def (`utils/combat.ts`).

### 7.2 Audio
- E1 `play_sound` + a tiny SFX set (step on stone/water, hit, death, page,
  candle): public/sfx/, fired from the obvious code points (melee resolve,
  popup spawn, document open, save).
- Music coverage: town ✓, network ✓, river → pool/shrine/flashback maps'
  on_load, rite track for `cut_witness_rite` (reuse Combat-mastered if no
  new track), Title ✓.

### 7.3 QA matrix (the only full manual passes of the project)
2 playthroughs × {Scholar, Warrior, Mystic — pick 2} × {Run After, Let
Go}. Per run, check: every spine flag fires once and only once (§9 list);
no dangling-id console warnings on import; combat never soft-locks (the
queue always returns to "player"); flee-and-return re-engages cleanly;
save/load mid-combat resumes sanely (it persists `in_combat` — verified
recoverable in 0.8.x); performance steady walking the full town.

### 7.4 Ship
README play instructions, `vite build`, version 1.0.0, tag it.

---

## 8. Suggested session-by-session order

| Session | Deliverable |
|---|---|
| 1 | P1.5 complete + `/code-review` of 0.8.0 engine changes |
| 2 | River Kit + `map_drowning_pool` shell + road-west gate (walkable, committed) |
| 3 | Widow + scenes 8–9 + inn rest + Act 2 bestiary |
| 4 | Sunken shrine + scene 10 + echo-boy encounter |
| 5 | Flashback map + scenes 11–12 (the hinge writing session) |
| 6 | Scene 13 + town re-dress hooks + P2 exit criteria pass |
| 7 | Cordon + witness-rite scene 15 (+ deduction beat) |
| 8 | Verdict, choice, Let-Her-Go ending + Case File/journal (E2) |
| 9 | Pagan lands + Run-After ending + E7 |
| 10 | Town pass (NPC variants, smuggler, witching hour) |
| 11 | Balance + audio + QA matrix |
| 12 | Buffer. There is always a session 12. |

---

## 9. Registry — switches, quest states, and planned ids

**Spine flags (existing ✓ / planned ○):**
`act1_assigned`✓ `act1_rite_text`✓ `act1_complete`✓ `act2_started`○
`act2_widow_met`○ `witness_rite_known`○ `act2_flashback_seen`○
`act2_complete`○ `act3_hair_taken`○ `act3_rite_done`○ `verdict_given`○
`ending_run_after`○ `ending_let_go`○

**Secondary (read, never required):** `nessa_saw_stone`✓ `nessa_trust_1`✓
`nessa_trust_2`✓ `nessa_trust_3`○ `aldric_strain_1`○(write in scene 7
option) `aldric_strain_2`○ `player_named_truth`○ `heard_cyberghost_network`✓
`first_descent_done`✓ `found_second_leaf`✓ + class switches ✓.

**`quest_investigate` states:** `her_words`✓ → `the_under`✓ →
`the_circle`✓ → `act_one_closed`✓ → `the_river`○ → `the_witness_rite`○ →
`the_verdict`○ → terminal `run_after`/`let_go`○. (Plan said one quest per
zone; one quest with states has proven cleaner — keep it.)

**Planned content ids** (create-before-reference, per §0.4):
maps `map_drowning_pool` `map_sunken_shrine` `map_flashback`
`map_pagan_lands`; entities `ent_widow` `ent_drowned_dead_1..4`
`ent_river_spirit_1..2` `ent_glass_pike_1..2` `ent_echo_boy`(+hostile)
`ent_smuggler` `ent_exile_1..3` `ent_lands_answer`; items
`itm_widow_token` `itm_mara_hair`; docs `doc_witness_rite` `doc_glass_log`
`doc_widow_letters` `doc_river_count` `doc_boy_marker` `doc_case_file`
`doc_case_closed` `doc_epilogue_run` `doc_fen_votive_count`; cutscenes
`cut_road_west_locked/go` `cut_widow_met` `cut_shrine_enter`
`cut_flashback_in/out` `cut_office_refuse` `cut_cordon_hair`
`cut_witness_rite` `cut_verdict` `cut_ending_let_go` `cut_inn_rest`;
dialogues `dia_widow` `dia_road_west` `dia_fb_bank/boy/water`
`dia_office_refuse` `dia_witness_rite` `dia_mouthstone_choice`
`dia_ending_run_after` `dia_ending_let_go` `dia_smuggler`.

---

## 10. Definition of done

The game is finished when a new player can, without the console: choose a
class at the ceremony; investigate the town; descend through both Network
floors and return with the rite text; cross the river, earn the widow's
teaching, live Nessa's memory, and watch Aldric refuse it; take the hair,
perform the witness-rite, and hear exactly as much of Mara's truth as the
evidence they carried; lose the verdict anyway; choose at the Mouthstone;
and receive an ending that lands — with the town's dialogue, prices,
guards, and schedules having shifted under them the whole way. Both
endings tested, builds clean, version 1.0.0, tagged.

*Restraint remains the rule. One town that remembers, three wounds
beneath it, and two people the player can't keep. Ship it.*
