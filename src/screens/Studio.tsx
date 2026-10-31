import { useEffect, useRef, useState } from "react"
import {
  AnimatePresence,
  useMotionValueEvent,
  type MotionValue,
} from "motion/react"
import { FORMAT_LABEL, LANGS, type Job, type Prompt } from "../state/model"
import { sel, useStore } from "../state/store"
import {
  BoloStage,
  Typed,
  outfitFor,
  useListening,
  useVoiceLevel,
  type BoloState,
} from "../ui/Bolo"
import {
  Btn,
  Dialog,
  Icon,
  IconBtn,
  Tag,
  buzz,
  inr,
  mmss,
  useTimer,
  useTone,
} from "../ui/kit"

/* Leaving a session with local recordings: save for later or discard (with confirmation). */
export function LeaveFlow({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { s, a } = useStore()
  const [confirm, setConfirm] = useState(false)
  const sess = s.session
  const n = sess ? sess.clips.filter((c) => c.state !== "ready").length : 0
  return (
    <AnimatePresence>
      {open && sess && confirm && (
        <Dialog
          key="confirm"
          title={`Discard ${n} recorded ${n === 1 ? "take" : "takes"}?`}
          actions={
            <>
              <Btn v="danger" full onClick={a.discard}>
                Discard permanently
              </Btn>
              <Btn v="ghost" full onClick={() => setConfirm(false)}>
                Keep them
              </Btn>
            </>
          }
        >
          These takes exist only on this phone and were never submitted.
          Discarding deletes them now and can't be undone. No payout is attached
          to them.
        </Dialog>
      )}
      {open && sess && !confirm && (
        <Dialog
          key="leave"
          title="Leave the studio?"
          actions={
            <>
              <Btn full v="ink" onClick={() => (onClose(), a.leaveSession())}>
                Save on this phone · resume within {sess.resumeLeft}
              </Btn>
              <Btn
                v="outline"
                full
                onClick={() => (n ? setConfirm(true) : a.discard())}
              >
                Discard session
              </Btn>
              <Btn v="ghost" full onClick={onClose}>
                Stay
              </Btn>
            </>
          }
        >
          {n > 0
            ? `${n} ${
                n === 1 ? "take is" : "takes are"
              } recorded on this phone but not submitted.`
            : "Nothing recorded yet."}{" "}
          Your <span className="tnum">{inr(sess.locked.total)}</span> stays
          locked while you can resume.
        </Dialog>
      )}
    </AnimatePresence>
  )
}

export default function Studio() {
  const { s } = useStore()
  useTone("light", "studio")
  const sess = s.session
  const [leave, setLeave] = useState(false)
  if (!sess) return null
  const j = sel.job(s, sess.jobId)
  const room = j.format === "ROOM"
  const done = sess.clips.filter((c) => c.state !== "ready").length
  return (
    <div className="relative flex flex-1 flex-col bg-studio text-studio-ink">
      <header className="flex items-center gap-1 px-2 pt-[54px] pb-1">
        <IconBtn
          n="close"
          label="Leave studio"
          dark
          onClick={() => setLeave(true)}
        />
        <div className="min-w-0 flex-1">
          <div className="truncate text-16 font-semibold">
            {sess.repairOf ? `Retake · ${j.title}` : j.title}
          </div>
          <div className="tnum truncate text-12 text-studio-ink-2">
            <span className="font-semibold text-studio-ink">
              {inr(sess.locked.total)} locked
            </span>{" "}
            · {FORMAT_LABEL[j.format]} · {LANGS[j.lang].native}
          </div>
        </div>
        <MicSource />
        <span
          className="tnum mr-3 ml-1.5 inline-flex h-8 items-center rounded-full bg-white/8 px-3 text-12 font-semibold"
          aria-label={`${done} of ${sess.clips.length} recorded`}
        >
          {done}/{sess.clips.length}
        </span>
      </header>
      <div className="flex gap-1 px-5 pt-1" aria-hidden>
        {sess.clips.map((c, i) => (
          <span
            key={c.id}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
              c.state !== "ready"
                ? "bg-brand-hi"
                : i === sess.index
                  ? "bg-white"
                  : "bg-white/12"
            }`}
          />
        ))}
      </div>
      {room ? (
        <div className="flex flex-1 flex-col">
          {!sess.roomConsented ? <RoomConsent /> : <RoomCapture />}
        </div>
      ) : !sess.calibrated ? (
        <Calibrate />
      ) : (
        <Capture key={sess.index} />
      )}
      <LeaveFlow open={leave} onClose={() => setLeave(false)} />
    </div>
  )
}

/* The prototype records nothing. Bolo follows a simulated voice unless you opt in to your real mic level,
   which is read on this phone and thrown away every frame. The browser asks only when you start recording. */
function MicSource() {
  const { s, a } = useStore()
  const real = s.sim.realMic
  return (
    <button
      aria-pressed={real}
      aria-label={
        real
          ? "Using your live mic level. Switch to the demo level"
          : "Using a demo mic level. Switch to your live mic level"
      }
      onClick={() => (
        a.setSim({ realMic: !real }),
        a.toast(
          real
            ? "Back to the demo level. Nothing is recorded either way."
            : "Bolo will follow your real mic level when you record. Nothing leaves this phone.",
        )
      )}
      className={`flex h-8 items-center gap-1.5 rounded-full px-3 text-12 font-semibold transition-colors ${
        real
          ? "bg-brand text-white"
          : "bg-white/8 text-studio-ink-2 hover:text-studio-ink"
      }`}
    >
      <Icon n="wave" s={14} stroke={2} />
      {real ? "Live" : "Demo"}
    </button>
  )
}

const useLevel = (on: boolean) => {
  const { s, a } = useStore()
  return useVoiceLevel(on, s.sim.realMic, () =>
    a.toast("Microphone level unavailable, so Bolo is using the demo level"),
  )
}

/** True once the voice has been near-silent for a while: Bolo coaches instead of guessing. */
function useQuiet(level: MotionValue<number>, on: boolean) {
  const [quiet, setQuiet] = useState(false)
  const since = useRef<number | null>(null)
  useMotionValueEvent(level, "change", (v) => {
    if (!on) return
    const now = performance.now()
    if (v < 0.08) {
      if (since.current == null) since.current = now
      else if (now - since.current > 1500 && !quiet) setQuiet(true)
    } else {
      since.current = null
      if (quiet) setQuiet(false)
    }
  })
  useEffect(() => {
    if (on) return
    since.current = null
    setQuiet(false)
  }, [on])
  return quiet
}

function RecordButton({
  on,
  onClick,
  disabled,
  label,
}: {
  on: boolean
  onClick: () => void
  disabled?: boolean
  label?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label ?? (on ? "Stop recording" : "Start recording")}
      className={`relative grid h-[72px] w-[72px] place-items-center rounded-full transition-[background-color,box-shadow,scale,color] duration-300 ease-(--ease-spring) active:not-disabled:scale-95 disabled:bg-white/10 disabled:text-studio-ink-3 disabled:shadow-none ${
        on
          ? "bg-white text-brand shadow-[0_0_0_8px_rgba(245,100,15,.18)]"
          : "bg-brand text-white shadow-brand"
      }`}
    >
      {/* Steady halo while recording: calm, no ping or flashing */}
      {on ? (
        <span className="relative h-6 w-6 rounded-[7px] bg-current" />
      ) : (
        <Icon n="mic" s={28} />
      )}
    </button>
  )
}

function Calibrate() {
  const { s, a } = useStore()
  const j = sel.job(s, s.session!.jobId)
  const [step, setStep] = useState(0)
  const [rec, setRec] = useState(false)
  const [ok, setOk] = useState(false)
  const level = useLevel(rec)
  const phrases = [LANGS[j.lang].count, LANGS[j.lang].phrase]
  useEffect(() => {
    if (!rec) return
    const t = setTimeout(() => (setRec(false), setOk(true), buzz(10)), 2400)
    return () => clearTimeout(t)
  }, [rec])
  useEffect(() => {
    if (!ok) return
    const t = setTimeout(() => {
      setOk(false)
      if (step === 1) a.calibrated()
      else setStep(1)
    }, 1000)
    return () => clearTimeout(t)
  }, [ok, step, a])
  const state: BoloState = ok ? "passed" : rec ? "recording" : "coaching"
  return (
    <div className="flex flex-1 flex-col items-center px-5 pt-5 pb-[calc(env(safe-area-inset-bottom)+20px)] text-center">
      <Tag tone="studio">Level check · {step + 1} of 2</Tag>

      {/* Same rhythm as a scene turn: one centred group, controls docked below */}
      <div className="flex flex-1 flex-col items-center justify-center">
        <BoloStage state={state} level={level} size={172} />
        <p className="mt-1 text-14 text-studio-ink-2">
          Hold the phone about 15 cm away and say
        </p>
        <p
          key={step}
          lang={j.lang}
          className="script rise mt-3 max-w-[22ch] text-24 font-semibold text-white"
        >
          “{phrases[step]}”
        </p>
        <p aria-live="polite" className="mt-3 h-5 text-14 text-brand-tint">
          {ok
            ? "That is your level. Bolo will remember it."
            : rec
              ? "Good. Keep going at this volume."
              : "Only a check. Not submitted and not paid."}
        </p>
      </div>

      <div className="flex flex-col items-center gap-2.5">
        <RecordButton
          on={rec}
          disabled={ok}
          label={rec ? "Listening" : "Start the level check"}
          onClick={() => !rec && setRec(true)}
        />
        <span className="text-12 text-studio-ink-2">
          {rec ? "Listening…" : "Tap to test your level"}
        </span>
      </div>
    </div>
  )
}

type Phase = "ai" | "idle" | "recording" | "paused" | "noise" | "silence" | "thinking" | "recorded" | "miclost" | "loadfail" | "loading"

/* Studio phases expressed through Bolo's state contract. */
const PHASE_STATE: Record<Phase, BoloState> = {
  ai: "speaking",
  idle: "listening",
  recording: "recording",
  paused: "idle",
  noise: "retry",
  silence: "coaching",
  thinking: "processing",
  recorded: "passed",
  miclost: "retry",
  loadfail: "retry",
  loading: "processing",
}

/** Who Bolo is playing for this turn, parsed from the prompt ("Owner: …" → Bolo as the owner). */
function cue(j: Job, p: Prompt) {
  if (!p.stem)
    return { who: "Bolo · the scene", line: j.situation, native: false }
  if (j.format === "LINES")
    return { who: "Bolo · how to say it", line: p.stem, native: false }
  const m = p.stem.match(/^([A-Z][A-Za-z ]{1,20}):\s*(.+)$/)
  if (m)
    return {
      who: `Bolo as the ${m[1].toLowerCase()}`,
      line: m[2],
      native: true,
    }
  if (j.format === "INTERVIEW")
    return { who: "Bolo · asking", line: p.stem, native: true }
  return { who: "Bolo · the scene", line: p.stem, native: false }
}

function Capture() {
  const { s, a } = useStore()
  const sess = s.session!
  const j = sel.job(s, sess.jobId)
  const clip = sess.clips[sess.index]
  const lines = j.format === "LINES"
  const c = cue(j, clip.prompt)
  const [phase, setPhase] = useState<Phase>(
    clip.state === "recorded_local" ? "recorded" : "ai",
  )
  const [t, setT] = useTimer(phase === "recording")
  const [noiseShown, setNoiseShown] = useState(false)
  const level = useLevel(phase === "recording")
  const quiet = useQuiet(level, phase === "recording")
  // Calm backchannel while you talk: a nod and a soft "haan", never continuous motion.
  const react = useListening(level, phase === "recording" && !quiet, j.lang)

  // Prototype hooks from the Simulate panel
  useEffect(() => {
    const on = (e: Event) => {
      const k = (e as CustomEvent).detail
      if (k === "mic-lost") setPhase("miclost")
      if (k === "prompt-fail") setPhase("loadfail")
    }
    window.addEventListener("feul:sim", on)
    return () => window.removeEventListener("feul:sim", on)
  }, [])
  useEffect(() => {
    if (phase !== "loading") return
    const id = setTimeout(() => setPhase("ai"), 1100)
    return () => clearTimeout(id)
  }, [phase])
  useEffect(() => {
    if (phase !== "thinking") return
    const id = setTimeout(() => (setPhase("recorded"), buzz([8, 40, 8])), 900)
    return () => clearTimeout(id)
  }, [phase])

  // Deterministic noise event on the second turn, first attempt: shows the noise-pause state.
  useEffect(() => {
    if (
      phase === "recording" &&
      sess.index === 1 &&
      !noiseShown &&
      !sess.repairOf &&
      t >= 3
    ) {
      setNoiseShown(true)
      setPhase("noise")
      buzz(30)
    }
  }, [t, phase, sess.index, noiseShown, sess.repairOf])

  const stop = () => {
    if (t < 2) return setPhase("silence")
    a.setClip(sess.index, { state: "recorded_local", secs: t })
    setPhase("thinking")
  }
  const next = () => {
    const nxt = sess.clips.findIndex(
      (x, i) => i > sess.index && x.state === "ready",
    )
    const any = sess.clips.findIndex(
      (x, i) => i !== sess.index && x.state === "ready",
    )
    if (nxt >= 0) a.goClip(nxt)
    else if (any >= 0) a.goClip(any)
    else a.toReview()
  }
  const allDone = sess.clips.every(
    (x, i) =>
      x.state !== "ready" ||
      (i === sess.index && (phase === "recorded" || phase === "thinking")),
  )
  const state: BoloState =
    phase === "recorded" && allDone
      ? "complete"
      : lines && phase === "ai"
        ? "coaching"
        : PHASE_STATE[phase]
  // When something goes wrong, Bolo says so in its own voice instead of a system banner.
  const asides: Partial<Record<Phase, string>> = {
    noise: `I lost you for a second, a loud sound came through. Your ${t}s so far is saved. Move somewhere quieter and carry on?`,
    silence: lines
      ? "I only caught a second or so. Read the whole line at your normal pace."
      : "I only caught a couple of seconds. Say a little more, the way you would to them.",
    miclost: `Your microphone stopped, maybe another app took it. Your ${t}s so far is saved on this phone.`,
    loadfail:
      "I couldn't load my next line. Check your connection and I'll try again.",
    loading: "One moment, getting my line back.",
  }
  const aside = asides[phase]
  const warn = phase === "noise" || phase === "miclost" || phase === "loadfail"
  const status =
    phase === "noise"
      ? "Paused · too noisy"
      : phase === "miclost"
        ? "Microphone disconnected"
        : phase === "loadfail"
          ? "Offline"
          : phase === "loading"
            ? "Reconnecting…"
            : phase === "silence"
              ? "Too short to keep"
              : phase === "ai"
                ? lines
                  ? "Bolo is directing"
                  : "Bolo is speaking"
                : phase === "recording"
                  ? quiet
                    ? "Can't hear you · come a little closer"
                    : "Recording"
                  : phase === "paused"
                    ? "Paused · your take so far is kept"
                    : phase === "thinking"
                      ? "Checking the take on this phone…"
                      : phase === "recorded"
                        ? allDone
                          ? "Every turn recorded"
                          : "Clear take · saved on this phone"
                        : "Your turn · Bolo is listening"

  return (
    <div className="flex flex-1 flex-col px-5 pt-2 pb-[calc(env(safe-area-inset-bottom)+20px)]">
      {/* The exchange, read top to bottom as one turn: Bolo, what Bolo said, what you say back.
          It is centred as a single group, so tall phones get even breathing room, not a dead band
          between the line and your reply. */}
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        {clip.prompt.chapter && (
          <span className="mb-1 inline-flex items-center rounded-full bg-white/8 px-3 py-1 text-12 font-medium text-studio-ink-2">
            {clip.prompt.chapter}
          </span>
        )}
        <BoloStage
          state={state}
          level={level}
          size={172}
          react={react}
          outfit={outfitFor(j.env, j.format, j.costume)}
        />
        <div
          aria-live="polite"
          className={`-mt-1 flex h-6 items-center justify-center gap-2 text-14 font-medium ${
            warn
              ? "text-wait"
              : phase === "recorded"
                ? "text-money"
                : "text-studio-ink-2"
          }`}
        >
          {phase === "recording" && (
            <span className="pulse-dot h-2 w-2 rounded-full bg-brand-hi" />
          )}
          {status}
          {(phase === "recording" || phase === "paused") && (
            <span className="tnum text-studio-ink">{mmss(t)}</span>
          )}
        </div>

        <div className="mt-3 max-w-[32ch]">
          <p
            lang={aside || !c.native ? "en" : j.lang}
            className={`leading-snug font-medium text-pretty ${
              aside
                ? warn
                  ? "text-18 text-wait"
                  : "text-18 text-brand-tint"
                : c.native
                  ? "script text-24 text-white"
                  : "text-18 text-studio-ink-2"
            }`}
          >
            {aside ? (
              <Typed key={phase} text={aside} step={26} />
            ) : phase === "ai" ? (
              <Typed
                text={c.line}
                step={c.native ? 120 : 70}
                onDone={() => setPhase("idle")}
              />
            ) : (
              c.line
            )}
          </p>
          <div className="mt-2 flex items-center justify-center gap-2.5 text-12 text-studio-ink-3">
            <span>{aside ? "Bolo" : c.who}</span>
            {!aside && phase !== "ai" && (
              <button
                onClick={() => setPhase("ai")}
                disabled={phase === "recording"}
                className="inline-flex items-center gap-1 rounded-full bg-white/8 px-2.5 py-1 text-12 font-medium text-studio-ink-2 hover:text-studio-ink disabled:opacity-35"
              >
                <Icon n="retry" s={12} /> Hear again
              </button>
            )}
          </div>
        </div>
        {/* Your reply sits directly under the line it answers */}
        <div
          className={`grad-studio-card mt-6 w-full rounded-lg px-5 py-4 text-center transition-opacity duration-300 ${
            phase === "ai" || aside ? "opacity-50" : ""
          }`}
        >
          <div className="text-12 font-medium text-brand-tint">
            {lines ? "Read aloud" : "You"} ·{" "}
            <span className="tnum">
              {sess.index + 1} of {sess.clips.length}
            </span>
          </div>
          <p
            lang={lines ? j.lang : "en"}
            className={`mt-1.5 leading-snug text-pretty ${
              lines
                ? "script text-24 font-semibold text-white"
                : "text-18 font-medium text-white"
            }`}
          >
            {clip.prompt.text}
          </p>
        </div>
      </div>

      {/* Controls dock: in the thumb zone, above the home indicator */}
      <div className="flex flex-col pt-5">
        {phase === "noise" || phase === "miclost" ? (
          <div className="flex gap-2">
            <Btn full size="lg" v="white" onClick={() => setPhase("recording")}>
              {phase === "miclost" ? "Reconnect and continue" : "Continue"}
            </Btn>
            <Btn
              size="lg"
              v="glass"
              icon="retry"
              onClick={() => (setT(0), setPhase("idle"))}
            >
              Retake
            </Btn>
          </div>
        ) : phase === "silence" ? (
          <Btn
            full
            size="lg"
            v="voice"
            icon="mic"
            onClick={() => (setT(0), setPhase("idle"))}
          >
            Try again
          </Btn>
        ) : phase === "loadfail" || phase === "loading" ? (
          <Btn
            full
            size="lg"
            v="white"
            icon="retry"
            disabled={phase === "loading"}
            onClick={() => setPhase("loading")}
          >
            {phase === "loading" ? "Trying again…" : "Try again"}
          </Btn>
        ) : (
          <div className="grid grid-cols-[1fr_auto_1fr] items-center">
            <div>
              {phase === "recording" && (
                <button
                  onClick={() => setPhase("paused")}
                  className="flex h-11 items-center gap-2 text-14 font-semibold text-studio-ink-2 hover:text-studio-ink"
                >
                  <Icon n="pause" s={16} /> Pause
                </button>
              )}
              {phase === "paused" && (
                <button
                  onClick={() => setPhase("recording")}
                  className="h-11 text-14 font-semibold text-brand-tint"
                >
                  Continue
                </button>
              )}
              {phase === "recorded" && (
                <button
                  onClick={() => (
                    a.setClip(sess.index, { state: "ready", secs: 0 }),
                    setT(0),
                    setPhase("idle")
                  )}
                  className="flex h-11 items-center gap-2 text-14 font-semibold text-studio-ink-2 hover:text-studio-ink"
                >
                  <Icon n="retry" s={16} /> Retake
                </button>
              )}
            </div>
            <div className="flex justify-center">
              {phase === "recorded" ? (
                <button
                  onClick={next}
                  className="pop-in grid h-[72px] w-[72px] place-items-center rounded-full bg-white text-ink transition-transform duration-200 ease-(--ease-spring) active:scale-95"
                  aria-label={
                    allDone
                      ? "Check your takes"
                      : lines
                        ? "Next line"
                        : "Next turn"
                  }
                >
                  <Icon n={allDone ? "check" : "arrow"} s={28} stroke={2.2} />
                </button>
              ) : (
                <RecordButton
                  on={phase === "recording" || phase === "paused"}
                  disabled={phase === "ai" || phase === "thinking"}
                  onClick={() =>
                    phase === "idle" ? (setPhase("recording"), buzz(8)) : stop()
                  }
                />
              )}
            </div>
            <div />
            <p
              aria-hidden
              className="col-start-2 mt-2 h-4 text-center text-12 font-medium whitespace-nowrap text-studio-ink-2"
            >
              {phase === "recorded"
                ? allDone
                  ? "Check takes"
                  : lines
                    ? "Next line"
                    : "Next turn"
                : phase === "idle"
                  ? lines
                    ? "Tap to read"
                    : "Tap to reply"
                  : phase === "recording"
                    ? "Tap to finish"
                    : ""}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function RoomConsent() {
  const { s, a } = useStore()
  const j = sel.job(s, s.session!.jobId)
  const [ok, setOk] = useState<boolean[]>([true, false, false])
  const [minor, setMinor] = useState<number | null>(null)
  return (
    <div className="flex flex-1 flex-col px-5 pt-6 pb-[calc(env(safe-area-inset-bottom)+28px)]">
      <span className="eyebrow text-studio-ink-3">
        Room · everyone consents first
      </span>
      <h2 className="semi mt-3 text-24 leading-tight font-bold">
        Each person hears the consent in {LANGS[j.lang].name} and confirms they
        are 18+.
      </h2>
      <p className="mt-2 text-14 text-studio-ink-2">
        The microphone stays off until all {j.participants ?? ok.length} people
        have consented.
      </p>
      <ul className="mt-6 space-y-2">
        {ok.map((v, i) => (
          <li
            key={i}
            className="rounded-lg bg-studio-2 p-4 shadow-[inset_0_0_0_1px_var(--color-studio-line)]"
          >
            <div className="flex items-center gap-3">
              <span
                className={`tnum grid h-9 w-9 place-items-center rounded-full text-14 font-semibold ${
                  v ? "bg-money text-ink" : "bg-white/8 text-studio-ink"
                }`}
              >
                {v ? <Icon n="check" s={16} stroke={2.4} /> : i + 1}
              </span>
              <div className="flex-1">
                <div className="font-semibold">
                  {i === 0 ? "You" : `Participant ${i + 1}`}
                </div>
                <div className="text-12 text-studio-ink-2">
                  {v
                    ? "Consented · 18+"
                    : minor === i
                      ? "Under 18 · cannot take part"
                      : "Not yet"}
                </div>
              </div>
              {!v && minor !== i && (
                <div className="flex gap-1.5">
                  <Btn
                    size="sm"
                    v="white"
                    onClick={() =>
                      setOk(ok.map((x, k) => (k === i ? true : x)))
                    }
                  >
                    Consents
                  </Btn>
                  <Btn size="sm" v="glass" onClick={() => setMinor(i)}>
                    Under 18
                  </Btn>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
      {minor != null && (
        <>
          <p className="mt-3 rounded-lg bg-wait/12 p-4 text-14 text-wait">
            Feul is for adults only right now. Invite another adult to join, or
            save this session and come back within 24h.
          </p>
          <button
            onClick={() => (
              setMinor(null), setOk(ok.map((x, k) => (k === minor ? false : x)))
            )}
            className="mt-2 self-start text-14 font-semibold text-brand-tint"
          >
            Another adult will join instead
          </button>
        </>
      )}
      <div className="mt-auto pt-8">
        <Btn
          full
          size="lg"
          v="voice"
          disabled={!ok.every(Boolean)}
          onClick={a.roomConsented}
        >
          {ok.every(Boolean)
            ? "Everyone consented · continue"
            : `Waiting for ${ok.filter((x) => !x).length} more`}
        </Btn>
      </div>
    </div>
  )
}

function RoomCapture() {
  const { s, a } = useStore()
  const sess = s.session!
  const [rec, setRec] = useState(false)
  const [spk, setSpk] = useState(0)
  const [t] = useTimer(rec)
  const level = useLevel(rec)
  const end = () => {
    sess.clips.forEach((_, i) =>
      a.setClip(i, {
        state: "recorded_local",
        secs: Math.max(20, Math.round(t / sess.clips.length)),
      }),
    )
    setRec(false)
    a.toReview()
  }
  return (
    <div className="flex flex-1 flex-col px-5 pt-6 pb-[calc(env(safe-area-inset-bottom)+28px)]">
      <span className="eyebrow text-studio-ink-3">One continuous take</span>
      <h2 className="semi mt-3 text-24 leading-snug font-bold">
        Talk about your weekend plans. Move on when the conversation does,
        there's no fixed timer.
      </h2>
      <ul className="mt-6 space-y-2">
        {sess.clips.map((c, i) => (
          <li
            key={c.id}
            className={`flex items-center gap-3 rounded-lg bg-studio-2 p-3.5 transition-[box-shadow,opacity] duration-200 ${
              i === spk && rec
                ? "shadow-[inset_0_0_0_2px_var(--color-brand-hi)]"
                : "shadow-[inset_0_0_0_1px_var(--color-studio-line)]"
            } ${i < spk ? "opacity-55" : ""}`}
          >
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                i === spk && rec
                  ? "pulse-dot bg-brand-hi"
                  : i < spk
                    ? "bg-studio-ink-3"
                    : "ring-1 ring-studio-ink-3"
              }`}
            />
            <div className="flex-1">
              <div className="text-16 font-semibold">{c.prompt.speaker}</div>
              <div className="text-12 text-studio-ink-2">{c.prompt.text}</div>
            </div>
            <span className="text-12 text-studio-ink-2">
              {i === spk && rec ? "Speaking" : i < spk ? "Spoke" : "Up next"}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-auto pt-6">
        <div className="flex justify-center">
          <BoloStage
            state={rec ? "recording" : "listening"}
            level={level}
            size={156}
          />
        </div>
        <div className="mt-2 flex items-center gap-4">
          <div className="flex-1">
            <LevelBars level={level} />
          </div>
          <span className="tnum text-14 font-medium">{mmss(t)}</span>
        </div>
        <div className="mt-6 flex items-center justify-between">
          <button
            disabled={!rec}
            onClick={() => setSpk((x) => (x + 1) % sess.clips.length)}
            className="text-14 font-semibold text-brand-tint disabled:text-studio-ink-3"
          >
            Next speaker →
          </button>
          <RecordButton
            on={rec}
            onClick={() => (rec ? end() : setRec(true))}
            label={rec ? "End the room take" : "Start the room take"}
          />
          <span className="w-24 text-right text-12 text-studio-ink-2">
            {rec ? "Tap to end take" : "Start take"}
          </span>
        </div>
      </div>
    </div>
  )
}

function LevelBars({ level }: { level: MotionValue<number> }) {
  const [v, setV] = useState(0)
  useMotionValueEvent(level, "change", (x) => setV(Math.round(x * 20) / 20))
  return (
    <div
      className="flex h-2 gap-[3px]"
      role="meter"
      aria-label="Microphone level"
      aria-valuemin={0}
      aria-valuemax={1}
      aria-valuenow={v}
    >
      {Array.from({ length: 20 }, (_, i) => (
        <span
          key={i}
          className={`flex-1 rounded-sm ${
            i / 20 < v ? (i > 16 ? "bg-wait" : "bg-brand-hi") : "bg-white/10"
          }`}
        />
      ))}
    </div>
  )
}
