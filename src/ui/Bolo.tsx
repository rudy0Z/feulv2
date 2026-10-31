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
import type { Env, Format } from "../state/model"

/* Bolo — FEUL's studio director. One shape everywhere: a soft round body, the three-bar crown
   (the logo mark), big attentive eyes and two mitten hands. Moods are blends of the same layers,
   so transitions morph instead of swap. Costumes (outfits) dress the same Bolo for each scene.
   Usage rule: Bolo is a character with a job (guiding, playing a role, reacting, celebrating),
   so it appears at most once per screen and never as list iconography or decoration. */

export type Mood = "idle" | "hello" | "speak" | "listen" | "think" | "happy" | "cheer" | "concern" | "coach" | "sleep" | "wow" | "nod" | "laugh" | "curious"
export type BoloTone = "brand" | "white" | "ink"
export type Outfit = "chai" | "bag" | "cap" | "chef" | "stethoscope" | "pills" | "glasses" | "book" | "headset" | "headphones" | "phone" | "coin"
type Mouth = "smile" | "open" | "grin" | "talk" | "o" | "flat" | "wavy" | "small" | "wow"

type ToneSpec = {
  body: string
  shade: string
  rim: string
  sclera: string
  pupil: string
  line: string
  mouth: string
  tongue: string
  cheek: string
  fx: string
}
const TONE: Record<BoloTone, ToneSpec> = {
  brand: {
    body: "#FF7424",
    shade: "#E5560A",
    rim: "rgba(255,255,255,.42)",
    sclera: "#FFFFFF",
    pupil: "#1C1713",
    line: "#3D1704",
    mouth: "#3D1704",
    tongue: "#FF9E8A",
    cheek: "#FFB38A",
    fx: "#FFB07A",
  },
  white: {
    body: "#FFFFFF",
    shade: "#FFE3CF",
    rim: "rgba(255,255,255,0)",
    sclera: "#FFFFFF",
    pupil: "#1C1713",
    line: "#1C1713",
    mouth: "#1C1713",
    tongue: "#FF8A6B",
    cheek: "#FFC7A6",
    fx: "#FFFFFF",
  },
  ink: {
    body: "#2C241E",
    shade: "#120E0B",
    rim: "rgba(255,255,255,.14)",
    sclera: "#FFFFFF",
    pupil: "#1C1713",
    line: "#FFFFFF",
    mouth: "#FFFFFF",
    tongue: "#FF8A6B",
    cheek: "#5A463A",
    fx: "#FFB07A",
  },
}
const GOLD = "#FFC24A"
const AMBER = "#E39A12"
const INK = "#1C1713"

type Cfg = {
  lid: number
  tilt?: number
  eyes: "open" | "happy" | "closed"
  pupil?: number
  mouth: Mouth
  brows?: "worry" | "focus" | "raise"
  arms: [number, number]
  body: "breathe" | "hop" | "hop2" | "nod" | "tilt" | "laugh" | "lean"
  crown: "sway" | "level" | "droop" | "still"
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
    lid: 0.04,
    eyes: "open",
    mouth: "smile",
    arms: [4, -4],
    body: "breathe",
    crown: "sway",
  },
  hello: {
    lid: 0,
    eyes: "happy",
    mouth: "open",
    arms: [6, -100],
    body: "breathe",
    crown: "sway",
    cheeks: true,
    wave: true,
  },
  speak: {
    lid: 0.02,
    eyes: "open",
    mouth: "talk",
    arms: [10, -24],
    body: "breathe",
    crown: "sway",
    fx: "arcs",
  },
  listen: {
    lid: 0,
    eyes: "open",
    pupil: 1.08,
    mouth: "smile",
    brows: "raise",
    arms: [16, -16],
    body: "lean",
    crown: "level",
    gaze: { x: 0, y: 0.1 },
  },
  nod: {
    lid: 0,
    eyes: "open",
    pupil: 1.05,
    mouth: "smile",
    brows: "raise",
    arms: [16, -16],
    body: "nod",
    crown: "level",
    cheeks: true,
    gaze: { x: 0, y: 0.25 },
  },
  laugh: {
    lid: 0,
    eyes: "happy",
    mouth: "grin",
    arms: [26, -26],
    body: "laugh",
    crown: "still",
    cheeks: true,
  },
  curious: {
    lid: 0,
    tilt: 6,
    eyes: "open",
    pupil: 1.12,
    mouth: "o",
    brows: "raise",
    arms: [10, -36],
    body: "tilt",
    crown: "still",
    gaze: { x: 0.5, y: -0.3 },
  },
  think: {
    lid: 0.22,
    eyes: "open",
    mouth: "flat",
    arms: [2, -2],
    body: "breathe",
    crown: "sway",
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
    arms: [104, -104],
    body: "hop2",
    crown: "still",
    cheeks: true,
    fx: "sparkle",
    pump: true,
  },
  concern: {
    lid: 0.16,
    tilt: 10,
    eyes: "open",
    mouth: "wavy",
    brows: "worry",
    arms: [-6, 6],
    body: "breathe",
    crown: "still",
    gaze: { x: 0, y: 0.2 },
  },
  coach: {
    lid: 0.04,
    eyes: "open",
    mouth: "smile",
    brows: "focus",
    arms: [4, -50],
    body: "breathe",
    crown: "sway",
    gaze: { x: 0.5, y: 0.7 },
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
    pupil: 0.85,
    mouth: "wow",
    arms: [58, -58],
    body: "hop",
    crown: "still",
    cheeks: true,
  },
}
export const MOOD_NOTE: Record<Mood, string> = {
  idle: "Present, never needy. Breathes and glances.",
  hello: "First meeting and returns. Smiles and waves.",
  speak: "Plays the other person. Mouth moves with its voice.",
  listen: "Your turn. Leans in, brows up, crown follows your voice.",
  nod: "Mid-sentence: a small nod and a ‘haan’, like a real listener.",
  laugh: "Something funny or warm in your take.",
  curious: "A question or a number in your answer. Head tilts in.",
  think: "Checking a take locally. Never implies approval.",
  happy: "Clear take, saved. One hop, then calm.",
  cheer: "Scene complete or money approved. Rare.",
  concern: "Noise, silence, a dropped mic. Worried for you, never at you.",
  coach: "Points at the line. Slower, closer, louder.",
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

/* ---------- Costumes: the same Bolo, dressed for the scene ---------- */
function Held({ o }: { o: Outfit }) {
  if (o === "chai")
    return (
      <g>
        <path
          className="b-steam"
          d="M10 82 q-2 -3 0 -6"
          stroke="#FFFFFF"
          strokeWidth="1.6"
          fill="none"
          strokeLinecap="round"
          opacity=".8"
          style={t3("10px 80px")}
        />
        <path
          className="b-steam"
          d="M15 82 q-2 -3 0 -6"
          stroke="#FFFFFF"
          strokeWidth="1.6"
          fill="none"
          strokeLinecap="round"
          opacity=".8"
          style={{ ...t3("15px 80px"), animationDelay: "1.1s" }}
        />
        <path
          d="M19 89 h2.5 a3.4 3.4 0 0 1 0 6.8 H19"
          stroke="#E7D9C8"
          strokeWidth="2"
          fill="none"
        />
        <path
          d="M5.5 85 H20.5 L19 98 C18.8 99.6 17.6 100.5 16 100.5 H10 C8.4 100.5 7.2 99.6 7 98 Z"
          fill="#FFFFFF"
        />
        <rect
          x="6.4"
          y="90"
          width="13.2"
          height="3.6"
          fill="#F5640F"
          opacity=".85"
        />
      </g>
    )
  if (o === "bag")
    return (
      <g>
        <path
          d="M99.5 87 C99.5 79 110.5 79 110.5 87"
          stroke="#B98B52"
          strokeWidth="2"
          fill="none"
        />
        <path d="M96 86.5 H114 L112.6 104 H97.4 Z" fill="#E9C48E" />
        <path d="M96 86.5 H114 L113.8 89 H96.2 Z" fill="#D9AC6E" />
        <circle cx="105" cy="96" r="3" fill="#FFFFFF" opacity=".7" />
      </g>
    )
  if (o === "coin")
    return (
      <g>
        <circle
          cx="106"
          cy="90"
          r="8"
          fill={GOLD}
          stroke="#D99A1E"
          strokeWidth="1.6"
        />
        <text
          x="106"
          y="93.6"
          textAnchor="middle"
          fontSize="10"
          fontWeight="700"
          fill="#8A5800"
          fontFamily="system-ui"
        >
          ₹
        </text>
      </g>
    )
  if (o === "pills")
    return (
      <g>
        <rect x="98.5" y="78" width="13" height="4.6" rx="1.4" fill="#CC4A00" />
        <rect
          x="99"
          y="82"
          width="12"
          height="17"
          rx="2.6"
          fill="#FFFFFF"
          stroke="#E7D9C8"
          strokeWidth="1.2"
        />
        <path
          d="M105 86.4 V93.6 M101.4 90 H108.6"
          stroke="#18A06B"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </g>
    )
  if (o === "phone")
    return (
      <g>
        <rect x="99" y="73" width="12" height="20" rx="3" fill={INK} />
        <rect
          x="100.6"
          y="75.4"
          width="8.8"
          height="13.6"
          rx="1.6"
          fill="#FFB07A"
        />
      </g>
    )
  return null
}
function Worn({ o }: { o: Outfit }) {
  // Chef's toque: tall enough to sit over the crown bars, so the silhouette reads as a kitchen.
  if (o === "chef")
    return (
      <g>
        <path
          d="M38 46 L38 34 C30 33 27 25 32 19.5 C35 15.5 41 15 44.5 17.5 C46.5 10 53 6.5 60 6.5 C67 6.5 73.5 10 75.5 17.5 C79 15 85 15.5 88 19.5 C93 25 90 33 82 34 L82 46 Z"
          fill="#FFFFFF"
          stroke="#E7D9C8"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <path d="M38 38.5 H82" stroke="#E7D9C8" strokeWidth="1.4" />
        <path
          d="M50 22 C51 27 51 31 50 34 M60 15 C61 22 61 29 60 34 M70 22 C69 27 69 31 70 34"
          stroke="#EFE5D9"
          strokeWidth="1.4"
          fill="none"
          strokeLinecap="round"
        />
      </g>
    )
  if (o === "cap")
    return (
      <g>
        <path
          d="M35 45 C35 31 46 24.5 60 24.5 C74 24.5 85 31 85 45 Z"
          fill={INK}
        />
        <rect x="35" y="40.5" width="50" height="4.5" fill={GOLD} />
        <path d="M60 45 H95 C99.5 45 99.5 50.5 94 50.5 H60 Z" fill={INK} />
        <circle cx="60" cy="33" r="3.2" fill={GOLD} />
      </g>
    )
  if (o === "stethoscope")
    return (
      <g>
        <path
          d="M31 77 C31 95 42 102.5 56 102.5 C67 102.5 76 99 80 93"
          stroke="#3D3530"
          strokeWidth="2.6"
          fill="none"
          strokeLinecap="round"
        />
        <circle
          cx="81.5"
          cy="90.5"
          r="5"
          fill="#DCD6CF"
          stroke="#3D3530"
          strokeWidth="1.8"
        />
      </g>
    )
  if (o === "headset" || o === "headphones") {
    const big = o === "headphones"
    return (
      <g>
        <path
          d="M21 68 C21 36 39 27 60 27 C81 27 99 36 99 68"
          stroke={INK}
          strokeWidth="4.4"
          fill="none"
          strokeLinecap="round"
        />
        <rect
          x={big ? 11 : 13}
          y={big ? 56 : 58}
          width={big ? 14 : 11}
          height={big ? 24 : 20}
          rx="6"
          fill={INK}
        />
        <rect
          x={big ? 95 : 96}
          y={big ? 56 : 58}
          width={big ? 14 : 11}
          height={big ? 24 : 20}
          rx="6"
          fill={INK}
        />
        {!big && (
          <>
            <path
              d="M18.5 77 C20 90 32 94.5 45 92.5"
              stroke={INK}
              strokeWidth="2.6"
              fill="none"
              strokeLinecap="round"
            />
            <circle cx="46" cy="92.3" r="3.4" fill={INK} />
          </>
        )}
        {big && (
          <>
            <rect
              x="14"
              y="60"
              width="8"
              height="16"
              rx="4"
              fill="#FFB07A"
              opacity=".55"
            />
            <rect
              x="98"
              y="60"
              width="8"
              height="16"
              rx="4"
              fill="#FFB07A"
              opacity=".55"
            />
          </>
        )}
      </g>
    )
  }
  if (o === "book")
    return (
      <g>
        <path
          d="M35 97 L60 100.5 L85 97 L85 111 L60 114.5 L35 111 Z"
          fill="#CC4A00"
        />
        <path d="M37 95 L60 98.5 L60 112 L37 108.5 Z" fill="#FFFFFF" />
        <path d="M83 95 L60 98.5 L60 112 L83 108.5 Z" fill="#FFF6EE" />
        <path
          d="M41 100 L55 102 M41 104 L55 106 M65 102 L79 100 M65 106 L79 104"
          stroke="#E3D9CC"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </g>
    )
  return null
}
const HELD: Outfit[] = ["chai", "bag", "coin", "phone", "pills"]

export default function Bolo({
  mood = "idle",
  size = 96,
  tone = "brand",
  level,
  look,
  follow,
  ground = "light",
  label,
  outfit,
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
  outfit?: Outfit | Outfit[]
  className?: string
}) {
  const t = TONE[tone]
  const m = MOODS[mood]
  const wear = outfit ? (Array.isArray(outfit) ? outfit : [outfit]) : []
  const ref = useRef<SVGSVGElement>(null)
  const uid = useId().replace(/:/g, "")
  const [roam, setRoam] = useState({ x: 0, y: 0 })

  // Idle glances: small, irregular, so Bolo feels present without asking for attention.
  useEffect(() => {
    if (look || follow || m.gaze || mood === "sleep") return
    let id = 0
    const tick = () => {
      setRoam(
        Math.random() < 0.55
          ? { x: 0, y: 0 }
          : {
              x: (Math.random() * 2 - 1) * 0.7,
              y: (Math.random() * 2 - 1) * 0.35,
            },
      )
      id = window.setTimeout(tick, 2200 + Math.random() * 3000)
    }
    id = window.setTimeout(tick, 1400 + Math.random() * 1400)
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
  const lean = useTransform(lv, (v) => 1 + v * 0.04)
  const c0 = useTransform(lv, (v) => 0.55 + v * 0.8)
  const c1 = useTransform(lv, (v) => 0.5 + v * 1)
  const c2 = useTransform(lv, (v) => 0.6 + v * 0.75)
  const crownLevel = [c0, c1, c2]
  const live = (mood === "listen" || mood === "nod") && !!level

  const crownFill = (i: number) =>
    mood === "happy" || mood === "cheer" || mood === "wow"
      ? GOLD
      : mood === "concern" && i === 1
        ? AMBER
        : t.body
  const crownClass =
    m.crown === "sway" || (m.crown === "level" && !live) ? "b-sway" : ""
  const bodyClass = {
    breathe: "b-breathe",
    hop: "b-hop",
    hop2: "b-hop2",
    nod: "b-nod",
    tilt: "b-tilt",
    laugh: "b-laugh",
    lean: "",
  }[m.body]
  const shadowClass =
    m.body === "hop" || m.body === "hop2"
      ? "b-hop-shadow"
      : m.body === "breathe"
        ? "b-shadow"
        : ""
  const ease =
    "transform 520ms var(--ease-spring), opacity 220ms ease-out, fill 300ms ease-out"
  const show = (on: boolean): CSSProperties => ({
    opacity: on ? 1 : 0,
    transition: "opacity 200ms ease-out",
  })
  const pupilR = 6.2

  const arm = (side: 0 | 1) => {
    const sx = side ? 95 : 25
    const deg = m.arms[side]
    const held = wear.filter(
      (o) => HELD.includes(o) && (o === "chai" ? side === 0 : side === 1),
    )
    // A raised arm reaches further so the mitten clears the body outline instead of hiding behind it.
    const reach = Math.abs(deg) > 60 && held.length === 0 ? 1.75 : 1
    const ex = sx + (side ? 10 : -10) * reach
    const ey = 79 + 12 * reach
    const hx = ex - (side ? sx + 10 : sx - 10)
    const hy = ey - 91
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
            x2={ex}
            y2={ey}
            stroke={t.body}
            strokeWidth={12}
            strokeLinecap="round"
          />
          <g transform={`translate(${hx} ${hy})`}>
            <circle cx={ex - hx} cy={91} r={7.2} fill={t.body} />
            {tone === "white" && (
              <circle
                cx={ex - hx}
                cy={91}
                r={7.2}
                fill="none"
                stroke={t.shade}
                strokeWidth="1.4"
              />
            )}
            {held.map((o) => (
              <Held key={o} o={o} />
            ))}
          </g>
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
            <ellipse rx="9.8" ry="11.4" />
          </clipPath>
          <ellipse rx="9.8" ry="11.4" fill={t.sclera} />
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
              r={pupilR * 0.34}
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
  const browY = m.brows === "raise" ? -3 : m.brows === "focus" ? -1.5 : 0
  const browR = (side: 0 | 1) =>
    (m.brows === "worry"
      ? 15
      : m.brows === "focus"
        ? 5
        : m.brows === "raise"
          ? -4
          : 0) * (side ? 1 : -1)

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
          fill={ground === "dark" ? "rgba(0,0,0,.5)" : "rgba(60,30,10,.12)"}
          className={shadowClass}
          style={t3("60px 114px")}
        />
      )}
      <g className={bodyClass} style={t3("60px 108px")}>
        <motion.g style={{ scale: live ? lean : 1, originX: 0.5, originY: 1 }}>
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
            opacity={tone === "white" ? 0.75 : 0.5}
          />
          <path
            d="M33 54 C38 44 49 38.5 60 38"
            fill="none"
            stroke={t.rim}
            strokeWidth="3.6"
            strokeLinecap="round"
          />
          {wear.includes("stethoscope") && <Worn o="stethoscope" />}
          <g
            style={{
              transform: `translate(${g.x * 2.4}px, ${g.y * 1.6}px)`,
              transition: "transform 420ms var(--ease-out)",
            }}
          >
            <ellipse
              cx="35.5"
              cy="81"
              rx="5.8"
              ry="3.4"
              fill={t.cheek}
              style={show(!!m.cheeks || tone === "white")}
              opacity={tone === "white" ? 0.8 : 1}
            />
            <ellipse
              cx="84.5"
              cy="81"
              rx="5.8"
              ry="3.4"
              fill={t.cheek}
              style={show(!!m.cheeks || tone === "white")}
              opacity={tone === "white" ? 0.8 : 1}
            />
            {eye(45, 0)}
            {eye(75, 1)}
            {wear.includes("glasses") && (
              <g>
                <circle
                  cx="45"
                  cy="66"
                  r="13"
                  fill="rgba(255,255,255,.14)"
                  stroke={INK}
                  strokeWidth="2.6"
                />
                <circle
                  cx="75"
                  cy="66"
                  r="13"
                  fill="rgba(255,255,255,.14)"
                  stroke={INK}
                  strokeWidth="2.6"
                />
                <path
                  d="M58 64 Q60 61.8 62 64"
                  stroke={INK}
                  strokeWidth="2.4"
                  fill="none"
                  strokeLinecap="round"
                />
              </g>
            )}
            <g style={show(!!m.brows)}>
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
                  transform: `translateY(${browY}px) rotate(${browR(0)}deg)`,
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
                  transform: `translateY(${browY}px) rotate(${browR(1)}deg)`,
                  transition: ease,
                }}
              />
            </g>
            <g transform="translate(60 87)">
              {mouth(
                "smile",
                <path
                  d="M-7 -1.5 Q0 5.5 7 -1.5"
                  fill="none"
                  stroke={t.mouth}
                  strokeWidth="3.2"
                  strokeLinecap="round"
                />,
              )}
              {mouth(
                "open",
                <g>
                  <path
                    d="M-8.5 -2.5 Q0 12 8.5 -2.5 Q0 0.5 -8.5 -2.5 Z"
                    fill={t.mouth}
                  />
                  <path d="M-4 5 Q0 2.6 4 5 Q0 7.6 -4 5 Z" fill={t.tongue} />
                </g>,
              )}
              {mouth(
                "grin",
                <g>
                  <path
                    d="M-11 -3.5 Q0 15 11 -3.5 Q0 0 -11 -3.5 Z"
                    fill={t.mouth}
                  />
                  <path
                    d="M-5.5 6.5 Q0 3.2 5.5 6.5 Q0 9.6 -5.5 6.5 Z"
                    fill={t.tongue}
                  />
                </g>,
              )}
              {mouth(
                "talk",
                <g
                  className="b-talk"
                  style={{
                    transformBox: "fill-box",
                    transformOrigin: "center",
                  }}
                >
                  <ellipse rx="6.4" ry="5.2" fill={t.mouth} />
                  <ellipse cy="2.4" rx="3.4" ry="1.8" fill={t.tongue} />
                </g>,
              )}
              {mouth("o", <ellipse rx="3.6" ry="4.2" fill={t.mouth} />)}
              {mouth("wow", <ellipse rx="4.8" ry="6" fill={t.mouth} />)}
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
            </g>
          </g>
          {wear.includes("cap") && <Worn o="cap" />}
          {wear.includes("chef") && <Worn o="chef" />}
          {wear.includes("headset") && <Worn o="headset" />}
          {wear.includes("headphones") && <Worn o="headphones" />}
          {wear.includes("book") && <Worn o="book" />}
        </motion.g>
      </g>
      {m.fx === "arcs" &&
        [0, 0.6].map((d) => (
          <path
            key={d}
            className="b-arc"
            d="M108 58 Q114 67 108 76"
            fill="none"
            stroke={t.fx}
            strokeWidth="2.6"
            strokeLinecap="round"
            style={{ ...t3("100px 67px"), animationDelay: `${d}s`, opacity: 0 }}
          />
        ))}
      {m.fx === "orbit" && (
        <g className="b-orbit" style={t3("60px 70px")}>
          <circle cx="60" cy="16" r="3" fill={t.fx} />
          <circle cx="111" cy="76" r="2.2" fill={GOLD} />
        </g>
      )}
      {m.fx === "zz" &&
        [0, 1.4].map((d, i) => (
          <path
            key={d}
            className="b-zz"
            d={i ? "M98 18 h6 l-6 6 h6" : "M88 30 h5 l-5 5 h5"}
            fill="none"
            stroke={tone === "white" ? "#FFFFFF" : "#FFB07A"}
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
          [12, 40, GOLD, 0, 1],
          [109, 30, t.fx, 0.5, 0.8],
          [107, 100, GOLD, 0.9, 0.6],
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

/** Bolo "says" the line: a single soft fade, then onDone once a reader would have finished. */
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
  const words = text.split(" ").length
  const done = useRef(onDone)
  done.current = onDone
  useEffect(() => {
    const t = window.setTimeout(() => done.current?.(), words * step + 380)
    return () => clearTimeout(t)
  }, [text, step, words])
  return (
    <span key={text} className={`fade-in ${className}`}>
      {text}
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
  tail?: "left" | "right" | "top" | "bottom" | "center" | "none"
  tone?: "light" | "dark" | "brand"
  className?: string
}) {
  const c = {
    light: "bg-surface text-ink shadow-card",
    dark: "bg-studio-3 text-studio-ink",
    brand: "bg-brand text-white",
  }[tone]
  const tc = { light: "bg-surface", dark: "bg-studio-3", brand: "bg-brand" }[
    tone
  ]
  const pos = {
    left: "bottom-4 -left-1.5",
    right: "bottom-4 -right-1.5",
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
  outfit,
}: {
  mood?: Mood
  size?: number
  tone?: "soft" | "dark" | "white"
  outfit?: Outfit | Outfit[]
}) {
  const bg = { soft: "bg-brand-soft", dark: "bg-studio-3", white: "bg-white" }[
    tone
  ]
  return (
    // Bolo's silhouette (crown to base) is centred in its own 120 box, so it simply sits in the
    // middle of the badge: no offset, nothing cropped.
    <span
      className={`relative grid shrink-0 place-items-center rounded-full ${bg}`}
      style={{ width: size, height: size }}
    >
      <Bolo
        mood={mood}
        size={size * 0.9}
        ground="none"
        outfit={outfit}
        className="block"
      />
    </span>
  )
}

/* ---------- Costumes: what Bolo wears when it plays a role ---------- */
export const ENV_OUTFIT: Record<Env, Outfit[]> = {
  market: ["bag"],
  food: ["chai"],
  travel: ["cap"],
  health: ["stethoscope"],
  money: ["glasses", "coin"],
  home: ["phone"],
}
/** A job's own costume wins (chef for a kitchen, headset for a care line); otherwise the setting decides. */
export const outfitFor = (
  env: Env,
  format: Format,
  costume?: Outfit[],
): Outfit[] =>
  costume?.length
    ? costume
    : format === "LINES"
      ? ["book"]
      : format === "INTERVIEW"
        ? env === "health" || env === "money"
          ? ENV_OUTFIT[env]
          : ["headset"]
        : format === "ROOM"
          ? ["headphones"]
          : ENV_OUTFIT[env]

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
            (speaking ? 0.6 + Math.random() * 1.6 : 0.25 + Math.random() * 0.4)
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

/* ---------- Active listening: Bolo reacts the way a person on the other end would ---------- */
export type Reaction = {
  mood: Mood
  say?: string
} | null
const BACKCHANNEL: Record<string, string[]> = {
  hi: ["हाँ…", "अच्छा", "हम्म", "हाँ जी", "अच्छा?"],
  mr: ["हो…", "बरं", "हम्म", "हो का?"],
  ta: ["ம்ம்…", "சரி", "ஆமா", "அப்படியா?"],
  bn: ["হ্যাঁ…", "আচ্ছা", "হুম", "তাই?"],
  te: ["అవును…", "సరే", "హ్మ్", "అలాగా?"],
  kn: ["ಹೌದು…", "ಸರಿ", "ಹ್ಮ್", "ಹೌದಾ?"],
  ml: ["ഉം…", "ശരി", "അതെ", "ആണോ?"],
  gu: ["હા…", "બરાબર", "હમ્મ", "એમ?"],
  pa: ["ਹਾਂ…", "ਅੱਛਾ", "ਹੰਮ", "ਸੱਚੀ?"],
  or: ["ହଁ…", "ଆଚ୍ଛା", "ହମ୍", "ସତରେ?"],
  ur: ["جی…", "اچھا", "ہمم", "اچھا؟"],
  en: ["Mm-hmm", "Right", "Okay…", "Really?"],
}
/** While you speak: a nod and a soft "haan" after a few seconds of talk, a curious tilt now and then.
    It reads only the live level — nothing you say is stored or sent. */
export function useListening(
  level: MotionValue<number>,
  active: boolean,
  lang: string,
): Reaction {
  const [r, setR] = useState<Reaction>(null)
  useEffect(() => {
    if (!active) {
      setR(null)
      return
    }
    const words = BACKCHANNEL[lang] ?? BACKCHANNEL.en
    let talk = 0
    let dip = 0
    let n = 0
    let last = performance.now()
    let clear = 0
    const id = window.setInterval(() => {
      const v = level.get()
      if (v > 0.14) {
        talk += 200
        dip = 0
      } else dip += 200
      const now = performance.now()
      if (talk >= 2000 && dip >= 200 && now - last > 2600) {
        const curious = n % 4 === 3
        setR({
          mood: curious ? "curious" : "nod",
          say: words[curious ? words.length - 1 : n % (words.length - 1)],
        })
        n++
        talk = 0
        last = now
        clearTimeout(clear)
        clear = window.setTimeout(() => setR(null), 1500)
      }
    }, 200)
    return () => {
      clearInterval(id)
      clearTimeout(clear)
    }
  }, [active, lang, level])
  return r
}

/* ---------- Voice ring: the live waveform wrapped around Bolo ---------- */

/** rest breathes · wait opens up for your turn · you follows your level · bolo pulses with Bolo's voice
    think travels and regroups · alert holds amber, calmly · done blooms once, then settles */
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
            ? 0.3 +
              0.25 * Math.max(0, Math.sin(t * 14)) * Math.abs(Math.sin(t * 2.6))
            : md === "wait"
              ? 0.18 + 0.05 * Math.sin(t * 2.2)
              : md === "think"
                ? 0.45
                : md === "alert"
                  ? 0.32 + 0.04 * Math.sin(t * 1.6)
                  : md === "done"
                    ? 0.14 + 0.5 * Math.exp(-ts * 3)
                    : 0.06 + 0.02 * Math.sin(t * 1.4)
      open += ((md === "wait" ? 8 : md === "you" ? 4 : 0) - open) * 0.08
      const r0 = inner + (reduce ? 0 : open)
      const scale = md === "rest" ? 10 : md === "wait" ? 22 : 30
      let d = ""
      for (let i = 0; i < bars; i++) {
        const a = (i / bars) * Math.PI * 2 - Math.PI / 2
        const n =
          md === "think"
            ? 0.12 +
              Math.pow(Math.max(0, Math.cos(a + Math.PI / 2 - t * 2.6)), 10)
            : md === "wait" || md === "done" || md === "alert"
              ? 0.82 + 0.18 * Math.sin(i * 0.9 + t * 1.6)
              : 0.5 +
                0.5 * Math.sin(i * 1.7 + t * 4.6) * Math.sin(i * 0.37 - t * 2.8)
        const target = reduce
          ? md === "rest"
            ? 3
            : 6
          : 2.5 + lv * (0.3 + 0.7 * n) * scale
        amps[i] = reduce ? target : amps[i] + (target - amps[i]) * 0.2
        const ca = Math.cos(a)
        const sa = Math.sin(a)
        d += `M${(c + ca * r0).toFixed(1)} ${(c + sa * r0).toFixed(1)}L${(c + ca * (r0 + amps[i])).toFixed(1)} ${(c + sa * (r0 + amps[i])).toFixed(1)}`
      }
      path.current?.setAttribute("d", d)
      glow.current?.setAttribute(
        "opacity",
        String(md === "rest" ? 0.1 : 0.14 + lv * 0.4),
      )
      if (!reduce) raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
    // Under reduced motion the ring is drawn once per mode, as a static, colour-coded ring.
  }, [size, inner, bars, level, reduce, reduce ? mode : null])
  const glowColor =
    mode === "alert" ? "#E39A12" : mode === "done" ? "#2FBF85" : "#F5640F"
  const stroke = {
    rest: "#3B322A",
    wait: "#FF8338",
    you: `url(#${uid}you)`,
    bolo: "#FFB07A",
    think: "#FFB07A",
    alert: "#E39A12",
    done: "#2FBF85",
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
          <stop offset="0" stopColor="#FFC24A" />
          <stop offset="1" stopColor="#F5640F" />
        </linearGradient>
        {/* Eased falloff, no flat core: reads as light, not as another ring */}
        <radialGradient id={`${uid}glow`}>
          <stop offset="0" stopColor={glowColor} stopOpacity="0.75" />
          <stop offset="0.25" stopColor={glowColor} stopOpacity="0.55" />
          <stop offset="0.5" stopColor={glowColor} stopOpacity="0.26" />
          <stop offset="0.72" stopColor={glowColor} stopOpacity="0.08" />
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
        style={{ transition: "opacity 160ms linear" }}
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
    note: "Plays the other person. Mouth and ring move with its voice.",
  },
  listening: {
    mood: "listen",
    ring: "wait",
    label: "Listening",
    note: "Your turn. Bolo leans in, brows up, the ring opens to wait.",
  },
  recording: {
    mood: "listen",
    ring: "you",
    label: "Recording",
    note: "Crown and ring follow your voice. Nods and a soft ‘haan’ as you talk.",
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
    note: "Clear take, saved. One hop, then calm.",
  },
  retry: {
    mood: "concern",
    ring: "alert",
    label: "Retry suggested",
    note: "Noise or a dropped mic. Calm amber: worried for you, never at you.",
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
    label: "Scene complete",
    note: "Every turn recorded. A rare, earned celebration.",
  },
}

/** Studio scale: Bolo inside its voice ring. The single place where state becomes motion. */
export function BoloStage({
  state,
  level,
  size = 248,
  tone = "brand",
  react,
  outfit,
  className = "",
  /** A momentary listening reaction (nod, tilt) with an optional backchannel word. */
}: {
  state: BoloState
  level?: MotionValue<number>
  size?: number
  tone?: BoloTone
  react?: Reaction
  outfit?: Outfit | Outfit[]
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
        mood={react?.mood ?? st.mood}
        size={size * 0.52}
        tone={tone}
        level={state === "recording" ? level : undefined}
        ground="none"
        outfit={outfit}
      />
      {react?.say && (
        <span
          key={react.say}
          className="rise absolute top-[14%] right-[2%] rounded-full bg-white px-3 py-1.5 text-14 font-medium text-ink shadow-card"
        >
          {react.say}
        </span>
      )}
    </div>
  )
}

/* ---------- Confetti: palette bits and ₹ coins, burst from a point ---------- */
export function Confetti({
  n = 26,
  colors = ["#F5640F", "#FFC24A", "#18A06B", "#1C1713", "#FFFFFF"],
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
        const d = 110 + Math.random() * 120
        return {
          x: Math.cos(a) * d,
          y: Math.sin(a) * d * 0.9 - 40,
          r: (Math.random() - 0.5) * 540,
          coin: coins && i % 4 === 0,
          c: colors[i % colors.length],
          w: 6 + Math.random() * 6,
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
              ? "grid h-5 w-5 place-items-center rounded-full text-11 font-semibold text-wait-ink shadow-[inset_0_-2px_0_rgba(0,0,0,.14)]"
              : "rounded-[2px]"
          }`}
          style={
            {
              "--x": `${b.x}px`,
              "--y": `${b.y}px`,
              "--r": `${b.r}deg`,
              animationDelay: `${b.delay}ms`,
              background: b.coin ? "#FFC24A" : b.c,
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
