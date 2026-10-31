import { useCallback, useEffect, useState, type ReactNode } from "react"
import { AnimatePresence, MotionConfig, motion } from "motion/react"
import {
  JOBS,
  makeSession,
  type State,
  type View,
  type Withdrawal,
} from "./state/model"
import { Snapshot, StoreProvider, useStore } from "./state/store"
import { BottomNav, Mark, SPRING, ToneCtx, TopBar, type Tone } from "./ui/kit"
import {
  Auth,
  Consent,
  Landing,
  Language,
  MicPrime,
  Otp,
} from "./screens/Onboarding"
import Home from "./screens/Home"
import Jobs, { JobDetail } from "./screens/Jobs"
import Studio from "./screens/Studio"
import Review, { Complete, Credited, Submission } from "./screens/Review"
import Wallet, { Withdraw, WithdrawalStatus } from "./screens/Wallet"
import Profile from "./screens/Profile"
import Sheets from "./screens/Sheets"

function ViewScreen({ v }: { v: View }) {
  switch (v.name) {
    case "detail":
      return <JobDetail id={v.jobId} />
    case "studio":
      return <Studio />
    case "review":
      return <Review />
    case "complete":
      return <Complete id={v.id} />
    case "submission":
      return <Submission id={v.id} />
    case "credited":
      return (
        <Credited
          amount={v.amount}
          bonus={v.bonus}
          title={v.title}
          pending={v.pending}
        />
      )
    case "withdraw":
      return <Withdraw />
    case "withdrawal":
      return <WithdrawalStatus />
    case "profile":
      return <Profile />
    case "consent":
      return <Consent inApp />
    case "mic":
      return <MicPrime inApp />
  }
}

/* ---------- Shell ---------- */

const DEFAULT_TONE: Tone = { ink: "dark", bg: "canvas" }
const BG: Record<Tone["bg"], string> = {
  canvas: "bg-canvas",
  studio: "bg-studio",
  ink: "bg-ink",
}
const STAGES = ["landing", "auth", "otp", "language", "consent", "mic"]
const EASE = [0.32, 0.72, 0, 1] as const

/* Push slides in from the right over the current screen; pop slides the top screen away to reveal
   the one beneath; tab switches crossfade. Direction comes from the change in navigation depth. */
const LAYER = {
  enter: (d: number) =>
    d === 0
      ? { opacity: 0, x: 0, zIndex: 1 }
      : { x: d > 0 ? "100%" : "-28%", opacity: 1, zIndex: d > 0 ? 1 : 0 },
  center: (d: number) => ({
    x: 0,
    opacity: 1,
    zIndex: d < 0 ? 0 : 1,
    transition: { duration: d === 0 ? 0.24 : 0.44, ease: EASE },
  }),
  exit: (d: number) =>
    d === 0
      ? {
          opacity: 0,
          zIndex: 0,
          pointerEvents: "none" as const,
          transition: { duration: 0.18 },
        }
      : {
          x: d > 0 ? "-28%" : "100%",
          zIndex: d > 0 ? 0 : 1,
          pointerEvents: "none" as const,
          transition: { duration: 0.44, ease: EASE },
        },
}

function StatusBar({ ink }: { ink: Tone["ink"] }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-x-0 top-0 z-30 flex h-[54px] items-end justify-between px-8 pb-2.5 text-[15px] font-semibold transition-colors duration-300 ${
        ink === "light" ? "text-white" : "text-ink"
      }`}
    >
      <span className="tnum w-14">9:41</span>
      <span className="flex w-14 items-center justify-end gap-1.5">
        <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor">
          <rect x="0" y="7" width="3" height="4" rx="1" />
          <rect x="4.5" y="5" width="3" height="6" rx="1" />
          <rect x="9" y="2.5" width="3" height="8.5" rx="1" />
          <rect x="13.5" y="0" width="3" height="11" rx="1" />
        </svg>
        <svg width="25" height="12" viewBox="0 0 25 12" fill="none">
          <rect
            x="0.5"
            y="0.5"
            width="21"
            height="11"
            rx="3.5"
            stroke="currentColor"
            opacity=".4"
          />
          <rect x="2" y="2" width="16" height="8" rx="2" fill="currentColor" />
          <rect
            x="23"
            y="4"
            width="1.5"
            height="4"
            rx=".75"
            fill="currentColor"
            opacity=".4"
          />
        </svg>
      </span>
    </div>
  )
}

/** One mounted screen: its own status bar, backdrop, scroll position and tone scope.
    While exiting it renders a frozen snapshot of state, so it never blanks or flips mid-transition. */
function Layer({
  k,
  dir,
  s,
  tone,
  onTone,
  nav,
  children,
}: {
  k: string
  dir: number
  s: State
  tone: Tone
  onTone: (k: string, t: Tone) => void
  nav: boolean
  children: ReactNode
}) {
  const set = useCallback((t: Tone) => onTone(k, t), [k, onTone])
  return (
    <motion.div
      custom={dir}
      variants={LAYER}
      initial="enter"
      animate="center"
      exit="exit"
      className={`absolute inset-0 overflow-hidden shadow-[-18px_0_44px_rgb(14_15_20/.16)] ${BG[tone.bg]}`}
    >
      <ToneCtx.Provider value={set}>
        <Snapshot s={s}>
          <StatusBar ink={tone.ink} />
          <div className="no-scrollbar h-full overflow-y-auto overscroll-contain">
            <div
              className={`flex min-h-full flex-col ${nav ? "pb-[120px]" : ""}`}
            >
              {children}
            </div>
          </div>
        </Snapshot>
      </ToneCtx.Provider>
    </motion.div>
  )
}

function Toast({ text }: { text: string }) {
  return (
    <motion.div
      role="status"
      initial={{ opacity: 0, y: 18, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.98 }}
      transition={SPRING}
      className="absolute inset-x-4 bottom-[116px] z-50 flex items-center gap-3 rounded-md bg-ink px-4 py-3.5 text-14 leading-snug text-white shadow-float"
    >
      <Mark s={14} color="#FFB07A" />
      {text}
    </motion.div>
  )
}

function Phone() {
  const { s } = useStore()
  const top = s.stack.at(-1)
  const id = top ? ("jobId" in top ? top.jobId : "id" in top ? top.id : "") : ""
  const key = `${s.epoch ?? 0}:${
    s.stage !== "done"
      ? s.stage
      : top
        ? `${s.stack.length}-${top.name}-${id}`
        : `tab-${s.tab}`
  }`
  const depth =
    s.stage !== "done" ? STAGES.indexOf(s.stage) : 10 + s.stack.length
  const [nav, setNav] = useState({ key, depth, dir: 0 })
  let dir = nav.dir
  if (nav.key !== key) {
    dir = depth > nav.depth ? 1 : depth < nav.depth ? -1 : 0
    setNav({ key, depth, dir })
  }
  const [tones, setTones] = useState<Record<string, Tone>>({})
  const onTone = useCallback(
    (k: string, t: Tone) =>
      setTones((m) =>
        m[k]?.ink === t.ink && m[k]?.bg === t.bg ? m : { ...m, [k]: t },
      ),
    [],
  )
  const tone = tones[key] ?? DEFAULT_TONE

  let body: ReactNode
  if (s.stage !== "done") {
    body = {
      landing: <Landing />,
      auth: <Auth />,
      otp: <Otp />,
      language: <Language />,
      consent: <Consent />,
      mic: <MicPrime />,
    }[s.stage]
  } else if (top) {
    body = <ViewScreen v={top} />
  } else {
    body = (
      <>
        <TopBar />
        {s.tab === "home" ? <Home /> : s.tab === "jobs" ? <Jobs /> : <Wallet />}
      </>
    )
  }
  const showNav = s.stage === "done" && !top
  return (
    <div className="relative h-full overflow-hidden bg-canvas">
      <AnimatePresence initial={false} custom={dir}>
        <Layer
          key={key}
          k={key}
          dir={dir}
          s={s}
          tone={tone}
          onTone={onTone}
          nav={showNav}
        >
          {body}
        </Layer>
      </AnimatePresence>
      <AnimatePresence>{showNav && <BottomNav key="nav" />}</AnimatePresence>
      <AnimatePresence>
        {s.sheet && (
          <Snapshot key={s.sheet} s={s}>
            <Sheets />
          </Snapshot>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {s.toast && <Toast key={s.toast} text={s.toast} />}
      </AnimatePresence>
      <span
        aria-hidden
        className="pointer-events-none absolute top-[11px] left-1/2 z-[70] h-[34px] w-[122px] -translate-x-1/2 rounded-full bg-black"
      />
      <span
        aria-hidden
        className={`pointer-events-none absolute bottom-2 left-1/2 z-[70] h-[5px] w-[134px] -translate-x-1/2 rounded-full transition-colors duration-300 ${
          tone.ink === "light" && !s.sheet ? "bg-white/80" : "bg-ink/85"
        }`}
      />
    </div>
  )
}

/* ---------- Prototype chrome (outside the product) ---------- */

type Page = {
  label: string
  hint: string
  go: (a: ReturnType<typeof useStore>["a"]) => void
}
const CHAI = JOBS.find((j) => j.id === "j-chai-hi")!
const WAKE = JOBS.find((j) => j.id === "j-wake-hi")!
const W =
  (status: Withdrawal["status"], extra: Partial<Withdrawal> = {}) =>
  (s: State): Partial<State> => ({
    tab: "wallet",
    stack: [{ name: "withdrawal" }],
    withdrawal: s.withdrawal && { ...s.withdrawal, status, ...extra },
  })
const FLOWS: {
  title: string
  pages: Page[]
}[] = [
  {
    title: "Onboarding",
    pages: [
      { label: "Landing", hint: "Meet Bolo", go: (a) => a.goto("fresh") },
      {
        label: "Phone sign-in",
        hint: "OTP is 123456",
        go: (a) => a.goto("fresh", () => ({ stage: "auth" })),
      },
      {
        label: "Language",
        hint: "Native scripts",
        go: (a) => a.goto("fresh", () => ({ stage: "language" })),
      },
      {
        label: "Consent",
        hint: "18+ · DPDP",
        go: (a) => a.goto("fresh", () => ({ stage: "consent" })),
      },
      {
        label: "Microphone blocked",
        hint: "Settings path",
        go: (a) =>
          a.goto("new", () => ({ mic: "denied", stack: [{ name: "mic" }] })),
      },
    ],
  },
  {
    title: "Home states",
    pages: [
      {
        label: "New contributor",
        hint: "First ₹100 path",
        go: (a) => a.goto("new"),
      },
      {
        label: "Returning",
        hint: "₹82 · ≈₹337/hr",
        go: (a) => a.goto("returning"),
      },
      {
        label: "Resume session",
        hint: "Saved 24h",
        go: (a) => a.goto("active"),
      },
      {
        label: "Upload failed",
        hint: "Not a rejection",
        go: (a) => a.goto("uploadFailed"),
      },
      {
        label: "Resume expired",
        hint: "Clips lost",
        go: (a) => a.goto("expired"),
      },
      {
        label: "Needs a retake",
        hint: "Held, not lost",
        go: (a) => a.goto("repairLines"),
      },
      {
        label: "No matching work",
        hint: "Bolo sleeps",
        go: (a) => a.goto("noWork"),
      },
      {
        label: "Notifications",
        hint: "Deep links",
        go: (a) => a.goto("returning", () => ({ sheet: "notifications" })),
      },
      {
        label: "Meet Bolo",
        hint: "States · pay",
        go: (a) => a.goto("returning", () => ({ sheet: "bolo" })),
      },
    ],
  },
  {
    title: "Scenes",
    pages: [
      {
        label: "Scenes list",
        hint: "Search · lengths",
        go: (a) => a.goto("returning", () => ({ tab: "jobs" })),
      },
      {
        label: "Quick scenes",
        hint: "Under 5 min",
        go: (a) => a.goto("returning", () => ({ tab: "jobs", len: "quick" })),
      },
      {
        label: "Deep scenes",
        hint: "Chapters",
        go: (a) => a.goto("returning", () => ({ tab: "jobs", len: "deep" })),
      },
      {
        label: "Detail · Role-play",
        hint: "The deal",
        go: (a) =>
          a.goto("returning", () => ({
            tab: "jobs",
            stack: [{ name: "detail", jobId: "j-shop-hi" }],
          })),
      },
      {
        label: "Detail · Deep",
        hint: "Paid per chapter",
        go: (a) =>
          a.goto("returning", () => ({
            tab: "jobs",
            stack: [{ name: "detail", jobId: "j-rail-hi" }],
          })),
      },
      {
        label: "Detail · Locked",
        hint: "Level 3",
        go: (a) =>
          a.goto("returning", () => ({
            tab: "jobs",
            stack: [{ name: "detail", jobId: "j-bank-hi" }],
          })),
      },
      {
        label: "Detail · Oversubscribed",
        hint: "Paused",
        go: (a) =>
          a.goto("returning", () => ({
            tab: "jobs",
            stack: [{ name: "detail", jobId: "j-bill-hi" }],
          })),
      },
    ],
  },
  {
    title: "Studio",
    pages: [
      {
        label: "Level check",
        hint: "First session",
        go: (a) =>
          a.goto("new", () => ({
            session: makeSession(CHAI),
            stack: [{ name: "studio" }],
          })),
      },
      {
        label: "Role-play turn",
        hint: "Bolo plays the owner",
        go: (a) => a.goto("active", () => ({ stack: [{ name: "studio" }] })),
      },
      {
        label: "Read aloud",
        hint: "Script + direction",
        go: (a) =>
          a.goto("returning", () => ({
            session: makeSession(WAKE, { calibrated: true }),
            stack: [{ name: "studio" }],
          })),
      },
      {
        label: "Check takes",
        hint: "Before submit",
        go: (a) =>
          a.goto("active", (st) => ({
            session: st.session && {
              ...st.session,
              status: "reviewing",
              clips: st.session.clips.map((c, i) => ({
                ...c,
                state: "recorded_local",
                secs: c.secs || 5 + i,
              })),
            },
            stack: [{ name: "review" }],
          })),
      },
      {
        label: "Upload retry",
        hint: "Safe on phone",
        go: (a) =>
          a.goto("uploadFailed", () => ({ stack: [{ name: "review" }] })),
      },
      {
        label: "Session complete",
        hint: "Bolo cheers",
        go: (a) =>
          a.goto("returning", () => ({
            stack: [{ name: "complete", id: "S-shop" }],
          })),
      },
    ],
  },
  {
    title: "Review & repair",
    pages: [
      {
        label: "Under review",
        hint: "Timeline",
        go: (a) =>
          a.goto("returning", () => ({
            stack: [{ name: "submission", id: "S-shop" }],
          })),
      },
      {
        label: "Repair · Role-play",
        hint: "Redo 1 turn",
        go: (a) =>
          a.goto("repairLines", () => ({
            stack: [{ name: "submission", id: "S-lines" }],
          })),
      },
      {
        label: "Earning credited",
        hint: "₹38 + ₹6 bonus",
        go: (a) =>
          a.goto("returning", () => ({
            stack: [
              {
                name: "credited",
                amount: 38,
                bonus: 6,
                title: "Kirana price check",
              },
            ],
          })),
      },
      {
        label: "Partly approved",
        hint: "₹28 + ₹10 fix",
        go: (a) =>
          a.goto("returning", () => ({
            stack: [
              {
                name: "credited",
                amount: 28,
                pending: 10,
                title: "Kirana price check",
              },
            ],
          })),
      },
    ],
  },
  {
    title: "Wallet",
    pages: [
      {
        label: "Wallet",
        hint: "Ledger · ₹/hr",
        go: (a) => a.goto("returning", () => ({ tab: "wallet" })),
      },
      {
        label: "Add UPI",
        hint: "Name match",
        go: (a) =>
          a.goto("new", () => ({
            tab: "wallet",
            available: 120,
            stack: [{ name: "withdraw" }],
          })),
      },
      {
        label: "Withdraw",
        hint: "Amount → slide",
        go: (a) =>
          a.goto("returning", () => ({
            tab: "wallet",
            available: 142,
            stack: [{ name: "withdraw" }],
          })),
      },
      {
        label: "Processing",
        hint: "No UTR yet",
        go: (a) => a.goto("withdrawProcessing", W("processing")),
      },
      {
        label: "Paid receipt",
        hint: "With UTR",
        go: (a) =>
          a.goto("withdrawProcessing", W("paid", { utr: "412893018842" })),
      },
      {
        label: "Delayed",
        hint: "Bank slow",
        go: (a) => a.goto("withdrawProcessing", W("delayed")),
      },
      {
        label: "Failed",
        hint: "Money returned",
        go: (a) => a.goto("withdrawProcessing", W("failed")),
      },
      {
        label: "On hold",
        hint: "Check pending",
        go: (a) => a.goto("withdrawProcessing", W("hold")),
      },
    ],
  },
  {
    title: "Profile & data",
    pages: [
      {
        label: "Profile & data vault",
        hint: "Revoke · delete",
        go: (a) =>
          a.goto("returning", () => ({ stack: [{ name: "profile" }] })),
      },
      {
        label: "Name & language",
        hint: "Re-consent",
        go: (a) =>
          a.goto("returning", () => ({
            stack: [{ name: "profile" }],
            sheet: "edit",
          })),
      },
    ],
  },
]

function FlowNav() {
  const { a } = useStore()
  const [active, setActive] = useState(
    () => decodeURIComponent(location.hash.slice(1)) || "Landing",
  )
  useEffect(() => {
    FLOWS.flatMap((f) => f.pages)
      .find((p) => p.label === active)
      ?.go(a)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <nav
      aria-label="App flows"
      className="flex h-full w-[272px] shrink-0 flex-col border-e border-ink/[.06] bg-white/70 backdrop-blur max-[1100px]:hidden"
    >
      <div className="px-6 pt-7 pb-5">
        <div className="flex items-end gap-1.5">
          <Mark s={17} className="mb-[3px]" />
          <span className="semi text-24 leading-none font-bold tracking-[-0.03em]">
            feul
          </span>
          <span className="ml-1 rounded-full bg-ink px-2 py-0.5 text-11 font-semibold text-white">
            2.0
          </span>
        </div>
        <div className="mt-1.5 text-12 font-medium text-ink-3">
          Prototype · flows and states
        </div>
      </div>
      <div className="no-scrollbar flex-1 space-y-6 overflow-y-auto px-3 pb-8">
        {FLOWS.map((f, fi) => (
          <section key={f.title}>
            <h2 className="mb-1.5 flex items-center gap-2 px-3 text-12 font-semibold text-ink-3">
              <span className="tnum font-mono text-11">
                {String(fi + 1).padStart(2, "0")}
              </span>
              {f.title}
            </h2>
            <ul>
              {f.pages.map((p) => {
                const on = active === p.label
                return (
                  <li key={p.label}>
                    <button
                      aria-current={on ? "page" : undefined}
                      onClick={() => (
                        setActive(p.label),
                        history.replaceState(
                          null,
                          "",
                          "#" + encodeURIComponent(p.label),
                        ),
                        p.go(a)
                      )}
                      className={`flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-start text-14 transition-colors ${
                        on ? "bg-ink text-white" : "text-ink hover:bg-ink/[.04]"
                      }`}
                    >
                      <span className="truncate">{p.label}</span>
                      <span
                        className={`shrink-0 text-12 ${
                          on ? "text-white/60" : "text-ink-3"
                        }`}
                      >
                        {p.hint}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
    </nav>
  )
}

function DemoPanel() {
  const { s, a } = useStore()
  const [open, setOpen] = useState(true)
  const subs = s.submissions.filter(
    (x) => x.status === "under_review" || x.status === "appeal",
  )
  const btn =
    "w-full rounded-sm bg-surface-2 px-3 py-2 text-left text-12 font-medium transition-colors hover:bg-surface-3 disabled:opacity-40"
  const head =
    "px-1 text-11 font-semibold tracking-[0.06em] text-ink-3 uppercase"
  return (
    <aside
      className={`fixed top-6 right-6 z-50 rounded-lg bg-surface text-ink shadow-float max-[800px]:top-auto max-[800px]:bottom-4 ${
        open ? "w-[256px]" : "w-auto"
      }`}
    >
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-12 font-semibold text-ink-2"
      >
        Simulate events <span aria-hidden>{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="max-h-[72vh] space-y-4 overflow-y-auto px-3 pb-4">
          <label className="hidden px-1 text-12 max-[1100px]:block">
            Jump to screen
            <select
              className="mt-1 w-full rounded-sm border border-line px-2 py-2 text-14"
              defaultValue=""
              onChange={(e) =>
                FLOWS.flatMap((f) => f.pages)
                  .find((p) => p.label === e.target.value)
                  ?.go(a)
              }
            >
              <option value="" disabled>
                Choose a screen
              </option>
              {FLOWS.map((f) => (
                <optgroup key={f.title} label={f.title}>
                  {f.pages.map((p) => (
                    <option key={p.label}>{p.label}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
          <div className="space-y-1">
            <div className={head}>Review system</div>
            {subs.length === 0 && (
              <p className="px-1 text-12 text-ink-3">
                Submit a scene to simulate review.
              </p>
            )}
            {subs.map((x) => (
              <div key={x.id} className="flex gap-1">
                <button className={btn} onClick={() => a.approve(x.id)}>
                  Approve
                </button>
                <button className={btn} onClick={() => a.partial(x.id)}>
                  Reject part
                </button>
              </div>
            ))}
          </div>
          <div className="space-y-1">
            <div className={head}>Withdrawal</div>
            <div className="grid grid-cols-2 gap-1">
              {(["paid", "delayed", "failed", "hold"] as const).map((k) => (
                <button
                  key={k}
                  disabled={
                    !s.withdrawal ||
                    s.withdrawal.status === "paid" ||
                    s.withdrawal.status === "failed"
                  }
                  className={btn}
                  onClick={() => a.advanceWithdrawal(k)}
                >
                  → {k}
                </button>
              ))}
            </div>
            <label className="flex items-center justify-between px-1 pt-1 text-12">
              UPI check
              <select
                value={s.sim.upiResult}
                onChange={(e) =>
                  a.setSim({
                    upiResult: e.target.value as State["sim"]["upiResult"],
                  })
                }
                className="rounded-sm border border-line px-1 py-0.5"
              >
                <option value="matched">matched</option>
                <option value="mismatch">mismatch</option>
                <option value="unavailable">unavailable</option>
              </select>
            </label>
          </div>
          <div className="space-y-1">
            <div className={head}>Session & campaign</div>
            <label className="flex items-center gap-2 px-1 text-12">
              <input
                type="checkbox"
                checked={s.sim.failUpload}
                onChange={(e) => a.setSim({ failUpload: e.target.checked })}
              />
              Next upload fails
            </label>
            <button
              className={btn}
              disabled={!s.session || s.session.status === "expired"}
              onClick={a.expireSession}
            >
              Expire resume window
            </button>
            <button className={btn} onClick={a.closeCampaign}>
              Close campaign of in-flight job
            </button>
          </div>
          <div className="space-y-1">
            <div className={head}>Studio</div>
            <div className="grid grid-cols-2 gap-1">
              <button
                className={btn}
                onClick={() =>
                  window.dispatchEvent(
                    new CustomEvent("feul:sim", { detail: "mic-lost" }),
                  )
                }
              >
                Mic lost
              </button>
              <button
                className={btn}
                onClick={() =>
                  window.dispatchEvent(
                    new CustomEvent("feul:sim", { detail: "prompt-fail" }),
                  )
                }
              >
                AI line fails
              </button>
            </div>
            <label className="flex items-start gap-2 px-1 pt-1 text-12 leading-snug">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={s.sim.realMic}
                onChange={(e) => a.setSim({ realMic: e.target.checked })}
              />
              <span>
                Real mic level
                <span className="block text-ink-3">
                  Opt-in. Asks only when you record; falls back to simulated.
                </span>
              </span>
            </label>
          </div>
        </div>
      )}
    </aside>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <MotionConfig reducedMotion="user">
        <div className="flex h-screen bg-[#e6e8ef] max-[480px]:bg-canvas">
          <FlowNav />
          <main className="flex flex-1 items-center justify-center overflow-auto p-6 max-[480px]:p-0">
            <div className="relative shrink-0 rounded-[62px] bg-[#111217] p-[11px] shadow-[0_0_0_1.5px_#2a2c34,0_40px_90px_rgba(14,15,20,.28)] [zoom:min(1,calc((100vh-48px)/866px))] max-[480px]:rounded-none max-[480px]:p-0 max-[480px]:shadow-none max-[480px]:[zoom:1]">
              <span
                aria-hidden
                className="absolute top-[170px] -left-[3px] h-[34px] w-[3px] rounded-s bg-[#2a2c34]"
              />
              <span
                aria-hidden
                className="absolute top-[230px] -left-[3px] h-[62px] w-[3px] rounded-s bg-[#2a2c34]"
              />
              <span
                aria-hidden
                className="absolute top-[304px] -left-[3px] h-[62px] w-[3px] rounded-s bg-[#2a2c34]"
              />
              <span
                aria-hidden
                className="absolute top-[250px] -right-[3px] h-[96px] w-[3px] rounded-e bg-[#2a2c34]"
              />
              <div className="relative h-[844px] w-[390px] overflow-hidden rounded-[52px] bg-canvas [transform:translateZ(0)] max-[480px]:h-[100dvh] max-[480px]:w-screen max-[480px]:rounded-none">
                <Phone />
              </div>
            </div>
          </main>
          <DemoPanel />
        </div>
      </MotionConfig>
    </StoreProvider>
  )
}
