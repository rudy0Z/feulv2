export type Lang = "hi" | "mr" | "ta" | "bn" | "en"
export type Format = "LINES" | "SCENARIO" | "INTERVIEW" | "ROOM"
export type Tab = "home" | "jobs" | "wallet"
export type Env = "market" | "food" | "travel" | "health" | "money" | "home"

// Scenes say where the conversation happens.
export const ENVS: Record<Env, {
  label: string
  short: string
  line: string
}> = {
  market: {
    label: "Shops & markets",
    short: "Markets",
    line: "Bargain, ask, pay",
  },
  food: { label: "Food & chai", short: "Food", line: "Order, complain, chat" },
  travel: {
    label: "Travel & transit",
    short: "Travel",
    line: "Fares, delays, directions",
  },
  health: {
    label: "Clinics & pharmacy",
    short: "Health",
    line: "Book, describe, ask",
  },
  money: {
    label: "Banks & bills",
    short: "Money",
    line: "Explain, dispute, confirm",
  },
  home: {
    label: "Home & neighbours",
    short: "Home",
    line: "Everyday talk at home",
  },
}
export type OnboardingStage = "landing" | "auth" | "otp" | "language" | "consent" | "mic" | "done"

export const LANGS: Record<Lang, {
  native: string
  name: string
  sample: string
  hello: string
  count: string
  phrase: string
}> = {
  hi: {
    native: "हिन्दी",
    name: "Hindi",
    sample: "नमस्ते, आज दुकान कितने बजे खुलेगी?",
    hello: "नमस्ते! मैं बोलो हूँ।",
    count: "एक, दो, तीन, चार, पाँच",
    phrase: "आज मौसम अच्छा है।",
  },
  mr: {
    native: "मराठी",
    name: "Marathi",
    sample: "नमस्कार, आज बाजार किती वाजता उघडेल?",
    hello: "नमस्कार! मी बोलो.",
    count: "एक, दोन, तीन, चार, पाच",
    phrase: "आज हवा छान आहे.",
  },
  ta: {
    native: "தமிழ்",
    name: "Tamil",
    sample: "வணக்கம், இன்று கடை எப்போது திறக்கும்?",
    hello: "வணக்கம்! நான் போலோ.",
    count: "ஒன்று, இரண்டு, மூன்று, நான்கு, ஐந்து",
    phrase: "இன்று வானிலை நன்றாக இருக்கிறது.",
  },
  bn: {
    native: "বাংলা",
    name: "Bengali",
    sample: "নমস্কার, আজ দোকান কখন খুলবে?",
    hello: "নমস্কার! আমি বোলো।",
    count: "এক, দুই, তিন, চার, পাঁচ",
    phrase: "আজ আবহাওয়া ভালো।",
  },
  en: {
    native: "English",
    name: "English",
    sample: "Hello, what time does the shop open today?",
    hello: "Hello! I'm Bolo.",
    count: "One, two, three, four, five",
    phrase: "The weather is nice today.",
  },
}

export const FORMAT_LABEL: Record<Format, string> = {
  LINES: "Read aloud",
  SCENARIO: "Role-play",
  INTERVIEW: "Interview",
  ROOM: "Group room",
}
/** What Bolo does in each format — shown before you start so the AI's role is never a surprise. */
export const BOLO_ROLE: Record<Format, string> = {
  LINES:
    "I'll show you short lines and how to say them. Read them like you would at home.",
  SCENARIO: "I'll play the other person. You just be yourself.",
  INTERVIEW: "I'll ask the questions and listen. Answer in your own words.",
  ROOM: "I'll keep time and nudge whoever's quiet. Talk like you normally do.",
}

export type Prompt = {
  id: string
  text: string
  stem?: string
  speaker?: string
  chapter?: string
}

export type Job = {
  id: string
  title: string
  situation: string
  lang: Lang
  format: Format
  env: Env
  /** Realistic active minutes, retries included. */
  minutes: number
  /** ₹ at the standard rate before scarcity. */
  base: number
  /** Scarcity multiplier: how underrepresented this voice is in the data. */
  coverage: number
  /** Quality bonus, paid separately after approval. */
  bonus: number
  turns: number
  environment: string
  campaign: "open" | "full" | "oversubscribed" | "closed"
  tier: 1 | 2 | 3
  image: string
  prompts: Prompt[]
  participants?: number
  /** Why the multiplier exists, in plain words. */
  scarcity?: string
  /** What this voice helps build. */
  uses: string
}

/* ---------- Mission economy ---------- */
/** Standard contributor rate, ₹ per active hour, before scarcity. */
export const BASE_RATE = 240
/** Guaranteed pay once automated checks pass. The quality bonus is separate. */
export const jobTotal = (j: Pick<Job, "base" | "coverage">) =>
  Math.round(j.base * j.coverage)
export const jobMax = (j: Pick<Job, "base" | "coverage" | "bonus">) =>
  jobTotal(j) + j.bonus
export const perHour = (j: Pick<Job, "base" | "coverage" | "minutes">) =>
  Math.round((jobTotal(j) / j.minutes) * 60)

export type Length = "quick" | "core" | "deep" | "specialist"
/** Active-time bands: Quick under 5 min, Core 5–12, Deep 15–25 (in chapters). Specialist shares Deep's
    length but is an expertise track, so it is never inferred from minutes alone. */
export const lengthOf = (j: Pick<Job, "minutes">): Length =>
  j.minutes < 5 ? "quick" : j.minutes <= 12 ? "core" : "deep"
// Pay ranges follow from BASE_RATE × minutes, lifted up to 1.8× for rare voices.
export const LENGTHS: Record<Length, {
  label: string
  range: string
  pay: string
  line: string
  icon: string
}> = {
  quick: {
    label: "Quick",
    range: "Under 5 min",
    pay: "₹8–30",
    line: "Fits in a chai break",
    icon: "bolt",
  },
  core: {
    label: "Core",
    range: "5–12 min",
    pay: "₹20–85",
    line: "Where most missions live",
    icon: "circle",
  },
  deep: {
    label: "Deep",
    range: "15–25 min",
    pay: "₹60–180",
    line: "Chapters, saved as you go",
    icon: "layers",
  },
  specialist: {
    label: "Specialist",
    range: "15–25 min",
    pay: "₹100–250",
    line: "Rare dialects, expert talk",
    icon: "star",
  },
}
export const chaptersOf = (j: Pick<Job, "prompts">) => {
  const out: {
    title: string
    from: number
    count: number
  }[] = []
  j.prompts.forEach((p, i) => {
    const last = out.at(-1)
    if (p.chapter && (!last || last.title !== p.chapter))
      out.push({ title: p.chapter, from: i, count: 1 })
    else if (last && (!p.chapter || last.title === p.chapter)) last.count++
  })
  return out
}

export type ClipState = "ready" | "recording" | "recorded_local" | "uploading" | "upload_failed" | "submitted" | "under_review" | "accepted" | "repair_required" | "repaired"

export type Clip = {
  id: string
  prompt: Prompt
  state: ClipState
  secs: number
  seed: number
  retaken?: boolean
}

export type Session = {
  jobId: string
  // Payout is locked when the session starts.
  locked: {
    base: number
    coverage: number
    bonus: number
    total: number
  }
  clips: Clip[]
  index: number
  status: "capturing" | "reviewing" | "uploading" | "upload_failed" | "expired"
  resumeLeft: string
  calibrated: boolean
  roomConsented: boolean
  honoured: boolean
  repairOf?: string // submission id when session is a repair
}

export type Submission = {
  id: string
  jobId: string
  total: number
  status: "under_review" | "repair_required" | "appeal" | "approved"
  clips: {
    id: string
    prompt: Prompt
    state: "under_review" | "accepted" | "repair_required" | "repaired"
    seed: number
    secs: number
  }[]
  repair?: {
    reason: string
    code: string
    why: string
    example: string
    tip: string
    mode: "clip" | "full_take" | "participant_consent"
  }
  submittedAt: string
  waitReason: string
  honoured: boolean
}

export type LedgerKind = "earning" | "bonus" | "withdrawal"
export type LedgerEntry = {
  id: string
  kind: LedgerKind
  title: string
  when: string
  amount: number
  state: "pending" | "settled" | "failed" | "appeal" | "deleted_after_revocation" | "honoured" | "processing"
  note?: string
  day: number // 0 = today ... 6
  /** Active minutes of accepted audio, for the effective-rate readout. */
  mins?: number
}

export type Withdrawal = {
  id: string
  amount: number
  vpa: string
  status: "requested" | "processing" | "delayed" | "paid" | "failed" | "hold"
  requestedAt: string
  expected: string
  utr?: string
  paidAt?: string
}

export type VaultItem = {
  id: string
  title: string
  detail: string
  paid: number
  status: "active" | "revoke_requested" | "revoke_processing" | "revoked" | "delete_requested" | "delete_processing" | "deleted"
  receipt?: string
}

export type Notice = {
  id: string
  title: string
  body: string
  when: string
  target: View | { tab: Tab }
  unread: boolean
}

export type View = {
  name: "detail"
  jobId: string
} | { name: "studio" } | {
  name: "review"
} | {
  name: "complete"
  id: string
} | {
  name: "submission"
  id: string
} | {
  name: "credited"
  amount: number
  title: string
  pending?: number
  bonus?: number
} | { name: "withdraw" } | { name: "withdrawal" } | { name: "profile" } | {
  name: "consent"
} | { name: "mic" }

export type Sheet = null | "notifications" | "filters" | "help" | "edit" | "prefs" | "discard" | "leave" | "upi" | "bolo"

export type State = {
  /** Bumped by every prototype flow jump so the screen remounts with fresh local state. */
  epoch?: number
  scene?: Env | "ALL" | "SAVED"
  len?: Length | "all" | "saved"
  stage: OnboardingStage
  name: string
  lang: Lang
  /** Every language the contributor records in; `lang` is the first of these. UI copy stays English. */
  langs?: Lang[]
  consent: boolean
  consentLang: Lang | null
  mic: "unknown" | "granted" | "denied"
  tab: Tab
  stack: View[]
  sheet: Sheet
  jobs: Job[]
  saved: string[]
  session: Session | null
  submissions: Submission[]
  ledger: LedgerEntry[]
  available: number
  upi: null | {
    vpa: string
    name: string
  }
  withdrawal: Withdrawal | null
  vault: VaultItem[]
  notices: Notice[]
  supplyEmpty: boolean
  checklist: {
    alerts: boolean
    profile: boolean
  }
  toast: string | null
  // Prototype switches for failure branches
  sim: {
    failUpload: boolean
    upiResult: "matched" | "mismatch" | "unavailable"
    realMic: boolean
  }
}

const img = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=800&h=500&fit=crop&auto=format`

const J = (j: Omit<Job, "turns"> & { turns?: number }): Job => ({
  ...j,
  turns: j.turns ?? j.prompts.length,
})

export const JOBS: Job[] = [
  J({
    id: "j-chai-hi",
    title: "Chai stall regular",
    lang: "hi",
    format: "SCENARIO",
    env: "food",
    situation:
      "You stop at your usual chai stall and the owner wants to chat while the kettle boils.",
    minutes: 4,
    base: 16,
    coverage: 1.5,
    bonus: 4,
    environment: "Indoor or outdoor, street sound is fine",
    campaign: "open",
    tier: 1,
    image: img("1478737270239-2f02b77fc618"),
    scarcity: "Labs have few casual Hindi chats with street sound.",
    uses: "Voice assistants that follow small talk, not just commands.",
    prompts: [
      {
        id: "c0",
        stem: "Owner: “आइए भैया/दीदी, रोज़ वाली चाय?”",
        text: "Greet them like a regular and order your usual.",
      },
      {
        id: "c1",
        stem: "Owner: “आज दूध थोड़ा कम है, कड़क चलेगी?”",
        text: "Say how you feel about strong chai.",
      },
      {
        id: "c2",
        stem: "Owner: “और बताओ, काम कैसा चल रहा है?”",
        text: "Tell them in two or three sentences, like you would a friend.",
      },
      { id: "c3", stem: "Owner: “₹15 हुए।”", text: "Pay by UPI and say bye." },
    ],
  }),
  J({
    id: "j-wake-hi",
    title: "Voice commands at home",
    lang: "hi",
    format: "LINES",
    env: "home",
    situation:
      "Five things people say to a phone or speaker at home, each in a different mood.",
    minutes: 2,
    base: 8,
    coverage: 1.3,
    bonus: 2,
    environment: "Home, a fan or TV in the back is fine",
    campaign: "open",
    tier: 1,
    image: img("1771328842284-e48b807ef747"),
    scarcity: "Few recordings of tired or rushed Hindi commands.",
    uses: "Smart speakers that understand you at 6 am, not just in a studio.",
    prompts: [
      {
        id: "w0",
        stem: "Normal voice, like any evening.",
        text: "पंखा थोड़ा धीमा कर दो।",
      },
      {
        id: "w1",
        stem: "Sleepy. It's 6 am.",
        text: "कल सुबह छह बजे का अलार्म लगाओ।",
      },
      {
        id: "w2",
        stem: "In a hurry, you're leaving.",
        text: "माँ को वीडियो कॉल करो।",
      },
      {
        id: "w3",
        stem: "Curious, looking out the window.",
        text: "आज शाम बारिश होगी क्या?",
      },
      { id: "w4", stem: "Over loud music.", text: "गाने की आवाज़ थोड़ी बढ़ाओ।" },
    ],
  }),
  J({
    id: "j-shop-hi",
    title: "Kirana price check",
    lang: "hi",
    format: "SCENARIO",
    env: "market",
    situation:
      "Buying groceries at a local shop. An item is out of stock and you need to bargain on the replacement.",
    minutes: 6,
    base: 24,
    coverage: 1.6,
    bonus: 6,
    environment: "Indoor, light background noise is fine",
    campaign: "open",
    tier: 1,
    image: img("1739066598279-1297113f5c6a"),
    scarcity: "Labs have very few Hindi bargaining conversations.",
    uses: "Shopping assistants that understand how India actually bargains.",
    prompts: [
      {
        id: "s0",
        stem: "Shopkeeper: “नमस्ते जी, क्या चाहिए?”",
        text: "Greet, then ask for 5 kg atta and the price.",
      },
      {
        id: "s1",
        stem: "Shopkeeper: “आशीर्वाद ख़त्म हो गया, दूसरा चलेगा?”",
        text: "React naturally and ask about another brand.",
      },
      {
        id: "s2",
        stem: "Shopkeeper: “ये वाला ₹310 का है।”",
        text: "Bargain politely, the way you would in real life.",
      },
      {
        id: "s3",
        stem: "Shopkeeper: “ठीक है, पेमेंट कैसे करोगे?”",
        text: "Say you will pay by UPI and thank them.",
      },
    ],
  }),
  J({
    id: "j-clinic-hi",
    title: "Clinic front desk",
    lang: "hi",
    format: "INTERVIEW",
    env: "health",
    situation:
      "A receptionist asks you questions to book an appointment. Answer in your own words.",
    minutes: 5,
    base: 20,
    coverage: 1.3,
    bonus: 4,
    environment: "Quiet room",
    campaign: "open",
    tier: 1,
    image: img("1706216710784-a9834756c87f"),
    scarcity: "Health bookings in Hindi are underrepresented.",
    uses: "Clinic helplines that can book you in your own language.",
    prompts: [
      {
        id: "i0",
        stem: "“नमस्ते, सिटी क्लिनिक। किस डॉक्टर से मिलना है?”",
        text: "Say which doctor you need and why.",
      },
      {
        id: "i1",
        stem: "“कल सुबह 10 बजे ठीक रहेगा?”",
        text: "Say whether that time works for you.",
      },
      {
        id: "i2",
        stem: "“अपना नाम और फ़ोन नंबर बता दीजिए।”",
        text: "Give a made-up name and number, not your real ones.",
      },
    ],
  }),
  J({
    id: "j-auto-hi",
    title: "Auto fare haggle",
    lang: "hi",
    format: "SCENARIO",
    env: "travel",
    situation:
      "The driver quotes double the meter fare at night. Get to a fair price without a fight.",
    minutes: 5,
    base: 20,
    coverage: 1.8,
    bonus: 4,
    environment: "Anywhere, traffic sound is welcome",
    campaign: "open",
    tier: 1,
    image: img("1756717131773-63d55976fa6a"),
    scarcity: "Night-time travel talk is rare in the data, so it pays 1.8×.",
    uses: "Ride apps that understand a real fare negotiation.",
    prompts: [
      {
        id: "a0",
        stem: "Driver: “स्टेशन? ₹200 लगेंगे।”",
        text: "Say where you are going and push back on the price.",
      },
      {
        id: "a1",
        stem: "Driver: “रात है, मीटर से नहीं जाऊँगा।”",
        text: "Offer a number you think is fair.",
      },
      {
        id: "a2",
        stem: "Driver: “चलो ₹140, बैठो।”",
        text: "Agree and give a landmark near your stop.",
      },
    ],
  }),
  J({
    id: "j-rail-hi",
    title: "Railway enquiry series",
    lang: "hi",
    format: "SCENARIO",
    env: "travel",
    situation:
      "One delayed train, three conversations: the counter, a stranger on the platform, and the helpline.",
    minutes: 15,
    base: 60,
    coverage: 1.5,
    bonus: 12,
    environment: "Anywhere, station-like noise is welcome",
    campaign: "open",
    tier: 2,
    image: img("1581548708095-7158f2e63857"),
    scarcity: "Long, connected travel conversations are scarce.",
    uses: "Railway helplines that can follow a problem across a whole call.",
    prompts: [
      {
        id: "r0",
        chapter: "At the counter",
        stem: "Clerk: “बोलिए, कौन सी ट्रेन?”",
        text: "Ask about the 12952 to Mumbai and whether it is on time.",
      },
      {
        id: "r1",
        chapter: "At the counter",
        stem: "Clerk: “तीन घंटे लेट है।”",
        text: "React, and ask if you can change your ticket.",
      },
      {
        id: "r2",
        chapter: "On the platform",
        stem: "Stranger: “भैया, ये प्लेटफ़ॉर्म चार है?”",
        text: "Tell them which platform it is and where to wait.",
      },
      {
        id: "r3",
        chapter: "On the platform",
        stem: "An announcement plays. The stranger looks lost.",
        text: "Explain the announcement in your own words.",
      },
      {
        id: "r4",
        chapter: "Calling the helpline",
        stem: "Agent: “139 पर आपका स्वागत है। PNR बताइए।”",
        text: "Read out a made-up 10-digit PNR, slowly.",
      },
      {
        id: "r5",
        chapter: "Calling the helpline",
        stem: "Agent: “रिफ़ंड 5 से 7 दिन में आएगा।”",
        text: "Say whether that works for you and thank them.",
      },
    ],
  }),
  J({
    id: "j-delivery-hi",
    title: "Cold food, late rider",
    lang: "hi",
    format: "SCENARIO",
    env: "food",
    situation:
      "Your delivery arrived 40 minutes late and cold. Call support and ask for a refund.",
    minutes: 5,
    base: 20,
    coverage: 1.4,
    bonus: 4,
    environment: "Indoor",
    campaign: "open",
    tier: 1,
    image: img("1610733661495-4aa6ed9fc6f4"),
    scarcity: "Complaint calls in Hindi are underrepresented.",
    uses: "Support bots that notice when you are annoyed.",
    prompts: [
      {
        id: "d0",
        stem: "Agent: “नमस्ते, बताइए क्या दिक्कत है?”",
        text: "Explain what happened with the order.",
      },
      {
        id: "d1",
        stem: "Agent: “ऑर्डर आईडी बता दीजिए।”",
        text: "Read out a made-up order ID slowly.",
      },
      {
        id: "d2",
        stem: "Agent: “मैं ₹50 का कूपन दे सकता हूँ।”",
        text: "Say whether that is fair and ask for what you want.",
      },
    ],
  }),
  J({
    id: "j-pharmacy-hi",
    title: "At the chemist",
    lang: "hi",
    format: "INTERVIEW",
    env: "health",
    situation:
      "The pharmacist asks about your symptoms before suggesting something for a cough.",
    minutes: 4,
    base: 16,
    coverage: 1.2,
    bonus: 3,
    environment: "Quiet room",
    campaign: "open",
    tier: 1,
    image: img("1613262155980-c9e47252316b"),
    uses: "Pharmacy apps that understand how people describe feeling unwell.",
    prompts: [
      {
        id: "p0",
        stem: "“कब से खाँसी है?”",
        text: "Say how long and how bad it is.",
      },
      {
        id: "p1",
        stem: "“बुखार भी है या सिर्फ़ खाँसी?”",
        text: "Describe how you feel in your own words.",
      },
      {
        id: "p2",
        stem: "“सिरप दूँ या गोली?”",
        text: "Choose one and ask how to take it.",
      },
    ],
  }),
  J({
    id: "j-neighbour-hi",
    title: "Water tank overflow",
    lang: "hi",
    format: "SCENARIO",
    env: "home",
    situation:
      "Your neighbour’s tank has been overflowing onto your balcony all morning. Talk it through.",
    minutes: 6,
    base: 24,
    coverage: 1.3,
    bonus: 4,
    environment: "Home",
    campaign: "open",
    tier: 2,
    image: img("1771328842284-e48b807ef747"),
    uses: "Assistants that can tell polite from annoyed.",
    prompts: [
      {
        id: "n0",
        stem: "Neighbour opens the door: “हाँ जी, बोलिए?”",
        text: "Explain the problem politely but clearly.",
      },
      {
        id: "n1",
        stem: "Neighbour: “अरे, मुझे तो पता ही नहीं था!”",
        text: "Suggest what should be done.",
      },
      {
        id: "n2",
        stem: "Neighbour: “आइए, चाय पीकर जाइए।”",
        text: "Respond warmly and wrap up.",
      },
    ],
  }),
  J({
    id: "j-bank-hi",
    title: "Failed UPI payment",
    lang: "hi",
    format: "INTERVIEW",
    env: "money",
    situation:
      "A helpline agent asks about money that left your account but never reached the shop.",
    minutes: 12,
    base: 48,
    coverage: 1.5,
    bonus: 8,
    environment: "Quiet room",
    campaign: "open",
    tier: 3,
    image: img("1518131296958-df44106fd0ae"),
    scarcity: "Banking vocabulary in Hindi is scarce.",
    uses: "Bank helplines that understand payment disputes.",
    prompts: [],
  }),
  J({
    id: "j-train-hi",
    title: "Delayed train enquiry",
    lang: "hi",
    format: "SCENARIO",
    env: "travel",
    situation: "Ask the station counter about a train running 3 hours late.",
    minutes: 5,
    base: 20,
    coverage: 1.0,
    bonus: 0,
    environment: "Indoor, moderate noise is fine",
    campaign: "full",
    tier: 1,
    image: img("1756717131773-63d55976fa6a"),
    uses: "Railway enquiry systems.",
    turns: 3,
    prompts: [],
  }),
  J({
    id: "j-bill-hi",
    title: "Electricity bill dispute",
    lang: "hi",
    format: "INTERVIEW",
    env: "money",
    situation:
      "Your bill is three times the usual. Answer the complaint desk’s questions.",
    minutes: 6,
    base: 24,
    coverage: 1.1,
    bonus: 0,
    environment: "Quiet room",
    campaign: "oversubscribed",
    tier: 1,
    image: img("1518131296958-df44106fd0ae"),
    uses: "Utility helplines.",
    turns: 3,
    prompts: [],
  }),
  J({
    id: "j-tailor-hi",
    title: "Tailor alterations",
    lang: "hi",
    format: "SCENARIO",
    env: "market",
    situation:
      "Explain to a tailor how you want an old kurta altered before a wedding.",
    minutes: 5,
    base: 20,
    coverage: 1.2,
    bonus: 4,
    environment: "Indoor",
    campaign: "open",
    tier: 2,
    image: img("1739066598279-1297113f5c6a"),
    uses: "Assistants that understand clothing and sizes.",
    prompts: [
      {
        id: "t0",
        stem: "Tailor: “क्या करवाना है इसमें?”",
        text: "Explain the changes you want.",
      },
      {
        id: "t1",
        stem: "Tailor: “शादी कब है? एक हफ़्ता लगेगा।”",
        text: "Say that is too late and ask for sooner.",
      },
      {
        id: "t2",
        stem: "Tailor: “अर्जेंट के ₹100 एक्स्ट्रा लगेंगे।”",
        text: "Accept or negotiate.",
      },
    ],
  }),
  J({
    id: "j-parent-hi",
    title: "School teacher call",
    lang: "hi",
    format: "INTERVIEW",
    env: "home",
    situation:
      "Your child’s class teacher calls with questions about missed homework.",
    minutes: 5,
    base: 20,
    coverage: 1.4,
    bonus: 4,
    environment: "Quiet room",
    campaign: "open",
    tier: 1,
    image: img("1706216710784-a9834756c87f"),
    scarcity: "Parent–teacher calls are rare in the data.",
    uses: "School apps that parents can simply talk to.",
    prompts: [
      {
        id: "h0",
        stem: "“नमस्ते, मैं आरव की क्लास टीचर बोल रही हूँ।”",
        text: "Greet the teacher and ask what happened.",
      },
      {
        id: "h1",
        stem: "“तीन दिन से होमवर्क नहीं आया।”",
        text: "Explain what has been going on at home.",
      },
      {
        id: "h2",
        stem: "“क्या आप शनिवार को मिल सकते हैं?”",
        text: "Say when you can come.",
      },
    ],
  }),
  J({
    id: "j-bus-mr",
    title: "Bus stop directions",
    lang: "mr",
    format: "SCENARIO",
    env: "travel",
    situation: "A stranger asks you which bus goes to the market.",
    minutes: 4,
    base: 16,
    coverage: 1.6,
    bonus: 3,
    environment: "Outdoor is fine",
    campaign: "open",
    tier: 1,
    image: img("1581548708095-7158f2e63857"),
    scarcity: "Marathi directions are underrepresented.",
    uses: "Transit apps that give directions in Marathi.",
    prompts: [
      {
        id: "m0",
        stem: "“भाऊ, मार्केटला कोणती बस जाते?”",
        text: "Give directions in your own words.",
      },
      { id: "m1", stem: "“किती वेळ लागेल?”", text: "Estimate the time." },
      { id: "m2", stem: "They thank you.", text: "Wish them well." },
    ],
  }),
  J({
    id: "j-veg-ta",
    title: "Vegetable market",
    lang: "ta",
    format: "SCENARIO",
    env: "market",
    situation: "Buy vegetables and ask for a better price on tomatoes.",
    minutes: 4,
    base: 16,
    coverage: 1.7,
    bonus: 3,
    environment: "Outdoor is fine",
    campaign: "open",
    tier: 1,
    image: img("1746265055371-d056a70932a7"),
    scarcity: "Market Tamil from smaller towns is scarce.",
    uses: "Shopping assistants that understand Tamil bargaining.",
    prompts: [
      {
        id: "v0",
        stem: "Seller: “வாங்க, என்ன வேணும்?”",
        text: "Ask for tomatoes and onions.",
      },
      {
        id: "v1",
        stem: "Seller: “கிலோ அறுபது ரூபாய்.”",
        text: "Bargain the way you normally would.",
      },
      { id: "v2", stem: "Seller agrees.", text: "Pay and thank them." },
    ],
  }),
  J({
    id: "j-fish-bn",
    title: "Fish market chat",
    lang: "bn",
    format: "SCENARIO",
    env: "food",
    situation: "Pick a fish and ask the seller to clean and cut it.",
    minutes: 4,
    base: 16,
    coverage: 1.6,
    bonus: 3,
    environment: "Market noise is fine",
    campaign: "open",
    tier: 1,
    image: img("1615821430614-3d7d2685e2f2"),
    scarcity: "Kolkata market Bengali is underrepresented.",
    uses: "Assistants that understand everyday Bengali.",
    prompts: [
      {
        id: "f0",
        stem: "Seller: “কী মাছ নেবেন?”",
        text: "Ask what is fresh today.",
      },
      {
        id: "f1",
        stem: "Seller: “আজ রুই ভালো আছে।”",
        text: "Ask the price and how it should be cut.",
      },
      { id: "f2", stem: "Seller: “কেটে-ধুয়ে দেব?”", text: "Answer and pay." },
    ],
  }),
  J({
    id: "j-support-en",
    title: "Phone plan support",
    lang: "en",
    format: "INTERVIEW",
    env: "money",
    situation:
      "An agent asks questions about a data pack that stopped working.",
    minutes: 5,
    base: 20,
    coverage: 1.2,
    bonus: 3,
    environment: "Quiet room",
    campaign: "open",
    tier: 1,
    image: img("1610733661495-4aa6ed9fc6f4"),
    uses: "Telecom support that understands Indian English.",
    prompts: [
      {
        id: "x0",
        stem: "“Hi, thanks for calling. What seems to be the problem?”",
        text: "Describe the issue in your own words.",
      },
      {
        id: "x1",
        stem: "“When did you last recharge?”",
        text: "Answer with a rough date.",
      },
      {
        id: "x2",
        stem: "“I can add 1 GB for today. Is that okay?”",
        text: "Say whether that works.",
      },
    ],
  }),
]

export const CONSENT_COPY: Record<Lang, {
  title: string
  points: [string, string][]
  agree: string
}> = {
  hi: {
    title: "रिकॉर्ड करने से पहले, आपकी सहमति",
    points: [
      [
        "क्या रिकॉर्ड होगा",
        "सिर्फ़ वही आवाज़ जो आप किसी जॉब में रिकॉर्ड करते हैं। बैकग्राउंड में कुछ नहीं।",
      ],
      ["कौन सुन सकता है", "Feul के गुणवत्ता जाँचकर्ता और वह AI लैब जिसने जॉब दिया है।"],
      ["क्यों", "AI को भारतीय भाषाएँ और बोलियाँ बेहतर समझना सिखाने के लिए।"],
      [
        "आपके अधिकार",
        "आप कभी भी अपनी आवाज़ का डेटा हटा सकते हैं। जो पैसा मिल चुका है, वह वापस नहीं लिया जाएगा।",
      ],
    ],
    agree: "मैं सहमत हूँ",
  },
  mr: {
    title: "रेकॉर्डिंगपूर्वी, तुमची संमती",
    points: [
      ["काय रेकॉर्ड होईल", "फक्त तुम्ही जॉबमध्ये रेकॉर्ड केलेला आवाज."],
      ["कोण ऐकू शकतो", "Feul चे गुणवत्ता तपासक आणि जॉब देणारी AI लॅब."],
      ["का", "AI ला भारतीय भाषा चांगल्या समजाव्यात म्हणून."],
      ["तुमचे अधिकार", "तुम्ही कधीही डेटा हटवू शकता. मिळालेले पैसे परत घेतले जाणार नाहीत."],
    ],
    agree: "मी सहमत आहे",
  },
  ta: {
    title: "பதிவு செய்வதற்கு முன், உங்கள் ஒப்புதல்",
    points: [
      ["என்ன பதிவாகும்", "ஒரு வேலையில் நீங்கள் பதிவு செய்யும் குரல் மட்டும்."],
      ["யார் கேட்கலாம்", "Feul தர சரிபார்ப்பாளர்கள் மற்றும் வேலை வழங்கிய AI ஆய்வகம்."],
      ["ஏன்", "இந்திய மொழிகளை AI நன்றாகப் புரிந்துகொள்ள."],
      [
        "உங்கள் உரிமைகள்",
        "எப்போது வேண்டுமானாலும் தரவை நீக்கலாம். பெற்ற பணம் திரும்பப் பெறப்படாது.",
      ],
    ],
    agree: "நான் ஒப்புக்கொள்கிறேன்",
  },
  bn: {
    title: "রেকর্ড করার আগে, আপনার সম্মতি",
    points: [
      ["কী রেকর্ড হবে", "শুধু কাজের মধ্যে আপনি যা রেকর্ড করেন।"],
      ["কে শুনতে পারে", "Feul-এর মান যাচাইকারী এবং যে AI ল্যাব কাজটি দিয়েছে।"],
      ["কেন", "AI যাতে ভারতীয় ভাষা ভালো বোঝে।"],
      ["আপনার অধিকার", "যেকোনো সময় ডেটা মুছতে পারেন। পাওয়া টাকা ফেরত নেওয়া হবে না।"],
    ],
    agree: "আমি সম্মত",
  },
  en: {
    title: "Before you record, your consent",
    points: [
      [
        "What is recorded",
        "Only the voice you record inside a job. Nothing in the background.",
      ],
      [
        "Who can access it",
        "Feul quality reviewers and the AI lab that posted the job.",
      ],
      ["Why", "To help AI understand Indian languages and dialects."],
      [
        "Your rights",
        "You can delete your voice data at any time. Money already paid is never clawed back.",
      ],
    ],
    agree: "I agree",
  },
}

const base = (): State => ({
  stage: "landing",
  name: "Priya",
  lang: "hi",
  consent: false,
  consentLang: null,
  mic: "unknown",
  tab: "home",
  stack: [],
  sheet: null,
  jobs: JOBS.map((j) => ({ ...j })),
  saved: [],
  session: null,
  submissions: [],
  ledger: [],
  available: 0,
  upi: null,
  withdrawal: null,
  vault: [],
  notices: [],
  supplyEmpty: false,
  checklist: { alerts: false, profile: false },
  toast: null,
  sim: { failUpload: false, upiResult: "matched", realMic: false },
})

const onboarded = (s: State): State => ({
  ...s,
  stage: "done",
  consent: true,
  consentLang: s.lang,
  mic: "granted",
})

export const makeSession = (
  job: Job,
  over: Partial<Session> = {},
): Session => ({
  jobId: job.id,
  locked: {
    base: job.base,
    coverage: job.coverage,
    bonus: job.bonus,
    total: jobTotal(job),
  },
  clips: job.prompts.map((p, i) => ({
    id: `${job.id}-${p.id}`,
    prompt: p,
    state: "ready",
    secs: 0,
    seed: i * 7 + 3,
  })),
  index: 0,
  status: "capturing",
  resumeLeft: "23h 40m",
  calibrated: false,
  roomConsented: false,
  honoured: false,
  ...over,
})

const SHOP = JOBS.find((j) => j.id === "j-shop-hi")!
const CHAI = JOBS.find((j) => j.id === "j-chai-hi")!
const CLINIC = JOBS.find((j) => j.id === "j-clinic-hi")!

const returningHistory = (s: State): State => ({
  ...s,
  available: 82,
  upi: { vpa: "priya.sharma@okaxis", name: "PRIYA SHARMA" },
  checklist: { alerts: true, profile: true },
  ledger: [
    {
      id: "L1",
      kind: "earning",
      title: "Kirana price check",
      when: "Today, 9:12 am",
      amount: 38,
      state: "pending",
      note: "With reviewers · usually back within 24h",
      day: 0,
    },
    {
      id: "L2",
      kind: "earning",
      title: "Chai stall regular",
      when: "Yesterday, 7:40 pm",
      amount: 24,
      state: "settled",
      day: 1,
      mins: 4,
    },
    {
      id: "L3",
      kind: "bonus",
      title: "Quality bonus · Chai stall regular",
      when: "Yesterday, 7:40 pm",
      amount: 4,
      state: "settled",
      note: "Clear, natural, no retakes needed",
      day: 1,
    },
    {
      id: "L4",
      kind: "earning",
      title: "Clinic front desk",
      when: "Mon, 6:05 pm",
      amount: 26,
      state: "settled",
      day: 3,
      mins: 5,
    },
    {
      id: "L5",
      kind: "earning",
      title: "At the chemist",
      when: "Sun, 11:20 am",
      amount: 19,
      state: "honoured",
      note: "Campaign closed after you submitted. Your work was still paid.",
      day: 4,
      mins: 4,
    },
    {
      id: "L6",
      kind: "withdrawal",
      title: "Withdrawal to priya.sharma@okaxis",
      when: "Sat, 3:10 pm",
      amount: -100,
      state: "settled",
      note: "UTR 412893017755",
      day: 5,
    },
  ],
  submissions: [
    {
      id: "S-shop",
      jobId: SHOP.id,
      total: jobTotal(SHOP),
      status: "under_review",
      clips: SHOP.prompts.map((p, i) => ({
        id: `S-shop-${i}`,
        prompt: p,
        state: "under_review",
        seed: i * 5,
        secs: 38 + i * 6,
      })),
      submittedAt: "Today, 9:12 am",
      waitReason: "Usually back within 24h",
      honoured: false,
    },
  ],
  vault: [
    {
      id: "V1",
      title: "Chai stall regular · Hindi",
      detail: "4 turns · 2 min 10 s",
      paid: 28,
      status: "active",
    },
    {
      id: "V2",
      title: "Clinic front desk · Hindi",
      detail: "3 turns · 3 min 40 s",
      paid: 26,
      status: "active",
    },
    {
      id: "V3",
      title: "Kirana price check · Hindi",
      detail: "4 turns · under review",
      paid: 0,
      status: "active",
    },
  ],
  notices: [
    {
      id: "N1",
      title: "Submission received",
      body: "Kirana price check is with reviewers. ₹38 pending.",
      when: "9:12 am",
      target: { name: "submission", id: "S-shop" },
      unread: true,
    },
    {
      id: "N2",
      title: "Payment paid",
      body: "₹100 reached priya.sharma@okaxis. UTR 412893017755.",
      when: "Sat",
      target: { tab: "wallet" },
      unread: false,
    },
  ],
})

export type ScenarioKey = "fresh" | "new" | "returning" | "active" | "uploadFailed" | "expired" | "repairLines" | "noWork" | "withdrawProcessing"

export const SCENARIOS: {
  key: ScenarioKey
  label: string
}[] = [
  { key: "fresh", label: "Fresh install (onboarding)" },
  { key: "new", label: "New contributor Home" },
  { key: "returning", label: "Returning · ₹82 available" },
  { key: "active", label: "Active session (resume)" },
  { key: "uploadFailed", label: "Upload failed" },
  { key: "expired", label: "Resume window expired" },
  { key: "repairLines", label: "Repair · Scenario turn (3/4)" },
  { key: "noWork", label: "No matching work" },
  { key: "withdrawProcessing", label: "Withdrawal processing" },
]

export function scenario(key: ScenarioKey): State {
  const s = base()
  switch (key) {
    case "fresh":
      return s
    case "new":
      return onboarded(s)
    case "returning":
      return returningHistory(onboarded(s))
    case "active": {
      const st = returningHistory(onboarded(s))
      const sess = makeSession(CHAI, { calibrated: true, index: 3 })
      sess.clips = sess.clips.map((c, i) =>
        i < 3 ? { ...c, state: "recorded_local", secs: 4 + i } : c,
      )
      return { ...st, session: sess }
    }
    case "uploadFailed": {
      const st = returningHistory(onboarded(s))
      const sess = makeSession(CHAI, {
        calibrated: true,
        status: "upload_failed",
        index: 3,
      })
      sess.clips = sess.clips.map((c, i) => ({
        ...c,
        state: "upload_failed",
        secs: 4 + (i % 3),
      }))
      return { ...st, session: sess }
    }
    case "expired": {
      const st = returningHistory(onboarded(s))
      const sess = makeSession(CLINIC, {
        calibrated: true,
        status: "expired",
        index: 2,
        resumeLeft: "0m",
      })
      sess.clips = sess.clips.map((c, i) =>
        i < 2 ? { ...c, state: "recorded_local", secs: 30 } : c,
      )
      return { ...st, session: sess }
    }
    case "repairLines": {
      const st = returningHistory(onboarded(s))
      const sub: Submission = {
        id: "S-lines",
        jobId: CHAI.id,
        total: jobTotal(CHAI),
        status: "repair_required",
        clips: CHAI.prompts.map((p, i) => ({
          id: `S-lines-${i}`,
          prompt: p,
          state: i === 1 ? "repair_required" : "accepted",
          seed: i * 3,
          secs: 22 + i * 5,
        })),
        repair: {
          code: "OFF_SCRIPT_TURN",
          reason: "Your reply didn’t answer the owner",
          why: "The owner asked about strong chai, but the reply was about the weather, so the turn no longer fits the conversation.",
          example: "“हाँ, कड़क ही बना दो, आज नींद पूरी नहीं हुई।”",
          tip: "Listen to the owner’s line again, then reply to exactly that. Your own words are fine.",
          mode: "clip",
        },
        submittedAt: "Yesterday, 8:02 pm",
        waitReason: "",
        honoured: false,
      }
      return {
        ...st,
        submissions: [sub, ...st.submissions],
        notices: [
          {
            id: "N0",
            title: "One turn needs a retake",
            body: "Chai stall regular: 3 of 4 accepted. Redo 1 turn to release ₹24.",
            when: "8:40 am",
            target: { name: "submission", id: "S-lines" },
            unread: true,
          },
          ...st.notices,
        ],
      }
    }
    case "noWork":
      return {
        ...returningHistory(onboarded(s)),
        supplyEmpty: true,
        submissions: [],
      }
    case "withdrawProcessing": {
      const st = returningHistory(onboarded(s))
      return {
        ...st,
        available: 20,
        withdrawal: {
          id: "W-2231",
          amount: 100,
          vpa: "priya.sharma@okaxis",
          status: "processing",
          requestedAt: "Today, 10:02 am",
          expected: "by tomorrow, 6 pm (1 working day)",
        },
        ledger: [
          {
            id: "LW",
            kind: "withdrawal",
            title: "Withdrawal to priya.sharma@okaxis",
            when: "Today, 10:02 am",
            amount: -100,
            state: "processing",
            note: "Payment processing · bank has not confirmed yet",
            day: 0,
          },
          ...st.ledger,
        ],
      }
    }
  }
}
