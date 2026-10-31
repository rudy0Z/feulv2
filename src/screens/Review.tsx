import { useState } from 'react'
import { FORMAT_LABEL } from '../state/model'
import { sel, useStore } from '../state/store'
import { BackBar, Banner, Btn, Icon, Label, PillProgress, Player, Status, Waveform, inr } from '../ui/kit'
import { useCountUp } from './Home'
import { LeaveFlow } from './Studio'
import MoneyMoment from '../ui/MoneyMoment'

export default function Review() {
  const { s, a } = useStore()
  const sess = s.session
  const [leave, setLeave] = useState(false)
  if (!sess) return null
  const j = sel.job(s, sess.jobId)
  const room = j.format === 'ROOM'
  const up = sess.status === 'uploading'
  const failed = sess.status === 'upload_failed'
  return (
    <div className="relative flex flex-1 flex-col">
      <BackBar title={sess.repairOf ? 'Check your fix' : 'Check before submitting'} onBack={() => setLeave(true)} />
      <div className="px-5">
        <div className="flex items-baseline justify-between">
          <h1 className="text-[24px] leading-tight font-semibold tracking-[-0.02em]">{j.title}</h1>
          <span className="num text-[20px] font-semibold">{inr(sess.locked.total)}</span>
        </div>
        <p className="mt-1 text-[15px] text-ink-2">
          {room ? 'One room take' : `${sess.clips.length} ${sess.clips.length === 1 ? 'clip' : 'clips'}`} ready · {FORMAT_LABEL[j.format]} · recorded on this device, not submitted
        </p>
      </div>

      <div className="mt-4 px-5">
        {failed && (
          <Banner tone="err" title="Upload failed · nothing was lost" action={
              <div className="flex gap-2">
                <Btn size="sm" icon="retry" onClick={a.submit}>
                  Retry upload
                </Btn>
                <Btn size="sm" v="outlined" onClick={() => (a.leaveSession(), a.toast(`Saved on device · resume within ${sess.resumeLeft}`))}>
                  Upload later
                </Btn>
              </div>
            }>
            Your connection dropped before Feul received every clip. The clips are still on this phone. This is not a review decision.
          </Banner>
        )}
        {!failed && !up && sess.clips.some((c) => c.retaken) && (
          <Banner tone="ok" title={sess.repairOf ? 'Fix recorded · only this turn is re-reviewed' : 'Retakes saved · every clip is ready'}>
            {sess.repairOf ? 'Your approved clips stay approved. Submit to send just the new take.' : 'Your new takes replaced the old ones on this phone. Nothing is sent until you submit.'}
          </Banner>
        )}
        {up && <Banner tone="info" title="Uploading…">Keep the app open. You'll see “Submitted” only once Feul has every clip.</Banner>}
      </div>

      <ul className="mx-5 mt-4 divide-y divide-line overflow-hidden rounded-[24px] bg-surface">
        {sess.clips.map((c, i) => (
          <li key={c.id} className="p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="flex min-w-0 gap-3">
                <span className="num grid h-7 min-w-7 shrink-0 place-items-center rounded-full bg-primary-soft px-2 text-[12px] font-semibold text-on-primary-soft">{room ? c.prompt.speaker : i + 1}</span>
                <div className="line-clamp-2 pt-0.5 text-[15px] leading-snug">{c.prompt.text}</div>
              </div>
              <Status k={c.state} />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Player seed={c.seed} secs={c.secs || 4} label={`clip ${i + 1}`} />
              </div>
              {!room && !up && (
                <button
                  onClick={() => {
                    a.setClip(i, { state: 'ready', secs: 0, retaken: true })
                    a.goClip(i)
                    a.replace({ name: 'studio' })
                  }}
                  className="flex h-10 items-center gap-1.5 rounded-full bg-bg px-3.5 text-[13px] font-medium transition-transform duration-150 ease-out active:scale-[0.96]"
                >
                  <Icon n="retry" s={15} />
                  Retake
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
      {room && !up && (
        <button
          onClick={() => {
            sess.clips.forEach((_, i) => a.setClip(i, { state: 'ready', secs: 0 }))
            a.goClip(0)
            a.replace({ name: 'studio' })
          }}
          className="mx-5 mt-3 self-start text-[14px] font-medium text-primary"
        >
          Retake the whole room take
        </button>
      )}

      <div className="mt-auto px-5 pt-8 pb-8">
        <p className="mb-3 text-[13px] text-ink-2">You submit once. After this, reviewers check the {room ? 'take' : 'clips'}, usually within 24h. Payment follows approval.</p>
        {!failed && (
          <Btn full size="lg" v="audio" loading={up} icon="upload" onClick={a.submit}>
            {up ? 'Uploading' : `Submit for review`}
          </Btn>
        )}
      </div>
      <LeaveFlow open={leave} onClose={() => setLeave(false)} />
    </div>
  )
}

export function Submission({ id }: { id: string }) {
  const { s, a } = useStore()
  const sub = s.submissions.find((x) => x.id === id)
  const [appealOpen, setAppealOpen] = useState(false)
  if (!sub) return null
  const j = sel.job(s, sub.jobId)
  const acc = sub.clips.filter((c) => c.state === 'accepted').length
  const bad = sub.clips.filter((c) => c.state === 'repair_required')
  const repair = sub.status === 'repair_required' ? sub.repair : undefined
  const room = j.format === 'ROOM'

  return (
    <div className="flex flex-1 flex-col pb-8">
      <BackBar title={FORMAT_LABEL[j.format]} right={<button onClick={() => a.openSheet('help')} className="mr-3 text-[14px] font-medium text-primary">Help</button>} />
      <div className="px-5">
        <Status k={sub.status} />
        <h1 className="mt-3 text-[28px] leading-tight font-semibold tracking-[-0.02em]">
          {repair
            ? room
              ? 'The room take needs repeating'
              : `${acc}/${sub.clips.length} accepted · fix ${bad.length}`
            : sub.status === 'appeal'
              ? 'Appeal under review'
              : sub.status === 'approved'
                ? 'Approved'
                : 'Submitted · under review'}
        </h1>
        <p className="mt-1 text-[15px] text-ink-2">
          {j.title} · submitted {sub.submittedAt}
        </p>
      </div>

      <dl className="mx-5 mt-5 grid grid-cols-2 overflow-hidden rounded-lg bg-surface">
        <div className="border-r border-line p-4">
          <dt className="text-[13px] text-ink-2">Job total</dt>
          <dd className="num mt-1 text-[24px] font-semibold">{inr(sub.total)}</dd>
        </div>
        <div className="p-4">
          <dt className="text-[13px] text-ink-2">{sub.status === 'approved' ? 'Available' : 'Expected'}</dt>
          <dd className="mt-1 text-[15px] leading-snug font-medium">
            {sub.status === 'approved' ? 'Ready to withdraw now' : repair ? 'After your fix is reviewed, about 24h' : 'Usually by tomorrow, 9 am'}
          </dd>
        </div>
      </dl>
      {sub.honoured && (
        <div className="mx-5 mt-3">
          <Banner tone="neutral" title="Campaign closed · your work is honoured">The campaign stopped taking new work after you started. This submission is reviewed and paid at the locked rate.</Banner>
        </div>
      )}

      {repair && (
        <div className="mx-5 mt-5 rounded-[24px] bg-surface p-5 shadow-[inset_4px_0_0_var(--color-err)]">
          <div className="flex items-center justify-between">
            <Label className="text-err">Why · {repair.code}</Label>
          </div>
          <div className="mt-2 text-[20px] leading-snug font-semibold">{repair.reason}</div>
          <p className="mt-1 text-[15px] leading-snug text-ink-2">{repair.why}</p>
          <div className="mt-4 rounded-md bg-surface-low p-3">
            <div className="mb-1.5 text-[12px] text-ink-2">{room ? 'What a good take has' : 'How it should sound'}</div>
            <p className="mb-2 text-[16px]">{repair.example}</p>
            {!room && <Player seed={77} secs={4} label="example" />}
          </div>
          <p className="mt-4 text-[15px]">
            <span className="font-semibold">Tip: </span>
            {repair.tip}
          </p>
          <div className="mt-4 rounded-md bg-surface-low p-3 text-[14px] text-ink-2">
            {repair.mode === 'clip'
              ? `Only the ${bad.length} flagged ${bad.length === 1 ? 'clip' : 'clips'} ${bad.length === 1 ? 'is' : 'are'} re-recorded. Your ${acc} accepted clips stay accepted. The full ${inr(sub.total)} is paid once the fix is approved.`
              : repair.mode === 'full_take'
                ? `Room jobs are one continuous conversation, so the whole take is recorded again with the same people. Everyone consents again. The full ${inr(sub.total)} is paid once the new take is approved.`
                : 'A participant needs to renew their consent before this take can be reviewed.'}
          </div>
          <div className="mt-5 flex flex-col gap-2">
            <Btn full icon="mic" onClick={() => a.startRepair(sub.id)}>
              {repair.mode === 'clip' ? `Re-record ${bad.length} ${bad.length === 1 ? 'clip' : 'clips'}` : 'Record the room take again'}
            </Btn>
            <div className="flex gap-2">
              <Btn full v="outlined" onClick={() => (a.pop(), a.toast('Saved. You have 7 days to fix this.'))}>
                Later
              </Btn>
              <Btn full v="outlined" onClick={() => setAppealOpen(true)}>
                Appeal
              </Btn>
            </div>
          </div>
        </div>
      )}

      {appealOpen && (
        <div className="mx-5 mt-3 rounded-lg bg-surface p-5">
          <div className="text-[17px] font-semibold">Appeal this decision</div>
          <ul className="mt-2 space-y-1 text-[14px] text-ink-2">
            <li>• A third reviewer who hasn't seen it re-checks the flagged {room ? 'take' : 'clip'}.</li>
            <li>• Decision in 2–3 days. It is final.</li>
            <li>• Open for 7 days from the decision.</li>
          </ul>
          <Btn full className="mt-4" onClick={() => (a.appeal(sub.id), setAppealOpen(false))}>
            Send appeal
          </Btn>
        </div>
      )}

      {(sub.status === 'under_review' || sub.status === 'appeal') && (
        <div className="mx-5 mt-5 rounded-lg bg-surface p-5">
          <Label>What's happening</Label>
          <ol className="mt-3 space-y-3">
            {[
              ['Submitted', 'Feul received every clip', true],
              ['Under review', sub.waitReason, true],
              ['Approved', `${inr(sub.total)} moves to Available`, false],
            ].map(([h, b, on], i) => (
              <li key={i} className="flex gap-3">
                <span className={`mt-1 h-3 w-3 shrink-0 rounded-full ${on ? (i === 1 ? 'bg-signal ring-4 ring-signal-soft' : 'bg-ultra') : 'border-2 border-line-strong'}`} />
                <div>
                  <div className="text-[15px] font-semibold">{h as string}</div>
                  <div className="text-[14px] text-ink-2">{b as string}</div>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-[13px] text-ink-3">Reviewers check language match, clarity, background voices and duplicates. You don't need to do anything.</p>
        </div>
      )}

      <div className="mt-6 px-5">
        <Label className="mb-2">{room ? 'Take' : 'Clips'}</Label>
        <ul className="divide-y divide-line rounded-lg bg-surface">
          {sub.clips.map((c, i) => (
            <li key={c.id} className="flex items-center gap-3 px-4 py-3">
              <div className="w-12 shrink-0">
                <Waveform seed={c.seed} bars={12} h={22} tone={c.state === 'accepted' ? 'ok' : c.state === 'repair_required' ? 'err' : 'muted'} />
              </div>
              <div className="min-w-0 flex-1 truncate text-[14px]">{room ? c.prompt.text : `${i + 1}. ${c.prompt.text}`}</div>
              <Status k={c.state} />
            </li>
          ))}
        </ul>
      </div>
      <button onClick={a.pop} className="mt-6 text-[15px] font-medium text-primary">
        Back
      </button>
    </div>
  )
}

export function Credited({ amount, title, pending = 0 }: { amount: number; title: string; pending?: number }) {
  const { s, a } = useStore()
  const shown = useCountUp(amount, 1100)
  const reached = s.available >= 100
  const partial = pending > 0
  return (
    <div className="flex flex-1 flex-col px-5 pt-10 pb-8">
      <MoneyMoment
        id={`credit-${title}-${amount}`}
        amount={amount}
        tone="earned"
        eyebrow={partial ? 'Part of this job is paid' : 'You earned'}
        line={`${title} was approved. It's in your Available balance now.`}
        detail={s.available >= 100 ? 'You can withdraw now' : `${inr(Math.max(0, 100 - s.available))} to your first withdrawal`}
        cta="See details"
      />
      <div className="anim-rise relative isolate overflow-hidden rounded-[28px] bg-lime px-6 pt-7 pb-7 text-ink">
        {/* The orb's sheen, carried through to the payoff */}
        <div aria-hidden className="absolute -top-20 -right-20 -z-10 h-60 w-60 overflow-hidden rounded-full bg-white/35">
          <span className="orb-sheen absolute inset-0 rounded-full" />
        </div>
        <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-ink px-3 text-[12px] font-semibold text-lime">
          <Icon n="check" s={13} /> {partial ? 'Partly approved' : 'Approved'}
        </span>
        <div className="num mt-6 text-[80px] leading-none font-semibold tracking-[-0.05em]">+{inr(shown)}</div>
        <p className="mt-3 text-[15px] font-medium text-ink/70">{title} · now in Available</p>
      </div>

      {partial && (
        <div className="anim-rise mt-3 flex items-center gap-4 rounded-[24px] bg-surface p-5" style={{ animationDelay: '80ms' }}>
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-signal-soft text-[#c2410c]">
            <Icon n="retry" s={18} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-semibold"><span className="num">{inr(pending)}</span> waiting on one fix</div>
            <p className="mt-0.5 text-[13px] leading-snug text-ink-2">One turn needs a retake. Fix it within 7 days to get the rest.</p>
          </div>
          <Btn size="sm" v="tonal" onClick={() => a.setTab('home')}>Fix</Btn>
        </div>
      )}

      <div className="anim-rise mt-3 rounded-[24px] bg-surface p-5" style={{ animationDelay: '140ms' }}>
        <PillProgress value={Math.min(s.available, 100)} max={100} tone="ultra" label={`${inr(s.available)} available`} right={reached ? 'Ready to withdraw' : `${inr(100 - s.available)} to go`} />
        <p className="mt-3 text-[13px] text-ink-2">{reached ? 'You can send this to your UPI now.' : 'Withdrawals open at ₹100. One more job gets you there.'}</p>
      </div>

      <div className="anim-rise mt-auto flex flex-col gap-2 pt-10" style={{ animationDelay: '220ms' }}>
        <Btn full size="lg" onClick={() => a.setTab('wallet')}>
          {reached ? 'Withdraw' : 'See wallet'}
        </Btn>
        <Btn full v="text" onClick={() => a.setTab('home')}>
          Find the next job
        </Btn>
      </div>
    </div>
  )
}
