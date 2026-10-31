import {
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from "react"
import { useReducedMotion } from "motion/react"
import { CONSENT_COPY, JOBS, LANGS, jobTotal, type Lang } from "../state/model"
import { sel, useStore } from "../state/store"
import Bolo, {
  BoloStage,
  Bubble,
  Typed,
  VoiceRing,
  type Mood,
} from "../ui/Bolo"
import {
  BackBar,
  Btn,
  Icon,
  IconBtn,
  Tag,
  Waveform,
  Wordmark,
  inr,
  useTone,
} from "../ui/kit"

/* ---------- Plates ----------
   Onboarding speaks in full-bleed colour plates. Each plate sets the status-bar ink above it. */

type PlateTone = "cobalt" | "orange" | "lime" | "studio"
const PLATE: Record<PlateTone, string> = {
  cobalt: "bg-cobalt text-white",
  orange: "bg-orange text-white",
  lime: "bg-lime text-ink",
  studio: "bg-studio text-studio-ink",
}

function Plate({
  tone,
  className = "",
  children,
}: {
  tone: PlateTone
  className?: string
  children: ReactNode
}) {
  useTone(tone === "lime" ? "dark" : "light")
  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-b-[40px] pt-[54px] transition-[background-color,height] duration-500 ease-(--ease-out) ${PLATE[tone]} ${className}`}
    >
      {children}
    </div>
  )
}

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
      <span className="tnum w-11 pr-3 text-right text-12 font-semibold text-ink-3">
        {n}/2
      </span>
    </div>
  )
}

/** Highlighted words sit behind the title's text (the h1 isolates), so a wrapped highlight never covers the line above. */
const Hl = ({
  tone,
  children,
}: {
  tone: "orange" | "lime"
  children: ReactNode
}) => (
  <span
    className={`relative -z-10 rounded-[10px] px-1.5 box-decoration-clone ${
      tone === "orange" ? "bg-orange text-white" : "bg-lime text-ink"
    }`}
  >
    {children}
  </span>
)

/* ---------- Intro ---------- */

const SHOP = JOBS.find((j) => j.id === "j-shop-hi")!
const HELLO: Lang[] = ["hi", "ta", "bn", "mr", "en"]

/** Bolo greets in every script it directs while the ring pulses with its voice: one system, mascot plus waveform. */
function HeroSpeak() {
  const reduce = useReducedMotion()
  const [k, setK] = useState(0)
  const [mood, setMood] = useState<Mood>("hello")
  useEffect(() => {
    const t = window.setTimeout(() => setMood("speak"), 1500)
    return () => clearTimeout(t)
  }, [])
  useEffect(() => {
    if (reduce) return
    const t = window.setInterval(
      () => setK((x) => (x + 1) % HELLO.length),
      2800,
    )
    return () => clearInterval(t)
  }, [reduce])
  const l = HELLO[k]
  return (
    <div className="flex h-full flex-col items-center justify-end pb-4">
      <Bubble tail="center" className="mb-1 min-w-[216px] text-center">
        <p lang={l} className="script text-20 font-semibold">
          <Typed text={LANGS[l].hello} step={70} />
        </p>
        <p className="text-11 font-semibold tracking-[0.06em] text-ink-3 uppercase">
          {LANGS[l].name}
        </p>
      </Bubble>
      <div className="relative grid h-[228px] w-[228px] place-items-center">
        <div className="absolute inset-0">
          <VoiceRing mode="bolo" size={228} inner={76} />
        </div>
        <Bolo
          mood={mood}
          tone="white"
          size={128}
          ground="none"
          label="Bolo, saying hello"
        />
      </div>
    </div>
  )
}

function HeroReview() {
  const clip = (t: string, ok: boolean, r: string, seed: number) => (
    <div
      className={`flex items-center gap-3 rounded-md bg-white p-3 text-ink shadow-[0_18px_36px_-18px_rgba(120,30,0,.6)] ${r}`}
    >
      <span
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${
          ok ? "bg-lime text-ink" : "bg-orange text-white"
        }`}
      >
        <Icon n={ok ? "check" : "retry"} s={17} stroke={2.2} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-14 font-semibold">{t}</div>
        <Waveform
          seed={seed}
          bars={40}
          h={12}
          tone={ok ? "ink" : "orange"}
          className="mt-1.5"
        />
      </div>
    </div>
  )
  return (
    <div
      aria-hidden
      className="relative flex h-full flex-col justify-center gap-2.5 px-8"
    >
      {clip("Turn 1 · accepted", true, "rotate-[1.5deg]", 3)}
      {clip("Turn 2 · accepted", true, "-rotate-[1deg] ml-4", 7)}
      {clip("Turn 3 · TV in the background", false, "rotate-[2deg] -mr-2", 11)}
      <span className="absolute top-4 right-7 rotate-[4deg] rounded-full bg-ink px-3.5 py-1.5 text-14 font-semibold text-white shadow-float">
        <span className="tnum">2 of 3</span> accepted
      </span>
      <span className="absolute bottom-4 left-10 -rotate-[3deg] rounded-full bg-white px-3 py-1 text-12 font-semibold text-orange-ink shadow-card">
        Redo just turn 3 · about 30 s
      </span>
    </div>
  )
}

function HeroPaid() {
  return (
    <div
      aria-hidden
      className="relative flex h-full items-center justify-center px-9"
    >
      <div className="relative w-full rotate-[2.5deg] rounded-lg bg-white p-5 text-ink shadow-[0_28px_48px_-20px_rgba(40,60,0,.55)]">
        <div className="flex items-center gap-1.5 text-12 font-semibold text-ink-2">
          <Icon n="lock" s={13} stroke={2} /> Locked before you record
        </div>
        <div className="mt-1.5 flex items-end gap-2.5">
          <span className="cond tnum text-64 font-bold">
            {inr(jobTotal(SHOP))}
          </span>
          <span className="pb-1.5 text-12 leading-tight text-ink-2">
            guaranteed
            <br />
            {SHOP.title}
          </span>
        </div>
        <span className="tnum mt-2 inline-flex h-6 items-center gap-1 rounded-full bg-lime-soft px-2.5 text-12 font-semibold text-lime-ink">
          <Icon n="gift" s={13} /> +{inr(SHOP.bonus)} quality bonus, paid
          separately
        </span>
        <div className="my-4 border-t-2 border-dashed border-line" />
        <div className="flex justify-between text-12">
          <span className="text-ink-3">UTR</span>
          <span className="tnum font-mono font-medium">412893018842</span>
        </div>
        <span
          className="pop-in absolute -top-5 -right-3 grid h-[76px] w-[76px] -rotate-[14deg] place-items-center rounded-full bg-ink text-12 font-bold tracking-[0.12em] text-lime uppercase"
          style={{ animationDelay: "380ms" }}
        >
          Paid
        </span>
      </div>
    </div>
  )
}

const SLIDES: {
  tone: PlateTone
  tag: string
  title: ReactNode
  body: string
  Hero: ComponentType
}[] = [
  {
    tone: "cobalt",
    tag: "Speak",
    title: (
      <>
        Your voice <span className="text-cobalt">is the job.</span>
      </>
    ),
    body: "Talk the way you do at home, in हिन्दी, தமிழ், বাংলা and more. Bolo, your studio director, sets every scene. Missions start at 2 minutes.",
    Hero: HeroSpeak,
  },
  {
    tone: "orange",
    tag: "Review",
    title: (
      <>
        No silent rejections. <Hl tone="orange">Ever.</Hl>
      </>
    ),
    body: "A real reviewer hears every take. If one turn needs a redo, you see which one and why, and the rest stays accepted.",
    Hero: HeroReview,
  },
  {
    tone: "lime",
    tag: "Get paid",
    title: (
      <>
        {SHOP.minutes} minutes.{" "}
        <Hl tone="lime">{inr(jobTotal(SHOP))}, locked in.</Hl>
      </>
    ),
    body: "The price is locked before you press record, and quality bonuses come on top. Cash out from ₹100, tracked by UTR.",
    Hero: HeroPaid,
  },
]

export function Landing() {
  const { a } = useStore()
  const [i, setI] = useState(0)
  const x0 = useRef<number | null>(null)
  const sl = SLIDES[i]
  const last = i === SLIDES.length - 1
  const Hero = sl.Hero
  const swipe = (dx: number) => {
    if (dx < -48 && !last) setI(i + 1)
    else if (dx > 48 && i > 0) setI(i - 1)
  }
  return (
    <div className="flex flex-1 flex-col">
      <Plate tone={sl.tone} className={last ? "h-[342px]" : "h-[448px]"}>
        <div className="flex h-12 items-center justify-between px-6">
          <Wordmark dark={sl.tone !== "lime"} />
          {!last && (
            <button
              onClick={() => setI(SLIDES.length - 1)}
              className="-mr-3 h-11 rounded-full px-3 text-16 font-semibold opacity-85 transition-opacity hover:opacity-100"
            >
              Skip
            </button>
          )}
        </div>
        <div
          key={i}
          className={`rise touch-pan-y ${last ? "h-[240px]" : "h-[346px]"}`}
          onPointerDown={(e) => (x0.current = e.clientX)}
          onPointerUp={(e) => {
            if (x0.current != null) swipe(e.clientX - x0.current)
            x0.current = null
          }}
        >
          <Hero />
        </div>
      </Plate>

      <div className="flex flex-1 flex-col px-6 pt-6 pb-8">
        <div key={i} className="rise">
          <span className="eyebrow tnum text-ink-3">
            0{i + 1} · {sl.tag}
          </span>
          <h1 className="semi isolate mt-2 text-38 leading-[1.02] font-bold tracking-[-0.03em]">
            {sl.title}
          </h1>
          <p className="mt-3 text-16 leading-snug text-pretty text-ink-2">
            {sl.body}
          </p>
        </div>

        <div className="mt-auto pt-6">
          <div
            className="mb-3 flex justify-center gap-0.5"
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
                className="grid h-6 place-items-center px-1"
              >
                <span
                  className={`block h-1.5 rounded-full transition-[width,background-color] duration-300 ${
                    k === i ? "w-6 bg-ink" : "w-1.5 bg-line-2"
                  }`}
                />
              </button>
            ))}
          </div>
          {last ? (
            <div className="flex flex-col gap-2.5">
              <p className="mb-1 flex items-center justify-center gap-2 text-12 leading-snug text-ink-2">
                <span className="rounded-full bg-ink px-2 py-0.5 text-11 font-bold tracking-wide text-white">
                  18+
                </span>
                Adults only. Your number is never shown to anyone.
              </p>
              <Btn full size="lg" icon="lock" onClick={() => a.stage("auth")}>
                Continue with mobile number
              </Btn>
              <Btn full size="lg" v="outline" onClick={() => a.stage("auth")}>
                <span className="text-18 font-bold text-[#4285F4]">G</span>{" "}
                Continue with Google
              </Btn>
              <p className="text-center text-12 text-ink-3">
                Continuing means you accept our{" "}
                <span className="font-semibold text-ink-2 underline underline-offset-2">
                  Terms
                </span>{" "}
                and{" "}
                <span className="font-semibold text-ink-2 underline underline-offset-2">
                  Privacy Policy
                </span>
                .
              </p>
            </div>
          ) : (
            <Btn full size="lg" iconRight="arrow" onClick={() => setI(i + 1)}>
              Next
            </Btn>
          )}
        </div>
      </div>
    </div>
  )
}

/* ---------- Sign in: plain and calm ---------- */

function AuthHead({
  icon,
  title,
  children,
}: {
  icon: string
  title: string
  children: ReactNode
}) {
  return (
    <div className="rise flex flex-col items-center text-center">
      <span className="grid h-16 w-16 -rotate-6 place-items-center rounded-lg bg-cobalt text-white shadow-cobalt">
        <Icon n={icon} s={28} />
      </span>
      <h1 className="semi mt-7 text-30 font-bold tracking-[-0.025em]">
        {title}
      </h1>
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
      <div className="flex flex-1 flex-col px-6 pt-8 pb-8">
        <AuthHead icon="lock" title="Enter your mobile number">
          We'll text a 6-digit code. Payouts go to a UPI in your name.
        </AuthHead>
        <label className="mt-9 flex h-[60px] items-center gap-3 rounded-full bg-surface pr-5 pl-2 shadow-[0_0_0_1.5px_var(--color-line-2)] transition-shadow focus-within:shadow-[0_0_0_2px_var(--color-cobalt)]">
          <span className="tnum flex h-11 items-center rounded-full bg-surface-3 px-3.5 text-16 font-semibold">
            +91
          </span>
          <input
            inputMode="numeric"
            autoComplete="tel-national"
            name="phone"
            aria-label="Mobile number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="tnum min-w-0 flex-1 bg-transparent text-20 font-semibold tracking-[0.02em] outline-none"
          />
          {ok && <Icon n="check" s={20} stroke={2.2} className="text-cobalt" />}
        </label>
        {!ok && phone && (
          <p className="mt-2 pl-5 text-14 text-red">
            Enter a 10-digit mobile number.
          </p>
        )}
        <Btn
          full
          size="lg"
          className="mt-4"
          disabled={!ok}
          onClick={() => a.stage("otp")}
        >
          Send code
        </Btn>
        <Btn full v="ghost" className="mt-2" onClick={() => a.stage("landing")}>
          Use a different method
        </Btn>
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
      className={`tnum h-[60px] w-full min-w-0 bg-transparent text-center text-24 font-bold outline-none placeholder:text-ink-3/40 focus:bg-cobalt-soft disabled:opacity-40 ${
        i % 3 ? "border-l border-line" : ""
      }`}
      placeholder="0"
    />
  )
  return (
    <div className="flex flex-1 flex-col">
      <BackBar onBack={() => a.stage("auth")} />
      <div className="flex flex-1 flex-col px-6 pt-8 pb-8">
        <AuthHead icon="shield" title="Enter your code">
          Sent to{" "}
          <span className="tnum font-semibold text-ink">+91 98204 55121</span>
          <span className="block text-12 text-ink-3">
            Prototype code: 123456
          </span>
        </AuthHead>
        <div
          key={shake}
          className={`mt-9 flex items-center gap-3 ${shake ? "shake" : ""}`}
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
        <Btn
          full
          size="lg"
          className="mt-4"
          disabled={code.length < 6 || lock > 0}
          loading={busy}
          onClick={verify}
        >
          Verify
        </Btn>
        <Btn
          full
          v="outline"
          className="mt-2.5"
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
        <Btn full v="ghost" className="mt-1" onClick={() => a.stage("auth")}>
          Change number
        </Btn>
      </div>
    </div>
  )
}

/* ---------- Language: Bolo answers in the script you pick ---------- */

export function Language() {
  const { s, a } = useStore()
  const keys = Object.keys(LANGS) as Lang[]
  const picked = s.langs ?? [s.lang]
  const [said, setSaid] = useState<Lang>(picked[0])
  const [mood, setMood] = useState<Mood>("hello")
  useEffect(() => {
    setMood("hello")
    const t = window.setTimeout(() => setMood("idle"), 1500)
    return () => clearTimeout(t)
  }, [said])
  const toggle = (k: Lang, on: boolean) => {
    a.toggleLang(k)
    if (!on) setSaid(k)
    else if (said === k) setSaid(picked.find((l) => l !== k) ?? k)
  }
  return (
    <div className="flex flex-1 flex-col">
      <Steps n={1} onBack={() => a.stage("otp")} />
      <div className="px-6 pt-3">
        <h1 className="semi text-30 font-bold tracking-[-0.025em]">
          Which languages can you record in?
        </h1>
        <p className="mt-2 text-16 leading-snug text-pretty text-ink-2">
          Pick every language you speak comfortably. More languages, more
          missions. The app itself stays in English.
        </p>
      </div>
      <div className="mt-5 flex items-center gap-1 px-6">
        <div className="-ml-2 shrink-0">
          <Bolo mood={mood} size={66} label="Bolo" />
        </div>
        <Bubble tail="left" className="flex-1">
          <p
            lang={said}
            className="script text-18 font-semibold"
            aria-live="polite"
          >
            <Typed text={LANGS[said].hello} step={60} />
          </p>
          <p className="text-12 text-ink-3">
            Bolo will direct you in {LANGS[said].name}
          </p>
        </Bubble>
      </div>
      <div
        role="group"
        aria-label="Recording languages"
        className="mt-5 grid grid-cols-2 gap-2.5 px-6"
      >
        {keys.map((k, i) => {
          const on = picked.includes(k)
          const wide = i === keys.length - 1
          return (
            <button
              key={k}
              role="checkbox"
              aria-checked={on}
              onClick={() => toggle(k, on)}
              className={`relative flex overflow-hidden rounded-lg p-4 text-left transition-[background-color,color,scale,box-shadow] duration-200 ease-(--ease-spring) active:scale-[0.97] ${
                wide
                  ? "col-span-2 h-[64px] flex-row-reverse items-center justify-end gap-3"
                  : "h-[112px] flex-col justify-between"
              } ${
                on
                  ? "bg-cobalt text-white shadow-cobalt"
                  : "bg-surface shadow-card"
              }`}
            >
              <span
                className={`text-12 font-semibold ${
                  on ? "text-white/75" : "text-ink-3"
                }`}
              >
                {LANGS[k].name}
              </span>
              <span lang={k} className="text-30 leading-none font-bold">
                {LANGS[k].native}
              </span>
              <span
                className={`absolute right-3.5 grid h-6 w-6 place-items-center rounded-full transition-colors ${
                  wide ? "top-1/2 -translate-y-1/2" : "top-3.5"
                } ${
                  on
                    ? "bg-white text-cobalt"
                    : "shadow-[inset_0_0_0_1.5px_var(--color-line-2)]"
                }`}
              >
                {on && <Icon n="check" s={14} stroke={2.4} />}
              </span>
            </button>
          )
        })}
      </div>
      <p className="mt-4 px-6 text-center text-12 text-ink-3">
        You can add or remove languages later in your profile.
      </p>
      <div className="sticky bottom-0 mt-auto bg-linear-to-t from-canvas via-canvas to-canvas/0 px-6 pt-6 pb-8">
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

/* ---------- Consent: no mascot, just the deal ---------- */

const DEAL: {
  icon: string
  tile: string
  title: string
  body: string
}[] = [
  {
    icon: "mic",
    tile: "bg-cobalt text-white",
    title: "We only record inside a mission",
    body: "Your phone asks for microphone access the first time you start one. Nothing listens in the background.",
  },
  {
    icon: "users",
    tile: "bg-ink text-white",
    title: "Reviewers and AI labs hear it",
    body: "Our team checks each take, then it is licensed to companies building speech AI. Never with your name or number.",
  },
  {
    icon: "shield",
    tile: "bg-ink text-white",
    title: "Delete it whenever you want",
    body: "Ask us to erase your voice data under the DPDP Act 2023. Money already paid stays yours.",
  },
  {
    icon: "wallet",
    tile: "bg-lime text-ink",
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
  const [termsLang, setTermsLang] = useState<Lang>(picked[0])
  if (done) return <Ready onDone={a.acceptConsent} />
  const c = CONSENT_COPY[termsLang]
  const body = (
    <>
      <div className="px-6 pt-3">
        <Tag tone="cobalt" icon="shield">
          Your voice, your call
        </Tag>
        <h1 className="semi mt-3 text-38 font-bold tracking-[-0.03em]">
          Four promises <span className="text-cobalt">before you record.</span>
        </h1>
        <p className="mt-2 text-16 leading-snug text-ink-2">
          The whole deal in plain words. It takes 30 seconds to read.
        </p>
      </div>

      <ol className="mx-6 mt-6 flex flex-col">
        {DEAL.map((d, i) => (
          <li
            key={d.title}
            className="rise relative flex gap-4 pb-5"
            style={{ animationDelay: `${i * 70}ms` }}
          >
            {i < DEAL.length - 1 && (
              <span
                aria-hidden
                className="absolute top-12 bottom-1 left-[21px] w-px bg-line-2"
              />
            )}
            <span
              className={`relative grid h-11 w-11 shrink-0 place-items-center rounded-md ${d.tile}`}
            >
              <Icon n={d.icon} s={20} />
            </span>
            <div className="pt-0.5">
              <h2 className="text-16 leading-tight font-bold">{d.title}</h2>
              <p className="mt-1 text-14 leading-snug text-pretty text-ink-2">
                {d.body}
              </p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mx-6 overflow-hidden rounded-lg bg-surface shadow-card">
        <button
          aria-expanded={full}
          onClick={() => setFull(!full)}
          className="flex w-full items-center justify-between px-4 py-3.5 text-left"
        >
          <span className="text-16 font-semibold">Read the full terms</span>
          <Icon
            n="chev"
            s={18}
            className={`text-ink-3 transition-transform duration-300 ease-(--ease-spring) ${
              full ? "rotate-90" : ""
            }`}
          />
        </button>
        {full && (
          <div className="rise border-t border-line px-4 pt-3 pb-4">
            {picked.length > 1 && (
              <div className="mb-3 flex flex-wrap gap-1.5">
                {picked.map((l) => (
                  <button
                    key={l}
                    lang={l}
                    onClick={() => setTermsLang(l)}
                    className={`h-8 rounded-full px-3 text-14 font-semibold transition-colors ${
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
                  <dt className="text-16 font-semibold">{h}</dt>
                  <dd className="mt-0.5 text-14 text-ink-2">{t}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 mt-auto bg-linear-to-t from-canvas via-canvas to-canvas/0 px-6 pt-8 pb-8">
        <label
          className={`mb-3 flex cursor-pointer items-center gap-3 rounded-md p-3.5 transition-[background-color,box-shadow] duration-200 ${
            adult
              ? "bg-cobalt-soft shadow-[inset_0_0_0_1.5px_var(--color-cobalt)]"
              : "bg-surface shadow-[inset_0_0_0_1.5px_var(--color-line-2)]"
          }`}
        >
          <input
            type="checkbox"
            checked={adult}
            onChange={(e) => setAdult(e.target.checked)}
            className="h-5 w-5 shrink-0 accent-[#2b3bff]"
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

/* ---------- Ready + the archived microphone screen ---------- */

function Ready({ onDone }: { onDone: () => void }) {
  const { s } = useStore()
  const open = sel.openForMe(s)
  const first = open.length ? Math.min(...open.map((j) => j.minutes)) : null
  return (
    <div className="flex flex-1 flex-col">
      <Plate tone="cobalt" className="h-[400px]">
        <div className="relative grid h-[346px] place-items-center">
          {[268, 200, 136].map((d) => (
            <span
              key={d}
              aria-hidden
              className="absolute rounded-full bg-white/[.07]"
              style={{ width: d, height: d }}
            />
          ))}
          <Bolo
            mood="happy"
            tone="white"
            size={140}
            ground="none"
            label="Bolo, happy"
          />
        </div>
      </Plate>
      <div className="rise flex flex-1 flex-col px-6 pt-7 pb-8 text-center">
        <h1 className="semi text-38 font-bold tracking-[-0.03em]">
          You're ready
        </h1>
        <p className="mx-auto mt-3 max-w-[30ch] text-16 leading-snug text-ink-2">
          Your first ₹100 unlocks withdrawals.
          {first ? ` The shortest mission takes about ${first} minutes.` : ""}
        </p>
        {open.length > 0 && (
          <div className="tnum mx-auto mt-5 flex items-center gap-2 rounded-full bg-surface px-4 py-2 text-14 font-semibold shadow-card">
            <span className="h-2 w-2 rounded-full bg-cobalt" /> {open.length}{" "}
            missions open in <span lang={s.lang}>{LANGS[s.lang].native}</span>
          </div>
        )}
        <div className="mt-auto pt-8">
          <Btn full size="lg" v="voice" iconRight="arrow" onClick={onDone}>
            Find my first mission
          </Btn>
        </div>
      </div>
    </div>
  )
}

/** Archived: not in the onboarding flow, since the OS permission prompt covers it. Kept for the in-app denied-mic path.
    Allowing here is simulated; the real microphone is only ever opened inside the studio. */
export function MicPrime({ inApp }: { inApp?: boolean }) {
  const { s, a } = useStore()
  const [ready, setReady] = useState(false)
  const denied = s.mic === "denied"
  if (ready) return <Ready onDone={() => a.setMic("granted")} />
  const allow = () => (inApp ? a.setMic("granted") : setReady(true))
  return (
    <div className="flex flex-1 flex-col">
      <Plate tone="studio" className="h-[436px]">
        <div className="flex h-12 items-center px-2">
          {inApp ? (
            <IconBtn n="back" label="Back" dark onClick={a.pop} />
          ) : (
            <div aria-hidden className="flex flex-1 gap-1.5 px-4">
              {[1, 2, 3].map((i) => (
                <span key={i} className="h-1 flex-1 rounded-full bg-white/80" />
              ))}
            </div>
          )}
        </div>
        <div className="grid h-[330px] place-items-center">
          <BoloStage state={denied ? "retry" : "listening"} size={300} />
        </div>
      </Plate>
      <div
        key={String(denied)}
        className="rise flex flex-1 flex-col px-6 pt-7 pb-8"
      >
        {denied ? (
          <>
            <h1 className="semi text-30 font-bold tracking-[-0.025em]">
              Microphone is blocked
            </h1>
            <p className="mt-2 text-16 leading-snug text-ink-2">
              Your consent is saved. You can browse missions and your wallet,
              but recording needs the microphone.
            </p>
            <ol className="mt-5 flex flex-col gap-2 text-16">
              {[
                "Open Settings → Apps → Feul",
                "Tap Permissions → Microphone",
                "Choose “Allow only while using the app”",
              ].map((t, i) => (
                <li key={t} className="flex items-center gap-3">
                  <span className="tnum grid h-6 w-6 shrink-0 place-items-center rounded-full bg-orange-soft text-12 font-bold text-orange-ink">
                    {i + 1}
                  </span>
                  {t}
                </li>
              ))}
            </ol>
            <div className="mt-auto flex flex-col gap-1.5 pt-8">
              <Btn full size="lg" v="voice" icon="mic" onClick={allow}>
                I've allowed it, try again
              </Btn>
              <Btn
                full
                v="ghost"
                onClick={() => (inApp ? a.pop() : a.stage("done"))}
              >
                Browse missions for now
              </Btn>
            </div>
          </>
        ) : (
          <>
            <h1 className="semi text-30 font-bold tracking-[-0.025em]">
              Allow the microphone to record missions
            </h1>
            <p className="mt-2 text-16 leading-snug text-ink-2">
              Feul only listens while you record inside a mission. Hold the
              phone close, like a normal call.
            </p>
            <div className="mt-auto flex flex-col gap-1.5 pt-8">
              <Btn full size="lg" v="voice" icon="mic" onClick={allow}>
                Allow microphone
              </Btn>
              <Btn full v="ghost" onClick={() => a.setMic("denied")}>
                Not now
              </Btn>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
