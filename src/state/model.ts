export type Lang = 'hi' | 'mr' | 'ta' | 'bn' | 'en'
export type Format = 'LINES' | 'SCENARIO' | 'INTERVIEW' | 'ROOM'
export type Tab = 'home' | 'jobs' | 'wallet'
export type Env = 'market' | 'food' | 'travel' | 'health' | 'money' | 'home'

// Scenes are the primary way work is organised: where the conversation happens.
export const ENVS: Record<Env, { label: string; short: string; line: string }> = {
  market: { label: 'Shops & markets', short: 'Markets', line: 'Bargain, ask, pay' },
  food: { label: 'Food & chai', short: 'Food', line: 'Order, complain, chat' },
  travel: { label: 'Travel & transit', short: 'Travel', line: 'Fares, delays, directions' },
  health: { label: 'Clinics & pharmacy', short: 'Health', line: 'Book, describe, ask' },
  money: { label: 'Banks & bills', short: 'Money', line: 'Explain, dispute, confirm' },
  home: { label: 'Home & neighbours', short: 'Home', line: 'Everyday talk at home' },
}
export type OnboardingStage = 'landing' | 'auth' | 'otp' | 'language' | 'consent' | 'mic' | 'done'

export const LANGS: Record<Lang, { native: string; name: string; sample: string }> = {
  hi: { native: 'हिन्दी', name: 'Hindi', sample: 'नमस्ते, आज दुकान कितने बजे खुलेगी?' },
  mr: { native: 'मराठी', name: 'Marathi', sample: 'नमस्कार, आज बाजार किती वाजता उघडेल?' },
  ta: { native: 'தமிழ்', name: 'Tamil', sample: 'வணக்கம், இன்று கடை எப்போது திறக்கும்?' },
  bn: { native: 'বাংলা', name: 'Bengali', sample: 'নমস্কার, আজ দোকান কখন খুলবে?' },
  en: { native: 'English', name: 'English', sample: 'Hello, what time does the shop open today?' },
}

export const FORMAT_LABEL: Record<Format, string> = {
  LINES: 'Lines',
  SCENARIO: 'Scenario',
  INTERVIEW: 'Interview',
  ROOM: 'Room',
}

export type Prompt = { id: string; text: string; stem?: string; speaker?: string }

export type Job = {
  id: string
  title: string
  situation: string
  lang: Lang
  format: Format
  env: Env
  minutes: number
  base: number
  coverage: number
  bonus: number
  turns: number
  environment: string
  campaign: 'open' | 'full' | 'oversubscribed' | 'closed'
  tier: 1 | 2 | 3
  image: string
  prompts: Prompt[]
  participants?: number
}

export const jobTotal = (j: Pick<Job, 'base' | 'coverage' | 'bonus'>) =>
  Math.round(j.base * j.coverage) + j.bonus

export type ClipState =
  | 'ready'
  | 'recording'
  | 'recorded_local'
  | 'uploading'
  | 'upload_failed'
  | 'submitted'
  | 'under_review'
  | 'accepted'
  | 'repair_required'
  | 'repaired'

export type Clip = { id: string; prompt: Prompt; state: ClipState; secs: number; seed: number; retaken?: boolean }

export type Session = {
  jobId: string
  // Payout is locked when the session starts.
  locked: { base: number; coverage: number; bonus: number; total: number }
  clips: Clip[]
  index: number
  status: 'capturing' | 'reviewing' | 'uploading' | 'upload_failed' | 'expired'
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
  status: 'under_review' | 'repair_required' | 'appeal' | 'approved'
  clips: { id: string; prompt: Prompt; state: 'under_review' | 'accepted' | 'repair_required' | 'repaired'; seed: number; secs: number }[]
  repair?: {
    reason: string
    code: string
    why: string
    example: string
    tip: string
    mode: 'clip' | 'full_take' | 'participant_consent'
  }
  submittedAt: string
  waitReason: string
  honoured: boolean
}

export type LedgerKind = 'earning' | 'bonus' | 'withdrawal'
export type LedgerEntry = {
  id: string
  kind: LedgerKind
  title: string
  when: string
  amount: number
  state: 'pending' | 'settled' | 'failed' | 'appeal' | 'deleted_after_revocation' | 'honoured' | 'processing'
  note?: string
  day: number // 0 = today ... 6
}

export type Withdrawal = {
  id: string
  amount: number
  vpa: string
  status: 'requested' | 'processing' | 'delayed' | 'paid' | 'failed' | 'hold'
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
  status: 'active' | 'revoke_requested' | 'revoke_processing' | 'revoked' | 'delete_requested' | 'delete_processing' | 'deleted'
  receipt?: string
}

export type Notice = { id: string; title: string; body: string; when: string; target: View | { tab: Tab }; unread: boolean }

export type View =
  | { name: 'detail'; jobId: string }
  | { name: 'studio' }
  | { name: 'review' }
  | { name: 'submission'; id: string }
  | { name: 'credited'; amount: number; title: string; pending?: number }
  | { name: 'withdraw' }
  | { name: 'withdrawal' }
  | { name: 'profile' }
  | { name: 'consent' }
  | { name: 'mic' }

export type Sheet = null | 'notifications' | 'filters' | 'help' | 'edit' | 'prefs' | 'discard' | 'leave' | 'upi'

export type State = {
  scene?: Env | 'ALL' | 'SAVED'
  stage: OnboardingStage
  name: string
  lang: Lang
  /** Every language the contributor records in; `lang` is the first of these. UI copy stays English. */
  langs?: Lang[]
  consent: boolean
  consentLang: Lang | null
  mic: 'unknown' | 'granted' | 'denied'
  tab: Tab
  stack: View[]
  sheet: Sheet
  jobs: Job[]
  saved: string[]
  session: Session | null
  submissions: Submission[]
  ledger: LedgerEntry[]
  available: number
  upi: null | { vpa: string; name: string }
  withdrawal: Withdrawal | null
  vault: VaultItem[]
  notices: Notice[]
  supplyEmpty: boolean
  checklist: { alerts: boolean; profile: boolean }
  toast: string | null
  // Prototype switches for failure branches
  sim: { failUpload: boolean; upiResult: 'matched' | 'mismatch' | 'unavailable' }
}

const img = (id: string) => `https://images.unsplash.com/photo-${id}?w=800&h=500&fit=crop&auto=format`


export const JOBS: Job[] = [
  {
    id: 'j-chai-hi',
    title: 'Chai stall regular',
    situation: 'You stop at your usual chai stall and the owner wants to chat while the kettle boils.',
    lang: 'hi',
    format: 'SCENARIO',
    env: 'food',
    minutes: 4,
    base: 24,
    coverage: 1.5,
    bonus: 0,
    turns: 4,
    environment: 'Indoor or outdoor, street sound is fine',
    campaign: 'open',
    tier: 1,
    image: img('1478737270239-2f02b77fc618'),
    prompts: [
      { id: 'c0', stem: 'Owner: "आइए भैया/दीदी, रोज़ वाली चाय?"', text: 'Greet them like a regular and order your usual.' },
      { id: 'c1', stem: 'Owner: "आज दूध थोड़ा कम है, कड़क चलेगी?"', text: 'Say how you feel about strong chai.' },
      { id: 'c2', stem: 'Owner asks how work is going these days.', text: 'Tell them in two or three sentences, like you would a friend.' },
      { id: 'c3', stem: 'Owner: "₹15 हुए।"', text: 'Pay by UPI and say bye.' },
    ],
  },
  {
    id: 'j-shop-hi',
    title: 'Kirana price check',
    situation: 'Buying groceries at a local shop. An item is out of stock and you need to bargain on the replacement.',
    lang: 'hi',
    format: 'SCENARIO',
    env: 'market',
    minutes: 6,
    base: 26,
    coverage: 1.6,
    bonus: 0,
    turns: 4,
    environment: 'Indoor, light background noise is fine',
    campaign: 'open',
    tier: 1,
    image: img('1739066598279-1297113f5c6a'),
    prompts: [
      { id: 's0', stem: 'Shopkeeper greets you. Ask for atta and its price.', text: 'Greet, then ask for 5 kg atta and the price.' },
      { id: 's1', stem: 'Shopkeeper: "Aashirvaad khatam ho gaya, dusra chalega?"', text: 'React naturally and ask about another brand.' },
      { id: 's2', stem: 'Shopkeeper quotes ₹310.', text: 'Bargain politely, the way you would in real life.' },
      { id: 's3', stem: 'Shopkeeper agrees and asks how you will pay.', text: 'Say you will pay by UPI and thank them.' },
    ],
  },
  {
    id: 'j-clinic-hi',
    title: 'Clinic front desk',
    situation: 'A receptionist asks you questions to book an appointment. Answer in your own words.',
    lang: 'hi',
    format: 'INTERVIEW',
    env: 'health',
    minutes: 5,
    base: 28,
    coverage: 1.3,
    bonus: 4,
    turns: 3,
    environment: 'Quiet room',
    campaign: 'open',
    tier: 1,
    image: img('1706216710784-a9834756c87f'),
    prompts: [
      { id: 'i0', stem: '“नमस्ते, सिटी क्लिनिक। किस डॉक्टर से मिलना है?”', text: 'Say which doctor you need and why.' },
      { id: 'i1', stem: '“कल सुबह 10 बजे ठीक रहेगा?”', text: 'Say whether that time works for you.' },
      { id: 'i2', stem: '“अपना नाम और फ़ोन नंबर बता दीजिए।”', text: 'Give a made-up name and number, not your real ones.' },
    ],
  },
  {
    id: 'j-auto-hi',
    title: 'Auto fare haggle',
    situation: 'The driver quotes double the meter fare at night. Get to a fair price without a fight.',
    lang: 'hi',
    format: 'SCENARIO',
    env: 'travel',
    minutes: 5,
    base: 24,
    coverage: 1.8,
    bonus: 0,
    turns: 3,
    environment: 'Anywhere, traffic sound is welcome',
    campaign: 'open',
    tier: 1,
    image: img('1756717131773-63d55976fa6a'),
    prompts: [
      { id: 'a0', stem: 'Driver: "स्टेशन? ₹200 लगेंगे।"', text: 'Say where you are going and push back on the price.' },
      { id: 'a1', stem: 'Driver: "रात है, मीटर से नहीं जाऊँगा।"', text: 'Offer a number you think is fair.' },
      { id: 'a2', stem: 'Driver agrees at ₹140.', text: 'Agree and give a landmark near your stop.' },
    ],
  },
  {
    id: 'j-delivery-hi',
    title: 'Cold food, late rider',
    situation: 'Your delivery arrived 40 minutes late and cold. Call support and ask for a refund.',
    lang: 'hi',
    format: 'SCENARIO',
    env: 'food',
    minutes: 5,
    base: 26,
    coverage: 1.4,
    bonus: 0,
    turns: 3,
    environment: 'Indoor',
    campaign: 'open',
    tier: 1,
    image: img('1610733661495-4aa6ed9fc6f4'),
    prompts: [
      { id: 'd0', stem: 'Agent: "नमस्ते, बताइए क्या दिक्कत है?"', text: 'Explain what happened with the order.' },
      { id: 'd1', stem: 'Agent asks for the order ID.', text: 'Read out a made-up order ID slowly.' },
      { id: 'd2', stem: 'Agent offers a ₹50 coupon instead of a refund.', text: 'Say whether that is fair and ask for what you want.' },
    ],
  },
  {
    id: 'j-pharmacy-hi',
    title: 'At the chemist',
    situation: 'The pharmacist asks about your symptoms before suggesting something for a cough.',
    lang: 'hi',
    format: 'INTERVIEW',
    env: 'health',
    minutes: 4,
    base: 24,
    coverage: 1.2,
    bonus: 0,
    turns: 3,
    environment: 'Quiet room',
    campaign: 'open',
    tier: 1,
    image: img('1613262155980-c9e47252316b'),
    prompts: [
      { id: 'p0', stem: '“कब से खाँसी है?”', text: 'Say how long and how bad it is.' },
      { id: 'p1', stem: '“बुखार भी है या सिर्फ़ खाँसी?”', text: 'Describe how you feel in your own words.' },
      { id: 'p2', stem: '“सिरप दूँ या गोली?”', text: 'Choose one and ask how to take it.' },
    ],
  },
  {
    id: 'j-neighbour-hi',
    title: 'Water tank overflow',
    situation: 'Your neighbour’s tank has been overflowing onto your balcony all morning. Talk it through.',
    lang: 'hi',
    format: 'SCENARIO',
    env: 'home',
    minutes: 6,
    base: 26,
    coverage: 1.3,
    bonus: 0,
    turns: 3,
    environment: 'Home',
    campaign: 'open',
    tier: 2,
    image: img('1771328842284-e48b807ef747'),
    prompts: [
      { id: 'n0', stem: 'Neighbour opens the door: "हाँ जी, बोलिए?"', text: 'Explain the problem politely but clearly.' },
      { id: 'n1', stem: 'Neighbour: "अरे, मुझे तो पता ही नहीं था!"', text: 'Suggest what should be done.' },
      { id: 'n2', stem: 'Neighbour offers chai to make up for it.', text: 'Respond warmly and wrap up.' },
    ],
  },
  {
    id: 'j-bank-hi',
    title: 'Failed UPI payment',
    situation: 'A helpline agent asks about money that left your account but never reached the shop.',
    lang: 'hi',
    format: 'INTERVIEW',
    env: 'money',
    minutes: 7,
    base: 34,
    coverage: 1.5,
    bonus: 0,
    turns: 3,
    environment: 'Quiet room',
    campaign: 'open',
    tier: 3,
    image: img('1518131296958-df44106fd0ae'),
    prompts: [],
  },
  {
    id: 'j-rail-hi',
    title: 'Delayed train enquiry',
    situation: 'Ask the station counter about a train running 3 hours late.',
    lang: 'hi',
    format: 'SCENARIO',
    env: 'travel',
    minutes: 5,
    base: 26,
    coverage: 1.0,
    bonus: 0,
    turns: 3,
    environment: 'Indoor, moderate noise is fine',
    campaign: 'full',
    tier: 1,
    image: img('1756717131773-63d55976fa6a'),
    prompts: [],
  },
  {
    id: 'j-bill-hi',
    title: 'Electricity bill dispute',
    situation: 'Your bill is three times the usual. Answer the complaint desk’s questions.',
    lang: 'hi',
    format: 'INTERVIEW',
    env: 'money',
    minutes: 6,
    base: 30,
    coverage: 1.1,
    bonus: 0,
    turns: 3,
    environment: 'Quiet room',
    campaign: 'oversubscribed',
    tier: 1,
    image: img('1518131296958-df44106fd0ae'),
    prompts: [],
  },
  {
    id: 'j-tailor-hi',
    title: 'Tailor alterations',
    situation: 'Explain to a tailor how you want an old kurta altered before a wedding.',
    lang: 'hi',
    format: 'SCENARIO',
    env: 'market',
    minutes: 5,
    base: 26,
    coverage: 1.2,
    bonus: 0,
    turns: 3,
    environment: 'Indoor',
    campaign: 'open',
    tier: 2,
    image: img('1739066598279-1297113f5c6a'),
    prompts: [
      { id: 't0', stem: 'Tailor: "क्या करवाना है इसमें?"', text: 'Explain the changes you want.' },
      { id: 't1', stem: 'Tailor: "शादी कब है? एक हफ़्ता लगेगा।"', text: 'Say that is too late and ask for sooner.' },
      { id: 't2', stem: 'Tailor asks for ₹100 extra for urgent work.', text: 'Accept or negotiate.' },
    ],
  },
  {
    id: 'j-parent-hi',
    title: 'School teacher call',
    situation: 'Your child’s class teacher calls with questions about missed homework.',
    lang: 'hi',
    format: 'INTERVIEW',
    env: 'home',
    minutes: 5,
    base: 28,
    coverage: 1.4,
    bonus: 0,
    turns: 3,
    environment: 'Quiet room',
    campaign: 'open',
    tier: 1,
    image: img('1706216710784-a9834756c87f'),
    prompts: [
      { id: 'h0', stem: '“नमस्ते, मैं आरव की क्लास टीचर बोल रही हूँ।”', text: 'Greet the teacher and ask what happened.' },
      { id: 'h1', stem: '“तीन दिन से होमवर्क नहीं आया।”', text: 'Explain what has been going on at home.' },
      { id: 'h2', stem: '“क्या आप शनिवार को मिल सकते हैं?”', text: 'Say when you can come.' },
    ],
  },
  {
    id: 'j-bus-mr',
    title: 'Bus stop directions',
    situation: 'A stranger asks you which bus goes to the market.',
    lang: 'mr',
    format: 'SCENARIO',
    env: 'travel',
    minutes: 4,
    base: 24,
    coverage: 1.6,
    bonus: 0,
    turns: 3,
    environment: 'Outdoor is fine',
    campaign: 'open',
    tier: 1,
    image: img('1581548708095-7158f2e63857'),
    prompts: [
      { id: 'm0', stem: '“भाऊ, मार्केटला कोणती बस जाते?”', text: 'Give directions in your own words.' },
      { id: 'm1', stem: '“किती वेळ लागेल?”', text: 'Estimate the time.' },
      { id: 'm2', stem: 'They thank you.', text: 'Wish them well.' },
    ],
  },
  {
    id: 'j-veg-ta',
    title: 'Vegetable market',
    situation: 'Buy vegetables and ask for a better price on tomatoes.',
    lang: 'ta',
    format: 'SCENARIO',
    env: 'market',
    minutes: 4,
    base: 24,
    coverage: 1.7,
    bonus: 0,
    turns: 3,
    environment: 'Outdoor is fine',
    campaign: 'open',
    tier: 1,
    image: img('1746265055371-d056a70932a7'),
    prompts: [
      { id: 'v0', stem: 'Seller: “வாங்க, என்ன வேணும்?”', text: 'Ask for tomatoes and onions.' },
      { id: 'v1', stem: 'Seller quotes ₹60 a kilo.', text: 'Bargain the way you normally would.' },
      { id: 'v2', stem: 'Seller agrees.', text: 'Pay and thank them.' },
    ],
  },
  {
    id: 'j-fish-bn',
    title: 'Fish market chat',
    situation: 'Pick a fish and ask the seller to clean and cut it.',
    lang: 'bn',
    format: 'SCENARIO',
    env: 'food',
    minutes: 4,
    base: 24,
    coverage: 1.6,
    bonus: 0,
    turns: 3,
    environment: 'Market noise is fine',
    campaign: 'open',
    tier: 1,
    image: img('1615821430614-3d7d2685e2f2'),
    prompts: [
      { id: 'f0', stem: 'Seller: “কী মাছ নেবেন?”', text: 'Ask what is fresh today.' },
      { id: 'f1', stem: 'Seller recommends rui.', text: 'Ask the price and how it should be cut.' },
      { id: 'f2', stem: 'Seller asks if you want it cleaned.', text: 'Answer and pay.' },
    ],
  },
  {
    id: 'j-support-en',
    title: 'Phone plan support',
    situation: 'An agent asks questions about a data pack that stopped working.',
    lang: 'en',
    format: 'INTERVIEW',
    env: 'money',
    minutes: 5,
    base: 26,
    coverage: 1.2,
    bonus: 0,
    turns: 3,
    environment: 'Quiet room',
    campaign: 'open',
    tier: 1,
    image: img('1610733661495-4aa6ed9fc6f4'),
    prompts: [
      { id: 'x0', stem: '“Hi, thanks for calling. What seems to be the problem?”', text: 'Describe the issue in your own words.' },
      { id: 'x1', stem: '“When did you last recharge?”', text: 'Answer with a rough date.' },
      { id: 'x2', stem: '“I can add 1 GB for today. Is that okay?”', text: 'Say whether that works.' },
    ],
  },
]

export const CONSENT_COPY: Record<Lang, { title: string; points: [string, string][]; agree: string }> = {
  hi: {
    title: 'रिकॉर्ड करने से पहले, आपकी सहमति',
    points: [
      ['क्या रिकॉर्ड होगा', 'सिर्फ़ वही आवाज़ जो आप किसी जॉब में रिकॉर्ड करते हैं। बैकग्राउंड में कुछ नहीं।'],
      ['कौन सुन सकता है', 'Feul के गुणवत्ता जाँचकर्ता और वह AI लैब जिसने जॉब दिया है।'],
      ['क्यों', 'AI को भारतीय भाषाएँ और बोलियाँ बेहतर समझना सिखाने के लिए।'],
      ['आपके अधिकार', 'आप कभी भी अपनी आवाज़ का डेटा हटा सकते हैं। जो पैसा मिल चुका है, वह वापस नहीं लिया जाएगा।'],
    ],
    agree: 'मैं सहमत हूँ',
  },
  mr: {
    title: 'रेकॉर्डिंगपूर्वी, तुमची संमती',
    points: [
      ['काय रेकॉर्ड होईल', 'फक्त तुम्ही जॉबमध्ये रेकॉर्ड केलेला आवाज.'],
      ['कोण ऐकू शकतो', 'Feul चे गुणवत्ता तपासक आणि जॉब देणारी AI लॅब.'],
      ['का', 'AI ला भारतीय भाषा चांगल्या समजाव्यात म्हणून.'],
      ['तुमचे अधिकार', 'तुम्ही कधीही डेटा हटवू शकता. मिळालेले पैसे परत घेतले जाणार नाहीत.'],
    ],
    agree: 'मी सहमत आहे',
  },
  ta: {
    title: 'பதிவு செய்வதற்கு முன், உங்கள் ஒப்புதல்',
    points: [
      ['என்ன பதிவாகும்', 'ஒரு வேலையில் நீங்கள் பதிவு செய்யும் குரல் மட்டும்.'],
      ['யார் கேட்கலாம்', 'Feul தர சரிபார்ப்பாளர்கள் மற்றும் வேலை வழங்கிய AI ஆய்வகம்.'],
      ['ஏன்', 'இந்திய மொழிகளை AI நன்றாகப் புரிந்துகொள்ள.'],
      ['உங்கள் உரிமைகள்', 'எப்போது வேண்டுமானாலும் தரவை நீக்கலாம். பெற்ற பணம் திரும்பப் பெறப்படாது.'],
    ],
    agree: 'நான் ஒப்புக்கொள்கிறேன்',
  },
  bn: {
    title: 'রেকর্ড করার আগে, আপনার সম্মতি',
    points: [
      ['কী রেকর্ড হবে', 'শুধু কাজের মধ্যে আপনি যা রেকর্ড করেন।'],
      ['কে শুনতে পারে', 'Feul-এর মান যাচাইকারী এবং যে AI ল্যাব কাজটি দিয়েছে।'],
      ['কেন', 'AI যাতে ভারতীয় ভাষা ভালো বোঝে।'],
      ['আপনার অধিকার', 'যেকোনো সময় ডেটা মুছতে পারেন। পাওয়া টাকা ফেরত নেওয়া হবে না।'],
    ],
    agree: 'আমি সম্মত',
  },
  en: {
    title: 'Before you record, your consent',
    points: [
      ['What is recorded', 'Only the voice you record inside a job. Nothing in the background.'],
      ['Who can access it', 'Feul quality reviewers and the AI lab that posted the job.'],
      ['Why', 'To help AI understand Indian languages and dialects.'],
      ['Your rights', 'You can delete your voice data at any time. Money already paid is never clawed back.'],
    ],
    agree: 'I agree',
  },
}

const base = (): State => ({
  stage: 'landing',
  name: 'Priya',
  lang: 'hi',
  consent: false,
  consentLang: null,
  mic: 'unknown',
  tab: 'home',
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
  sim: { failUpload: false, upiResult: 'matched' },
})

const onboarded = (s: State): State => ({ ...s, stage: 'done', consent: true, consentLang: s.lang, mic: 'granted' })

export const makeSession = (job: Job, over: Partial<Session> = {}): Session => ({
  jobId: job.id,
  locked: { base: job.base, coverage: job.coverage, bonus: job.bonus, total: jobTotal(job) },
  clips: job.prompts.map((p, i) => ({ id: `${job.id}-${p.id}`, prompt: p, state: 'ready', secs: 0, seed: i * 7 + 3 })),
  index: 0,
  status: 'capturing',
  resumeLeft: '23h 40m',
  calibrated: false,
  roomConsented: false,
  honoured: false,
  ...over,
})

const returningHistory = (s: State): State => ({
  ...s,
  available: 82,
  upi: { vpa: 'priya.sharma@okaxis', name: 'PRIYA SHARMA' },
  checklist: { alerts: true, profile: true },
  ledger: [
    { id: 'L1', kind: 'earning', title: 'Kirana price check', when: 'Today, 9:12 am', amount: 42, state: 'pending', note: 'Waiting on validator review · usually within 24h', day: 0 },
    { id: 'L2', kind: 'earning', title: 'Chai stall regular', when: 'Yesterday, 7:40 pm', amount: 36, state: 'settled', day: 1 },
    { id: 'L3', kind: 'bonus', title: 'Coverage bonus · Clinic front desk', when: 'Yesterday, 7:40 pm', amount: 4, state: 'settled', note: 'Paid separately from the job base', day: 1 },
    { id: 'L4', kind: 'earning', title: 'Clinic front desk', when: 'Mon, 6:05 pm', amount: 36, state: 'settled', day: 3 },
    { id: 'L5', kind: 'earning', title: 'Pharmacy counter', when: 'Sun, 11:20 am', amount: 6, state: 'honoured', note: 'Campaign closed after you submitted. Your work was honoured.', day: 4 },
    { id: 'L6', kind: 'withdrawal', title: 'Withdrawal to priya.sharma@okaxis', when: 'Sat, 3:10 pm', amount: -100, state: 'settled', note: 'UTR 412893017755', day: 5 },
  ],
  submissions: [
    {
      id: 'S-shop',
      jobId: 'j-shop-hi',
      total: 42,
      status: 'under_review',
      clips: JOBS[1].prompts.map((p, i) => ({ id: `S-shop-${i}`, prompt: p, state: 'under_review', seed: i * 5, secs: 38 + i * 6 })),
      submittedAt: 'Today, 9:12 am',
      waitReason: 'Waiting on validator review · usually within 24h',
      honoured: false,
    },
  ],
  vault: [
    { id: 'V1', title: 'Chai stall regular · Hindi', detail: '4 turns · 2 min 10 s', paid: 36, status: 'active' },
    { id: 'V2', title: 'Clinic front desk · Hindi', detail: '3 turns · 3 min 40 s', paid: 40, status: 'active' },
    { id: 'V3', title: 'Kirana price check · Hindi', detail: '4 turns · under review', paid: 0, status: 'active' },
  ],
  notices: [
    { id: 'N1', title: 'Submission received', body: 'Kirana price check is under review. ₹42 pending.', when: '9:12 am', target: { name: 'submission', id: 'S-shop' }, unread: true },
    { id: 'N2', title: 'Payment paid', body: '₹100 reached priya.sharma@okaxis. UTR 412893017755.', when: 'Sat', target: { tab: 'wallet' }, unread: false },
  ],
})

export type ScenarioKey =
  | 'fresh'
  | 'new'
  | 'returning'
  | 'active'
  | 'uploadFailed'
  | 'expired'
  | 'repairLines'
  | 'noWork'
  | 'withdrawProcessing'

export const SCENARIOS: { key: ScenarioKey; label: string }[] = [
  { key: 'fresh', label: 'Fresh install (onboarding)' },
  { key: 'new', label: 'New contributor Home' },
  { key: 'returning', label: 'Returning · ₹82 available' },
  { key: 'active', label: 'Active session (resume)' },
  { key: 'uploadFailed', label: 'Upload failed' },
  { key: 'expired', label: 'Resume window expired' },
  { key: 'repairLines', label: 'Repair · Scenario turn (3/4)' },
  { key: 'noWork', label: 'No matching work' },
  { key: 'withdrawProcessing', label: 'Withdrawal processing' },
]

export function scenario(key: ScenarioKey): State {
  const s = base()
  const lines = JOBS[0]
  switch (key) {
    case 'fresh':
      return s
    case 'new':
      return onboarded(s)
    case 'returning':
      return returningHistory(onboarded(s))
    case 'active': {
      const st = returningHistory(onboarded(s))
      const sess = makeSession(lines, { calibrated: true, index: 3 })
      sess.clips = sess.clips.map((c, i) => (i < 3 ? { ...c, state: 'recorded_local', secs: 4 + i } : c))
      return { ...st, session: sess }
    }
    case 'uploadFailed': {
      const st = returningHistory(onboarded(s))
      const sess = makeSession(lines, { calibrated: true, status: 'upload_failed', index: 5 })
      sess.clips = sess.clips.map((c, i) => ({ ...c, state: 'upload_failed', secs: 4 + (i % 3) }))
      return { ...st, session: sess }
    }
    case 'expired': {
      const st = returningHistory(onboarded(s))
      const sess = makeSession(JOBS[2], { calibrated: true, status: 'expired', index: 2, resumeLeft: '0m' })
      sess.clips = sess.clips.map((c, i) => (i < 2 ? { ...c, state: 'recorded_local', secs: 30 } : c))
      return { ...st, session: sess }
    }
    case 'repairLines': {
      const st = returningHistory(onboarded(s))
      const sub: Submission = {
        id: 'S-lines',
        jobId: lines.id,
        total: jobTotal(lines),
        status: 'repair_required',
        clips: lines.prompts.map((p, i) => ({ id: `S-lines-${i}`, prompt: p, state: i === 1 ? 'repair_required' : 'accepted', seed: i * 3, secs: 22 + i * 5 })),
        repair: {
          code: 'OFF_SCRIPT_TURN',
          reason: 'Your reply didn’t answer the owner',
          why: 'The owner asked about strong chai, but the reply was about the weather, so the turn no longer fits the conversation.',
          example: '“हाँ, कड़क ही बना दो, आज नींद पूरी नहीं हुई।”',
          tip: 'Listen to the owner’s line again, then reply to exactly that. Your own words are fine.',
          mode: 'clip',
        },
        submittedAt: 'Yesterday, 8:02 pm',
        waitReason: '',
        honoured: false,
      }
      return {
        ...st,
        submissions: [sub, ...st.submissions],
        notices: [{ id: 'N0', title: 'Repair required', body: 'Chai stall regular: 3/4 accepted. Redo 1 turn.', when: '8:40 am', target: { name: 'submission', id: 'S-lines' }, unread: true }, ...st.notices],
      }
    }
    case 'noWork':
      return { ...returningHistory(onboarded(s)), supplyEmpty: true, submissions: [] }
    case 'withdrawProcessing': {
      const st = returningHistory(onboarded(s))
      return {
        ...st,
        available: 20,
        withdrawal: { id: 'W-2231', amount: 100, vpa: 'priya.sharma@okaxis', status: 'processing', requestedAt: 'Today, 10:02 am', expected: 'by tomorrow, 6 pm (1 working day)' },
        ledger: [{ id: 'LW', kind: 'withdrawal', title: 'Withdrawal to priya.sharma@okaxis', when: 'Today, 10:02 am', amount: -100, state: 'processing', note: 'Payment processing · bank has not confirmed yet', day: 0 }, ...st.ledger],
      }
    }
  }
}
