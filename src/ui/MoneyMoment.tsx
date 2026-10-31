import { useEffect, useMemo, useState, type CSSProperties } from "react"
import Bolo from "./Bolo"
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

/* Lime is money that's yours. Approved earnings flood money; money sent to the bank floods ink with a money figure. */
const TONES = {
  earned: {
    bg: "grad-money-soft",
    ink: "text-ink",
    sub: "text-ink-2",
    badge: "bg-ink text-money",
    ring: "border-ink/15",
    chip: "bg-ink/6 text-ink",
    btn: "bg-ink text-white",
    fig: "text-ink",
    bits: ["#1C1713", "#F5640F", "#18A06B", "#E39A12"],
  },
  sent: {
    bg: "grad-ink",
    ink: "text-white",
    sub: "text-white/70",
    badge: "bg-money text-ink",
    ring: "border-money/30",
    chip: "bg-white/10 text-white",
    btn: "bg-money text-ink",
    fig: "text-money",
    bits: ["#18A06B", "#ffffff", "#FFB07A", "#18A06B"],
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
    }, 120)
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
      className={`reveal absolute inset-0 z-[35] flex flex-col justify-between overflow-hidden px-6 pt-20 pb-10 ${t.bg} ${t.ink} transition-[opacity,scale] duration-[260ms] ease-out ${
        leaving ? "scale-[0.98] opacity-0" : ""
      }`}
    >
      <div className="relative flex flex-1 flex-col items-center justify-center text-center">
        {/* Atmospheric emblem + soft radial rings (inspired by the Payout initiated reference) */}
        <div className="relative grid h-36 w-36 place-items-center">
          {[0, 250].map((d) => (
            <span
              key={d}
              className={`ring-out absolute inset-0 rounded-full border ${t.ring}`}
              style={{ animationDelay: `${220 + d}ms` }}
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
                      ? "#18A06B"
                      : "#18A06B"
                    : b.c,
                  width: b.coin ? undefined : b.w,
                  height: b.coin ? undefined : b.w * 0.5,
                } as CSSProperties
              }
            >
              {b.coin ? "₹" : null}
            </span>
          ))}
          <div className="pop-in relative grid h-32 w-32 place-items-center rounded-full bg-white/25 backdrop-blur-md">
            <Bolo mood="cheer" size={108} ground="none" />
          </div>
        </div>

        <div
          className={`cond rise mt-6 text-64 font-semibold tracking-[-0.03em] ${t.fig}`}
        >
          <Money
            value={counting ? amount : amount}
            roll={false}
            sign={tone === "earned"}
          />
        </div>
        <div className="rise mt-3 text-20 font-semibold">{eyebrow}</div>
        <p
          className={`rise mt-2 max-w-[28ch] text-14 leading-relaxed text-balance ${t.sub}`}
        >
          {line}
        </p>
        {detail && (
          <span
            className={`rise tnum mt-4 inline-flex h-8 items-center gap-1.5 rounded-full px-3.5 text-12 font-medium ${t.chip}`}
          >
            <Icon n="check" s={13} stroke={2.2} /> {detail}
          </span>
        )}
      </div>
      <div className="rise">
        <button
          onClick={close}
          autoFocus
          className={`h-14 w-full rounded-full text-16 font-medium transition-transform duration-150 ease-out active:scale-[0.97] ${t.btn}`}
        >
          {cta}
        </button>
      </div>
    </div>
  )
}
