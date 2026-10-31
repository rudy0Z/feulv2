import { useEffect, useMemo, useState, type CSSProperties } from "react"
import { Icon, Money, inr } from "./kit"

const seen = new Set<string>()

type Props = {
  /** Plays once per id, so revisiting a receipt doesn't replay the celebration. */
  id: string
  amount: number
  tone: "earned" | "sent"
  eyebrow: string
  line: string
  detail?: string
  cta: string
}

/* Lime is money that's yours. Approved earnings flood lime; money sent to the bank floods ink with a lime figure. */
const TONES = {
  earned: {
    bg: "bg-lime",
    ink: "text-ink",
    sub: "text-ink/65",
    badge: "bg-ink text-lime",
    ring: "border-ink/25",
    chip: "bg-ink/8",
    btn: "bg-ink text-white",
    fig: "",
    bits: ["#0e0f14", "#2b3bff", "#ffffff", "#ff5a1f"],
  },
  sent: {
    bg: "bg-ink",
    ink: "text-white",
    sub: "text-white/65",
    badge: "bg-lime text-ink",
    ring: "border-lime/40",
    chip: "bg-white/10",
    btn: "bg-lime text-ink",
    fig: "text-lime",
    bits: ["#c6f432", "#ffffff", "#9aa3ff", "#c6f432"],
  },
}

/* Payment-app style payoff: colour floods out from the centre, a tick draws itself,
   the amount rolls up while ₹ coins and confetti burst, then the details rise in. */
export default function MoneyMoment({
  id,
  amount,
  tone,
  eyebrow,
  line,
  detail,
  cta,
}: Props) {
  const [open, setOpen] = useState(() => !seen.has(id))
  const [leaving, setLeaving] = useState(false)
  const [counting, setCounting] = useState(false)
  const t = TONES[tone]

  const bits = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => {
        const a = (i / 26) * Math.PI * 2 + Math.random() * 0.4
        const d = 110 + Math.random() * 120
        return {
          x: Math.cos(a) * d,
          y: Math.sin(a) * d * 0.9 - 30,
          r: (Math.random() - 0.5) * 540,
          coin: i % 3 === 0,
          c: t.bits[i % t.bits.length],
          w: 6 + Math.random() * 6,
          delay: 700 + Math.random() * 160,
        }
      }),
    [t],
  )

  useEffect(() => {
    if (!open) return
    seen.add(id)
    const c = setTimeout(() => {
      setCounting(true)
      navigator.vibrate?.([12, 40, 18])
    }, 700)
    return () => clearTimeout(c)
  }, [open, id])

  if (!open) return null
  const close = () => {
    setLeaving(true)
    setTimeout(() => setOpen(false), 260)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${eyebrow} ${inr(amount)}`}
      className={`reveal absolute inset-0 z-[35] flex flex-col overflow-hidden ${t.bg} ${t.ink} transition-[opacity,scale] duration-[260ms] ease-out ${
        leaving ? "scale-[0.98] opacity-0" : ""
      }`}
    >
      <div className="relative flex flex-1 flex-col items-center justify-center px-6 text-center">
        {/* tick + rings + burst share one centre */}
        <div className="relative grid h-28 w-28 place-items-center">
          {[0, 250].map((d) => (
            <span
              key={d}
              className={`ring-out absolute inset-0 rounded-full border-2 ${t.ring}`}
              style={{ animationDelay: `${620 + d}ms` }}
            />
          ))}
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
                  background: b.coin
                    ? tone === "earned"
                      ? "#ffffff"
                      : "#c6f432"
                    : b.c,
                  width: b.coin ? undefined : b.w,
                  height: b.coin ? undefined : b.w * 0.5,
                } as CSSProperties
              }
            >
              {b.coin ? "₹" : null}
            </span>
          ))}
          <span
            className={`pop-in relative grid h-28 w-28 place-items-center rounded-full ${t.badge} shadow-[0_20px_40px_-12px_rgba(14,15,20,.35)]`}
            style={{ animationDelay: "320ms" }}
          >
            <svg
              width="52"
              height="52"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path className="draw" d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          </span>
        </div>

        <div
          className="rise mt-9 text-16 font-semibold"
          style={{ animationDelay: "820ms" }}
        >
          {eyebrow}
        </div>
        <div
          className={`cond rise mt-2 text-88 font-bold tracking-[-0.02em] ${t.fig}`}
          style={{ animationDelay: "700ms" }}
        >
          <Money
            value={counting ? amount : 0}
            roll={false}
            sign={tone === "earned"}
          />
        </div>
        <p
          className={`rise mt-4 max-w-[28ch] text-16 leading-snug text-balance ${t.sub}`}
          style={{ animationDelay: "1000ms" }}
        >
          {line}
        </p>
        {detail && (
          <span
            className={`rise tnum mt-5 inline-flex h-8 items-center gap-1.5 rounded-full px-3.5 text-12 font-semibold ${t.chip}`}
            style={{ animationDelay: "1120ms" }}
          >
            <Icon n="check" s={13} stroke={2.2} /> {detail}
          </span>
        )}
      </div>
      <div className="rise px-6 pb-10" style={{ animationDelay: "1350ms" }}>
        <button
          onClick={close}
          autoFocus
          className={`h-14 w-full rounded-full text-16 font-semibold transition-transform duration-150 ease-out active:scale-[0.96] ${t.btn}`}
        >
          {cta}
        </button>
      </div>
    </div>
  )
}
