import { useState } from 'react'
import { ENVS, FORMAT_LABEL, LANGS, jobTotal, type Env } from '../state/model'
import { sel, useStore } from '../state/store'
import { Banner, Btn, ENV_TINT, Icon, IconBtn, JobRow, Label, Meta, Player, SceneIcon, Tabs, inr } from '../ui/kit'

export default function Jobs() {
  const { s, a } = useStore()
  const f = s.scene ?? 'ALL'
  const [q, setQ] = useState('')
  const tier = sel.tier(s)
  const all = sel.eligible(s)
  const list = all.filter(
    (j) => (f === 'ALL' || (f === 'SAVED' ? s.saved.includes(j.id) : j.env === f)) && (!q || (j.title + j.situation).toLowerCase().includes(q.toLowerCase())),
  )
  const openable = list.filter((j) => j.campaign === 'open' && j.tier <= tier)
  const rest = list.filter((j) => !openable.includes(j))
  return (
    <div className="pb-6">
      <div className="px-5 pt-4">
        <p className="text-[14px] text-ink-2">
          {(s.langs ?? [s.lang]).map((l) => LANGS[l].native).join(' · ')} · standing {tier}
        </p>
        <h1 className="mt-1 text-[36px] leading-[1.05] font-semibold tracking-[-0.035em]">
          {openable.length ? <>{openable.length} jobs want<br />your voice</> : 'Find work'}
        </h1>
        <div className="mt-6 flex gap-2">
          <label className="flex h-12 flex-1 items-center gap-2 rounded-full bg-surface px-4 text-ink-2 focus-within:ring-2 focus-within:ring-primary-soft">
            <Icon n="search" s={19} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search jobs" aria-label="Search jobs" className="flex-1 bg-transparent text-[16px] text-ink outline-none placeholder:text-ink-3" />
          </label>
          <button aria-label="Filters" onClick={() => a.openSheet('filters')} className="grid h-12 w-12 place-items-center rounded-full bg-surface hover:bg-surface-high">
            <Icon n="filter" s={20} />
          </button>
        </div>
      </div>
      <div className="mt-5 px-5">
        <Tabs
          value={f}
          onChange={a.setScene}
          items={[
            { k: 'ALL' as const, l: 'All scenes' },
            ...(Object.keys(ENVS) as Env[]).filter((k) => all.some((j) => j.env === k)).map((k) => ({ k, l: ENVS[k].short, n: all.filter((j) => j.env === k).length })),
            { k: 'SAVED' as const, l: 'Saved', n: s.saved.length },
          ]}
        />
      </div>
      <div className="px-5">
        {all.length === 0 ? (
          <div className="py-10">
            <h3 className="text-[20px] font-semibold">No {LANGS[s.lang].name} jobs are open</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-2">Current campaigns have enough recordings in your language. This is a real gap in supply, not a loading problem.</p>
            <Btn className="mt-4" size="sm" icon="bell" onClick={() => (a.enableAlerts(), a.toast("We'll notify you"))}>
              Notify me
            </Btn>
          </div>
        ) : list.length === 0 ? (
          <p className="py-10 text-center text-[15px] text-ink-2">{f === 'SAVED' ? 'No saved jobs yet. Tap the bookmark on any job.' : `No ${f === 'ALL' ? '' : ENVS[f as Env].label.toLowerCase() + ' '}jobs match right now.`}</p>
        ) : (
          <>
            {openable.length > 0 && (
              <div className="mt-7 mb-3 flex items-baseline justify-between">
                <h2 className="text-[15px] font-semibold">Open to you</h2>
                <span className="num text-[13px] text-ink-3">{openable.length}</span>
              </div>
            )}
            <div className="flex flex-col gap-2.5">
              {openable.map((j) => (
                <JobRow key={j.id} job={j} />
              ))}
            </div>
            {rest.length > 0 && (
              <>
                <div className="mt-10 mb-3 flex items-baseline justify-between">
                  <h2 className="text-[15px] font-semibold text-ink-2">Not open right now</h2>
                  <span className="num text-[13px] text-ink-3">{rest.length}</span>
                </div>
                <div className="flex flex-col gap-2.5">
                  {rest.map((j) => (
                    <JobRow key={j.id} job={j} locked={j.tier > tier && j.campaign === 'open'} />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export function JobDetail({ id }: { id: string }) {
  const { s, a } = useStore()
  const j = sel.job(s, id)
  const tier = sel.tier(s)
  const mine = s.session?.jobId === id ? s.session : null
  const lockedTotal = mine?.locked.total
  const total = lockedTotal ?? jobTotal(j)
  const inFlight = mine || s.submissions.some((x) => x.jobId === id && x.status !== 'approved')
  const blocked = !mine && (j.campaign !== 'open' || j.tier > tier || j.prompts.length === 0)
  const room = j.format === 'ROOM'
  return (
    <div>
      <div className="flex h-14 items-center justify-between px-2">
        <IconBtn n="back" label="Back" onClick={a.pop} />
        <IconBtn n="bookmark" label={s.saved.includes(id) ? 'Remove from saved' : 'Save job'} onClick={() => a.toggleSave(id)} className={s.saved.includes(id) ? 'text-primary [&_svg]:fill-current' : ''} />
      </div>
      <div className="px-5">
        <div className={`relative h-[200px] overflow-hidden rounded-[28px] ${ENV_TINT[j.env].bg}`}>
          <SceneIcon env={j.env} s={56} className={`absolute inset-0 m-auto ${ENV_TINT[j.env].ink}`} />
          <img src={j.image} alt="" className="absolute inset-0 h-full w-full object-cover outline outline-1 -outline-offset-1 outline-black/10" onError={(e) => (e.currentTarget.style.display = 'none')} />
          <span className={`absolute top-4 left-4 inline-flex h-8 items-center gap-1.5 rounded-full bg-white/90 pr-3 pl-2 text-[13px] font-semibold backdrop-blur ${ENV_TINT[j.env].ink}`}>
            <SceneIcon env={j.env} s={17} />
            {ENVS[j.env].short}
          </span>
          {j.coverage >= 1.5 && <span className="num absolute top-4 right-4 inline-flex h-8 items-center rounded-full bg-ink/80 px-3 text-[12px] font-semibold text-white backdrop-blur">{j.coverage.toFixed(1)}× pay</span>}
        </div>
        <div className="mt-5 text-[13px] font-medium text-ink-2">
          {FORMAT_LABEL[j.format]} · {LANGS[j.lang].name}
        </div>
        <h1 className="mt-1 text-[28px] leading-[1.1] font-semibold tracking-[-0.025em] text-balance">{j.title}</h1>
      </div>

      <div className="flex flex-col gap-3 px-5 pt-4">
        {j.campaign === 'closed' && (
          <Banner tone="neutral" title="Closed to new work">
            {inFlight ? 'Your work in this job is still being handled at the rate locked when you started.' : 'This campaign has enough recordings. It no longer accepts new sessions.'}
          </Banner>
        )}
        {j.campaign === 'full' && !mine && <Banner tone="neutral" title="Coverage full">Labs have enough recordings for this situation. Similar open jobs are in Jobs.</Banner>}
        {j.campaign === 'oversubscribed' && !mine && <Banner tone="warn" title="Oversubscribed">More people are recording this than it needs. New sessions are paused so work already started can finish.</Banner>}
        {j.tier > tier && <Banner tone="info" title={`Unlocks at standing ${j.tier}`}>Complete a few more jobs with good reviews. Standing changes access and settlement speed, never base pay.</Banner>}
      </div>

      <div className="mt-4 px-5">
        <p className="text-[17px] leading-relaxed">{j.situation}</p>
        <div className="mt-3">
          <Meta job={j} />
        </div>
      </div>

      {/* Earnings breakdown */}
      <div className="mx-5 mt-6 rounded-lg bg-surface p-5">
        <div className="flex items-baseline justify-between">
          <Label>You earn</Label>
          {lockedTotal != null && <span className="text-[12px] font-semibold text-ok">Locked for your session</span>}
        </div>
        <div className="num mt-2 text-[44px] leading-none font-semibold tracking-[-0.03em]">{inr(total)}</div>
        <div className="num mt-4 grid grid-cols-[1fr_auto_1fr_auto_1fr] items-end gap-2 border-t border-line pt-4 text-center">
          <div>
            <div className="text-[18px] font-semibold">{inr(j.base)}</div>
            <div className="text-[12px] text-ink-2">base</div>
          </div>
          <span className="pb-4 text-ink-3">×</span>
          <div>
            <div className="text-[18px] font-semibold text-primary">{j.coverage.toFixed(1)}×</div>
            <div className="text-[12px] text-ink-2">coverage</div>
          </div>
          <span className="pb-4 text-ink-3">+</span>
          <div>
            <div className="text-[18px] font-semibold">{inr(j.bonus)}</div>
            <div className="text-[12px] text-ink-2">bonus</div>
          </div>
        </div>
        <p className="mt-4 text-[14px] leading-snug text-ink-2">
          {j.coverage > 1 ? `Labs have few ${LANGS[j.lang].name} recordings of this situation, so it pays ${j.coverage.toFixed(1)}× the base.` : 'Coverage for this situation is already healthy, so it pays the base rate.'} The amount is locked when you start.
        </p>
      </div>

      <div className="mt-6 px-5">
        <Label className="mb-3">Hear an example</Label>
        <Player seed={j.base + 3} secs={9} label="example" />
      </div>

      <div className="mt-8 px-5">
        <Label className="mb-3">How it works</Label>
        <ol className="space-y-4">
          {[
            ['Feul sets the scene', room ? 'You get a topic. Everyone talks naturally in one continuous take.' : j.format === 'INTERVIEW' ? 'An AI interviewer asks a question, listens, then follows up on what you said.' : j.format === 'SCENARIO' ? 'An AI voice sets the scene, plays the other person, listens and asks follow-ups.' : 'You read short lines shown on screen.'],
            ['You perform it', 'In your own voice and natural way of speaking. No acting skills needed.'],
            ['You check before submitting', 'Listen back and retake anything before it leaves your phone.'],
            ['Reviewers check quality', 'Usually within 24h. If one part fails, you only redo that part.'],
          ].map(([h, b], i) => (
            <li key={i} className="flex gap-4">
              <span className="num grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary-soft text-[13px] font-semibold text-on-primary-soft">{i + 1}</span>
              <div>
                <div className="text-[16px] font-semibold">{h}</div>
                <div className="text-[14px] leading-snug text-ink-2">{b}</div>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-8 px-5">
        <Label className="mb-3">You'll need</Label>
        <ul className="divide-y divide-line rounded-lg bg-surface text-[15px]">
          <li className="flex justify-between px-4 py-3">
            <span className="text-ink-2">Language</span>
            <span className="font-medium">{LANGS[j.lang].native}</span>
          </li>
          <li className="flex justify-between px-4 py-3">
            <span className="text-ink-2">Place</span>
            <span className="text-right font-medium">{j.environment}</span>
          </li>
          <li className="flex justify-between px-4 py-3">
            <span className="text-ink-2">Time</span>
            <span className="num font-medium">~{j.minutes} min, one sitting</span>
          </li>
          {room && (
            <li className="flex justify-between px-4 py-3">
              <span className="text-ink-2">People</span>
              <span className="font-medium">{j.participants} adults, each consents</span>
            </li>
          )}
        </ul>
        <p className="mt-3 text-[14px] text-ink-2">Hold the phone the way you would on a call. If you're interrupted, you have 24h to resume.</p>
        {room && (
          <div className="mt-3">
            <Banner tone="warn" title="Charge to 40% or more">Room takes run {j.minutes}+ minutes without pausing. A dying battery ends the take.</Banner>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 z-10 mt-8 bg-gradient-to-t from-bg from-60% to-transparent px-5 pt-8 pb-5">
        {mine ? (
          <Btn full size="lg" onClick={a.resume}>
            Continue recording
          </Btn>
        ) : (
          <Btn full size="lg" icon="mic" disabled={blocked} onClick={() => a.startJob(id)}>
            {blocked ? (j.campaign === 'closed' ? 'Closed to new work' : j.tier > tier ? 'Locked' : 'Not open right now') : `Start this job · ${inr(total)}`}
          </Btn>
        )}
      </div>
    </div>
  )
}

export function FilterSheet() {
  const { s, a } = useStore()
  return (
    <div className="space-y-5">
      <div>
        <Label className="mb-2">Language</Label>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(LANGS) as (keyof typeof LANGS)[]).map((k) => (
            <button key={k} onClick={() => a.chooseLang(k)} className={`h-9 rounded-full border px-3.5 text-[14px] ${s.lang === k ? 'border-ink bg-ink text-white' : 'border-line-strong'}`}>
              {LANGS[k].native}
            </button>
          ))}
        </div>
      </div>
      <p className="text-[14px] text-ink-2">Jobs are sorted by fit for your language, not by pay. Same work always has the same base.</p>
      <Btn full onClick={a.closeSheet}>
        Show jobs
      </Btn>
    </div>
  )
}
