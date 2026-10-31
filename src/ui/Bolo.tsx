import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react"
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from "motion/react"

/* Bolo — FEUL's studio director.
   Built from the brand's own parts: the crown is the three-bar logo mark, the mouth becomes a
   waveform when Bolo speaks, the crown follows YOUR voice when Bolo listens. Every mood is a
   blend of the same layers (lids, pupils, brows, mouth, arms), so transitions morph instead of swap. */

export type Mood = "idle" | "hello" | "speak" | "listen" | "think" | "happy" | "cheer" | "concern" | "coach" | "sleep" | "wow"
export type BoloTone = "cobalt" | "white" | "ink"
type Mouth = "smile" | "open" | "grin" | "eq" | "o" | "flat" | "wavy" | "small" | "wow"

const TONE: Record<BoloTone, {
  body: string
  shade: string
  rim: string
  sclera: string
  pupil: string
  line: string
  mouth: string
  cheek: string
  fx: string
}> = {
  cobalt: {
    body: "#2B3BFF",
    shade: "#1A23C4",
    rim: "rgba(255,255,255,.36)",
    sclera: "#FFFFFF",
    pupil: "#0E0F14",
    line: "#FFFFFF",
    mouth: "#0A0E52",
    cheek: "#8E98FF",
    fx: "#9AA3FF",
  },
  white: {
    body: "#FFFFFF",
    shade: "#D6DAF5",
    rim: "rgba(255,255,255,0)",
    sclera: "#FFFFFF",
    pupil: "#0E0F14",
    line: "#0E0F14",
    mouth: "#0E0F14",
    cheek: "#C3C9FF",
    fx: "#FFFFFF",
  },
  ink: {
    body: "#191A22",
    shade: "#000000",
    rim: "rgba(255,255,255,.16)",
    sclera: "#FFFFFF",
    pupil: "#0E0F14",
    line: "#FFFFFF",
    mouth: "#FFFFFF",
    cheek: "#3B3F55",
    fx: "#9AA3FF",
  },
}
const LIME = "#C6F432"
const ORANGE = "#FF5A1F"

type Cfg = {
  lid: number
  tilt?: number
  eyes: "open" | "happy" | "closed"
  pupil?: number
  mouth: Mouth
  brows?: "worry" | "focus"
  arms: [number, number]
  body: "bob" | "bob-slow" | "hop" | "hop-loop" | "shake" | "breathe" | "pop" | "lean"
  crown: "sway" | "eq" | "eq-slow" | "level" | "jitter" | "droop" | "still"
  cheeks?: boolean
  gaze?: {
    x: number
    y: number
  }
  fx?: "orbit" | "zz" | "arcs" | "sparkle"
  wave?: boolean
  pump?: boolean
}
export const MOODS: Record<Mood, Cfg> = {
  idle: {
    lid: 0.06,
    eyes: "open",
    mouth: "smile",
    arms: [4, -4],
    body: "bob",
    crown: "sway",
  },
  hello: {
    lid: 0,
    eyes: "happy",
    mouth: "open",
    arms: [8, -112],
    body: "bob",
    crown: "sway",
    cheeks: true,
    wave: true,
  },
  speak: {
    lid: 0.04,
    eyes: "open",
    mouth: "eq",
    arms: [10, -26],
    body: "bob",
    crown: "eq-slow",
    fx: "arcs",
  },
  listen: {
    lid: 0,
    eyes: "open",
    pupil: 1.1,
    mouth: "o",
    arms: [18, -18],
    body: "lean",
    crown: "level",
    gaze: { x: 0, y: 0.12 },
  },
  think: {
    lid: 0.3,
    eyes: "open",
    mouth: "flat",
    arms: [2, -2],
    body: "bob-slow",
    crown: "eq-slow",
    gaze: { x: -0.7, y: -0.8 },
    fx: "orbit",
  },
  happy: {
    lid: 0,
    eyes: "happy",
    mouth: "open",
    arms: [34, -34],
    body: "hop",
    crown: "still",
    cheeks: true,
    fx: "sparkle",
  },
  cheer: {
    lid: 0,
    eyes: "happy",
    mouth: "grin",
    arms: [96, -96],
    body: "hop-loop",
    crown: "eq",
    cheeks: true,
    fx: "sparkle",
    pump: true,
  },
  concern: {
    lid: 0.34,
    tilt: 13,
    eyes: "open",
    mouth: "wavy",
    brows: "worry",
    arms: [-8, 8],
    body: "shake",
    crown: "jitter",
    gaze: { x: 0, y: 0.25 },
  },
  coach: {
    lid: 0.12,
    eyes: "open",
    mouth: "smile",
    brows: "focus",
    arms: [4, -44],
    body: "bob",
    crown: "sway",
    gaze: { x: 0.5, y: 0.75 },
  },
  sleep: {
    lid: 1,
    eyes: "closed",
    mouth: "small",
    arms: [-6, 6],
    body: "breathe",
    crown: "droop",
    fx: "zz",
  },
  wow: {
    lid: 0,
    eyes: "open",
    pupil: 0.8,
    mouth: "wow",
    arms: [58, -58],
    body: "pop",
    crown: "still",
  },
}
export const MOOD_NOTE: Record<Mood, string> = {
  idle: "Present, never needy. Breathes and glances.",
  hello: "First meeting and returns. Waves once.",
  speak: "Plays the other person. Mouth becomes a waveform.",
  listen: "Your turn. Crown follows your voice level.",
  think: "Checking a take locally. Never implies approval.",
  happy: "Clear take, saved. One hop, then calm.",
  cheer: "Mission complete or money approved. Rare.",
  concern: "Noise, silence, a dropped mic. Worried for you, never at you.",
  coach: "Points at the prompt. Slower, closer, louder.",
  sleep: "No work in your language. Wakes when labs need you.",
  wow: "Surprises: a rare-voice bonus, a level up.",
}

const BODY =
  "M62 33 C85 33 101 48 101 71 C101 93 84 107 60 107 C35 107 19 93 19 70 C19 46 38 33 62 33 Z"
const SHADE =
  "M23 84 C29 99 43 106 60 106 C77 106 91 99 97 84 C89 96 76 101 60 101 C44 101 31 96 23 84 Z"
const CROWN = [
  { x: 48, top: 24, d: 0 },
  { x: 60, top: 15, d: 0.18 },
  { x: 72, top: 22, d: 0.36 },
]
const t3 = (o: string): CSSProperties => ({
  transformOrigin: o,
  transformBox: "view-box",
})

export default function Bolo({
  mood = "idle",
  size = 96,
  tone = "cobalt",
  level,
  look,
  follow,
  ground = "light",
  label,
  className = "",
  /** 0..1 live voice level. Drives the crown and lean while listening. */
  /** Eyes follow the pointer. */
}: {
  mood?: Mood
  size?: number
  tone?: BoloTone
  level?: MotionValue<number>
  look?: {
    x: number
    y: number
  }
  follow?: boolean
  ground?: "light" | "dark" | "none"
  label?: string
  className?: string
}) {
  const t = TONE[tone]
  const m = MOODS[mood]
  const ref = useRef<SVGSVGElement>(null)
  const uid = useId().replace(/:/g, "")
  const [roam, setRoam] = useState({ x: 0, y: 0 })

  // Idle saccades: small, irregular glances so Bolo feels present without asking for attention.
  useEffect(() => {
    if (look || follow || m.gaze || mood === "sleep") return
    let id = 0
    const tick = () => {
      setRoam(
        Math.random() < 0.5
          ? { x: 0, y: 0 }
          : {
              x: (Math.random() * 2 - 1) * 0.85,
              y: (Math.random() * 2 - 1) * 0.45,
            },
      )
      id = window.setTimeout(tick, 1600 + Math.random() * 2800)
    }
    id = window.setTimeout(tick, 900 + Math.random() * 1200)
    return () => clearTimeout(id)
  }, [look, follow, m.gaze, mood])

  useEffect(() => {
    if (!follow) return
    const on = (e: PointerEvent) => {
      const r = ref.current?.getBoundingClientRect()
      if (!r) return
      const dx = e.clientX - (r.left + r.width / 2)
      const dy = e.clientY - (r.top + r.height / 2)
      const d = Math.hypot(dx, dy) || 1
      const k = Math.min(1, d / 240)
      setRoam({ x: (dx / d) * k, y: (dy / d) * k })
    }
    window.addEventListener("pointermove", on)
    return () => window.removeEventListener("pointermove", on)
  }, [follow])

  const g = look ?? m.gaze ?? roam
  const zero = useMotionValue(0)
  const lv = level ?? zero
  const lean = useTransform(lv, (v) => 1 + v * 0.05)
  const c0 = useTransform(lv, (v) => 0.5 + v * 0.95)
  const c1 = useTransform(lv, (v) => 0.45 + v * 1.15)
  const c2 = useTransform(lv, (v) => 0.55 + v * 0.85)
  const crownLevel = [c0, c1, c2]
  const live = mood === "listen" && !!level

  const crownFill = (i: number) =>
    mood === "happy" || mood === "cheer"
      ? LIME
      : mood === "concern" && i === 1
        ? ORANGE
        : t.body
  const crownClass = {
    sway: "b-sway",
    eq: "b-eq",
    "eq-slow": "b-eq-slow",
    level: live ? "" : "b-eq-slow",
    jitter: "b-jitter",
    droop: "",
    still: "",
  }[m.crown]
  const bodyClass = {
    bob: "b-bob",
    "bob-slow": "b-bob-slow",
    hop: "b-hop",
    "hop-loop": "b-hop-loop",
    shake: "b-shake",
    breathe: "b-breathe",
    pop: "b-pop",
    lean: "",
  }[m.body]
  const shadowClass = {
    bob: "b-shadow",
    "bob-slow": "b-shadow-slow",
    hop: "b-hop-shadow",
    "hop-loop": "b-hop-shadow-loop",
    shake: "",
    breathe: "b-shadow-slow",
    pop: "",
    lean: "",
  }[m.body]
  const ease =
    "transform 520ms var(--ease-spring), opacity 220ms ease-out, fill 300ms ease-out"
  const show = (on: boolean): CSSProperties => ({
    opacity: on ? 1 : 0,
    transition: "opacity 200ms ease-out",
  })
  const pupilR = tone === "white" ? 6.6 : 5.4

  const arm = (side: 0 | 1) => {
    const sx = side ? 95 : 25
    const deg = m.arms[side]
    return (
      <g
        style={{
          ...t3(`${sx}px 79px`),
          transform: `rotate(${deg}deg)`,
          transition: ease,
        }}
      >
        <g
          className={side === 1 && m.wave ? "b-wave" : m.pump ? "b-pump" : ""}
          style={{
            ...t3(`${sx}px 79px`),
            animationDirection: side ? "normal" : "reverse",
          }}
        >
          <line
            x1={sx}
            y1={79}
            x2={side ? sx + 10 : sx - 10}
            y2={91}
            stroke={t.body}
            strokeWidth={12.5}
            strokeLinecap="round"
          />
        </g>
      </g>
    )
  }

  const eye = (cx: number, side: 0 | 1) => {
    const tilt = (m.tilt ?? 0) * (side ? 1 : -1)
    return (
      <g transform={`translate(${cx} 66)`}>
        <g style={show(m.eyes === "open")}>
          <clipPath id={`${uid}e${side}`}>
            <ellipse rx="9.6" ry="11.2" />
          </clipPath>
          <ellipse rx="9.6" ry="11.2" fill={t.sclera} />
          <g
            style={{
              transform: `translate(${g.x * 3.3}px, ${g.y * 3.8}px) scale(${m.pupil ?? 1})`,
              transition: "transform 380ms var(--ease-out)",
            }}
          >
            <circle r={pupilR} fill={t.pupil} />
            <circle
              cx={pupilR * 0.36}
              cy={-pupilR * 0.4}
              r={pupilR * 0.33}
              fill="#fff"
            />
          </g>
          <g clipPath={`url(#${uid}e${side})`}>
            <g style={{ transform: `rotate(${tilt}deg)`, transition: ease }}>
              <rect
                x="-14"
                y="-12"
                width="28"
                height="25"
                fill={t.body}
                className="b-lid"
                style={
                  {
                    ["--lid" as string]: m.lid,
                    transformOrigin: "0px -12px",
                    animationDelay: `${(side ? 0.04 : 0) + 1.2}s`,
                  } as CSSProperties
                }
              />
            </g>
          </g>
        </g>
        <path
          d="M-7.5 2.5 Q0 -6.5 7.5 2.5"
          fill="none"
          stroke={t.line}
          strokeWidth="3.6"
          strokeLinecap="round"
          style={show(m.eyes === "happy")}
        />
        <path
          d="M-7 -1 Q0 5.5 7 -1"
          fill="none"
          stroke={t.line}
          strokeWidth="3.4"
          strokeLinecap="round"
          style={show(m.eyes === "closed")}
        />
      </g>
    )
  }

  const mouth = (k: Mouth, el: ReactNode) => (
    <g key={k} style={show(m.mouth === k)}>
      {el}
    </g>
  )

  return (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 120 120"
      className={`shrink-0 overflow-visible ${className}`}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {ground !== "none" && (
        <ellipse
          cx="60"
          cy="114"
          rx="25"
          ry="4"
          fill={ground === "dark" ? "rgba(0,0,0,.55)" : "rgba(14,15,20,.13)"}
          className={shadowClass}
          style={t3("60px 114px")}
        />
      )}
      <g className={bodyClass} style={t3("60px 108px")}>
        <motion.g style={{ scale: live ? lean : 1, originX: 0.5, originY: 1 }}>
          {/* crown — the logo mark, and your voice meter */}
          {CROWN.map((c, i) => (
            <motion.g
              key={i}
              style={{ scaleY: live ? crownLevel[i] : 1, originY: 1 }}
            >
              <g
                style={{
                  ...t3(`${c.x}px 46px`),
                  transform: m.crown === "droop" ? "scaleY(.5)" : undefined,
                  transition: ease,
                }}
              >
                <g
                  className={crownClass}
                  style={{
                    ...t3(`${c.x}px 46px`),
                    animationDelay: `${-c.d * 2}s`,
                  }}
                >
                  <rect
                    x={c.x - 3.6}
                    y={c.top}
                    width="7.2"
                    height={46 - c.top}
                    rx="3.6"
                    fill={crownFill(i)}
                    style={{ transition: "fill 300ms ease-out" }}
                  />
                </g>
              </g>
            </motion.g>
          ))}
          {arm(0)}
          {arm(1)}
          <path d={BODY} fill={t.body} />
          <path
            d={SHADE}
            fill={t.shade}
            opacity={tone === "white" ? 0.7 : 0.5}
          />
          <path
            d="M33 54 C38 44 49 38.5 60 38"
            fill="none"
            stroke={t.rim}
            strokeWidth="3.6"
            strokeLinecap="round"
          />
          {/* face — shifts with gaze so the head seems to turn */}
          <g
            style={{
              transform: `translate(${g.x * 2.4}px, ${g.y * 1.6}px)`,
              transition: "transform 420ms var(--ease-out)",
            }}
          >
            <ellipse
              cx="36.5"
              cy="81"
              rx="5.6"
              ry="3.2"
              fill={t.cheek}
              style={show(!!m.cheeks)}
            />
            <ellipse
              cx="83.5"
              cy="81"
              rx="5.6"
              ry="3.2"
              fill={t.cheek}
              style={show(!!m.cheeks)}
            />
            {eye(45, 0)}
            {eye(75, 1)}
            <g style={show(!!m.brows)}>
              {/* Focus lifts the brows a touch: attentive and encouraging. Inner ends pointing down would read as a frown. */}
              <line
                x1="38.5"
                y1="50.5"
                x2="51"
                y2="50.5"
                stroke={t.mouth}
                strokeWidth="3"
                strokeLinecap="round"
                style={{
                  ...t3("44.75px 50.5px"),
                  transform: `translateY(${
                    m.brows === "focus" ? -1.5 : 0
                  }px) rotate(${
                    m.brows === "worry" ? -15 : m.brows === "focus" ? -5 : 0
                  }deg)`,
                  transition: ease,
                }}
              />
              <line
                x1="69"
                y1="50.5"
                x2="81.5"
                y2="50.5"
                stroke={t.mouth}
                strokeWidth="3"
                strokeLinecap="round"
                style={{
                  ...t3("75.25px 50.5px"),
                  transform: `translateY(${
                    m.brows === "focus" ? -1.5 : 0
                  }px) rotate(${
                    m.brows === "worry" ? 15 : m.brows === "focus" ? 5 : 0
                  }deg)`,
                  transition: ease,
                }}
              />
            </g>
            <g transform="translate(60 87)">
              {mouth(
                "smile",
                <path
                  d="M-6.5 -1.5 Q0 4.5 6.5 -1.5"
                  fill="none"
                  stroke={t.mouth}
                  strokeWidth="3"
                  strokeLinecap="round"
                />,
              )}
              {mouth(
                "open",
                <path
                  d="M-8 -2.5 Q0 11 8 -2.5 Q0 0.5 -8 -2.5 Z"
                  fill={t.mouth}
                />,
              )}
              {mouth(
                "grin",
                <path
                  d="M-10.5 -3.5 Q0 14 10.5 -3.5 Q0 0 -10.5 -3.5 Z"
                  fill={t.mouth}
                />,
              )}
              {mouth("o", <ellipse rx="3.3" ry="3.8" fill={t.mouth} />)}
              {mouth("wow", <ellipse rx="4.6" ry="5.8" fill={t.mouth} />)}
              {mouth(
                "flat",
                <path
                  d="M-4.5 0.8 L4.5 -0.8"
                  fill="none"
                  stroke={t.mouth}
                  strokeWidth="3"
                  strokeLinecap="round"
                />,
              )}
              {mouth(
                "wavy",
                <path
                  d="M-7.5 1 Q-3.75 -3 0 1 T7.5 1"
                  fill="none"
                  stroke={t.mouth}
                  strokeWidth="2.8"
                  strokeLinecap="round"
                />,
              )}
              {mouth("small", <circle r="2" fill={t.mouth} />)}
              {mouth(
                "eq",
                <g>
                  {[-8, -4, 0, 4, 8].map((x, i) => (
                    <g
                      key={x}
                      className="b-meq"
                      style={{
                        ...t3(`${x}px 0px`),
                        animationDelay: `${-i * 0.09}s`,
                      }}
                    >
                      <rect
                        x={x - 1.2}
                        y="-5"
                        width="2.4"
                        height="10"
                        rx="1.2"
                        fill={t.mouth}
                      />
                    </g>
                  ))}
                </g>,
              )}
            </g>
          </g>
        </motion.g>
      </g>
      {/* effects */}
      {m.fx === "arcs" &&
        [0, 0.45].map((d) => (
          <path
            key={d}
            className="b-arc"
            d="M107 57 Q113 66 107 75"
            fill="none"
            stroke={t.fx}
            strokeWidth="2.6"
            strokeLinecap="round"
            style={{ ...t3("100px 66px"), animationDelay: `${d}s` }}
          />
        ))}
      {m.fx === "orbit" && (
        <g className="b-orbit" style={t3("60px 70px")}>
          <circle cx="60" cy="18" r="3.2" fill={t.fx} />
          <circle cx="111" cy="76" r="2.4" fill={LIME} />
          <circle cx="16" cy="94" r="2" fill={t.fx} opacity=".7" />
        </g>
      )}
      {m.fx === "zz" &&
        [0, 1.3].map((d, i) => (
          <path
            key={d}
            className="b-zz"
            d={i ? "M98 18 h6 l-6 6 h6" : "M88 30 h5 l-5 5 h5"}
            fill="none"
            stroke={t.fx === "#FFFFFF" ? "#FFFFFF" : "#9AA3FF"}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              ...t3(i ? "101px 21px" : "90px 32px"),
              animationDelay: `${d}s`,
              opacity: 0,
            }}
          />
        ))}
      {m.fx === "sparkle" &&
        [
          [13, 38, LIME, 0, 1],
          [108, 30, t.fx, 0.5, 0.8],
          [106, 98, LIME, 1, 0.6],
        ].map(([x, y, c, d, s]) => (
          <g key={String(x)} transform={`translate(${x} ${y}) scale(${s})`}>
            <path
              className="b-sparkle"
              d="M0 -6 L1.4 -1.4 L6 0 L1.4 1.4 L0 6 L-1.4 1.4 L-6 0 L-1.4 -1.4 Z"
              fill={String(c)}
              style={{
                transformOrigin: "0 0",
                animationDelay: `${d}s`,
                opacity: 0,
              }}
            />
          </g>
        ))}
    </svg>
  )
}

/* ---------- Speech ---------- */

/** Words land one at a time — Bolo "says" the line rather than pasting it. */
export function Typed({
  text,
  step = 55,
  onDone,
  className = "",
}: {
  text: string
  step?: number
  onDone?: () => void
  className?: string
}) {
  const words = text.split(" ")
  const done = useRef(onDone)
  done.current = onDone
  useEffect(() => {
    const t = window.setTimeout(
      () => done.current?.(),
      words.length * step + 420,
    )
    return () => clearTimeout(t)
  }, [text, step, words.length])
  return (
    <span key={text} className={className}>
      {words.map((w, i) => (
        <span key={i}>
          <span className="word" style={{ animationDelay: `${i * step}ms` }}>
            {w}
          </span>
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </span>
  )
}

export function Bubble({
  children,
  tail = "left",
  tone = "light",
  className = "",
}: {
  children: ReactNode
  tail?: "left" | "top" | "bottom" | "center" | "none"
  tone?: "light" | "dark" | "cobalt"
  className?: string
}) {
  const c = {
    light: "bg-surface text-ink shadow-card",
    dark: "bg-studio-3 text-studio-ink",
    cobalt: "bg-cobalt text-white",
  }[tone]
  const tc = { light: "bg-surface", dark: "bg-studio-3", cobalt: "bg-cobalt" }[
    tone
  ]
  const pos = {
    left: "top-5 -left-1.5",
    top: "-top-1.5 left-8",
    bottom: "-bottom-1.5 left-8",
    center: "-bottom-1.5 left-1/2 -translate-x-1/2",
    none: "hidden",
  }[tail]
  return (
    <div className={`relative rounded-lg px-4 py-3 ${c} ${className}`}>
      <span
        aria-hidden
        className={`absolute h-3.5 w-3.5 rotate-45 rounded-[3px] ${tc} ${pos}`}
      />
      <div className="relative">{children}</div>
    </div>
  )
}

/** Bolo at indicator scale inside a tinted disc — for toasts, notices and help. */
export function BoloBadge({
  mood = "idle",
  size = 40,
  tone = "soft",
}: {
  mood?: Mood
  size?: number
  tone?: "soft" | "dark" | "white"
}) {
  const bg = { soft: "bg-cobalt-soft", dark: "bg-studio-3", white: "bg-white" }[
    tone
  ]
  return (
    <span
      className={`relative grid shrink-0 place-items-center overflow-hidden rounded-full ${bg}`}
      style={{ width: size, height: size }}
    >
      <span className="translate-y-[12%]">
        <Bolo mood={mood} size={size * 1.05} ground="none" />
      </span>
    </span>
  )
}

/* ---------- Voice level ---------- */

/** A smoothed 0..1 voice level. Simulated speech by default; the real microphone only when opted in.
    Nothing is recorded or stored — the level is computed locally and discarded every frame. */
export function useVoiceLevel(
  active: boolean,
  real = false,
  onFallback?: () => void,
) {
  const mv = useMotionValue(0)
  const fallback = useRef(onFallback)
  fallback.current = onFallback
  useEffect(() => {
    if (!active) {
      const a = animate(mv, 0, { duration: 0.35 })
      return () => a.stop()
    }
    let raf = 0
    let cancelled = false
    let release = () => {}
    const ease = (target: number) => {
      const cur = mv.get()
      mv.set(cur + (target - cur) * (target > cur ? 0.45 : 0.12))
    }
    const simulate = () => {
      const t0 = performance.now()
      let speaking = true
      let next = 0.5
      const loop = (now: number) => {
        const t = (now - t0) / 1000
        if (t > next) {
          speaking = !speaking || Math.random() < 0.25
          next =
            t +
            (speaking ? 0.35 + Math.random() * 0.8 : 0.1 + Math.random() * 0.28)
        }
        const syll = Math.max(
          0,
          Math.sin(t * Math.PI * 2 * 4.3 + Math.sin(t * 1.7) * 2),
        )
        ease(
          speaking
            ? 0.22 +
                0.68 * Math.pow(syll, 0.7) * (0.78 + 0.22 * Math.sin(t * 0.8))
            : 0.04 + Math.random() * 0.03,
        )
        raf = requestAnimationFrame(loop)
      }
      raf = requestAnimationFrame(loop)
    }
    if (real && navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true },
        })
        .then((stream) => {
          if (cancelled) return stream.getTracks().forEach((x) => x.stop())
          const ctx = new AudioContext()
          const an = ctx.createAnalyser()
          an.fftSize = 512
          ctx.createMediaStreamSource(stream).connect(an)
          const buf = new Uint8Array(an.fftSize)
          release = () => (
            stream.getTracks().forEach((x) => x.stop()), void ctx.close()
          )
          const loop = () => {
            an.getByteTimeDomainData(buf)
            let sum = 0
            for (let i = 0; i < buf.length; i++) {
              const v = (buf[i] - 128) / 128
              sum += v * v
            }
            ease(Math.min(1, Math.sqrt(sum / buf.length) * 5))
            raf = requestAnimationFrame(loop)
          }
          loop()
        })
        .catch(() => {
          if (cancelled) return
          fallback.current?.()
          simulate()
        })
    } else simulate()
    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      release()
    }
  }, [active, real, mv])
  return mv
}

/* ---------- Voice ring: the live waveform wrapped around Bolo ---------- */

/** rest breathes · wait opens up for your turn · you follows your level · bolo pulses with Bolo's voice
    think travels and regroups · alert distorts (orange) · done blooms once, then settles (lime) */
export type RingMode = "rest" | "wait" | "you" | "bolo" | "think" | "alert" | "done"

export function VoiceRing({
  level,
  mode,
  size = 280,
  inner = 78,
  bars = 72,
}: {
  level?: MotionValue<number>
  mode: RingMode
  size?: number
  inner?: number
  bars?: number
}) {
  const path = useRef<SVGPathElement>(null)
  const glow = useRef<SVGCircleElement>(null)
  const modeRef = useRef(mode)
  modeRef.current = mode
  const reduce = useReducedMotion()
  const uid = useId().replace(/:/g, "")
  useEffect(() => {
    const c = size / 2
    const amps = new Float32Array(bars)
    let raf = 0
    let last = modeRef.current
    let since = performance.now()
    let open = 0
    const t0 = performance.now()
    const frame = (now: number) => {
      const t = (now - t0) / 1000
      const md = modeRef.current
      if (md !== last) {
        last = md
        since = now
      }
      const ts = (now - since) / 1000
      const lv =
        md === "you"
          ? (level?.get() ?? 0)
          : md === "bolo"
            ? 0.35 +
              0.3 * Math.max(0, Math.sin(t * 26)) * Math.abs(Math.sin(t * 3.1))
            : md === "wait"
              ? 0.2 + 0.06 * Math.sin(t * 2.4)
              : md === "think"
                ? 0.55
                : md === "alert"
                  ? 0.7
                  : md === "done"
                    ? 0.16 + 0.6 * Math.exp(-ts * 3)
                    : 0.06 + 0.025 * Math.sin(t * 1.6)
      // Listening expansion: the ring itself opens outward when it's your turn.
      open += ((md === "wait" ? 9 : md === "you" ? 5 : 0) - open) * 0.08
      const r0 = inner + (reduce ? 0 : open)
      const scale = md === "rest" ? 10 : md === "wait" ? 24 : 34
      let d = ""
      for (let i = 0; i < bars; i++) {
        const a = (i / bars) * Math.PI * 2 - Math.PI / 2
        const n =
          md === "alert"
            ? Math.random()
            : md === "think"
              ? 0.12 +
                Math.pow(Math.max(0, Math.cos(a + Math.PI / 2 - t * 3.4)), 10)
              : md === "wait" || md === "done"
                ? 0.82 + 0.18 * Math.sin(i * 0.9 + t * 2)
                : 0.5 +
                  0.5 *
                    Math.sin(i * 1.7 + t * 5.3) *
                    Math.sin(i * 0.37 - t * 3.1)
        const target = reduce
          ? md === "rest"
            ? 3
            : 6
          : 2.5 + lv * (0.3 + 0.7 * n) * scale
        amps[i] = reduce
          ? target
          : amps[i] + (target - amps[i]) * (md === "alert" ? 0.6 : 0.22)
        const ca = Math.cos(a)
        const sa = Math.sin(a)
        d += `M${(c + ca * r0).toFixed(1)} ${(c + sa * r0).toFixed(1)}L${(c + ca * (r0 + amps[i])).toFixed(1)} ${(c + sa * (r0 + amps[i])).toFixed(1)}`
      }
      path.current?.setAttribute("d", d)
      glow.current?.setAttribute(
        "opacity",
        String(md === "rest" ? 0.1 : 0.16 + lv * 0.45),
      )
      if (!reduce) raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
    // Under reduced motion the ring is drawn once per mode, as a static, colour-coded ring.
  }, [size, inner, bars, level, reduce, reduce ? mode : null])
  const glowColor =
    mode === "alert"
      ? "#FF5A1F"
      : mode === "done"
        ? "#C6F432"
        : mode === "bolo" || mode === "think"
          ? "#9AA3FF"
          : "#2B3BFF"
  const stroke = {
    rest: "#3A3D4C",
    wait: "#5866FF",
    you: `url(#${uid}you)`,
    bolo: "#9AA3FF",
    think: "#9AA3FF",
    alert: "#FF5A1F",
    done: "#C6F432",
  }[mode]
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden
      className="pointer-events-none"
    >
      <defs>
        <linearGradient id={`${uid}you`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7F8BFF" />
          <stop offset="1" stopColor="#3445FF" />
        </linearGradient>
        <radialGradient id={`${uid}glow`}>
          <stop offset="0.45" stopColor={glowColor} stopOpacity="0.9" />
          <stop offset="1" stopColor={glowColor} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle
        ref={glow}
        cx={size / 2}
        cy={size / 2}
        r={size / 2}
        fill={`url(#${uid}glow)`}
        opacity="0.1"
        style={{ transition: "opacity 120ms linear" }}
      />
      <path
        ref={path}
        stroke={stroke}
        strokeWidth="3.2"
        strokeLinecap="round"
        fill="none"
        style={{ transition: "stroke 300ms ease-out" }}
      />
    </svg>
  )
}

/* ---------- State contract ----------
   Screens speak in product states. Only this table knows how Bolo and the ring express them,
   so supplied artwork (SVG, Rive, Lottie) can replace <Bolo> without touching a single screen. */
export type BoloState = "idle" | "speaking" | "listening" | "recording" | "processing" | "passed" | "retry" | "coaching" | "complete"
export const BOLO_STATES: Record<BoloState, {
  mood: Mood
  ring: RingMode
  label: string
  note: string
}> = {
  idle: {
    mood: "idle",
    ring: "rest",
    label: "Idle",
    note: "Breathes slowly and glances around. Present, never needy.",
  },
  speaking: {
    mood: "speak",
    ring: "bolo",
    label: "Speaking",
    note: "Plays the other person. Mouth and ring pulse with its voice.",
  },
  listening: {
    mood: "listen",
    ring: "wait",
    label: "Listening",
    note: "Your turn. Bolo leans in and the ring opens up to wait.",
  },
  recording: {
    mood: "listen",
    ring: "you",
    label: "Recording",
    note: "Crown and ring follow your voice, frame by frame.",
  },
  processing: {
    mood: "think",
    ring: "think",
    label: "Processing",
    note: "Checks the take on this phone. Never implies approval.",
  },
  passed: {
    mood: "happy",
    ring: "done",
    label: "Passed",
    note: "Clear take, saved. Lime, one hop, then calm.",
  },
  retry: {
    mood: "concern",
    ring: "alert",
    label: "Retry suggested",
    note: "Noise or a dropped mic. Orange: worried for you, never at you.",
  },
  coaching: {
    mood: "coach",
    ring: "rest",
    label: "Coaching",
    note: "Points at the line. Slower, closer, a little louder.",
  },
  complete: {
    mood: "cheer",
    ring: "done",
    label: "Session complete",
    note: "Every turn recorded. A rare, earned celebration.",
  },
}

/** Studio scale: Bolo inside its voice ring. The single place where state becomes motion. */
export function BoloStage({
  state,
  level,
  size = 248,
  tone = "cobalt",
  className = "",
}: {
  state: BoloState
  level?: MotionValue<number>
  size?: number
  tone?: BoloTone
  className?: string
}) {
  const st = BOLO_STATES[state]
  return (
    <div
      role="img"
      aria-label={`Bolo: ${st.label}`}
      className={`relative grid shrink-0 place-items-center ${className}`}
      style={{ width: size, height: size }}
    >
      <div className="absolute inset-0">
        <VoiceRing
          level={level}
          mode={st.ring}
          size={size}
          inner={size * 0.37}
        />
      </div>
      <Bolo
        mood={st.mood}
        size={size * 0.52}
        tone={tone}
        level={state === "recording" ? level : undefined}
        ground="none"
      />
    </div>
  )
}

/* ---------- Confetti: palette bits and ₹ coins, burst from a point ---------- */
export function Confetti({
  n = 28,
  colors = ["#2B3BFF", "#C6F432", "#FF5A1F", "#0E0F14", "#FFFFFF"],
  coins = true,
  delay = 0,
}: {
  n?: number
  colors?: string[]
  coins?: boolean
  delay?: number
}) {
  const bits = useMemo(
    () =>
      Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2 + Math.random() * 0.4
        const d = 110 + Math.random() * 130
        return {
          x: Math.cos(a) * d,
          y: Math.sin(a) * d * 0.9 - 40,
          r: (Math.random() - 0.5) * 600,
          coin: coins && i % 4 === 0,
          c: colors[i % colors.length],
          w: 6 + Math.random() * 7,
          delay: delay + Math.random() * 180,
        }
      }),
    [n, coins, delay, colors],
  )
  return (
    <>
      {bits.map((b, i) => (
        <span
          key={i}
          aria-hidden
          className={`burst pointer-events-none absolute top-1/2 left-1/2 ${
            b.coin
              ? "grid h-5 w-5 place-items-center rounded-full text-11 font-bold text-ink shadow-[inset_0_-2px_0_rgba(0,0,0,.18)]"
              : "rounded-[2px]"
          }`}
          style={
            {
              "--x": `${b.x}px`,
              "--y": `${b.y}px`,
              "--r": `${b.r}deg`,
              animationDelay: `${b.delay}ms`,
              background: b.coin ? "#C6F432" : b.c,
              width: b.coin ? undefined : b.w,
              height: b.coin ? undefined : b.w * 0.5,
            } as CSSProperties
          }
        >
          {b.coin ? "₹" : null}
        </span>
      ))}
    </>
  )
}
