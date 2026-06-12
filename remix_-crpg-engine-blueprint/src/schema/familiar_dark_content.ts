// The Familiar Dark — Build 2 content: cast, dialogue, cutscenes, quests,
// documents, items, shops. The town generator (town_gen.ts) owns coordinates;
// this file owns words and staging. Spine switches:
//   ceremony: opening_ceremony_complete, class_scholar/warrior/mystic
//   act 1:    office_briefed → gaol_entered → met_nessa → seen_cellar
//   texture:  heard_rhyme, seen_cordon, seen_funeral, nessa_saw_stone,
//             gave_votive, read_ledger, read_orders

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
  },
  {
    id: "ent_rite_remnant_2",
    display_name: "Rite Remnant",
    sprite_id: "spr_rite_remnant",
    is_npc: false,
    max_hp: 8, max_mp: 0, attack: 4, defense: 1, speed: 8,
  },
  {
    id: "ent_rite_remnant_3",
    display_name: "Rite Remnant",
    sprite_id: "spr_rite_remnant",
    is_npc: false,
    max_hp: 8, max_mp: 0, attack: 4, defense: 1, speed: 8,
  },
  // ── Network bestiary (placed across the upper level and the depths) ──────
  // Rite remnants: slow shapes the interrupted rites left standing.
  {
    id: "ent_rite_remnant_4",
    display_name: "Rite Remnant",
    sprite_id: "spr_rite_remnant",
    is_npc: false,
    max_hp: 8, max_mp: 0, attack: 4, defense: 1, speed: 8,
  },
  {
    id: "ent_rite_remnant_5",
    display_name: "Rite Remnant",
    sprite_id: "spr_rite_remnant",
    is_npc: false,
    max_hp: 8, max_mp: 0, attack: 4, defense: 1, speed: 8,
  },
  {
    id: "ent_rite_remnant_6",
    display_name: "Rite Remnant",
    sprite_id: "spr_rite_remnant",
    is_npc: false,
    max_hp: 8, max_mp: 0, attack: 4, defense: 1, speed: 8,
  },
  {
    id: "ent_rite_remnant_7",
    display_name: "Rite Remnant",
    sprite_id: "spr_rite_remnant",
    is_npc: false,
    max_hp: 8, max_mp: 0, attack: 4, defense: 1, speed: 8,
  },
  // Candle-eaten: fast and frail — what is left of someone who fed the
  // wrong flame. They hunt in pairs along the ossuary courses.
  {
    id: "ent_candle_eaten_1",
    display_name: "Candle-Eaten",
    sprite_id: "spr_rite_remnant",
    is_npc: false,
    max_hp: 5, max_mp: 0, attack: 3, defense: 0, speed: 14,
  },
  {
    id: "ent_candle_eaten_2",
    display_name: "Candle-Eaten",
    sprite_id: "spr_rite_remnant",
    is_npc: false,
    max_hp: 5, max_mp: 0, attack: 3, defense: 0, speed: 14,
  },
  {
    id: "ent_candle_eaten_3",
    display_name: "Candle-Eaten",
    sprite_id: "spr_rite_remnant",
    is_npc: false,
    max_hp: 5, max_mp: 0, attack: 3, defense: 0, speed: 14,
  },
  {
    id: "ent_candle_eaten_4",
    display_name: "Candle-Eaten",
    sprite_id: "spr_rite_remnant",
    is_npc: false,
    max_hp: 5, max_mp: 0, attack: 3, defense: 0, speed: 14,
  },
  // Partial conversions: the Grid got halfway. Slow, glass-plated, patient.
  {
    id: "ent_partial_conversion_1",
    display_name: "Partial Conversion",
    sprite_id: "spr_glass_remnant",
    is_npc: false,
    max_hp: 16, max_mp: 0, attack: 5, defense: 3, speed: 5,
  },
  {
    id: "ent_partial_conversion_2",
    display_name: "Partial Conversion",
    sprite_id: "spr_glass_remnant",
    is_npc: false,
    max_hp: 16, max_mp: 0, attack: 5, defense: 3, speed: 5,
  },
  {
    id: "ent_partial_conversion_3",
    display_name: "Partial Conversion",
    sprite_id: "spr_glass_remnant",
    is_npc: false,
    max_hp: 16, max_mp: 0, attack: 5, defense: 3, speed: 5,
  },
  {
    id: "ent_partial_conversion_4",
    display_name: "Partial Conversion",
    sprite_id: "spr_glass_remnant",
    is_npc: false,
    max_hp: 16, max_mp: 0, attack: 5, defense: 3, speed: 5,
  },
  {
    id: "ent_partial_conversion_5",
    display_name: "Partial Conversion",
    sprite_id: "spr_glass_remnant",
    is_npc: false,
    max_hp: 16, max_mp: 0, attack: 5, defense: 3, speed: 5,
  },
  // The Bound Remnant: what the interrupted rite left tied to Mara's
  // basement. The Act 1 finale fight — it rises when the ledger is read.
  {
    id: "ent_bound_remnant",
    display_name: "Bound Remnant",
    sprite_id: "spr_rite_remnant",
    is_npc: false,
    max_hp: 30, max_mp: 0, attack: 6, defense: 2, speed: 7,
  },
  // A cyberghost over the drowned shrine — consciousness that did not
  // finish leaving. Only a Mystic hears more than static.
  {
    id: "ent_cyberghost",
    display_name: "Cyberghost",
    sprite_id: "spr_ghost",
    dialogue_id: "dia_cyberghost_network",
    is_npc: true,
    max_hp: 99, max_mp: 0, attack: 0, defense: 0, speed: 0,
  },
  {
    id: "ent_merchant",
    display_name: "Provisioner Dimos",
    sprite_id: "spr_merchant",
    dialogue_id: "dia_merchant",
    is_npc: true,
    max_hp: 10, max_mp: 0, attack: 0, defense: 0, speed: 10,
  },
  {
    id: "ent_save",
    display_name: "Wayside Candle",
    sprite_id: "spr_candle",
    dialogue_id: "dia_save",
    is_npc: true,
    max_hp: 99, max_mp: 0, attack: 0, defense: 0, speed: 0,
  },
  {
    id: "ent_gaoler",
    display_name: "Warden Sefa",
    sprite_id: "spr_gaoler",
    dialogue_id: "dia_gaoler",
    is_npc: true,
    max_hp: 14, max_mp: 0, attack: 0, defense: 0, speed: 9,
  },
  {
    id: "ent_guard_cordon",
    display_name: "Cordon Guard Bren",
    sprite_id: "spr_guard",
    dialogue_id: "dia_guard_cordon",
    is_npc: true,
    max_hp: 14, max_mp: 0, attack: 0, defense: 0, speed: 9,
  },
  {
    id: "ent_guard_gate",
    display_name: "Gate Guard Holt",
    sprite_id: "spr_guard",
    dialogue_id: "dia_guard_gate",
    is_npc: true,
    max_hp: 14, max_mp: 0, attack: 0, defense: 0, speed: 9,
  },
  {
    id: "ent_priest",
    display_name: "Father Imre",
    sprite_id: "spr_priest",
    dialogue_id: "dia_priest",
    is_npc: true,
    max_hp: 12, max_mp: 6, attack: 0, defense: 0, speed: 8,
  },
  {
    id: "ent_innkeep",
    display_name: "Maro of the Counted Cup",
    sprite_id: "spr_innkeep",
    dialogue_id: "dia_innkeep",
    is_npc: true,
    max_hp: 12, max_mp: 0, attack: 0, defense: 0, speed: 9,
  },
  {
    id: "ent_elder",
    display_name: "Sela, the Widow's Cousin",
    sprite_id: "spr_elder",
    dialogue_id: "dia_elder",
    is_npc: true,
    max_hp: 10, max_mp: 0, attack: 0, defense: 0, speed: 7,
  },
  {
    id: "ent_mason",
    display_name: "Petra the Stonecutter",
    sprite_id: "spr_mason",
    dialogue_id: "dia_mason",
    is_npc: true,
    max_hp: 14, max_mp: 0, attack: 0, defense: 0, speed: 9,
  },
  {
    id: "ent_mother",
    display_name: "Liss",
    sprite_id: "spr_mother",
    dialogue_id: "dia_mother",
    is_npc: true,
    max_hp: 10, max_mp: 0, attack: 0, defense: 0, speed: 9,
  },
  {
    id: "ent_pilgrim",
    display_name: "Cosmas the Pilgrim",
    sprite_id: "spr_pilgrim",
    dialogue_id: "dia_pilgrim",
    is_npc: true,
    max_hp: 11, max_mp: 0, attack: 0, defense: 0, speed: 9,
  },
  {
    id: "ent_ferryman",
    display_name: "The Riverman",
    sprite_id: "spr_ferryman",
    dialogue_id: "dia_ferryman",
    is_npc: true,
    max_hp: 13, max_mp: 0, attack: 0, defense: 0, speed: 11,
  },
];

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
        text: "The procession road climbs away south, lined with small stone watchers, terrace over terrace, up to a marble precinct where something white stands behind a fence line and a guard who never turns around. Even from here you can see the dark threads running down its face.",
        options: [{ text: "So that is the Witness.", next_node_id: "node_2" }],
      },
      {
        id: "node_2",
        speaker: "High Clerk",
        text: "Eyes down, Intercessor. You will have your fill of it. By procedural mercy you are sworn tonight: Acolyte Nessa stands accused of witch-work at the Witness of the Dark Lights. Three of her friends are Glass. You will inquire before sentence is sealed.",
        options: [{ text: "I accept the writ.", next_node_id: "node_class" }],
      },
      {
        id: "node_class",
        speaker: "High Clerk",
        text: "Then swear your discipline. By which art will you stand between this town and its wound?",
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
        text: "Before the clerk can fold the writ, a grey-haired brother crosses the gate plaza — not at procession pace. He comes to you the way a man comes to an old friend at a funeral.",
        options: [{ text: "Aldric. You came down yourself.", next_node_id: "node_4" }],
      },
      {
        id: "node_4",
        speaker: "Brother Aldric",
        text: "Of course I did. I asked for you by name — we read border cases together before either of us had a title worth envying. I trust you to look at this one and tell me when I am wrong. The Church gave me a clerk's mercy; I wanted a friend's eyes.",
        options: [{ text: "Then show me where to start.", next_node_id: "node_5" }],
      },
      {
        id: "node_5",
        speaker: "Brother Aldric",
        text: "My scriptorium is the first door east off the way — you can see the lamp from here. The Hall of Custody faces it across the procession; Nessa is behind its bars. Paper first, Intercessor. Then her. The way is lined with watchers; let them see us do this properly.",
        options: [
          {
            text: "Begin the inquiry.",
            trigger_quest: "quest_investigate",
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
            text: "You have gone quiet.",
            condition: { switch: "act1_complete" },
            next_node_id: "node_after_office",
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
            text: "Take me to her.",
            condition: { all: [{ switch: "office_briefed" }, { not: { switch: "met_nessa" } }] },
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
            condition: { switch: "office_briefed" },
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
        text: "The scriptorium — first door east off the way, just past the gate lane. The writ, the witness lists, the cordon records. I will not have you meet her with an empty folder. Paper first.",
        options: [{ text: "Paper first." }],
      },
      {
        id: "node_go_gaol",
        speaker: "Brother Aldric",
        text: "The Hall of Custody, west across the procession — the marble hall facing my door. Warden Sefa keeps her. Sefa is not cruel, whatever you have heard about wardens. Speak to Nessa through the bars. I will be beside you, and I will not interrupt unless she lies.",
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
        id: "node_town",
        speaker: "Brother Aldric",
        text: "Notice where they built thresholds. Fences, bars, terraces, cordons. Alderamontico survives by deciding what may be approached and what must only be witnessed. This town is honest about it, at least — it put its holiest thing at the top of the stairs and forbade itself the climb.",
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
    nodes: [
      {
        id: "node_1",
        speaker: "Scene",
        text: "The cell block is colder than the office, the way stone gets when nobody warms it on purpose. Nessa watches you come the whole length of the corridor. She does not stand at the bars and she does not hide from them.",
        options: [
          {
            text: "Approach the bars.",
            condition: { not: { switch: "met_nessa" } },
            next_node_id: "node_first",
          },
          {
            text: "Hold up the carried stone.",
            condition: {
              all: [
                { has_item: "itm_carried_stone" },
                { not: { switch: "nessa_saw_stone" } },
              ],
            },
            next_node_id: "node_stone",
          },
          {
            text: "Speak with her.",
            condition: { all: [{ switch: "met_nessa" }, { not: { switch: "act1_complete" } }] },
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
        id: "node_first",
        speaker: "Acolyte Nessa",
        text: "If Aldric brought you to watch me confess, tell him I confessed years ago — to curiosity. Apparently that is the only sin anyone needs. The rest they will write in for me.",
        options: [{ text: "I came to ask what happened.", next_node_id: "node_first2" }],
      },
      {
        id: "node_first2",
        speaker: "Brother Aldric",
        text: "You are here to answer admissibly, Nessa.",
        options: [{ text: "Let her speak, Aldric.", next_node_id: "node_first3" }],
      },
      {
        id: "node_first3",
        speaker: "Acolyte Nessa",
        text: "Admissibly. Fine. Tollen and Iria touched the Witness after it began to bleed — they are Glass, and that is true. Mara was gone before anyone touched anything, and that is true, and no one will write it down because no one can say what 'gone' means. I screamed because I survived. Write that down.",
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
        text: "Because the statue did not open alone. Something opened *through* Mara — and I did not build that door, whatever I believed I was doing with my clean church rite. Find where she learned to pray before I corrected her. This town keeps its praying underneath itself. Start under the oldest roof it has.",
        options: [
          {
            text: "(Quietly) I'll look beneath the town.",
            set_switch: "met_nessa",
            trigger_quest: "quest_investigate",
            trigger_quest_state: "her_words",
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
    ],
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
          { text: "How is she treated?", next_node_id: "node_care" },
          { text: "Show me the ledger.", next_node_id: "node_ledger" },
          {
            text: "Night shifts must be long here.",
            condition: { time_of_day: ["night", "dusk"] },
            next_node_id: "node_night",
          },
          { text: "Nothing now." },
        ],
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
        text: "I see the back of my own helmet, mostly, because I have learned not to look at her face for long. The blood does not run when you watch. It has run every night since, all the same. You can check the stains in the morning like a tide chart.",
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
    ],
  },
  {
    id: "dia_guard_gate",
    display_name: "Gate Guard Holt",
    nodes: [
      {
        id: "node_1",
        speaker: "Gate Guard Holt",
        text: "Counted in. That is the whole of my work now, Intercessor — counting people in, counting them out, and reporting when the numbers disagree. They have disagreed twice this year. Both times it was the river road.",
        options: [
          { text: "What is the Mouthstone, really?", next_node_id: "node_stone" },
          { text: "Who left and didn't come back?", next_node_id: "node_missing" },
          { text: "Keep counting, Holt." },
        ],
      },
      {
        id: "node_stone",
        speaker: "Gate Guard Holt",
        text: "The door we never built and cannot close. Exiles go through the split and the pagan lands take them. My grandmother said it was a mouth before it was a gate, and I notice nobody ever corrected her — they only stopped letting her say it near the priest.",
        options: [{ text: "Go back.", next_node_id: "node_1" }],
      },
      {
        id: "node_missing",
        speaker: "Gate Guard Holt",
        text: "A trapper in spring. And the Vey girl's father, the week after the rite went wrong — walked out at dawn with river mud already on his boots, and the count has been wrong ever since. Nobody sent for him. Make of that your business; it is past mine.",
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
        text: "I believe the doctrine requires a cause, and a cause with a name is a mercy to everyone except the name. You will notice I did not answer your question. That is the most honest I am permitted to be.",
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
    ],
  },
  {
    id: "dia_innkeep",
    display_name: "Maro of the Counted Cup",
    nodes: [
      {
        id: "node_1",
        speaker: "Maro",
        text: "Welcome to the Counted Cup — best pour on the procession, which is easy, being the only one. Sit anywhere that isn't the hearth stone. You're the Intercessor. Everyone has been in twice today to not-talk about you.",
        options: [
          { text: "What does the town not-say about Nessa?", next_node_id: "node_gossip" },
          {
            text: "What's behind the seal on your cellar?",
            condition: { switch: "met_nessa" },
            next_node_id: "node_cellar",
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
    ],
  },
  {
    id: "dia_elder",
    display_name: "Sela, the Widow's Cousin",
    nodes: [
      {
        id: "node_1",
        speaker: "Sela",
        text: "You walk like paper, Intercessor — all straight lines. Sit by the fountain a moment; the water remembers being spoken to, whatever the priest says now.",
        options: [
          { text: "Tell me about the river customs.", next_node_id: "node_river" },
          { text: "You're the widow's cousin?", next_node_id: "node_widow" },
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
          { text: "Work well, Petra." },
        ],
      },
      {
        id: "node_temple",
        speaker: "Petra",
        text: "My line dressed every block on that terrace back to the founding. Witness-grade marble, quarried under petition, set with the grain facing heaven. You do not forget the feel of stone like that. Which is how I know what I felt in the new fence posts is not the marble.",
        options: [{ text: "What did you feel?", next_node_id: "node_warm" }],
      },
      {
        id: "node_warm",
        speaker: "Petra",
        text: "Warmth. Stone takes the day's heat and gives it back by dusk, every mason knows the schedule of it — and the cordon posts give it back at the witching hour instead, all together, like breath. I reported it. The clerk wrote 'thermal irregularity' and underlined it, and that underline is the whole of the Church's curiosity these days.",
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
        text: "Intercessor! Supplies, sundries, and no opinions — the only stall on the procession that sells all three. What will it be?",
        options: [
          { text: "Show me your goods.", trigger_cutscene: "cut_open_shop" },
          {
            text: "Trading at this hour?",
            condition: { time_of_day: ["dusk", "night"] },
            next_node_id: "node_late",
          },
          {
            text: "No opinions? About the trial?",
            next_node_id: "node_opinion",
          },
          { text: "Not now." },
        ],
      },
      {
        id: "node_late",
        speaker: "Provisioner Dimos",
        text: "After dusk the Church counts my lamp oil, so late trade carries a late premium. Buy quick, or buy at dawn.",
        options: [{ text: "Go back.", next_node_id: "node_1" }],
      },
      {
        id: "node_opinion",
        speaker: "Provisioner Dimos",
        text: "He leans in, glances both ways along the stoa. — Free of charge, because you'll hear it anyway: half this town bought candles from me the week before the rite. Sevens. Always sevens. I sell no opinions, Intercessor, but I sell a great many candles, and I can count.",
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
        text: "The Mouthstone Exile Gate: one black stone broken into two leaning halves, the split between them breathing a thin light that is not lamplight. The pagan lands begin where its shadow ends. Things written low on the inner faces have been chiselled out, twice.",
        options: [{ text: "Leave it be." }],
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
        options: [{ text: "Step back from the line." }],
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
    id: "dia_save",
    display_name: "Wayside Candle",
    nodes: [
      {
        id: "node_1",
        speaker: "Wayside Candle",
        text: "A votive candle burns at the wayside shrine, steady against the night wind. The flame keeps what you give it.",
        options: [
          { text: "Pray, and give it this moment.", trigger_cutscene: "cut_save" },
          { text: "Leave it burning." },
        ],
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
      { type: "play_music", music_url: "/music/Town.wav" },
      { type: "screen_fade", fade: "out", duration: 0 },
      { type: "move_entity", entity_id: "ent_aldric", cell: [0, -29], facing: [0, -1] },
      { type: "screen_fade", fade: "in", duration: 1500 },
      // The procession in one shot: gate, the climb, the bleeding Witness.
      { type: "camera_pan", cell: [0, -10], duration: 1400 },
      { type: "camera_pan", cell: [0, 26], duration: 1800 },
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
      { type: "read_document", document_id: "doc_writ" },
      { type: "show_dialogue", dialogue_id: "dia_office_briefing" },
      { type: "read_document", document_id: "doc_field_note" },
    ],
  },
  {
    id: "cut_gaol_entry",
    display_name: "The Warden's Threshold",
    is_blocking: true,
    actions: [
      { type: "set_switch", switch_id: "gaol_entered", switch_value: true },
      { type: "show_dialogue", dialogue_id: "dia_gaol_entry_scene" },
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
      { type: "camera_pan", cell: [0, 26], duration: 1600 },
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
      { type: "show_dialogue", dialogue_id: "dia_funeral" },
    ],
  },
  {
    id: "cut_cellar_seal",
    display_name: "The Sealed Cellar",
    is_blocking: true,
    actions: [
      { type: "set_switch", switch_id: "seen_cellar", switch_value: true },
      { type: "show_dialogue", dialogue_id: "dia_cellar" },
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
      { type: "set_switch", switch_id: "act1_complete", switch_value: true },
      { type: "show_dialogue", dialogue_id: "dia_office_after" },
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
      { type: "play_music", music_url: "/music/Town.wav" },
    ],
  },
  // ── Scene 4: the trapdoor ──────────────────────────────────────────────────
  {
    id: "cut_trapdoor_locked",
    display_name: "The Sealed Cellar",
    is_blocking: true,
    actions: [{ type: "show_dialogue", dialogue_id: "dia_trapdoor_sealed" }],
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
];

// The office briefing's conversation, kept separate for length.
FD_DIALOGUE.push({
  id: "dia_office_briefing",
  display_name: "The Scriptorium Briefing",
  nodes: [
    {
      id: "node_1",
      speaker: "Scene",
      text: "Aldric shuts the scriptorium door with his heel. Witness lists on the table, cordon records, a gaol inventory — and one creased field note he sets apart from the rest, face down, like a card he is not ready to play.",
      options: [{ text: "Walk me through it.", next_node_id: "node_2" }],
    },
    {
      id: "node_2",
      speaker: "Brother Aldric",
      text: "The night of the rite: four at the Witness. Tollen Rusk and Iria Fen — Glass where they stand, the cordon guard logged it. Mara Vey — no body, no Glass, no exit past the gate count. Gone in a direction we have no word for. And Nessa, alive, holding a rite the Church shelved a century ago, screaming loud enough to wake the terrace.",
      options: [
        { text: "Why does the Church call it witch-work?", next_node_id: "node_3" },
      ],
    },
    {
      id: "node_3",
      speaker: "Brother Aldric",
      text: "Because the alternative is calling it an answer. If Nessa is a witch, the Witness was attacked and the world still makes sense. If Nessa is innocent — then the statue replied to a prayer, Intercessor, and bled while doing it, and nothing in doctrine survives that. A tidy monster, or a difficult miracle. The Church has chosen. I have not. That is the entire reason you are standing in my office.",
      options: [
        { text: "Then I'll go hear her myself.", next_node_id: "node_4" },
      ],
    },
    {
      id: "node_4",
      speaker: "Brother Aldric",
      text: "The Hall of Custody, straight across the procession. Warden Sefa will let you to the bars — read her ledger if she offers it, she sees more than her hall. And take the field note. I wrote it before any of this had a docket number. You should know what kind of friend is asking you for the truth.",
      options: [
        {
          text: "Take the note, and the case.",
          trigger_quest: "quest_investigate",
          trigger_quest_state: "briefed",
        },
      ],
    },
  ],
});

FD_DIALOGUE.push({
  id: "dia_office_after",
  display_name: "The Doctrine Re-Examined",
  nodes: [
    {
      id: "node_1",
      speaker: "Scene",
      text: "Aldric lays the torn ledger page flat on his desk. He lines up the torn edge with the straight grain of the wood, smoothing it down over and over, as if the right amount of pressure could make the words on it mean something else.",
      options: [{ text: "It's the under-rite.", next_node_id: "node_2" }],
    },
    {
      id: "node_2",
      speaker: "Brother Aldric",
      text: "It is. Written in Mara's hand, reciting older forms. Three generations of under-rites, performed in the dark, hedging bets against the Church's light. The town has been praying to the Witness all along.",
      options: [
        { 
          text: "Nessa said the statue looked at her.", 
          condition: { switch: "nessa_saw_stone" },
          next_node_id: "node_saw" 
        },
        { 
          text: "The doctrine doesn't survive this.", 
          condition: { not: { switch: "nessa_saw_stone" } },
          next_node_id: "node_doctrine" 
        },
      ],
    },
    {
      id: "node_saw",
      speaker: "Brother Aldric",
      text: "And now we know why it knew how to look back. It has been fed on the town's grief and secrets for a hundred years. The rite didn't wake it. The rite just finally gave it a voice. We must petition the capital.",
      options: [
        {
          text: "The first act concludes.",
          trigger_quest: "quest_investigate",
          trigger_quest_state: "act_one_closed",
        },
      ],
    },
    {
      id: "node_doctrine",
      speaker: "Brother Aldric",
      text: "No, it does not. The doctrine is built on the premise that the light is given, not demanded. If the dark can be negotiated with... the Church will burn this town to the bedrock before they let that be known. We must petition the capital.",
      options: [
        {
          text: "The first act concludes.",
          trigger_quest: "quest_investigate",
          trigger_quest_state: "act_one_closed",
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
];

export const FD_DOCUMENTS: DocumentData[] = [
  {
    id: "doc_writ",
    display_name: "Writ of Procedural Mercy",
    content:
      "By the Intercession, under the dark lights, witnessed and counted:\n\nThe sworn Intercessor shall inquire into the events of the Witching Hour rite at the Witness of the Dark Lights. All doors of the town shall answer; all citizens shall render truthful account; the accused shall be heard through bars and paper.\n\nThe inquiry precedes the sentence. The sentence does not wait on the inquiry's comfort.\n\nCuriosity is not a defense.",
  },
  {
    id: "doc_field_note",
    display_name: "Aldric's Field Note",
    content:
      "Private hand, before the docket:\n\nI asked that the new Intercessor be assigned because I trust them. We studied border cases together before either of us had a title worth envying. If this must be done inside the Church's procedure, I would rather stand beside an old friend than another clerk with clean gloves.\n\nAnd if my student is what they say she is, I want someone beside me who will make me believe it properly — not merely sign it.",
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
