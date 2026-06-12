# The Familiar Dark — Production Plan

*How to build the full game from the plot document using the engine as it
stands today. Every mechanic below names the engine feature that powers it;
anything the engine can't do yet is in §10 with a workaround or a sized
addition. Companion docs: `the_familiar_dark_plot.md` (story canon),
`ai-authoring-guide.md` (engine reference).*

---

## 1. What kind of game this is

A nighttime detective CRPG in four movements: a town hub you return to between
three zones, each zone changing what the town means. The player's *belief*
about Nessa is the real progression system — tracked in switches, surfaced
through dialogue that knows what you've found.

Design pillars, in priority order:

1. **The investigation is the game.** Combat, exploration, and collection all
   exist to deliver evidence. Every dungeon reward is a *fact*.
2. **The town remembers.** Every act transition re-scores the town: NPC
   dialogue variants, schedules, prices, who stands where. This is what the
   condition layer was built for.
3. **Two people you can't have both of.** Aldric (in your party, doubting you)
   and Nessa (behind bars, evolving with your evidence). Their dialogue is the
   emotional meter of the game.
4. **The truth is assembled, never announced.** The player should be able to
   state the true story (love opened the door, not malice) one zone before the
   game says it.

---

## 2. The spine — acts as a flag machine

One global progression switch per beat. Everything else (dialogue variants,
schedules, shop stock, zone access) reads these via conditions. Never gate on
incidental flags; always gate on spine flags.

| Spine flag | Set by | Unlocks |
| --- | --- | --- |
| `act1_assigned` | Office briefing cutscene | Pagan Network entrance |
| `act1_rite_text` | Mara's basement (Network depths) | Nessa dialogue tier 2 |
| `act1_complete` | Returning the rite text to Aldric | Drowning Pool travel, town mood shift 1 |
| `act2_widow_met` | Widow's house scene | Sunken shrine access |
| `act2_flashback_seen` | Flashback sequence ends | Witness-rite knowledge |
| `act2_complete` | Reporting to Aldric (he refuses the implication) | Act 3 town state, cordon approachable |
| `act3_hair_taken` | Cordon scene | Witness-rite performable |
| `act3_rite_done` | Witness-rite climax ("I opened.") | Verdict |
| `verdict_given` | Verdict cutscene | Final choice |
| `ending_run_after` / `ending_let_go` | Final choice dialogue | Epilogues |

Secondary trackers (read, never required): `nessa_trust` tier flags
(`nessa_trust_1/2/3` set by showing her specific evidence), `nessa_saw_stone`
(already in build), `aldric_strain_1/2` (set when you contradict him),
`faction_rep.church` (moves with how procedurally you behave — adjusted by
`adjust_faction_rep` in scene cutscenes).

**Quests** mirror the spine for the player's benefit (`quest_investigate`
exists; add one quest per zone). Quest *states* are strings — use
`"active"`, `"complete"` and gate dialogue with `quest`/`quest_state`
conditions where it reads better than a switch.

---

## 3. Maps — the whole world in seven maps

Travel uses `exits` for free movement and **gated step/interact triggers +
`teleport_player`** for anything conditional (exits are unconditional today —
see §10; trigger-gating is the pattern until then).

| Map id | Size | Role |
| --- | --- | --- |
| `map_town` | 69×77 (exists) | Hub. Office, gaol, cordon, shop, inn, homes, ritual ground, Mouthstone |
| `map_network_upper` | ~45×35 | Act 1 dungeon, floor 1: linked basements under the homes |
| `map_network_depths` | ~40×40 | Act 1 dungeon, floor 2: old tunnels, Mara's basement as the finale room |
| `map_drowning_pool` | ~55×45 | Act 2 overworld-feel zone: river basin, reeds, widow's house, flooded paths |
| `map_sunken_shrine` | ~30×30 | Act 2 dungeon: the shrine depths, flashback trigger at its heart |
| `map_flashback` | ~25×20 | Playable-Nessa memory: the river bank, years ago. Brighter palette |
| `map_pagan_lands` | ~55×50 | Epilogue zone (Run After only): sparse, hostile, one road, one light |

Wiring:

- **Town → Network:** trapdoor in home #2's basement corner (interact trigger,
  condition `act1_assigned`). Before that flag: cutscene "The seal on this
  cellar is church-stamped."
- **Network upper ↔ depths:** plain `exits` both ways (stair cells).
- **Town → Drowning Pool:** west bridge road edge (step trigger, condition
  `act1_complete`; Aldric refuses to leave town before then — his line *is*
  the locked door).
- **Pool → Shrine:** sunken entrance, interact trigger requiring
  `act2_widow_met` (the widow teaches you how to enter — "breathe the way the
  drowned do").
- **Flashback:** entered/exited only by cutscene (`teleport_player`), never by
  exit.
- **Town → Pagan Lands:** the Mouthstone gate. Interact trigger, condition
  `ending_run_after`. Until the verdict it gives the existing monolith text.

Build each zone with `generateTownCells`-style generator functions (one per
map in `schema/`), same as `town_gen.ts`: cells + placements + containers +
items from code, deterministic seed. Dungeon floors are sparse cell sets —
void is walls for free. Roofs at y=2 only where the cutaway matters (widow's
house, Mara's basement ceiling).

---

## 4. Scenes — the dramatic skeleton

Numbered scene list. Each is one cutscene (+ dialogues), staged with the verbs
we have: `screen_fade`, `camera_pan`, `branch`/`label`, `move_entity`,
`play_music`, `adjust_faction_rep`. Scenes marked ★ are the emotional
load-bearers — write these first, polish these last.

**Act 1**
1. ★ **Ceremony** (exists, keep): black → fade-in → pan to cordon → vows.
   Extend with class selection (§6) folded into the ceremony dialogue.
2. **Office briefing** (exists, keep): Aldric's trust, the field note document,
   sets `act1_assigned`.
3. **First cell visit** (exists + stone branch, keep): establishes Nessa's
   voice. Already branches on the carried stone — that's the model for every
   evidence reaction.
4. **The trapdoor**: first descent. Fade out → fade in underground →
   `play_music` swap to the under-town track. One line from Aldric: "Every
   house keeps a second house under it."
5. **The shrine room**: first proof the rites are generational (votives,
   family marks — delivered as documents + a container of offerings).
6. ★ **Mara's basement**: the act finale room. Pan across the rite circle
   before control returns. Yields `doc_rite_fragment_1/2`, names of Tollen and
   Iria's connections, and `act1_rite_text`. A *rite remnant* boss guards it.
7. ★ **Aldric, after**: he reads the rite text. Branch on `nessa_saw_stone` —
   if she's seen the stone he's already wary of you. He concludes it proves
   *organization*, you can argue it proves *fear*. First open disagreement;
   sets `act1_complete`, `aldric_strain_1` if you push.

**Act 2**
8. **The road west**: short scripted walk-in, river ambience, the flooded
   landscape says what dialogue doesn't.
9. ★ **The widow**: the best pure dialogue in the game. She's fracture-touched
   — her dialogue options gate on `time_of_day`; at night she says more and
   means more. Teaches the witness-rite concept; sets `act2_widow_met`.
10. **The shrine descent**: water dungeon, drowned dead encounters, votive
    collection (§7).
11. ★ **The flashback**: at the drowning site — fade to white (color is a
    `screen_fade` parameter), `set_player_sprite` to young Nessa,
    `teleport_player` to `map_flashback`, party emptied
    (`remove_party_member`). Play the memory: the boy, the water, what Aldric
    saw vs. what happened. Exit reverses everything. Sets
    `act2_flashback_seen`.
12. ★ **Second cell visit**: Nessa, if you tell her you *saw* it (option gated
    on `act2_flashback_seen`), stops performing innocence and starts telling
    the truth. `nessa_trust_3`.
13. **Aldric refuses**: you lay out the conduit theory. He cannot follow.
    "I won't bend what I saw to comfort what you found." Sets `act2_complete`,
    `aldric_strain_2`. The town's act-3 state begins: guards double, shop
    closes early (schedule change via condition), NPCs stop meeting your eyes
    (dialogue variants on `act2_complete`).

**Act 3**
14. **The cordon**: now approachable (trigger gated on `act2_complete`).
    Glass-fused remains. Taking Mara's hair is an interact cutscene — pan
    along the cordon, one fragment document from a glass-touched guard's log.
    Sets `act3_hair_taken`.
15. ★★ **The witness-rite**: the climax, fully staged:
    fade out → `move_entity` everyone to the ritual ground → fade in →
    `play_music` (the rite track) → pan to the circle → dialogue (the rite,
    line by line) → branch: every evidence flag the player holds adds a line
    to what Mara's echo can say (`branch` on `act1_rite_text`,
    `act2_flashback_seen`, votive count via `has_item`) → "I opened." →
    long hold → fade out. Aldric present; his refusal happens *here*, with the
    truth in the room. Sets `act3_rite_done`.
16. **The verdict**: church condemns her anyway. This must feel procedural,
    not dramatic — the horror is the paperwork. `adjust_faction_rep` church
    +/- depending on whether the player protests. Nessa is walked to the
    Mouthstone (move_entity across town while the player can only follow).
    Sets `verdict_given`.
17. ★ **The choice**: at the Mouthstone, one dialogue, two options, no
    take-backs. Sets `ending_run_after` or `ending_let_go`.

**Epilogues**
18. **Run After**: `map_pagan_lands`. Hostile exiles, sparse landmarks, one
    final encounter (not a boss — an *obstacle*, the land itself saying no).
    Finding Nessa at the far light. Closing dialogue. Fade out on her line.
19. **Let Her Go**: town at dawn (`clock` jump via long fade), Aldric at the
    office, the case filed. The shop reopens. The cordon stays. Quietly
    devastating; the town simulation *is* the ending — everything works again
    and it shouldn't.

---

## 5. Investigation — evidence as items, belief as state

The detective layer uses three existing systems together:

- **Evidence = key items** (`category: "key"`). Physical, lootable, droppable,
  showable. ~12 evidence items: rite text fragments (2), Mara's hair, the
  carried stone (exists), the widow's token, votive offerings (stackable),
  basement family marks (3 house-name tokens), the guard's glass log, the
  field note.
- **Lore = documents**, read via `read_document` in scene cutscenes and via
  bookshelf/interact triggers in dungeons. ~15 documents. Documents are the
  *answer key* drip: each act's documents make the previous act's mystery
  legible in hindsight.
- **Belief = dialogue conditioned on evidence.** The Nessa hub dialogue is the
  pattern: node_1 is a hub whose options are condition-gated
  ("Ask about the rite" requires `act1_rite_text`; "I saw the river" requires
  `act2_flashback_seen`; "Mara was willing" requires `has_item:
  itm_rite_fragment_2`). Aldric's party-talk dialogue
  (`party_dialogue_id`) gets variants per act the same way — he is a running
  commentary on how far from him you've drifted.

**The player's deduction moment:** before scene 15, a Nessa option exists —
"Tell her what you believe happened" — with three sub-options (she did it /
the statue did it / Mara opened it through love). Choosing right before the
rite confirms it earns a unique rite line and `nessa_trust_3`. This is the
"player states the truth first" pillar, built entirely from dialogue
conditions. No new tech.

**Case journal:** until the engine has a codex UI (§10), the journal is a
*place*: Aldric's office table is an interact trigger that re-reads a
"Case File" document — and we author 4 versions of it, the trigger choosing
via condition branches per act. The case file literally thickens.

---

## 6. Combat — small, legible, themed

Combat exists to make the zones dangerous and the rite remnants *physical*,
not to be a build-crafting game. Bump-attack + skills is the kit; lean into
positioning (the engine's 8-dir grid + skill shapes: line/cone/cross/block).

**Classes** (chosen in the ceremony — dialogue options setting
`class_scholar` / `class_warrior` / `class_mystic`):

| Class | Stat identity | Skills (via `abilities` + ceremony `give_item` boosts) |
| --- | --- | --- |
| Scholar | low HP, high MP | `skl_sacred_line` (ranged line damage), `skl_appraise` (reveals enemy info via log), heal |
| Warrior | high HP/attack | `skl_cleave` (cross melee), `skl_brace` (self defense buff via status) |
| Mystic | balanced, sees the dead | `skl_witness` (damages spirits only — `target_tags`), `skl_calm` (pacifies one remnant) |

Class stat differences today: ceremony gives a class relic *consumable* whose
`effects` carry permanent `attack_bonus`/`max_hp_bonus`/etc. — works now.
Class-gated *skills* need `known_skills` honored by the skills UI (§10, small).
Class-gated *dialogue* works today (`switch: class_mystic` options — the
Mystic hears cyberghosts; this is the third class's identity more than
combat).

**Bestiary (~10 types, all `is_npc: false` entities + sprites):**

| Zone | Enemies |
| --- | --- |
| Network | Rite remnant (slow melee), candle-eaten (fast, weak), partial conversion (tanky, slow) |
| Network finale | **Bound remnant** (boss: high HP, spawns adds via `summon` payload) |
| Drowning Pool | Drowned dead (medium), river spirit (only damaged by Mystic/sacred skills — `target_tags`), glass-touched pike (fast, water cells only) |
| Shrine | Echo of the boy (scripted single encounter — pacify or fight; pacifying needs `skl_calm` or the widow's token `has_item` dialogue out) |
| Pagan Lands | Exile skirmisher, exile warden, **the land's answer** (final encounter) |

Difficulty levers we have: `max_hp/attack/defense/speed` per entity, chase
radius is fixed (8) so corridor design *is* encounter design — long sightlines
for ranged Scholar play, pillars for Warrior funneling. Healing economy:
potions + inn rest (inn = interact trigger → `heal_player` + clock jump).

**Death**: keep the existing game-over; checkpoint = the save candle (§9).

---

## 7. Exploration & collection

- **Votive offerings** (`itm_votive`, stackable): scattered through all zones
  as world items + containers (the collection layer). They are also *fuel*:
  the witness-rite scene branches on `has_item: itm_votive, item_count: 5` for
  a fuller manifestation (more of Mara's words). Optional collection with a
  narrative payoff, zero new tech.
- **Glass shards** (exist): currency-adjacent. The smuggler NPC (new, inn at
  night only — schedule + `time_of_day` dialogue gate) trades shards for
  potions/keys/rumors. Sell via shop `price_modifiers`? No — buying only;
  shard trades are dialogue options with `has_item` conditions +
  `remove_item`/`give_item` cutscenes. Works today.
- **Secrets per map:** 2–3 optional rooms each (a locked container needing a
  key from the *other* zone — cross-zone keys make the world feel whole),
  1 optional cyberghost per zone (interact trigger, Mystic-gated extra lines).
- **The town at night** is itself explorable content: schedules move all NPCs
  (12 named NPCs, 3 schedule patterns: shopfolk / churchfolk / night-folk),
  Witching Hour (`time_of_day: witching_hour`) surfaces the smuggler, the
  widow's cousin, and one optional scene per act.

---

## 8. The town's mood — staging the spine without new code

Per act transition, one "re-dress pass" over `map_town` content (all
condition-driven, no map edits):

- Each named NPC's dialogue node_1 options include act-gated variants
  (`switch: act1_complete` etc.) — 3 lines per NPC per act ≈ small writing
  cost, the single biggest "alive world" payoff.
- Shop: act 3 closes stock behind conditions ("the Church is buying
  everything"), prices climb via `price_modifiers` on `act2_complete`.
- Guards: 2 guard entities placed near the cordon get schedules and act-gated
  dialogue; in act 3 two more "appear" (placed from day one, dialogue-gated,
  positioned via `move_entity` in the act transition cutscenes).
- Music: per-map track via on_load trigger + `play_music` (one cutscene per
  map, `once: false`, condition-gated per act for the act-3 town variant).

---

## 9. Saving, pacing, and the candle

- The Flickering Candle (exists as a stub) becomes real: interact → cutscene →
  `heal_player` full + log line. The zustand save already persists
  continuously; the candle is *fiction* for the autosave plus the heal. Place
  one candle per zone entrance.
- The inn advances time (clock jump): implement as cutscene `wait` + a new
  tiny `advance_clock` action (§10, trivial) or fake with a long fade and the
  log line "You sleep." — schedules will have moved by sheer turn cost
  otherwise; honest version needs the action.
- Expected playthrough: 3–5 hours. Act 1 ≈ 60–80 min, Act 2 ≈ 80–100, Act 3 ≈
  40–60, epilogue ≈ 20.

---

## 10. Engine gaps — what to add, what to fake

Ordered by build priority. "Fake" = shippable workaround exists today.

| Gap | Size | Verdict |
| --- | --- | --- |
| `advance_clock` cutscene action (inn rest, act time-jumps) | XS | **Add** (store action exists; just expose verb) |
| `modify_player_stats` action (class stats, flashback Nessa stats) | XS | Add (workaround: stat-bonus consumables — fine for classes, wrong for flashback) |
| `learn_skill` action + skills UI filtering by `known_skills` | S | **Add** — class identity depends on it |
| `set_entity_hidden` action (Nessa leaves the cell; act-3 guard appearances) | S | **Add** — `move_entity` to far-off cells works but corpses of that hack accumulate |
| Conditional `exits` (zone gating without trigger boilerplate) | S | Add when convenient; trigger-gating ships the game |
| Journal / codex UI (documents re-readable, quest list) | M | Fake with the office Case File pattern for the jam; add post-ship |
| Doors (openable, lockable) | M | Fake: door-shaped gaps + guard NPCs + gated triggers. Real doors are post-ship |
| Sound effects (`play_sound` is a no-op) | S | Add a one-shot path to audioManager when music goes in |
| Ending/credits screen action | S | Fake with fade-to-black + final document + dialogue; fine |
| Enemy ranged attacks / status payloads | M | Cut from v1 — melee + skill variety is enough at this scale |

Nothing on this list blocks starting. The four "Add" items total roughly a
day.

---

## 11. Production order — build it like the jam it is

Each phase ends with a playable, exported build. Bump `metadata.version` per
phase (wipes saves — that's correct between content phases).

| Phase | Deliverable | Content |
| --- | --- | --- |
| **P0 – Systems** (1 day) | Engine additions from §10 (the four XS/S "Adds") + class ceremony | Classes selectable, skills gated, inn works |
| **P1 – Act 1 vertical slice** (2–3 days) | Town + `map_network_upper/depths`, scenes 1–7 | First dungeon, 4 enemy types, boss, rite text, Aldric disagreement. *If this slice is good, the game is good.* |
| **P2 – Act 2** (3 days) | Pool + shrine + flashback maps, scenes 8–13 | Widow, water dungeon, flashback sequence, trust system fully live |
| **P3 – Act 3 + endings** (2 days) | Scenes 14–19, `map_pagan_lands` | The climax rite, verdict, both epilogues |
| **P4 – The town pass** (1–2 days) | No new maps | 12 NPCs × act variants, schedules, smuggler, Witching Hour scenes, shop arcs |
| **P5 – Polish** (1–2 days) | Music/sfx, balance, sprite/model pass, full playthrough ×2 per class ×2 endings | Ship |

Asset budget (made in-engine: SpriteCreator + ModelMaker/presets):
~14 character sprites (incl. young Nessa, widow, smuggler, guards, exiles),
~10 enemy sprites, ~3 zone object kits (basement: shrine-stones, candle
clusters, tunnel props; river: reeds, votive posts, flooded furniture; pagan:
standing stones, dead pines), 2 boss-scale models.

Writing budget: ~38 dialogues, ~26 cutscenes, ~15 documents, ~12 evidence
items. Author everything in `createEmptyGamePackage` + per-map generator
files; keep dialogue text in one section per act for editability.

**Testing per phase:** the localStorage-teleport pattern (set player cell +
flags, reload) walks any scene in seconds; one scripted console run per spine
flag verifying the gate opens and the prior gate stays shut. Two full manual
playthroughs only at P5.

---

## 12. The one rule

From the engine document that started all this: *restraint*. Every scene in §4
earns its place by changing what the player believes about one of three
things — Nessa, Aldric, or the world. Anything that doesn't (a fourth dungeon
floor, a crafting system, a second shop) gets cut without discussion. Build
one town that remembers, three wounds beneath it, and two people the player
can't keep. Ship it.
