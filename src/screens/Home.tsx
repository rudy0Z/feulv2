import { useEffect, useState, type ReactNode } from 'react'
import { ENVS, FORMAT_LABEL, LANGS, jobTotal, type Env } from '../state/model'
import { MIN_WITHDRAW, sel, useStore } from '../state/store'
import { Banner, PillProgress, Btn, Card, ENV_TINT, Icon, JobRow, SceneIcon, Section, Status, Waveform, inr } from '../ui/kit'

export default function Home() {
  const { s, a } = useStore()
  const open = sel.openForMe(s)
  const isNew = s.ledger.length === 0 && s.submissions.length === 0
  const inReview = sel.inReview(s)
  const attention = sel.attention(s)
  const reviewing = s.submissions.filter((x) => x.status === 'under_review' || x.status === 'appeal')
  const next = open.find((j) => j.id !== s.session?.jobId)
  const hr = new Date().getHours()
  const greet = hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="pb-6">
      <header className="px-5 pt-4">
        <p className="text-[15px] text-ink-2">
          {greet}, <span className="font-medium text-ink">{s.name}</span>
        </p>
        <h1 className="mt-1 text-[32px] leading-[1.08] font-semibold tracking-[-0.035em]">{open.length ? <>{open.length} conversations are<br />waiting for your voice.</> : 'Quiet day for work.'}</h1>
      </header>

      {(s.session || attention.length > 0 || (s.withdrawal && s.withdrawal.status !== 'paid')) && (
        <div className="mt-6 flex flex-col gap-2.5 px-5">
          <SessionCard />
          {attention.map((x) => {
            const j = sel.job(s, x.jobId)
            const bad = x.clips.filter((c) => c.state === 'repair_required').length
            return (
              <Banner
                key={x.id}
                tone="err"
                title={j.format === 'ROOM' ? `${j.title}: repeat the room take` : `${j.title}: ${x.clips.length - bad}/${x.clips.length} accepted`}
                action={
                  <Btn size="sm" onClick={() => a.push({ name: 'submission', id: x.id })}>
                    {j.format === 'ROOM' ? 'See what to fix' : `Fix ${bad} ${bad === 1 ? 'clip' : 'clips'}`}
                  </Btn>
                }
              >
                Job total {inr(x.total)} is held until this is fixed. Accepted clips are kept.
              </Banner>
            )
          })}
          {s.withdrawal && s.withdrawal.status !== 'paid' && (
            <button onClick={() => a.push({ name: 'withdrawal' })} className="flex items-center gap-3 rounded-[24px] bg-surface p-4 text-left">
              <Status k={s.withdrawal.status} />
              <span className="flex-1 text-[14px] text-ink-2">
                <span className="num font-semibold text-ink">{inr(s.withdrawal.amount)}</span> to {s.withdrawal.vpa}
              </span>
              <Icon n="chev" s={18} className="text-ink-3" />
            </button>
          )}
        </div>
      )}

      {isNew ? <FirstEarning /> : <EarningsModule inReview={inReview} />}

      {sel.eligible(s).length === 0 ? (
        <NoWork />
      ) : (
        <>
          {next ? (
            <section className="mt-10 px-5">
              <h2 className="mb-4 text-[20px] font-semibold tracking-[-0.01em]">{isNew ? 'Your first job' : 'Next for you'}</h2>
              <NextJob id={next.id} />
            </section>
          ) : (
            <p className="mt-10 px-5 text-[15px] text-ink-2">You've started everything open for you today. New jobs will show up here.</p>
          )}
          <SceneGrid />
        </>
      )}

      {reviewing.length > 0 && (
        <Section title="In review" className="mt-10">
          <ul>
            {reviewing.map((x) => {
              const j = sel.job(s, x.jobId)
              return (
                <li key={x.id}>
                  <button onClick={() => a.push({ name: 'submission', id: x.id })} className="flex w-full items-center gap-4 py-3 text-left">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-peach">
                      <span className="h-2 w-2 rounded-full bg-signal" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[16px] font-semibold">{j.title}</span>
                      <span className="block truncate text-[13px] text-ink-2">{x.waitReason}</span>
                    </span>
                    <span className="num text-[16px] font-semibold">{inr(x.total)}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </Section>
      )}

      {isNew && <Checklist />}
    </div>
  )
}

function SessionCard() {
  const { s, a } = useStore()
  const sess = s.session
  if (!sess) return null
  const j = sel.job(s, sess.jobId)
  const done = sess.clips.filter((c) => c.state !== 'ready').length
  if (sess.status === 'expired') {
    const canRestart = j.campaign === 'open'
    return (
      <Card className="border border-line">
        <div className="flex items-center justify-between">
          <Status k="x" label="Resume window ended" />
          <span className="text-[13px] text-ink-3">24h passed</span>
        </div>
        <div className="mt-3 text-[18px] font-semibold">{j.title}</div>
        <ul className="mt-2 space-y-1 text-[14px] leading-snug text-ink-2">
          <li>• {done} clips recorded on this device can no longer be submitted.</li>
          <li>• Nothing was submitted, so no payout is pending for this job.</li>
          <li>• {canRestart ? `The job is still open. Starting again is a fresh session at today's rate (${inr(jobTotal(j))}).` : 'This job is no longer open.'}</li>
        </ul>
        <div className="mt-4 flex gap-2">
          {canRestart && (
            <Btn size="sm" onClick={() => a.startJob(j.id)}>
              Start again
            </Btn>
          )}
          <Btn size="sm" v="outlined" onClick={a.clearExpired}>
            Remove from device
          </Btn>
        </div>
      </Card>
    )
  }
  if (sess.status === 'upload_failed') {
    return (
      <Banner tone="err" title={`${j.title} didn't upload`} action={<Btn size="sm" icon="retry" onClick={a.resume}>Retry upload</Btn>}>
        {sess.clips.length} clips are safe on this device. Nothing was submitted yet, and this is not a rejection. Resume within {sess.resumeLeft}.
      </Banner>
    )
  }
  if (sess.status === 'uploading') {
    return <Banner tone="info" title={`Uploading ${j.title}`}>Keep the app open. It becomes “Submitted” only after Feul receives every clip.</Banner>
  }
  return (
    <div className="overflow-hidden rounded-lg bg-carbon p-5 text-carbon-ink">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-carbon-ink-2 ">Continue recording</span>
        <span className="num font-mono text-[12px] text-carbon-ink-2">{sess.resumeLeft} left to resume</span>
      </div>
      <div className="mt-3 text-[20px] font-semibold">{j.title}</div>
      <div className="mt-0.5 text-[14px] text-carbon-ink-2">
        {sess.repairOf ? 'Repair' : FORMAT_LABEL[j.format]} · {done} of {sess.clips.length} recorded on device · {inr(sess.locked.total)} locked
      </div>
      {sess.honoured && <div className="mt-2 text-[13px] text-peri">Campaign closed to new work. Your session is honoured at the locked rate.</div>}
      <div className="mt-4 flex gap-1">
        {sess.clips.map((c, i) => (
          <span key={i} className={`h-1.5 flex-1 rounded-full ${c.state !== 'ready' ? 'audio-grad' : 'bg-carbon-3'}`} />
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <Btn v="inverse" onClick={a.resume}>
          Resume
        </Btn>
      </div>
    </div>
  )
}

export function useCountUp(to: number, ms = 900) {
  const [v, setV] = useState(to)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || to === 0) return setV(to)
    let raf = 0
    const t0 = performance.now()
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / ms)
      setV(Math.round(to * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [to, ms])
  return v
}

function MoneyPlate({ children }: { children: ReactNode }) {
  return (
    <div className="anim-rise relative mx-5 mt-6 isolate overflow-hidden rounded-[28px] bg-ultra p-6 text-white shadow-[0_24px_48px_-24px_rgba(43,59,255,.7)]">
      <div aria-hidden className="anim-drift pointer-events-none absolute -top-28 -right-20 -z-10 h-72 w-72 rounded-full bg-[#8a94ff]/70 blur-3xl" />
      <div aria-hidden className="anim-drift-slow pointer-events-none absolute -bottom-32 -left-16 -z-10 h-64 w-64 rounded-full bg-[#1a22c9] blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 rounded-[28px] shadow-[inset_0_1px_0_rgba(255,255,255,.25)]" />
      {children}
    </div>
  )
}

function FirstEarning() {
  const { s } = useStore()
  const open = sel.openForMe(s)
  // Achievable = sum of open jobs until ₹100; shows how the floor is reachable, not a guarantee.
  let acc = 0
  const path = open.filter((j) => (acc < MIN_WITHDRAW ? ((acc += jobTotal(j)), true) : false))
  const reach = useCountUp(Math.min(acc, 999))
  return (
    <MoneyPlate>
      <div className="text-[13px] font-medium text-white/75">Your first withdrawal</div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="num text-[56px] leading-none font-semibold tracking-[-0.045em]">₹0</span>
        <span className="num text-[16px] text-white/70">of ₹{MIN_WITHDRAW}</span>
      </div>
      <div className="mt-6 flex items-center gap-1.5">
        {path.map((j, i) => (
          <div key={j.id} className="relative h-2.5 min-w-0 overflow-hidden rounded-full bg-white/20" style={{ flex: jobTotal(j) }}>
            <span className="anim-sheen absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/60 to-transparent" style={{ animationDelay: `${600 + i * 180}ms` }} />
          </div>
        ))}
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-lime text-ink shadow-[0_0_0_4px_rgba(198,244,50,.25)]">
          <Icon n="wallet" s={14} />
        </span>
      </div>
      <div className="mt-2.5 flex gap-1.5 pr-[34px]">
        {path.map((j, i) => (
          <div key={j.id} className="anim-rise num min-w-0 truncate text-[12px] text-white/75" style={{ flex: jobTotal(j), animationDelay: `${200 + i * 90}ms` }}>
            <span className="font-semibold text-white">{inr(jobTotal(j))}</span> {ENVS[j.env].short}
          </div>
        ))}
      </div>
      <div className="mt-5 flex items-center gap-3 rounded-[24px] bg-white/12 p-3.5 backdrop-blur-sm">
        <span className="num grid h-10 min-w-10 place-items-center rounded-full bg-white px-2 text-[15px] font-semibold text-ultra">{path.length}</span>
        <p className="text-[13px] leading-snug text-white/85">
          conversations can reach <span className="num font-semibold text-white">₹{reach}</span>. Money unlocks after each passes review.
        </p>
      </div>
    </MoneyPlate>
  )
}

function EarningsModule({ inReview }: { inReview: number }) {
  const { s, a } = useStore()
  const gap = Math.max(0, MIN_WITHDRAW - s.available)
  const held = sel.held(s)
  const shown = useCountUp(s.available)
  return (
    <MoneyPlate>
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-white/75">Available to withdraw</span>
      </div>
      <div className="num mt-2 text-[60px] leading-none font-semibold tracking-[-0.045em]">{inr(shown)}</div>
      <div className="num mt-1 text-[13px] text-white/70">
        <span className="font-semibold text-lime">+{inr(sel.thisWeek(s))}</span> this week
      </div>
      <PillProgress className="mt-5" tone="lime" value={s.available} max={MIN_WITHDRAW} label={`${inr(Math.min(s.available, MIN_WITHDRAW))}/${inr(MIN_WITHDRAW)}`} right={gap > 0 ? `${inr(gap)} to withdraw` : 'Ready, no fee'} />
      <div className="mt-6 flex items-center gap-2">
        <button onClick={() => a.setTab('wallet')} className="inline-flex h-11 items-center gap-1.5 rounded-full bg-white px-5 text-[14px] font-semibold text-ink transition-transform active:scale-95">
          {gap > 0 ? 'Open wallet' : `Withdraw ${inr(s.available)}`}
        </button>
        <span className="inline-flex h-11 items-center gap-2 rounded-full bg-white/15 px-4 text-[13px] backdrop-blur-sm">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inset-0 animate-ping rounded-full bg-signal motion-reduce:hidden" />
            <span className="relative h-1.5 w-1.5 rounded-full bg-signal" />
          </span>
          <span className="num font-semibold">{inr(inReview + held)}</span> in review
        </span>
      </div>
      <WeekDots />
    </MoneyPlate>
  )
}

function WeekDots() {
  const { s } = useStore()
  const idx = (new Date().getDay() + 6) % 7 // Mon = 0
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  const hit = (i: number) => i <= idx && s.ledger.some((l) => l.kind !== 'withdrawal' && l.day === idx - i)
  let streak = 0
  for (let i = idx; i >= 0 && hit(i); i--) streak++
  const active = days.filter((_, i) => hit(i)).length
  return (
    <div className="mt-6 border-t border-white/15 pt-5">
      <div className="flex items-baseline justify-between text-[13px]">
        <span className="font-semibold">{streak > 1 ? `${streak}-day streak` : `${active} ${active === 1 ? 'day' : 'days'} recorded`}</span>
        <span className="num text-white/65">this week</span>
      </div>
      <ol className="mt-3 flex justify-between">
        {days.map((d, i) => {
          const on = hit(i)
          const now = i === idx
          return (
            <li key={i} className="flex flex-col items-center gap-1.5">
              <span className={`anim-rise grid h-8 w-8 place-items-center rounded-full text-[12px] font-semibold ${on ? 'bg-lime text-ink' : now ? 'text-white ring-[1.5px] ring-white/80 ring-inset' : 'bg-white/10 text-white/55'}`} style={{ animationDelay: `${i * 50}ms` }}>
                {on ? <Icon n="check" s={14} /> : d}
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function SceneGrid() {
  const { s, a } = useStore()
  const open = sel.openForMe(s)
  const scenes = (Object.keys(ENVS) as Env[]).map((k) => ({ k, jobs: open.filter((j) => j.env === k) })).filter((x) => x.jobs.length).slice(0, 6)
  if (!scenes.length) return null
  return (
    <Section title="Pick a scene" className="mt-10" action={<button onClick={() => a.openScene('ALL')} className="text-[14px] font-medium text-primary">All scenes</button>}>
      <div className="grid grid-cols-3 gap-2.5">
        {scenes.map(({ k, jobs }) => (
          <button key={k} onClick={() => a.openScene(k)} className={`flex h-[112px] flex-col items-start justify-between rounded-[24px] p-3.5 text-left transition-transform duration-200 active:scale-[0.96] ${ENV_TINT[k].bg}`}>
            <span className={`grid h-9 w-9 place-items-center rounded-full bg-white/80 ${ENV_TINT[k].ink}`}>
              <SceneIcon env={k} s={20} />
            </span>
            <span className="w-full">
              <span className="block truncate text-[14px] leading-tight font-semibold">{ENVS[k].short}</span>
              <span className="num mt-0.5 block truncate text-[12px] text-ink-2">
                {jobs.length} {jobs.length === 1 ? "job" : "jobs"} · {inr(Math.max(...jobs.map(jobTotal)))}
              </span>
            </span>
          </button>
        ))}
      </div>
    </Section>
  )
}

function NextJob({ id }: { id: string }) {
  const { s, a } = useStore()
  const j = sel.job(s, id)
  const t = ENV_TINT[j.env]
  return (
    <div className="overflow-hidden rounded-[28px] bg-surface shadow-[0_1px_2px_rgba(14,15,20,.04),0_16px_40px_-20px_rgba(14,15,20,.2)]">
      <button onClick={() => a.push({ name: 'detail', jobId: j.id })} className="block w-full text-left">
        <div className={`relative h-[168px] ${t.bg}`}>
          <img src={j.image} alt="" className="h-full w-full object-cover" onError={(e) => (e.currentTarget.style.visibility = 'hidden')} />
          <span className={`absolute top-4 left-4 inline-flex h-8 items-center gap-1.5 rounded-full bg-white/90 pr-3 pl-2 text-[13px] font-semibold backdrop-blur ${t.ink}`}>
            <SceneIcon env={j.env} s={17} />
            {ENVS[j.env].short}
          </span>
          {j.coverage >= 1.5 && <span className="num absolute top-4 right-4 inline-flex h-8 items-center rounded-full bg-ink/80 px-3 text-[12px] font-semibold text-white backdrop-blur">{j.coverage.toFixed(1)}× pay</span>}
        </div>
        <div className="px-5 pt-5">
          <div className="num text-[13px] text-ink-2">
            {FORMAT_LABEL[j.format]} · ~{j.minutes} min · {j.turns} turns · {LANGS[j.lang].native}
          </div>
          <div className="mt-1.5 text-[24px] leading-[1.15] font-semibold tracking-[-0.02em] text-balance">{j.title}</div>
          <p className="mt-1.5 text-[15px] leading-snug text-pretty text-ink-2">{j.situation}</p>
        </div>
      </button>
      <div className="flex items-center justify-between gap-3 p-5">
        <div>
          <div className="num text-[28px] leading-none font-semibold tracking-[-0.03em]">{inr(jobTotal(j))}</div>
          <div className="mt-1 text-[12px] text-ink-2">locked when you start</div>
        </div>
        <Btn onClick={() => a.startJob(j.id)} icon="mic" className="whitespace-nowrap">
          {s.ledger.length === 0 ? 'Start earning' : 'Start'}
        </Btn>
      </div>
    </div>
  )
}

function NoWork() {
  const { s, a } = useStore()
  return (
    <div className="mx-5 mt-10 rounded-[28px] bg-butter p-6">
      <Waveform seed={2} bars={40} h={18} tone="muted" progress={0} />
      <h3 className="mt-4 text-[20px] font-semibold">{LANGS[s.lang].name} coverage is full for now</h3>
      <p className="mt-2 text-[15px] leading-relaxed text-ink-2">Labs have enough {LANGS[s.lang].name} recordings for their current campaigns. New campaigns usually open within 2–3 days. We don't show filler jobs.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Btn size="sm" icon="bell" onClick={() => (a.enableAlerts(), a.toast(`We'll notify you when ${LANGS[s.lang].name} work opens`))}>
          Notify me
        </Btn>
        <Btn size="sm" v="outlined" onClick={() => a.openSheet('edit')}>
          Add another language
        </Btn>
      </div>
    </div>
  )
}

function Checklist() {
  const { s, a } = useStore()
  const items = [
    { l: 'Record your first job', d: 'Earn once it passes review', done: s.submissions.length > 0, go: () => a.setTab('jobs') },
    { l: 'Add UPI', d: 'Where withdrawals are paid', done: !!s.upi, go: () => a.push({ name: 'withdraw' }) },
    { l: 'Complete profile', d: 'Name that matches your UPI', done: s.checklist.profile, go: () => a.openSheet('edit') },
    { l: 'Enable alerts', d: 'Review results and payments', done: s.checklist.alerts, go: () => (a.enableAlerts(), a.toast('Alerts on')) },
  ]
  return (
    <Section title="Get set up" className="mt-10">
      <ul>
        {items.map((it, i) => (
          <li key={i}>
            <button disabled={it.done} onClick={it.go} className="flex w-full items-center gap-4 py-3 text-left">
              <span className={`grid h-6 w-6 place-items-center rounded-full border-2 ${it.done ? 'border-ultra bg-ultra text-white' : 'border-line-strong'}`}>{it.done && <Icon n="check" s={13} />}</span>
              <span className="flex-1">
                <span className={`block text-[15px] font-medium ${it.done ? 'text-ink-3 line-through' : ''}`}>{it.l}</span>
                <span className="block text-[13px] text-ink-2">{it.d}</span>
              </span>
              {!it.done && <Icon n="chev" s={18} className="text-ink-3" />}
            </button>
          </li>
        ))}
      </ul>
    </Section>
  )
}
