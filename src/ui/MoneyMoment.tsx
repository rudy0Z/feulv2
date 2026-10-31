import { useEffect, useMemo, useState } from 'react'
import { useCountUp } from '../screens/Home'
import { Icon, inr } from './kit'

const seen = new Set<string>()

type Props = {
  /** Plays once per id, so revisiting a receipt doesn't replay the celebration. */
  id: string
  amount: number
  tone: 'earned' | 'sent'
  eyebrow: string
  line: string
  detail?: string
  cta: string
}

const TONES = {
  earned: { bg: 'bg-lime', ink: 'text-ink', sub: 'text-ink/65', badge: 'bg-ink text-lime', ring: 'border-ink/25', bits: ['#0e0f14', '#2b3bff', '#ffffff', '#ff5a1f'] },
  sent: { bg: 'bg-ultra', ink: 'text-white', sub: 'text-white/70', badge: 'bg-lime text-ink', ring: 'border-white/40', bits: ['#c6f432', '#ffffff', '#8a94ff', '#c6f432'] },
}

/* Payment-app style payoff: colour floods out from the centre, a tick draws itself,
   the amount counts up while ₹ coins and confetti burst, then the details rise in. */
export default function MoneyMoment({ id, amount, tone, eyebrow, line, detail, cta }: Props) {
  const [open, setOpen] = useState(() => !seen.has(id))
  const [leaving, setLeaving] = useState(false)
  const [counting, setCounting] = useState(false)
  const shown = useCountUp(counting ? amount : 0, 1000)
  const t = TONES[tone]

  const bits = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => {
        const a = (i / 26) * Math.PI * 2 + Math.random() * 0.4
        const d = 110 + Math.random() * 120
        return { x: Math.cos(a) * d, y: Math.sin(a) * d * 0.9 - 30, r: (Math.random() - 0.5) * 540, coin: i % 3 === 0, c: t.bits[i % t.bits.length], w: 6 + Math.random() * 6, delay: 700 + Math.random() * 160 }
      }),
    [tone],
  )

  useEffect(() => {
    if (!open) return
    seen.add(id)
    const c = setTimeout(() => {
      setCounting(true)
      navigator.vibrate?.([12, 40, 18])
    }, 700)
    return () => clearTimeout(c)
  }, [open])

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
      className={`mm-reveal absolute inset-0 z-50 flex flex-col overflow-hidden ${t.bg} ${t.ink} transition-[opacity,transform] duration-[260ms] ease-out ${leaving ? 'scale-[0.98] opacity-0' : ''}`}
    >
      <div className="relative flex flex-1 flex-col items-center justify-center px-6 text-center">
        {/* tick + rings + burst share one centre */}
        <div className="relative grid h-28 w-28 place-items-center">
          {[0, 250].map((d) => (
            <span key={d} className={`mm-ring absolute inset-0 rounded-full border-2 ${t.ring}`} style={{ animationDelay: `${620 + d}ms` }} />
          ))}
          {bits.map((b, i) => (
            <span
              key={i}
              aria-hidden
              className={`mm-burst absolute top-1/2 left-1/2 ${b.coin ? 'grid h-5 w-5 place-items-center rounded-full text-[11px] font-bold text-ink shadow-[inset_0_-2px_0_rgba(0,0,0,.18)]' : 'rounded-[2px]'}`}
              style={{ '--x': `${b.x}px`, '--y': `${b.y}px`, '--r': `${b.r}deg`, animationDelay: `${b.delay}ms`, background: b.coin ? '#ffd24a' : b.c, width: b.coin ? undefined : b.w, height: b.coin ? undefined : b.w * 0.5 } as React.CSSProperties}
            >
              {b.coin ? '₹' : null}
            </span>
          ))}
          <span className={`mm-pop relative grid h-28 w-28 place-items-center rounded-full ${t.badge} shadow-[0_20px_40px_-12px_rgba(14,15,20,.35)]`}>
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path className="mm-draw" d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          </span>
        </div>

        <div className="mm-up mt-9 text-[15px] font-semibold" style={{ animationDelay: '820ms' }}>
          {eyebrow}
        </div>
        <div className="num mm-up mt-2 text-[76px] leading-none font-semibold tracking-[-0.05em]" style={{ animationDelay: '700ms' }}>
          {tone === 'earned' ? '+' : ''}
          {inr(shown)}
        </div>
        <p className={`mm-up mt-4 max-w-[28ch] text-[16px] leading-snug text-balance ${t.sub}`} style={{ animationDelay: '1000ms' }}>
          {line}
        </p>
        {detail && (
          <span className={`mm-up num mt-5 inline-flex h-8 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium ${tone === 'earned' ? 'bg-ink/8' : 'bg-white/15'}`} style={{ animationDelay: '1120ms' }}>
            <Icon n="check" s={13} /> {detail}
          </span>
        )}
      </div>
      <div className="mm-up px-6 pb-10" style={{ animationDelay: '1350ms' }}>
        <button
          onClick={close}
          autoFocus
          className={`h-14 w-full rounded-full text-[16px] font-semibold transition-transform duration-150 ease-out active:scale-[0.96] ${tone === 'earned' ? 'bg-ink text-white' : 'bg-white text-ultra'}`}
        >
          {cta}
        </button>
      </div>
    </div>
  )
}
