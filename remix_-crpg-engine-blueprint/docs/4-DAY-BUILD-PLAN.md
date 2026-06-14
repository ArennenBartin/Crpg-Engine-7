# The Familiar Dark — Act 1: 4-Day Build Plan

*One open-world map. One complete quest (the vampire). One thread that hooks
everything after (Nessa). Every engine system used. Ship in four days.*

---

## The Story

A body has been found in the eastern caves outside town — partially converted
to Glass, surrounded by mutilated animals and frantic writing scratched into
stone. The town blames **Lazare Behind the Shutters**, the reclusive vampire
who hasn't left his house in years. Easy scapegoat. The Church sends a newly
sworn Intercessor and **Brother Aldric** to investigate.

The investigation leads through the cave, where **grid sickness logs** from the
victim reveal a descent into madness caused by pagan rite exposure — not a
vampire attack. The victim was part of the same underground rite circle
connected to **Mara Vey**, whose death at the Witness statue got **Acolyte
Nessa** imprisoned as a witch.

Clearing Lazare's name completes the main quest. But the connection to Nessa
opens the bigger mystery. Act 1 ends with the player meeting Nessa for the
first time and discovering that the Witness incident was never what the Church
said it was.

**Beginning:** Ceremony → Intercessor oath → assigned to vampire case
**Middle:** Gather testimony → visit Lazare → explore cave → fight through
grid-sick creatures → cyberghost boss
**End:** Present evidence → clear Lazare → recruit him → Aldric reveals
the Nessa connection → first Nessa meeting → hook for Act 2

---

## The Map — One Grid, Many Zones

Single map: `map_open_world` (~180 × 150 cells)

```
SURFACE (rows 0–90):
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  [Mouthstone Gate] ─── [Town Square] ─── [Temple]        │
│         │                   │    │          │             │
│  [Sister Vela]        [Market] [Cordon]  [Scriptorium]   │
│                          │       │          │             │
│  [River Path]     [Residential] [Lower    [Prison/       │
│      │                │    │    Graves]   Hall of         │
│  [Riverman]     [Lazare's] [Inn]          Custody]       │
│                  [House]                                  │
│                    │                                      │
│              [Cave Path] ──────────────────               │
│                    │                                      │
│             [Cave Entrance ↓ continuous stairs]           │
│                                                          │
└──────────────────────────────────────────────────────────┘

CAVE SYSTEM (rows 100–140, connected by stairs + fade teleport):
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  [Cave Mouth] ── [Tunnel] ── [Grotto]                    │
│                       │                                  │
│                 [Log Chamber] (grid sickness writings)   │
│                       │                                  │
│                 [Deep Chamber] (cyberghost boss)          │
│                       │                                  │
│              [Ossuary Passage] ── [Mara's Shrine]        │
│                                   (locked — Act 2 tease) │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Transitions:**
- Town → Cave: Continuous stairs (height changes, walkable cells)
- Cave Mouth → Deep Chamber: Fade teleport (trigger → `screen_fade` + `teleport_player`)
- Mara's Shrine door: Visible but locked (`condition: { switch: "act2_started" }`) — tease

**Zone Music:**
- Town surface: `/music/roll away.ogg` (existing `cut_town_music`)
- Cave system: `/music/Pagan Network.wav` (existing `cut_network_upper_enter`)

---

## Metroidvania Gates

| Gate | Location | Condition | Unlocks |
|------|----------|-----------|---------|
| Leave town square | Square exits | `switch: act1_assigned` | Residential, cave path, Lazare's house |
| Enter cave | Cave path end | `switch: lazare_talked` AND `switch: testimonies_gathered` | Cave system |
| Deep cave | Tunnel fork | `has_item: itm_cave_sigil` (found in grotto) | Cyberghost chamber |
| Prison access | Hall of Custody | `switch: vampire_cleared` | Nessa's cell |
| Mara's Shrine | Ossuary passage | `switch: act2_started` (never set in Act 1) | Locked — future content |
| Mouthstone passage | Gate | `switch: act2_started` | Locked — future content |

---

## Spine Flags (Progression Switches)

| Flag | Set By | Unlocks |
|------|--------|---------|
| `opening_ceremony_complete` | Ceremony cutscene (exists) | Town access |
| `act1_assigned` | Office briefing cutscene | Leave town square, start quest |
| `lazare_talked` | Lazare dialogue | Cave access (with testimonies) |
| `testimony_dimos` | Dimos dialogue option | Counts toward testimonies |
| `testimony_orin` | Orin dialogue option | Counts toward testimonies |
| `testimony_marta` | Marta dialogue option | Counts toward testimonies |
| `testimonies_gathered` | Aldric party dialogue (when 2+ testimonies set) | Cave access |
| `found_log_1` through `found_log_4` | Interact triggers in cave | Evidence chain |
| `cyberghost_defeated` | Boss kill trigger | Cave complete |
| `vampire_cleared` | Town verdict cutscene | Prison access, Lazare recruitable |
| `lazare_recruited` | Lazare join dialogue | Party member |
| `met_nessa` | First Nessa dialogue (exists) | Nessa thread open |
| `nessa_thread_started` | End of Act 1 cutscene | Act 1 complete flag |

**Secondary (flavor, not gating):**
- `class_scholar` / `class_warrior` / `class_mystic` (exist)
- `heard_rhyme`, `seen_cordon`, `seen_funeral` (exist)
- `read_ledger`, `read_orders` (exist)
- `nessa_saw_stone` (exists)

---

## Quests

### Quest 1: "The Lonely Vampire" (MAIN — full arc)
```
id: quest_vampire
display_name: "The Lonely Vampire"
description: "A body in the eastern caves. The town says vampire. The Church says investigate."
objectives:
  - obj_briefing: "Report to Aldric at the Scriptorium" (talk, ent_aldric)
  - obj_testimony: "Gather testimony from townspeople" (talk, custom, count: 2)
  - obj_lazare: "Visit Lazare Behind the Shutters" (talk, ent_lazare_vampire)
  - obj_cave: "Investigate the eastern caves" (explore, cave)
  - obj_cyberghost: "Confront what remains in the deep" (kill, ent_cave_cyberghost)
  - obj_verdict: "Present evidence to the town" (talk, ent_aldric)
```
States: `assigned` → `investigating` → `cave_entered` → `evidence_found` → `complete`

### Quest 2: "The Witness Investigation" (THREAD — starts, does not resolve)
```
id: quest_investigate (exists, adapt)
display_name: "The Witness Investigation"
description: "The cave victim's logs mention Mara Vey. Nessa's case is not what the Church says."
objectives:
  - obj_meet_nessa: "Hear Nessa at the bars" (talk, ent_nessa)
```
States: `discovered` → `her_words` (after first Nessa meeting)

---

## Engine Systems Used

Every major system gets exercised in Act 1:

| System | Where It's Used |
|--------|-----------------|
| **Class selection** | Ceremony dialogue → Scholar/Warrior/Mystic switches |
| **Cutscenes** | Ceremony, briefing, cave descent, boss intro, verdict, Nessa meeting, ending |
| **Dialogue + conditions** | 15+ NPC conversations gated on switches, quests, items, class, time_of_day |
| **Combat** | 3 enemy types in cave + cyberghost boss |
| **Party system** | Aldric joins at ceremony; Lazare joins after verdict |
| **Items + inventory** | Key items (logs, sigil, stone), consumables (potions), evidence |
| **Containers** | Locked chest in cave (key found elsewhere), lootable shrine offerings |
| **Documents** | Grid sickness logs, writ, field note, family rites, rite fragments |
| **Shops** | Dimos' stall (potions + votives, time-gated pricing) |
| **Triggers** | Step (zone transitions), interact (cave entries, documents), on_load (music) |
| **Quests** | Two quests with state progression |
| **Game clock** | Starts at 21:00 (dusk). Shop prices change at night. NPC schedules shift. |
| **NPC schedules** | Dimos at stall by day, home at night. Guards rotate. Lazare never moves. |
| **Faction reputation** | Church rep from procedural behavior, town rep from votive gifts |
| **Metroidvania gates** | 6 progression gates using conditions |
| **Save system** | Wayside candle save points (existing) |
| **Abilities/skills** | Class skills in combat, Examine for investigation flavor |
| **Music switching** | Town theme ↔ cave theme via on_load triggers |
| **Screen fades** | Zone transitions, dramatic moments |
| **Camera pans** | Cordon reveal, cave reveals, boss intro |

---

## Content Reuse vs. Fresh

### REUSE (adapt coordinates + minor dialogue edits)

| Asset | ID | Adaptation Needed |
|-------|----|-------------------|
| Opening ceremony | `dia_opening_ceremony`, `cut_arrival` | Update cell coordinates for new map |
| Office briefing | `dia_office_briefing`, `cut_office_briefing` | Add vampire case framing before Nessa mention |
| Aldric party dialogue | `dia_aldric_party` | Add vampire quest nodes, testimony tracking |
| Nessa prison dialogue | `dia_nessa_bars` | Keep first-meeting nodes, gate behind `vampire_cleared` |
| Nessa party dialogue | `dia_nessa_party` | Keep as-is (won't fire in Act 1 but ready for Act 2) |
| 12 NPC dialogues | `dia_merchant` through `dia_lazare_vampire` | Add testimony nodes to Dimos, Orin, Marta; expand Lazare |
| All enemy entities | `ent_rite_remnant_*`, `ent_candle_eaten_*`, `ent_partial_conversion_*` | Reuse in cave placements |
| Bound Remnant | `ent_bound_remnant` | Repurpose as cave mini-boss or cut |
| All items | `itm_health_potion` through `itm_rite_fragment_2` | Keep all; add new cave items |
| All documents | `doc_writ` through `doc_rite_fragment_2` | Keep all; add grid sickness logs |
| All skills | `skl_investigate` through `skl_brothers_oath` | No changes |
| Shop | `shop_town` | No changes |
| Save/candle | `ent_save`, `dia_save`, `cut_save` | Place at cave entrance + town |
| Scene cutscenes | `cut_first_sight`, `cut_funeral_shrine`, `cut_children_rhyme` | Update cell coordinates |
| Document readers | `cut_read_ledger`, `cut_read_orders`, etc. | No changes |
| Music cutscenes | `cut_town_music`, `cut_network_upper_enter` | No changes |
| Gaol scenes | `cut_gaol_entry`, `dia_gaol_entry_scene`, `dia_gaoler` | Gate behind `vampire_cleared` |
| Sprites | All 14 NPC sprites, player sprite, enemy sprite | No changes |
| Lazare sprite | `spr_lazare_vampire` | Already wired (this session) |

### WRITE FRESH

| Asset | ID | Purpose |
|-------|----|---------|
| Map generator | `openworld_gen.ts` | Single open-world map with all zones |
| Cave cyberghost entity | `ent_cave_cyberghost` | Boss: rageful ghost of grid sickness victim |
| Grid sickness logs (4) | `doc_grid_log_1` through `doc_grid_log_4` | Evidence chain in cave |
| Cave sigil item | `itm_cave_sigil` | Metroidvania key for deep cave |
| Lazare dialogue (expanded) | `dia_lazare_vampire` (rewrite) | Full conversation tree with testimony, recruitment |
| Vampire quest | `quest_vampire` | Main quest definition |
| Testimony dialogue nodes | Added to `dia_merchant`, `dia_glass_apprentice`, `dia_burial_keeper` | NPC testimony about the body |
| Cave descent cutscene | `cut_cave_descent` | Fade + teleport to deep cave |
| Cyberghost boss intro | `cut_boss_intro` | Camera pan, dialogue, class-gated approach |
| Verdict cutscene | `cut_vampire_verdict` | Town assembly, evidence presented, Lazare cleared |
| Lazare recruitment cutscene | `cut_lazare_join` | Add to party, dialogue |
| Nessa connection cutscene | `cut_nessa_connection` | Aldric reveals Mara link, opens prison |
| Act 1 ending | `cut_act1_end` | Fade, terminal text, Alderamontico poem |
| 20–25 triggers | `trg_*` | Zone gates, document pickups, boss activation, transitions |
| Lazare combat stats | Update `ent_lazare_vampire` | Make him a viable party member (ATK, skills) |
| Lazare skills (2) | `skl_blood_read`, `skl_night_veil` | Vampire party member abilities |

---

## Day-by-Day Task Breakdown

---

### DAY 1 — The World

*Goal: Walkable open-world map with all zones, the ceremony plays, gates block
correctly, NPCs are placed and talkable.*

#### 1.1 Map Generator (`openworld_gen.ts`)
- [ ] Create `src/schema/openworld_gen.ts` with `generateOpenWorldCells()` function
- [ ] **Town Square zone** (~30×30): Central plaza with Mouthstone at north edge, cobblestone floor, fountain/statue centerpiece, roads branching east/south/west
- [ ] **Temple + Scriptorium zone** (~20×25): East of square, raised terrace (visual_height +1), Aldric's office interior, archive room
- [ ] **Market zone** (~15×20): South of square, Dimos' stall area, open market with scattered objects
- [ ] **Witness Cordon zone** (~15×15): South-east, cordoned statue area with guard posts, visible but gated
- [ ] **Prison / Hall of Custody zone** (~20×15): East, cell block, warden's desk, Nessa's bars
- [ ] **Residential zone** (~25×20): South-west, 3-4 house structures, Lazare's shuttered house (interior accessible), sealed cellar
- [ ] **Inn / Counted Cup zone** (~15×15): Part of residential, inn interior with beds, bar
- [ ] **Lower Graves zone** (~15×15): South, burial keeper area, gravestones, lower terrain
- [ ] **River Path zone** (~20×10): West edge, riverside, Riverman's dock
- [ ] **Cave Path zone** (~15×20): South-east, winding path from town to cave entrance, elevation descent
- [ ] **Cave Mouth zone** (~15×15): Continuous stairs down from cave path, first cave chamber
- [ ] **Cave Tunnel zone** (~20×15, offset at row 100+): Main cave corridor, branching paths
- [ ] **Grotto zone** (~15×10): Side chamber with sigil item, containers
- [ ] **Log Chamber zone** (~10×10): Grid sickness writings on walls, evidence
- [ ] **Deep Chamber zone** (~15×15): Boss arena, open space, cyberghost spawn point
- [ ] **Ossuary Passage zone** (~10×20): Bone-lined corridor leading to locked Mara's Shrine door
- [ ] **Mouthstone Gate zone** (~10×10): North edge of map, Sister Vela's post, locked exit

#### 1.2 Object Kit
- [ ] Audit existing object library (witnessKit, networkKit) — list all available `obj_*` IDs
- [ ] Place town objects: walls, floors, columns, market stalls, prison bars, furniture
- [ ] Place cave objects: stalactites, rubble, bone piles, shrine fragments, sigil stones
- [ ] Place environmental storytelling objects: blood stains at cordon, candle clusters at shrines, scratched walls in log chamber

#### 1.3 Spawns + Transitions
- [ ] `spawn_start`: Mouthstone Gate area (ceremony starting position)
- [ ] `spawn_office`: Scriptorium interior
- [ ] `spawn_prison`: Hall of Custody entrance
- [ ] `spawn_cave_mouth`: Top of cave stairs
- [ ] `spawn_deep_cave`: Deep chamber entrance (teleport target)
- [ ] `spawn_cave_return`: Cave mouth (return from deep)
- [ ] Transition triggers: cave mouth ↔ deep cave (fade teleport pair)
- [ ] On-load trigger: town music (`cut_town_music`)
- [ ] On-load trigger: cave music (`cut_network_upper_enter`, condition: player in cave region)

#### 1.4 Entity Placements
- [ ] **Aldric**: Scriptorium (schedule: office by day, town square by night)
- [ ] **Nessa**: Prison cell (no schedule, stationary)
- [ ] **Lazare**: Inside his shuttered house (no schedule, stationary, speed 0)
- [ ] **Dimos**: Market stall (schedule: stall 7-20, home 20-7)
- [ ] **Warden Sefa**: Prison entrance
- [ ] **Guard Bren**: Witness cordon
- [ ] **Guard Holt**: Town gate
- [ ] **Father Imre**: Temple
- [ ] **Maro**: Inn interior
- [ ] **Sela**: Town square (schedule: square 8-18, home 18-8)
- [ ] **Petra**: Near cordon/lower graves
- [ ] **Liss**: Residential area
- [ ] **Cosmas**: Town square (pilgrim, wanders)
- [ ] **Riverman**: River path dock
- [ ] **Sister Vela**: Mouthstone Gate
- [ ] **Orin**: Near cordon/glassworks area
- [ ] **Marta**: Lower graves
- [ ] **Wayside Candle (save)**: Town square + cave entrance (2 placements)
- [ ] **Cave enemies**: Rite Remnants ×3 (tunnel), Candle-Eaten ×2 (grotto), Partial Conversions ×2 (deep cave)
- [ ] **Cave Cyberghost**: Deep chamber (boss, initially hidden via `set_entity_hidden` until triggered)

#### 1.5 Gate Triggers
- [ ] `trg_gate_square_south`: Step trigger on square exits, condition `switch: act1_assigned`, blocks with dialogue "The Scriptorium first."
- [ ] `trg_gate_cave`: Step trigger on cave path, condition `all: [switch: lazare_talked, switch: testimonies_gathered]`, blocks with "You should know what you're looking for first."
- [ ] `trg_gate_deep`: Interact trigger at tunnel fork, condition `has_item: itm_cave_sigil`, blocks with "A sigil-mark seals this passage."
- [ ] `trg_gate_prison`: Step trigger at Hall of Custody, condition `switch: vampire_cleared`, blocks with "The warden won't admit you. Not yet."
- [ ] `trg_gate_mara_shrine`: Interact trigger at ossuary door, always blocks in Act 1 with "This door bears old marks. It won't answer you yet."
- [ ] `trg_gate_mouthstone`: Interact trigger at gate, always blocks with "The road beyond the Mouthstone is not your assignment."

#### 1.6 Smoke Test
- [ ] `tsc --noEmit` passes
- [ ] `vite build` passes
- [ ] Game loads in browser
- [ ] Ceremony cutscene plays at correct coordinates
- [ ] Player can walk around town square
- [ ] Gates block movement correctly
- [ ] NPCs are visible and talkable (even if dialogue needs updating)
- [ ] Cave entrance is reachable; transition works
- [ ] Enemies are visible in cave
- [ ] Music plays correctly per zone
- [ ] Commit: `git commit -m "Day 1: Open world map with all zones and gates"`

---

### DAY 2 — The Vampire Quest

*Goal: Complete playable quest from briefing through cave exploration to boss
fight. All testimony, evidence, and combat working.*

#### 2.1 Adapt Opening Flow
- [ ] Update `cut_arrival` cell coordinates for new map spawn point
- [ ] Update `cut_office_briefing` to frame the vampire case: "A body in the eastern caves. The town says Lazare. We say investigate."
- [ ] Update `dia_office_briefing` to mention the cave body, give `doc_writ` and `doc_field_note`, set `act1_assigned`
- [ ] Set quest state: `quest_vampire` → `assigned`
- [ ] Verify: ceremony → briefing → town opens. Smooth flow.

#### 2.2 Testimony Dialogues (3 NPCs)
- [ ] **Dimos** (`dia_merchant`): Add testimony node gated on `act1_assigned` + NOT `testimony_dimos`. "Half this town won't walk past his shutters after dark. But I'll say this — I sell candles, Intercessor. Lazare has never bought one. The people who pray in basements? They buy sevens." Sets `testimony_dimos`.
- [ ] **Orin** (`dia_glass_apprentice`): Add testimony node. "I work Glass all day. I know what grid sickness looks like — the shaking, the eye-drift, the way they stop blinking. That body in the cave? That's not bite marks. That's someone who burned from the inside." Sets `testimony_orin`.
- [ ] **Marta** (`dia_burial_keeper`): Add testimony node. "Lower graves for lower questions. I buried three who looked like that cave body this year. None had fang marks. All had soil under their nails and votive ash on their lips." Sets `testimony_marta`.
- [ ] Update `dia_aldric_party`: Add node for when 2+ testimonies are set. Aldric: "Grid sickness. Not a vampire. But the town needs more than our word — they need the cave." Sets `testimonies_gathered`.

#### 2.3 Lazare Dialogue (Expanded)
- [ ] Rewrite `dia_lazare_vampire` as full conversation tree:
  - **Node 1 (gated: act1_assigned)**: Initial meeting. Lazare is hostile, defensive. "Another Church dog at my door. What do you want?"
  - **Node 2**: Player can ask about the cave body. Lazare: "I haven't left this house in years. You can smell the dust. But I'll tell you what I know."
  - **Node 3**: The mirror testimony. "The night that body was dragged in there — every mirror in my room showed the old road instead of my face. Something opened. It wasn't me." Sets `lazare_talked`.
  - **Node 4 (class_mystic gate)**: Mystic-only node. "You have the sight, don't you? Then you know I'm telling the truth. I can feel the Grid in this house. It's been getting worse."
  - **Node 5 (post-verdict, gated: vampire_cleared)**: Recruitment dialogue. "You cleared my name. Nobody's done that for me in fifty years. Where you go next — I'll walk behind your shutters for once." Option to recruit → `trigger_cutscene: cut_lazare_join`.
  - **Node 6 (party dialogue)**: Party talk for when Lazare is in party.

#### 2.4 Cave Content
- [ ] **Item placements**:
  - `itm_cave_sigil` in grotto container (locked behind Partial Conversion fight)
  - `itm_health_potion` ×2 scattered in tunnel
  - `itm_glass_shard` in log chamber
- [ ] **Container placements**:
  - Grotto offering chest (unlocked, contains sigil + votive ×2)
  - Log chamber cache (locked, key: `itm_archive_key` from town, contains `itm_rite_fragment_1`)
- [ ] **Document placements** (interact triggers):
  - `trg_log_1` → `cut_read_log_1` → `doc_grid_log_1`: "The fatigue won't lift. Three weeks since the last basement rite. My hands shake when I hold the candles. The Church physician says rest. Rest from what? I can feel the Grid in my teeth."
  - `trg_log_2` → `cut_read_log_2` → `doc_grid_log_2`: "I killed the goat last night. I don't remember deciding to. My hands knew what to do before I did. The blood looked like light. I wrote the old words on the barn wall. I don't know those words."
  - `trg_log_3` → `cut_read_log_3` → `doc_grid_log_3`: "The candles help. The old prayers help. Nothing from the Church helps. Mara says she found something better. Not the basement. The Witness itself. She says Nessa gave her the words. We go tonight."
  - `trg_log_4` → `cut_read_log_4` → `doc_grid_log_4`: "I can't go. My body won't move right anymore. Mara went without me. Tollen and Iria too. I heard screaming from the hill. I crawled here. The dark is the only thing that doesn't hurt."
- [ ] Set `found_log_3` and `found_log_4` — these mention Mara and Nessa (evidence for later)

#### 2.5 New Documents (4 Grid Sickness Logs)
- [ ] Write `doc_grid_log_1` through `doc_grid_log_4` in `familiar_dark_content.ts`
- [ ] Create corresponding cutscenes `cut_read_log_1` through `cut_read_log_4` (same pattern as existing `cut_read_ledger`)

#### 2.6 Cave Cyberghost Boss
- [ ] Create entity `ent_cave_cyberghost`:
  - Display name: "The Grid-Sick" (or "Rageful Remnant")
  - Stats: HP 25, ATK 5, DEF 2, SPD 9
  - Sprite: `spr_cyberghost`
  - Not NPC (hostile)
  - Skills: existing enemy melee (no special skills needed for Act 1)
- [ ] Create `cut_boss_intro` cutscene:
  - `screen_fade` out → `camera_pan` to boss cell → `screen_fade` in
  - `show_dialogue` → `dia_boss_intro`
  - Class-gated branches:
    - Mystic: "You hear it before you see it. A voice scraped thin: 'The candles... Mara said the candles would...'"
    - Scholar: "The markings on the walls converge here. This is where they stopped writing and started screaming."
    - Warrior: "Something stands between you and the body. It crackles with Glass."
  - `set_entity_hidden`: false (reveal boss)
- [ ] Create `dia_boss_intro` with class-gated nodes
- [ ] Trigger: `trg_boss_activate` — step trigger in deep chamber, once, condition `has_item: itm_cave_sigil`, fires `cut_boss_intro`
- [ ] After boss dies: step trigger on boss cell → `cut_boss_aftermath` → give evidence item, set `cyberghost_defeated`

#### 2.7 Combat Verification
- [ ] Verify bump-attack combat works (test: walk into Rite Remnant in tunnel)
- [ ] Verify skills fire correctly (test each class)
- [ ] Verify Aldric party AI works in combat
- [ ] Verify enemy death removes them
- [ ] Verify boss has correct stats (not too easy, not too hard — ~3 minutes of combat)
- [ ] If `startCombat` is still a no-op, wire it up or ensure bump-attack auto-engages correctly

#### 2.8 Smoke Test
- [ ] Full playthrough: ceremony → briefing → gather 2 testimonies → talk to Lazare → enter cave → explore → find logs → get sigil → enter deep cave → boss fight → win
- [ ] All documents readable
- [ ] All gates work in sequence
- [ ] Combat functional throughout cave
- [ ] No softlocks (can always backtrack)
- [ ] Commit: `git commit -m "Day 2: Vampire quest playable through boss fight"`

---

### DAY 3 — The Verdict and the Thread

*Goal: Resolve the vampire quest, recruit Lazare, connect to Nessa, complete
Act 1 with terminal ending sequence.*

#### 3.1 Verdict Sequence
- [ ] Create `cut_vampire_verdict` cutscene:
  - Trigger: interact trigger at Scriptorium when `cyberghost_defeated` is true
  - `screen_fade` out → `camera_pan` to town square → `screen_fade` in
  - `show_dialogue` → `dia_verdict`
  - Player presents evidence (dialogue options gated on which logs were found):
    - "The logs describe grid sickness, not a vampire attack." (requires `found_log_1`)
    - "The victim mentions Mara Vey and the pagan rites." (requires `found_log_3`)
    - "The body shows conversion patterns, not bite marks." (requires `testimony_orin`)
  - Aldric: "The evidence is clear. Lazare is not responsible. The cave body died of grid sickness compounded by unsanctioned rite exposure."
  - `set_switch`: `vampire_cleared` = true
  - `set_quest_state`: `quest_vampire` → `complete`
  - `adjust_faction_rep`: church +5 (procedural, by the book)
- [ ] Create `dia_verdict` dialogue tree with evidence-gated options

#### 3.2 Lazare Recruitment
- [ ] Create `cut_lazare_join` cutscene:
  - `add_party_member`: `ent_lazare_vampire`
  - `set_switch`: `lazare_recruited`
  - `learn_skill`: `skl_blood_read` (Lazare-granted party skill)
  - Lazare line: "Fifty years behind shutters. I forgot what the sky smelled like."
- [ ] Update `ent_lazare_vampire` stats for party combat:
  - HP: 18, MP: 8, ATK: 6, DEF: 3, SPD: 12
  - Skills: `skl_blood_read`, `skl_night_veil`
- [ ] Create `skl_blood_read`:
  - "Lazare reads the blood-history of a target, exposing weakness."
  - AP: 1000, MP: 3, element: none, targeting: single, range: 3
  - Payload: damage 4 (represents exposing/exploiting)
- [ ] Create `skl_night_veil`:
  - "Lazare wraps an ally in old dark, mending what the light burned."
  - AP: 1000, MP: 2, element: none, targeting: single, range: 2
  - Payload: heal 5
- [ ] Create `dia_lazare_party` (party dialogue for Lazare):
  - Node about the cave: "That ghost was someone I might have known. Grid sickness takes everyone the same way."
  - Node about Nessa (gated: `met_nessa`): "I've watched that girl read by the statue from my window. She's not a witch. She's a student who found the wrong book."
  - Node about the town: "They blamed me because it was easy. That's what towns do."

#### 3.3 The Nessa Connection
- [ ] Create `cut_nessa_connection` cutscene:
  - Fires after verdict, when player talks to Aldric at Scriptorium
  - Aldric reads log 3 more carefully: "This log mentions Mara Vey. And Nessa."
  - Aldric pauses. "Mara Vey is in the Nessa docket. She was one of the friends who turned to Glass at the Witness."
  - "The cave victim was part of the same rite circle. This isn't about a vampire, Intercessor. This is about the Witness."
  - `set_switch`: `vampire_cleared` (already set, but this is the narrative beat)
  - `set_quest_state`: `quest_investigate` → `discovered`
  - `give_item`: `itm_carried_stone` (Aldric gives you Nessa's confiscated effects to return)
  - Prison access unlocks (warden dialogue updates)
- [ ] Update `dia_gaoler` (Warden Sefa): Add node gated on `vampire_cleared`. "The Intercessor cleared the vampire case. I suppose that earns you a visit with the girl. Five minutes."

#### 3.4 First Nessa Meeting
- [ ] Adapt existing `dia_nessa_bars` — the first-meeting nodes (node_1 through node_first4) already work perfectly
- [ ] Ensure trigger at Nessa's cell fires `cut_gaol_entry` → `dia_nessa_bars`
- [ ] The carried stone moment (existing `node_stone` / `node_stone2`) plays if player has `itm_carried_stone`
- [ ] After first meeting: `set_switch: met_nessa`, `set_switch: nessa_thread_started`
- [ ] Update Aldric party dialogue: new node gated on `met_nessa`. "You met her. Whatever you saw in her eyes — that's not evidence. Remember that."

#### 3.5 Act 1 Ending Sequence
- [ ] Create `cut_act1_end` cutscene:
  - Triggers on exiting the prison after meeting Nessa
  - Step trigger, once, condition: `switch: nessa_thread_started`
  - `screen_fade` out (color: black, duration: 2000)
  - `show_dialogue` → `dia_act1_end`:
    - Scene narrator: "The vampire case is closed. But the cave victim's logs burn in your mind."
    - Scene: "Mara Vey. The Witness. Nessa."
    - Scene: "The Church says the case is sealed. Aldric says trust the process."
    - Scene: "But the dead in the cave wrote one truth before they stopped writing: 'It was never the statue that opened.'"
  - `advance_clock`: 480 (skip to next day / dawn)
  - `screen_fade` in
  - `open_save_menu` (player can save their Act 1 completion)
  - Terminal text overlay or document: the Alderamontico poem
- [ ] Create `dia_act1_end` with narrator nodes

#### 3.6 Town NPC Post-Verdict Variants
- [ ] **Dimos** (gated: `vampire_cleared`): "So it wasn't the vampire. I could have told you that. I sell candles, Intercessor, not opinions. But I sell a great many candles."
- [ ] **Orin** (gated: `vampire_cleared`): "Grid sickness. I knew it. The Glass figures in my workshop — they moved wrong the whole week before that body was found."
- [ ] **Marta** (gated: `vampire_cleared`): "You did right. The lower graves know the difference between a killing and a burning-out. Visit again sometime."
- [ ] **Lazare** (gated: `vampire_cleared`, NOT `lazare_recruited`): "My shutters stay open tonight. First time in decades. Thank you."
- [ ] **Guard Bren** (gated: `vampire_cleared`): "The cordon holds. But since the verdict, the statue's been... quieter. I don't like quieter."
- [ ] **Sister Vela** (gated: `nessa_thread_started`): "You walked past the Mouthstone with questions the Church hasn't answered. Be careful which direction curiosity faces, Intercessor."

#### 3.7 Item + Container Polish
- [ ] Place `itm_health_potion` ×3 in town containers (inn chest, scriptorium shelf)
- [ ] Place `itm_votive` ×4 scattered through cave (world items)
- [ ] Place `itm_glass_shard` ×2 in cave containers
- [ ] Verify all container locks/keys work
- [ ] Verify shop functions (buy potions, buy votives)

#### 3.8 Smoke Test
- [ ] Full playthrough: ceremony → briefing → testimonies → Lazare → cave → boss → verdict → Lazare recruitment → Nessa meeting → Act 1 end
- [ ] All evidence-gated dialogue works
- [ ] Lazare joins party and fights correctly
- [ ] Post-verdict NPC dialogue appears
- [ ] Act 1 ending sequence plays
- [ ] Save/load works at candle points
- [ ] No orphaned triggers or softlocks
- [ ] Commit: `git commit -m "Day 3: Vampire quest complete, Nessa thread opens, Act 1 ending"`

---

### DAY 4 — Polish, Balance, Ship

*Goal: Everything feels good. Numbers tuned. Edge cases caught. Start to
finish playthrough is clean.*

#### 4.1 Combat Balance Pass
- [ ] **Player base stats audit** (HP 20, ATK 5, DEF 2, SPD 10):
  - Scholar class delta: −4 HP, +6 MP → 16 HP, 6 MP (glass cannon, skill-dependent)
  - Warrior class delta: +6 HP, +2 ATK, −6 MP → 26 HP, 7 ATK, 0 MP (pure melee)
  - Mystic class delta: +4 MP, +2 SPD, −1 ATK → 20 HP, 4 MP, 4 ATK, 12 SPD (balanced)
- [ ] **Enemy stat audit**:
  - Rite Remnant (HP 8, ATK 4): Should die in 2-3 hits, deal ~2 damage per hit
  - Candle-Eaten (HP 5, ATK 3, SPD 14): Fast, fragile — ambush feel
  - Partial Conversion (HP 16, ATK 5, DEF 3): Tank — slow, patient, dangerous if surrounded
  - Cave Cyberghost boss (HP 25, ATK 5): ~3 min fight, 2-3 potion uses, not trivial
- [ ] **Healing economy**:
  - Health potion heals 5 (exists). Player starts with 0, can buy for 10g each.
  - Candle Mend (Scholar) heals 5; Still Echo (Mystic) heals 4; Brother's Oath (Aldric) heals 6
  - Starting money: enough for 2-3 potions (20-30g)
  - Cave has 2 free potions as ground items
  - Wayside candle at cave entrance heals to full + saves
- [ ] **Aldric party member stats**: HP 22, ATK 4, DEF 2, SPD 9 — verify he survives full cave
- [ ] **Lazare party member stats**: HP 18, ATK 6, DEF 3, SPD 12 — verify he adds value in post-verdict play
- [ ] **Skill damage audit**: Ensure skills feel impactful vs. bump-attack. Sacred Line (4 dmg, line) should clear Candle-Eaten in one shot. Cleave (5 dmg, cross) should feel powerful. Witness Flame (3 dmg, range 3) should be tactically useful.
- [ ] Adjust any numbers that feel wrong after playtesting

#### 4.2 Pacing + Clock
- [ ] Game starts at 21:00 (dusk) — verify `settings.clock_start_hour: 21`
- [ ] Ceremony + briefing take ~15 minutes real-time, ~60 game minutes
- [ ] Testimony gathering takes ~10 minutes real-time, ~30 game minutes
- [ ] Cave exploration takes ~20 minutes real-time, ~120 game minutes
- [ ] Boss fight takes ~5 minutes real-time
- [ ] Verdict + Nessa takes ~10 minutes real-time
- [ ] **Total: ~60-75 minutes of play** (1-session Act 1)
- [ ] Verify time-of-day conditions fire correctly (shop prices change at night, NPC schedules shift)
- [ ] Verify `advance_clock` in Act 1 ending pushes to dawn

#### 4.3 NPC Schedule Polish
- [ ] **Dimos**: Market stall (7-20), home cell (20-7). Verify pathfinding works.
- [ ] **Guard Bren**: Cordon post (always). Stationary.
- [ ] **Guard Holt**: Gate (always). Stationary.
- [ ] **Maro**: Inn (always). Stationary.
- [ ] **Cosmas**: Wanders town square → temple → inn (schedule: square 6-12, temple 12-18, inn 18-6)
- [ ] **Sela**: Square (8-18), residential (18-8)
- [ ] **Lazare**: House (always, SPD 0). After recruitment: follows party.
- [ ] Verify no NPCs walk into void or get stuck on objects

#### 4.4 Dialogue Polish Pass
- [ ] Read through every dialogue in full — fix tone, cut filler, ensure character voice
- [ ] Lazare should sound bitter, aristocratic, weary — "fifty years of dust" energy
- [ ] Aldric should sound trustworthy but rigid — he means well but can't bend
- [ ] Nessa should sound sharp, guarded, then cracking — she's scared but won't show it
- [ ] Townspeople should sound like a town that's afraid: gossip, suspicion, half-truths
- [ ] Scene narration should be spare and rhythmic — match the lore doc's cadence
- [ ] Check all dialogue speaker names match `SPEAKER_PORTRAITS` keys (case-insensitive)

#### 4.5 Cutscene Polish
- [ ] **Ceremony** (`cut_arrival`): Verify camera pans feel cinematic. Test timing of fades.
- [ ] **Briefing** (`cut_office_briefing`): Documents should display, Aldric's voice should land.
- [ ] **Cave descent** (`cut_cave_descent`): Fade timing, music transition smooth.
- [ ] **Boss intro** (`cut_boss_intro`): Camera pan to boss should feel dramatic. Class branch should work.
- [ ] **Verdict** (`cut_vampire_verdict`): Town square assembly should feel earned.
- [ ] **Nessa meeting**: Gaol entry, bars dialogue — verify carried stone branch works.
- [ ] **Act 1 end** (`cut_act1_end`): Terminal narration pacing, dawn fade-in, save menu.
- [ ] **All document readers**: Open, display text, close cleanly.
- [ ] Verify no cutscene leaves player stuck or camera in wrong position

#### 4.6 Edge Cases + Softlock Prevention
- [ ] Can the player reach the boss without the sigil? (Gate should block)
- [ ] Can the player enter prison before clearing Lazare? (Gate should block)
- [ ] What happens if the player dies in the cave? (Death screen → load last save)
- [ ] Can the player backtrack from deep cave to surface? (Return trigger works)
- [ ] What happens if player skips optional testimonies? (2 required, any combination of 3)
- [ ] What if player sells/drops the cave sigil? (Key items shouldn't be droppable — verify)
- [ ] What if player talks to Nessa before having the stone? (Dialogue should branch correctly — existing logic handles this)
- [ ] Can player recruit Lazare and then enter areas that were gated? (Should work — Lazare join is post-verdict)
- [ ] What if player walks back into cave after beating boss? (Boss should stay dead — `set_entity_hidden` persists in entity_states)

#### 4.7 Visual + Audio Polish
- [ ] Town atmosphere: cobblestone, torchlight objects, evening ambience
- [ ] Cave atmosphere: dark, damp, bone objects, narrowing corridors
- [ ] Verify all sprites render correctly (Lazare's new portrait especially)
- [ ] Verify music transitions: town → cave → town (on_load triggers)
- [ ] Verify no missing textures or invisible objects
- [ ] Verify camera rotation (Q/E) works in all zones without clipping

#### 4.8 Save + Version
- [ ] Bump `metadata.version` to "1.0.0" (new content, wipe old saves)
- [ ] Verify fresh save starts correctly (ceremony → briefing → play)
- [ ] Verify save at wayside candle → quit → reload → continue works
- [ ] Verify all 3 save slots function
- [ ] Clear `crpg-run-save` localStorage before final test

#### 4.9 Full Playthrough (2 passes minimum)
- [ ] **Pass 1 (Scholar)**: Full game, read every document, buy from shop, use Scholar skills, recruit Lazare, experience all testimony, find all logs, beat boss, meet Nessa
- [ ] **Pass 2 (Warrior or Mystic)**: Speed run, verify class-specific dialogue works, verify combat balance with different class, verify minimum-testimony path works
- [ ] Log any bugs found, fix immediately
- [ ] Verify: nothing crashes, no softlocks, story makes sense, pacing feels right

#### 4.10 Final Commit + Tag
- [ ] `tsc --noEmit` clean
- [ ] `vite build` clean
- [ ] `git add -A && git commit -m "v1.0.0: Act 1 — The Lonely Vampire"`
- [ ] `git tag v1.0.0`
- [ ] Done. Ship it.

---

## Content Totals (Final)

| Type | Count | Existing | New |
|------|-------|----------|-----|
| Map zones | 17 | 0 (fresh map) | 17 |
| Entities (NPCs) | 18 | 18 | 0 (adapt placements) |
| Entities (Enemies) | 8 types, ~10 placements | 7 types | 1 (cave cyberghost) |
| Dialogues | 22-25 | 18 (adapt) | 4-7 (verdict, boss, lazare party, act1 end, lazare expanded) |
| Cutscenes | 18-20 | 14 (adapt coordinates) | 4-6 (verdict, boss intro, lazare join, nessa connection, act1 end, cave descent) |
| Documents | 13 | 9 | 4 (grid sickness logs) |
| Items | 11 | 10 | 1 (cave sigil) |
| Quests | 2 | 1 (adapt) | 1 (vampire quest) |
| Skills | 11 | 9 | 2 (Lazare: blood_read, night_veil) |
| Shops | 1 | 1 | 0 |
| Triggers | 25-30 | ~10 (adapt) | 15-20 |
| Sprites | 15 | 14 | 1 (Lazare — already done) |

---

## One Rule

Every scene changes what the player believes about Lazare, about Nessa, or
about the world. Anything that doesn't gets cut.

---

## The Words at the End

> *"A land beyond hatred."*
> *"A land measured in love."*
> *"A land devoured by black light."*
> *"Shall time bear its eternal witness."*
> *"Alderamontico."*
