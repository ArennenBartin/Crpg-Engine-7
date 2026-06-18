// The Familiar Dark — Build 2 content: cast, dialogue, cutscenes, quests,
// documents, items, shops. The town generator (town_gen.ts) owns coordinates;
// this file owns words and staging. Spine switches:
//   ceremony: opening_ceremony_complete, class_scholar/warrior/mystic
//   act 1:    office_briefed → gaol_entered → met_nessa → seen_cellar
//   texture:  heard_rhyme, seen_cordon, seen_funeral, nessa_saw_stone,
//             gave_votive, read_ledger, read_orders,
//             side_lazare_threshold_evidence, side_tally_animal_clue,
//             side_orin_glassworks_clue, side_marta_burial_clue,
//             side_wayside_candle_text, orin_public_accusation_seen,
//             testimony_holt, found_orin_shard_link, found_darro_name,
//             found_mara_name, orin_private_questioned, orin_pressure_1,
//             orin_after_verdict_seen, lazare_after_verdict_seen,
//             orin_disciplined, act1_end_seen

import type {
  CutsceneData,
  DialogueData,
  DocumentData,
  EntityData,
  ItemData,
  QuestData,
  ShopData,
} from "./game";

// ── Cast ────────────────────────────────────────────────────────────────────

export const FD_ENTITIES: EntityData[] = [
  {
    id: "ent_aldric",
    display_name: "Brother Aldric",
    sprite_id: "spr_aldric",
    dialogue_id: "dia_aldric_party",
    party_dialogue_id: "dia_aldric_party",
    is_npc: true,
    // A working churchman's frame: sturdier than the player, slower than the
    // dark. You command him on his combat turns.
    max_hp: 22, max_mp: 9, attack: 4, defense: 2, speed: 9,
    skills: ["skl_censer_arc", "skl_censure", "skl_brothers_oath"],
  },
  {
    id: "ent_nessa",
    display_name: "Acolyte Nessa",
    sprite_id: "spr_nessa",
    dialogue_id: "dia_nessa_bars",
    party_dialogue_id: "dia_nessa_party",
    is_npc: true,
    max_hp: 15, max_mp: 10, attack: 0, defense: 0, speed: 10,
  },
  {
    id: "ent_rite_remnant_1",
    display_name: "Rite Remnant",
    sprite_id: "spr_rite_remnant",
    is_npc: false,
    max_hp: 8, max_mp: 0, attack: 4, defense: 1, speed: 8,
    xp_reward: 12,
  },
  {
    id: "ent_rite_remnant_2",
    display_name: "Rite Remnant",
    sprite_id: "spr_rite_remnant",
    is_npc: false,
    max_hp: 8, max_mp: 0, attack: 4, defense: 1, speed: 8,
    xp_reward: 12,
  },
  {
    id: "ent_rite_remnant_3",
    display_name: "Rite Remnant",
    sprite_id: "spr_rite_remnant",
    is_npc: false,
    max_hp: 8, max_mp: 0, attack: 4, defense: 1, speed: 8,
    xp_reward: 12,
  },
  // ── Network bestiary (placed across the upper level and the depths) ──────
  // Rite remnants: slow shapes the interrupted rites left standing.
  {
    id: "ent_rite_remnant_4",
    display_name: "Rite Remnant",
    sprite_id: "spr_rite_remnant",
    is_npc: false,
    max_hp: 8, max_mp: 0, attack: 4, defense: 1, speed: 8,
    xp_reward: 12,
  },
  {
    id: "ent_rite_remnant_5",
    display_name: "Rite Remnant",
    sprite_id: "spr_rite_remnant",
    is_npc: false,
    max_hp: 8, max_mp: 0, attack: 4, defense: 1, speed: 8,
    xp_reward: 12,
  },
  {
    id: "ent_rite_remnant_6",
    display_name: "Rite Remnant",
    sprite_id: "spr_rite_remnant",
    is_npc: false,
    max_hp: 8, max_mp: 0, attack: 4, defense: 1, speed: 8,
    xp_reward: 12,
  },
  {
    id: "ent_rite_remnant_7",
    display_name: "Rite Remnant",
    sprite_id: "spr_rite_remnant",
    is_npc: false,
    max_hp: 8, max_mp: 0, attack: 4, defense: 1, speed: 8,
    xp_reward: 12,
  },
  // Candle-eaten: fast and frail — what is left of someone who fed the
  // wrong flame. They hunt in pairs along the ossuary courses.
  {
    id: "ent_candle_eaten_1",
    display_name: "Candle-Eaten",
    sprite_id: "spr_candle_eaten",
    is_npc: false,
    max_hp: 5, max_mp: 0, attack: 3, defense: 0, speed: 14,
    xp_reward: 10,
  },
  {
    id: "ent_candle_eaten_2",
    display_name: "Candle-Eaten",
    sprite_id: "spr_candle_eaten",
    is_npc: false,
    max_hp: 5, max_mp: 0, attack: 3, defense: 0, speed: 14,
    xp_reward: 10,
  },
  {
    id: "ent_candle_eaten_3",
    display_name: "Candle-Eaten",
    sprite_id: "spr_candle_eaten",
    is_npc: false,
    max_hp: 5, max_mp: 0, attack: 3, defense: 0, speed: 14,
    xp_reward: 10,
  },
  {
    id: "ent_candle_eaten_4",
    display_name: "Candle-Eaten",
    sprite_id: "spr_candle_eaten",
    is_npc: false,
    max_hp: 5, max_mp: 0, attack: 3, defense: 0, speed: 14,
    xp_reward: 10,
  },
  // Partial conversions: the Grid got halfway. Slow, glass-plated, patient.
  {
    id: "ent_partial_conversion_1",
    display_name: "Partial Conversion",
    sprite_id: "spr_partial_conversion",
    is_npc: false,
    max_hp: 16, max_mp: 0, attack: 5, defense: 3, speed: 5,
    xp_reward: 24,
  },
  {
    id: "ent_partial_conversion_2",
    display_name: "Partial Conversion",
    sprite_id: "spr_partial_conversion",
    is_npc: false,
    max_hp: 16, max_mp: 0, attack: 5, defense: 3, speed: 5,
    xp_reward: 24,
  },
  {
    id: "ent_partial_conversion_3",
    display_name: "Partial Conversion",
    sprite_id: "spr_partial_conversion",
    is_npc: false,
    max_hp: 16, max_mp: 0, attack: 5, defense: 3, speed: 5,
    xp_reward: 24,
  },
  {
    id: "ent_partial_conversion_4",
    display_name: "Partial Conversion",
    sprite_id: "spr_partial_conversion",
    is_npc: false,
    max_hp: 16, max_mp: 0, attack: 5, defense: 3, speed: 5,
    xp_reward: 24,
  },
  {
    id: "ent_partial_conversion_5",
    display_name: "Partial Conversion",
    sprite_id: "spr_partial_conversion",
    is_npc: false,
    max_hp: 16, max_mp: 0, attack: 5, defense: 3, speed: 5,
    xp_reward: 24,
  },
  // The Bound Remnant: what the interrupted rite left tied to Mara's
  // basement. The Act 1 finale fight — it rises when the ledger is read.
  {
    id: "ent_bound_remnant",
    display_name: "Bound Remnant",
    sprite_id: "spr_bound_remnant",
    is_npc: false,
    max_hp: 30, max_mp: 0, attack: 6, defense: 2, speed: 7,
    xp_reward: 70,
  },
  // A cyberghost over the drowned shrine — consciousness that did not
  // finish leaving. Only a Mystic hears more than static.
  {
    id: "ent_cyberghost",
    display_name: "Cyberghost",
    sprite_id: "spr_cyberghost",
    dialogue_id: "dia_cyberghost_network",
    is_npc: true,
    max_hp: 99, max_mp: 0, attack: 0, defense: 0, speed: 0,
  },
  {
    id: "ent_merchant",
    display_name: "Provisioner Dimos",
    sprite_id: "spr_provisioner_dimos",
    dialogue_id: "dia_merchant",
    is_npc: true,
    max_hp: 10, max_mp: 0, attack: 0, defense: 0, speed: 10,
  },
  {
    id: "ent_save",
    display_name: "Wayside Candle",
    sprite_id: "spr_wayside_candle",
    dialogue_id: "dia_save",
    is_npc: true,
    max_hp: 99, max_mp: 0, attack: 0, defense: 0, speed: 0,
  },
  {
    id: "ent_gaoler",
    display_name: "Warden Sefa",
    sprite_id: "spr_warden_sefa",
    dialogue_id: "dia_gaoler",
    is_npc: true,
    max_hp: 14, max_mp: 0, attack: 0, defense: 0, speed: 9,
  },
  {
    id: "ent_guard_cordon",
    display_name: "Cordon Guard Bren",
    sprite_id: "spr_guard_bren",
    dialogue_id: "dia_guard_cordon",
    is_npc: true,
    max_hp: 14, max_mp: 0, attack: 0, defense: 0, speed: 9,
  },
  {
    id: "ent_guard_gate",
    display_name: "Gate Guard Holt",
    sprite_id: "spr_guard_holt",
    dialogue_id: "dia_guard_gate",
    is_npc: true,
    max_hp: 14, max_mp: 0, attack: 0, defense: 0, speed: 9,
  },
  {
    id: "ent_priest",
    display_name: "Father Imre",
    sprite_id: "spr_father_imre",
    dialogue_id: "dia_priest",
    is_npc: true,
    max_hp: 12, max_mp: 6, attack: 0, defense: 0, speed: 8,
  },
  {
    id: "ent_innkeep",
    display_name: "Maro of the Counted Cup",
    sprite_id: "spr_maro_counted_cup",
    dialogue_id: "dia_innkeep",
    is_npc: true,
    max_hp: 12, max_mp: 0, attack: 0, defense: 0, speed: 9,
  },
  {
    id: "ent_elder",
    display_name: "Sela, the Widow's Cousin",
    sprite_id: "spr_sela",
    dialogue_id: "dia_elder",
    is_npc: true,
    max_hp: 10, max_mp: 0, attack: 0, defense: 0, speed: 7,
  },
  {
    id: "ent_mason",
    display_name: "Petra the Stonecutter",
    sprite_id: "spr_petra_stonecutter",
    dialogue_id: "dia_mason",
    is_npc: true,
    max_hp: 14, max_mp: 0, attack: 0, defense: 0, speed: 9,
  },
  {
    id: "ent_mother",
    display_name: "Liss",
    sprite_id: "spr_liss",
    dialogue_id: "dia_mother",
    is_npc: true,
    max_hp: 10, max_mp: 0, attack: 0, defense: 0, speed: 9,
  },
  {
    id: "ent_pilgrim",
    display_name: "Cosmas the Pilgrim",
    sprite_id: "spr_cosmas_pilgrim",
    dialogue_id: "dia_pilgrim",
    is_npc: true,
    max_hp: 11, max_mp: 0, attack: 0, defense: 0, speed: 9,
  },
  {
    id: "ent_ferryman",
    display_name: "The Riverman",
    sprite_id: "spr_riverman",
    dialogue_id: "dia_ferryman",
    is_npc: true,
    max_hp: 13, max_mp: 0, attack: 0, defense: 0, speed: 11,
  },
  {
    id: "ent_gate_anchorite",
    display_name: "Sister Vela of the Mouthstone",
    sprite_id: "spr_sister_vela",
    dialogue_id: "dia_gate_anchorite",
    is_npc: true,
    max_hp: 11, max_mp: 4, attack: 0, defense: 0, speed: 8,
  },
  {
    id: "ent_high_clerk",
    display_name: "High Clerk",
    sprite_id: "spr_high_clerk",
    dialogue_id: "dia_high_clerk",
    is_npc: true,
    max_hp: 10, max_mp: 0, attack: 0, defense: 0, speed: 8,
  },
  {
    id: "ent_glass_apprentice",
    display_name: "Orin, Glassworks Hand",
    sprite_id: "spr_orin_glassworks_hand",
    dialogue_id: "dia_glass_apprentice",
    is_npc: true,
    max_hp: 10, max_mp: 0, attack: 0, defense: 0, speed: 9,
  },
  {
    id: "ent_orin_public",
    display_name: "Orin Vale",
    sprite_id: "spr_orin_glassworks_hand",
    dialogue_id: "dia_orin_public_square",
    is_npc: true,
    max_hp: 10, max_mp: 0, attack: 0, defense: 0, speed: 9,
  },
  {
    id: "ent_burial_keeper",
    display_name: "Marta of the Lower Graves",
    sprite_id: "spr_marta_lower_graves",
    dialogue_id: "dia_burial_keeper",
    is_npc: true,
    max_hp: 10, max_mp: 0, attack: 0, defense: 0, speed: 7,
  },
  {
    id: "ent_lazare_vampire",
    display_name: "Lazare Behind the Shutters",
    sprite_id: "spr_lazare_vampire",
    dialogue_id: "dia_lazare_vampire",
    is_npc: true,
    max_hp: 18, max_mp: 8, attack: 0, defense: 1, speed: 0,
  },
];

const CUTSCENE_ART_ORIN_ACCUSATION = "/cutscenes/orin-accuses-lazare.png";
const CUTSCENE_ART_ALDRIC_OFFICE = "/cutscenes/aldric-office-briefing.png";
const CUTSCENE_ART_MOUTHSTONE_CEREMONY = "/cutscenes/mouthstone-ceremony.png";
const CUTSCENE_ART_LAZARE_ESTATE = "/cutscenes/lazare-estate-threshold.png";
const CUTSCENE_ART_DIMOS_MARKET = "/cutscenes/dimos-market-stall.png";
const CUTSCENE_ART_NESSA_BARS = "/cutscenes/nessa-bars.png";
const CUTSCENE_ART_ORIN_GLASSWORKS = "/cutscenes/orin-glassworks.png";

const withSceneArt = (
  nodes: DialogueData["nodes"],
  scene_image_url: string,
  scene_image_alt: string,
): DialogueData["nodes"] =>
  nodes.map((node) => ({
    ...node,
    scene_image_url,
    scene_image_alt,
  }));

// ── Dialogue ────────────────────────────────────────────────────────────────

export const FD_DIALOGUE: DialogueData[] = [
  // ——— The oath at the gate ———
  {
    id: "dia_opening_ceremony",
    display_name: "The Oath at the Mouthstone",
    nodes: [
      {
        id: "node_1",
        speaker: "Scene",
        text: "The Old Exile Road ends at the Mouthstone: three tiles of black stone set across the parish limit, polished by hands that were never admitted into the church records. South of it, Alderamontico climbs in terraces toward the cordoned Witness. Even from the gate you can see the white figure on the high square and the dark threads running down its face.",
        scene_image_url: CUTSCENE_ART_MOUTHSTONE_CEREMONY,
        options: [{ text: "So that is the Witness.", next_node_id: "node_2" }],
      },
      {
        id: "node_2",
        speaker: "High Clerk",
        text: "Eyes forward, Intercessor. A body was found in the eastern caves this dawn: Darro Keel, partly Glass-taken, surrounded by animals opened and counted. The town says Lazare Behind the Shutters. Orin Vale says Lazare with both hands in the air and half the market listening. You will inquire before fear learns better lines.",
        scene_image_url: CUTSCENE_ART_MOUTHSTONE_CEREMONY,
        options: [{ text: "I accept the writ.", next_node_id: "node_class" }],
      },
      {
        id: "node_class",
        speaker: "High Clerk",
        text: "Then swear your discipline. By which art will you stand between this town and its wound?",
        scene_image_url: CUTSCENE_ART_MOUTHSTONE_CEREMONY,
        options: [
          {
            text: "By the written word. I read what others fear to open. (Scholar)",
            set_switch: "class_scholar",
            next_node_id: "node_3",
          },
          {
            text: "By church arms. I stand where others cannot. (Warrior)",
            set_switch: "class_warrior",
            next_node_id: "node_3",
          },
          {
            text: "By what the dead still say. I listen past the Glass. (Mystic)",
            set_switch: "class_mystic",
            next_node_id: "node_3",
          },
        ],
      },
      {
        id: "node_3",
        speaker: "Scene",
        text: "Before the clerk can fold the writ, a grey-haired brother crosses the gate plaza - not at procession pace. He comes to you the way a man comes to an old friend at a funeral.",
        scene_image_url: CUTSCENE_ART_MOUTHSTONE_CEREMONY,
        options: [{ text: "Aldric. You came down yourself.", next_node_id: "node_4" }],
      },
      {
        id: "node_4",
        speaker: "Brother Aldric",
        text: "Of course I did. I asked for you by name — we read border cases together before either of us had a title worth envying. I trust you to look at this one and tell me when I am wrong. The Church gave me a clerk's mercy; I wanted a friend's eyes.",
        scene_image_url: CUTSCENE_ART_MOUTHSTONE_CEREMONY,
        options: [{ text: "Then show me where to start.", next_node_id: "node_5" }],
      },
      {
        id: "node_5",
        speaker: "Brother Aldric",
        text: "My office is the east scriptorium hall, just off the authority lane. We begin with paper, then testimony, then suspects. Dimos saw what the town bought. Marta saw what the body was not. Holt counted the road. Orin has made himself evidence by speaking loudly. Come. Let us do this properly.",
        scene_image_url: CUTSCENE_ART_MOUTHSTONE_CEREMONY,
        options: [
          {
            text: "Begin the inquiry.",
            trigger_quest: "quest_vampire",
            trigger_quest_state: "sworn",
          },
        ],
      },
    ],
  },

  // ——— Aldric, the walking case file ———
  {
    id: "dia_aldric_party",
    display_name: "Aldric at Your Shoulder",
    nodes: [
      {
        id: "node_1",
        speaker: "Scene",
        text: "Aldric keeps your pace without being asked. He watches the town the way other men watch weather.",
        options: [
          {
            text: "The cave evidence clears Lazare.",
            condition: { switch: "vampire_cleared" },
            next_node_id: "node_vampire_cleared",
          },
          {
            text: "The rite text is real.",
            condition: { all: [{ switch: "act1_rite_text" }, { not: { switch: "act1_complete" } }] },
            next_node_id: "node_rite_text",
          },
          {
            text: "Where do we start?",
            condition: { not: { switch: "office_briefed" } },
            next_node_id: "node_go_office",
          },
          {
            text: "How do we treat Lazare as a suspect?",
            condition: { all: [{ switch: "act1_assigned" }, { not: { switch: "lazare_talked" } }] },
            next_node_id: "node_vampire_case",
          },
          {
            text: "I spoke with Lazare.",
            condition: { all: [{ switch: "lazare_talked" }, { not: { switch: "vampire_cleared" } }] },
            next_node_id: "node_lazare",
          },
          {
            text: "The town's testimonies agree badly.",
            condition: { all: [{ switch: "testimonies_gathered" }, { not: { switch: "vampire_cleared" } }] },
            next_node_id: "node_testimony",
          },
          {
            text: "The cave logs point past Lazare.",
            condition: {
              all: [
                { any: [{ switch: "found_log_1" }, { switch: "found_log_2" }, { switch: "found_log_3" }, { switch: "found_log_4" }] },
                { not: { switch: "vampire_cleared" } },
              ],
            },
            next_node_id: "node_cave_logs",
          },
          {
            text: "Take me to her.",
            condition: { all: [{ switch: "nessa_thread_started" }, { not: { switch: "met_nessa" } }] },
            next_node_id: "node_go_gaol",
          },
          {
            text: "Where she learned to pray...",
            condition: { all: [{ switch: "met_nessa" }, { not: { switch: "seen_cellar" } }] },
            next_node_id: "node_go_cellar",
          },
          {
            text: "The seal on the inn's cellar.",
            condition: { all: [{ switch: "seen_cellar" }, { not: { switch: "act1_rite_text" } }] },
            next_node_id: "node_act_end",
          },
          {
            text: "Tell me about this town.",
            next_node_id: "node_town",
          },
          {
            text: "About Nessa.",
            condition: { switch: "nessa_thread_started" },
            next_node_id: "node_nessa",
          },
          {
            text: "You keep looking at me strangely.",
            condition: { switch: "class_mystic" },
            next_node_id: "node_mystic",
          },
          { text: "Keep moving." },
        ],
      },
      {
        id: "node_go_office",
        speaker: "Brother Aldric",
        text: "My office - the east scriptorium hall off the authority lane. The writ, Darro's cave report, Lazare's license, Orin's handling slip, and Holt's slate. I will not send you into the caves holding only fear. Paper first.",
        options: [{ text: "Paper first." }],
      },
      {
        id: "node_vampire_case",
        speaker: "Brother Aldric",
        text: "Lazare's hunger is documented. That does not make him innocent. It makes him knowable. Speak to Dimos, Marta, Holt, and Orin. Then speak to the man everyone has already convicted.",
        options: [{ text: "Admissible testimony first." }],
      },
      {
        id: "node_lazare",
        speaker: "Brother Aldric",
        text: "He has not crossed a parish count in years, and Holt's slate supports it. That does not make Lazare harmless. It means this death may belong to a category the town does not have ready. Those are the cases that rot a file from the inside.",
        options: [{ text: "Then we keep asking." }],
      },
      {
        id: "node_testimony",
        speaker: "Brother Aldric",
        text: "Good. Four witnesses, four kinds of contradiction: commerce, burial, road, and craft. None of them prove Lazare's hand. Together they prove the town knew the signs were wrong and wanted an easier word anyway.",
        options: [{ text: "The cave next." }],
      },
      {
        id: "node_cave_logs",
        speaker: "Brother Aldric",
        text: "Grid sickness, not possession. Exposure, fixation, self-loss. Darro wrote his own disappearance on a cave wall, and Orin's 'spent' shard sits at the start of it.",
        options: [{ text: "This starts to sound like Nessa.", next_node_id: "node_cave_logs2" }],
      },
      {
        id: "node_cave_logs2",
        speaker: "Brother Aldric",
        text: "Do not rush there. Nessa's case is not cleaner because Lazare's is dirty. But yes - the same town that wanted a vampire now wants a witch. That is not evidence. It is a habit.",
        options: [{ text: "Then we break the habit carefully." }],
      },
      {
        id: "node_go_gaol",
        speaker: "Brother Aldric",
        text: "The gaol annex, the west hall across the procession from my door. Warden Sefa keeps her. Sefa is not cruel, whatever you have heard about wardens. Speak to Nessa through the bars. I will be beside you, and I will not interrupt unless she lies.",
        options: [{ text: "Unless she lies?" , next_node_id: "node_go_gaol2"}],
      },
      {
        id: "node_go_gaol2",
        speaker: "Brother Aldric",
        text: "She was my student, Intercessor. I know the sound of it.",
        options: [{ text: "To the gaol, then." }],
      },
      {
        id: "node_go_cellar",
        speaker: "Brother Aldric",
        text: "She said: find where Mara learned to pray. Mara Vey grew up over a cellar like every house in this town — but the Counted Cup keeps the oldest one, and Maro keeps it sealed. Church-stamped. Ask yourself why an innkeeper has a seal the gaol does not.",
        options: [{ text: "The inn, then." }],
      },
      {
        id: "node_act_end",
        speaker: "Brother Aldric",
        text: "The seal answers to the Church, and tonight the Church is us — but not before I have put my name to a second writ. Rest. Pray at the candle. When the paper clears, we go beneath this town together, and I expect to dislike what we find.",
        options: [{ text: "Beneath it is, old friend." }],
      },
      {
        id: "node_rite_text",
        speaker: "Brother Aldric",
        text: "Real, yes. I keep wanting it to be a forgery, and that is how I know it is not. A forgery would have been kinder about what it proves.",
        options: [{ text: "You think it proves organization.", next_node_id: "node_rite_text2" }],
      },
      {
        id: "node_rite_text2",
        speaker: "Brother Aldric",
        text: "I think it proves that a prayer survived under every lawful room in this town. That is not a single girl's mistake. That is a second town, kneeling below the first.",
        options: [{ text: "Keep moving." }],
      },
      {
        id: "node_after_office",
        speaker: "Brother Aldric",
        text: "Quiet is cheaper than saying the wrong thing. I read Mara's hand. I read Nessa's absence from it. I still know what I saw at the Witness, and I am beginning to hate the word know.",
        options: [{ text: "We keep the case open.", next_node_id: "node_after_office2" }],
      },
      {
        id: "node_after_office2",
        speaker: "Brother Aldric",
        text: "Yes. We keep it open. But if the town below us was telling the truth, then every answer from here on will cost more than paper.",
        options: [{ text: "Then we spend carefully." }],
      },
      {
        id: "node_vampire_cleared",
        speaker: "Brother Aldric",
        text: "You cleared him properly. That matters. Not because Lazare is gentle - he is not - but because the town must learn that a filed hunger is not responsible for every unfiled terror. The cave truth is admissible. Now the harder case opens.",
        options: [{ text: "Nessa.", next_node_id: "node_vampire_cleared2" }],
      },
      {
        id: "node_vampire_cleared2",
        speaker: "Brother Aldric",
        text: "Nessa. My student, my failure, and perhaps not the shape of guilt I thought I saw. The Hall of Custody will admit us now. Do not confuse pity with witness. But do not let procedure make your eyes smaller.",
        options: [{ text: "Take me to the bars." }],
      },
      {
        id: "node_town",
        speaker: "Brother Aldric",
        text: "Notice where they built thresholds. Fences, bars, terraces, cordons. Alderamontico survives by deciding what may be approached and what must only be witnessed. This town is honest about it, at least — it raised its cathedral on the hill and roped its wound off in the square below, and still cannot say which of the two the people are forbidden.",
        options: [{ text: "That includes Nessa.", next_node_id: "node_town2" }],
      },
      {
        id: "node_town2",
        speaker: "Brother Aldric",
        text: "Yes. Especially Nessa.",
        options: [{ text: "Walk on." }],
      },
      {
        id: "node_nessa",
        speaker: "Brother Aldric",
        text: "She wanted the Grid to answer her. Not power — an answer. The Church teaches that the dark lights are a gift not to be questioned, and Nessa never once managed to stop questioning. I corrected her gently for nine years. I am no longer certain gently was a kindness.",
        options: [{ text: "You think she did it." , next_node_id: "node_nessa2"}],
      },
      {
        id: "node_nessa2",
        speaker: "Brother Aldric",
        text: "I think the Witness bled, and three children are Glass, and she was standing there with a forbidden rite in her hands. What I believe is not evidence, Intercessor. That is why you are here.",
        options: [{ text: "Then I'll find evidence." }],
      },
      {
        id: "node_mystic",
        speaker: "Brother Aldric",
        text: "Because when you listen, you tilt your head the way she did. The Church licenses your discipline, Mystic, and I will defend it to any clerk alive — but I have already lost one student to the sound underneath things. Forgive an old man his flinch.",
        options: [{ text: "I'll be careful, Aldric." }],
      },
    ],
  },

  // ——— Nessa through the bars ———
  {
    id: "dia_nessa_bars",
    display_name: "Nessa Through the Bars",
    nodes: withSceneArt([
      {
        id: "node_1",
        speaker: "Scene",
        text: "The cell block is colder than the office, the way stone gets when nobody warms it on purpose. Nessa watches you come the whole length of the corridor. She does not stand at the bars and she does not hide from them.",
        options: [
          {
            text: "The warden does not open the inner line yet.",
            condition: { not: { switch: "vampire_cleared" } },
            next_node_id: "node_too_early",
          },
          {
            text: "Approach the bars.",
            condition: { all: [{ switch: "vampire_cleared" }, { not: { switch: "met_nessa" } }] },
            next_node_id: "node_first",
          },
          {
            text: "Hold up the carried stone.",
            condition: {
              all: [
                { has_item: "itm_carried_stone" },
                { switch: "vampire_cleared" },
                { not: { switch: "nessa_saw_stone" } },
              ],
            },
            next_node_id: "node_stone",
          },
          {
            text: "Speak with her.",
            condition: { all: [{ switch: "met_nessa" }, { switch: "vampire_cleared" }, { not: { switch: "act1_complete" } }] },
            next_node_id: "node_hub",
          },
          {
            text: "Speak with her.",
            condition: { all: [{ switch: "met_nessa" }, { switch: "act1_complete" }] },
            next_node_id: "node_after_dungeon",
          },
        ],
      },
      {
        id: "node_too_early",
        speaker: "Warden Sefa",
        text: "Not yet. The cave case is still open and the Hall of Custody is not a curiosity cabinet. Bring Aldric an admissible finding, then we will see which doors his name can open.",
        options: [{ text: "Step back from the bars." }],
      },
      {
        id: "node_first",
        speaker: "Acolyte Nessa",
        text: "So. They cleared the vampire and came to the witch. That must feel like progress.",
        options: [{ text: "I came to ask what happened.", next_node_id: "node_first2" }],
      },
      {
        id: "node_first2",
        speaker: "Brother Aldric",
        text: "Nessa.",
        options: [{ text: "Let her speak, Aldric.", next_node_id: "node_first3" }],
      },
      {
        id: "node_first3",
        speaker: "Acolyte Nessa",
        text: "No. Let the new Intercessor hear the word. It is the only part of the case everyone agrees on.\n\nDarro's cave named Mara, did it not? Then the cave remembered more than the Church.\n\nMara was my friend. Not my follower. Not my victim. Not a prop for your mercy.",
        options: [
          {
            text: "Why does Mara matter so much?",
            next_node_id: "node_first4",
          },
        ],
      },
      {
        id: "node_first4",
        speaker: "Acolyte Nessa",
        text: "Because the statue did not open alone. Darro heard the hinge, or part of it.\n\nMara learned old prayers under this town before she ever learned mine. Ask Maro about the Counted Cup cellar.\n\nTell Aldric I am tired of being the simplest answer in the room. He will understand that as pride.",
        options: [
          {
            text: "(Quietly) I'll look beneath the town.",
            set_switch: "met_nessa",
            trigger_quest: "quest_investigate",
            trigger_quest_state: "her_words",
            trigger_cutscene: "cut_act1_end",
          },
        ],
      },
      {
        id: "node_stone",
        speaker: "Acolyte Nessa",
        text: "Her eyes drop to your hand before you finish raising it. — That is catalogued as evidence of witch-work. It is a stone from the river path. Mara skipped its twin across the water the summer we were twelve. If you are carrying it, you have been reading what they took, not what they say.",
        options: [
          {
            text: "I want what happened. Not what fits.",
            set_switch: "nessa_saw_stone",
            next_node_id: "node_stone2",
          },
        ],
      },
      {
        id: "node_stone2",
        speaker: "Acolyte Nessa",
        text: "Then we may yet be friends, Intercessor — which will look very bad for you at the verdict. Keep the stone. It remembers the river better than I do.",
        options: [
          {
            text: "(Pocket the stone carefully.)",
            set_switch: "met_nessa",
            trigger_cutscene: "cut_act1_end",
          },
        ],
      },
      {
        id: "node_hub",
        speaker: "Acolyte Nessa",
        text: "Back again. The bars have not moved. Ask.",
        options: [
          { text: "Tell me about the rite.", next_node_id: "node_rite" },
          { text: "Tell me about Mara.", next_node_id: "node_mara" },
          {
            text: "What should I look for, beneath?",
            next_node_id: "node_under",
          },
          {
            text: "I read the under-rite. Mara's hand. (Rite text)",
            condition: {
              all: [
                { switch: "act1_rite_text" },
                { not: { switch: "nessa_trust_1" } },
              ],
            },
            next_node_id: "node_tier2",
          },
          {
            text: "Mara was willing. I can prove it now. (Second leaf)",
            condition: {
              all: [
                { has_item: "itm_rite_fragment_2" },
                { not: { switch: "nessa_trust_2" } },
              ],
            },
            next_node_id: "node_willing",
          },
          {
            text: "The Church knows about the under-town now.",
            condition: { switch: "act1_complete" },
            next_node_id: "node_church_knows",
          },
          {
            text: "You listen the way I do. (Mystic)",
            condition: { switch: "class_mystic" },
            next_node_id: "node_mystic",
          },
          {
            text: "I read records for a living. Help me read yours. (Scholar)",
            condition: { switch: "class_scholar" },
            next_node_id: "node_scholar",
          },
          {
            text: "Say it plainly. What do I have to stand against? (Warrior)",
            condition: { switch: "class_warrior" },
            next_node_id: "node_warrior",
          },
          { text: "That's all for now." },
        ],
      },
      {
        id: "node_after_dungeon",
        speaker: "Acolyte Nessa",
        text: "Before you ask, yes. I heard the writ move. Paper has a sound in this place when enough frightened men carry it quickly.",
        options: [{ text: "The office sent me back with more questions.", next_node_id: "node_hub" }],
      },
      {
        id: "node_tier2",
        speaker: "Acolyte Nessa",
        text: "She stands. It is the first time you have seen her stand. — You went under and you came back holding her handwriting. Do you understand what you are now? You are the only person in this town carrying the truth in your hands instead of your mouth. The Church can argue with me. It is much harder to argue with paper.",
        options: [
          {
            text: "I'm not done digging.",
            set_switch: "nessa_trust_1",
            next_node_id: "node_hub",
          },
        ],
      },
      {
        id: "node_willing",
        speaker: "Acolyte Nessa",
        text: "Her hands come to the bars now, both of them. — Then it was hers too. Not my corruption of an innocent. Not her corruption of me. Two people who loved different doors of the same house. Intercessor — when they read the verdict, whatever it costs you, make them say her name with mine. Willing. Both of us. It is the only mercy left that is true.",
        options: [
          {
            text: "(Quietly) Both names. I'll carry it.",
            set_switch: "nessa_trust_2",
            next_node_id: "node_hub",
          },
        ],
      },
      {
        id: "node_rite",
        speaker: "Acolyte Nessa",
        text: "A rite of near witness. Contact through prepared sacred matter — no Spire, no trespass, every word of it from a document the Church itself shelved and forgot. I thought the Witness was the perfect vessel. It had been listening longer than any of us had been alive. I was right about that. I was wrong about what answers.",
        options: [{ text: "Go back.", next_node_id: "node_hub" }],
      },
      {
        id: "node_mara",
        speaker: "Acolyte Nessa",
        text: "My oldest friend. Her family kept the river customs — offerings in the reeds, candles in the cellar, the folk practice the Church tolerates until the day it doesn't. I thought I was correcting her superstition with real knowledge. She thought I was giving her rites power. Neither of us understood we were both right.",
        options: [{ text: "Go back.", next_node_id: "node_hub" }],
      },
      {
        id: "node_under",
        speaker: "Acolyte Nessa",
        text: "Soil marks. Candle stubs in rows of seven. Names scratched low on the stone where kneeling people could reach. The town will tell you the cellars are for grain. Ask the grain why it needs shrines.",
        options: [{ text: "Go back.", next_node_id: "node_hub" }],
      },
      {
        id: "node_church_knows",
        speaker: "Acolyte Nessa",
        text: "Then the under-town is finished being a secret and has begun being evidence. The Church is kindest to secrets. Evidence has to be filed, answered, and made harmless.",
        options: [{ text: "Go back.", next_node_id: "node_hub" }],
      },
      {
        id: "node_mystic",
        speaker: "Acolyte Nessa",
        text: "Then you already know the worst part. It is not silent down there. It has never been silent. The Church calls that blasphemy; I call it the reason I could not stop. Be more careful than I was — you have someone walking beside you who cannot afford to lose two of us.",
        options: [{ text: "Go back.", next_node_id: "node_hub" }],
      },
      {
        id: "node_scholar",
        speaker: "Acolyte Nessa",
        text: "Then read absence first. The filed case needs me to be alone with a forbidden text. Mara's basement rites are missing from that file, and so is the hour the Witness began to bleed before I stood at it. Empty margins are also handwriting.",
        options: [{ text: "Go back.", next_node_id: "node_hub" }],
      },
      {
        id: "node_warrior",
        speaker: "Acolyte Nessa",
        text: "Stand against the first clean word they hand you. Witch. Monster. Miracle. Any word that lets everyone stop looking is a blade pointed at the wrong throat.",
        options: [{ text: "Go back.", next_node_id: "node_hub" }],
      },
    ], CUTSCENE_ART_NESSA_BARS, "Brother Aldric and the Intercessor question Nessa through the Hall of Custody bars."),
  },
  {
    id: "dia_nessa_party",
    display_name: "Nessa Walking",
    nodes: [
      {
        id: "node_1",
        speaker: "Acolyte Nessa",
        text: "When I walked beyond the Church's map, I expected punishment. I did not expect the world to become more honest.",
        options: [{ text: "Stay close." }],
      },
    ],
  },

  // ——— The Hall of Custody ———
  {
    id: "dia_gaol_entry_scene",
    display_name: "The Warden's Threshold",
    nodes: [
      {
        id: "node_1",
        speaker: "Warden Sefa",
        text: "Hold. — Ah. The new Intercessor, and Brother Aldric behind like a guilty conscience. She is fed, she is warm, and she has not been questioned without paper, whatever the market says. You will find my hall correct.",
        options: [{ text: "I'm here under the writ.", next_node_id: "node_2" }],
      },
      {
        id: "node_2",
        speaker: "Warden Sefa",
        text: "Then the bars are yours. Her effects are in the chest by the wall — catalogued, every sad little thing. Read the ledger if you want my honest accounting. And Intercessor: she screams in her sleep, and it is not the scream of a guilty woman. It is the scream of someone still watching it happen.",
        options: [{ text: "Noted, Warden." }],
      },
    ],
  },
  {
    id: "dia_gaoler",
    display_name: "Warden Sefa",
    nodes: [
      {
        id: "node_1",
        speaker: "Warden Sefa",
        text: "Still here, Intercessor. Twenty-two years a warden and this is the first prisoner the town is frightened *for* rather than *of*. What do you need?",
        options: [
          {
            text: "Why keep me from Nessa?",
            condition: { not: { switch: "vampire_cleared" } },
            next_node_id: "node_before_clear",
          },
          { text: "How is she treated?", next_node_id: "node_care" },
          { text: "Show me the ledger.", next_node_id: "node_ledger" },
          {
            text: "Lazare is cleared.",
            condition: { switch: "vampire_cleared" },
            next_node_id: "node_post_clear",
          },
          {
            text: "Aldric says the Nessa case is open again.",
            condition: { switch: "nessa_thread_started" },
            next_node_id: "node_nessa_open",
          },
          {
            text: "Night shifts must be long here.",
            condition: { time_of_day: ["night", "dusk"] },
            next_node_id: "node_night",
          },
          { text: "Nothing now." },
        ],
      },
      {
        id: "node_before_clear",
        speaker: "Warden Sefa",
        text: "Finish the cave finding first: testimonies, Lazare, forest road, cave logs, then Aldric's verdict.\n\nA cell is not a market stall, even when the town wants a spectacle.\n\nThe custody ledger keeps hours, meals, screams, and omissions in the same ink.",
        options: [{ text: "Go back.", next_node_id: "node_1" }],
      },
      {
        id: "node_care",
        speaker: "Warden Sefa",
        text: "Correctly. Two meals, a lamp until the wick dies, and no visitors without paper — which has kept out everyone except you, the brother, and one priest who wanted to pray *at* her. I made him do it from the doorway.",
        options: [{ text: "Go back.", next_node_id: "node_1" }],
      },
      {
        id: "node_ledger",
        speaker: "Warden Sefa",
        text: "Take it. Item by item, hour by hour. You will notice the cordon guard logged the statue bleeding a full bell *before* the rite was supposed to have begun. Nobody asked me about that. You are asking now, which is why you get the ledger.",
        options: [
          {
            text: "Read it.",
            trigger_cutscene: "cut_read_ledger",
          },
        ],
      },
      {
        id: "node_night",
        speaker: "Warden Sefa",
        text: "Long, and lately loud. The river says things against the pilings at the witching hour, and I have stopped telling myself it is water. Keep that between us and the bars.",
        options: [{ text: "Go back.", next_node_id: "node_1" }],
      },
      {
        id: "node_post_clear",
        speaker: "Warden Sefa",
        text: "Now Aldric can move the file from Lazare to the girl behind my bars.\n\nA named monster is a convenient door to close; you made them leave it open.\n\nCorrect-good is not cheerful-good, but it keeps a gaol from becoming a pantry for fear.",
        options: [{ text: "Go back.", next_node_id: "node_1" }],
      },
      {
        id: "node_nessa_open",
        speaker: "Warden Sefa",
        text: "Speak to Nessa through the bars and keep the questions small enough to answer.\n\nShe eats when spoken to gently; do not tell the Clerk I noticed.\n\nAt night the iron sweats warm, which is not a property listed in the custody manual.",
        options: [{ text: "Go back.", next_node_id: "node_1" }],
      },
    ],
  },

  // ——— Guards ———
  {
    id: "dia_guard_cordon",
    display_name: "Cordon Guard Bren",
    nodes: [
      {
        id: "node_1",
        speaker: "Cordon Guard Bren",
        text: "Stand off the line, please. — Apologies, Intercessor, you of all people may stand where you like, only... not past the fence. Standing orders. Nobody past the fence, not clergy, not custody, not me.",
        options: [
          { text: "You watch it all day. What do you see?", next_node_id: "node_sees" },
          { text: "Show me the standing orders.", next_node_id: "node_orders" },
          {
            text: "Lazare was not the cave killer.",
            condition: { switch: "vampire_cleared" },
            next_node_id: "node_post_clear",
          },
          {
            text: "What changes now that Nessa is the question?",
            condition: { switch: "nessa_thread_started" },
            next_node_id: "node_nessa",
          },
          {
            text: "It's the witching hour. You're shaking.",
            condition: { time_of_day: ["witching_hour"] },
            next_node_id: "node_witching",
          },
          { text: "Carry on, guard." },
        ],
      },
      {
        id: "node_sees",
        speaker: "Cordon Guard Bren",
        text: "Check the stains in the morning if you need a pattern; the flow changes when nobody is watching.\n\nI have learned not to stare at her face for long, which is not courage but good employment.\n\nThe blood keeps a schedule better than half the parish bells.",
        options: [{ text: "Go back.", next_node_id: "node_1" }],
      },
      {
        id: "node_orders",
        speaker: "Cordon Guard Bren",
        text: "Posted and sealed. Read them if you want — they are mostly the word 'not' arranged in different orders.",
        options: [{ text: "Read them.", trigger_cutscene: "cut_read_orders" }],
      },
      {
        id: "node_witching",
        speaker: "Cordon Guard Bren",
        text: "I am not ashamed of it. At this hour the lamps go small, and the Witness stands a little less like a statue. If the Church wants a man who does not shake at that, they will have to cast one.",
        options: [{ text: "Go back.", next_node_id: "node_1" }],
      },
      {
        id: "node_post_clear",
        speaker: "Cordon Guard Bren",
        text: "The statue has been quieter since your cave business. I do not like quieter. Quiet is what people call a thing once they have stopped listening to it.",
        options: [{ text: "Go back.", next_node_id: "node_1" }],
      },
      {
        id: "node_nessa",
        speaker: "Cordon Guard Bren",
        text: "Ask Orin what coherent Glass means before you decide what Nessa could control.\n\nIf she did it on purpose, she is more than a witch; if she did not, I have guarded a question with a spear.\n\nSame shapes every dawn, same lean toward the rope, same cold at my teeth.",
        options: [{ text: "Go back.", next_node_id: "node_1" }],
      },
    ],
  },
  {
    id: "dia_guard_gate",
    display_name: "Gate Guard Holt",
    nodes: [
      {
        id: "node_1",
        speaker: "Gate Guard Holt",
        text: "State your road, name, and reason. In that order if you want me calm. If you are here about Darro Keel, I have the slate. People hate the slate until it clears them.",
        options: [
          { text: "What is the Mouthstone, really?", next_node_id: "node_stone" },
          { text: "Who left and didn't come back?", next_node_id: "node_missing" },
          {
            text: "Did Lazare ever cross your slate?",
            condition: { switch: "act1_assigned" },
            next_node_id: "node_lazare",
          },
          {
            text: "Did Orin pass through?",
            condition: { switch: "act1_assigned" },
            next_node_id: "node_orin",
          },
          {
            text: "Did Darro pass through?",
            condition: { switch: "act1_assigned" },
            next_node_id: "node_darro",
          },
          {
            text: "Record Holt's testimony.",
            condition: { switch: "act1_assigned" },
            trigger_cutscene: "cut_record_holt",
          },
          {
            text: "The count was right. Lazare stayed in.",
            condition: { switch: "vampire_cleared" },
            next_node_id: "node_post_clear",
          },
          {
            text: "Will the Mouthstone be used for Nessa?",
            condition: { switch: "nessa_thread_started" },
            next_node_id: "node_nessa",
          },
          { text: "Keep counting, Holt." },
        ],
      },
      {
        id: "node_stone",
        speaker: "Gate Guard Holt",
        text: "The door we never built and cannot close. Exiles are walked out past it and the pagan lands take them. My grandmother said it was a mouth before it was a gate, and I notice nobody ever corrected her — they only stopped letting her say it near the priest.",
        options: [{ text: "Go back.", next_node_id: "node_1" }],
      },
      {
        id: "node_missing",
        speaker: "Gate Guard Holt",
        text: "A trapper in spring. And the Vey girl's father, the week after the rite went wrong — walked out at dawn with river mud already on his boots, and the count has been wrong ever since. Nobody sent for him. Make of that your business; it is past mine.",
        options: [{ text: "Go back.", next_node_id: "node_1" }],
      },
      {
        id: "node_lazare",
        speaker: "Gate Guard Holt",
        text: "No mark. No gate. No night tally.\n\nLazare has not crossed my line in nine years; unless he flies, sinks, or walks through walls, he did not take the road.\n\nThe slate hangs by the north post, and every counted mark is a little act of mercy or exile.",
        options: [{ text: "Go back.", next_node_id: "node_1" }],
      },
      {
        id: "node_orin",
        speaker: "Gate Guard Holt",
        text: "Orin Vale crossed before dusk. Said Glassworks inventory.\n\nHe came back after dark with less in his satchel and more in his mouth.\n\nBy morning he was saying Lazare loudly enough to make a tally jealous.",
        options: [{ text: "Go back.", next_node_id: "node_1" }],
      },
      {
        id: "node_darro",
        speaker: "Gate Guard Holt",
        text: "Darro Keel crossed two nights before the body. Alone. No pack listed.\n\nI remember because he thanked the gate, and people only thank a gate when they are afraid of what opens after it.\n\nA tally is not truth, but it is harder to flatter than a witness.",
        options: [{ text: "Go back.", next_node_id: "node_1" }],
      },
      {
        id: "node_post_clear",
        speaker: "Gate Guard Holt",
        text: "I am relieved, which is not the same as pleased. A wrong count can be corrected. A correct count that everyone ignored makes me wonder what else is written plainly and still unseen.",
        options: [{ text: "Go back.", next_node_id: "node_1" }],
      },
      {
        id: "node_nessa",
        speaker: "Gate Guard Holt",
        text: "Exile is Act Two paperwork, they say. I count the road anyway. Some gates are locked to keep people out. Some are locked so the town can sleep while it decides who belongs outside.",
        options: [{ text: "Go back.", next_node_id: "node_1" }],
      },
    ],
  },

  // ——— Clergy and townsfolk ———
  {
    id: "dia_priest",
    display_name: "Father Imre",
    nodes: [
      {
        id: "node_1",
        speaker: "Father Imre",
        text: "The grid is a gift, Intercessor. It is not to be questioned; it is to be appreciated. I say it at every service, and every week the pews hold fewer people and more candles. Make what report of that you must.",
        options: [
          { text: "Do you believe Nessa is a witch?", next_node_id: "node_nessa" },
          { text: "Why do you pray below the cordon?", next_node_id: "node_cordon" },
          {
            text: "Lazare has been cleared.",
            condition: { switch: "vampire_cleared" },
            next_node_id: "node_post_clear",
          },
          {
            text: "The Nessa case is opening now.",
            condition: { switch: "nessa_thread_started" },
            next_node_id: "node_nessa_open",
          },
          {
            text: "You listen for it too. (Mystic)",
            condition: { switch: "class_mystic" },
            next_node_id: "node_mystic",
          },
          { text: "Peace keep you, Father." },
        ],
      },
      {
        id: "node_nessa",
        speaker: "Father Imre",
        text: "Read the records and speak to the girl before you let doctrine supply the missing cause.\n\nA cause with a name is a mercy to everyone except the name.\n\nYou will notice I did not answer plainly; that is the most honest I am permitted to be.",
        options: [{ text: "Go back.", next_node_id: "node_1" }],
      },
      {
        id: "node_cordon",
        speaker: "Father Imre",
        text: "Because my license ends at the fence, the same as yours. The Witness was my church's heart for forty years, and now I pray at its feet from behind a balustrade like a man visiting a relative in custody. You have seen the gaol. Tell me the resemblance is accidental.",
        options: [{ text: "Go back.", next_node_id: "node_1" }],
      },
      {
        id: "node_mystic",
        speaker: "Father Imre",
        text: "Lower your voice. — Yes. Under the doctrine, under the gift, under the appreciating: a sound like counting. I have heard it twice in forty years and both times the Witness bled within the season. You are licensed to listen, Mystic. I am only licensed to appreciate.",
        options: [{ text: "Go back.", next_node_id: "node_1" }],
      },
      {
        id: "node_post_clear",
        speaker: "Father Imre",
        text: "Take the cleared finding back to Aldric and let the record do its cold work.\n\nLazare's name was a shelter for fear; you removed it, and fear will look for a better roof.\n\nThe nave candles burned low this morning, as if the wax had been listening.",
        options: [{ text: "Go back.", next_node_id: "node_1" }],
      },
      {
        id: "node_nessa_open",
        speaker: "Father Imre",
        text: "Pray for Nessa, then question her; the order matters less than the restraint.\n\nDo not mistake my prayer for declaring her innocent.\n\nI have watched certainty bury the living, and the marble remembers shovel-sounds too well.",
        options: [{ text: "Go back.", next_node_id: "node_1" }],
      },
    ],
  },
  {
    id: "dia_innkeep",
    display_name: "Maro of the Counted Cup",
    nodes: [
      {
        id: "node_1",
        speaker: "Maro",
        text: "Welcome to the Counted Cup — best pour on the square, which is easy, being the only one. Sit anywhere that isn't the hearth stone. You're the Intercessor. Everyone has been in twice today to not-talk about you.",
        options: [
          { text: "What does the town not-say about Nessa?", next_node_id: "node_gossip" },
          {
            text: "What did the town say about Lazare?",
            condition: { switch: "act1_assigned" },
            next_node_id: "node_lazare",
          },
          {
            text: "What's behind the seal on your cellar?",
            condition: { switch: "met_nessa" },
            next_node_id: "node_cellar",
          },
          {
            text: "Lazare's name is cleared.",
            condition: { switch: "vampire_cleared" },
            next_node_id: "node_post_clear",
          },
          {
            text: "The case has turned toward Nessa.",
            condition: { switch: "nessa_thread_started" },
            next_node_id: "node_nessa",
          },
          {
            text: "Who drinks in the back room?",
            next_node_id: "node_back",
          },
          { text: "Just passing through." },
        ],
      },
      {
        id: "node_gossip",
        speaker: "Maro",
        text: "That she was always at the statue. That she read too much. That the Vey girl's people kept the old candles, and everyone's people kept the old candles, and would you like another drink. The town isn't angry at her, Intercessor. It is terrified that she is what they all are, only braver.",
        options: [{ text: "Go back.", next_node_id: "node_1" }],
      },
      {
        id: "node_cellar",
        speaker: "Maro",
        text: "Grain. — Don't look at me like that, it is grain, on top of whatever it was before my grandmother's time. The seal is church-stamped and older than my license, and I have never once broken it, and at the witching hour the grain hums. I sleep above a hymn, Intercessor. Take it up with the paper-men.",
        options: [{ text: "I intend to.", next_node_id: "node_1" }],
      },
      {
        id: "node_back",
        speaker: "Maro",
        text: "River trade. A man they call the Riverman keeps the corner table by day and the bridge by night, and I do not ask which direction his cargo prays. The Cup counts cups. That is the whole of my theology.",
        options: [{ text: "Go back.", next_node_id: "node_1" }],
      },
      {
        id: "node_lazare",
        speaker: "Maro",
        text: "Ask Holt's tally and Lazare's threshold before you call absence a footprint.\n\nThe town talks about him like he left a cloak over every chair because a vampire is easier than a neighbor.\n\nThe Cup counts cups, debts, and lies told loudly enough to become civic furniture.",
        options: [{ text: "Go back.", next_node_id: "node_1" }],
      },
      {
        id: "node_post_clear",
        speaker: "Maro",
        text: "Good for the record, bad for business. People drink softer when they know whom to hate. Now they buy two cups and stare into the second like it owes them a name.",
        options: [{ text: "Go back.", next_node_id: "node_1" }],
      },
      {
        id: "node_nessa",
        speaker: "Maro",
        text: "When Aldric points you to Nessa, check what old routes run below the Cup.\n\nEveryone wants old truth until it asks rent from their own cellar.\n\nThe Church sealed half these floors after using the other half to keep warm.",
        options: [{ text: "Go back.", next_node_id: "node_1" }],
      },
    ],
  },
  {
    id: "dia_elder",
    display_name: "Sela, the Widow's Cousin",
    nodes: [
      {
        id: "node_1",
        speaker: "Sela",
        text: "You walk like paper, Intercessor — all straight lines. Stand a while among the stones with me; the dead here remember being spoken to, whatever the priest says now.",
        options: [
          { text: "Tell me about the river customs.", next_node_id: "node_river" },
          { text: "You're the widow's cousin?", next_node_id: "node_widow" },
          {
            text: "Lazare did not kill the cave victim.",
            condition: { switch: "vampire_cleared" },
            next_node_id: "node_post_clear",
          },
          {
            text: "What should I know before seeing Nessa?",
            condition: { switch: "nessa_thread_started" },
            next_node_id: "node_nessa",
          },
          { text: "Another time, Sela." },
        ],
      },
      {
        id: "node_river",
        speaker: "Sela",
        text: "Offerings in the reeds at the turn of season. A votive under the new bridge piling, so the old drowned have a light. The Church calls it tolerated practice, which is their way of saying: real enough to forbid, useful enough to keep. Every family here has river mud somewhere on its knees.",
        options: [{ text: "Go back.", next_node_id: "node_1" }],
      },
      {
        id: "node_widow",
        speaker: "Sela",
        text: "Cousin to her, yes — the fracture-touched one who keeps the flooded house downriver. She handled Glass before the Church wrote rules for it, and buried a husband the water gave back wrong. If your inquiry ever walks the river road, walk it gently and bring her something warm. She will know things about witness-work that no scriptorium does.",
        options: [{ text: "I'll remember that.", next_node_id: "node_1" }],
      },
      {
        id: "node_post_clear",
        speaker: "Sela",
        text: "You did right. The town will forgive you slowly for making it wrong. Grief has a sound when it belongs to you. The cordon grief hums wrong, and now people are hearing that again.",
        options: [{ text: "Go back.", next_node_id: "node_1" }],
      },
      {
        id: "node_nessa",
        speaker: "Sela",
        text: "Do not touch Glass when you are lonely. It answers too easily. That girl was lonely with questions, which is a dangerous kind. My cousin says the river keeps names longer than the Church keeps mercy.",
        options: [{ text: "Go back.", next_node_id: "node_1" }],
      },
    ],
  },
  {
    id: "dia_mason",
    display_name: "Petra the Stonecutter",
    nodes: [
      {
        id: "node_1",
        speaker: "Petra",
        text: "Mind the dust. Cordon posts, third set this year — the Church pays well for fences lately, which is the kind of prosperity that keeps a mason up at night.",
        options: [
          { text: "You've worked the temple stone?", next_node_id: "node_temple" },
          { text: "What keeps you up at night?", next_node_id: "node_warm" },
          {
            text: "The cave wall damage was not a bite.",
            condition: { any: [{ switch: "found_log_1" }, { switch: "found_log_2" }, { switch: "found_log_3" }, { switch: "found_log_4" }] },
            next_node_id: "node_cave",
          },
          {
            text: "Lazare has been cleared.",
            condition: { switch: "vampire_cleared" },
            next_node_id: "node_post_clear",
          },
          {
            text: "What about the Witness stone?",
            condition: { switch: "nessa_thread_started" },
            next_node_id: "node_nessa",
          },
          { text: "Work well, Petra." },
        ],
      },
      {
        id: "node_temple",
        speaker: "Petra",
        text: "My line dressed every block up at the chapter house, back to the founding. Witness-grade marble, quarried under petition, set with the grain facing heaven. You do not forget the feel of stone like that. Which is how I know what I felt in the new cordon posts is not the marble.",
        options: [{ text: "What did you feel?", next_node_id: "node_warm" }],
      },
      {
        id: "node_warm",
        speaker: "Petra",
        text: "Warmth. Stone takes the day's heat and gives it back by dusk, every mason knows the schedule of it — and the cordon posts give it back at the witching hour instead, all together, like breath. I reported it. The clerk wrote 'thermal irregularity' and underlined it, and that underline is the whole of the Church's curiosity these days.",
        options: [{ text: "Go back.", next_node_id: "node_1" }],
      },
      {
        id: "node_cave",
        speaker: "Petra",
        text: "Your vampire did not do that cave wall. Hunger leaves mess. Pressure leaves pattern. If the stone pinched inward like you say, something was trying to make a room smaller around a mind.",
        options: [{ text: "Go back.", next_node_id: "node_1" }],
      },
      {
        id: "node_post_clear",
        speaker: "Petra",
        text: "Good. Stone tells you what touched it. Priests tell you what to call the touch. This time the stone won.",
        options: [{ text: "Go back.", next_node_id: "node_1" }],
      },
      {
        id: "node_nessa",
        speaker: "Petra",
        text: "That statue did not crack like old stone. It tightened. Prepared stone does that when force finds an old line already cut. Whoever asks about Nessa should ask who cut the first line.",
        options: [{ text: "Go back.", next_node_id: "node_1" }],
      },
    ],
  },
  {
    id: "dia_mother",
    display_name: "Liss",
    nodes: [
      {
        id: "node_1",
        speaker: "Liss",
        text: "She keeps her eyes on the funeral shrine while she speaks to you. — My boy touched a shard the spring before last. Only his hand went over, just the hand, and the Church calls him blessed-in-part and I call him eight years old and frightened of his own fingers.",
        options: [
          {
            text: "(Offer a votive for the shrine.)",
            condition: { has_item: "itm_votive" },
            trigger_cutscene: "cut_give_votive",
          },
          { text: "What do the votives mean?", next_node_id: "node_votive" },
          { text: "Does he speak of the hand?", next_node_id: "node_boy" },
          {
            text: "Lazare was not the answer.",
            condition: { switch: "vampire_cleared" },
            next_node_id: "node_post_clear",
          },
          {
            text: "What do you think of Nessa?",
            condition: { switch: "nessa_thread_started" },
            next_node_id: "node_nessa",
          },
          { text: "(Leave her to the shrine.)" },
        ],
      },
      {
        id: "node_votive",
        speaker: "Liss",
        text: "One candle for each of the counted — the taken, the hollowed, the partly-glass. We are not allowed to call it mourning, because doctrine says they ascended. So we call it housekeeping, and the Church lets the shrine stand, and everybody continues to be very careful with their words.",
        options: [{ text: "Go back.", next_node_id: "node_1" }],
      },
      {
        id: "node_boy",
        speaker: "Liss",
        text: "He says the hand is warm when the rest of him is cold. He says — quieter now — that sometimes it wants to point at the temple, and he sits on it until it stops. The priest told me to be grateful. The warden told me to keep him away from the cordon. Only the warden looked me in the eye.",
        options: [{ text: "Go back.", next_node_id: "node_1" }],
      },
      {
        id: "node_thanks",
        speaker: "Liss",
        text: "She sets your votive in the row of seven and is quiet a long moment. — The Church counts what it takes. Someone should count what is given. Thank you, Intercessor. The town will hear of it, in the way the town hears everything.",
        options: [{ text: "(Say nothing. It's enough.)" }],
      },
      {
        id: "node_post_clear",
        speaker: "Liss",
        text: "They said Lazare because saying one name lets you put the children to bed. Now I do not know what to tell my boy when his hand points at the temple in his sleep.",
        options: [{ text: "Go back.", next_node_id: "node_1" }],
      },
      {
        id: "node_nessa",
        speaker: "Liss",
        text: "They say Nessa did it. I want that to be true. One person is easier to fear than the sky. Please do not tell me Glass remembers children; I have to sleep somewhere.",
        options: [{ text: "Go back.", next_node_id: "node_1" }],
      },
    ],
  },
  {
    id: "dia_pilgrim",
    display_name: "Cosmas the Pilgrim",
    nodes: [
      {
        id: "node_1",
        speaker: "Cosmas",
        text: "Three towns I have walked since the feast of laying-down, and every one keeps its Witness behind a fence now. Yours is the only one that bleeds. I mean that as praise, though I no longer remember why.",
        options: [
          { text: "Why pilgrimage at all, now?", next_node_id: "node_why" },
          {
            text: "You have seen other towns blame the wrong thing?",
            condition: { switch: "vampire_cleared" },
            next_node_id: "node_post_clear",
          },
          {
            text: "What does a case become when it outgrows a town?",
            condition: { switch: "nessa_thread_started" },
            next_node_id: "node_nessa",
          },
          {
            text: "It's late to be on the stairs.",
            condition: { time_of_day: ["night", "witching_hour"] },
            next_node_id: "node_late",
          },
          { text: "Walk well, pilgrim." },
        ],
      },
      {
        id: "node_why",
        speaker: "Cosmas",
        text: "Because the black stars do not move, friend, and a thing that does not move can be walked toward. That is the whole of pilgrimage. The priests dress it better but it is only this: when heaven hangs still, the feet make the prayer.",
        options: [{ text: "Go back.", next_node_id: "node_1" }],
      },
      {
        id: "node_late",
        speaker: "Cosmas",
        text: "The stairs are honest at night. By day this town performs itself. After dark you can hear what it is: water, counting, and a statue everyone dreams about and no one mentions at breakfast. I sleep at the gate where the count is kept. It seems the safest arithmetic.",
        options: [{ text: "Go back.", next_node_id: "node_1" }],
      },
      {
        id: "node_post_clear",
        speaker: "Cosmas",
        text: "Every town thinks its wound is private. Yours named a vampire, which was at least traditional. The road has taught me tradition is often fear with better posture.",
        options: [{ text: "Go back.", next_node_id: "node_1" }],
      },
      {
        id: "node_nessa",
        speaker: "Cosmas",
        text: "Your case has started using names. Be careful. Cases do that before they become sins. Walk long enough under the dark lights and every road becomes a procession.",
        options: [{ text: "Go back.", next_node_id: "node_1" }],
      },
    ],
  },
  {
    id: "dia_ferryman",
    display_name: "The Riverman",
    nodes: [
      {
        id: "node_1",
        speaker: "The Riverman",
        text: "He does not look up from the table. — Daylight is for licenses, Intercessor, and I have none worth showing. Come to the bridge after dark if your inquiry buys as well as it asks.",
        options: [
          {
            text: "I'm at the bridge. Talk. (Night)",
            condition: { time_of_day: ["night", "dusk", "witching_hour"] },
            next_node_id: "node_trade",
          },
          {
            text: "The cave did not belong to Lazare.",
            condition: { switch: "vampire_cleared" },
            next_node_id: "node_post_clear",
          },
          {
            text: "What does the river know about Mara Vey?",
            condition: { switch: "nessa_thread_started" },
            next_node_id: "node_nessa",
          },
          { text: "Another time, then." },
        ],
      },
      {
        id: "node_trade",
        speaker: "The Riverman",
        text: "Better. The river moves what the procession won't: unsanctioned glass, old ledgers, people who need one authority without entering another. For a shard of the pretty kind I will tell you what I ferried the week the Witness bled — and my cache by the back room opens to glass, if you take more to reading than to listening.",
        options: [
          {
            text: "What did you ferry that week?",
            condition: { has_item: "itm_glass_shard" },
            next_node_id: "node_secret",
          },
          { text: "I'll keep my glass." },
        ],
      },
      {
        id: "node_secret",
        speaker: "The Riverman",
        text: "Keep your shard — the question is payment enough, it tells me the Church finally sent someone who asks. That week I ferried nothing. Understand: nothing, for six nights, because the water would not take weight. It sat the boats high and wrong like it was already carrying something heavier. Whatever opened at the Witness, the river felt it first.",
        options: [{ text: "The river felt it first...", next_node_id: "node_1" }],
      },
      {
        id: "node_post_clear",
        speaker: "The Riverman",
        text: "River takes names slow. Church takes them fast. Today the river was kinder.",
        options: [{ text: "Go back.", next_node_id: "node_1" }],
      },
      {
        id: "node_nessa",
        speaker: "The Riverman",
        text: "Mara put candles where the bank caves under the old bridge. Not as a child playing priest. As someone paying a debt. If you go west, bring something you can afford to lose.",
        options: [{ text: "Go back.", next_node_id: "node_1" }],
      },
    ],
  },

  // --- Outer district witnesses ---
  {
    id: "dia_gate_anchorite",
    display_name: "Sister Vela of the Mouthstone",
    nodes: [
      {
        id: "node_1",
        speaker: "Sister Vela",
        text: "I keep the old road swept because the gate does not like offerings left untended. The Church calls that superstition. The Church also sends me oil, keys, and a guard who pretends not to listen.",
        options: [
          { text: "What does the Mouthstone do?", next_node_id: "node_gate" },
          { text: "Why stand so far from the Witness?", next_node_id: "node_far" },
          {
            text: "Lazare is cleared.",
            condition: { switch: "vampire_cleared" },
            next_node_id: "node_post_clear",
          },
          {
            text: "Nessa's case is facing this road now.",
            condition: { switch: "nessa_thread_started" },
            next_node_id: "node_nessa",
          },
          { text: "Keep your watch." },
        ],
      },
      {
        id: "node_gate",
        speaker: "Sister Vela",
        text: "It marks the last counted tile. Past it, a person belongs to no parish ledger. That sounds like freedom until you understand how hungry an uncounted place can be.",
        options: [{ text: "Go back.", next_node_id: "node_1" }],
      },
      {
        id: "node_far",
        speaker: "Sister Vela",
        text: "Because the Witness is the town's wound, and the Mouthstone is its mouth. Wounds draw eyes. Mouths remember names. I prefer the older danger.",
        options: [{ text: "Go back.", next_node_id: "node_1" }],
      },
      {
        id: "node_post_clear",
        speaker: "Sister Vela",
        text: "A cleared name is a door left open behind you. Do not look only at the grateful man. Look at what the town now has no word to blame.",
        options: [{ text: "Go back.", next_node_id: "node_1" }],
      },
      {
        id: "node_nessa",
        speaker: "Sister Vela",
        text: "You walked past the Mouthstone with questions the Church has not answered. Be careful which direction curiosity faces. Some gates open inward when everyone swears they open out.",
        options: [{ text: "Go back.", next_node_id: "node_1" }],
      },
    ],
  },
  {
    id: "dia_glass_apprentice",
    display_name: "Orin, Glassworks Hand",
    nodes: withSceneArt([
      {
        id: "node_1",
        speaker: "Orin",
        text: "Do not stand too close to the furnace line. Even cold Glass can learn bad habits from heat. You heard the market, Intercessor; at least one person in this town is willing to say the obvious thing out loud.",
        options: [
          { text: "Why Lazare?", next_node_id: "node_lazare" },
          {
            text: "What did you give Darro?",
            condition: {
              all: [
                { switch: "act1_assigned" },
                {
                  not: {
                    any: [
                      { switch: "testimony_dimos" },
                      { switch: "testimony_holt" },
                      { switch: "found_log_1" },
                      { switch: "side_orin_glassworks_clue" },
                    ],
                  },
                },
              ],
            },
            next_node_id: "node_darro_evasive",
          },
          {
            text: "What did you give Darro?",
            condition: {
              all: [
                { switch: "act1_assigned" },
                {
                  any: [
                    { switch: "testimony_dimos" },
                    { switch: "testimony_holt" },
                    { switch: "found_log_1" },
                    { switch: "side_orin_glassworks_clue" },
                  ],
                },
              ],
            },
            next_node_id: "node_darro_offcut",
          },
          {
            text: "Dimos says you bought candles.",
            condition: { switch: "testimony_dimos" },
            next_node_id: "node_dimos",
          },
          {
            text: "Holt says you went out.",
            condition: { switch: "testimony_holt" },
            next_node_id: "node_holt",
          },
          {
            text: "The log says: 'O said it was spent.'",
            condition: { switch: "found_log_1" },
            next_node_id: "node_log_pressure",
          },
          {
            text: "Record Orin's testimony.",
            condition: {
              all: [
                { switch: "act1_assigned" },
                {
                  not: {
                    any: [
                      { switch: "testimony_dimos" },
                      { switch: "testimony_holt" },
                      { switch: "found_log_1" },
                      { switch: "side_orin_glassworks_clue" },
                    ],
                  },
                },
              ],
            },
            next_node_id: "node_record_unpressed",
          },
          {
            text: "Record Orin's pressured testimony.",
            condition: {
              all: [
                { switch: "act1_assigned" },
                {
                  any: [
                    { switch: "testimony_dimos" },
                    { switch: "testimony_holt" },
                    { switch: "found_log_1" },
                    { switch: "side_orin_glassworks_clue" },
                  ],
                },
              ],
            },
            next_node_id: "node_record_pressed",
          },
          {
            text: "Show me what glass can store.",
            condition: { switch: "act1_assigned" },
            next_node_id: "node_side_glassworks",
          },
          {
            text: "The cave logs describe grid sickness.",
            condition: { any: [{ switch: "found_log_1" }, { switch: "found_log_2" }, { switch: "found_log_3" }, { switch: "found_log_4" }] },
            next_node_id: "node_logs",
          },
          {
            text: "Lazare has been cleared.",
            condition: { switch: "vampire_cleared" },
            next_node_id: "node_post_clear",
          },
          {
            text: "What about the Witness Glass?",
            condition: { switch: "nessa_thread_started" },
            next_node_id: "node_nessa",
          },
          {
            text: "Have you seen the Glass figures move?",
            condition: { switch: "seen_cordon" },
            next_node_id: "node_move",
          },
          { text: "Back to work." },
        ],
      },
      {
        id: "node_lazare",
        speaker: "Orin",
        text: "Because Darro is dead and Lazare is hungry.\n\nBecause animals were opened and vampires open animals. Must every obvious thing be made polite before the Church believes it?\n\nA sealed monster is still a monster, even if the seal has good handwriting.",
        options: [{ text: "Go back.", next_node_id: "node_1" }],
      },
      {
        id: "node_darro_evasive",
        speaker: "Orin",
        text: "Darro asked questions sometimes. Everyone asks questions.\n\nQuestions do not make me his keeper, and a dead man does not become my inventory because the Church wants shelves.\n\nAsk your vampire what hunger remembers. Ask me about Glass when you have a Glass question.",
        options: [{ text: "Go back.", next_node_id: "node_1" }],
      },
      {
        id: "node_darro_offcut",
        speaker: "Orin",
        text: "I gave him an offcut. Spent Glass. Cold. Useless. Furnace scrap.\n\nYou can find worse in any Church reliquary if you are allowed to open the cabinet.\n\nDarro asked questions. Questions do not make me his keeper.",
        options: [{ text: "Mark the shard link.", set_switch: "found_orin_shard_link", next_node_id: "node_1" }],
      },
      {
        id: "node_dimos",
        speaker: "Orin",
        text: "Seven candles is not a rite. Seven is a number.\n\nDimos sells candles to widows, cowards, lovers, and priests; he thinks that makes him a theologian.\n\nI bought supplies for furnace work.",
        options: [{ text: "Go back.", next_node_id: "node_1" }],
      },
      {
        id: "node_holt",
        speaker: "Orin",
        text: "I went to the edge road. Glassworks business.\n\nDarro wanted to see whether the offcut still held warmth. I told him not to do anything stupid.\n\nHe did not ask my permission to die.",
        options: [{ text: "Go back.", next_node_id: "node_1" }],
      },
      {
        id: "node_log_pressure",
        speaker: "Orin",
        text: "Then the log is accurate. I said spent. I believed spent.\n\nI survived this. Hiding came after.\n\nI wanted the monster to be the monster. Is that so rare here?",
        options: [
          { text: "Record the shard link.", set_switch: "found_orin_shard_link", next_node_id: "node_1" },
          { text: "Go back.", next_node_id: "node_1" },
        ],
      },
      {
        id: "node_record_unpressed",
        speaker: "Orin",
        text: "Record this: Darro was unstable before I saw him. Lazare is dangerous. The cave was not my doing.\n\nIf the Church needs a tidy monster, it already knows where the shutters are.\n\nThat is testimony, Intercessor. Do not decorate it.",
        options: [{ text: "Record Orin's testimony.", condition: { switch: "act1_assigned" }, trigger_cutscene: "cut_record_orin" }],
      },
      {
        id: "node_record_pressed",
        speaker: "Orin",
        text: "Fine. Record that I gave Darro a spent offcut and saw him on the old road.\n\nRecord that I told him not to use it.\n\nRecord that Lazare is still a vampire. All of those can be true at once.",
        options: [{ text: "Record Orin's pressured testimony.", condition: { switch: "act1_assigned" }, trigger_cutscene: "cut_record_orin", set_switch: "found_orin_shard_link" }],
      },
      {
        id: "node_work",
        speaker: "Orin",
        text: "Take my testimony after Dimos and before Marta if you want the craft answer in order.\n\nThe Church buys the big panes and pretends the small ones are folk taste.\n\nCordon lamps, black-star panes, little blessed windows: all of them keep more feeling than glass ought to keep.",
        options: [{ text: "Record Orin's testimony.", condition: { switch: "act1_assigned" }, trigger_cutscene: "cut_record_orin" }],
      },
      {
        id: "node_side_glassworks",
        speaker: "Orin",
        text: "Watch for warm shards and repeated reflections on the cave road; that means stored pattern, not teeth.\n\nArtisans know glass remembers, but priests prefer the word witness because it sounds obedient.\n\nSome panes borrow a feeling from the last hand on them and return it to the next.",
        options: [{ text: "Mark Orin's glassworks clue.", set_switch: "side_orin_glassworks_clue", next_node_id: "node_1" }],
      },
      {
        id: "node_move",
        speaker: "Orin",
        text: "Compare the square reflections to the cave shards; both can hold a pattern without moving.\n\nNever when a guard asks, of course. Glass knows authority.\n\nIn a dark pane one figure stands half a breath wrong, and your skin notices before your eyes do.",
        options: [{ text: "Record Orin's testimony.", condition: { switch: "act1_assigned" }, trigger_cutscene: "cut_record_orin" }],
      },
      {
        id: "node_logs",
        speaker: "Orin",
        text: "Bring that finding to Aldric: hot-patterned stone is exposure, not vampire feeding.\n\nGlass does not have to move to be active; that is what people do not understand.\n\nThe cave shard was not clean Church work either, and that is the part I will not say near Petra.",
        options: [{ text: "Record Orin's testimony.", condition: { switch: "act1_assigned" }, trigger_cutscene: "cut_record_orin" }],
      },
      {
        id: "node_post_clear",
        speaker: "Orin",
        text: "They took my furnace key. Handling breach. Failure to report. Unlicensed transfer.\n\nNot murder. The distinction should comfort me.\n\nIt does not.",
        options: [{ text: "Go back.", next_node_id: "node_1" }],
      },
      {
        id: "node_nessa",
        speaker: "Orin",
        text: "The Witness figures are too coherent. I do not like coherent. Ordinary Glass holds pattern. That stuff holds intention, or something close enough that my hands do not know the difference.",
        options: [{ text: "Go back.", next_node_id: "node_1" }],
      },
    ], CUTSCENE_ART_ORIN_GLASSWORKS, "The stained-glass furnace hall of the Alderamontico Glassworks."),
  },
  {
    id: "dia_burial_keeper",
    display_name: "Marta of the Lower Graves",
    nodes: [
      {
        id: "node_1",
        speaker: "Marta",
        text: "Lower graves for lower questions. The churchyard keeps names. Down here we keep what the names were afraid to say.",
        options: [
          {
            text: "Did Lazare feed on Darro?",
            condition: { switch: "act1_assigned" },
            next_node_id: "node_feeding",
          },
          {
            text: "What did Darro's body show?",
            condition: { switch: "act1_assigned" },
            next_node_id: "node_body",
          },
          {
            text: "Did you know Darro?",
            condition: { switch: "act1_assigned" },
            next_node_id: "node_darro",
          },
          {
            text: "What do the southern stones mark?",
            condition: { switch: "act1_assigned" },
            next_node_id: "node_stones",
          },
          {
            text: "Does the old rite still have followers?",
            condition: { switch: "act1_assigned" },
            next_node_id: "node_followers",
          },
          {
            text: "What would prove this was not feeding?",
            condition: { switch: "act1_assigned" },
            next_node_id: "node_side_burial",
          },
          {
            text: "The cave death was grid sickness.",
            condition: { switch: "vampire_cleared" },
            next_node_id: "node_post_clear",
          },
          {
            text: "What do the dead say about the Witness?",
            condition: { switch: "nessa_thread_started" },
            next_node_id: "node_nessa",
          },
          { text: "I'll leave you to the graves." },
        ],
      },
      {
        id: "node_stones",
        speaker: "Marta",
        text: "Record this if you need testimony: old rites were family habit before they were a crime file.\n\nFamilies too pagan to face the nave were still too useful to bury outside the walls.\n\nAlderamontico has always known how to condemn a thing and inherit it.",
        options: [{ text: "Record Marta's testimony.", trigger_cutscene: "cut_record_marta" }],
      },
      {
        id: "node_feeding",
        speaker: "Marta",
        text: "No. Vampire death has signs.\n\nHunger is ugly, but it is honest about where it entered. Darro's wounds started where no teeth could reach.\n\nIf they want Lazare for this, they will need a different body.",
        options: [{ text: "Record Marta's testimony.", trigger_cutscene: "cut_record_marta" }],
      },
      {
        id: "node_body",
        speaker: "Marta",
        text: "Hands burned through. Nails full of soil. Chest tight inward, like the body tried to become a container and failed.\n\nI have seen Glass pressure before. It is not feeding.\n\nThe dead do not become cleaner because the living want a simpler monster.",
        options: [{ text: "Record Marta's testimony.", trigger_cutscene: "cut_record_marta" }],
      },
      {
        id: "node_darro",
        speaker: "Marta",
        text: "He carried stones for graves sometimes. Quiet boy. Got quieter.\n\nQuiet can be peace, sickness, or a person learning not to answer.\n\nBy the end his hands looked like they had been asking the ground for permission.",
        options: [{ text: "Record Marta's testimony.", trigger_cutscene: "cut_record_marta" }],
      },
      {
        id: "node_side_burial",
        speaker: "Marta",
        text: "Look for collapse, heat, and glassy pressure in the cave victim; feeding leaves hunger marks, not a body burned from within.\n\nThe Church likes tidy monsters because tidy monsters fit tidy coffins.\n\nDown here the graves know the difference between a killing and a burning-out.",
        options: [{ text: "Mark Marta's burial clue.", set_switch: "side_marta_burial_clue", next_node_id: "node_1" }],
      },
      {
        id: "node_followers",
        speaker: "Marta",
        text: "Ask this after the cave logs if you want the Mara thread to make sense.\n\nFollowers? No. Habits. A habit can outlive a god, a bishop, and a law.\n\nThe old candles were housekeeping long before anyone made them conspiracy.",
        options: [{ text: "Record Marta's testimony.", trigger_cutscene: "cut_record_marta" }],
      },
      {
        id: "node_post_clear",
        speaker: "Marta",
        text: "You did right. The lower graves know the difference between a killing and a burning-out. Glass does not bury. It waits.",
        options: [{ text: "Go back.", next_node_id: "node_1" }],
      },
      {
        id: "node_nessa",
        speaker: "Marta",
        text: "The dead at the Witness are not resting. Do not ask me how I know. The names are still there, but the silence around them has been spent.",
        options: [{ text: "Go back.", next_node_id: "node_1" }],
      },
    ],
  },
  {
    id: "dia_lazare_vampire",
    display_name: "Lazare Behind the Shutters",
    nodes: [
      {
        id: "node_1",
        speaker: "Lazare",
        text: "The shuttered house does not creak. It listens. A pale man inclines his head from a room kept dark at noon and darker at dusk. 'Intercessor. Brother Aldric. The town has finally become bored enough of fearing me from a distance.'",
        scene_image_url: CUTSCENE_ART_LAZARE_ESTATE,
        scene_image_alt: "Brother Aldric and the Intercessor stand outside Lazare's shuttered estate.",
        options: [
          {
            text: "Did you kill Darro Keel?",
            condition: { switch: "act1_assigned" },
            next_node_id: "node_kill",
          },
          { text: "Why does the town fear you?", next_node_id: "node_fear" },
          {
            text: "You never leave this house.",
            condition: { switch: "act1_assigned" },
            next_node_id: "node_stay",
          },
          {
            text: "May I inspect the threshold?",
            condition: { switch: "act1_assigned" },
            next_node_id: "node_threshold",
          },
          {
            text: "What did you see?",
            condition: { switch: "act1_assigned" },
            next_node_id: "node_mirror",
          },
          {
            text: "What do you know of Orin?",
            condition: { switch: "act1_assigned" },
            next_node_id: "node_orin",
          },
          { text: "What are you?", next_node_id: "node_what" },
          {
            text: "Your name is cleared.",
            condition: { switch: "vampire_cleared" },
            next_node_id: "node_cleared",
          },
          {
            text: "Will you help with Nessa?",
            condition: { all: [{ switch: "vampire_cleared" }, { not: { switch: "lazare_recruited" } }] },
            next_node_id: "node_recruit",
          },
          {
            text: "Do you know anything about the rite?",
            condition: { switch: "met_nessa" },
            next_node_id: "node_rite",
          },
          { text: "Close the door." },
        ],
      },
      {
        id: "node_kill",
        speaker: "Lazare",
        text: "No. I am capable of hunger. I am capable of cruelty. I am capable of remembering both with more honesty than this town would prefer.\n\nI did not kill Darro Keel.\n\nDo not improve that into innocence.",
        scene_image_url: CUTSCENE_ART_LAZARE_ESTATE,
        scene_image_alt: "Brother Aldric and the Intercessor stand outside Lazare's shuttered estate.",
        options: [{ text: "Go back.", set_switch: "lazare_talked", next_node_id: "node_1" }],
      },
      {
        id: "node_fear",
        speaker: "Lazare",
        text: "Because fear likes a body.\n\nThe Grid has no throat to hang. Glass has no address.\n\nI do.",
        scene_image_url: CUTSCENE_ART_LAZARE_ESTATE,
        scene_image_alt: "Brother Aldric and the Intercessor stand outside Lazare's shuttered estate.",
        options: [{ text: "Go back.", next_node_id: "node_1" }],
      },
      {
        id: "node_stay",
        speaker: "Lazare",
        text: "Check the threshold and Holt's slate if you need proof I stayed where the town prefers me.\n\nI have a covenant with the shutters, a bill with the butcher, and no argument with sunlight that requires personal inspection.\n\nAlderamontico loves a locked door when it can imagine anything behind it.",
        scene_image_url: CUTSCENE_ART_LAZARE_ESTATE,
        scene_image_alt: "Brother Aldric and the Intercessor stand outside Lazare's shuttered estate.",
        options: [{ text: "Go back.", next_node_id: "node_1" }],
      },
      {
        id: "node_threshold",
        speaker: "Lazare",
        text: "Look at the dust outside the chain: one butcher's hook, two delivery scuffs, no night prints leaving south.\n\nI am an easy category, Intercessor, which is a polite way to say the accusation arrived before the evidence.\n\nThe threshold is swept in salt and black tea every dawn, an old courtesy to hunger and gossip alike.",
        scene_image_url: CUTSCENE_ART_LAZARE_ESTATE,
        scene_image_alt: "Brother Aldric and the Intercessor stand outside Lazare's shuttered estate.",
        options: [{ text: "Mark the threshold evidence.", set_switch: "side_lazare_threshold_evidence", next_node_id: "node_1" }],
      },
      {
        id: "node_mirror",
        speaker: "Lazare",
        text: "I saw the old road in my mirror. Not by choice.\n\nOld vampire houses learn reflections the way churches learn bells. Something opened toward the cave.\n\nIt smelled of hot Glass and prayer spoken through clenched teeth.",
        scene_image_url: CUTSCENE_ART_LAZARE_ESTATE,
        scene_image_alt: "Brother Aldric and the Intercessor stand outside Lazare's shuttered estate.",
        options: [{
          text: "Go back.",
          set_switches: [
            { switch_id: "lazare_mirror_admitted" },
            { switch_id: "lazare_talked" },
          ],
          next_node_id: "node_1",
        }],
      },
      {
        id: "node_orin",
        speaker: "Lazare",
        text: "Guilt has a young man's posture when it has not learned elegance.\n\nOrin is not wrong to fear me. That is what makes his fear useful.\n\nA false accusation does not need a harmless target. It needs a believable one.",
        scene_image_url: CUTSCENE_ART_LAZARE_ESTATE,
        scene_image_alt: "Brother Aldric and the Intercessor stand outside Lazare's shuttered estate.",
        options: [{ text: "Go back.", next_node_id: "node_1" }],
      },
      {
        id: "node_what",
        speaker: "Lazare",
        text: "A licensed appetite. A tolerated scandal. A monster with proper papers.\n\nDangerous does not mean guilty of this death.\n\nDo not improve me in your notes.",
        scene_image_url: CUTSCENE_ART_LAZARE_ESTATE,
        scene_image_alt: "Brother Aldric and the Intercessor stand outside Lazare's shuttered estate.",
        options: [{ text: "Go back.", set_switch: "lazare_talked", next_node_id: "node_1" }],
      },
      {
        id: "node_rite",
        speaker: "Lazare",
        text: "Only this: the night the Witness bled, every mirror in this room showed the old road instead of my face. I know the difference, Intercessor. One of those has never belonged to me.",
        scene_image_url: CUTSCENE_ART_LAZARE_ESTATE,
        scene_image_alt: "Brother Aldric and the Intercessor stand outside Lazare's shuttered estate.",
        options: [{ text: "Go back.", set_switch: "lazare_talked", next_node_id: "node_1" }],
      },
      {
        id: "node_cleared",
        speaker: "Lazare",
        text: "My shutters are open. People keep pretending not to see.\n\nCleared is a Church word. It means the ink has moved on.\n\nThe town cleared me with its teeth clenched. I prefer hatred when it is honest about the jaw.",
        scene_image_url: CUTSCENE_ART_LAZARE_ESTATE,
        scene_image_alt: "Brother Aldric and the Intercessor stand outside Lazare's shuttered estate.",
        options: [{ text: "Go back.", next_node_id: "node_1" }],
      },
      {
        id: "node_recruit",
        speaker: "Lazare",
        text: "Open my shutters and call it gratitude? No. I am innocent of this death, not safe. But if your inquiry reaches a locked threshold after dusk, knock once. I may answer from inside the dark.",
        scene_image_url: CUTSCENE_ART_LAZARE_ESTATE,
        scene_image_alt: "Brother Aldric and the Intercessor stand outside Lazare's shuttered estate.",
        options: [{ text: "Accept the boundary.", set_switch: "lazare_recruited", next_node_id: "node_1" }],
      },
    ],
  },
  {
    id: "dia_lazare_door_not_ready",
    display_name: "Lazare's Shuttered Door",
    nodes: [
      {
        id: "node_1",
        speaker: "Door",
        text: "The shuttered house does not creak. It listens, then remains shut.\n\nAldric's order catches in your mind: testimony first, then the man the town has already convicted.\n\nThe door keeps its silence like a signature.",
        scene_image_url: CUTSCENE_ART_LAZARE_ESTATE,
        scene_image_alt: "Brother Aldric and the Intercessor stand outside Lazare's shuttered estate.",
        options: [{ text: "Step back." }],
      },
    ],
  },

  // ——— Fixtures ———
  {
    id: "dia_merchant",
    display_name: "Provisioner Dimos",
    nodes: [
      {
        id: "node_1",
        speaker: "Provisioner Dimos",
        text: "Intercessor! Supplies, sundries, and no opinions — the only stall on the square that sells all three. What will it be?",
        scene_image_url: CUTSCENE_ART_DIMOS_MARKET,
        scene_image_alt: "Brother Aldric and the Intercessor question Provisioner Dimos at his market stall.",
        options: [
          { text: "Show me your goods.", trigger_cutscene: "cut_open_shop" },
          {
            text: "What did Lazare buy?",
            condition: { switch: "act1_assigned" },
            next_node_id: "node_lazare_buys",
          },
          {
            text: "What did Orin buy?",
            condition: { switch: "act1_assigned" },
            next_node_id: "node_orin_buys",
          },
          {
            text: "What did Darro buy?",
            condition: { switch: "act1_assigned" },
            next_node_id: "node_darro_buys",
          },
          {
            text: "Trading at this hour?",
            condition: { time_of_day: ["dusk", "night"] },
            next_node_id: "node_late",
          },
          {
            text: "No opinions? About the trial?",
            condition: { switch: "act1_assigned" },
            next_node_id: "node_opinion",
          },
          {
            text: "People are buying differently after Lazare.",
            condition: { switch: "vampire_cleared" },
            next_node_id: "node_post_clear",
          },
          {
            text: "What are they buying now that Nessa's name is back?",
            condition: { switch: "nessa_thread_started" },
            next_node_id: "node_nessa",
          },
          { text: "Not now." },
        ],
      },
      {
        id: "node_late",
        speaker: "Provisioner Dimos",
        text: "After dusk the Church counts my lamp oil, so late trade carries a late premium. Buy quick, or buy at dawn.",
        scene_image_url: CUTSCENE_ART_DIMOS_MARKET,
        scene_image_alt: "Brother Aldric and the Intercessor question Provisioner Dimos at his market stall.",
        options: [{ text: "Go back.", next_node_id: "node_1" }],
      },
      {
        id: "node_opinion",
        speaker: "Provisioner Dimos",
        text: "Write this down: Lazare bought nothing, Orin bought rite-looking supplies and called them work, and Darro stopped buying ordinary things before he died.\n\nThat is testimony, not a verdict.\n\nI sell no opinions, Intercessor, but I sell a great many candles, and I can count.",
        scene_image_url: CUTSCENE_ART_DIMOS_MARKET,
        scene_image_alt: "Brother Aldric and the Intercessor question Provisioner Dimos at his market stall.",
        options: [{ text: "Record Dimos's testimony.", condition: { switch: "act1_assigned" }, trigger_cutscene: "cut_record_dimos" }],
      },
      {
        id: "node_lazare_buys",
        speaker: "Provisioner Dimos",
        text: "Nothing. Lazare never buys candles, rope, salt, or oil.\n\nPeople afraid of Lazare buy those things, which is a distinction most of my business depends on.\n\nFear spends better when it has an address.",
        scene_image_url: CUTSCENE_ART_DIMOS_MARKET,
        scene_image_alt: "Brother Aldric and the Intercessor question Provisioner Dimos at his market stall.",
        options: [{ text: "Go back.", next_node_id: "node_1" }],
      },
      {
        id: "node_orin_buys",
        speaker: "Provisioner Dimos",
        text: "Seven candles. Lamp oil. Wrapping cloth. Glass-safe twine.\n\nHe said furnace scrap, and maybe it was. Young men lie better when they use work words.\n\nThe cloth had the good weave, the kind you use when you do not want Glass dust on your skin.",
        scene_image_url: CUTSCENE_ART_DIMOS_MARKET,
        scene_image_alt: "Brother Aldric and the Intercessor question Provisioner Dimos at his market stall.",
        options: [{ text: "Go back.", next_node_id: "node_1" }],
      },
      {
        id: "node_darro_buys",
        speaker: "Provisioner Dimos",
        text: "Bread twice. Cheap gloves once. A tin cup.\n\nThe week before he died, nothing. People in trouble stop buying ordinary things first.\n\nMorning has a market smell; Darro stopped smelling like morning was expected.",
        scene_image_url: CUTSCENE_ART_DIMOS_MARKET,
        scene_image_alt: "Brother Aldric and the Intercessor question Provisioner Dimos at his market stall.",
        options: [{ text: "Go back.", next_node_id: "node_1" }],
      },
      {
        id: "node_post_clear",
        speaker: "Provisioner Dimos",
        text: "People buy rope before they admit they are afraid of falling. Today it is candles again. More candles than when they thought they had a vampire. That should tell you how comforted they are.",
        scene_image_url: CUTSCENE_ART_DIMOS_MARKET,
        scene_image_alt: "Brother Aldric and the Intercessor question Provisioner Dimos at his market stall.",
        options: [{ text: "Go back.", next_node_id: "node_1" }],
      },
      {
        id: "node_nessa",
        speaker: "Provisioner Dimos",
        text: "Glass-safe gloves cost extra because fear has hands. If the Church lets this case breathe, I will sell through my whole crate by dusk and hate every coin of it.",
        scene_image_url: CUTSCENE_ART_DIMOS_MARKET,
        scene_image_alt: "Brother Aldric and the Intercessor question Provisioner Dimos at his market stall.",
        options: [{ text: "Go back.", next_node_id: "node_1" }],
      },
    ],
  },
  {
    id: "dia_mouthstone",
    display_name: "The Mouthstone",
    nodes: [
      {
        id: "node_1",
        speaker: "System",
        text: "The Mouthstone: three tiles of polished black stone, taller than two men, its broad faces smooth as still water in the dark. Down each thin edge runs a column of golden hummingbirds - worn, but unmistakable, and far older than the Church that renamed this the Exile Gate. The pagan lands begin where its shadow ends. Things once cut low on the faces have been chiselled away, twice.",
        options: [{ text: "Leave it be." }],
      },
    ],
  },
  {
    id: "dia_old_rite_shrine",
    display_name: "Old Rite Stone",
    nodes: [
      {
        id: "node_1",
        speaker: "System",
        text: "A low black shrine stone, older than the church paths around it. Candle wax has filled the worn cuts in its face, but not evenly; someone still knows which grooves matter.",
        options: [{ text: "Step back." }],
      },
    ],
  },
  {
    id: "dia_lazare_threshold",
    display_name: "Lazare's Threshold",
    nodes: [
      {
        id: "node_1",
        speaker: "Scene",
        text: "The dust outside Lazare's door is undisturbed except for delivery scuffs and a butcher's hook mark. Church wax seals the inner shutter.\n\nWhatever else is true, this house has been keeping its prisoner.",
        options: [{ text: "Record the threshold evidence.", set_switch: "side_lazare_threshold_evidence" }],
      },
    ],
  },
  {
    id: "dia_orin_workbench",
    display_name: "Orin's Workbench",
    nodes: [
      {
        id: "node_1",
        speaker: "Workbench",
        text: "Soot, blue-white powder, and Glass-safe twine mark the bench. A strip of wrapping cloth has been cut with shaking hands.\n\nThe particles catch the light and hold it a breath too long.",
        options: [{ text: "Record the Glassworks clue.", set_switch: "side_orin_glassworks_clue" }],
      },
    ],
  },
  {
    id: "dia_lower_grave_cloth",
    display_name: "Lower Grave Cloth",
    nodes: [
      {
        id: "node_1",
        speaker: "Grave Cloth",
        text: "Marta's grave-cloth smells of river damp and ash. Darro's name is stitched into the edge before the Church file has approved the spelling.\n\nThe cloth is marked by heat from within, not by teeth.",
        options: [{ text: "Record Marta's burial clue.", set_switch: "side_marta_burial_clue" }],
      },
    ],
  },
  {
    id: "dia_statue",
    display_name: "The Witness, From the Line",
    nodes: [
      {
        id: "node_1",
        speaker: "System",
        text: "The Witness of the Dark Lights, seen across the cordon: hooded marble, gold ring dulled by weather, and the dark runs from beneath the hood that the guards no longer scrub away. Glass has begun at its feet like frost that chose to stay. It is facing the town. It was carved facing the stars.",
        options: [
          {
            text: "Inspect the sealed figures.",
            condition: { not: { switch: "nessa_thread_started" } },
            next_node_id: "node_before_nessa",
          },
          {
            text: "Watch how the Glass catches light.",
            condition: { switch: "nessa_thread_started" },
            next_node_id: "node_after_nessa",
          },
          { text: "Step back from the line." },
        ],
      },
      {
        id: "node_before_nessa",
        speaker: "Scene",
        text: "Three young adults remain Glass where they touched the Witness. The town has not decided whether to mourn them or use them.\n\nPrayer tags snap in the cordon wind, each one written as if the statue can read from behind its hood.",
        options: [{ text: "Step back from the line.", next_node_id: "node_1" }],
      },
      {
        id: "node_after_nessa",
        speaker: "Scene",
        text: "The Glass figures catch the light differently now, or perhaps you have learned enough to mistrust the light.\n\nMara's name sits in your case file, and suddenly the cordon looks less like a fence than a sentence paused mid-word.",
        options: [{ text: "Step back from the line.", next_node_id: "node_1" }],
      },
    ],
  },
  {
    id: "dia_cordon",
    display_name: "The Cordon Line",
    nodes: [
      {
        id: "node_1",
        speaker: "Notice",
        text: "CORDON OF PROCEDURAL MERCY — None pass. None touch. None linger past their errand. By order of the Intercession; renewed nightly; the marble is counted.",
        options: [{ text: "Step away." }],
      },
    ],
  },
  {
    id: "dia_notice_board",
    display_name: "Proclamation Stele",
    nodes: [
      {
        id: "node_1",
        speaker: "Stele",
        text: "Fresh-cut letters over older, shallower ones: 'INQUIRY IN PROGRESS. Citizens will render truthful answer to the sworn Intercessor. Curiosity is not a defense. Hindrance is not a custom. The Grid is a gift.' Beneath, in a different, hastier hand someone has scratched: SO WAS SHE.",
        options: [{ text: "Step away." }],
      },
    ],
  },
  {
    id: "dia_estate_road_sign",
    display_name: "Estate Road Sign",
    nodes: [
      {
        id: "node_1",
        speaker: "Sign",
        text: "EAST ROAD: Lazare's licensed estate. Deliveries only after count and before dusk. No gawkers, no dares, no children sent to knock for sport.",
        options: [{ text: "Step away." }],
      },
    ],
  },
  {
    id: "dia_grove_notice",
    display_name: "Grove Stele",
    nodes: [
      {
        id: "node_1",
        speaker: "Stele",
        text: "A neighborhood hand has refreshed the old carving: water first, candle second, name last. Someone has tucked fresh wax in the letters despite the Church seal across the top.",
        options: [{ text: "Step away." }],
      },
    ],
  },
  {
    id: "dia_save",
    display_name: "Wayside Candle",
    nodes: [
      {
        id: "node_1",
        speaker: "Wayside Candle",
        text: "A votive candle burns at the wayside shrine, steady against the night wind. The flame keeps what you give it.",
        options: [
          { text: "Pray, and give it this moment.", trigger_cutscene: "cut_save" },
          { text: "Read the candle rule.", next_node_id: "node_rule" },
          { text: "Leave it burning." },
        ],
      },
      {
        id: "node_rule",
        speaker: "Wayside Candle",
        text: "Use wayside candles to save and gather yourself before the cave road.\n\nThe Church calls it licensed rest; villagers call it not dying from pride.\n\nWax at the base is marked with older thumbprints than the current parish seal.",
        options: [{ text: "Remember the rule.", set_switch: "side_wayside_candle_text", next_node_id: "node_1" }],
      },
    ],
  },
  {
    id: "dia_case_board",
    display_name: "Aldric's Case Board",
    nodes: [
      {
        id: "node_1",
        speaker: "Case Board",
        text: "CASE: DARRO KEEL / EASTERN CAVE BODY.\n\nAldric has pinned the case in working order. His hand is neat enough to be unkind.\n\nRed thread runs from Darro's cave report to Lazare's license, Orin's Glassworks slip, Holt's slate, and Nessa's sealed custody file.",
        options: [
          {
            text: "Current: take Aldric's briefing.",
            condition: { not: { switch: "office_briefed" } },
            next_node_id: "node_need_briefing",
          },
          {
            text: "Current: gather testimony and visit Lazare.",
            condition: {
              all: [
                { switch: "act1_assigned" },
                { not: { switch: "vampire_cleared" } },
                { any: [{ not: { switch: "testimonies_gathered" } }, { not: { switch: "lazare_talked" } }] },
              ],
            },
            next_node_id: "node_testimony_loop",
          },
          {
            text: "Current: take the south road to the caves.",
            condition: {
              all: [
                { switch: "lazare_talked" },
                { switch: "testimonies_gathered" },
                { not: { switch: "found_log_4" } },
              ],
            },
            next_node_id: "node_forest_route",
          },
          {
            text: "Current: confront what remains in the depths.",
            condition: {
              all: [
                { switch: "found_log_4" },
                { not: { switch: "cyberghost_defeated" } },
                { not: { switch: "vampire_cleared" } },
              ],
            },
            next_node_id: "node_remnant",
          },
          {
            text: "Current: return the cave finding to Aldric.",
            condition: { all: [{ switch: "found_log_4" }, { switch: "cyberghost_defeated" }, { not: { switch: "vampire_cleared" } }] },
            next_node_id: "node_return_verdict",
          },
          {
            text: "Current: speak with Nessa in custody.",
            condition: { all: [{ switch: "nessa_thread_started" }, { not: { switch: "met_nessa" } }] },
            next_node_id: "node_nessa_hook",
          },
          {
            text: "Current: follow the cellar thread.",
            condition: { all: [{ switch: "met_nessa" }, { not: { switch: "seen_cellar" } }] },
            next_node_id: "node_cellar_thread",
          },
          { text: "Optional evidence pins.", next_node_id: "node_side_board" },
          { text: "Step away." },
        ],
      },
      {
        id: "node_need_briefing",
        speaker: "Case Board",
        text: "Start here in the scriptorium and ask Aldric for the cave writ.\n\nHe has already decided the accusation needs procedure before it gets a name.\n\nThe board smells of lampblack, sealing wax, and paper dried too close to holy heat.",
        options: [{ text: "Back to the board.", next_node_id: "node_1" }],
      },
      {
        id: "node_testimony_loop",
        speaker: "Case Board",
        text: "Required: question Dimos, Marta, Holt, and Orin, then speak to Lazare Behind the Shutters.\n\nDo not enter the eastern cave until testimony is recorded. The living must contradict each other before the dead are asked to explain.\n\nFour witness slips hang beside Lazare's threshold sketch and Orin's handling slip.",
        options: [{ text: "Back to the board.", next_node_id: "node_1" }],
      },
      {
        id: "node_forest_route",
        speaker: "Case Board",
        text: "Use the residential south gate: Old Processional Wood, Glass-Touched Copse, then the eastern caves.\n\nAldric has written 'do not wander; read the cave' in the margin.\n\nThe road sketch is lined with old stones, glass thorns, and a cave mouth drawn too carefully.",
        options: [{ text: "Back to the board.", next_node_id: "node_1" }],
      },
      {
        id: "node_return_verdict",
        speaker: "Case Board",
        text: "Return to Aldric. The vampire case can be filed; the Witness case cannot.\n\nDarro Keel handled Glass before death. Animal remains show counting behavior. Orin Vale is materially connected. Lazare's absence is corroborated.\n\nMara, Nessa, and the Witness are connected in red thread, with a pin left empty beside the gaol.",
        options: [{ text: "Back to the board.", next_node_id: "node_1" }],
      },
      {
        id: "node_remnant",
        speaker: "Case Board",
        text: "The grotto record is pinned, but the deep witness still stands.\n\nGo back through the eastern caves to the lower chamber and confront what remains of Darro's sickness before filing the finding.\n\nAldric has underlined one sentence twice: 'A case is not closed while the dead are still speaking.'",
        options: [{ text: "Back to the board.", next_node_id: "node_1" }],
      },
      {
        id: "node_nessa_hook",
        speaker: "Case Board",
        text: "Go to the Hall of Custody and speak to Nessa through the bars.\n\nThe vampire case proved how easily this town mistakes a category for a culprit.\n\nHer custody slip is pinned beside Mara's name, and the paper has been handled more than the ink admits.",
        options: [{ text: "Back to the board.", next_node_id: "node_1" }],
      },
      {
        id: "node_cellar_thread",
        speaker: "Case Board",
        text: "Follow Nessa's lead to the Counted Cup cellar and the sealed under-town route.\n\nAldric's note says: 'Old practice is not innocence, but neither is it guilt.'\n\nThe cellar sketch is drawn below the tavern like a second mouth under the first.",
        options: [{ text: "Back to the board.", next_node_id: "node_1" }],
      },
      {
        id: "node_side_board",
        speaker: "Case Board",
        text: "Optional pins strengthen the reading but do not hold the gate shut.\n\nAldric values corroboration because it makes frightened people argue with paper instead of each other.\n\nFive brass tacks sit in the lower margin: threshold, tally, glass, burial, candle.",
        options: [
          {
            text: "Lazare threshold: recorded.",
            condition: { switch: "side_lazare_threshold_evidence" },
            next_node_id: "node_side_lazare_done",
          },
          {
            text: "Lazare threshold: still open.",
            condition: { not: { switch: "side_lazare_threshold_evidence" } },
            next_node_id: "node_side_lazare_open",
          },
          {
            text: "Tally animal clue: recorded.",
            condition: { switch: "side_tally_animal_clue" },
            next_node_id: "node_side_tally_done",
          },
          {
            text: "Tally animal clue: still open.",
            condition: { not: { switch: "side_tally_animal_clue" } },
            next_node_id: "node_side_tally_open",
          },
          {
            text: "Orin glass clue: recorded.",
            condition: { switch: "side_orin_glassworks_clue" },
            next_node_id: "node_side_orin_done",
          },
          {
            text: "Orin glass clue: still open.",
            condition: { not: { switch: "side_orin_glassworks_clue" } },
            next_node_id: "node_side_orin_open",
          },
          {
            text: "Marta burial clue: recorded.",
            condition: { switch: "side_marta_burial_clue" },
            next_node_id: "node_side_marta_done",
          },
          {
            text: "Marta burial clue: still open.",
            condition: { not: { switch: "side_marta_burial_clue" } },
            next_node_id: "node_side_marta_open",
          },
          {
            text: "Wayside Candle rule: recorded.",
            condition: { switch: "side_wayside_candle_text" },
            next_node_id: "node_side_candle_done",
          },
          {
            text: "Wayside Candle rule: still open.",
            condition: { not: { switch: "side_wayside_candle_text" } },
            next_node_id: "node_side_candle_open",
          },
          { text: "Back to the board.", next_node_id: "node_1" },
        ],
      },
      {
        id: "node_side_lazare_done",
        speaker: "Case Board",
        text: "Threshold evidence is pinned: no night prints leaving south from Lazare's door.\n\nA convenient suspect became less convenient the moment someone looked at the floor.\n\nA pinch of salt is taped under the note, still grey from the doorstep.",
        options: [{ text: "Back to optional pins.", next_node_id: "node_side_board" }],
      },
      {
        id: "node_side_lazare_open",
        speaker: "Case Board",
        text: "Inspect Lazare's threshold at his east estate door if you want a physical check on the accusation.\n\nThe town prefers his locked door because it can imagine anything behind it.\n\nA blank sketch waits beside Holt's gate tally.",
        options: [{ text: "Back to optional pins.", next_node_id: "node_side_board" }],
      },
      {
        id: "node_side_tally_done",
        speaker: "Case Board",
        text: "The processional tally is pinned: animals failed before people named a vampire.\n\nFear chose Lazare because he was already filed as abnormal.\n\nThree small hoof marks are copied beside the old road sketch.",
        options: [{ text: "Back to optional pins.", next_node_id: "node_side_board" }],
      },
      {
        id: "node_side_tally_open",
        speaker: "Case Board",
        text: "Read the tally stone in Old Processional Wood on the way to the cave.\n\nIt is not required, but it widens the case beyond one accused man.\n\nThe old road has always counted more than parishioners.",
        options: [{ text: "Back to optional pins.", next_node_id: "node_side_board" }],
      },
      {
        id: "node_side_orin_done",
        speaker: "Case Board",
        text: "Orin's glass clue is pinned: pattern can store and transmit borrowed feeling, and Darro's shard came from a Glassworks hand.\n\nArtisans notice this before priests because artisans burn their fingers on the proof.\n\nA sliver of blue glass is wrapped in paper under his note.",
        options: [{ text: "Back to optional pins.", next_node_id: "node_side_board" }],
      },
      {
        id: "node_side_orin_open",
        speaker: "Case Board",
        text: "Ask Orin at the Glassworks what he gave Darro and what glass can store.\n\nThe answer helps separate Grid sickness from feeding, and negligence from murder.\n\nHis note is smudged with cullet dust and apprentice impatience.",
        options: [{ text: "Back to optional pins.", next_node_id: "node_side_board" }],
      },
      {
        id: "node_side_marta_done",
        speaker: "Case Board",
        text: "Marta's burial clue is pinned: burning-out leaves collapse, heat, and glass pressure.\n\nThe lower graves do not care which monster makes better gossip.\n\nA charcoal grave mark sits beside the cave victim's sketch.",
        options: [{ text: "Back to optional pins.", next_node_id: "node_side_board" }],
      },
      {
        id: "node_side_marta_open",
        speaker: "Case Board",
        text: "Ask Marta how the dead show feeding apart from burning-out.\n\nHer clue helps make the cave verdict plain without adding another branch.\n\nThe lower graves are marked on Aldric's map in a darker hand than the square.",
        options: [{ text: "Back to optional pins.", next_node_id: "node_side_board" }],
      },
      {
        id: "node_side_candle_done",
        speaker: "Case Board",
        text: "The candle rule is pinned: save and rest at wayside flames before hard routes.\n\nLicensed rest is still rest, even if the Church notarizes the mercy.\n\nA smear of wax holds the tack in place.",
        options: [{ text: "Back to optional pins.", next_node_id: "node_side_board" }],
      },
      {
        id: "node_side_candle_open",
        speaker: "Case Board",
        text: "Read a Wayside Candle before the cave if you need the town's save-and-rest rule in world.\n\nPride kills faster than doctrine on a bad road.\n\nThe candle icon on the board is drawn over an older flame mark.",
        options: [{ text: "Back to optional pins.", next_node_id: "node_side_board" }],
      },
    ],
  },
  {
    id: "dia_high_clerk",
    display_name: "High Clerk",
    nodes: [
      {
        id: "node_1",
        speaker: "High Clerk",
        text: "If you lose the case thread, read Aldric's board, then question the named witnesses before the cave road.\n\nConfusion is useful to a frightened parish; procedure is how we deny it that pleasure.\n\nMy ink is black because colored ink encourages drama.",
        options: [
          { text: "Where do I begin?", next_node_id: "node_begin" },
          { text: "Why is Lazare named so quickly?", next_node_id: "node_lazare" },
          { text: "Where does Orin fit?", next_node_id: "node_orin" },
          {
            text: "What do the cave logs change?",
            condition: { any: [{ switch: "found_log_1" }, { switch: "found_log_2" }, { switch: "found_log_3" }, { switch: "found_log_4" }] },
            next_node_id: "node_logs",
          },
          {
            text: "Aldric cleared Lazare.",
            condition: { switch: "vampire_cleared" },
            next_node_id: "node_verdict",
          },
          {
            text: "Nessa named Mara.",
            condition: { switch: "met_nessa" },
            next_node_id: "node_nessa",
          },
          { text: "Leave the clerk to the papers." },
        ],
      },
      {
        id: "node_begin",
        speaker: "High Clerk",
        text: "Begin with Aldric's briefing, then record Dimos, Marta, Holt, and Orin before speaking to Lazare and taking the south road.\n\nA case done out of order becomes a story, and stories are where mobs do their best work.\n\nThe witness slips are cut square so nobody can pretend the edges meant something.",
        options: [{ text: "Go back.", next_node_id: "node_1" }],
      },
      {
        id: "node_lazare",
        speaker: "High Clerk",
        text: "Lazare is accused because he is a category the town already knows how to fear.\n\nThat does not make him harmless; it makes him administratively convenient.\n\nHis license sits in the file beside a dried tea stain, which is nearly a parish seal here.",
        options: [{ text: "Go back.", next_node_id: "node_1" }],
      },
      {
        id: "node_orin",
        speaker: "High Clerk",
        text: "Orin belongs in the file because Darro handled Glassworks material and Orin has been loud enough to hide inside his own accusation.\n\nNegligence, panic, and murder are different boxes; my work is to keep them from breeding in the drawer.\n\nThe handling slip smells faintly of furnace oil and rainwater.",
        options: [{ text: "Go back.", next_node_id: "node_1" }],
      },
      {
        id: "node_logs",
        speaker: "High Clerk",
        text: "Bring the logs to Aldric when all four are read; they point toward Grid sickness and transmitted pattern, not feeding.\n\nPeople dislike evidence that makes the obvious answer smaller.\n\nCave charcoal flakes off on the docket like black snow.",
        options: [{ text: "Go back.", next_node_id: "node_1" }],
      },
      {
        id: "node_verdict",
        speaker: "High Clerk",
        text: "The finding clears Lazare of Darro's death and keeps Orin in disciplinary reach.\n\nA correct file is not a kind file, but it is harder to hang a man from.\n\nI have moved the vampire tab aside; the Nessa tab was waiting beneath it.",
        options: [{ text: "Go back.", next_node_id: "node_1" }],
      },
      {
        id: "node_nessa",
        speaker: "High Clerk",
        text: "If Nessa named Mara, follow the cellar thread before deciding what the Witness wanted seen.\n\nA living suspect can be questioned; a dead friend can only be misused or read carefully.\n\nThe custody page has thumb marks where Aldric keeps returning to the same sentence.",
        options: [{ text: "Go back.", next_node_id: "node_1" }],
      },
    ],
  },
  {
    id: "dia_orin_public_square",
    display_name: "Orin in the Market",
    nodes: [
      {
        id: "node_1",
        speaker: "Orin",
        text: "Not here, Intercessor. Not while the square is pretending it has not already chosen Lazare.\n\nFind me at the Glassworks after the crowd breaks. I will answer furnace questions there, not between Dimos's onions and everybody's fear.",
        options: [
          {
            text: "This is a public accusation.",
            condition: {
              all: [
                { not: { switch: "orin_public_accusation_seen" } },
                { not: { switch: "vampire_cleared" } },
              ],
            },
            trigger_cutscene: "cut_orin_public_accusation",
          },
          { text: "I'll find you at the Glassworks." },
        ],
      },
      {
        id: "node_accusation",
        speaker: "Orin",
        text: "Public is the point.\n\nIf the Church can clear a vampire in a private office, the town can at least hear why some of us still have throats tight enough to say his name.\n\nAfterward, glass questions belong near glass.",
        options: [{ text: "Back away." }],
      },
    ],
  },
  {
    id: "dia_orin_public_accusation",
    display_name: "Orin's Public Accusation",
    nodes: [
      {
        id: "node_1",
        speaker: "Scene",
        text: "Orin Vale stands on a crate near Dimos's stall, soot still black beneath his fingernails. Three townsfolk have stopped to listen. None of them stand close enough to be responsible for the listening.",
        scene_image_url: CUTSCENE_ART_ORIN_ACCUSATION,
        options: [{ text: "Listen.", next_node_id: "node_2" }],
      },
      {
        id: "node_2",
        speaker: "Orin",
        text: "You all heard what they found. Animals opened. Darro burned through. Writs on the way before the body was cool.\n\nAnd still we are asked to pretend the shuttered vampire is a neighbor with bad manners.\n\nAsk yourselves who benefits when we doubt the thing our throats already know.",
        scene_image_url: CUTSCENE_ART_ORIN_ACCUSATION,
        options: [{ text: "A townsman speaks up.", next_node_id: "node_3" }],
      },
      {
        id: "node_3",
        speaker: "Townsperson",
        text: "Lazare has a license.",
        scene_image_url: CUTSCENE_ART_ORIN_ACCUSATION,
        options: [{ text: "Orin answers.", next_node_id: "node_4" }],
      },
      {
        id: "node_4",
        speaker: "Orin",
        text: "So does a furnace.\n\nYou do not put a child inside one because the Church stamped the door.\n\nNew Intercessor, ask the records, ask the shutters, ask the old road - but do not ask us to become stupid just because the monster keeps paperwork.",
        scene_image_url: CUTSCENE_ART_ORIN_ACCUSATION,
        options: [{ text: "The crowd breaks apart." }],
      },
    ],
  },
  {
    id: "dia_orin_private_confrontation",
    display_name: "Orin's Offcut",
    nodes: withSceneArt([
      {
        id: "node_1",
        speaker: "Scene",
        text: "Orin hears the cave grit on your boots before you speak. His hands close around a rag that has already been wrung dry.",
        options: [{ text: "The first log names you.", next_node_id: "node_2" }],
      },
      {
        id: "node_2",
        speaker: "Orin",
        text: "It names an initial. It names a sentence. It does not name murder.\n\nI told Darro the offcut was spent because I believed it. Belief is cheaper than testing and I was young enough to buy it.\n\nThe furnace gives men confidence the way candles give shadows permission.",
        options: [{ text: "You accused Lazare to move the heat.", next_node_id: "node_3" }],
      },
      {
        id: "node_3",
        speaker: "Orin",
        text: "I accused Lazare because fear already knew his address.\n\nThat is not a defense. It is just the ugliest true thing I have.\n\nThe shard came back warm in my dreams before anyone told me Darro was dead.",
        options: [{ text: "Aldric records the distinction.", next_node_id: "node_4" }],
      },
      {
        id: "node_4",
        speaker: "Brother Aldric",
        text: "This is material connection, concealment, and panic. It is not yet killing.\n\nStay available, Orin. The Church is often wrong, but it is rarely brief.\n\nIntercessor, mark the offcut and continue to the deeper logs.",
        options: [{ text: "Mark Orin's connection." }],
      },
    ], CUTSCENE_ART_ORIN_GLASSWORKS, "The stained-glass furnace hall of the Alderamontico Glassworks."),
  },
  {
    id: "dia_orin_after_verdict",
    display_name: "Orin After the Finding",
    nodes: withSceneArt([
      {
        id: "node_1",
        speaker: "Orin",
        text: "They took my furnace key. Handling breach. Failure to report. Unlicensed transfer.\n\nNot murder. The distinction should comfort me.\n\nIt does not.",
        options: [{ text: "What will you do?", next_node_id: "node_2" }],
      },
      {
        id: "node_2",
        speaker: "Orin",
        text: "I will stand where they put me and answer when called.\n\nLazare was easier than my own hand; that is the part I cannot polish out.\n\nThe cold furnaces tick all afternoon like teeth deciding whether to speak.",
        options: [{ text: "Leave him with the cold glass." }],
      },
    ], CUTSCENE_ART_ORIN_GLASSWORKS, "The stained-glass furnace hall of the Alderamontico Glassworks."),
  },
  {
    id: "dia_lazare_after_verdict",
    display_name: "Lazare After the Finding",
    nodes: [
      {
        id: "node_1",
        speaker: "Lazare",
        text: "My shutters are open. People keep pretending not to see.\n\nCleared is a Church word. It means the ink has moved on.\n\nThe town cleared me with its teeth clenched; I prefer hatred when it is honest about the jaw.",
        scene_image_url: CUTSCENE_ART_LAZARE_ESTATE,
        scene_image_alt: "Brother Aldric and the Intercessor stand outside Lazare's shuttered estate.",
        options: [{ text: "Does that change anything?", next_node_id: "node_2" }],
      },
      {
        id: "node_2",
        speaker: "Lazare",
        text: "It changes your case, not my nature.\n\nRemember that when the next simple category presents itself with cleaner hands than mine.\n\nTonight the mirrors show bars instead of roads, which means the girl has become the room's new answer.",
        scene_image_url: CUTSCENE_ART_LAZARE_ESTATE,
        scene_image_alt: "Brother Aldric and the Intercessor stand outside Lazare's shuttered estate.",
        options: [{ text: "Step back from the threshold." }],
      },
    ],
  },
  {
    id: "dia_processional_wood_sign",
    display_name: "Old Processional Sign",
    nodes: [
      {
        id: "node_1",
        speaker: "Road Sign",
        text: "Follow the stones south: old wood, glass copse, eastern caves.\n\nThe Church narrowed the road but did not move it, which is an old kind of surrender.\n\nEach marker has seven shallow cuts beneath the newer parish paint.",
        options: [{ text: "Keep to the road." }],
      },
    ],
  },
  {
    id: "dia_tally_animal_clue",
    display_name: "Animal Tally Stone",
    nodes: [
      {
        id: "node_1",
        speaker: "Tally Stone",
        text: "Copy this clue: animals sickened on the old road before anyone named Lazare.\n\nFear picked the easy category because it was already waiting in the ledger.\n\nHoof marks, candle marks, and one child's scratched cross share the same weathered face.",
        options: [{ text: "Record the tally clue.", set_switch: "side_tally_animal_clue" }],
      },
    ],
  },
  {
    id: "dia_glass_copse_trace",
    display_name: "Glass-Touched Trace",
    nodes: [
      {
        id: "node_1",
        speaker: "Glass Trace",
        text: "The shard is small enough to hide in a glove. It gives off no heat your skin understands.\n\nFor one breath you feel calm enough to do something unforgivable neatly.\n\nThis is what Orin meant: Glass can hold a pattern without having a will.",
        options: [{ text: "Mark the warm shard.", set_switch: "found_orin_shard_link" }],
      },
    ],
  },
  {
    id: "dia_glass_copse_exit",
    display_name: "Cave-Mouth Arch",
    nodes: [
      {
        id: "node_1",
        speaker: "Old Arch",
        text: "The cave lies just south; enter only when you are ready to read the logs and fight through.\n\nThe route behind you is short by design, because the case needs proof more than wandering.\n\nGlass roots climb the arch like frost remembering a window.",
        options: [{ text: "Go on." }],
      },
    ],
  },
  {
    id: "dia_act1_end",
    display_name: "Act I: The Witness Opens",
    nodes: [
      {
        id: "node_1",
        speaker: "Case Note",
        text: "Act I finding: Darro Keel died from Grid sickness after Glass exposure, not vampire feeding. Lazare is dangerous, but not the cave killer.\n\nOrin Vale supplied the shard. He knew what it was.",
        options: [{ text: "And the Witness?", next_node_id: "node_2" }],
      },
      {
        id: "node_2",
        speaker: "Brother Aldric",
        text: "Still bleeding. The rite at the statue, Nessa's candles, Mara's prayer — none of that dies quietly just because we closed Darro's file.\n\nBut that is tomorrow's thread.",
        options: [{ text: "Then tonight we rest.", next_node_id: "node_3" }],
      },
      {
        id: "node_3",
        speaker: "Scene",
        text: "Above the town the Witness bleeds on in the dark, indifferent to verdicts. Somewhere under the Counted Cup, seven knocks sound in the floor, then silence, then seven again.\n\nYou do not go down tonight.",
        options: [{ text: "— End of Act I —" }],
      },
    ],
  },

  // ——— Ambient scenes (cutscene-driven) ———
  {
    id: "dia_rhyme",
    display_name: "The Counting Rhyme",
    nodes: [
      {
        id: "node_1",
        speaker: "Scene",
        text: "Children's voices from between the rowhouses, the sing-song of a skipping game: 'One for the river, two for the stone, three for the candle that counts you home — four went up and the four were SEEN —' A door opens. The rhyme stops mid-number, the way rhymes do when an adult comes near. You never hear what five was for.",
        options: [{ text: "Walk on.", next_node_id: "node_2" }],
      },
      {
        id: "node_2",
        speaker: "Brother Aldric",
        text: "They had that rhyme when Nessa was small. It had different numbers then.",
        options: [{ text: "Different how, Aldric?" , next_node_id: "node_3"}],
      },
      {
        id: "node_3",
        speaker: "Brother Aldric",
        text: "Smaller.",
        options: [{ text: "(Say nothing.)" }],
      },
    ],
  },
  {
    id: "dia_first_sight",
    display_name: "First Sight of the Cordon",
    nodes: [
      {
        id: "node_1",
        speaker: "Scene",
        text: "The stairs lift you out of the town's noise all at once. Above the next terrace the Witness stands against the black stars with its fence line and its single guard — and from here you can finally see that the dark on its face is not weathering. It moves. Slowly, the way honey moves, the way it has moved every night since the rite.",
        options: [{ text: "It's still bleeding.", next_node_id: "node_2" }],
      },
      {
        id: "node_2",
        speaker: "Brother Aldric",
        text: "Every night, since. The Church calls the cordon procedural mercy. I have begun to wonder which of the two parties the mercy is for.",
        options: [{ text: "Climb on." }],
      },
    ],
  },
  {
    id: "dia_funeral",
    display_name: "The Funeral Shrine",
    nodes: [
      {
        id: "node_1",
        speaker: "Scene",
        text: "A small altar off the walk, ringed by stone votaries with their faces worn smooth. Seven candle stubs stand in a row, and three fresh ones, and a child's wooden horse with its forelegs wrapped in cloth — carefully, the way you would bandage something that could feel it. This is where the town keeps the grief the doctrine has no word for.",
        options: [{ text: "Stand a moment, then go." }],
      },
    ],
  },
  {
    id: "dia_cellar",
    display_name: "The Sealed Cellar",
    nodes: [
      {
        id: "node_1",
        speaker: "Scene",
        text: "Behind the inn's back room, a trapdoor under a worn rug that was not quite straight. The wood is older than the inn above it, and across the seam runs a band of church lead stamped with the dark-lights seal — renewed, by the shine of it, within the year. From below, faint as a pulse in the floorboards: seven knocks. A pause. Seven knocks.",
        options: [{ text: "Press your palm flat to the wood.", next_node_id: "node_2" }],
      },
      {
        id: "node_2",
        speaker: "Brother Aldric",
        text: "So. Under the oldest roof, exactly as she said. I will draft the second writ tonight, and may the clerks forgive the hour. We have found where the town learned to pray, Intercessor — and something down there is still keeping the count.",
        options: [
          {
            text: "Then this is where we go beneath.",
            trigger_quest: "quest_investigate",
            trigger_quest_state: "the_under",
          },
        ],
      },
    ],
  },
  {
    id: "dia_maras_basement",
    display_name: "The Rite Circle",
    nodes: [
      {
        id: "node_1",
        speaker: "Scene",
        text: "The basement is hollowed out, damp earth giving way to older masonry. A circle is scored into the floor, not painted but burned, the stone vitrified at the edges. In the center, half-buried in cold ash, lies the torn half of a ledger page.",
        options: [{ text: "Read it.", next_node_id: "node_2" }],
      },
      {
        id: "node_2",
        speaker: "Brother Aldric",
        text: "Aldric's breath catches. — \"The hand is Mara's. The doctrine is... it is the under-rite. Unredacted. This is what Nessa was reciting on the terrace.\"",
        options: [{ text: "Then take it.", next_node_id: "node_3" }],
      },
      {
        id: "node_3",
        speaker: "Brother Aldric",
        text: "He reaches for the parchment, but stops. The shadows against the far wall have detached themselves. They are not walking toward you; they are dripping upward from the stone.",
        options: [
          {
            text: "Draw steel.",
            trigger_quest: "quest_investigate",
            trigger_quest_state: "the_circle",
          },
        ],
      },
    ],
  },
  {
    id: "dia_trapdoor_sealed",
    display_name: "The Sealed Cellar",
    nodes: [
      {
        id: "node_1",
        speaker: "Brother Aldric",
        text: "Church wax over the hinge, stamped twice. Someone above my grade sealed this cellar and did not log why. Until the writ names the under-town, Intercessor, this stays a floor. Get the briefing first — then we pry.",
        options: [{ text: "Step back from the trapdoor." }],
      },
    ],
  },
  {
    id: "dia_first_descent",
    display_name: "The First Descent",
    nodes: [
      {
        id: "node_1",
        speaker: "Scene",
        text: "The ladder ends on marble. Not cellar stone — dressed marble, processional width, running down into the dark in both directions like a road that never heard of the surface. Somewhere ahead, water. Somewhere ahead, wax.",
        options: [{ text: "Look to Aldric.", next_node_id: "node_2" }],
      },
      {
        id: "node_2",
        speaker: "Brother Aldric",
        text: "Every house keeps a second house under it. I have buried people in this town for twenty years, Intercessor. I laid them in the ground believing the ground was empty. Stay close. The dead were the only ones being honest with me.",
        options: [{ text: "Move out.", next_node_id: null }],
      },
    ],
  },
  {
    id: "dia_cyberghost_network",
    display_name: "The Wisp Over the Water",
    nodes: [
      {
        id: "node_1",
        speaker: "Scene",
        text: "A wisp of star-glass hangs above the drowned shrine, turning slowly, the way a sleeper turns. It does not acknowledge you. It does not acknowledge anything — except, twice a breath, the water below it.",
        options: [
          {
            text: "Speak to it.",
            next_node_id: "node_static",
          },
          {
            text: "Listen the way you were taught not to. (Mystic)",
            condition: { switch: "class_mystic" },
            next_node_id: "node_mystic",
          },
          { text: "Leave it be." },
        ],
      },
      {
        id: "node_static",
        speaker: "Cyberghost",
        text: "The wisp brightens at your voice and produces sound the way a struck bell produces light — that is to say, wrongly, and not for you. Whatever it is saying, it has been saying it for a long time, to someone who is not here.",
        options: [{ text: "Step away.", next_node_id: null }],
      },
      {
        id: "node_mystic",
        speaker: "Cyberghost",
        text: "…counted us. seven candles, seven names, the willing one wrote it TWICE — once for the circle, once for the bones. the second page sleeps with the bones, eastward, where the families stack their dead like firewood. she wanted someone to find it. she wanted—",
        options: [
          {
            text: "(It loops. The willing one wrote twice — the second page is with the bones, east.)",
            set_switch: "heard_cyberghost_network",
            next_node_id: null,
          },
        ],
      },
    ],
  },
];

// ── Cutscenes ───────────────────────────────────────────────────────────────

export const FD_CUTSCENES: CutsceneData[] = [
  {
    id: "cut_arrival",
    display_name: "Arrival at the Gate",
    is_blocking: true,
    actions: [
      { type: "play_music", music_url: "/music/l-ombre-des-bles.mp3" },
      { type: "screen_fade", fade: "out", duration: 0 },
      { type: "move_entity", entity_id: "ent_aldric", cell: [1, -12], facing: [0, 1] },
      { type: "screen_fade", fade: "in", duration: 1500 },
      // The opening atlas shot: exile-road gate, scriptorium, temple road.
      { type: "camera_pan", cell: [0, -18], duration: 1300 },
      { type: "camera_pan", cell: [15, -14], duration: 1300 },
      { type: "camera_pan", cell: [18, 0], duration: 1800 },
      { type: "wait", duration: 700 },
      { type: "camera_pan", duration: 1800 },
      { type: "show_dialogue", dialogue_id: "dia_opening_ceremony" },
      // Class oath.
      { type: "branch", condition: { switch: "class_scholar" }, target_label: "lbl_scholar" },
      { type: "branch", condition: { switch: "class_warrior" }, target_label: "lbl_warrior" },
      { type: "branch", condition: { switch: "class_mystic" }, target_label: "lbl_mystic" },
      { type: "branch", target_label: "lbl_sworn" },
      { type: "label", label: "lbl_scholar" },
      { type: "modify_player_stats", stats: { max_mp: 6, max_hp: -4 } },
      { type: "learn_skill", skill_id: "skl_sacred_line" },
      { type: "learn_skill", skill_id: "skl_candle_mend" },
      { type: "branch", target_label: "lbl_sworn" },
      { type: "label", label: "lbl_warrior" },
      { type: "modify_player_stats", stats: { max_hp: 6, attack: 2, max_mp: -6 } },
      { type: "learn_skill", skill_id: "skl_cleave" },
      { type: "branch", target_label: "lbl_sworn" },
      { type: "label", label: "lbl_mystic" },
      { type: "modify_player_stats", stats: { max_mp: 4, speed: 2, attack: -1 } },
      { type: "learn_skill", skill_id: "skl_witness_flame" },
      { type: "learn_skill", skill_id: "skl_still_echo" },
      { type: "label", label: "lbl_sworn" },
      { type: "learn_skill", skill_id: "skl_investigate" },
      { type: "add_party_member", entity_id: "ent_aldric" },
      { type: "set_switch", switch_id: "opening_ceremony_complete", switch_value: true },
      { type: "set_switch", switch_id: "aldric_joined", switch_value: true },
    ],
  },
  {
    id: "cut_office_briefing",
    display_name: "The Scriptorium Briefing",
    is_blocking: true,
    actions: [
      { type: "set_switch", switch_id: "office_briefed", switch_value: true },
      // The writ is the key that unseals the cellar trapdoor (Scene 4).
      { type: "set_switch", switch_id: "act1_assigned", switch_value: true },
      { type: "camera_pan", cell: [15, -14], duration: 900 },
      { type: "read_document", document_id: "doc_writ" },
      { type: "show_dialogue", dialogue_id: "dia_office_briefing" },
      { type: "read_document", document_id: "doc_field_note" },
      { type: "branch", condition: { switch: "orin_public_accusation_seen" }, target_label: "lbl_accusation_done" },
      { type: "camera_pan", cell: [-4, 7], duration: 900 },
      { type: "set_switch", switch_id: "orin_public_accusation_seen", switch_value: true },
      { type: "show_dialogue", dialogue_id: "dia_orin_public_accusation" },
      { type: "set_entity_hidden", entity_id: "ent_orin_public", hidden: true },
      { type: "label", label: "lbl_accusation_done" },
      { type: "camera_pan", duration: 700 },
    ],
  },
  {
    id: "cut_gaol_entry",
    display_name: "The Warden's Threshold",
    is_blocking: true,
    actions: [
      { type: "set_switch", switch_id: "gaol_entered", switch_value: true },
      { type: "camera_pan", cell: [24, 22], duration: 900 },
      { type: "show_dialogue", dialogue_id: "dia_gaol_entry_scene" },
      { type: "camera_pan", duration: 700 },
    ],
  },
  {
    id: "cut_children_rhyme",
    display_name: "The Counting Rhyme",
    is_blocking: true,
    actions: [
      { type: "set_switch", switch_id: "heard_rhyme", switch_value: true },
      { type: "show_dialogue", dialogue_id: "dia_rhyme" },
    ],
  },
  {
    id: "cut_first_sight",
    display_name: "First Sight of the Cordon",
    is_blocking: true,
    actions: [
      { type: "set_switch", switch_id: "seen_cordon", switch_value: true },
      { type: "camera_pan", cell: [0, 0], duration: 1600 },
      { type: "show_dialogue", dialogue_id: "dia_first_sight" },
      { type: "camera_pan", duration: 1400 },
    ],
  },
  {
    id: "cut_funeral_shrine",
    display_name: "The Funeral Shrine",
    is_blocking: true,
    actions: [
      { type: "set_switch", switch_id: "seen_funeral", switch_value: true },
      { type: "camera_pan", cell: [-20, 26], duration: 900 },
      { type: "show_dialogue", dialogue_id: "dia_funeral" },
      { type: "camera_pan", duration: 700 },
    ],
  },
  {
    id: "cut_cellar_seal",
    display_name: "The Sealed Cellar",
    is_blocking: true,
    actions: [
      { type: "set_switch", switch_id: "seen_cellar", switch_value: true },
      { type: "camera_pan", cell: [-12, 13], duration: 900 },
      { type: "show_dialogue", dialogue_id: "dia_cellar" },
      { type: "camera_pan", duration: 700 },
    ],
  },
  {
    id: "cut_give_votive",
    display_name: "A Votive Given",
    is_blocking: true,
    actions: [
      { type: "remove_item", item_id: "itm_votive", amount: 1 },
      { type: "set_switch", switch_id: "gave_votive", switch_value: true },
      { type: "adjust_faction_rep", faction_id: "town", amount: 5 },
      { type: "show_dialogue", dialogue_id: "dia_mother", node_id: "node_thanks" },
    ],
  },
  {
    id: "cut_read_ledger",
    display_name: "The Warden's Ledger",
    is_blocking: true,
    actions: [
      { type: "set_switch", switch_id: "read_ledger", switch_value: true },
      { type: "read_document", document_id: "doc_gaol_ledger" },
    ],
  },
  {
    id: "cut_read_orders",
    display_name: "The Standing Orders",
    is_blocking: true,
    actions: [
      { type: "set_switch", switch_id: "read_orders", switch_value: true },
      { type: "read_document", document_id: "doc_standing_orders" },
    ],
  },
  {
    id: "cut_record_dimos",
    display_name: "Dimos's Testimony",
    is_blocking: false,
    actions: [
      { type: "set_switch", switch_id: "testimony_dimos", switch_value: true },
      { type: "branch", condition: { all: [{ switch: "testimony_orin" }, { switch: "testimony_marta" }, { switch: "testimony_holt" }] }, target_label: "lbl_all_testimony" },
      { type: "branch", target_label: "lbl_done" },
      { type: "label", label: "lbl_all_testimony" },
      { type: "set_switch", switch_id: "testimonies_gathered", switch_value: true },
      { type: "label", label: "lbl_done" },
    ],
  },
  {
    id: "cut_record_orin",
    display_name: "Orin's Testimony",
    is_blocking: false,
    actions: [
      { type: "set_switch", switch_id: "testimony_orin", switch_value: true },
      { type: "branch", condition: { all: [{ switch: "testimony_dimos" }, { switch: "testimony_marta" }, { switch: "testimony_holt" }] }, target_label: "lbl_all_testimony" },
      { type: "branch", target_label: "lbl_done" },
      { type: "label", label: "lbl_all_testimony" },
      { type: "set_switch", switch_id: "testimonies_gathered", switch_value: true },
      { type: "label", label: "lbl_done" },
    ],
  },
  {
    id: "cut_record_marta",
    display_name: "Marta's Testimony",
    is_blocking: false,
    actions: [
      { type: "set_switch", switch_id: "testimony_marta", switch_value: true },
      { type: "branch", condition: { all: [{ switch: "testimony_dimos" }, { switch: "testimony_orin" }, { switch: "testimony_holt" }] }, target_label: "lbl_all_testimony" },
      { type: "branch", target_label: "lbl_done" },
      { type: "label", label: "lbl_all_testimony" },
      { type: "set_switch", switch_id: "testimonies_gathered", switch_value: true },
      { type: "label", label: "lbl_done" },
    ],
  },
  {
    id: "cut_record_holt",
    display_name: "Holt's Gate Tally",
    is_blocking: false,
    actions: [
      { type: "set_switch", switch_id: "testimony_holt", switch_value: true },
      { type: "branch", condition: { all: [{ switch: "testimony_dimos" }, { switch: "testimony_orin" }, { switch: "testimony_marta" }] }, target_label: "lbl_all_testimony" },
      { type: "branch", target_label: "lbl_done" },
      { type: "label", label: "lbl_all_testimony" },
      { type: "set_switch", switch_id: "testimonies_gathered", switch_value: true },
      { type: "label", label: "lbl_done" },
    ],
  },
  {
    id: "cut_read_family_rites",
    display_name: "Dusty Ledger",
    is_blocking: true,
    actions: [
      { type: "read_document", document_id: "doc_family_rites" },
    ],
  },
  {
    id: "cut_read_fen_votive_count",
    display_name: "Fen Votive Count",
    is_blocking: true,
    actions: [
      { type: "read_document", document_id: "doc_fen_votive_count" },
    ],
  },
  {
    id: "cut_open_shop",
    display_name: "Open Shop",
    is_blocking: true,
    actions: [{ type: "open_shop", shop_id: "shop_town" }],
  },
  {
    id: "cut_save",
    display_name: "Candle Prayer",
    is_blocking: true,
    actions: [
      { type: "heal_player", amount: 99 },
      { type: "open_save_menu" },
    ],
  },
  {
    id: "cut_orin_public_accusation",
    display_name: "The Market Accusation",
    is_blocking: true,
    actions: [
      { type: "set_switch", switch_id: "orin_public_accusation_seen", switch_value: true },
      { type: "camera_pan", cell: [-4, 7], duration: 900 },
      { type: "show_dialogue", dialogue_id: "dia_orin_public_accusation" },
      { type: "set_entity_hidden", entity_id: "ent_orin_public", hidden: true },
      { type: "camera_pan", duration: 700 },
    ],
  },
  {
    id: "cut_orin_private_confrontation",
    display_name: "Orin's Offcut",
    is_blocking: true,
    actions: [
      { type: "camera_pan", cell: [-8, 22], duration: 900 },
      { type: "show_dialogue", dialogue_id: "dia_orin_private_confrontation" },
      { type: "set_switch", switch_id: "orin_private_questioned", switch_value: true },
      { type: "set_switch", switch_id: "orin_pressure_1", switch_value: true },
      { type: "set_switch", switch_id: "found_orin_shard_link", switch_value: true },
      { type: "camera_pan", duration: 700 },
    ],
  },
  {
    id: "cut_orin_after_verdict",
    display_name: "Orin After the Finding",
    is_blocking: true,
    actions: [
      { type: "set_switch", switch_id: "orin_after_verdict_seen", switch_value: true },
      { type: "camera_pan", cell: [-8, 22], duration: 900 },
      { type: "show_dialogue", dialogue_id: "dia_orin_after_verdict" },
      { type: "camera_pan", duration: 700 },
    ],
  },
  {
    id: "cut_lazare_after_verdict",
    display_name: "Lazare After the Finding",
    is_blocking: true,
    actions: [
      { type: "set_switch", switch_id: "lazare_after_verdict_seen", switch_value: true },
      { type: "camera_pan", cell: [0, -30], duration: 900 },
      { type: "show_dialogue", dialogue_id: "dia_lazare_after_verdict" },
      { type: "camera_pan", duration: 700 },
    ],
  },
  {
    id: "cut_maras_basement",
    display_name: "The Rite Circle",
    is_blocking: true,
    actions: [
      { type: "camera_pan", cell: [-14, 12], duration: 1500 },
      { type: "show_dialogue", dialogue_id: "dia_maras_basement" },
      { type: "give_item", item_id: "itm_rite_fragment_1", amount: 1 },
      { type: "set_switch", switch_id: "act1_rite_text", switch_value: true },
      { type: "camera_pan", duration: 1000 },
    ],
  },
  {
    id: "cut_office_after",
    display_name: "The Scriptorium Return",
    is_blocking: true,
    actions: [
      { type: "set_switch", switch_id: "cyberghost_defeated", switch_value: true },
      { type: "set_switch", switch_id: "vampire_cleared", switch_value: true },
      { type: "set_switch", switch_id: "orin_disciplined", switch_value: true },
      { type: "set_switch", switch_id: "nessa_thread_started", switch_value: true },
      { type: "camera_pan", cell: [15, -14], duration: 900 },
      { type: "show_dialogue", dialogue_id: "dia_office_after" },
      { type: "camera_pan", duration: 700 },
    ],
  },
  {
    id: "cut_act1_end",
    display_name: "Act I: The Witness Opens",
    is_blocking: true,
    actions: [
      { type: "set_switch", switch_id: "act1_complete", switch_value: true },
      { type: "set_switch", switch_id: "act1_end_seen", switch_value: true },
      { type: "show_dialogue", dialogue_id: "dia_act1_end" },
      { type: "screen_fade", duration: 1200 },
      { type: "game_end" },
    ],
  },
  {
    id: "cut_network_upper_enter",
    display_name: "The Pagan Network",
    is_blocking: false,
    actions: [
      { type: "play_music", music_url: "/music/Pagan Network.wav" },
    ],
  },
  {
    id: "cut_depths_enter",
    display_name: "The Depths",
    is_blocking: false,
    actions: [
      { type: "play_music", music_url: "/music/Pagan Network.wav" },
    ],
  },
  {
    id: "cut_town_music",
    display_name: "Town Theme",
    is_blocking: false,
    actions: [
      { type: "play_music", music_url: "/music/l-ombre-des-bles.mp3" },
    ],
  },
  {
    id: "cut_river_music",
    display_name: "River Theme",
    is_blocking: false,
    actions: [
      { type: "play_music", music_url: "/music/River.wav" },
    ],
  },
  // ── Scene 4: the trapdoor ──────────────────────────────────────────────────
  {
    id: "cut_trapdoor_locked",
    display_name: "The Sealed Cellar",
    is_blocking: true,
    actions: [
      { type: "camera_pan", cell: [-12, 13], duration: 800 },
      { type: "show_dialogue", dialogue_id: "dia_trapdoor_sealed" },
      { type: "camera_pan", duration: 600 },
    ],
  },
  {
    id: "cut_trapdoor_enter",
    display_name: "The First Descent",
    is_blocking: true,
    actions: [
      { type: "screen_fade", fade: "out", duration: 700 },
      {
        type: "teleport_player",
        map_id: "map_network_upper",
        cell: [0, -17],
        facing: [0, 1],
      },
      { type: "play_music", music_url: "/music/Pagan Network.wav" },
      { type: "screen_fade", fade: "in", duration: 1100 },
      // Aldric's line plays only on the very first descent.
      {
        type: "branch",
        condition: { switch: "first_descent_done" },
        target_label: "lbl_descended",
      },
      { type: "show_dialogue", dialogue_id: "dia_first_descent" },
      { type: "set_switch", switch_id: "first_descent_done", switch_value: true },
      { type: "label", label: "lbl_descended" },
    ],
  },
  // ── The rite circle in Mara's basement stays readable after the fight ─────
  {
    id: "cut_rite_circle",
    display_name: "The Scored Circle",
    is_blocking: true,
    actions: [{ type: "read_document", document_id: "doc_rite_fragment_1" }],
  },
  // ── The second leaf, hidden with the ossuary dead (Crypt Chapel) ──────────
  {
    id: "cut_crypt_fragment",
    display_name: "The Second Leaf",
    is_blocking: true,
    actions: [
      { type: "read_document", document_id: "doc_rite_fragment_2" },
      { type: "give_item", item_id: "itm_rite_fragment_2", amount: 1 },
      { type: "set_switch", switch_id: "found_second_leaf", switch_value: true },
    ],
  },
  // ══════════════════════════════════════════════════════════════════════════
  // ACT 1 ATLAS: Gate blocks, cave transitions, boss, logs
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: "cut_gate_blocked_briefing",
    display_name: "The Scriptorium First",
    is_blocking: true,
    actions: [
      { type: "show_dialogue", dialogue_id: "dia_gate_blocked_briefing" },
    ],
  },
  {
    id: "cut_gate_blocked_cave",
    display_name: "Not Yet Ready",
    is_blocking: true,
    actions: [
      { type: "show_dialogue", dialogue_id: "dia_gate_blocked_cave" },
      { type: "teleport_player", map_id: "map_residential", cell: [0, 17], facing: [0, -1] },
    ],
  },
  {
    id: "cut_gate_blocked_deep",
    display_name: "The Sigil Seal",
    is_blocking: true,
    actions: [
      { type: "show_dialogue", dialogue_id: "dia_gate_blocked_deep" },
    ],
  },
  {
    id: "cut_gate_blocked_prison",
    display_name: "No Admittance",
    is_blocking: true,
    actions: [
      { type: "show_dialogue", dialogue_id: "dia_gate_blocked_prison" },
    ],
  },
  {
    id: "cut_gate_blocked_mouthstone",
    display_name: "The Road Beyond",
    is_blocking: true,
    actions: [
      { type: "show_dialogue", dialogue_id: "dia_gate_blocked_mouthstone" },
    ],
  },
  {
    id: "cut_gate_blocked_glassworks",
    display_name: "Glassworks Road Held",
    is_blocking: true,
    actions: [
      { type: "show_dialogue", dialogue_id: "dia_gate_blocked_glassworks" },
    ],
  },
  {
    id: "cut_gate_blocked_shrine",
    display_name: "Old Marks",
    is_blocking: true,
    actions: [
      { type: "show_dialogue", dialogue_id: "dia_gate_blocked_shrine" },
    ],
  },
  // ── Cave transitions ──
  {
    id: "cut_cave_descent",
    display_name: "Into the Eastern Caves",
    is_blocking: true,
    actions: [
      { type: "screen_fade", fade: "out", duration: 800 },
      { type: "teleport_player", map_id: "map_cave_upper", cell: [0, -39], facing: [0, 1] },
      { type: "play_music", music_url: "/music/Pagan Network.wav" },
      { type: "screen_fade", fade: "in", duration: 1100 },
    ],
  },
  {
    id: "cut_cave_return",
    display_name: "Back to the Surface",
    is_blocking: true,
    actions: [
      { type: "screen_fade", fade: "out", duration: 800 },
      { type: "teleport_player", map_id: "map_residential", cell: [0, 19], facing: [0, -1] },
      { type: "play_music", music_url: "/music/l-ombre-des-bles.mp3" },
      { type: "screen_fade", fade: "in", duration: 1100 },
    ],
  },
  // ── Boss intro ──
  {
    id: "cut_boss_intro",
    display_name: "The Grid-Sick",
    is_blocking: true,
    actions: [
      { type: "set_switch", switch_id: "boss_intro_seen", switch_value: true },
      { type: "screen_fade", fade: "out", duration: 600 },
      { type: "camera_pan", cell: [0, 6], duration: 1200 },
      { type: "screen_fade", fade: "in", duration: 800 },
      { type: "show_dialogue", dialogue_id: "dia_boss_intro" },
      { type: "camera_pan", duration: 800 },
    ],
  },
  // ── Grid sickness log readers ──
  {
    id: "cut_read_log_1",
    display_name: "Scratched Wall — First",
    is_blocking: true,
    actions: [
      { type: "read_document", document_id: "doc_grid_log_1" },
      { type: "set_switch", switch_id: "found_log_1", switch_value: true },
      { type: "set_switch", switch_id: "found_orin_shard_link", switch_value: true },
      { type: "set_switch", switch_id: "found_darro_name", switch_value: true },
    ],
  },
  {
    id: "cut_read_log_2",
    display_name: "Scratched Wall — Second",
    is_blocking: true,
    actions: [
      { type: "read_document", document_id: "doc_grid_log_2" },
      { type: "set_switch", switch_id: "found_log_2", switch_value: true },
    ],
  },
  {
    id: "cut_read_log_3",
    display_name: "Scratched Wall — Third",
    is_blocking: true,
    actions: [
      { type: "read_document", document_id: "doc_grid_log_3" },
      { type: "set_switch", switch_id: "found_log_3", switch_value: true },
      { type: "set_switch", switch_id: "found_mara_name", switch_value: true },
    ],
  },
  {
    id: "cut_read_log_4",
    display_name: "Scratched Wall — Final",
    is_blocking: true,
    actions: [
      { type: "read_document", document_id: "doc_grid_log_4" },
      { type: "set_switch", switch_id: "found_log_4", switch_value: true },
    ],
  },
];

// The office briefing's conversation, kept separate for length.
FD_DIALOGUE.push({
  id: "dia_office_briefing",
  display_name: "The Scriptorium Briefing",
  nodes: [
    {
      id: "node_1",
      speaker: "Scene",
      text: "Aldric shuts the scriptorium door with his heel. On the table: a cave report, Lazare's license, Holt's gate slate, a Glassworks handling slip, and a witness list weighted down with a reliquary.",
      scene_image_url: CUTSCENE_ART_ALDRIC_OFFICE,
      options: [{ text: "Walk me through it.", next_node_id: "node_2" }],
    },
    {
      id: "node_2",
      speaker: "Brother Aldric",
      text: "Victim: Darro Keel. Local laborer, occasional cellar-hand, not Church-taught but not unknown to Church records.\n\nFound in the eastern cave with Glass stress through the ribs and palms. Animals around him were not eaten. They were arranged.\n\nThat distinction is why we are still talking.",
      scene_image_url: CUTSCENE_ART_ALDRIC_OFFICE,
      options: [
        { text: "Why is Lazare the suspect?", next_node_id: "node_3" },
        { text: "Why is Orin in the file?", next_node_id: "node_orin" },
      ],
    },
    {
      id: "node_3",
      speaker: "Brother Aldric",
      text: "Because Lazare is a vampire and the town's imagination is efficient.\n\nHe is licensed, shuttered, and watched. Holt says he has not crossed the tally in years. But fear does not need a door to enter a room.\n\nWe test him because he is dangerous; we do not convict him because danger is convenient.",
      scene_image_url: CUTSCENE_ART_ALDRIC_OFFICE,
      options: [
        { text: "Who do we question?", next_node_id: "node_4" },
      ],
    },
    {
      id: "node_orin",
      speaker: "Brother Aldric",
      text: "Orin Vale works the Glassworks edge. He knew Darro. He handled shard offcuts. He is also the loudest person accusing Lazare.\n\nA man may be correct loudly. He may also be hiding in the noise.\n\nThat is why he is witness and suspect both.",
      scene_image_url: CUTSCENE_ART_ALDRIC_OFFICE,
      options: [
        { text: "Who do we question?", next_node_id: "node_4" },
      ],
    },
    {
      id: "node_4",
      speaker: "Brother Aldric",
      text: "Record Dimos at the market, Marta at the lower graves, Holt at the gate, and Orin wherever his conscience has staged itself. Then speak to Lazare.\n\nThe cave comes after the living contradict each other.\n\nI have pinned the order on the Case Board because fright makes people forget sequence.",
      scene_image_url: CUTSCENE_ART_ALDRIC_OFFICE,
      options: [
        {
          text: "Take the cave writ.",
          trigger_quest: "quest_vampire",
          trigger_quest_state: "briefed",
        },
      ],
    },
  ],
});

FD_DIALOGUE.push({
  id: "dia_office_after",
  display_name: "The Cave Finding",
  nodes: [
    {
      id: "node_1",
      speaker: "Scene",
      text: "Aldric clears the table with one arm. 'Put the logs down. All of them. In order.' Darro Keel's wall-scraps, Holt's slate copy, Orin's handling note, and Lazare's untouched gate record become one file.",
      scene_image_url: CUTSCENE_ART_ALDRIC_OFFICE,
      options: [{ text: "Read the finding.", next_node_id: "node_2" }],
    },
    {
      id: "node_2",
      speaker: "Brother Aldric",
      text: "Darro Keel handled a Glassworks offcut supplied by Orin Vale. Darro used it repeatedly in the eastern cave under old rite conditions.\n\nHis behavior became compulsive, patterned, and self-recording. The animal deaths were not feeding.\n\nLazare Behind the Shutters did not kill him.",
      scene_image_url: CUTSCENE_ART_ALDRIC_OFFICE,
      options: [
        {
          text: "So Lazare is innocent.",
          next_node_id: "node_lazare_clear"
        },
        {
          text: "Orin killed him.",
          next_node_id: "node_orin_clear"
        },
        {
          text: "The logs mention Mara and the Witness.",
          condition: { any: [{ switch: "found_log_3" }, { switch: "found_log_4" }] },
          next_node_id: "node_nessa_hook"
        },
      ],
    },
    {
      id: "node_lazare_clear",
      speaker: "Brother Aldric",
      text: "Of murder in this case. Say only what the finding can bear.\n\nLazare remains dangerous. He is not responsible for Darro Keel's death.\n\nThe distinction is narrow enough to cut anyone who handles it carelessly.",
      scene_image_url: CUTSCENE_ART_ALDRIC_OFFICE,
      options: [{ text: "Continue the finding.", next_node_id: "node_nessa_hook" }],
    },
    {
      id: "node_orin_clear",
      speaker: "Brother Aldric",
      text: "No. Orin supplied danger, concealed it, and tried to survive the consequence by naming another.\n\nThat is negligence, cowardice, and breach of handling. It is not murder.\n\nThe Church can discipline Orin. It cannot pretend discipline is the same thing as truth.",
      scene_image_url: CUTSCENE_ART_ALDRIC_OFFICE,
      options: [{ text: "Continue the finding.", next_node_id: "node_nessa_hook" }],
    },
    {
      id: "node_nessa_hook",
      speaker: "Brother Aldric",
      text: "I will clear Lazare. I will mark Orin for Glassworks discipline and Church handling. I will enter Darro as Grid-sick deceased, unresolved remnant dispersed.\n\nMara Vey is named in the cave. Mara Vey is also named in Nessa's docket.\n\nThe vampire case is closed. The Witness case is not.",
      scene_image_url: CUTSCENE_ART_ALDRIC_OFFICE,
      options: [
        {
          text: "Open the Nessa thread.",
          trigger_quest: "quest_vampire",
          trigger_quest_state: "cleared",
        },
      ],
    },
    {
      id: "node_clear_only",
      speaker: "Brother Aldric",
      text: "The record clears Lazare and disciplines Orin, but the wider pattern remains.\n\nBecause the town was wrong loudly, it may be wrong quietly elsewhere.\n\nI have another file I wanted clean; it is not clean, and the name on it is Nessa.",
      scene_image_url: CUTSCENE_ART_ALDRIC_OFFICE,
      options: [
        {
          text: "Open the Nessa thread.",
          trigger_quest: "quest_vampire",
          trigger_quest_state: "cleared",
        },
      ],
    },
  ],
});

// ── Quests, documents, items, shops ─────────────────────────────────────────

export const FD_QUESTS: QuestData[] = [
  {
    id: "quest_investigate",
    display_name: "The Witness Investigation",
    description:
      "Procedural mercy: inquire into the rite at the Witness of the Dark Lights before Acolyte Nessa's sentence is sealed.",
    objectives: [
      { id: "obj_1", description: "Take Aldric's briefing at the scriptorium", type: "talk", target_id: "ent_aldric", count: 1 },
      { id: "obj_2", description: "Hear Nessa at the bars", type: "talk", target_id: "ent_nessa", count: 1 },
      { id: "obj_3", description: "Find where the town learned to pray", type: "explore", target_id: "cellar", count: 1 },
    ],
  },
  {
    id: "quest_vampire",
    display_name: "The Shuttered Hunger",
    description:
      "Darro Keel is dead in the eastern caves. The town says vampire. Orin says it loudly. The Church says investigate.",
    objectives: [
      { id: "obj_briefing", description: "Report to Aldric at the Scriptorium", type: "talk", target_id: "ent_aldric", count: 1 },
      { id: "obj_testimony", description: "Gather testimony from Dimos, Marta, Holt, and Orin", type: "talk", target_id: "ent_merchant", count: 4 },
      { id: "obj_lazare", description: "Knock at Lazare's shuttered front door", type: "talk", target_id: "dia_lazare_vampire", count: 1 },
      { id: "obj_cave", description: "Follow the Old Processional Wood and Glass-Touched Copse to the eastern caves", type: "explore", target_id: "cave", count: 1 },
      { id: "obj_boss", description: "Confront what remains in the deep", type: "explore", target_id: "deep_cave", count: 1 },
      { id: "obj_verdict", description: "Present evidence to Aldric", type: "talk", target_id: "ent_aldric", count: 1 },
    ],
  },
];

export const FD_DOCUMENTS: DocumentData[] = [
  {
    id: "doc_writ",
    display_name: "Writ of Procedural Mercy",
    content:
      "WRIT OF LOCAL INQUIRY\n\nSubject: Death of Darro Keel.\n\nSuspected categories:\n- predatory irregularity,\n- unauthorized Glass exposure,\n- under-rite consequence,\n- unlawful concealment.\n\nAssigned:\nBrother Aldric.\nNewly sworn Intercessor.\n\nInstruction:\nrecord before judgment.\ncontain before proclamation.\n\nSuspicion is not proof.",
  },
  {
    id: "doc_field_note",
    display_name: "Aldric's Field Note",
    content:
      "Private hand, before the docket:\n\nI asked that the new Intercessor be assigned because I trust them. We studied border cases together before either of us had a title worth envying. If this must be done inside the Church's procedure, I would rather stand beside an old friend than another clerk with clean gloves.\n\nLazare is dangerous, but danger is not guilt. I need the town reminded of that before I ask it to look at a harder prisoner.",
  },
  {
    id: "doc_gaol_ledger",
    display_name: "The Warden's Ledger",
    content:
      "Hall of Custody — intake and watch log, the night of the rite:\n\n— Second bell after dusk: cordon guard reports 'weeping' on the Witness. Logged as weathering. (It had not rained in nine days.)\n— Third bell: light below the terrace, screaming. Guard dispatched.\n— Intake: NESSA, acolyte. Effects: one rite text (seized by clergy), one river stone (catalogued), one votive candle, unburned.\n— Note in margin, warden's hand: bleeding logged a full bell BEFORE the rite's stated hour. Nobody has asked me about this.",
  },
  {
    id: "doc_standing_orders",
    display_name: "Cordon Standing Orders",
    content:
      "CORDON OF THE WITNESS — STANDING ORDERS, renewed nightly:\n\nNone pass the line. None touch the marble. None linger past their errand. Do not scrub the face after the third occurrence; log the flow by finger-widths at dawn. Do not look at the face for longer than the count of seven. Report any warmth in the fence posts as thermal irregularity.\n\nIf the statue turns, do not log it. Send for the Intercession directly.",
  },
  {
    id: "doc_tollen_journal",
    display_name: "Tollen's Note",
    content: "Mara said she found something better. Not the basement. The Spire itself. We go tonight.",
  },
  {
    id: "doc_family_rites",
    display_name: "Dusty Ledger",
    content: "Three generations of the Rusk family. Four of the Fen. All leaving votives in the dark, hedging their bets against the Church's light. The under-rites didn't start with Mara. They started the day the Church arrived.",
  },
  {
    id: "doc_fen_votive_count",
    display_name: "Fen Votive Count",
    content:
      "A narrow tally scratched into bronze and soot-black wax:\n\nFEN HOUSE — lamps renewed at first dark. Iria: seventh daughter to count. Mother counted before her. Grandmother counted before mother. Do not let the Church think the flame began with us; do not let our children think it can end with us.\n\nBelow the tally, in a newer hand: Four generations. None missed.",
  },
  {
    id: "doc_rite_fragment_1",
    display_name: "Rite Fragment — First Leaf",
    content:
      "Charcoal on votive paper, pressed flat beneath the soil ring. The hand is careful, copied, young — Mara's:\n\n'THE RITE OF NEAR WITNESS — that the Grid may be seen without entering the Spire. Prepare the sacred matter. Keep the under-candles lit in the old order, as our mothers kept them. The circle below answers the circle above.'\n\nIn the margin, quicker, surer:\n\n'Nessa says the words give our candles power. She doesn't know it runs the other way. Tollen laughed. Iria wouldn't.'",
  },
  {
    id: "doc_rite_fragment_2",
    display_name: "Rite Fragment — Second Leaf",
    content:
      "The torn page's other half, folded into an ossuary niche between two named skulls. Mara's hand, pressed so hard the paper tore:\n\n'We light them tomorrow. All of us together. My choice, written where the Church never sweeps — if anyone kind ever reads this, know that nobody dragged me to that terrace. I asked Nessa for the words. I asked.'\n\nAnd beneath, smaller:\n\n'It was never the statue that opened.'",
  },
  // ── Grid Sickness Logs (cave evidence chain) ──
  {
    id: "doc_grid_log_1",
    display_name: "Darro's Wall — Log One",
    content:
      "LOG ONE\n\nOrin said it was spent.\n\nHe put it in cloth and told me not to bleed on it.\n\nI did not bleed.\n\nI only held it until the cave became familiar.",
  },
  {
    id: "doc_grid_log_2",
    display_name: "Darro's Wall — Log Two",
    content:
      "LOG TWO\n\nThe animals move wrong.\n\nThey cross the floor without order.\n\nI marked seven and slept.\n\nI marked seven more and the room became quiet enough to hear.",
  },
  {
    id: "doc_grid_log_3",
    display_name: "Darro's Wall — Log Three",
    content:
      "LOG THREE\n\nNot teeth.\n\nNot hunger.\n\nHunger is too simple.\n\nThis is a door learning the shape of a hand.\n\nMara said old prayers have hinges.\n\nI laughed when she said it.",
  },
  {
    id: "doc_grid_log_4",
    display_name: "Darro's Wall — Log Four",
    content:
      "LOG FOUR\n\nI did not open the statue.\n\nThe statue was not first.\n\nThe prayer under the prayer opened.\n\nIt was never the statue that opened.",
  },
];

export const FD_ITEMS: ItemData[] = [
  {
    id: "itm_carried_stone",
    display_name: "Nessa's Carried Stone",
    description:
      "A mundane river stone, catalogued as evidence of witch-work. Its twin was skipped across the water by Mara Vey, the summer they were twelve.",
    icon: "🪨",
    sprite_id: "spr_itm_carried_stone",
    category: "key",
  },
  {
    id: "itm_health_potion",
    display_name: "Health Potion",
    description: "Restores 5 HP.",
    icon: "🧪",
    sprite_id: "spr_itm_health_potion",
    category: "consumable",
    effects: { heal: 5 },
  },
  {
    id: "itm_glass_shard",
    display_name: "Glass Shard",
    description:
      "A sliver of processed matter. It carries a feeling that is not yours.",
    icon: "🔮",
    sprite_id: "spr_itm_glass_shard",
    category: "key",
  },
  {
    id: "itm_archive_key",
    display_name: "Archive Key",
    description: "A heavy church key. Opens Aldric's archive chest.",
    icon: "🗝️",
    sprite_id: "spr_itm_archive_key",
    category: "key",
  },
  {
    id: "itm_votive",
    display_name: "Votive Candle",
    description:
      "A small unburned candle of the kind the town buys in sevens. The shrine keepers count what is given.",
    icon: "🕯️",
    sprite_id: "spr_itm_votive",
    category: "key",
  },
  {
    id: "itm_family_mark_1",
    display_name: "Rusk Family Mark",
    category: "key",
    description:
      "A piece of slate with the Rusk house sigil carved into it — Tollen's people. Left at a shrine in the network.",
    icon: "🛡️",
  },
  {
    id: "itm_family_mark_2",
    display_name: "Fen Family Mark",
    category: "key",
    description:
      "A bronze disk bearing the Fen family crest, tarnished black — Iria's people kept the under-candles for four generations.",
    icon: "🛡️",
  },
  {
    id: "itm_family_mark_3",
    display_name: "Vey Family Mark",
    category: "key",
    description:
      "A river-worn wooden token carved with the Vey knot — Mara's family. It was set at the shrine that hides a door.",
    icon: "🛡️",
  },
  {
    id: "itm_rite_fragment_1",
    display_name: "Rite Text — First Leaf",
    category: "key",
    description:
      "Torn votive paper detailing the under-rite, in Mara Vey's hand. The evidence Aldric cannot un-read.",
    icon: "📜",
  },
  {
    id: "itm_rite_fragment_2",
    display_name: "Rite Text — Second Leaf",
    category: "key",
    description:
      "The other half of the torn page, hidden with the ossuary dead. Mara's own words: nobody dragged her. She asked.",
    icon: "📜",
  },
  {
    id: "itm_cave_sigil",
    display_name: "Cave Sigil",
    category: "key",
    description:
      "A flat river-stone incised with old marks. The deep passage recognizes it.",
    icon: "🪬",
  },
];

export const FD_SHOPS: ShopData[] = [
  {
    id: "shop_town",
    display_name: "Dimos' Stall",
    items: [
      {
        item_id: "itm_health_potion",
        price: 10,
        price_modifiers: [
          { condition: { time_of_day: ["dusk", "night"] }, multiplier: 1.5, delta: 0 },
        ],
      },
      {
        item_id: "itm_votive",
        price: 4,
        price_modifiers: [
          { condition: { time_of_day: ["dusk", "night"] }, multiplier: 1.5, delta: 0 },
        ],
      },
    ],
  },
];

// ══════════════════════════════════════════════════════════════════════════════
// ACT 1 OPEN WORLD: Gate-block dialogues, boss intro, cave entrance
// ══════════════════════════════════════════════════════════════════════════════

FD_DIALOGUE.push(
  {
    id: "dia_gate_blocked_briefing",
    display_name: "The Scriptorium First",
    nodes: [
      {
        id: "node_1",
        speaker: "Brother Aldric",
        text: "The Scriptorium first, Intercessor. The briefing won't deliver itself.",
        options: [{ text: "(Turn back.)" }],
      },
    ],
  },
  {
    id: "dia_gate_blocked_cave",
    display_name: "Not Ready",
    nodes: [
      {
        id: "node_1",
        speaker: "Brother Aldric",
        text: "Not yet: record Dimos, Marta, Holt, and Orin, then speak to Lazare before using this south road.\n\nThe cave will answer better if the town has already contradicted itself.\n\nI pinned the same order on the Case Board in my office because fear is bad at errands.",
        options: [{ text: "(Turn back.)" }],
      },
    ],
  },
  {
    id: "dia_gate_blocked_deep",
    display_name: "Sigil Seal",
    nodes: [
      {
        id: "node_1",
        speaker: "Scene",
        text: "Old marks are cut into the stone. The passage ahead won't open without something that matches them.",
        options: [{ text: "(Turn back.)" }],
      },
    ],
  },
  {
    id: "dia_gate_blocked_prison",
    display_name: "No Admittance",
    nodes: [
      {
        id: "node_1",
        speaker: "Scene",
        text: "The warden shakes her head. You have no business in the Hall of Custody yet.",
        options: [{ text: "(Turn back.)" }],
      },
    ],
  },
  {
    id: "dia_gate_blocked_mouthstone",
    display_name: "The Road Beyond",
    nodes: [
      {
        id: "node_1",
        speaker: "Scene",
        text: "The road beyond the Mouthstone is not your assignment. Not yet.",
        options: [{ text: "(Turn back.)" }],
      },
    ],
  },
  {
    id: "dia_gate_blocked_glassworks",
    display_name: "Glassworks Road Held",
    nodes: [
      {
        id: "node_1",
        speaker: "Cordon Clerk",
        text: "East road is held until the market clears. Orin Vale is making a spectacle by Dimos's stall, and Brother Aldric wants the Intercessor briefed before anyone starts questioning furnace hands.",
        options: [{ text: "(Return to the square.)" }],
      },
    ],
  },
  {
    id: "dia_gate_blocked_shrine",
    display_name: "Old Marks",
    nodes: [
      {
        id: "node_1",
        speaker: "Scene",
        text: "This door bears marks older than the cave itself. It won't answer you. Not yet.",
        options: [{ text: "(Leave it.)" }],
      },
    ],
  },
  {
    id: "dia_boss_intro",
    display_name: "The Grid-Sick",
    nodes: [
      {
        id: "node_1",
        speaker: "Scene",
        text: "Something stands in the deepest chamber wearing Darro Keel's outline badly. Glass has grown through the ribs and palms until the body looks less eaten than tuned.",
        options: [{ text: "Listen.", next_node_id: "node_2" }],
      },
      {
        id: "node_2",
        speaker: "Darro's Remnant",
        text: "O said spent. O said safe. I held it like a little moon and it remembered my hand.\n\nThe animals counted first. Then I counted with them. Seven, seven, seven until the cave learned my teeth.\n\nMara opened no statue. Mara opened the hinge under it.",
        options: [{ text: "End this.", next_node_id: "node_3" }],
      },
      {
        id: "node_3",
        speaker: "Brother Aldric",
        text: "This is Grid sickness past recall. Hear what remains, then end the suffering.\n\nDo not call this feeding. Do not call it witchcraft because the word is easier.\n\nThe chamber is answering in Darro's voice because Glass keeps what it wounds.",
        options: [{ text: "(Prepare for battle.)" }],
      },
    ],
  },
  {
    id: "dia_cave_entrance",
    display_name: "Cave Entrance",
    nodes: [
      {
        id: "node_1",
        speaker: "Scene",
        text: "The eastern caves. The body was found somewhere in the deep. The air coming up smells like burnt metal and old prayers.",
        options: [{ text: "Descend." }, { text: "(Not yet.)" }],
      },
    ],
  },
);
