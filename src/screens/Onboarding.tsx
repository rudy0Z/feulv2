import { useEffect, useRef, useState, type ReactNode } from "react"
import { useReducedMotion } from "motion/react"
import { CONSENT_COPY, JOBS, LANGS, jobTotal, type Lang } from "../state/model"
import { sel, useStore } from "../state/store"
import Bolo, { BoloBadge, type Mood, type Outfit } from "../ui/Bolo"
import {
  BackBar,
  Btn,
  Icon,
  IconBtn,
  Tag,
  Wordmark,
  inr,
  useTone,
} from "../ui/kit"

type StepsProps = {
  n: 1 | 2
  onBack: () => void
}
function Steps({ n, onBack }: StepsProps) {
  return (
    <div className="flex items-center gap-3 px-2 pt-[54px] pb-1">
      <IconBtn n="back" label="Back" onClick={onBack} />
      <div
        className="flex flex-1 gap-1.5"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={2}
        aria-valuenow={n}
        aria-label={`Step ${n} of 2`}
      >
        {[1, 2].map((i) => (
          <span
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
              i <= n ? "bg-ink" : "bg-line-2"
            }`}
          />
        ))}
      </div>
      <span className="tnum w-11 pr-3 text-right text-12 font-medium text-ink-3">
        {n}/2
      </span>
    </div>
  )
}

/* ---------- Intro: one warm surface. Bolo waves, says hello, and the story sits right under it. ---------- */

const SHOP = JOBS.find((j) => j.id === "j-shop-hi")!
const DEEP = JOBS.find((j) => j.id === "j-rail-hi")!
const HELLO: Lang[] = ["hi", "ta", "bn", "te", "mr", "kn", "en"]

const SLIDES: {
  tag: string
  title: string
  body: string
  mood: Mood
  outfit?: Outfit[]
}[] = [
  {
    tag: "Speak",
    title: "Your voice is the work",
    body: "Talk the way you do at home, in any Indian language. I set the scene and play the other person. You just reply.",
    mood: "hello",
  },
  {
    tag: "Heard by people",
    title: "Every take gets a real listener",
    body: "Reviewers hear what you record. If one turn needs a redo, you see which one and why. The rest stays accepted.",
    mood: "nod",
    outfit: ["headphones"],
  },
  {
    tag: "Get paid",
    title: "The price is locked before you start",
    body: `Deep roles of 10 to 15 minutes pay up to ${inr(jobTotal(DEEP) + DEEP.bonus)}. Cash out to UPI from ₹100.`,
    mood: "cheer",
    outfit: ["coin"],
  },
]

/** Bolo's greeting, cycling through scripts. The bubble's tail points at Bolo, so it reads as Bolo talking. */
function Greeting({ onSpeak }: { onSpeak: (on: boolean) => void }) {
  const reduce = useReducedMotion()
  const [k, setK] = useState(0)
  const speak = useRef(onSpeak)
  speak.current = onSpeak
  useEffect(() => {
    if (reduce) return
    const t = window.setInterval(() => {
      setK((x) => (x + 1) % HELLO.length)
      speak.current(true)
      window.setTimeout(() => speak.current(false), 1100)
    }, 2800)
    return () => clearInterval(t)
  }, [reduce])
  const l = HELLO[k]
  return (
    <div className="relative rounded-lg rounded-br-sm bg-white px-4 py-3 text-ink shadow-[0_16px_32px_-16px_rgba(120,40,0,.55)]">
      <p
        key={l}
        lang={l}
        className="script fade-in text-18 font-semibold whitespace-nowrap"
      >
        {LANGS[l].hello.split("!")[0]}!
      </p>
      <p className="text-12 text-ink-3">{LANGS[l].name}</p>
      <span
        aria-hidden
        className="absolute -right-1.5 bottom-3 h-3.5 w-3.5 rotate-45 rounded-[3px] bg-white"
      />
    </div>
  )
}

function ReviewChips() {
  return (
    <>
      <span className="fade-in absolute top-[18%] left-5 flex items-center gap-2 rounded-full bg-white px-3 py-2 text-12 font-medium text-ink shadow-card">
        <span className="grid h-5 w-5 place-items-center rounded-full bg-money text-white">
          <Icon n="check" s={12} stroke={2.6} />
        </span>
        Turn 1 accepted
      </span>
      <span
        className="fade-in absolute top-[34%] right-4 flex items-center gap-2 rounded-full bg-white px-3 py-2 text-12 font-medium text-ink shadow-card"
        style={{ animationDelay: "160ms" }}
      >
        <span className="grid h-5 w-5 place-items-center rounded-full bg-wait text-white">
          <Icon n="retry" s={12} stroke={2.4} />
        </span>
        Redo turn 3 · 30 s
      </span>
    </>
  )
}

function PayChips() {
  return (
    <>
      <span className="fade-in absolute top-[16%] left-5 rounded-lg bg-white px-3.5 py-2.5 text-ink shadow-card">
        <span className="block text-11 text-ink-3">
          Locked before you record
        </span>
        <span className="tnum cond block text-20">
          {inr(jobTotal(SHOP))}{" "}
          <span className="text-12 font-medium text-money-ink">
            +{inr(SHOP.bonus)} bonus
          </span>
        </span>
      </span>
      <span
        className="fade-in absolute top-[38%] right-4 flex items-center gap-2 rounded-full bg-white px-3 py-2 text-12 font-medium text-ink shadow-card"
        style={{ animationDelay: "160ms" }}
      >
        <Icon n="bank" s={14} /> Paid to UPI · UTR shown
      </span>
    </>
  )
}

export function Landing() {
  const { a } = useStore()
  useTone("light")
  const [i, setI] = useState(0)
  const [talk, setTalk] = useState(false)
  const [waving, setWaving] = useState(true)
  const x0 = useRef<number | null>(null)
  const sl = SLIDES[i]
  const last = i === SLIDES.length - 1
  // Wave on arrival, then settle into a warm idle; wave again whenever you come back to the first slide.
  useEffect(() => {
    setWaving(true)
    const t = window.setTimeout(() => setWaving(false), 2600)
    return () => clearTimeout(t)
  }, [i])
  const mood: Mood =
    i === 0
      ? waving
        ? "hello"
        : talk
          ? "speak"
          : "idle"
      : waving
        ? sl.mood
        : i === 1
          ? "listen"
          : "happy"
  const swipe = (dx: number) => {
    if (dx < -48 && !last) setI(i + 1)
    else if (dx > 48 && i > 0) setI(i - 1)
  }
  return (
    <div
      className="grad-dawn relative flex flex-1 flex-col overflow-hidden text-white"
      onPointerDown={(e) => (x0.current = e.clientX)}
      onPointerUp={(e) => {
        if (x0.current != null) swipe(e.clientX - x0.current)
        x0.current = null
      }}
    >
      <div className="flex h-[98px] items-end justify-between px-5 pb-2">
        <Wordmark dark />
        {!last && (
          <button
            onClick={() => setI(SLIDES.length - 1)}
            className="-mr-3 h-11 rounded-full px-3 text-16 font-medium text-white/85 hover:text-white"
          >
            Skip
          </button>
        )}
      </div>

      {/* Hero: Bolo and what Bolo says, together */}
      <div className="relative flex flex-1 touch-pan-y items-end justify-center">
        <span
          aria-hidden
          className="halo absolute top-1/2 left-1/2 h-[380px] w-[380px] -translate-x-1/2 -translate-y-1/2"
        />
        {i === 1 && <ReviewChips key="r" />}
        {i === 2 && <PayChips key="p" />}
        <div className="relative mb-2 flex flex-col items-center">
          {i === 0 && (
            <div className="absolute -top-6 right-[58%] z-10">
              <Greeting onSpeak={setTalk} />
            </div>
          )}
          <Bolo
            mood={mood}
            tone="white"
            size={196}
            ground="none"
            outfit={sl.outfit}
            label="Bolo, your studio director"
          />
        </div>
      </div>

      <div className="px-5 pt-6 pb-8">
        <div key={i} className="rise">
          <span className="text-14 font-medium text-white/75">
            {i + 1} of {SLIDES.length} · {sl.tag}
          </span>
          <h1 className="semi mt-1.5 text-30 font-semibold">{sl.title}</h1>
          <p className="mt-2 text-16 leading-snug text-pretty text-white/85">
            {sl.body}
          </p>
        </div>
        <div
          className="mt-6 mb-4 flex gap-1.5"
          role="tablist"
          aria-label="Introduction"
        >
          {SLIDES.map((x, k) => (
            <button
              key={x.tag}
              role="tab"
              aria-selected={k === i}
              aria-label={`${k + 1} of ${SLIDES.length}: ${x.tag}`}
              onClick={() => setI(k)}
              className="grid h-6 place-items-center"
            >
              <span
                className={`block h-1.5 rounded-full transition-[width,background-color] duration-300 ${
                  k === i ? "w-6 bg-white" : "w-1.5 bg-white/40"
                }`}
              />
            </button>
          ))}
        </div>
        {last ? (
          <div className="flex flex-col gap-2.5">
            <Btn
              full
              size="lg"
              v="white"
              icon="lock"
              onClick={() => a.stage("auth")}
            >
              Continue with mobile number
            </Btn>
            <Btn full size="lg" v="glass" onClick={() => a.stage("auth")}>
              <span className="text-18 font-semibold">G</span> Continue with
              Google
            </Btn>
            <p className="mt-1 text-center text-12 leading-snug text-white/75">
              18+ only. Continuing means you accept our{" "}
              <span className="font-medium text-white underline underline-offset-2">
                Terms
              </span>{" "}
              and{" "}
              <span className="font-medium text-white underline underline-offset-2">
                Privacy Policy
              </span>
              .
            </p>
          </div>
        ) : (
          <Btn
            full
            size="lg"
            v="white"
            iconRight="arrow"
            onClick={() => setI(i + 1)}
          >
            {i === 0 ? "Get started" : "Next"}
          </Btn>
        )}
      </div>
    </div>
  )
}

/* ---------- Sign in: plain and calm ---------- */

function AuthHead({
  title,
  outfit,
  mood = "idle",
  children,
}: {
  title: string
  outfit?: Outfit[]
  mood?: Mood
  children: ReactNode
}) {
  return (
    <div className="rise flex flex-col items-center text-center">
      <BoloBadge size={88} mood={mood} outfit={outfit} />
      <h1 className="semi mt-6 text-24 font-semibold">{title}</h1>
      <div className="mt-2 max-w-[30ch] text-16 leading-snug text-pretty text-ink-2">
        {children}
      </div>
    </div>
  )
}

export function Auth() {
  const { a } = useStore()
  const [phone, setPhone] = useState("98204 55121")
  const ok = phone.replace(/\D/g, "").length === 10
  return (
    <div className="flex flex-1 flex-col">
      <BackBar onBack={() => a.stage("landing")} />
      <div className="flex flex-1 flex-col justify-between px-5 pt-6 pb-8">
        <div>
          <AuthHead title="Enter your mobile number" outfit={["phone"]}>
            We'll text a 6-digit code. Payouts go to a UPI in your name.
          </AuthHead>
          <label className="mt-8 flex h-[60px] items-center gap-3 rounded-full bg-surface pr-5 pl-2 shadow-[0_0_0_1.5px_var(--color-line-2)] transition-shadow focus-within:shadow-[0_0_0_2px_var(--color-brand)]">
            <span className="tnum flex h-11 items-center rounded-full bg-surface-3 px-3.5 text-16 font-medium">
              +91
            </span>
            <input
              inputMode="numeric"
              autoComplete="tel-national"
              name="phone"
              aria-label="Mobile number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="tnum min-w-0 flex-1 bg-transparent text-20 font-medium tracking-[0.02em] outline-none"
            />
            {ok && (
              <Icon n="check" s={20} stroke={2.2} className="text-brand" />
            )}
          </label>
          {!ok && phone && (
            <p className="mt-2 pl-5 text-14 text-red">
              Enter a 10-digit mobile number.
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Btn full size="lg" disabled={!ok} onClick={() => a.stage("otp")}>
            Send code
          </Btn>
          <Btn full v="ghost" onClick={() => a.stage("landing")}>
            Use a different method
          </Btn>
        </div>
      </div>
    </div>
  )
}

export function Otp() {
  const { a } = useStore()
  const [d, setD] = useState<string[]>(Array(6).fill(""))
  const [err, setErr] = useState<string | null>(null)
  const [tries, setTries] = useState(0)
  const [wait, setWait] = useState(45)
  const [lock, setLock] = useState(0)
  const [busy, setBusy] = useState(false)
  const [shake, setShake] = useState(0)
  const refs = useRef<(HTMLInputElement | null)[]>([])
  useEffect(() => {
    const t = setInterval(() => {
      setWait((w) => Math.max(0, w - 1))
      setLock((l) => Math.max(0, l - 1))
    }, 1000)
    return () => clearInterval(t)
  }, [])
  const code = d.join("")
  const verify = () => {
    setBusy(true)
    setTimeout(() => {
      setBusy(false)
      if (code === "123456") return a.stage("language")
      const n = tries + 1
      setTries(n)
      setShake((x) => x + 1)
      setD(Array(6).fill(""))
      refs.current[0]?.focus()
      if (n >= 3) {
        setLock(60)
        setErr(
          "Too many wrong codes. For your safety, try again in 60 seconds.",
        )
      } else
        setErr(
          `That code doesn't match the one we sent. ${3 - n} ${
            3 - n === 1 ? "try" : "tries"
          } left.`,
        )
    }, 700)
  }
  const box = (i: number) => (
    <input
      key={i}
      ref={(el) => {
        refs.current[i] = el
      }}
      aria-label={`Digit ${i + 1}`}
      inputMode="numeric"
      autoComplete={i === 0 ? "one-time-code" : "off"}
      maxLength={1}
      disabled={lock > 0}
      value={d[i]}
      onChange={(e) => {
        const c = e.target.value.replace(/\D/g, "").slice(-1)
        const n = [...d]
        n[i] = c
        setD(n)
        setErr(null)
        if (c && i < 5) refs.current[i + 1]?.focus()
      }}
      onPaste={(e) => {
        const p = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
        if (p.length === 6) {
          e.preventDefault()
          setD(p.split(""))
          refs.current[5]?.focus()
        }
      }}
      onKeyDown={(e) =>
        e.key === "Backspace" && !d[i] && i > 0 && refs.current[i - 1]?.focus()
      }
      className={`tnum h-[60px] w-full min-w-0 bg-transparent text-center text-24 font-semibold outline-none placeholder:text-ink-3/40 focus:bg-brand-soft disabled:opacity-40 ${
        i % 3 ? "border-l border-line" : ""
      }`}
      placeholder="0"
    />
  )
  return (
    <div className="flex flex-1 flex-col">
      <BackBar onBack={() => a.stage("auth")} />
      <div className="flex flex-1 flex-col justify-between px-5 pt-6 pb-8">
        <div>
          <AuthHead title="Enter your code" mood="curious">
            Sent to{" "}
            <span className="tnum font-medium text-ink">+91 98204 55121</span>
            <span className="block text-12 text-ink-3">
              Prototype code: 123456
            </span>
          </AuthHead>
          <div
            key={shake}
            className={`mt-8 flex items-center gap-3 ${shake ? "shake" : ""}`}
          >
            {[0, 3].map((o) => (
              <div
                key={o}
                className={`flex flex-1 overflow-hidden rounded-md bg-surface ${
                  err
                    ? "shadow-[0_0_0_2px_var(--color-red)]"
                    : "shadow-[0_0_0_1.5px_var(--color-line-2)]"
                }`}
              >
                {[o, o + 1, o + 2].map(box)}
              </div>
            ))}
          </div>
          {err && (
            <p role="alert" className="mt-3 text-center text-14 text-red">
              {err} {lock > 0 && <span className="tnum">({lock}s)</span>}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Btn
            full
            size="lg"
            disabled={code.length < 6 || lock > 0}
            loading={busy}
            onClick={verify}
          >
            Verify
          </Btn>
          <Btn
            full
            v="outline"
            disabled={wait > 0 || lock > 0}
            onClick={() => setWait(45)}
          >
            {wait > 0 ? (
              <span className="tnum">
                Resend code in 0:{String(wait).padStart(2, "0")}
              </span>
            ) : (
              "Resend code"
            )}
          </Btn>
          <Btn full v="ghost" onClick={() => a.stage("auth")}>
            Change number
          </Btn>
        </div>
      </div>
    </div>
  )
}

/* ---------- Language: every Indian language, as compact chips. Bolo answers in the script you pick. ---------- */

const ORDER: Lang[] = [
  "hi",
  "bn",
  "mr",
  "te",
  "ta",
  "gu",
  "ur",
  "kn",
  "or",
  "ml",
  "pa",
  "as",
  "mai",
  "sat",
  "ks",
  "ne",
  "sd",
  "kok",
  "doi",
  "mni",
  "brx",
  "sa",
  "en",
]
const OPEN = new Set(
  JOBS.filter((j) => j.campaign === "open").map((j) => j.lang),
)

export function Language() {
  const { s, a } = useStore()
  const picked = s.langs ?? [s.lang]
  const [said, setSaid] = useState<Lang>(picked[0])
  const [q, setQ] = useState("")
  const [mood, setMood] = useState<Mood>("hello")
  useEffect(() => {
    setMood("speak")
    const t = window.setTimeout(() => setMood("idle"), 1200)
    return () => clearTimeout(t)
  }, [said])
  const toggle = (k: Lang, on: boolean) => {
    a.toggleLang(k)
    if (!on) setSaid(k)
    else if (said === k) setSaid(picked.find((l) => l !== k) ?? k)
  }
  const list = ORDER.filter(
    (k) =>
      !q ||
      LANGS[k].name.toLowerCase().includes(q.toLowerCase()) ||
      LANGS[k].native.includes(q),
  )
  const noneOpen = picked.every((l) => !OPEN.has(l))
  return (
    <div className="flex flex-1 flex-col">
      <Steps n={1} onBack={() => a.stage("otp")} />
      <div className="px-5 pt-2">
        <h1 className="semi text-24 font-semibold">
          Which languages do you speak?
        </h1>
        <p className="mt-1 text-14 leading-snug text-ink-2">
          Pick every one you speak comfortably. The app stays in English.
        </p>
      </div>

      <div className="mt-4 flex items-end gap-2 px-5">
        <Bolo mood={mood} size={56} ground="none" label="Bolo" />
        <div className="relative mb-2 min-w-0 rounded-lg rounded-bl-sm bg-surface px-3.5 py-2.5 shadow-card">
          <span
            aria-hidden
            className="absolute bottom-2.5 -left-1.5 h-3 w-3 rotate-45 rounded-[2px] bg-surface"
          />
          <p
            key={said}
            lang={said}
            dir="auto"
            className="script fade-in relative truncate text-16 font-medium"
          >
            {LANGS[said].hello}
          </p>
        </div>
      </div>

      <label className="mx-5 mt-4 flex h-11 items-center gap-2 rounded-full bg-surface px-4 text-ink-3 shadow-[inset_0_0_0_1px_var(--color-line)] focus-within:shadow-[inset_0_0_0_2px_var(--color-brand)]">
        <Icon n="search" s={17} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search 23 languages"
          aria-label="Search languages"
          className="min-w-0 flex-1 bg-transparent text-16 text-ink outline-none placeholder:text-ink-3"
        />
      </label>

      <div
        role="group"
        aria-label="Recording languages"
        className="mt-3 flex flex-wrap gap-2 px-5"
      >
        {list.map((k) => {
          const on = picked.includes(k)
          return (
            <button
              key={k}
              role="checkbox"
              aria-checked={on}
              onClick={() => toggle(k, on)}
              className={`flex h-11 items-center gap-2 rounded-full pr-3.5 pl-3 transition-[background-color,color,box-shadow] duration-200 active:scale-[0.97] ${
                on
                  ? "bg-ink text-white"
                  : "bg-surface text-ink shadow-[inset_0_0_0_1px_var(--color-line)]"
              }`}
            >
              {on ? (
                <Icon n="check" s={15} stroke={2.4} />
              ) : (
                OPEN.has(k) && (
                  <span
                    aria-hidden
                    className="h-1.5 w-1.5 rounded-full bg-brand"
                  />
                )
              )}
              <span
                lang={k}
                dir="auto"
                className="text-16 leading-none font-medium"
              >
                {LANGS[k].native}
              </span>
              {k !== "en" && (
                <span
                  className={`text-12 ${on ? "text-white/60" : "text-ink-3"}`}
                >
                  {LANGS[k].name}
                </span>
              )}
            </button>
          )
        })}
        {list.length === 0 && (
          <p className="py-2 text-14 text-ink-2">No language matches “{q}”.</p>
        )}
      </div>
      <p className="mt-4 flex items-center gap-2 px-5 text-12 text-ink-3">
        <span className="h-1.5 w-1.5 rounded-full bg-brand" /> Scenes open now.
        For the rest, Bolo tells you when labs need them.
      </p>

      <div className="sticky bottom-0 mt-auto bg-linear-to-t from-canvas via-canvas to-canvas/0 px-5 pt-6 pb-8">
        {noneOpen && (
          <p className="mb-2 text-center text-12 text-wait-ink">
            No open scenes in {picked.map((l) => LANGS[l].name).join(", ")} yet.
            You can still join.
          </p>
        )}
        <Btn
          full
          size="lg"
          iconRight="arrow"
          onClick={() => a.stage("consent")}
        >
          Continue with {picked.length}{" "}
          {picked.length === 1 ? "language" : "languages"}
        </Btn>
      </div>
    </div>
  )
}

/* ---------- Consent: just the deal, in plain words ---------- */

const DEAL: {
  icon: string
  tile: string
  title: string
  body: string
}[] = [
  {
    icon: "mic",
    tile: "bg-brand-soft text-brand-deep",
    title: "We only record inside a scene",
    body: "Your phone asks for microphone access the first time you start one. Nothing listens in the background.",
  },
  {
    icon: "users",
    tile: "bg-brand-soft text-brand-deep",
    title: "Reviewers and AI labs hear it",
    body: "Our team checks each take, then it is licensed to companies building speech AI. Never with your name or number.",
  },
  {
    icon: "shield",
    tile: "bg-brand-soft text-brand-deep",
    title: "Delete it whenever you want",
    body: "Ask us to erase your voice data under the DPDP Act 2023. Money already paid stays yours.",
  },
  {
    icon: "wallet",
    tile: "bg-brand-soft text-brand-deep",
    title: "Paid for every accepted take",
    body: "The guaranteed price is locked before you record. Joining is free, with no fees, ever.",
  },
]

export function Consent({ inApp }: { inApp?: boolean }) {
  const { s, a } = useStore()
  const [adult, setAdult] = useState(false)
  const [full, setFull] = useState(false)
  const [done, setDone] = useState(false)
  const picked = s.langs ?? [s.lang]
  const [termsLang, setTermsLang] = useState<Lang>(
    picked.find((l) => CONSENT_COPY[l]) ?? "en",
  )
  if (done) return <Ready onDone={a.acceptConsent} />
  const c = CONSENT_COPY[termsLang] ?? CONSENT_COPY.en!
  const body = (
    <>
      <div className="px-5 pt-3">
        <Tag tone="brand" icon="shield">
          Your voice, your call
        </Tag>
        <h1 className="semi mt-3 text-24 font-semibold">
          Four promises before you record
        </h1>
        <p className="mt-1.5 text-14 leading-snug text-ink-2">
          The whole deal in plain words. It takes 30 seconds to read.
        </p>
      </div>

      <ol className="mx-5 mt-5 flex flex-col">
        {DEAL.map((d, i) => (
          <li key={d.title} className="relative flex gap-4 pb-4">
            {i < DEAL.length - 1 && (
              <span
                aria-hidden
                className="absolute top-12 bottom-1 left-[21px] w-px bg-line-2"
              />
            )}
            <span
              className={`relative grid h-10 w-10 shrink-0 place-items-center rounded-md ${d.tile}`}
            >
              <Icon n={d.icon} s={18} />
            </span>
            <div className="pt-0.5">
              <h2 className="text-16 leading-tight font-medium">{d.title}</h2>
              <p className="mt-0.5 text-14 leading-snug text-pretty text-ink-2">
                {d.body}
              </p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mx-5 border-y border-line">
        <button
          aria-expanded={full}
          onClick={() => setFull(!full)}
          className="flex w-full items-center justify-between py-3.5 text-left"
        >
          <span className="text-14 font-medium">Read the full terms</span>
          <Icon
            n="chev"
            s={18}
            className={`text-ink-3 transition-transform duration-300 ease-(--ease-spring) ${
              full ? "rotate-90" : ""
            }`}
          />
        </button>
        {full && (
          <div className="border-t border-line pt-3 pb-4">
            {picked.filter((l) => CONSENT_COPY[l]).length > 1 && (
              <div className="mb-3 flex flex-wrap gap-1.5">
                {picked
                  .filter((l) => CONSENT_COPY[l])
                  .map((l) => (
                    <button
                      key={l}
                      lang={l}
                      onClick={() => setTermsLang(l)}
                      className={`h-8 rounded-full px-3 text-14 font-medium transition-colors ${
                        termsLang === l
                          ? "bg-ink text-white"
                          : "bg-surface-3 text-ink-2"
                      }`}
                    >
                      {LANGS[l].native}
                    </button>
                  ))}
              </div>
            )}
            <dl lang={termsLang} className="script flex flex-col gap-3">
              {c.points.map(([h, t]) => (
                <div key={h}>
                  <dt className="text-14 font-medium">{h}</dt>
                  <dd className="mt-0.5 text-14 text-ink-2">{t}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 mt-auto bg-linear-to-t from-canvas via-canvas to-canvas/0 px-5 pt-8 pb-8">
        <label
          className={`mb-3 flex cursor-pointer items-center gap-3 rounded-md p-3.5 transition-[background-color,box-shadow] duration-200 ${
            adult
              ? "bg-brand-soft shadow-[inset_0_0_0_1.5px_var(--color-brand)]"
              : "bg-surface shadow-[inset_0_0_0_1.5px_var(--color-line-2)]"
          }`}
        >
          <input
            type="checkbox"
            checked={adult}
            onChange={(e) => setAdult(e.target.checked)}
            className="h-5 w-5 shrink-0 accent-[#F5640F]"
          />
          <span className="text-14 leading-snug">
            <span className="font-semibold">I'm 18 or older</span> and I agree
            to these terms.
          </span>
        </label>
        <Btn
          full
          size="lg"
          disabled={!adult}
          onClick={() => (inApp ? a.acceptConsent() : setDone(true))}
        >
          Agree and continue
        </Btn>
      </div>
    </>
  )
  if (inApp)
    return (
      <div className="flex flex-1 flex-col">
        <BackBar title="Consent" sub={`Recording in ${LANGS[s.lang].name}`} />
        {body}
      </div>
    )
  return (
    <div className="flex flex-1 flex-col">
      <Steps n={2} onBack={() => a.stage("language")} />
      {body}
    </div>
  )
}

/* ---------- Ready: the same warm surface as the intro, Bolo celebrating ---------- */

function Ready({ onDone }: { onDone: () => void }) {
  const { s } = useStore()
  useTone("light")
  const open = sel.openForMe(s)
  const first = open.length ? Math.min(...open.map((j) => j.minutes)) : null
  return (
    <div className="grad-dawn relative flex flex-1 flex-col overflow-hidden text-white">
      <div className="relative flex flex-1 items-end justify-center pt-[98px]">
        <span
          aria-hidden
          className="halo absolute top-[58%] left-1/2 h-[380px] w-[380px] -translate-x-1/2 -translate-y-1/2"
        />
        <Bolo
          mood="cheer"
          tone="white"
          size={190}
          ground="none"
          label="Bolo, cheering"
        />
      </div>
      <div className="rise px-5 pt-6 pb-8 text-center">
        <h1 className="semi text-30 font-semibold">You're ready</h1>
        <p className="mx-auto mt-2 max-w-[32ch] text-16 leading-snug text-white/85">
          Your first ₹100 unlocks withdrawals.
          {first ? ` The shortest scene takes about ${first} minutes.` : ""}
        </p>
        {open.length > 0 && (
          <span className="tnum mt-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-2 text-14 font-medium">
            <span className="h-2 w-2 rounded-full bg-white" /> {open.length}{" "}
            scenes open in <span lang={s.lang}>{LANGS[s.lang].native}</span>
          </span>
        )}
        <div className="mt-8">
          <Btn full size="lg" v="white" iconRight="arrow" onClick={onDone}>
            Find my first scene
          </Btn>
        </div>
      </div>
    </div>
  )
}

/** Not in the onboarding flow, since the OS permission prompt covers it. Kept for the in-app denied-mic path.
    Allowing here is simulated; the real microphone is only ever opened inside the studio. Calm by design:
    no flashing rings, just Bolo and the steps. */
export function MicPrime({ inApp }: { inApp?: boolean }) {
  const { s, a } = useStore()
  const [ready, setReady] = useState(false)
  const denied = s.mic === "denied"
  if (ready) return <Ready onDone={() => a.setMic("granted")} />
  const allow = () => (inApp ? a.setMic("granted") : setReady(true))
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center px-2 pt-[54px] pb-1">
        {inApp ? (
          <IconBtn n="back" label="Back" onClick={a.pop} />
        ) : (
          <span className="h-11" />
        )}
      </div>
      <div
        key={String(denied)}
        className="rise flex flex-1 flex-col px-5 pt-4 pb-8"
      >
        <div className="flex flex-col items-center text-center">
          <div className="relative grid h-[168px] w-[168px] place-items-center rounded-full bg-brand-soft">
            <Bolo
              mood={denied ? "concern" : "listen"}
              size={132}
              ground="none"
              outfit={["headphones"]}
            />
            <span
              className={`absolute right-2 bottom-3 grid h-11 w-11 place-items-center rounded-full ring-4 ring-canvas ${
                denied ? "bg-wait text-white" : "bg-ink text-white"
              }`}
            >
              <Icon n={denied ? "lock" : "mic"} s={20} />
            </span>
          </div>
          <h1 className="semi mt-6 text-24 font-semibold">
            {denied
              ? "Your microphone is blocked"
              : "Allow the microphone to record"}
          </h1>
          <p className="mt-2 max-w-[32ch] text-16 leading-snug text-ink-2">
            {denied
              ? "Your consent is saved. You can browse scenes and your wallet, but recording needs the microphone."
              : "Feul only listens while you record inside a scene. Hold the phone close, like a normal call."}
          </p>
        </div>
        {denied && (
          <ol className="mt-6 divide-y divide-line border-y border-line">
            {[
              "Open Settings, then Apps, then Feul",
              "Tap Permissions, then Microphone",
              "Choose “Allow only while using the app”",
            ].map((t, i) => (
              <li key={t} className="flex items-center gap-3 py-3 text-16">
                <span className="tnum grid h-7 w-7 shrink-0 place-items-center rounded-full bg-surface-3 text-12 font-semibold">
                  {i + 1}
                </span>
                {t}
              </li>
            ))}
          </ol>
        )}
        <div className="mt-auto flex flex-col gap-2 pt-8">
          <Btn full size="lg" v="voice" icon="mic" onClick={allow}>
            {denied ? "I've allowed it, try again" : "Allow microphone"}
          </Btn>
          <Btn
            full
            v="ghost"
            onClick={() =>
              denied ? (inApp ? a.pop() : a.stage("done")) : a.setMic("denied")
            }
          >
            {denied ? "Browse scenes for now" : "Not now"}
          </Btn>
        </div>
      </div>
    </div>
  )
}
