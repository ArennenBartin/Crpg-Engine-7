# The Familiar Dark — Complete Content Inventory

*CRPG Engine — Build 2 / Act 1*

---

## Overview

**The Familiar Dark** is a narrative investigation RPG set in the parish of Alderamontico. The player arrives as a newly sworn Intercessor — an investigator dispatched by the Church — to probe the death of a local man, Darro Keel, found half-turned to Glass in the eastern caves. The town blames a shuttered vampire named Lazare. The truth is older and stranger.

The game spans Act 1 (complete), covering the surface town, the eastern caves, and the beginning of the underground Pagan Network. Act 2 expands into the under-town.

---

## World & Lore

### The Grid / Dark Lights

A supernatural phenomenon called the Grid (also "the Dark Lights") pervades the parish. Exposure causes Glass to grow through flesh, transforming those affected in three stages:

- **Partial Conversion** — Glass-plated, slow, still semi-human
- **Candle-Eaten** — Hollowed by wrong rites, fast and frail
- **Fully Taken** — Complete transformation

Glass stores impressions and memory. Artisans who work it call this "witness-work." The central Grid conduit for the parish is the Witness statue.

### The Witness Statue

A white marble statue of the Dark Lights on the high terrace of the town. It has been bleeding dark fluid since Acolyte Nessa performed a rite there. It is now cordoned under guard with standing orders to log the bleeding and report any warmth. Central to both official Church faith and the under-town's older pagan practice.

### The Under-Rite

An old prayer called the Rite of Near Witness — designed to contact the Grid without entering the Spire directly. Documented in family ledgers for three generations before the Church arrived. Three families maintained the practice: Rusk, Fen, and Vey. Nessa performed this rite with willing participants; Mara Vey organized it and left a written confession of her own volition.

### Class System

| Class | Description | Skills |
|-------|-------------|--------|
| **Scholar** | Book-learning, written doctrine, investigation through records | Sacred Line, Candle Mend |
| **Warrior** | Combat prowess, church steel, protection | Cleave |
| **Mystic** | Listening to the Grid, pagan knowledge, communion | Witness Flame, Still the Echo |

---

## Maps (16 total)

### Overview Maps
| ID | Name |
|----|------|
| map_parish | Alderamontico Parish (full region) |
| map_town | The Town of the Witness (town overview) |

### Surface — Town & Surroundings
| ID | Name | Type |
|----|------|------|
| map_town_square | Town Square | Central hub |
| map_residential | Residential Quarter | Neighbourhood |
| map_temple_cordon | Temple & Witness Cordon | Sacred/mixed |
| map_old_processional_wood | Old Processional Wood | Forest road, exterior |
| map_glass_touched_copse | Glass-Touched Copse | Contaminated forest, exterior |
| map_river_path | River Path | Riverside, exterior |
| map_lazare_house | Lazare's Estate | Shuttered dwelling, interior |
| map_mouthstone_field | Mouthstone Field | Exile gate, exterior |
| map_glassworks | Abandoned Glassworks | Industrial interior |

### Caves (Act 1 Dungeon)
| ID | Name | Type |
|----|------|------|
| map_cave_upper | Eastern Caves | Cave entrance/upper chamber |
| map_cave_deep | The Depths | Final boss chamber |
| map_cave_grotto | Crystal Grotto | Grotto chamber |

### Pagan Network (Act 2 — Under-Town)
| ID | Name | Type |
|----|------|------|
| map_network_upper | The Pagan Network — Upper Level | Underground sanctuary |
| map_network_depths | The Pagan Network — Depths | Ossuary/burial depths |

---

## NPCs & Entities

### Player's Party

| ID | Name | Role | HP | MP | ATK | DEF | SPD |
|----|------|------|----|----|-----|-----|-----|
| ent_aldric | Brother Aldric | Elder churchman, mandatory companion | 22 | 9 | 4 | 2 | 9 |
| ent_nessa | Acolyte Nessa | Former acolyte, joins after Act 1 setup | 15 | 10 | 0 | 0 | 10 |

### Town NPCs

| ID | Name | Role |
|----|------|------|
| ent_merchant | Provisioner Dimos | Shopkeeper, market stall |
| ent_gaoler | Warden Sefa | Gaol warden |
| ent_guard_cordon | Cordon Guard Bren | Witness statue guard |
| ent_guard_gate | Gate Guard Holt | Gate tally keeper |
| ent_priest | Father Imre | Clergy, temple |
| ent_innkeep | Maro of the Counted Cup | Innkeeper |
| ent_elder | Sela, the Widow's Cousin | Graveside elder |
| ent_mason | Petra the Stonecutter | Craftsperson |
| ent_mother | Liss | Grief-keeper, funeral shrine |
| ent_pilgrim | Cosmas the Pilgrim | Wandering testimony |
| ent_ferryman | The Riverman | River trader, smuggler |
| ent_gate_anchorite | Sister Vela of the Mouthstone | Gate keeper |
| ent_high_clerk | High Clerk | Ceremony authority |
| ent_burial_keeper | Marta of the Lower Graves | Cemetery keeper |

### Suspects

| ID | Name | Role |
|----|------|------|
| ent_glass_apprentice | Orin, Glassworks Hand | Witness/suspect, Glass handler |
| ent_orin_public | Orin Vale | Public square accuser (duplicate state) |
| ent_lazare_vampire | Lazare Behind the Shutters | Shuttered noble, suspect |

### Special

| ID | Name | Role |
|----|------|------|
| ent_cyberghost | Cyberghost | Entity at network shrine |
| ent_save | Wayside Candle | Save point interactive |

### Enemies

| ID | Name | Count | HP | ATK | DEF | SPD | XP | Description |
|----|------|-------|----|-----|-----|-----|----|-------------|
| ent_rite_remnant_1–7 | Rite Remnant | ×7 | 8 | 4 | 1 | 8 | 12 | Slow shapes left standing by interrupted rites; network levels |
| ent_candle_eaten_1–4 | Candle-Eaten | ×4 | 5 | 3 | 0 | 14 | 10 | Fast and frail — fed the wrong flame; hunt in pairs |
| ent_partial_conversion_1–5 | Partial Conversion | ×5 | 16 | 5 | 3 | 5 | 24 | Glass-plated, slow, patient |
| ent_bound_remnant | Bound Remnant | ×1 (Boss) | 30 | 6 | 2 | 7 | 70 | Act 1 finale boss; rises when Mara's ledger is read |
| ent_darro_remnant | Darro's Remnant | ×1 (Boss) | — | — | — | — | — | Darro Keel's Glass-sick consciousness; speaks in fragments; deepest cave |

---

## Quests (2)

### quest_vampire — "The Shuttered Hunger"
> Darro Keel is dead in the eastern caves. The town says vampire. Orin says it loudly. The Church says investigate.

| Objective ID | Description |
|-------------|-------------|
| obj_briefing | Report to Aldric at the Scriptorium |
| obj_testimony | Gather testimony from Dimos, Marta, Holt, and Orin |
| obj_lazare | Knock at Lazare's shuttered front door |
| obj_cave | Follow the Old Processional Wood and Glass-Touched Copse to the eastern caves |
| obj_boss | Confront what remains in the deep |
| obj_verdict | Present evidence to Aldric |

### quest_investigate — "The Witness Investigation"
> Procedural mercy — inquire into the rite at the Witness of the Dark Lights before Acolyte Nessa's sentence is sealed.

| Objective ID | Description |
|-------------|-------------|
| obj_1 | Take Aldric's briefing at the scriptorium |
| obj_2 | Hear Nessa at the bars |
| obj_3 | Find where the town learned to pray (cellar discovery) |

---

## Skills / Abilities (9)

| ID | Name | Class | Cost | Element | Targeting | Effect |
|----|------|-------|------|---------|-----------|--------|
| skl_sacred_line | Sacred Line | Scholar | 3 MP | Shock | Line (range 4) | 4 damage |
| skl_candle_mend | Candle Mend | Scholar | 2 MP | Fire | Single (range 1) | Heal 5 |
| skl_cleave | Cleave | Warrior | 0 MP | Physical | Cross (range 1) | 5 damage |
| skl_witness_flame | Witness Flame | Mystic | 2 MP | Fire | Single (range 3) | 3 damage |
| skl_still_echo | Still the Echo | Mystic | 2 MP | None | Single (range 2) | Heal 4 |
| skl_investigate | Examine | Universal | 0 MP | None | Single (range 1) | Examination |
| skl_censer_arc | Censer Arc | Aldric | 2 MP | Fire | Cone (range 2) | 4 damage |
| skl_censure | Censure | Aldric | 3 MP | Shock | Single (range 3) | 5 damage |
| skl_brothers_oath | Brother's Oath | Aldric | 2 MP | None | Single (range 2) | Heal 6 |

---

## Items (11)

### Key / Quest Items

| ID | Name | Description |
|----|------|-------------|
| itm_carried_stone | Nessa's Carried Stone | River stone; evidence of innocence |
| itm_glass_shard | Glass Shard | Sliver with a foreign feeling |
| itm_archive_key | Archive Key | Heavy church key |
| itm_votive | Votive Candle | Small church candle |
| itm_family_mark_1 | Rusk Family Mark | Slate sigil |
| itm_family_mark_2 | Fen Family Mark | Bronze disk, four-generation mark |
| itm_family_mark_3 | Vey Family Mark | Wooden token |
| itm_rite_fragment_1 | Rite Text — First Leaf | Mara's handwriting; under-rite instructions |
| itm_rite_fragment_2 | Rite Text — Second Leaf | Mara's willing confession; hidden in ossuary |
| itm_cave_sigil | Cave Sigil | River-stone with old marks; opens sealed passage |

### Consumables

| ID | Name | Effect | Price |
|----|------|--------|-------|
| itm_health_potion | Health Potion | Restores 5 HP | 10 |

---

## Shops (1)

### shop_town — "Dimos' Stall" (Town Square)

| Item | Base Price | Night Multiplier |
|------|-----------|-----------------|
| Health Potion | 10 | 1.5× |
| Votive Candle | 4 | 1.5× |

---

## Documents & Lore (13)

### Church / Official

| ID | Name | Contents |
|----|------|---------|
| doc_writ | Writ of Procedural Mercy | Assigns investigation; classifies death as predatory irregularity, Glass exposure, under-rite consequence, or unlawful concealment |
| doc_field_note | Aldric's Field Note | Private request to the player; notes Lazare is dangerous but not necessarily guilty |
| doc_gaol_ledger | The Warden's Ledger | Custody intake log for Nessa; records that the statue's bleeding was logged *before* the rite's supposed hour |
| doc_standing_orders | Cordon Standing Orders | Guard instructions: don't linger past 7 count, log the face bleeding, report warmth, if it turns — don't log it |

### Pagan / Underground

| ID | Name | Contents |
|----|------|---------|
| doc_family_rites | Dusty Ledger | Three generations of Rusk family, four of Fen family, all keeping votives in cellars; "the under-rites didn't start with Mara" |
| doc_fen_votive_count | Fen Votive Count | Bronze and wax tally, four generations of candle-keepers; "do not let the Church think the flame began with us" |
| doc_tollen_journal | Tollen's Note | "Mara said she found something better. Not the basement. The Spire itself. We go tonight." |
| doc_rite_fragment_1 | Rite Fragment — First Leaf | Torn votive paper in Mara's hand; *The Rite of Near Witness*; margin note: "Nessa says the words give our candles power. She doesn't know it runs the other way." |
| doc_rite_fragment_2 | Rite Fragment — Second Leaf | Other half; hidden in ossuary; Mara's confession: "We light them tomorrow. All of us together. My choice. Nobody dragged me. I asked Nessa for the words." |

### Cave Evidence — Darro's Wall Logs

| ID | Name | Contents |
|----|------|---------|
| doc_grid_log_1 | Darro's Wall — Log One | "Orin said it was spent… I held it until the cave became familiar" |
| doc_grid_log_2 | Darro's Wall — Log Two | "The animals move wrong… I marked seven and slept. I marked seven more and the room became quiet enough to hear" |
| doc_grid_log_3 | Darro's Wall — Log Three | "Not teeth. Not hunger… The prayer under the prayer opened. Mara said old prayers have hinges" |
| doc_grid_log_4 | Darro's Wall — Log Four | "I did not open the statue. The prayer under the prayer opened. It was never the statue that opened." |

---

## Dialogue Trees (113+)

### Act Opening
- **dia_opening_ceremony** — "The Oath at the Mouthstone" — opening, class selection
- **dia_office_briefing** — "The Scriptorium Briefing" — case exposition, Orin's public accusation

### Party
- **dia_aldric_party** — "Aldric at Your Shoulder" — companion hub, major branching
- **dia_nessa_bars** — "Nessa Through the Bars" — imprisoned; key investigation dialogue
- **dia_nessa_party** — "Nessa Walking" — post-release walking conversation

### Town NPCs
- **dia_gaol_entry_scene**, **dia_gaoler** — Warden Sefa, gaol entry
- **dia_guard_cordon** — Cordon Guard Bren, multiple topics
- **dia_guard_gate** — Gate Guard Holt, movement records
- **dia_priest** — Father Imre, doctrine & observation
- **dia_innkeep** — Maro, gossip hub
- **dia_elder** — Sela, graveside
- **dia_mason** — Petra, stone observation
- **dia_mother** — Liss, grief keeper
- **dia_pilgrim** — Cosmas, wanderer testimony
- **dia_ferryman** — The Riverman, smuggler info
- **dia_gate_anchorite** — Sister Vela
- **dia_burial_keeper** — Marta of the Lower Graves
- **dia_merchant** — Provisioner Dimos, testimony
- **dia_high_clerk** — High Clerk, ceremony

### Suspects
- **dia_glass_apprentice** — Orin at the glassworks
- **dia_orin_public_square** — Orin's market accusation setup
- **dia_orin_public_accusation** — Orin accuses Lazare publicly
- **dia_orin_private_confrontation** — Orin's Offcut (pressure scene)
- **dia_orin_after_verdict** — Orin post-investigation
- **dia_lazare_vampire** — Lazare Behind the Shutters
- **dia_lazare_door_not_ready** — Lazare's door, early attempt
- **dia_lazare_after_verdict** — Lazare post-cleared

### Location / Ambient
- **dia_mouthstone**, **dia_old_rite_shrine**, **dia_lazare_threshold**, **dia_orin_workbench**, **dia_lower_grave_cloth**
- **dia_statue** — The Witness, From the Line (describes bleeding)
- **dia_cordon** — The Cordon Line
- **dia_notice_board**, **dia_estate_road_sign**, **dia_grove_notice**, **dia_processional_wood_sign**
- **dia_case_board** — Aldric's Case Board (scriptorium)
- **dia_save** — Wayside Candle (save point)
- **dia_tally_animal_clue**, **dia_glass_copse_trace**, **dia_glass_copse_exit**

### Story Events
- **dia_rhyme** — The Counting Rhyme (children's ambient)
- **dia_first_sight** — First Sight of the Cordon (statue reveal)
- **dia_funeral** — The Funeral Shrine
- **dia_cellar** — The Sealed Cellar (trapdoor discovery)
- **dia_maras_basement** — The Rite Circle
- **dia_trapdoor_sealed**, **dia_trapdoor_enter** — cellar descent
- **dia_first_descent** — Aldric's first underground words
- **dia_cyberghost_network** — The Wisp Over the Water (network entity)
- **dia_act1_end** — Act I: The Witness Opens
- **dia_cave_entrance**, **dia_boss_intro** — cave approaches
- **dia_office_after** — Aldric's verdict scene

### Progress Gates
- **dia_gate_blocked_briefing**, **dia_gate_blocked_cave**, **dia_gate_blocked_deep**
- **dia_gate_blocked_prison**, **dia_gate_blocked_mouthstone**
- **dia_gate_blocked_glassworks**, **dia_gate_blocked_shrine**

---

## Cutscenes (47)

### Blocking (Major Story Moments)
| ID | Title |
|----|-------|
| cut_arrival | Arrival at the Gate |
| cut_office_briefing | The Scriptorium Briefing |
| cut_gaol_entry | The Warden's Threshold |
| cut_act1_end | Act I: The Witness Opens |
| cut_children_rhyme | The Counting Rhyme |
| cut_first_sight | First Sight of the Cordon |
| cut_funeral_shrine | The Funeral Shrine |
| cut_cellar_seal | The Sealed Cellar |
| cut_give_votive | A Votive Given |
| cut_read_ledger | The Warden's Ledger |
| cut_read_orders | The Standing Orders |
| cut_read_family_rites | Dusty Ledger |
| cut_read_fen_votive_count | Fen Votive Count |
| cut_maras_basement | The Rite Circle |
| cut_office_after | The Scriptorium Return |
| cut_orin_private_confrontation | Orin's Offcut |
| cut_orin_after_verdict | Orin After the Finding |
| cut_lazare_after_verdict | Lazare After the Finding |
| cut_open_shop | Open Shop (Dimos' Stall) |
| cut_save | Candle Prayer (save point) |
| cut_trapdoor_locked | The Sealed Cellar (early attempt) |
| cut_trapdoor_enter | The First Descent |
| cut_rite_circle | The Scored Circle |
| cut_crypt_fragment | The Second Leaf |
| cut_first_descent | The First Descent (dialogue) |
| cut_cave_descent | Into the Eastern Caves |
| cut_cave_return | Back to the Surface |
| cut_boss_intro | The Grid-Sick |
| cut_read_log_1 | Scratched Wall — First |
| cut_read_log_2 | Scratched Wall — Second |
| cut_read_log_3 | Scratched Wall — Third |
| cut_read_log_4 | Scratched Wall — Final |

### Non-Blocking (Music / Atmosphere / Testimony)
| ID | Title |
|----|-------|
| cut_record_dimos | Dimos's Testimony |
| cut_record_orin | Orin's Testimony |
| cut_record_marta | Marta's Testimony |
| cut_record_holt | Holt's Gate Tally |
| cut_network_upper_enter | The Pagan Network |
| cut_depths_enter | The Depths |
| cut_town_music | Town Theme |
| cut_river_music | River Theme |

### Gate-Blocking (Progress Guards)
| ID | Title |
|----|-------|
| cut_gate_blocked_briefing | The Scriptorium First |
| cut_gate_blocked_cave | Not Yet Ready |
| cut_gate_blocked_deep | The Sigil Seal |
| cut_gate_blocked_prison | No Admittance |
| cut_gate_blocked_mouthstone | The Road Beyond |
| cut_gate_blocked_glassworks | Glassworks Road Held |
| cut_gate_blocked_shrine | Old Marks |

---

## Act Structure

### Act 1: The Investigation (Complete)

**Opening** — The player arrives at the Mouthstone gate as a newly sworn Intercessor. They are greeted by the High Clerk and Brother Aldric, choose a class, and Aldric joins the party.

**Case Assignment** — The Writ of Procedural Mercy is issued. Darro Keel is dead in the eastern caves, partly converted to Glass, surrounded by opened animals. The town blames Lazare, a shuttered vampire. Orin Vale, a glassworks hand, is the loudest accuser.

**Investigation Loop:**
1. **Briefing** — Meet Aldric in the scriptorium. Learn the suspects, witnesses, and case details.
2. **Testimony** — Gather statements from Dimos, Marta, Holt, and Orin.
3. **Suspect Interview** — Meet Lazare Behind the Shutters. Dangerous and hungry but articulate.
4. **Cave Phase** — Navigate upper chamber → deep chamber. Fight Darro's Glass-sick remnant. Read his four wall logs.

**Verdict** — Aldric concludes: Darro died from Grid overexposure, not vampire feeding. Orin supplied a "spent" shard that was still active and failed to report it. Lazare is cleared of the murder. Orin is disciplined.

**Reopening** — With Lazare cleared and Darro's logs mentioning "Mara" and "the prayer under the prayer," Aldric reopens the case toward Nessa. The writ is updated: find where the town learned to pray.

### Act 2: The Under-Town (In Progress)

The player discovers a sealed cellar beneath the Counted Cup inn. Descending reveals the Pagan Network — an extensive underground system of shrines, ossuary chambers, and family rite-spaces that predate the Church. The two primary maps (map_network_upper, map_network_depths) are built; content continues to expand.

---

## Content Counts

| Category | Count |
|----------|-------|
| Maps | 16 |
| Party Members | 2 |
| Town NPCs | 16 |
| Enemy Types | 5 (18 placed instances) |
| Quests | 2 |
| Dialogue Trees | 113+ |
| Skills | 9 |
| Items | 11 |
| Shops | 1 |
| Lore Documents | 13 |
| Cutscenes | 47 |
