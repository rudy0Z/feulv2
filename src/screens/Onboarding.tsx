import { useEffect, useRef, useState, type ReactNode } from 'react'
import { CONSENT_COPY, LANGS, type Lang } from '../state/model'
import { useStore } from '../state/store'
import { BackBar, Btn, Icon } from '../ui/kit'

/* ---------- Signal primitives ---------- */

type Tone = 'ultra' | 'signal' | 'lime' | 'none'
const PLATE: Record<Exclude<Tone, 'none'>, string> = {
  ultra: 'bg-ultra text-white',
  signal: 'bg-signal text-white',
  lime: 'bg-lime text-ink',
}

/** Status bar floats over onboarding; each plate tells it which ink to use. */
function useStatusInk(tone: Tone) {
  useEffect(() => {
    const ink = tone === 'ultra' || tone === 'signal' ? '#fff' : ''
    document.documentElement.style.setProperty('--sb-ink', ink || 'var(--color-ink)')
    return () => {
      document.documentElement.style.removeProperty('--sb-ink')
    }
  }, [tone])
}

function Plate({ tone, className = '', children }: { tone: Exclude<Tone, 'none'>; className?: string; children: ReactNode }) {
  useStatusInk(tone)
  return <div className={`relative shrink-0 overflow-hidden rounded-b-[40px] pt-[54px] transition-colors duration-500 ${PLATE[tone]} ${className}`}>{children}</div>
}

/** Plain white screen (no plate) — still reserves the status-bar space. */
function Blank({ children }: { children: ReactNode }) {
  useStatusInk('none')
  return <div className="flex flex-1 flex-col pt-[54px]">{children}</div>
}

function Steps({ n, onBack }: { n: 1 | 2; onBack?: () => void }) {
  return (
    <div className="flex h-14 items-center gap-4 px-4">
      {onBack ? (
        <button aria-label="Back" onClick={onBack} className="grid h-11 w-11 place-items-center rounded-full bg-surface shadow-[0_0_0_1px_rgba(0,0,0,.06)] transition-[scale] active:scale-[0.94]">
          <Icon n="back" s={20} />
        </button>
      ) : (
        <span className="w-11" />
      )}
      <div className="flex flex-1 gap-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={2} aria-valuenow={n} aria-label={`Step ${n} of 2`}>
        {[1, 2].map((i) => (
          <span key={i} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i <= n ? 'bg-ink' : 'bg-line-strong/60'}`} />
        ))}
      </div>
      <span className="num w-11 text-right text-[13px] font-medium text-ink-3">{n}/2</span>
    </div>
  )
}

function Bars({ n = 28, className = '', live }: { n?: number; className?: string; live?: boolean }) {
  const h = (i: number) => 0.18 + Math.abs(Math.sin(i * 0.9) * Math.cos(i * 0.31)) * 0.82
  return (
    <div aria-hidden className={`flex h-full items-center gap-[5px] ${className}`}>
      {Array.from({ length: n }, (_, i) => (
        <span key={i} className={`w-full rounded-full bg-current ${live ? 'anim-bar' : ''}`} style={{ height: `${h(i) * 100}%`, animationDelay: `${(i % 7) * -0.16}s` }} />
      ))}
    </div>
  )
}

/* ---------- Intro carousel + sign-in ---------- */

/** Swap `art` for an illustration path when it's ready; the coded hero is the fallback. */
const SLIDES: { tone: Exclude<Tone, 'none'>; tag: string; title: ReactNode; body: string; art?: string }[] = [
  {
    tone: 'ultra',
    tag: 'Speak',
    title: (
      <>
        Your voice <span className="text-ultra">is the job.</span>
      </>
    ),
    body: 'Talk the way you talk at home — in हिन्दी, தமிழ், বাংলা and more. 5-minute tasks, whenever you are free.',
  },
  {
    tone: 'signal',
    tag: 'Review',
    title: (
      <>
        No silent rejections. <span className="text-signal">Ever.</span>
      </>
    ),
    body: 'A real reviewer hears every clip. If one line needs a redo, you see which one and why — the rest stays paid.',
  },
  {
    tone: 'lime',
    tag: 'Get paid',
    title: (
      <>
        Six minutes of talking. <span className="rounded-[10px] bg-lime px-1.5 box-decoration-clone">₹42 in your UPI.</span>
      </>
    ),
    body: 'The price is locked before you press record. Cash out from ₹100, every rupee tracked by UTR.',
  },
]

function HeroSpeak() {
  return (
    <div className="relative h-full px-6">
      <div className="absolute inset-x-6 top-6 h-[150px] text-white/90">
        <Bars n={30} live />
      </div>
      <div className="absolute top-[176px] right-6 left-10 -rotate-[3deg] rounded-[24px] bg-white p-4 text-ink shadow-[0_24px_48px_-16px_rgba(10,14,90,.55)]">
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-semibold tracking-wide text-ink-3 uppercase">Line 3 of 6</span>
          <span className="flex items-center gap-1.5 rounded-full bg-signal-soft px-2 py-0.5 text-[12px] font-semibold text-signal">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-signal" /> <span className="num">0:14</span>
          </span>
        </div>
        <p className="mt-2 text-[24px] leading-[1.15] font-semibold tracking-[-0.01em]">दो किलो टमाटर कितने के हैं?</p>
      </div>
      <span className="absolute top-[150px] left-6 rotate-[6deg] rounded-full bg-lime px-3 py-1 text-[14px] font-semibold text-ink shadow-lg">हिन्दी</span>
    </div>
  )
}

function HeroReview() {
  const clip = (t: string, ok: boolean, r: string, k: number) => (
    <div className={`flex items-center gap-3 rounded-[18px] bg-white p-3 text-ink shadow-[0_18px_36px_-18px_rgba(120,30,0,.6)] ${r}`}>
      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${ok ? 'bg-ink text-white' : 'bg-signal-soft text-signal'}`}>
        <Icon n={ok ? 'check' : 'retry'} s={17} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] font-semibold">{t}</div>
        <div className={`mt-1 h-3 ${ok ? 'text-ink/25' : 'text-signal/60'}`}>
          <Bars n={22 + k} />
        </div>
      </div>
    </div>
  )
  return (
    <div className="relative flex h-full flex-col justify-center gap-2.5 px-8">
      {clip('Line 1 · accepted', true, 'rotate-[1.5deg]', 0)}
      {clip('Line 2 · accepted', true, '-rotate-[1deg] ml-4', 2)}
      {clip('Line 3 · background noise', false, 'rotate-[2deg] -mr-2', 4)}
      <span className="absolute top-6 right-7 rotate-[4deg] rounded-full bg-ink px-3.5 py-1.5 text-[14px] font-semibold text-white shadow-lg">
        <span className="num">9/10</span> accepted
      </span>
    </div>
  )
}

function HeroPaid() {
  return (
    <div className="relative flex h-full items-center justify-center px-10">
      <div className="relative w-full rotate-[2.5deg] rounded-[24px] bg-white p-5 shadow-[0_28px_48px_-20px_rgba(40,60,0,.55)]">
        <div className="text-[13px] font-medium text-ink-3">Paid to priya.sharma@okaxis</div>
        <div className="num mt-1 text-[64px] leading-none font-bold tracking-[-0.04em]">₹42</div>
        <div className="my-4 border-t-2 border-dashed border-line" />
        <div className="flex justify-between text-[13px]">
          <span className="text-ink-3">UTR</span>
          <span className="num font-mono font-medium">412893018842</span>
        </div>
        <span className="absolute -top-5 -right-3 grid h-[76px] w-[76px] -rotate-[14deg] place-items-center rounded-full bg-ink text-[13px] font-bold tracking-[0.12em] text-lime uppercase">Paid</span>
      </div>
    </div>
  )
}

export function Landing() {
  const { a } = useStore()
  const [i, setI] = useState(0)
  const sl = SLIDES[i]
  const last = i === SLIDES.length - 1
  return (
    <div className="flex flex-1 flex-col">
      <Plate tone={sl.tone} className={`transition-[height] duration-300 ${last ? 'h-[356px]' : 'h-[440px]'}`}>
        <div className="flex h-12 items-center justify-between px-6">
          <span className="flex items-center gap-2 text-[20px] font-bold tracking-[-0.03em]">
            <span className="h-4 w-[18px] text-current">
              <Bars n={4} />
            </span>
            feul
          </span>
          {!last && (
            <button onClick={() => setI(SLIDES.length - 1)} className="-mr-3 h-11 rounded-full px-3 text-[15px] font-semibold opacity-85 hover:opacity-100">
              Skip
            </button>
          )}
        </div>
        <div key={i} className={`anim-rise ${last ? 'h-[250px]' : 'h-[334px]'}`}>
          {sl.art ? <img src={sl.art} alt="" className="h-full w-full object-contain" /> : i === 0 ? <HeroSpeak /> : i === 1 ? <HeroReview /> : <HeroPaid />}
        </div>
      </Plate>

      <div className="flex flex-1 flex-col px-6 pt-6">
        <div key={i} className="anim-rise">
          <span className="num text-[13px] font-semibold tracking-wide text-ink-3 uppercase">
            0{i + 1} · {sl.tag}
          </span>
          <h1 className="mt-2 text-[36px] leading-[1] font-bold tracking-[-0.04em] text-balance">{sl.title}</h1>
          <p className="mt-3 text-[16px] leading-[1.45] text-pretty text-ink-2">{sl.body}</p>
        </div>

        <div className="mt-auto pt-5">
          <div className="mb-3 flex justify-center gap-1.5">
            {SLIDES.map((_, k) => (
              <button key={k} aria-label={`Slide ${k + 1}`} onClick={() => setI(k)} className="grid h-6 place-items-center">
                <span className={`block h-1.5 rounded-full transition-[width,background-color] duration-300 ${k === i ? 'w-6 bg-ink' : 'w-1.5 bg-line-strong'}`} />
              </button>
            ))}
          </div>
          {last ? (
            <div className="flex flex-col gap-2.5">
              <p className="mb-1 flex items-center justify-center gap-2 text-[13px] leading-snug text-ink-2">
                <span className="rounded-full bg-ink px-2 py-0.5 text-[11px] font-bold tracking-wide text-lime">18+</span>
                Adults only. Your number is never shown to anyone.
              </p>
              <Btn full size="lg" icon="lock" onClick={() => a.stage('auth')}>
                Continue with mobile number
              </Btn>
              <Btn full size="lg" v="outlined" onClick={() => a.stage('auth')}>
                <span className="text-[17px] font-bold text-[#4285F4]">G</span> Continue with Google
              </Btn>
              <p className="text-center text-[12px] text-ink-3">
                Continuing means you accept our <span className="font-semibold text-ink-2 underline underline-offset-2">Terms</span> and <span className="font-semibold text-ink-2 underline underline-offset-2">Privacy Policy</span>.
              </p>
            </div>
          ) : (
            <Btn full size="lg" onClick={() => setI(i + 1)}>
              Next
            </Btn>
          )}
        </div>
      </div>
    </div>
  )
}

/* ---------- Auth (centred, GamMa-calm) ---------- */

function AuthHead({ icon, title, children }: { icon: string; title: string; children: ReactNode }) {
  return (
    <div className="anim-rise flex flex-col items-center text-center">
      <span className="grid h-16 w-16 rotate-[-6deg] place-items-center rounded-[24px] bg-ultra text-white shadow-[0_14px_28px_-12px_rgba(43,59,255,.7)]">
        <Icon n={icon} s={28} />
      </span>
      <h1 className="mt-7 text-[28px] leading-[1.05] font-bold tracking-[-0.03em] text-balance">{title}</h1>
      <p className="mt-2 max-w-[30ch] text-[15px] leading-snug text-pretty text-ink-2">{children}</p>
    </div>
  )
}

export function Auth() {
  const { a } = useStore()
  const [phone, setPhone] = useState('98204 55121')
  const ok = phone.replace(/\D/g, '').length === 10
  return (
    <Blank>
      <BackBar onBack={() => a.stage('landing')} />
      <div className="flex flex-1 flex-col px-6 pt-10 pb-8">
        <AuthHead icon="lock" title="Enter your mobile number">
          We'll text a 6-digit code. Payouts go to a UPI in your name.
        </AuthHead>
        <label className="mt-9 flex h-[60px] items-center gap-3 rounded-full bg-surface pr-5 pl-2 shadow-[0_0_0_1px_rgba(0,0,0,.08)] transition-shadow focus-within:shadow-[0_0_0_2px_var(--color-ultra)]">
          <span className="num flex h-11 items-center rounded-full bg-surface-high px-3.5 text-[16px] font-semibold">🇮🇳 +91</span>
          <input
            inputMode="numeric"
            autoComplete="tel-national"
            name="phone"
            aria-label="Mobile number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="num min-w-0 flex-1 bg-transparent text-[20px] font-semibold tracking-[0.02em] outline-none"
          />
          {ok && <Icon n="check" s={20} className="text-ultra" />}
        </label>
        {!ok && phone && <p className="mt-2 pl-5 text-[14px] text-err">Enter a 10-digit mobile number.</p>}
        <Btn full size="lg" className="mt-4" disabled={!ok} onClick={() => a.stage('otp')}>
          Send code
        </Btn>
        <button onClick={() => a.stage('landing')} className="mx-auto mt-3 h-11 px-3 text-[15px] font-semibold">
          Use a different method
        </button>
      </div>
    </Blank>
  )
}

export function Otp() {
  const { a } = useStore()
  const [d, setD] = useState<string[]>(Array(6).fill(''))
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
  const code = d.join('')
  const verify = () => {
    setBusy(true)
    setTimeout(() => {
      setBusy(false)
      if (code === '123456') return a.stage('language')
      const n = tries + 1
      setTries(n)
      setShake((x) => x + 1)
      setD(Array(6).fill(''))
      refs.current[0]?.focus()
      if (n >= 3) {
        setLock(60)
        setErr('Too many wrong codes. For your safety, try again in 60 seconds.')
      } else setErr(`That code doesn't match the one we sent. ${3 - n} ${3 - n === 1 ? 'try' : 'tries'} left.`)
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
      autoComplete={i === 0 ? 'one-time-code' : 'off'}
      maxLength={1}
      disabled={lock > 0}
      value={d[i]}
      onChange={(e) => {
        const c = e.target.value.replace(/\D/g, '').slice(-1)
        const n = [...d]
        n[i] = c
        setD(n)
        setErr(null)
        if (c && i < 5) refs.current[i + 1]?.focus()
      }}
      onPaste={(e) => {
        const p = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
        if (p.length === 6) {
          e.preventDefault()
          setD(p.split(''))
          refs.current[5]?.focus()
        }
      }}
      onKeyDown={(e) => e.key === 'Backspace' && !d[i] && i > 0 && refs.current[i - 1]?.focus()}
      className={`num h-[60px] w-full min-w-0 bg-transparent text-center text-[24px] font-bold outline-none placeholder:text-ink-3/40 focus:bg-primary-soft disabled:opacity-40 ${i % 3 ? 'border-l border-line' : ''}`}
      placeholder="0"
    />
  )
  return (
    <Blank>
      <BackBar onBack={() => a.stage('auth')} />
      <div className="flex flex-1 flex-col px-6 pt-10 pb-8">
        <AuthHead icon="shield" title="Enter your code">
          Sent to <span className="num font-semibold text-ink">+91 98204 55121</span>
          <span className="block text-[13px] text-ink-3">Prototype code: 123456</span>
        </AuthHead>
        <div key={shake} className={`mt-9 flex items-center gap-3 ${shake ? 'anim-shake' : ''}`}>
          {[0, 3].map((o) => (
            <div key={o} className={`flex flex-1 overflow-hidden rounded-[18px] bg-surface shadow-[0_0_0_1px_rgba(0,0,0,.08)] ${err ? 'shadow-[0_0_0_2px_var(--color-err)]' : ''}`}>
              {[o, o + 1, o + 2].map(box)}
            </div>
          ))}
        </div>
        {err && (
          <p role="alert" className="mt-3 text-center text-[14px] text-err">
            {err} {lock > 0 && <span className="num">({lock}s)</span>}
          </p>
        )}
        <Btn full size="lg" className="mt-4" disabled={code.length < 6 || lock > 0} loading={busy} onClick={verify}>
          Verify
        </Btn>
        <button disabled={wait > 0 || lock > 0} onClick={() => setWait(45)} className="mt-2.5 h-12 w-full rounded-full text-[15px] font-medium shadow-[0_0_0_1px_rgba(0,0,0,.08)] disabled:text-ink-3">
          {wait > 0 ? <span className="num">Resend code in 00:{String(wait).padStart(2, '0')}</span> : 'Resend code'}
        </button>
        <button onClick={() => a.stage('auth')} className="mx-auto mt-3 h-11 px-3 text-[15px] font-semibold">
          Change number
        </button>
      </div>
    </Blank>
  )
}

/* ---------- Language ---------- */

export function Language() {
  const { s, a } = useStore()
  const keys = Object.keys(LANGS) as Lang[]
  const picked = s.langs ?? [s.lang]
  return (
    <Blank>
      <Steps n={1} onBack={() => a.stage('otp')} />
      <div className="px-6 pt-4">
        <h1 className="text-[28px] leading-[1.05] font-bold tracking-[-0.03em] text-balance">Which languages can you record in?</h1>
        <p className="mt-2 text-[15px] leading-snug text-pretty text-ink-2">Pick every language you speak comfortably — more languages, more jobs. The app itself stays in English.</p>
      </div>
      <div role="group" aria-label="Recording languages" className="mt-6 grid grid-cols-2 gap-2.5 px-6">
        {keys.map((k, i) => {
          const on = picked.includes(k)
          const wide = i === keys.length - 1
          return (
            <button
              key={k}
              role="checkbox"
              aria-checked={on}
              onClick={() => a.toggleLang(k)}
              className={`relative flex overflow-hidden rounded-[24px] p-4 text-left transition-[background-color,color,scale,box-shadow] duration-200 active:scale-[0.97] ${wide ? 'col-span-2 h-[64px] flex-row-reverse items-center justify-end gap-3' : 'h-[112px] flex-col justify-between'} ${on ? 'bg-ultra text-white shadow-[0_16px_30px_-14px_rgba(43,59,255,.8)]' : 'bg-surface shadow-[0_0_0_1px_rgba(0,0,0,.06)]'}`}
            >
              <span className={`text-[13px] font-medium ${on ? 'text-white/70' : 'text-ink-3'}`}>{LANGS[k].name}</span>
              <span className="text-[28px] leading-none font-bold tracking-[-0.01em]">{LANGS[k].native}</span>
              <span className={`absolute right-3.5 grid h-6 w-6 place-items-center rounded-full transition ${wide ? 'top-1/2 -translate-y-1/2' : 'top-3.5'} ${on ? 'bg-lime text-ink' : 'shadow-[inset_0_0_0_1.5px_var(--color-line-strong)]'}`}>{on && <Icon n="check" s={14} />}</span>
            </button>
          )
        })}
      </div>
      <p className="mt-4 px-6 text-center text-[13px] text-ink-3">You can add or remove languages later in your profile.</p>
      <div className="sticky bottom-0 mt-auto bg-gradient-to-t from-bg via-bg to-bg/0 px-6 pt-6 pb-8">
        <Btn full size="lg" onClick={() => a.stage('consent')}>
          Continue with {picked.length} {picked.length === 1 ? 'language' : 'languages'}
        </Btn>
      </div>
    </Blank>
  )
}

/* ---------- Consent ---------- */

const DEAL: { icon: string; tile: string; title: string; body: string }[] = [
  { icon: 'mic', tile: 'bg-ultra text-white', title: 'We only record inside a job', body: 'Your phone asks for microphone access the first time you start one. Nothing listens in the background.' },
  { icon: 'users', tile: 'bg-signal text-white', title: 'Reviewers and AI labs hear it', body: 'Our team checks each clip, then it is licensed to companies building speech AI. Never with your name or number.' },
  { icon: 'shield', tile: 'bg-lime text-ink', title: 'Delete it whenever you want', body: 'Ask us to erase your voice data under the DPDP Act 2023. Money already paid stays yours.' },
  { icon: 'wallet', tile: 'bg-ink text-white', title: 'Paid for every accepted clip', body: 'The price is shown before you record. Joining is free — no fees, ever.' },
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
      <div className="px-6 pt-4">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-lime px-2.5 py-1 text-[12px] font-bold tracking-wide uppercase">
          <Icon n="shield" s={13} /> Your voice, your call
        </span>
        <h1 className="mt-3 text-[32px] leading-[1.02] font-bold tracking-[-0.035em] text-balance">
          Four promises <span className="text-ultra">before you record.</span>
        </h1>
        <p className="mt-2 text-[15px] leading-snug text-ink-2">The whole deal in plain words. Read it once — it takes 30 seconds.</p>
      </div>

      <ol className="mx-6 mt-6 flex flex-col">
        {DEAL.map((d, i) => (
          <li key={d.title} className="anim-rise relative flex gap-4 pb-5" style={{ animationDelay: `${i * 70}ms` }}>
            {i < DEAL.length - 1 && <span aria-hidden className="absolute top-12 bottom-1 left-[21px] w-px bg-line-strong" />}
            <span className={`relative grid h-11 w-11 shrink-0 place-items-center rounded-[14px] ${d.tile}`}>
              <Icon n={d.icon} s={20} />
            </span>
            <div className="pt-0.5">
              <h2 className="text-[17px] leading-tight font-bold tracking-[-0.01em]">{d.title}</h2>
              <p className="mt-1 text-[14px] leading-[1.45] text-pretty text-ink-2">{d.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mx-6 overflow-hidden rounded-[24px] bg-surface shadow-[0_0_0_1px_rgba(0,0,0,.06)]">
        <button aria-expanded={full} onClick={() => setFull(!full)} className="flex w-full items-center justify-between px-4 py-3.5 text-left">
          <span className="text-[15px] font-semibold">Read the full terms</span>
          <Icon n="chev" s={18} className={`text-ink-3 transition-transform ${full ? 'rotate-90' : ''}`} />
        </button>
        {full && (
          <div className="anim-rise border-t border-line px-4 pt-3 pb-4">
            {picked.length > 1 && (
              <div className="mb-3 flex flex-wrap gap-1.5">
                {picked.map((l) => (
                  <button key={l} onClick={() => setTermsLang(l)} className={`h-8 rounded-full px-3 text-[13px] font-semibold transition-colors ${termsLang === l ? 'bg-ink text-white' : 'bg-surface-high text-ink-2'}`}>
                    {LANGS[l].native}
                  </button>
                ))}
              </div>
            )}
            <dl className="flex flex-col gap-3">
              {c.points.map(([h, t]) => (
                <div key={h}>
                  <dt className="text-[15px] font-semibold">{h}</dt>
                  <dd className="mt-0.5 text-[14px] leading-relaxed text-ink-2">{t}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 mt-auto bg-gradient-to-t from-bg via-bg to-bg/0 px-6 pt-8 pb-8">
        <label className={`mb-3 flex cursor-pointer items-center gap-3 rounded-[18px] p-3.5 transition-colors ${adult ? 'bg-lime-soft shadow-[0_0_0_1.5px_var(--color-ink)]' : 'bg-surface shadow-[0_0_0_1px_rgba(0,0,0,.08)]'}`}>
          <input type="checkbox" checked={adult} onChange={(e) => setAdult(e.target.checked)} className="h-5 w-5 shrink-0 accent-[#0e0f14]" />
          <span className="text-[15px] leading-snug">
            <span className="font-semibold">I'm 18 or older</span> and I agree to these terms.
          </span>
        </label>
        <Btn full size="lg" disabled={!adult} onClick={() => (inApp ? a.acceptConsent() : setDone(true))}>
          Agree and continue
        </Btn>
      </div>
    </>
  )
  if (inApp)
    return (
      <div className="flex flex-1 flex-col">
        <BackBar title="Consent" />
        {body}
      </div>
    )
  return (
    <Blank>
      <Steps n={2} onBack={() => a.stage('language')} />
      {body}
    </Blank>
  )
}

/* ---------- Ready + archived microphone screen ---------- */

function MicHero({ denied }: { denied?: boolean }) {
  return (
    <div className="relative grid h-[300px] place-items-center">
      {[240, 176, 112].map((d, i) => (
        <span key={d} className={`absolute rounded-full ${denied ? 'bg-white/10' : 'bg-white/[.09]'} ${!denied && i === 0 ? 'anim-pulse' : ''}`} style={{ width: d, height: d }} />
      ))}
      <span className={`relative grid h-[88px] w-[88px] place-items-center rounded-full bg-white shadow-2xl ${denied ? 'text-signal' : 'text-ultra'}`}>
        <Icon n="mic" s={38} />
        {denied && <span className="absolute h-[3px] w-16 rotate-45 rounded-full bg-signal ring-4 ring-white" />}
      </span>
    </div>
  )
}

function Ready({ onDone }: { onDone: () => void }) {
  return (
    <div className="flex flex-1 flex-col">
      <Plate tone="lime" className="h-[400px]">
        <div className="anim-rise relative grid h-[346px] place-items-center">
          <div className="absolute inset-x-8 top-1/2 h-24 -translate-y-1/2 text-ink/15">
            <Bars n={34} live />
          </div>
          <span className="relative grid h-[104px] w-[104px] place-items-center rounded-full bg-ink text-lime shadow-2xl">
            <Icon n="check" s={46} />
          </span>
        </div>
      </Plate>
      <div className="anim-rise flex flex-1 flex-col px-6 pt-7 pb-8 text-center">
        <h1 className="text-[34px] leading-none font-bold tracking-[-0.035em]">You're ready</h1>
        <p className="mx-auto mt-3 max-w-[30ch] text-[16px] leading-snug text-ink-2">Your first ₹100 unlocks withdrawals. Most people get there in 3 short jobs.</p>
        <div className="mx-auto mt-5 flex items-center gap-2 rounded-full bg-surface px-4 py-2 text-[14px] font-semibold shadow-[0_0_0_1px_rgba(0,0,0,.06)]">
          <span className="h-2 w-2 rounded-full bg-ultra" /> 3 jobs waiting for you
        </div>
        <div className="mt-auto pt-8">
          <Btn full size="lg" onClick={onDone}>
            Find my first job
          </Btn>
        </div>
      </div>
    </div>
  )
}

/** Archived: not in the onboarding flow — the OS permission prompt covers it. Kept for the in-app denied-mic path. */
export function MicPrime({ inApp }: { inApp?: boolean }) {
  const { s, a } = useStore()
  const [ready, setReady] = useState(false)
  const denied = s.mic === 'denied'
  if (ready) return <Ready onDone={() => a.setMic('granted')} />
  const allow = () => (inApp ? a.setMic('granted') : setReady(true))
  return (
    <div className="flex flex-1 flex-col">
      <Plate tone={denied ? 'signal' : 'ultra'} className="h-[400px]">
        <div className="h-12 px-4">
          {inApp ? (
            <button aria-label="Back" onClick={a.pop} className="grid h-11 w-11 place-items-center rounded-full bg-white/15">
              <Icon n="back" s={20} />
            </button>
          ) : (
            <div className="flex h-11 items-center gap-1.5 px-2">
              {[1, 2, 3].map((i) => (
                <span key={i} className="h-1 flex-1 rounded-full bg-white" />
              ))}
            </div>
          )}
        </div>
        <MicHero denied={denied} />
      </Plate>
      <div key={String(denied)} className="anim-rise flex flex-1 flex-col px-6 pt-7 pb-8">
        {denied ? (
          <>
            <h1 className="text-[28px] leading-[1.05] font-bold tracking-[-0.03em]">Microphone is blocked</h1>
            <p className="mt-2 text-[16px] leading-snug text-ink-2">Your consent is saved. You can browse jobs and your wallet, but recording needs the microphone.</p>
            <ol className="mt-5 flex flex-col gap-1.5 text-[15px]">
              {['Open Settings → Apps → Feul', 'Tap Permissions → Microphone', 'Choose “Allow only while using the app”'].map((t, i) => (
                <li key={t} className="flex items-center gap-3">
                  <span className="num grid h-6 w-6 place-items-center rounded-full bg-signal-soft text-[12px] font-bold text-signal">{i + 1}</span>
                  {t}
                </li>
              ))}
            </ol>
            <div className="mt-auto flex flex-col gap-1 pt-8">
              <Btn full size="lg" onClick={allow}>
                I've allowed it, try again
              </Btn>
              <Btn full v="outlined" className="border-transparent" onClick={() => (inApp ? a.pop() : a.stage('done'))}>
                Browse jobs for now
              </Btn>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-[28px] leading-[1.05] font-bold tracking-[-0.03em] text-balance">Allow the microphone to record jobs</h1>
            <p className="mt-2 text-[16px] leading-snug text-ink-2">Feul only listens while you're recording inside a job. Hold the phone close, like a normal call.</p>
            <div className="mt-auto flex flex-col gap-1 pt-8">
              <Btn full size="lg" icon="mic" onClick={allow}>
                Allow microphone
              </Btn>
              <Btn full v="outlined" className="border-transparent" onClick={() => a.setMic('denied')}>
                Not now
              </Btn>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
