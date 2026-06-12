# AI Authoring Guide — CRPG Engine

Quick reference for authoring game content in this engine. The game ships as a
single `GamePackage` (see `src/schema/game.ts`). The playable seed content
lives in `createEmptyGamePackage()` plus `src/schema/presets.ts` (object/sprite
libraries) and `src/schema/town_gen.ts` (procedural town cells). Authoring in
code is the primary workflow; the in-app editors and JSON import/export are
secondary.

## Package anatomy

| Collection | Purpose |
| --- | --- |
| `maps[]` | Cells, spawns, entity/object/item/container placements, triggers, exits |
| `entities[]` | NPC/enemy definitions (`is_npc: true` = talkable, false = hostile) |
| `dialogue[]` | Node graphs; options can gate on quests and switches |
| `cutscenes[]` | Linear action lists (see `EventActionSchema` for the verb set) |
| `quests[]`, `documents[]`, `items[]`, `abilities[]`, `shops[]` | Self-explanatory |
| `object_library[]` / `sprite_library[]` | 3D models / pixel sprites |
| `settings` | Free-form; honored keys: `player_sprite_id`, `player_stats` |

ID conventions: `map_*`, `ent_*`, `dia_*`, `cut_*`, `trg_*`, `itm_*`, `skl_*`,
`obj_*`, `spr_*`, `doc_*`, `quest_*`, `shop_*`, `spawn_*`. All cross-references
are by string id and unvalidated at runtime — typos fail silently, so grep
before renaming.

## Multi-map travel

Two paths:

1. **Map exits** (preferred for zone travel). Per map:
   ```ts
   exits: [{ cell: [x, z], target_map_id: "map_pagan_network",
             target_spawn_id: "spawn_from_town", facing: [0, 1] }]
   ```
   Stepping on the cell loads the target map at the named spawn (falls back to
   the target's first spawn). Make the exit cell walkable.
2. **`teleport_player` cutscene action** with `map_id` + `cell` for scripted
   transitions.

Mid-session the save's `current_map_id` drives which map is active; the
editor-selected map only applies when Play mode is first opened.

## Condition query layer

One declarative condition shape (`ConditionSchema` in `schema/game.ts`,
evaluated by `evaluateCondition` in `utils/conditions.ts`) gates everything:

```ts
{ all: [
    { switch: "witness_rite_known" },
    { time_of_day: ["night"] },          // also matches witching_hour
    { any: [ { has_item: "itm_glass_shard", item_count: 2 },
             { faction: "church", rep_gte: 10 } ] },
    { not: { party_contains: "ent_aldric" } } ] }
```

Predicates: `switch`/`switch_value`, `quest`/`quest_state`,
`has_item`/`item_count`, `party_contains`, `faction` + `rep_gte`/`rep_lte`,
`time_of_day` (phase ids: witching_hour/night/dawn/day/dusk),
`hour_gte`/`hour_lt` (wraps past midnight). Predicates in one node AND
together; `all`/`any`/`not` compose. A missing condition always passes.

Where `condition` is accepted:

- **Dialogue options** — option hidden unless it passes (ANDed with the
  legacy `required_*` fields).
- **Triggers** — ANDed with the legacy `conditions` switch array.
- **Cutscene `branch` actions** — jump when it passes.
- **Shop items** — item hidden from stock unless it passes; plus
  `price_modifiers: [{ condition, multiplier, delta }]` applied in order
  (`price * multiplier + delta`, rounded, floored at 0).

Faction rep lives in `save.faction_rep` (missing = 0); change it with the
`adjust_faction_rep` cutscene action (`faction_id`, `amount`).

## Cutscene control flow & staging

Actions execute in order; these verbs add flow and presentation:

- `{ type: "label", label: "name" }` — no-op jump target.
- `{ type: "branch", target_label: "name", condition? }` — jump to the label
  when the condition passes (unconditional without one). Jumps are capped at
  200 per cutscene run; always pair backward jumps with a state change.
- `{ type: "screen_fade", fade: "out" | "in", color?, duration? }` — overlay
  fade; the cutscene waits `duration` (default 600ms) before continuing, so
  actions after a fade-out happen behind black.
- `{ type: "camera_pan", cell: [x, z], duration? }` — glide the camera to a
  cell; omit `cell` to glide back to the player. The cutscene waits
  `duration` (default 800ms). Pan back before the cutscene ends (the engine
  force-returns the camera at cutscene end, but a deliberate return reads
  better).
- `{ type: "play_music", music_url? | music_id?, volume? }` — loops a track
  (stops the previous one); `music_id` resolves through
  `settings.music_tracks` (id → URL map); omit both to stop music.
- `{ type: "adjust_faction_rep", faction_id, amount }`.
- `{ type: "advance_clock", amount }` — jump the clock forward `amount` game
  minutes (inn rest, act transitions).
- `{ type: "modify_player_stats", stats: { max_hp: 6, attack: 2 } }` —
  additive deltas; raising a maximum also grants the difference, floors keep
  a run alive.
- `{ type: "learn_skill", skill_id }` — adds to `save.known_skills`; the
  skills panel only shows known skills, so all abilities are author-defined
  but class/story-gated.
- `{ type: "set_entity_hidden", entity_id, hidden }` — despawn/respawn an
  entity placement (render, collision, AI all skip hidden entities).
- `{ type: "open_save_menu" }` — opens the save/load slots panel (used by
  the wayside candle via `cut_save`).

**Class pattern** (see `cut_intro`): the ceremony dialogue's discipline node
sets `class_scholar` / `class_warrior` / `class_mystic` via option
`set_switch`, then the cutscene branches per class to grant stats and
skills, converging on a shared `lbl_sworn` label. Any later content can gate
on the class switches.

## Saving & loading

Continuous autosave persists the run (`crpg-run-save`). Explicit slots:
three localStorage slots (`crpg-save-slot-N`) with metadata, managed by the
save menu (HUD save button, the wayside candle, or the death screen's
"Recall a Memory"). Loading validates `package_version` — bumping the
package version invalidates old slot loads by design.

Example (the Nessa stone branch in the seed build):

```ts
actions: [
  { type: "branch", condition: { has_item: "itm_carried_stone" }, target_label: "has_stone" },
  { type: "show_dialogue", dialogue_id: "dia_nessa_first_sight" },
  { type: "branch", target_label: "end" },
  { type: "label", label: "has_stone" },
  { type: "show_dialogue", dialogue_id: "dia_nessa_first_sight_stone" },
  { type: "set_switch", switch_id: "nessa_saw_stone", switch_value: true },
  { type: "label", label: "end" },
  { type: "set_switch", switch_id: "met_nessa_at_bars", switch_value: true },
]
```

## Reactive dialogue

Dialogue options support:

- `required_quest` + `required_quest_state` — hide unless quest state matches.
- `required_switch` (+ optional `required_switch_value`, default `true`) —
  hide unless the save flag matches.
- `set_switch` (+ optional `set_switch_value`, default `true`) — set a flag
  when chosen.
- `trigger_quest` + `trigger_quest_state` — set quest state when chosen.
- `trigger_cutscene` — runs only when the option also *ends* the dialogue
  (no `next_node_id`).

Switches/flags are one namespace: cutscene `set_switch`, trigger conditions,
dialogue conditions, and the auto-generated `trig_run_<trigger_id>` once-flags
all read/write `saveData.flags`.

## World items & containers

- **Ground items** (`map.item_placements`): `{ id, item_id, cell, count }`.
  Render as floating icon billboards; Act on the faced cell (or underfoot)
  picks them up for a turn. Pickup/drops persist per save in
  `save.map_deltas[mapId]` (`taken_items` / `dropped_items`).
- **Drop**: every inventory row has a Drop button — deterministic placement
  (faced tile, then orthogonals, then diagonals; must be walkable, free of
  containers/entities/items), costs a turn, "No space to drop." otherwise.
- **Containers** (`map.container_placements`): `{ id, object_id, cell,
  facing, display_name, locked, key_item_id, consume_key, items[] }`.
  They block their cell, render via `object_id` (e.g. `obj_chest`), and open
  with Act (costs a turn) into a Take / Take All / Stow panel. Locked
  containers need `key_item_id` in inventory; the first Act unlocks (and
  optionally consumes the key), the next opens. Inventory/locked/opened
  state persists in `map_deltas[mapId].containers[id]` — fields left unset
  fall back to authored values.
- `id` values must be unique within their map; the delta system keys on them.
- In `town_gen.ts` use the `placeContainer(id, objectId, x, z, opts)` and
  `placeItem(id, itemId, x, z, count)` helpers (they reserve + block cells).

## Game clock & NPC schedules

- `save.clock_minutes` counts minutes since day 0, 00:00. It advances during
  the engine pump: `settings.minutes_per_turn` (default 2) game minutes per
  baseline-speed turn. `settings.clock_start_hour` (default 8) sets the
  new-save start time. The HUD shows Day / HH:MM / phase (Witching Hour
  0-1h, Night, Dawn 5-7h, Day 7-18h, Dusk 18-22h).
- **Schedules** live on entity placements:
  ```ts
  { entity_id: "ent_merchant", cell: [20, 11],
    schedule: [ { hour: 7, cell: [20, 11] }, { hour: 20, cell: [26, 20] } ] }
  ```
  At each hour the latest entry whose hour has passed is active (wrapping
  past midnight). Friendly NPCs (`is_npc: true`) BFS one step per turn
  toward the active cell; hostiles ignore schedules. Schedule targets must
  be reachable through walkable cells (doors are floor gaps).

## Entities & party

- `dialogue_id` — talked-to dialogue. `party_dialogue_id` — used by the
  "Talk to Party" button when the entity is in the party (falls back to
  `dialogue_id`).
- Hostile entities (`is_npc: false`) chase within 8 tiles (BFS) and melee
  adjacent. Stats: `max_hp`, `attack`, `defense`, `speed`.
- Runtime entity state is keyed per map + placement index
  (`entityStateKey()` in `src/utils/entityState.ts`). Don't reorder a map's
  `entity_placements` if you care about preserving live saves.
- Roof/overhead geometry: cells with base `y >= 1.5` (e.g. roof tiles at
  y=2) auto-fade when between camera and player, and reveal the whole room
  while the player stands beneath them. Build roofs as flat cells at y=2
  (see `buildStructure` in town_gen.ts) and the cutaway works for free.

## Pitfalls

- **Bumping `metadata.version` wipes player saves** (deliberate: stale story
  flags would otherwise leak across builds). Bump it whenever seed content
  changes in a way old flags would corrupt.
- Map cells are sparse: a missing cell is void (unwalkable, "Nothing there").
  Every walkable location needs an explicit cell entry.
- Cell walkability: `cell.walkable` AND no blocking object. An object blocks
  when its `collision.profile !== "none"`; placements block their rotated
  `collision.footprint` cells.
- Step height: a move is blocked when target `visual_height` exceeds the
  current cell's by more than 1 (each unit renders 0.5 world units tall).
- Step/interact triggers fire from `map.triggers` by exact cell; `once: true`
  is tracked via the `trig_run_<id>` flag.
- `settings.player_stats` (partial `{ hp, max_hp, mp, max_mp, attack,
  defense, speed, energy }`) overrides the new-save defaults — use it instead
  of editing `initSave`.
- Energy economy: every action costs 1000 energy; speed × ticks refills it.
  `ap_cost` on abilities is in the same units.
- JSON import runs `GamePackageSchema.safeParse`; failures still import but
  log issues to the console — check it after importing hand-built packages.
