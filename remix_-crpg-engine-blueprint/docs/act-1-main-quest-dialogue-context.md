# Act 1 Main Quest Dialogue Context

Current source of truth for the full rewrite is
`docs/the_familiar_dark_act1_rewrite_dialogue_bible.md`.

This file summarizes the implemented Act 1 dialogue and clarity pass in the
game package.

## Implemented Spine

1. Opening ceremony names Darro Keel as the cave victim and introduces Orin Vale
   as the loud public accuser.
2. Aldric's office briefing frames three active categories: Lazare/predation,
   Orin/Glass handling, and under-rite/Grid sickness.
3. A one-time market scene, `dia_orin_public_accusation`, fires after the
   office briefing and sets `orin_public_accusation_seen`.
4. Required testimony now includes Dimos, Marta, Holt, and Orin.
5. `testimonies_gathered` is set only after all four testimony switches are
   true.
6. The residential south gate still opens with the aggregate condition:
   `lazare_talked` plus `testimonies_gathered`.
7. The cave route remains:
   `map_residential -> map_old_processional_wood -> map_glass_touched_copse -> map_cave_upper`.
8. Darro's cave logs now reveal Orin's supposedly spent offcut, counting
   compulsion, Mara's hinge, and "It was never the statue that opened."
9. Aldric's verdict clears Lazare, disciplines Orin, names Darro as Grid-sick,
   and opens the Nessa/Witness thread.
10. Nessa's first bars scene now responds to the vampire case closing and the
    cave naming Mara.
11. The High Clerk is placed as a real town NPC with procedural guidance and
    post-verdict context.
12. Orin now has a private Glassworks confrontation after the first cave log and
    a separate post-verdict scene.
13. Lazare now has a separate post-verdict scene inside his house.
14. The Darro remnant boss intro carries the missing combat-bark information in
    the pre-fight cutscene.
15. Nessa's first bars scene triggers an Act 1 case-note card that points the
    player toward the Counted Cup cellar thread.

## Main Dialogue IDs

- `dia_opening_ceremony`
- `dia_office_briefing`
- `dia_case_board`
- `dia_high_clerk`
- `dia_orin_public_accusation`
- `dia_orin_private_confrontation`
- `dia_orin_after_verdict`
- `dia_lazare_after_verdict`
- `dia_merchant`
- `dia_burial_keeper`
- `dia_guard_gate`
- `dia_glass_apprentice`
- `dia_lazare_vampire`
- `dia_processional_wood_sign`
- `dia_tally_animal_clue`
- `dia_glass_copse_trace`
- `dia_glass_copse_exit`
- `dia_office_after`
- `dia_gaoler`
- `dia_nessa_bars`
- `dia_act1_end`
- `dia_cellar`

## Main Cutscene IDs

- `cut_arrival`
- `cut_office_briefing`
- `cut_orin_public_accusation`
- `cut_orin_private_confrontation`
- `cut_orin_after_verdict`
- `cut_lazare_after_verdict`
- `cut_record_dimos`
- `cut_record_marta`
- `cut_record_holt`
- `cut_record_orin`
- `cut_read_log_1`
- `cut_read_log_2`
- `cut_read_log_3`
- `cut_read_log_4`
- `cut_office_after`
- `cut_gaol_entry`
- `cut_act1_end`
- `cut_cellar_seal`

## New Or Revised Flags

- `orin_public_accusation_seen`
- `testimony_holt`
- `found_orin_shard_link`
- `found_darro_name`
- `found_mara_name`
- `orin_private_questioned`
- `orin_pressure_1`
- `orin_after_verdict_seen`
- `lazare_after_verdict_seen`
- `orin_disciplined`
- `act1_end_seen`

Existing flags preserved:

- `office_briefed`
- `act1_assigned`
- `testimony_dimos`
- `testimony_orin`
- `testimony_marta`
- `testimonies_gathered`
- `lazare_talked`
- `found_log_1..4`
- `vampire_cleared`
- `nessa_thread_started`
- `met_nessa`
- `seen_cellar`

## Engine Notes

- The current combat system does not expose random per-round enemy bark data.
  Darro's remnant barks are therefore implemented as voiced pre-fight lines in
  `dia_boss_intro`, where the player reliably receives them before combat.
- Optional ambient lines are implemented for the core Act 1 cast and key
  state changes. They remain compact so the main route stays readable.
