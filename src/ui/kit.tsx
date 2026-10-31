import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ENVS, FORMAT_LABEL, LANGS, jobTotal, type Env, type Job } from '../state/model'
import { useStore } from '../state/store'

/* ---------- Icons (inline, 24 grid, stroke) ---------- */
const P: Record<string, ReactNode> = {
  bell: <path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15L6 16Zm4 4a2 2 0 0 0 4 0" />,
  home: <path d="M4 11 12 4l8 7v9h-5v-6H9v6H4v-9Z" />,
  jobs: <path d="M4 8h16v11H4zM9 8V5h6v3M4 13h16" />,
  wallet: <path d="M4 7h14a2 2 0 0 1 2 2v9H4zM4 7V6a2 2 0 0 1 2-2h10M16 13h1" />,
  back: <path d="M15 5 8 12l7 7" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  chev: <path d="m9 5 7 7-7 7" />,
  search: <path d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm5-2 4 4" />,
  filter: <path d="M4 6h16M7 12h10M10 18h4" />,
  bookmark: <path d="M7 4h10v16l-5-4-5 4z" />,
  play: <path d="M8 5v14l11-7z" fill="currentColor" />,
  pause: <path d="M8 5h3v14H8zM13 5h3v14h-3z" fill="currentColor" />,
  mic: <path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Zm-6-3a6 6 0 0 0 12 0M12 18v3" />,
  check: <path d="m5 12 5 5 9-10" />,
  alert: <path d="M12 8v5m0 3h.01M10.3 4.2 2.8 18a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0Z" />,
  clock: <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13v5l3 2" />,
  lock: <path d="M6 11h12v9H6zM8 11V8a4 4 0 1 1 8 0v3" />,
  shield: <path d="M12 3 5 6v6c0 4 3 7.5 7 9 4-1.5 7-5 7-9V6l-7-3Z" />,
  retry: <path d="M4 12a8 8 0 1 0 2.5-5.8M4 4v4h4" />,
  upload: <path d="M12 16V5m-5 5 5-5 5 5M5 19h14" />,
  help: <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm-2.5-11.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14m0 3h.01" />,
  battery: <path d="M3 8h15v8H3zM21 11v2M6 11h3v2H6z" />,
  users: <path d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-6 9a6 6 0 0 1 12 0M16 5a3 3 0 0 1 0 6m2 9a6 6 0 0 0-3-5.2" />,
  trash: <path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13" />,
  share: <path d="M12 4v11M7 9l5-5 5 5M5 14v6h14v-6" />,
  edit: <path d="M4 20h4L19 9l-4-4L4 16v4Z" />,
  wifi: <path d="M2 9a15 15 0 0 1 20 0M5 13a10 10 0 0 1 14 0M8.5 16.5a5 5 0 0 1 7 0M12 20h.01" />,
}
export function Icon({ n, s = 22, className = '' }: { n: keyof typeof P | string; s?: number; className?: string }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {P[n]}
    </svg>
  )
}

/* ---------- Buttons ---------- */
type BtnV = 'filled' | 'tonal' | 'outlined' | 'text' | 'audio' | 'danger' | 'inverse'
const BV: Record<BtnV, string> = {
  filled: 'bg-ink text-white hover:bg-[#262833] active:bg-black',
  audio: 'audio-grad text-white hover:brightness-105 active:brightness-95',
  tonal: 'bg-primary-soft text-on-primary-soft hover:bg-[#e2e0ff]',
  outlined: 'border border-line-strong text-ink hover:bg-surface-low',
  text: 'text-primary hover:bg-primary-soft',
  danger: 'bg-err text-white hover:brightness-110',
  inverse: 'bg-white text-ink hover:bg-white/90',
}
export function Btn({
  v = 'filled',
  children,
  onClick,
  disabled,
  loading,
  full,
  size = 'md',
  icon,
  className = '',
}: {
  v?: BtnV
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
  full?: boolean
  size?: 'sm' | 'md' | 'lg'
  icon?: string
  className?: string
}) {
  const sz = size === 'lg' ? 'h-14 px-6 text-[17px]' : size === 'sm' ? 'h-9 px-3.5 text-[14px]' : 'h-12 px-5 text-[16px]'
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-[background-color,color,box-shadow,scale,opacity] duration-150 ease-out active:not-disabled:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-hi disabled:opacity-40 ${sz} ${BV[v]} ${full ? 'w-full' : ''} ${className}`}
    >
      {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : icon ? <Icon n={icon} s={18} /> : null}
      {children}
    </button>
  )
}
export function IconBtn({ n, onClick, label, badge, dark, className = '' }: { n: string; onClick?: () => void; label: string; badge?: boolean; dark?: boolean; className?: string }) {
  return (
    <button aria-label={label} onClick={onClick} className={`relative grid h-11 w-11 place-items-center rounded-full transition-[background-color,scale] duration-150 ease-out active:scale-[0.96] ${dark ? 'text-carbon-ink hover:bg-carbon-3' : 'text-ink hover:bg-surface-high'} ${className}`}>
      <Icon n={n} />
      {badge && <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-primary-hi ring-2 ring-bg" />}
    </button>
  )
}

/* ---------- Brand ---------- */
export function Wordmark({ dark }: { dark?: boolean }) {
  return (
    <div className={`flex items-center gap-1.5 ${dark ? 'text-white' : 'text-ink'}`}>
      <svg width="22" height="18" viewBox="0 0 22 18" aria-hidden>
        {[5, 12, 18, 9, 14].map((h, i) => (
          <rect key={i} x={i * 4.5} y={(18 - h) / 2} width="2.6" height={h} rx="1.3" fill={i === 2 ? '#2B3BFF' : 'currentColor'} />
        ))}
      </svg>
      <span className="text-[20px] font-bold tracking-[-0.03em]">feul</span>
    </div>
  )
}

/* ---------- Top bar & nav ---------- */
export function TopBar() {
  const { s, a } = useStore()
  const unread = s.notices.some((n) => n.unread)
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between bg-bg px-5">
      <Wordmark />
      <div className="flex items-center gap-1">
        <IconBtn n="bell" label="Notifications" badge={unread} onClick={() => a.openSheet('notifications')} />
        <button aria-label="Profile and standing" onClick={() => a.push({ name: 'profile' })} className="ml-1 grid h-10 w-10 place-items-center rounded-full bg-ink text-[15px] font-semibold text-white ring-offset-2 hover:ring-2 hover:ring-primary-hi">
          {s.name[0]}
        </button>
      </div>
    </header>
  )
}
export function BackBar({ title, onBack, right, dark }: { title?: string; onBack?: () => void; right?: ReactNode; dark?: boolean }) {
  const { a } = useStore()
  return (
    <header className={`sticky top-0 z-20 flex h-14 items-center gap-1 px-2 ${dark ? 'bg-carbon text-carbon-ink' : 'bg-bg'}`}>
      <IconBtn n="back" label="Back" dark={dark} onClick={onBack ?? a.pop} />
      <div className="flex-1 truncate text-[16px] font-semibold">{title}</div>
      {right}
    </header>
  )
}
/* Speaky-style: three floating overlapping discs, no bar. Content runs full-bleed behind. */
export function BottomNav() {
  const { s, a } = useStore()
  const items = [
    ['home', 'Home', 'home'],
    ['jobs', 'Jobs', 'jobs'],
    ['wallet', 'Wallet', 'wallet'],
  ] as const
  const idx = Math.max(0, items.findIndex(([k]) => k === s.tab))
  return (
    <nav aria-label="Main" className="pointer-events-none absolute inset-x-0 bottom-7 z-30 flex justify-center">
      <div className="pointer-events-auto relative flex items-center gap-1 rounded-full bg-white/85 p-1.5 shadow-[0_0_0_1px_rgba(14,15,20,.06),0_2px_6px_rgba(14,15,20,.06),0_20px_44px_-16px_rgba(14,15,20,.35)] backdrop-blur-xl">
        <span
          aria-hidden
          className="absolute top-1.5 left-1.5 h-14 w-14 rounded-full bg-[radial-gradient(circle_at_35%_28%,#7d88ff,#2b3bff_72%)] shadow-[0_8px_20px_-6px_rgba(43,59,255,.65),inset_0_1px_0_rgba(255,255,255,.35)] transition-transform duration-500 ease-[cubic-bezier(.34,1.3,.5,1)] motion-reduce:transition-none"
          style={{ transform: `translateX(${idx * 60}px)` }}
        />
        {items.map(([k, l, ic]) => {
          const on = s.tab === k
          return (
            <button
              key={k}
              onClick={() => a.setTab(k)}
              aria-label={l}
              aria-current={on ? 'page' : undefined}
              className={`relative grid h-14 w-14 place-items-center rounded-full transition-[color,transform] duration-300 ease-out active:scale-90 ${on ? 'text-white' : 'text-ink-2 hover:text-ink'}`}
            >
              <span className={`transition-transform duration-500 ease-[cubic-bezier(.34,1.3,.5,1)] ${on ? 'scale-110' : 'scale-100'}`}>
                <Icon n={ic} s={22} />
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

/* ---------- Tabs ---------- */
export function Tabs<T extends string>({ items, value, onChange, dark }: { items: { k: T; l: string; n?: number }[]; value: T; onChange: (k: T) => void; dark?: boolean }) {
  return (
    <div role="tablist" className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
      {items.map((it) => {
        const on = it.k === value
        return (
          <button
            role="tab"
            aria-selected={on}
            key={it.k}
            onClick={() => onChange(it.k)}
            className={`flex h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-[14px] whitespace-nowrap transition-colors duration-150 ${on ? (dark ? 'bg-white font-semibold text-ink' : 'bg-ink font-semibold text-white') : dark ? 'bg-carbon-2 text-carbon-ink-2' : 'bg-surface font-medium text-ink-2 hover:text-ink'}`}
          >
            {it.l}
            {it.n != null && it.n > 0 && <span className={`num text-[12px] ${on ? 'opacity-60' : 'text-ink-3'}`}>{it.n}</span>}
          </button>
        )
      })}
    </div>
  )
}

/* ---------- Waveform ---------- */
const rnd = (seed: number) => {
  let x = seed * 9301 + 49297
  return () => {
    x = (x * 9301 + 49297) % 233280
    return x / 233280
  }
}
export function Waveform({
  seed = 1,
  bars = 48,
  h = 40,
  progress = 1,
  tone = 'audio',
  live,
  level = 0.6,
  className = '',
}: {
  seed?: number
  bars?: number
  h?: number
  progress?: number
  tone?: 'audio' | 'ink' | 'muted' | 'light' | 'err' | 'ok'
  live?: boolean
  level?: number
  className?: string
}) {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    if (!live) return
    const t = setInterval(() => setTick((x) => x + 1), 90)
    return () => clearInterval(t)
  }, [live])
  const r = rnd(seed + (live ? tick : 0))
  const vals = Array.from({ length: bars }, (_, i) => {
    const env = Math.sin((i / bars) * Math.PI) * 0.55 + 0.45
    return live ? Math.max(0.06, r() * level * (0.6 + env * 0.6)) : Math.max(0.08, (r() * 0.75 + 0.25) * env)
  })
  const on = { audio: 'url(#fg)', ink: '#0e0f14', muted: '#8a8fa1', light: '#ffffff', err: '#c2282f', ok: '#127a4b' }[tone]
  const off = tone === 'light' ? 'rgba(255,255,255,.22)' : '#d6d9e2'
  const w = 100 / bars
  const gid = `g${seed}`
  return (
    <svg viewBox={`0 0 100 ${h}`} preserveAspectRatio="none" className={`block w-full ${className}`} style={{ height: h }} aria-hidden>
      <defs>
        <linearGradient id="fg" x1="0" x2="1">
          <stop offset="0" stopColor="#2B3BFF" />
          <stop offset="1" stopColor="#6F7CFF" />
        </linearGradient>
      </defs>
      <g key={gid}>
        {vals.map((v, i) => {
          const bh = Math.max(2, v * h)
          return <rect key={i} x={i * w + w * 0.2} y={(h - bh) / 2} width={w * 0.6} height={bh} rx={Math.min(w * 0.3, 1.2)} fill={i / bars < progress ? on : off} />
        })}
      </g>
    </svg>
  )
}

/* Scrub player: simulated playback over a waveform. */
export function Player({ seed, secs = 12, label, dark }: { seed: number; secs?: number; label?: string; dark?: boolean }) {
  const [p, setP] = useState(0)
  const [on, setOn] = useState(false)
  useEffect(() => {
    if (!on) return
    const t = setInterval(() => setP((x) => (x >= 1 ? (setOn(false), 0) : x + 0.1 / secs)), 100)
    return () => clearInterval(t)
  }, [on, secs])
  const cur = Math.round(p * secs)
  return (
    <div className="flex items-center gap-3">
      <button aria-label={on ? 'Pause' : `Play ${label ?? 'audio'}`} onClick={() => setOn(!on)} className={`grid h-10 w-10 shrink-0 place-items-center rounded-full transition-[background-color,color,box-shadow,scale] duration-150 ease-out active:scale-[0.96] ${dark ? 'bg-white text-ink' : on ? 'bg-ultra text-white' : 'bg-surface text-ink shadow-[inset_0_0_0_1.5px_var(--color-line-strong)]'}`}>
        <Icon n={on ? 'pause' : 'play'} s={16} className={on ? '' : 'translate-x-px'} />
      </button>
      <div className="min-w-0 flex-1">
        <Waveform seed={seed} bars={42} h={28} progress={on || p > 0 ? p : 0} tone={dark ? 'light' : 'audio'} />
      </div>
      <span className={`num w-10 text-right text-[13px] font-medium ${dark ? 'text-carbon-ink-2' : 'text-ink-2'}`}>
        0:{String(on || p > 0 ? cur : secs).padStart(2, '0')}
      </span>
    </div>
  )
}

/* ---------- Status vocabulary (Doc 09 §19) ---------- */
type Tone = 'neutral' | 'info' | 'warn' | 'ok' | 'err' | 'brand'
const TONE: Record<Tone, string> = {
  neutral: 'bg-surface-high text-ink-2',
  info: 'bg-info-soft text-info',
  warn: 'bg-signal-soft text-[#c2410c]',
  ok: 'bg-ok-soft text-ok',
  err: 'bg-err-soft text-err',
  brand: 'bg-primary-soft text-on-primary-soft',
}
export const STATUS: Record<string, [string, Tone]> = {
  ready: ['Ready to record', 'neutral'],
  recording: ['Recording', 'brand'],
  recorded_local: ['Recorded on device', 'neutral'],
  uploading: ['Uploading', 'info'],
  upload_failed: ['Upload failed', 'err'],
  submitted: ['Submitted', 'info'],
  under_review: ['Under review', 'warn'],
  accepted: ['Accepted', 'ok'],
  repair_required: ['Repair required', 'err'],
  repaired: ['Replaced · re-checking', 'warn'],
  approved: ['Approved', 'ok'],
  appeal: ['Under appeal', 'warn'],
  pending: ['Under review', 'warn'],
  settled: ['Settled', 'ok'],
  failed: ['Failed', 'err'],
  processing: ['Payment processing', 'info'],
  honoured: ['Honoured · campaign closed', 'neutral'],
  deleted_after_revocation: ['Data deleted · paid', 'neutral'],
  requested: ['Requested', 'info'],
  delayed: ['Delayed', 'warn'],
  paid: ['Paid', 'ok'],
  hold: ['On hold', 'warn'],
}
export function Status({ k, label }: { k: string; label?: string }) {
  const [l, t] = STATUS[k] ?? [k, 'neutral']
  return (
    <span className={`inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-semibold whitespace-nowrap ${TONE[t]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label ?? l}
    </span>
  )
}

/* ---------- Money + job metadata ---------- */
export const inr = (n: number) => `₹${Math.abs(n).toLocaleString('en-IN')}`
export function Coverage({ x }: { x: number }) {
  const hot = x >= 1.5
  return (
    <span className={`num inline-flex h-6 items-center rounded-full px-2.5 whitespace-nowrap text-[12px] font-medium ${hot ? 'bg-primary-soft text-on-primary-soft' : 'bg-surface-high text-ink-2'}`} title="Coverage multiplier">
      {x.toFixed(1)}× coverage
    </span>
  )
}
export function Meta({ job }: { job: Job }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-ink-2">
      <span className="font-medium text-ink">{LANGS[job.lang].native}</span>
      <Dot />
      <span>{FORMAT_LABEL[job.format]}</span>
      <Dot />
      <span className="num">~{job.minutes} min</span>
      {job.format !== 'ROOM' && (
        <>
          <Dot />
          <span className="num">
            {job.turns} {job.format === 'LINES' ? 'lines' : 'turns'}
          </span>
        </>
      )}
      {job.format === 'ROOM' && (
        <>
          <Dot />
          <span>{job.participants} people</span>
        </>
      )}
    </div>
  )
}
const Dot = () => <span className="h-[3px] w-[3px] rounded-full bg-ink-3" />

export const ENV_TINT: Record<Env, { bg: string; ink: string }> = {
  market: { bg: 'bg-peach', ink: 'text-[#a33a0c]' },
  food: { bg: 'bg-butter', ink: 'text-[#7a5a00]' },
  travel: { bg: 'bg-sky', ink: 'text-on-primary-soft' },
  health: { bg: 'bg-mint', ink: 'text-ok' },
  money: { bg: 'bg-lilac', ink: 'text-[#4b2fb0]' },
  home: { bg: 'bg-[#ffe8ef]', ink: 'text-[#a3204f]' },
}

/* Line icons for scenes, drawn on a 32 grid */
export function SceneIcon({ env, s = 32, className = '' }: { env: Env; s?: number; className?: string }) {
  const d: Record<Env, ReactNode> = {
    market: <><path d="M5 12h22l-2 14H7z" /><path d="M11 12a5 5 0 0 1 10 0" /><path d="M12 18v3M20 18v3" /></>,
    food: <><path d="M6 13h17v5a8 8 0 0 1-8 8h-1a8 8 0 0 1-8-8z" /><path d="M23 15h2a3 3 0 0 1 0 6h-3" /><path d="M11 5c-1 2 1 3 0 5M16 5c-1 2 1 3 0 5" /></>,
    travel: <><rect x="6" y="6" width="20" height="17" rx="4" /><path d="M6 15h20M11 27l2-4M21 27l-2-4" /><circle cx="11" cy="19" r="1" /><circle cx="21" cy="19" r="1" /></>,
    health: <><rect x="5" y="5" width="22" height="22" rx="7" /><path d="M16 10v12M10 16h12" /></>,
    money: <><rect x="4" y="9" width="24" height="15" rx="3" /><circle cx="16" cy="16.5" r="3.5" /><path d="M8 13v7M24 13v7" /></>,
    home: <><path d="M5 15 16 6l11 9" /><path d="M8 13v13h16V13" /><path d="M13 26v-7h6v7" /></>,
  }
  return (
    <svg width={s} height={s} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {d[env]}
    </svg>
  )
}

/* Compact, scannable: what it is · what it involves · meta · action */
export function JobRow({ job, locked }: { job: Job; locked?: boolean }) {
  const { s, a } = useStore()
  const saved = s.saved.includes(job.id)
  const off = job.campaign !== 'open' || locked
  const status = locked ? `Unlocks at standing ${job.tier}` : job.campaign === 'full' ? 'Coverage full' : job.campaign === 'oversubscribed' ? 'Oversubscribed · waitlist' : job.campaign === 'closed' ? 'Closed to new work' : null
  return (
    <div className={`relative flex gap-3.5 rounded-[24px] bg-surface p-3 transition-shadow hover:shadow-[0_8px_24px_-12px_rgba(14,15,20,.18)] ${off ? 'opacity-70' : ''}`}>
      <div className={`relative w-[92px] shrink-0 self-stretch overflow-hidden rounded-[16px] ${ENV_TINT[job.env].bg}`}>
        <SceneIcon env={job.env} s={30} className={`absolute inset-0 m-auto ${ENV_TINT[job.env].ink}`} />
        {job.image && <img src={job.image} alt="" loading="lazy" className={`absolute inset-0 h-full w-full object-cover outline outline-1 -outline-offset-1 outline-black/10 ${off ? 'grayscale' : ''}`} onError={(e) => (e.currentTarget.style.display = 'none')} />}
        {!off && job.coverage >= 1.5 && <span className="num absolute bottom-1.5 left-1.5 rounded-full bg-ink/80 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur">{job.coverage.toFixed(1)}×</span>}
      </div>
      <div className="min-w-0 flex-1 py-1 pr-1">
      <button onClick={() => a.push({ name: 'detail', jobId: job.id })} className="block w-full pr-1 text-left after:absolute after:inset-0 after:rounded-[24px]" aria-label={`${job.title}, ${inr(jobTotal(job))}`}>
        <div className="flex items-center gap-2 text-[12px]">
          <span className={`inline-flex h-6 items-center gap-1 rounded-full pr-2.5 pl-1.5 font-semibold ${ENV_TINT[job.env].bg} ${ENV_TINT[job.env].ink}`}>
            <SceneIcon env={job.env} s={15} />
            {ENVS[job.env].short}
          </span>
          <span className="num text-ink-2">{job.minutes} min</span>
          <span className={`num ml-auto text-[18px] leading-none font-semibold tracking-[-0.01em] ${off ? 'text-ink-3' : 'text-ink'}`}>{inr(jobTotal(job))}</span>
        </div>
        <div className="mt-2.5 text-[16px] leading-snug font-semibold tracking-[-0.01em]">{job.title}</div>
        <div className="mt-0.5 line-clamp-1 text-[13px] text-ink-2">{FORMAT_LABEL[job.format]} · {job.situation}</div>
      </button>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[12px] font-medium text-ink-2">
          {status ? (
            <>
              {locked && <Icon n="lock" s={13} />}
              {status}
            </>
          ) : job.coverage >= 1.5 ? (
            <span className="num text-primary">{job.coverage.toFixed(1)}× · labs need this</span>
          ) : (
            <span className="num">{job.coverage.toFixed(1)}× coverage</span>
          )}
        </span>
        <button aria-label={saved ? 'Remove from saved' : 'Save job'} onClick={() => a.toggleSave(job.id)} className={`relative z-10 -m-2 grid h-10 w-10 place-items-center rounded-full hover:bg-surface-high ${saved ? 'text-primary' : 'text-ink-3'}`}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
            <path d="M7 4h10v16l-5-4-5 4z" />
          </svg>
        </button>
      </div>
      </div>
    </div>
  )
}

/* Thick labelled progress: value lives inside the fill, remainder sits in the track. */
export function PillProgress({ value, max, label, right, tone = 'ultra', className = '' }: { value: number; max: number; label: string; right?: string; tone?: 'ultra' | 'lime'; className?: string }) {
  const pct = Math.max(value > 0 ? 22 : 0, Math.min(100, (value / max) * 100))
  const fill = tone === 'lime' ? 'bg-[linear-gradient(90deg,#d8ff5c,#b4e61e)] text-ink' : 'bg-[linear-gradient(90deg,#6b78ff,#2b3bff)] text-white'
  const track = tone === 'lime' ? 'bg-white/15 text-white/75' : 'bg-surface-high text-ink-2'
  return (
    <div role="progressbar" aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} aria-label={label} className={`relative flex h-8 items-center overflow-hidden rounded-full ${track} ${className}`}>
      {pct > 0 && (
        <div className={`anim-grow relative flex h-full items-center overflow-hidden rounded-full px-3 shadow-[inset_0_1px_0_rgba(255,255,255,.35)] ${fill}`} style={{ width: `${pct}%` }}>
          <span className="num relative z-10 text-[13px] font-semibold whitespace-nowrap">{label}</span>
          <span className="anim-sheen absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        </div>
      )}
      {pct === 0 && <span className="num px-3 text-[13px] font-semibold">{label}</span>}
      {right && <span className="num ml-auto pr-3 pl-2 text-[13px] whitespace-nowrap">{right}</span>}
    </div>
  )
}

export function Section({ title, action, children, className = '' }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`px-5 ${className}`}>
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-[20px] font-semibold tracking-[-0.01em]">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}
export const Card = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`rounded-lg bg-surface shadow-[0_0_0_1px_rgba(14,15,20,.05),0_1px_2px_-1px_rgba(14,15,20,.06),0_4px_12px_rgba(14,15,20,.04)] ${/\bp-\d/.test(className) ? '' : 'p-5'} ${className}`}>{children}</div>
)
export const Label = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`text-[13px] font-medium text-ink-2  ${className}`}>{children}</div>
)

export function Banner({ tone, title, children, action }: { tone: 'warn' | 'err' | 'info' | 'ok' | 'neutral'; title: string; children?: ReactNode; action?: ReactNode }) {
  const c = { warn: 'bg-signal-soft text-[#c2410c]', err: 'bg-err-soft text-err', info: 'bg-info-soft text-info', ok: 'bg-ok-soft text-ok', neutral: 'bg-surface-high text-ink-2' }[tone]
  const ic = { warn: 'clock', err: 'alert', info: 'shield', ok: 'check', neutral: 'shield' }[tone]
  return (
    <div className={`flex gap-3 rounded-md p-4 ${c}`}>
      <Icon n={ic} s={20} className="mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="text-[15px] font-semibold text-ink">{title}</div>
        {children && <div className="mt-0.5 text-[14px] leading-snug text-ink-2">{children}</div>}
        {action && <div className="mt-3">{action}</div>}
      </div>
    </div>
  )
}

/* ---------- Sheet & dialog ---------- */
export function SheetFrame({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end">
      <button aria-label="Close" onClick={onClose} className="anim-fade absolute inset-0 bg-ink/40" />
      <div role="dialog" aria-label={title} className="anim-rise relative max-h-[86%] overflow-y-auto rounded-t-[24px] bg-surface px-5 pt-3 pb-8">
        <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-line-strong" />
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[20px] font-semibold tracking-[-0.01em]">{title}</h3>
          <IconBtn n="close" label="Close" onClick={onClose} />
        </div>
        {children}
      </div>
    </div>
  )
}
export function Dialog({ title, children, actions }: { title: string; children: ReactNode; actions: ReactNode }) {
  return (
    <div className="anim-fade absolute inset-0 z-50 grid place-items-center bg-ink/50 px-6">
      <div role="alertdialog" aria-label={title} className="w-full rounded-lg bg-surface p-6">
        <h3 className="text-[20px] leading-tight font-semibold">{title}</h3>
        <div className="mt-2 text-[15px] leading-relaxed text-ink-2">{children}</div>
        <div className="mt-6 flex flex-col gap-2">{actions}</div>
      </div>
    </div>
  )
}

/* ---------- Misc ---------- */
export function useTimer(on: boolean) {
  const [t, setT] = useState(0)
  const r = useRef<number>(0)
  useEffect(() => {
    if (!on) return
    r.current = window.setInterval(() => setT((x) => x + 1), 1000)
    return () => clearInterval(r.current)
  }, [on])
  return [t, setT] as const
}
export const mmss = (t: number) => `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`

export function Progress({ value, className = '', audio }: { value: number; className?: string; audio?: boolean }) {
  return (
    <div className={`h-1.5 overflow-hidden rounded-full ${/\bbg-/.test(className) ? '' : 'bg-surface-variant'} ${className}`}>
      <div className={`h-full rounded-full transition-[width] duration-500 ${audio ? 'audio-grad' : 'bg-ink'}`} style={{ width: `${Math.min(100, value * 100)}%` }} />
    </div>
  )
}
