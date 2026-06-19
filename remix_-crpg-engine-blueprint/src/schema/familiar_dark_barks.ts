// The Familiar Dark — ambient barks. The town talking to itself, not to you.
//
// Each bark is a short overheard exchange between two NPCs that fires when they
// stand together (within talking distance) and the player is close enough to
// hear it. The runtime picks the FIRST bark in this array whose speaker pair
// matches and whose `condition` passes — so for any given pair, list the most
// specific (state-gated) variants first and the generic fallback last.
//
// The point of these is the moral panic: a town that wanted a vampire, then
// wanted a witch, gossiping its fear from mouth to mouth while you work the
// case. Lines read as evidence and as atmosphere at once.
//
// Speaker pairs only fire if their schedules bring them together — see the
// convergence entries in town_square_gen.ts and residential_block_gen.ts.

import type { BarkData } from "./game";

export const FD_BARKS: BarkData[] = [
  // ── Market: Dimos & Orin, before the public accusation ────────────────────
  // The muttering that hardens into Orin's open accusation in the square.
  {
    id: "bark_dimos_orin_prelude",
    speakers: ["ent_merchant", "ent_orin_public"],
    condition: {
      all: [
        { not: { switch: "vampire_cleared" } },
        { not: { switch: "orin_public_accusation_seen" } },
      ],
    },
    cooldown_minutes: 600,
    lines: [
      { speaker: "ent_orin_public", text: "Animals opened and counted, Dimos. You know what does that." },
      { speaker: "ent_merchant", text: "I know what the Church will hang me for saying. Lower your voice." },
      { speaker: "ent_orin_public", text: "Someone has to say it loud. The shutters man. Before he's hungry again." },
    ],
  },

  // ── Market: Dimos & Sela, gossip that tracks the case ─────────────────────
  // Darkest variant first: the wrong verdict was filed.
  {
    id: "bark_dimos_sela_condemned",
    speakers: ["ent_merchant", "ent_elder"],
    condition: { switch: "lazare_condemned" },
    cooldown_minutes: 600,
    lines: [
      { speaker: "ent_elder", text: "They bound the shutters man over. So that's it, then. Settled." },
      { speaker: "ent_merchant", text: "Settled. And the caves still cold, and the statue still weeping. Settled." },
      { speaker: "ent_elder", text: "Don't. You'll make yourself the next loud one." },
    ],
  },
  // After Lazare is cleared and the witch thread opens — the fear changes shape.
  {
    id: "bark_dimos_sela_witch",
    speakers: ["ent_merchant", "ent_elder"],
    condition: { switch: "nessa_thread_started" },
    cooldown_minutes: 480,
    lines: [
      { speaker: "ent_elder", text: "So it wasn't the shutters man after all. My cousin always said so." },
      { speaker: "ent_merchant", text: "And now the same mouths that swore vampire swear witch. Same mouths, Sela." },
      { speaker: "ent_elder", text: "The girl was always strange. Strange has to land on someone." },
    ],
  },
  // Generic pre-clear fallback: blame the easy monster.
  {
    id: "bark_dimos_sela_blame",
    speakers: ["ent_merchant", "ent_elder"],
    cooldown_minutes: 480,
    lines: [
      { speaker: "ent_elder", text: "Is it true the new Intercessor went to the shutters man's door? Stood right at it?" },
      { speaker: "ent_merchant", text: "Asking questions of a locked house. Better than asking them of us, I'd think." },
      { speaker: "ent_elder", text: "A house that locked has reasons. I'd not knock twice." },
    ],
  },

  // ── The well: Sela & the High Clerk, folk custom against procedure ────────
  {
    id: "bark_sela_clerk_witch",
    speakers: ["ent_elder", "ent_high_clerk"],
    condition: { switch: "nessa_thread_started" },
    cooldown_minutes: 480,
    lines: [
      { speaker: "ent_high_clerk", text: "The custody docket stays sealed until the writ is amended. Tell the square that." },
      { speaker: "ent_elder", text: "The square already has its verdict. Paper's only catching up." },
      { speaker: "ent_high_clerk", text: "Paper is the only thing in this town that can be made to slow down." },
    ],
  },
  {
    id: "bark_sela_clerk_generic",
    speakers: ["ent_elder", "ent_high_clerk"],
    cooldown_minutes: 480,
    lines: [
      { speaker: "ent_elder", text: "My grandmother left water at the step before any priest blessed a thing here." },
      { speaker: "ent_high_clerk", text: "And the Church wrote that down as tolerated custom, and here we both still are." },
      { speaker: "ent_elder", text: "Tolerated. There's a word that's hanged more people than hate ever did." },
    ],
  },

  // ── Residential evening: Liss & Cosmas at the shrine ──────────────────────
  {
    id: "bark_liss_cosmas_cleared",
    speakers: ["ent_mother", "ent_pilgrim"],
    condition: { switch: "vampire_cleared" },
    cooldown_minutes: 480,
    lines: [
      { speaker: "ent_mother", text: "I told my boy the shutters man wasn't the one. He cried — he'd liked being afraid of something with a face." },
      { speaker: "ent_pilgrim", text: "A face is a mercy. It's the faceless thing in the caves I came all this way to pray about." },
      { speaker: "ent_mother", text: "Then pray louder. Whatever it was, it's still down there." },
    ],
  },
  {
    id: "bark_liss_cosmas_generic",
    speakers: ["ent_mother", "ent_pilgrim"],
    cooldown_minutes: 480,
    lines: [
      { speaker: "ent_pilgrim", text: "Three of your young ones turned to Glass at the Witness, they tell me. Is it true they're still standing there?" },
      { speaker: "ent_mother", text: "Behind the cordon. We're not allowed to mourn them or move them. Just to look." },
      { speaker: "ent_pilgrim", text: "That's not a cordon. That's a held breath." },
    ],
  },

  // ── Residential evening: Petra & Cosmas, the stonecutter's unease ─────────
  {
    id: "bark_petra_cosmas_witch",
    speakers: ["ent_mason", "ent_pilgrim"],
    condition: { switch: "nessa_thread_started" },
    cooldown_minutes: 480,
    lines: [
      { speaker: "ent_pilgrim", text: "They're saying the acolyte did it now. With words, no less." },
      { speaker: "ent_mason", text: "I cut headstones, pilgrim. I've set names under this town for thirty years." },
      { speaker: "ent_mason", text: "There's older carving down there than any name I've ever cut. Ask who taught HER the words." },
    ],
  },
  {
    id: "bark_petra_cosmas_generic",
    speakers: ["ent_mason", "ent_pilgrim"],
    cooldown_minutes: 480,
    lines: [
      { speaker: "ent_pilgrim", text: "You work the lower graves. Have you seen the body they pulled from the caves?" },
      { speaker: "ent_mason", text: "I've seen what feeding looks like. That wasn't it. That was a man burned out from the inside." },
      { speaker: "ent_pilgrim", text: "Then why does the whole town keep saying teeth?" },
    ],
  },
];
