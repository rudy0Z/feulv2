import {
  createContext,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react"
import {
  animate,
  motion,
  useDragControls,
  useMotionValue,
  useTransform,
} from "motion/react"
import NumberFlow from "@number-flow/react"
import {
  ENVS,
  FORMAT_LABEL,
  LENGTHS,
  jobTotal,
  lengthOf,
  perHour,
  type Env,
  type Job,
  type Length,
} from "../state/model"
import { sel, useStore } from "../state/store"

export const SPRING = { type: "spring", stiffness: 460, damping: 40 } as const
export const inr = (n: number) => `₹${Math.abs(n).toLocaleString("en-IN")}`
export const mmss = (t: number) =>
  `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`
export const buzz = (p: number | number[] = 8) => navigator.vibrate?.(p)

/* ---------- Screen tone ----------
   Each mounted screen owns its tone (status-bar ink + backdrop). The shell scopes it per screen,
   so a screen that is animating out can never repaint the status bar of the one coming in. */
export type Tone = {
  ink: "dark" | "light"
  bg: "canvas" | "studio" | "ink"
}
export const ToneCtx = createContext<(t: Tone) => void>(() => {})
export function useTone(ink: Tone["ink"], bg: Tone["bg"] = "canvas") {
  const set = useContext(ToneCtx)
  useLayoutEffect(() => set({ ink, bg }), [set, ink, bg])
}

/** The three-bar crown: FEUL's mark and Bolo's head, at glyph size. */
export function Mark({
  s = 18,
  color = "#2B3BFF",
  className = "",
}: {
  s?: number
  color?: string
  className?: string
}) {
  return (
    <svg
      width={s}
      height={s * (20 / 19)}
      viewBox="0 0 19 20"
      aria-hidden
      className={`shrink-0 ${className}`}
    >
      <rect x="0" y="7" width="5" height="13" rx="2.5" fill={color} />
      <rect x="7" y="0" width="5" height="20" rx="2.5" fill={color} />
      <rect x="14" y="5" width="5" height="15" rx="2.5" fill={color} />
    </svg>
  )
}

/* ---------- Icons (24 grid, 1.8 stroke) ---------- */
const P: Record<string, ReactNode> = {
  bell: (
    <path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15L6 16Zm4 4a2 2 0 0 0 4 0" />
  ),
  home: <path d="M4 11 12 4l8 7v9h-5v-6H9v6H4v-9Z" />,
  missions: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" />
    </>
  ),
  wallet: (
    <path d="M4 7h14a2 2 0 0 1 2 2v9H4zM4 7V6a2 2 0 0 1 2-2h10M16 13h1" />
  ),
  back: <path d="M15 5 8 12l7 7" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  chev: <path d="m9 5 7 7-7 7" />,
  down: <path d="m5 9 7 7 7-7" />,
  search: <path d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm5-2 4 4" />,
  filter: <path d="M4 6h16M7 12h10M10 18h4" />,
  bookmark: <path d="M7 4h10v16l-5-4-5 4z" />,
  play: <path d="M8 5v14l11-7z" fill="currentColor" />,
  /* The shared stroke thickens each bar, so the gap is wide enough to survive it. */
  pause: <path d="M7 5h2.5v14H7zM14.5 5H17v14h-2.5z" fill="currentColor" />,
  mic: (
    <path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Zm-6-3a6 6 0 0 0 12 0M12 18v3" />
  ),
  check: <path d="m5 12 5 5 9-10" />,
  alert: (
    <path d="M12 8v5m0 3h.01M10.3 4.2 2.8 18a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0Z" />
  ),
  clock: <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13v5l3 2" />,
  lock: <path d="M6 11h12v9H6zM8 11V8a4 4 0 1 1 8 0v3" />,
  shield: <path d="M12 3 5 6v6c0 4 3 7.5 7 9 4-1.5 7-5 7-9V6l-7-3Z" />,
  retry: <path d="M4 12a8 8 0 1 0 2.5-5.8M4 4v4h4" />,
  upload: <path d="M12 16V5m-5 5 5-5 5 5M5 19h14" />,
  help: (
    <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm-2.5-11.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14m0 3h.01" />
  ),
  users: (
    <path d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-6 9a6 6 0 0 1 12 0M16 5a3 3 0 0 1 0 6m2 9a6 6 0 0 0-3-5.2" />
  ),
  user: <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0" />,
  trash: <path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13" />,
  share: <path d="M12 4v11M7 9l5-5 5 5M5 14v6h14v-6" />,
  edit: <path d="M4 20h4L19 9l-4-4L4 16v4Z" />,
  bolt: <path d="M13 3 5 13.5h6L10 21l8-10.5h-6L13 3Z" />,
  circle: <circle cx="12" cy="12" r="6.5" />,
  layers: (
    <path d="m12 4 8.5 4.5L12 13 3.5 8.5 12 4ZM3.5 12.5 12 17l8.5-4.5M3.5 16 12 20.5l8.5-4.5" />
  ),
  star: (
    <path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9L12 3.5Z" />
  ),
  gift: (
    <path d="M4 10h16v10H4zM3 7h18v3H3zM12 7v13M12 7c-1.5-3-5-3.5-5-1s3 1 5 1Zm0 0c1.5-3 5-3.5 5-1s-3 1-5 1Z" />
  ),
  arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
  up: <path d="M12 19V5m-6 6 6-6 6 6" />,
  info: <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-5v-5m0-3h.01" />,
  headphones: (
    <path d="M4 15v-3a8 8 0 0 1 16 0v3M4 15h3v5H5a1 1 0 0 1-1-1v-4Zm16 0h-3v5h2a1 1 0 0 0 1-1v-4Z" />
  ),
  book: (
    <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5v-13ZM20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5v-13Z" />
  ),
  chat: (
    <path d="M5 5h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-8l-4 3.5V16H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" />
  ),
  ask: (
    <path d="M5 5h14v10h-8l-4 3.5V15H5zM10 8.6a2 2 0 1 1 2.8 1.8c-.5.3-.8.7-.8 1.2M12 13.2h.01" />
  ),
  spark: (
    <path d="M12 3c.8 5 4 8.2 9 9-5 .8-8.2 4-9 9-.8-5-4-8.2-9-9 5-.8 8.2-4 9-9Z" />
  ),
  trend: <path d="m4 16 5-5 4 4 7-7M15 8h5v5" />,
  globe: (
    <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM3.5 9h17M3.5 15h17M12 3c2.5 2.5 3.5 5.5 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-5.5-3.5-9s1-6.5 3.5-9Z" />
  ),
  pin: (
    <path d="M12 21s7-6.2 7-11.5a7 7 0 1 0-14 0C5 14.8 12 21 12 21Zm0-9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
  ),
  wave: <path d="M4 10v4M8 7v10M12 4v16M16 8v8M20 11v2" />,
  eye: (
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Zm9.5 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
  ),
  bank: <path d="M3 9 12 4l9 5M5 10v7M10 10v7M14 10v7M19 10v7M3 20h18" />,
  sliders: <path d="M4 7h10M18 7h2M4 17h4M12 17h8M14 4v6M8 14v6" />,
}
export function Icon({
  n,
  s = 22,
  className = "",
  stroke = 1.8,
}: {
  n: string
  s?: number
  className?: string
  stroke?: number
}) {
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      aria-hidden
    >
      {P[n]}
    </svg>
  )
}

/* ---------- Buttons — variant names are meanings, not colours ---------- */
type BtnV = "voice" | "ink" | "money" | "outline" | "ghost" | "link" | "danger" | "white" | "glass"
const BV: Record<BtnV, string> = {
  voice:
    "bg-cobalt text-white shadow-cobalt hover:bg-cobalt-hi active:bg-cobalt-deep",
  ink: "bg-ink text-white hover:bg-ink/88",
  money: "bg-lime text-ink shadow-lime hover:brightness-[1.04]",
  outline:
    "bg-surface text-ink shadow-[inset_0_0_0_1.5px_var(--color-line-2)] hover:bg-surface-2",
  ghost: "text-ink hover:bg-ink/5",
  link: "text-cobalt hover:bg-cobalt-soft",
  danger: "bg-red text-white hover:brightness-110",
  white: "bg-white text-ink hover:bg-white/92",
  glass: "bg-white/12 text-white hover:bg-white/18",
}
export function Btn({
  v = "ink",
  children,
  onClick,
  disabled,
  loading,
  full,
  size = "md",
  icon,
  iconRight,
  className = "",
  type = "button",
}: {
  v?: BtnV
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
  full?: boolean
  size?: "sm" | "md" | "lg"
  icon?: string
  iconRight?: string
  className?: string
  type?: "button" | "submit"
}) {
  const sz =
    size === "lg"
      ? "h-14 px-6 text-16"
      : size === "sm"
        ? "h-10 px-4 text-14"
        : "h-12 px-5 text-16"
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap transition-[background-color,color,box-shadow,scale,opacity,filter] duration-200 ease-(--ease-spring) active:not-disabled:scale-[0.96] disabled:opacity-35 disabled:shadow-none ${sz} ${BV[v]} ${
        full ? "w-full" : ""
      } ${className}`}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : icon ? (
        <Icon n={icon} s={size === "sm" ? 16 : 19} />
      ) : null}
      {children}
      {iconRight && !loading && (
        <Icon n={iconRight} s={size === "sm" ? 16 : 18} />
      )}
    </button>
  )
}
export function IconBtn({
  n,
  onClick,
  label,
  badge,
  dark,
  className = "",
  s = 22,
}: {
  n: string
  onClick?: () => void
  label: string
  badge?: boolean
  dark?: boolean
  className?: string
  s?: number
}) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      className={`relative grid h-11 w-11 shrink-0 place-items-center rounded-full transition-[background-color,scale] duration-200 ease-(--ease-spring) active:scale-90 ${
        dark ? "text-studio-ink hover:bg-white/10" : "text-ink hover:bg-ink/6"
      } ${className}`}
    >
      <span className={badge ? "bell-ring" : ""}>
        <Icon n={n} s={s} />
      </span>
      {badge && (
        <span className="absolute top-2.5 right-2.5 grid h-2.5 w-2.5 place-items-center">
          <span className="ping-soft absolute inset-0 rounded-full bg-orange" />
          <span className="relative h-2.5 w-2.5 rounded-full bg-orange ring-2 ring-canvas" />
        </span>
      )}
    </button>
  )
}

/* ---------- Tags & status (one vocabulary everywhere) ---------- */
export type TagTone = "neutral" | "cobalt" | "lime" | "limeSolid" | "orange" | "orangeSolid" | "red" | "ink" | "studio" | "white"
const TT: Record<TagTone, string> = {
  neutral: "bg-surface-3 text-ink-2",
  cobalt: "bg-cobalt-soft text-cobalt-deep",
  lime: "bg-lime-soft text-lime-ink",
  limeSolid: "bg-lime text-ink",
  orange: "bg-orange-soft text-orange-ink",
  orangeSolid: "bg-orange text-white",
  red: "bg-red-soft text-red",
  ink: "bg-ink text-white",
  studio: "bg-white/10 text-studio-ink",
  white: "bg-white/90 text-ink",
}
export function Tag({
  tone = "neutral",
  children,
  icon,
  dot,
  live,
  className = "",
}: {
  tone?: TagTone
  children: ReactNode
  icon?: string
  dot?: boolean
  live?: boolean
  className?: string
}) {
  return (
    <span
      className={`inline-flex h-6 shrink-0 items-center gap-1 rounded-full px-2.5 text-12 font-semibold whitespace-nowrap ${TT[tone]} ${className}`}
    >
      {dot && (
        <span className="relative grid h-1.5 w-1.5 place-items-center">
          {live && (
            <span className="ping-soft absolute inset-0 rounded-full bg-current" />
          )}
          <span className="relative h-1.5 w-1.5 rounded-full bg-current" />
        </span>
      )}
      {icon && <Icon n={icon} s={13} stroke={2} />}
      {children}
    </span>
  )
}
export const STATUS: Record<string, [string, TagTone]> = {
  ready: ["Ready", "neutral"],
  recording: ["Recording", "cobalt"],
  recorded_local: ["On this phone", "neutral"],
  uploading: ["Uploading", "cobalt"],
  upload_failed: ["Not uploaded", "orange"],
  submitted: ["Received", "neutral"],
  under_review: ["With reviewers", "orange"],
  accepted: ["Accepted", "lime"],
  repair_required: ["Needs a retake", "orangeSolid"],
  repaired: ["Retake sent", "orange"],
  approved: ["Approved", "lime"],
  appeal: ["Under appeal", "orange"],
  pending: ["Pending review", "orange"],
  settled: ["Settled", "lime"],
  failed: ["Failed", "red"],
  processing: ["Processing", "orange"],
  honoured: ["Paid · campaign closed", "lime"],
  deleted_after_revocation: ["Data deleted · paid", "neutral"],
  requested: ["Requested", "orange"],
  delayed: ["Delayed", "orange"],
  paid: ["Paid", "lime"],
  hold: ["On hold", "orange"],
}
export function Status({
  k,
  label,
  className,
}: {
  k: string
  label?: string
  className?: string
}) {
  const [l, t] = STATUS[k] ?? [k, "neutral"]
  const live = [
    "under_review",
    "uploading",
    "processing",
    "recording",
    "appeal",
    "requested",
    "delayed",
  ].includes(k)
  return (
    <Tag tone={t} dot live={live} className={className}>
      {label ?? l}
    </Tag>
  )
}

/* ---------- Money: digits roll, never jump ---------- */
export function Money({
  value,
  sign,
  className = "",
  roll = true,
}: {
  value: number
  sign?: boolean
  className?: string
  roll?: boolean
}) {
  const [v, setV] = useState(roll ? 0 : value)
  useEffect(() => {
    const t = requestAnimationFrame(() => setV(value))
    return () => cancelAnimationFrame(t)
  }, [value])
  const pre = (value < 0 ? "−" : sign && value > 0 ? "+" : "") + "₹"
  return (
    <NumberFlow
      value={Math.abs(v)}
      prefix={pre}
      locales="en-IN"
      format={{ maximumFractionDigits: 0 }}
      className={className}
    />
  )
}

/* ---------- Brand ---------- */
/* Short prop types live in multi-line aliases: oxfmt 0.2 strips the separators from
   one-line type literals, which leaves `{ a: string b: number }` that TypeScript rejects. */
type WordmarkProps = {
  dark?: boolean
  s?: number
}
export function Wordmark({ dark, s = 1 }: WordmarkProps) {
  return (
    <span
      className={`inline-flex items-end gap-1.5 ${
        dark ? "text-white" : "text-ink"
      }`}
      style={{ zoom: s }}
    >
      <Mark s={19} color={dark ? "#FFFFFF" : "#2B3BFF"} className="mb-[3px]" />
      <span className="semi text-24 leading-none font-bold tracking-[-0.03em]">
        feul
      </span>
    </span>
  )
}

/* ---------- Bars ---------- */
export function TopBar() {
  const { s, a } = useStore()
  const unread = s.notices.some((n) => n.unread)
  const tier = sel.tier(s)
  const earned = s.ledger.filter((l) => l.kind === "earning").length
  const prog = Math.min(1, tier >= 3 ? 1 : earned / (tier === 1 ? 3 : 8))
  return (
    <header className="glass-light sticky top-0 z-20 flex items-center justify-between px-5 pt-[54px] pb-2">
      <Wordmark />
      <div className="flex items-center gap-1">
        <IconBtn
          n="bell"
          label="Notifications"
          badge={unread}
          onClick={() => a.openSheet("notifications")}
        />
        <button
          aria-label={`Profile · level ${tier}`}
          onClick={() => a.push({ name: "profile" })}
          className="relative ml-0.5 grid h-11 w-11 place-items-center rounded-full transition-transform duration-200 ease-(--ease-spring) active:scale-90"
        >
          <svg
            width="44"
            height="44"
            viewBox="0 0 44 44"
            className="absolute inset-0 -rotate-90"
            aria-hidden
          >
            <circle
              cx="22"
              cy="22"
              r="20"
              fill="none"
              stroke="var(--color-line-2)"
              strokeWidth="2.5"
            />
            <circle
              cx="22"
              cy="22"
              r="20"
              fill="none"
              stroke="var(--color-cobalt)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={`${prog * 125.7} 200`}
              style={{ transition: "stroke-dasharray 900ms var(--ease-out)" }}
            />
          </svg>
          <span className="grid h-[34px] w-[34px] place-items-center rounded-full bg-ink text-14 font-semibold text-white">
            {s.name[0]}
          </span>
          <span className="tnum absolute -right-0.5 -bottom-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-cobalt px-1 text-11 font-bold text-white ring-2 ring-canvas">
            {tier}
          </span>
        </button>
      </div>
    </header>
  )
}
export function BackBar({
  title,
  onBack,
  right,
  dark,
  sub,
}: {
  title?: string
  onBack?: () => void
  right?: ReactNode
  dark?: boolean
  sub?: string
}) {
  const { a } = useStore()
  return (
    <header
      className={`${
        dark ? "glass-dark text-studio-ink" : "glass-light"
      } sticky top-0 z-20 flex items-center gap-1 px-2 pt-[54px] pb-1`}
    >
      <IconBtn n="back" label="Back" dark={dark} onClick={onBack ?? a.pop} />
      <div className="min-w-0 flex-1">
        {title && <div className="truncate text-16 font-semibold">{title}</div>}
        {sub && (
          <div
            className={`truncate text-12 ${
              dark ? "text-studio-ink-2" : "text-ink-2"
            }`}
          >
            {sub}
          </div>
        )}
      </div>
      {right}
    </header>
  )
}

/* Three floating discs, no bar. Icon-only, with the cobalt disc sliding to the active tab.
   Bolo deliberately does not live here: the nav also sits over Missions and Wallet, where Bolo stays out of the way. */
export function BottomNav() {
  const { s, a } = useStore()
  const items = [
    ["home", "Home", "home"],
    ["jobs", "Missions", "missions"],
    ["wallet", "Wallet", "wallet"],
  ] as const
  const idx = Math.max(
    0,
    items.findIndex(([k]) => k === s.tab),
  )
  return (
    <motion.nav
      initial={{ y: 130 }}
      animate={{ y: 0 }}
      exit={{ y: 130 }}
      transition={SPRING}
      aria-label="Main"
      className="pointer-events-none absolute inset-x-0 bottom-7 z-30 flex justify-center"
    >
      <div className="pointer-events-auto relative flex items-center gap-1 rounded-full bg-white/85 p-1.5 shadow-float backdrop-blur-xl">
        <span
          aria-hidden
          className="absolute top-1.5 left-1.5 h-14 w-14 rounded-full bg-cobalt shadow-cobalt transition-transform duration-500 ease-(--ease-spring) motion-reduce:transition-none"
          style={{ transform: `translateX(${idx * 60}px)` }}
        />
        {items.map(([k, l, ic]) => {
          const on = s.tab === k
          return (
            <button
              key={k}
              onClick={() => (a.setTab(k), buzz(6))}
              aria-label={l}
              aria-current={on ? "page" : undefined}
              className={`relative grid h-14 w-14 place-items-center rounded-full transition-colors duration-300 active:scale-90 ${
                on ? "text-white" : "text-ink-2 hover:text-ink"
              }`}
            >
              <span
                className={`transition-transform duration-500 ease-(--ease-spring) ${
                  on ? "scale-110" : "scale-100"
                }`}
              >
                <Icon n={ic} s={22} />
              </span>
            </button>
          )
        })}
      </div>
    </motion.nav>
  )
}

/* ---------- Segmented control: the pill slides ---------- */
export function Segmented<T extends string>({
  items,
  value,
  onChange,
  dark,
  className = "",
}: {
  items: {
    k: T
    l: string
    n?: number
    icon?: string
  }[]
  value: T
  onChange: (k: T) => void
  dark?: boolean
  className?: string
}) {
  const id = useId()
  return (
    <div
      role="tablist"
      className={`no-scrollbar -mx-5 flex gap-1.5 overflow-x-auto px-5 ${className}`}
    >
      {items.map((it) => {
        const on = it.k === value
        return (
          <button
            role="tab"
            aria-selected={on}
            key={it.k}
            onClick={() => (onChange(it.k), buzz(4))}
            className={`relative flex h-10 shrink-0 items-center rounded-full px-4 text-14 font-semibold whitespace-nowrap transition-colors duration-200 ${
              on
                ? dark
                  ? "text-ink"
                  : "text-white"
                : dark
                  ? "bg-white/8 text-studio-ink-2"
                  : "bg-surface text-ink-2 shadow-[inset_0_0_0_1px_var(--color-line)] hover:text-ink"
            }`}
          >
            {on && (
              <motion.span
                layoutId={id}
                transition={SPRING}
                className={`absolute inset-0 rounded-full ${
                  dark ? "bg-white" : "bg-ink"
                }`}
              />
            )}
            <span className="relative flex items-center gap-1.5">
              {it.icon && <Icon n={it.icon} s={15} stroke={2} />}
              {it.l}
              {it.n != null && it.n > 0 && (
                <span className="tnum text-12 opacity-55">{it.n}</span>
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}

/* ---------- Waveforms (thumb / scrub) ---------- */
const rnd = (seed: number) => {
  let x = seed * 9301 + 49297
  return () => {
    x = (x * 9301 + 49297) % 233280
    return x / 233280
  }
}
type WTone = "cobalt" | "ink" | "muted" | "light" | "lime" | "orange"
export function Waveform({
  seed = 1,
  bars = 48,
  h = 40,
  progress = 1,
  tone = "cobalt",
  className = "",
}: {
  seed?: number
  bars?: number
  h?: number
  progress?: number
  tone?: WTone
  className?: string
}) {
  const r = rnd(seed)
  const vals = Array.from({ length: bars }, (_, i) =>
    Math.max(
      0.1,
      (r() * 0.75 + 0.25) * (Math.sin((i / bars) * Math.PI) * 0.55 + 0.45),
    ),
  )
  const on = {
    cobalt: "#2B3BFF",
    ink: "#0E0F14",
    muted: "#8B90A1",
    light: "#FFFFFF",
    lime: "#C6F432",
    orange: "#FF5A1F",
  }[tone]
  const off =
    tone === "light" || tone === "lime" ? "rgba(255,255,255,.2)" : "#D5D8E1"
  const w = 100 / bars
  return (
    <svg
      viewBox={`0 0 100 ${h}`}
      preserveAspectRatio="none"
      className={`block w-full ${className}`}
      style={{ height: h }}
      aria-hidden
    >
      {vals.map((v, i) => {
        const bh = Math.max(2, v * h)
        return (
          <rect
            key={i}
            x={i * w + w * 0.22}
            y={(h - bh) / 2}
            width={w * 0.56}
            height={bh}
            rx={Math.min(w * 0.28, 1.4)}
            fill={i / bars < progress ? on : off}
            style={{ transition: "fill 120ms linear" }}
          />
        )
      })}
    </svg>
  )
}

export function Player({
  seed,
  secs = 12,
  label,
  dark,
}: {
  seed: number
  secs?: number
  label?: string
  dark?: boolean
}) {
  const [p, setP] = useState(0)
  const [on, setOn] = useState(false)
  useEffect(() => {
    if (!on) return
    const t = setInterval(
      () => setP((x) => (x >= 1 ? (setOn(false), 0) : x + 0.05 / secs)),
      50,
    )
    return () => clearInterval(t)
  }, [on, secs])
  const cur = Math.round(p * secs)
  return (
    <div className="flex items-center gap-3">
      <button
        aria-label={on ? "Pause" : `Play ${label ?? "audio"}`}
        onClick={() => (setOn(!on), buzz(4))}
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-full transition-[background-color,color,scale] duration-200 ease-(--ease-spring) active:scale-90 ${
          on
            ? "bg-cobalt text-white"
            : dark
              ? "bg-white text-ink"
              : "bg-surface text-ink shadow-[inset_0_0_0_1.5px_var(--color-line-2)]"
        }`}
      >
        <Icon
          n={on ? "pause" : "play"}
          s={15}
          className={on ? "" : "translate-x-px"}
        />
      </button>
      <div className="min-w-0 flex-1">
        <Waveform
          seed={seed}
          bars={44}
          h={28}
          progress={on || p > 0 ? p : 0}
          tone={dark ? "light" : "cobalt"}
        />
      </div>
      <span
        className={`tnum w-9 text-right text-12 font-medium ${
          dark ? "text-studio-ink-2" : "text-ink-2"
        }`}
      >
        {mmss(on || p > 0 ? cur : secs)}
      </span>
    </div>
  )
}

/* ---------- Mission metadata ---------- */
export function SceneIcon({
  env,
  s = 32,
  className = "",
}: {
  env: Env
  s?: number
  className?: string
}) {
  const d: Record<Env, ReactNode> = {
    market: (
      <>
        <path d="M5 12h22l-2 14H7z" />
        <path d="M11 12a5 5 0 0 1 10 0" />
        <path d="M12 18v3M20 18v3" />
      </>
    ),
    food: (
      <>
        <path d="M6 13h17v5a8 8 0 0 1-8 8h-1a8 8 0 0 1-8-8z" />
        <path d="M23 15h2a3 3 0 0 1 0 6h-3" />
        <path d="M11 5c-1 2 1 3 0 5M16 5c-1 2 1 3 0 5" />
      </>
    ),
    travel: (
      <>
        <rect x="6" y="6" width="20" height="17" rx="4" />
        <path d="M6 15h20M11 27l2-4M21 27l-2-4" />
        <circle cx="11" cy="19" r="1" />
        <circle cx="21" cy="19" r="1" />
      </>
    ),
    health: (
      <>
        <rect x="5" y="5" width="22" height="22" rx="7" />
        <path d="M16 10v12M10 16h12" />
      </>
    ),
    money: (
      <>
        <rect x="4" y="9" width="24" height="15" rx="3" />
        <circle cx="16" cy="16.5" r="3.5" />
        <path d="M8 13v7M24 13v7" />
      </>
    ),
    home: (
      <>
        <path d="M5 15 16 6l11 9" />
        <path d="M8 13v13h16V13" />
        <path d="M13 26v-7h6v7" />
      </>
    ),
  }
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {d[env]}
    </svg>
  )
}
export const FORMAT_ICON = {
  LINES: "book",
  SCENARIO: "chat",
  INTERVIEW: "ask",
  ROOM: "users",
} as const

type LengthTagProps = {
  l: Length
  dark?: boolean
}
export function LengthTag({ l, dark }: LengthTagProps) {
  return (
    <Tag tone={dark ? "white" : "ink"} icon={LENGTHS[l].icon}>
      {LENGTHS[l].label}
    </Tag>
  )
}
export function RareTag({ x }: { x: number }) {
  if (x < 1.3) return null
  return (
    <Tag tone="cobalt" icon="spark">
      <span className="tnum">{x.toFixed(1)}×</span> rare voice
    </Tag>
  )
}

/** Scannable: reward and time first, then what it is, then why it pays what it pays. */
type MissionRowProps = {
  job: Job
  locked?: boolean
}
export function MissionRow({ job, locked }: MissionRowProps) {
  const { s, a } = useStore()
  const saved = s.saved.includes(job.id)
  const off = job.campaign !== "open" || locked
  const status = locked
    ? `Unlocks at level ${job.tier}`
    : job.campaign === "full"
      ? "Coverage full"
      : job.campaign === "oversubscribed"
        ? "Paused · oversubscribed"
        : job.campaign === "closed"
          ? "Closed to new work"
          : null
  const l = lengthOf(job)
  return (
    <div
      className={`group relative flex gap-3.5 rounded-lg bg-surface p-2.5 shadow-card transition-[scale,box-shadow] duration-300 ease-(--ease-spring) active:scale-[0.98] ${
        off ? "opacity-65" : "hover:shadow-float"
      }`}
    >
      <div className="relative h-[92px] w-[84px] shrink-0 overflow-hidden rounded-md bg-surface-3">
        <SceneIcon
          env={job.env}
          s={28}
          className="absolute inset-0 m-auto text-ink-3"
        />
        <img
          src={job.image}
          alt=""
          loading="lazy"
          className={`absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-(--ease-out) group-hover:scale-105 ${
            off ? "grayscale" : ""
          }`}
          onError={(e) => (e.currentTarget.style.display = "none")}
        />
        <span className="absolute bottom-1.5 left-1.5">
          <LengthTag l={l} dark />
        </span>
      </div>
      <div className="min-w-0 flex-1 py-0.5 pr-1">
        <button
          onClick={() => a.push({ name: "detail", jobId: job.id })}
          className="block w-full text-left after:absolute after:inset-0 after:rounded-lg"
          aria-label={`${job.title}, ${inr(jobTotal(job))} guaranteed, ${job.minutes} minutes`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate text-16 leading-tight font-semibold">
                {job.title}
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-12 text-ink-2">
                <Icon n={FORMAT_ICON[job.format]} s={13} />
                <span className="truncate">
                  {FORMAT_LABEL[job.format]} ·{" "}
                  <span className="tnum">{job.minutes} min</span> ·{" "}
                  {ENVS[job.env].short}
                </span>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div
                className={`cond tnum text-24 leading-none font-bold ${
                  off ? "text-ink-3" : ""
                }`}
              >
                {inr(jobTotal(job))}
              </div>
              {job.bonus > 0 && (
                <div className="tnum mt-1 text-11 font-semibold text-ink-3">
                  +{inr(job.bonus)} bonus
                </div>
              )}
            </div>
          </div>
        </button>
        <div className="mt-2.5 flex items-center gap-1.5">
          {status ? (
            <Tag tone="neutral" icon={locked ? "lock" : undefined}>
              {status}
            </Tag>
          ) : (
            <>
              <Tag tone="neutral">
                <span className="tnum">≈{inr(perHour(job))}/hr</span>
              </Tag>
              <RareTag x={job.coverage} />
            </>
          )}
          <button
            aria-label={saved ? "Remove from saved" : "Save mission"}
            onClick={() => (a.toggleSave(job.id), buzz(6))}
            className={`relative z-10 -my-2 ml-auto grid h-9 w-9 place-items-center rounded-full transition-[scale,color] duration-300 ease-(--ease-spring) hover:bg-surface-2 active:scale-75 ${
              saved ? "scale-110 text-cobalt" : "text-ink-3"
            }`}
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill={saved ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinejoin="round"
            >
              <path d="M7 4h10v16l-5-4-5 4z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

/* ---------- Surfaces ---------- */
export const Card = ({
  children,
  className = "",
  style,
}: {
  children: ReactNode
  className?: string
  style?: CSSProperties
}) => (
  <div
    className={`rounded-lg bg-surface shadow-card ${
      /\bp-\d|\bpx-\d/.test(className) ? "" : "p-5"
    } ${className}`}
    style={style}
  >
    {children}
  </div>
)
export function Section({
  title,
  action,
  children,
  className = "",
  sub,
}: {
  title: string
  action?: ReactNode
  children: ReactNode
  className?: string
  sub?: string
}) {
  return (
    <section className={`px-5 ${className}`}>
      <div className="mb-3.5 flex items-end justify-between gap-3">
        <div>
          <h2 className="semi text-20 font-bold tracking-[-0.01em]">{title}</h2>
          {sub && <p className="mt-0.5 text-14 text-ink-2">{sub}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}
export const Label = ({
  children,
  className = "",
}: {
  children: ReactNode
  className?: string
}) => <div className={`eyebrow text-ink-3 ${className}`}>{children}</div>

type NTone = "attention" | "info" | "ok" | "neutral" | "error" | "studio"
export function Notice({
  tone,
  title,
  children,
  action,
  icon,
}: {
  tone: NTone
  title: string
  children?: ReactNode
  action?: ReactNode
  icon?: string
}) {
  const c = {
    attention: "bg-orange-soft",
    info: "bg-cobalt-soft",
    ok: "bg-lime-soft",
    neutral: "bg-surface-2 shadow-[inset_0_0_0_1px_var(--color-line)]",
    error: "bg-red-soft",
    studio: "bg-studio-3 text-studio-ink",
  }[tone]
  const ic = {
    attention: "bg-orange text-white",
    info: "bg-cobalt text-white",
    ok: "bg-lime text-ink",
    neutral: "bg-ink text-white",
    error: "bg-red text-white",
    studio: "bg-orange text-white",
  }[tone]
  const name =
    icon ??
    {
      attention: "clock",
      info: "info",
      ok: "check",
      neutral: "shield",
      error: "alert",
      studio: "alert",
    }[tone]
  return (
    <div className={`flex gap-3 rounded-lg p-4 ${c}`}>
      <span
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${ic}`}
      >
        <Icon n={name} s={16} stroke={2} />
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <div
          className={`text-16 leading-snug font-semibold ${
            tone === "studio" ? "" : "text-ink"
          }`}
        >
          {title}
        </div>
        {children && (
          <div
            className={`mt-0.5 text-14 leading-snug ${
              tone === "studio" ? "text-studio-ink-2" : "text-ink-2"
            }`}
          >
            {children}
          </div>
        )}
        {action && <div className="mt-3">{action}</div>}
      </div>
    </div>
  )
}

export function Meter({
  value,
  max = 1,
  tone = "cobalt",
  className = "",
  h = "h-2",
}: {
  value: number
  max?: number
  tone?: "cobalt" | "lime" | "orange" | "ink" | "white"
  className?: string
  h?: string
}) {
  const fill = {
    cobalt: "bg-cobalt",
    lime: "bg-lime",
    orange: "bg-orange",
    ink: "bg-ink",
    white: "bg-white",
  }[tone]
  return (
    <div
      className={`overflow-hidden rounded-full ${h} ${
        /\bbg-/.test(className) ? "" : "bg-surface-3"
      } ${className}`}
    >
      <div
        className={`h-full rounded-full transition-[width] duration-700 ease-(--ease-out) ${fill}`}
        style={{ width: `${Math.max(0, Math.min(100, (value / max) * 100))}%` }}
      />
    </div>
  )
}

/** Where something is in its lifecycle. Done is ink, now is orange while it waits on someone else
    (or the given tone), next is hollow. One shape for reviews, payouts and data-rights requests. */
export type Step = {
  title: string
  body?: ReactNode
  state: "done" | "now" | "next"
}
export function Timeline({
  steps,
  now = "orange",
  dark,
}: {
  steps: Step[]
  now?: "orange" | "cobalt" | "lime"
  dark?: boolean
}) {
  const nowC = { orange: "bg-orange", cobalt: "bg-cobalt", lime: "bg-lime" }[
    now
  ]
  const ringC = {
    orange: "bg-orange/30",
    cobalt: "bg-cobalt/30",
    lime: "bg-lime/40",
  }[now]
  return (
    <ol className="flex flex-col">
      {steps.map((st, i) => (
        <li key={st.title} className="relative flex gap-3.5 pb-5 last:pb-0">
          {i < steps.length - 1 && (
            <span
              aria-hidden
              className={`absolute top-6 bottom-0 left-[11px] w-0.5 rounded-full ${
                st.state === "done"
                  ? dark
                    ? "bg-white/60"
                    : "bg-ink"
                  : dark
                    ? "bg-white/12"
                    : "bg-line-2"
              }`}
            />
          )}
          <span className="relative mt-0.5 grid h-6 w-6 shrink-0 place-items-center">
            {st.state === "done" ? (
              <span
                className={`grid h-6 w-6 place-items-center rounded-full ${
                  dark ? "bg-white text-ink" : "bg-ink text-white"
                }`}
              >
                <Icon n="check" s={13} stroke={2.6} />
              </span>
            ) : st.state === "now" ? (
              <>
                <span
                  className={`ping-soft absolute inset-0.5 rounded-full ${ringC}`}
                />
                <span
                  className={`relative h-3.5 w-3.5 rounded-full ${nowC} ring-4 ${
                    dark ? "ring-studio" : "ring-surface"
                  }`}
                />
              </>
            ) : (
              <span
                className={`h-3.5 w-3.5 rounded-full border-2 ${
                  dark ? "border-white/25" : "border-line-2"
                }`}
              />
            )}
          </span>
          <div className="min-w-0 pt-0.5">
            <div
              className={`text-16 leading-snug font-semibold ${
                st.state === "next"
                  ? dark
                    ? "text-studio-ink-3"
                    : "text-ink-3"
                  : ""
              }`}
            >
              {st.title}
            </div>
            {st.body && (
              <div
                className={`mt-0.5 text-14 leading-snug ${
                  dark ? "text-studio-ink-2" : "text-ink-2"
                }`}
              >
                {st.body}
              </div>
            )}
          </div>
        </li>
      ))}
    </ol>
  )
}

export function Toggle({
  on,
  onChange,
  label,
  disabled,
}: {
  on: boolean
  onChange: (v: boolean) => void
  label: string
  disabled?: boolean
}) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={() => (onChange(!on), buzz(4))}
      className={`relative h-8 w-[52px] shrink-0 rounded-full transition-colors duration-200 disabled:opacity-50 ${
        on ? "bg-cobalt" : "bg-line-2"
      }`}
    >
      <span
        className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow-[0_1px_3px_rgb(14_15_20/.25)] transition-transform duration-300 ease-(--ease-spring) ${
          on ? "translate-x-5" : ""
        }`}
      />
    </button>
  )
}

/* ---------- Sheets & dialogs ---------- */
export function SheetFrame({
  title,
  children,
  onClose,
  icon,
}: {
  title: string
  children: ReactNode
  onClose: () => void
  icon?: ReactNode
}) {
  const drag = useDragControls()
  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end">
      <motion.button
        aria-label="Close"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-ink/45 backdrop-blur-[2px]"
      />
      <motion.div
        role="dialog"
        aria-label={title}
        drag="y"
        dragControls={drag}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.7 }}
        onDragEnd={(_, i) =>
          (i.offset.y > 100 || i.velocity.y > 600) && onClose()
        }
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={SPRING}
        className="relative flex max-h-[88%] flex-col rounded-t-lg bg-surface"
      >
        <div
          onPointerDown={(e) => drag.start(e)}
          className="shrink-0 cursor-grab touch-none px-5 pt-3 active:cursor-grabbing"
        >
          <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line-2" />
          <div className="mb-3 flex items-center gap-3">
            {icon}
            <h3 className="semi flex-1 text-24 font-bold tracking-[-0.01em]">
              {title}
            </h3>
            <IconBtn
              n="close"
              label="Close"
              onClick={onClose}
              className="bg-surface-2"
              s={18}
            />
          </div>
        </div>
        <div className="overflow-y-auto px-5 pb-9">{children}</div>
      </motion.div>
    </div>
  )
}
export function Dialog({
  title,
  children,
  actions,
  top,
}: {
  title: string
  children: ReactNode
  actions: ReactNode
  top?: ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 grid place-items-center bg-ink/50 px-6 backdrop-blur-[2px]"
    >
      <motion.div
        role="alertdialog"
        aria-label={title}
        initial={{ scale: 0.9, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={SPRING}
        className="w-full rounded-lg bg-surface p-6 text-ink shadow-float"
      >
        {top}
        <h3 className="semi text-24 leading-tight font-bold">{title}</h3>
        <div className="mt-2 text-16 leading-relaxed text-ink-2">
          {children}
        </div>
        <div className="mt-6 flex flex-col gap-2">{actions}</div>
      </motion.div>
    </motion.div>
  )
}

/* ---------- Slide to confirm: money leaves only on a deliberate gesture ---------- */
export function SlideToConfirm({
  label,
  onConfirm,
  busy,
}: {
  label: string
  onConfirm: () => void
  busy?: boolean
}) {
  const track = useRef<HTMLDivElement>(null)
  const [max, setMax] = useState(260)
  const [done, setDone] = useState(false)
  const x = useMotionValue(0)
  const fade = useTransform(x, [0, max * 0.55], [1, 0])
  const fill = useTransform(x, (v) => v + 64)
  useLayoutEffect(() => setMax((track.current?.offsetWidth ?? 324) - 64), [])
  const finish = () => {
    setDone(true)
    animate(x, max, SPRING)
    buzz([10, 30, 16])
    onConfirm()
  }
  return (
    <div
      ref={track}
      className="relative h-16 overflow-hidden rounded-full bg-white/10 p-1 shadow-[inset_0_0_0_1px_rgb(255_255_255/.08)]"
    >
      <motion.div
        className="absolute inset-y-1 left-1 rounded-full bg-lime/22"
        style={{ width: fill }}
      />
      <motion.span
        style={{ opacity: fade }}
        className="pointer-events-none absolute inset-0 grid place-items-center pl-12 text-16 font-semibold text-white/85"
      >
        <span className="flex items-center gap-2">
          {label}
          <Icon n="chev" s={16} className="opacity-60" />
          <Icon n="chev" s={16} className="-ml-3 opacity-35" />
        </span>
      </motion.span>
      <motion.button
        aria-label={label}
        drag={done ? false : "x"}
        dragConstraints={{ left: 0, right: max }}
        dragElastic={0.02}
        dragMomentum={false}
        style={{ x }}
        onDragEnd={() =>
          x.get() > max * 0.82 ? finish() : animate(x, 0, SPRING)
        }
        onKeyDown={(e) =>
          (e.key === "Enter" || e.key === " ") &&
          !done &&
          (e.preventDefault(), finish())
        }
        className="relative z-10 grid h-14 w-14 cursor-grab touch-none place-items-center rounded-full bg-lime text-ink shadow-lime active:cursor-grabbing"
      >
        {busy || done ? (
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-ink border-t-transparent" />
        ) : (
          <Icon n="arrow" s={22} stroke={2.2} />
        )}
      </motion.button>
    </div>
  )
}

/* ---------- Misc ---------- */
export function useTimer(on: boolean) {
  const [t, setT] = useState(0)
  useEffect(() => {
    if (!on) return
    const id = window.setInterval(() => setT((x) => x + 1), 1000)
    return () => clearInterval(id)
  }, [on])
  return [t, setT] as const
}
export const Dot = ({ className = "" }: { className?: string }) => (
  <span
    className={`inline-block h-[3px] w-[3px] shrink-0 rounded-full bg-current opacity-50 ${className}`}
  />
)
