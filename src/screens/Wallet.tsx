import { useState } from 'react'
import { MIN_WITHDRAW, sel, useStore } from '../state/store'
import MoneyMoment from '../ui/MoneyMoment'
import { BackBar, Banner, Btn, Icon, PillProgress, Status, Tabs, inr } from '../ui/kit'

const DAYS = ['Wed', 'Tue', 'Mon', 'Sun', 'Sat', 'Fri', 'Thu']

const dayName = (d: number) => (d === 0 ? 'Today' : d === 1 ? 'Yesterday' : DAYS[d])

export default function Wallet() {
  const { s, a } = useStore()
  const [tab, setTab] = useState<'all' | 'earn' | 'wd'>('all')
  const [day, setDay] = useState<number | null>(null)
  const inReview = sel.inReview(s)
  const held = sel.held(s)
  const paid = sel.paidOut(s)
  const gap = Math.max(0, MIN_WITHDRAW - s.available)
  const week = sel.thisWeek(s)
  const perDay = DAYS.map((_, d) => s.ledger.filter((l) => l.day === d && l.kind !== 'withdrawal' && ['settled', 'honoured'].includes(l.state)).reduce((t, l) => t + l.amount, 0))
  const max = Math.max(1, ...perDay)
  const best = perDay.indexOf(Math.max(...perDay))
  const rows = s.ledger.filter((l) => (tab === 'all' || (tab === 'wd' ? l.kind === 'withdrawal' : l.kind !== 'withdrawal')) && (day == null || l.day === day))
  const groups = [...new Set(rows.map((l) => l.day))].sort((x, y) => x - y).map((d) => [d, rows.filter((l) => l.day === d)] as const)
  const w = s.withdrawal
  const wdBusy = w && w.status !== 'paid' && w.status !== 'failed'

  const flow = [
    { k: 'In review', v: inReview + held, bg: 'bg-peach', dot: 'bg-signal', d: held > 0 ? `${inr(held)} held for a fix` : inReview > 0 ? 'Usually within 24h' : 'Nothing waiting', go: () => a.setTab('home') },
    { k: 'Available', v: s.available, bg: 'bg-sky', dot: 'bg-ultra', d: gap > 0 ? `${inr(gap)} to minimum` : 'Ready now' },
    { k: 'Paid out', v: paid, bg: 'bg-lime-soft', dot: 'bg-lime', d: s.upi ? 'to your UPI' : 'No UPI yet' },
  ]

  return (
    <div className="pb-6">
      {/* Balance — typography carries it, no container */}
      <header className="px-5 pt-4">
        <p className="text-[15px] text-ink-2">Available to withdraw</p>
        <div className="num mt-2 text-[76px] leading-[0.9] font-semibold tracking-[-0.055em]">{inr(s.available)}</div>
        <PillProgress className="mt-6" value={s.available} max={MIN_WITHDRAW} label={`${inr(Math.min(s.available, MIN_WITHDRAW))}/${inr(MIN_WITHDRAW)}`} right={gap > 0 ? `${inr(gap)} to go` : 'Ready'} />
        <div className="mt-6">
          {gap > 0 ? (
            <p className="num text-[15px] leading-relaxed text-ink-2">
              <span className="font-semibold text-ink">{inr(gap)} more</span> and you can withdraw. That's about one short job. No fees, ever.
            </p>
          ) : (
            <Btn full size="lg" disabled={!!wdBusy} onClick={() => a.push({ name: 'withdraw' })}>
              {wdBusy ? 'Withdrawal in progress' : `Withdraw ${inr(s.available)}`}
            </Btn>
          )}
        </div>
      </header>

      {w && w.status !== 'paid' && (
        <div className="mt-4 px-5">
          <button onClick={() => a.push({ name: 'withdrawal' })} className="flex w-full items-center gap-3 rounded-[24px] bg-surface p-4 text-left">
            <Status k={w.status} />
            <span className="num flex-1 text-[14px]">
              {inr(w.amount)} · {w.status === 'failed' ? 'returned to Available' : w.expected}
            </span>
            <Icon n="chev" s={18} className="text-ink-3" />
          </button>
        </div>
      )}

      {/* Money flow — how a rupee moves */}
      <section className="mt-12 px-5">
        <h2 className="text-[20px] font-semibold tracking-[-0.01em]">Where your money is</h2>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {flow.map((f, i) => {
            const El = f.go ? 'button' : 'div'
            return (
              <El key={f.k} onClick={f.go} className={`relative flex min-h-[132px] flex-col rounded-[24px] ${f.bg} p-3.5 text-left`}>
                <span className="flex items-center gap-1.5 text-[12px] font-semibold">
                  <span className={`h-2 w-2 rounded-full ${f.dot}`} />
                  {f.k}
                </span>
                <span className="num mt-auto text-[24px] leading-none font-semibold tracking-[-0.03em]">{inr(f.v)}</span>
                <span className="mt-1.5 text-[11px] leading-snug text-ink-2">{f.d}</span>
                {i < 2 && (
                  <span aria-hidden className="absolute top-1/2 -right-[9px] z-10 grid h-4 w-4 -translate-y-1/2 place-items-center rounded-full bg-bg text-ink-3">
                    <Icon n="chev" s={12} />
                  </span>
                )}
              </El>
            )
          })}
        </div>
      </section>

      {/* Last 7 days — what you earned each day; tap a day to filter Activity */}
      <section className="mt-12 px-5">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-[20px] font-semibold tracking-[-0.01em]">Earned, last 7 days</h2>
            <p className="mt-0.5 text-[13px] text-ink-2">{week > 0 ? `Best day ${dayName(best)} · tap a day to see its jobs` : 'Approved earnings show up here by day'}</p>
          </div>
          <span className="num text-[28px] leading-none font-semibold tracking-[-0.03em]">{inr(week)}</span>
        </div>
        <div className="mt-8 grid grid-cols-7 gap-2" role="group" aria-label="Filter activity by day">
          {[...perDay].reverse().map((v, ri) => {
            const d = 6 - ri
            const on = day === d
            return (
              <button key={d} aria-label={`${dayName(d)}, ${inr(v)}`} aria-pressed={on} onClick={() => setDay(on ? null : d)} className="group flex flex-col items-center gap-2">
                <span className="relative flex h-[104px] w-full flex-col items-center justify-end">
                  {v > 0 && <span className={`num mb-1.5 text-[11px] font-semibold ${on ? 'text-ink' : 'text-ink-2'}`}>{inr(v)}</span>}
                  <span
                    className={`w-full max-w-9 rounded-[10px] transition-colors duration-200 ${v > 0 ? (on ? 'bg-ink' : d === best ? 'bg-ultra' : 'bg-peri group-hover:bg-ultra') : on ? 'bg-ink' : 'bg-line-strong/60'}`}
                    style={{ height: v > 0 ? `${Math.max(14, (v / max) * 72)}px` : 4 }}
                  />
                </span>
                <span className={`text-[12px] ${on || d === 0 ? 'font-semibold text-ink' : 'text-ink-3'}`}>{d === 0 ? 'Today' : DAYS[d].slice(0, 2)}</span>
              </button>
            )
          })}
        </div>
      </section>

      {/* Payout destination */}
      <section className="mt-12 px-5">
        {s.upi ? (
          <button onClick={() => a.openSheet('upi')} className="flex w-full items-center gap-4 text-left">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-lime text-[13px] font-bold">UPI</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[16px] font-semibold">{s.upi.vpa}</span>
              <span className="flex items-center gap-1 text-[13px] text-ok">
                <Icon n="check" s={13} /> Name matched · payouts land here
              </span>
            </span>
            <Icon n="chev" s={18} className="text-ink-3" />
          </button>
        ) : (
          <div className="flex items-center gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-surface text-[13px] font-bold text-ink-3">UPI</span>
            <span className="flex-1">
              <span className="block text-[16px] font-semibold">Add where we pay you</span>
              <span className="block text-[13px] text-ink-2">Takes a minute. Name must match yours.</span>
            </span>
            <Btn size="sm" v="tonal" onClick={() => a.push({ name: 'withdraw' })}>
              Add UPI
            </Btn>
          </div>
        )}
      </section>

      {/* Activity */}
      <section className="mt-12 px-5">
        <h2 className="mb-4 text-[20px] font-semibold tracking-[-0.01em]">Activity</h2>
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { k: 'all', l: 'All' },
            { k: 'earn', l: 'Earnings' },
            { k: 'wd', l: 'Withdrawals' },
          ]}
        />
        {day != null && (
          <button onClick={() => setDay(null)} className="mt-4 inline-flex h-8 items-center gap-1.5 rounded-full bg-sky px-3 text-[13px] font-medium text-on-primary-soft">
            Showing {dayName(day)} <Icon n="close" s={14} />
          </button>
        )}
        {rows.length === 0 && <p className="py-12 text-center text-[15px] text-ink-2">{s.ledger.length ? 'Nothing here for this filter.' : 'No money movement yet. Your first job shows up here once submitted.'}</p>}
        {groups.map(([d, ls]) => (
          <div key={d} className="mt-7">
            <div className="mb-1 text-[13px] font-medium text-ink-3">{dayName(d)}</div>
            <ul>
              {ls.map((l) => {
                const wd = l.kind === 'withdrawal'
                const tint = wd ? 'bg-lime-soft' : l.state === 'settled' || l.state === 'honoured' ? 'bg-sky' : l.state === 'failed' ? 'bg-surface-high' : 'bg-peach'
                return (
                  <li key={l.id} className="flex gap-4 py-3.5">
                    <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${tint}`}>
                      <Icon n={wd ? 'upload' : l.kind === 'bonus' ? 'check' : 'mic'} s={17} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="truncate text-[16px] font-semibold">{l.title}</span>
                        <span className={`num shrink-0 text-[16px] font-semibold ${l.state === 'failed' ? 'text-ink-3 line-through' : ''}`}>
                          {l.amount > 0 ? '+' : '−'}
                          {inr(l.amount)}
                        </span>
                      </div>
                      <p className="mt-1 text-[13px] leading-snug text-pretty text-ink-2">{l.note ?? l.when}</p>
                      <div className="mt-2">
                        <Status k={l.state} />
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </section>
    </div>
  )
}

/* Withdrawal: Add UPI → Name match → Amount → Confirm → (request created) */
export function Withdraw() {
  const { s, a } = useStore()
  const [step, setStep] = useState<'upi' | 'amount' | 'confirm'>(s.upi ? 'amount' : 'upi')
  const [vpa, setVpa] = useState('priya.sharma@okaxis')
  const [check, setCheck] = useState<'idle' | 'checking' | 'mismatch' | 'unavailable' | 'matched'>('idle')
  const [amt, setAmt] = useState(s.available)
  const [busy, setBusy] = useState(false)
  const validVpa = /^[\w.-]{2,}@[a-z]{2,}$/i.test(vpa)
  const gap = Math.max(0, MIN_WITHDRAW - amt)

  if (step === 'upi')
    return (
      <div className="flex flex-1 flex-col">
        <BackBar title="Add UPI" />
        <div className="flex flex-1 flex-col px-6 pb-8">
          <h1 className="text-[24px] leading-tight font-semibold">Where should we pay you?</h1>
          <p className="mt-2 text-[15px] text-ink-2">The UPI name must match the name on your Feul account ({s.name.toUpperCase()} SHARMA).</p>
          <label className="mt-6 block">
            <span className="text-[13px] text-ink-2">UPI ID</span>
            <input value={vpa} onChange={(e) => (setVpa(e.target.value), setCheck('idle'))} className={`mt-1 h-14 w-full rounded-md border bg-surface px-4 text-[17px] outline-none focus:ring-2 focus:ring-primary-soft ${vpa && !validVpa ? 'border-err' : 'border-line-strong'}`} />
          </label>
          {vpa && !validVpa && <p className="mt-2 text-[14px] text-err">A UPI ID looks like name@bank.</p>}
          <div className="mt-5">
            {check === 'checking' && <Banner tone="info" title="Checking the name with your bank…">This takes a few seconds.</Banner>}
            {check === 'matched' && <Banner tone="ok" title="Name matched">PRIYA SHARMA · {vpa}</Banner>}
            {check === 'mismatch' && (
              <Banner tone="err" title="Name doesn't match">
                The bank returned a different name for this UPI ID. Use a UPI in your own name, or update your Feul name if it's wrong.
              </Banner>
            )}
            {check === 'unavailable' && (
              <Banner tone="warn" title="Verification is temporarily unavailable">
                Your details aren't wrong. The bank's verification service isn't responding. Try again in a few minutes.
              </Banner>
            )}
          </div>
          <div className="mt-auto flex flex-col gap-2 pt-8">
            {check === 'matched' ? (
              <Btn full size="lg" onClick={() => setStep('amount')}>
                Continue
              </Btn>
            ) : (
              <Btn full size="lg" disabled={!validVpa} loading={check === 'checking'} onClick={() => (setCheck('checking'), a.verifyUpi(vpa, (r) => setCheck(r)))}>
                {check === 'idle' ? 'Verify name' : 'Try again'}
              </Btn>
            )}
            {check === 'mismatch' && (
              <Btn full v="text" onClick={() => a.openSheet('edit')}>
                Edit my name
              </Btn>
            )}
          </div>
        </div>
      </div>
    )

  if (step === 'amount')
    return (
      <div className="flex flex-1 flex-col">
        <BackBar title="Withdraw" />
        <div className="flex flex-1 flex-col px-6 pb-8">
          <div className="text-[14px] text-ink-2">
            Available <span className="num font-semibold text-ink">{inr(s.available)}</span>
          </div>
          <div className="mt-6 flex items-baseline gap-1">
            <span className="text-[40px] font-semibold text-ink-3">₹</span>
            <input aria-label="Amount" inputMode="numeric" value={amt} onChange={(e) => setAmt(Math.min(s.available, Number(e.target.value.replace(/\D/g, '')) || 0))} className="num w-full bg-transparent text-[64px] leading-none font-semibold tracking-[-0.04em] outline-none" />
          </div>
          <p className={`mt-2 text-[15px] ${gap > 0 ? 'text-err' : 'text-ink-2'}`}>{gap > 0 ? <span className="num">{inr(gap)} more to reach the ₹100 minimum</span> : 'No fee. The full amount reaches your UPI.'}</p>
          <div className="mt-5 flex gap-2">
            {[100, 200, s.available].filter((v, i, arr) => v <= s.available && arr.indexOf(v) === i).map((v) => (
              <button key={v} onClick={() => setAmt(v)} className={`num h-10 rounded-full border px-4 text-[14px] ${amt === v ? 'border-ink bg-ink text-white' : 'border-line-strong'}`}>
                {v === s.available ? `All ${inr(v)}` : inr(v)}
              </button>
            ))}
          </div>
          <div className="mt-8 flex items-center justify-between rounded-md bg-surface p-4">
            <div>
              <div className="text-[13px] text-ink-2">To</div>
              <div className="text-[15px] font-medium">{s.upi?.vpa}</div>
            </div>
            <span className="flex items-center gap-1 text-[12px] text-ok">
              <Icon n="check" s={13} /> Name matched
            </span>
          </div>
          <div className="mt-auto pt-8">
            <Btn full size="lg" disabled={gap > 0} onClick={() => setStep('confirm')}>
              Review withdrawal
            </Btn>
          </div>
        </div>
      </div>
    )

  return (
    <div className="flex flex-1 flex-col bg-ink text-white">
      <BackBar dark onBack={() => setStep('amount')} />
      <div className="flex flex-1 flex-col px-6 pb-8">
        <div className="text-[13px] font-medium text-white/60 ">You're withdrawing</div>
        <div className="num mt-3 text-[80px] leading-none font-semibold tracking-[-0.05em]">{inr(amt)}</div>
        <dl className="mt-10 space-y-3 border-t border-white/15 pt-5 text-[15px]">
          {[
            ['To', s.upi!.vpa],
            ['Name', s.upi!.name],
            ['Fee', '₹0'],
            ['Left in Available', inr(s.available - amt)],
            ['Expected', 'by tomorrow, 6 pm · 1 working day'],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4">
              <dt className="text-white/60">{k}</dt>
              <dd className="num text-right font-medium">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-5 text-[13px] leading-snug text-white/60">Bank holidays and weekends can add a day. We'll show “Paid” only once your bank confirms, with a UTR reference.</p>
        <div className="mt-auto pt-8">
          <Btn full size="lg" v="audio" loading={busy} onClick={() => (setBusy(true), setTimeout(() => a.requestWithdrawal(amt), 900))}>
            Request withdrawal
          </Btn>
        </div>
      </div>
    </div>
  )
}

export function WithdrawalStatus() {
  const { s, a } = useStore()
  const w = s.withdrawal
  if (!w) return null
  if (w.status === 'paid')
    return (
      <div className="flex flex-1 flex-col pb-8">
        <MoneyMoment id={`paid-${w.id}`} amount={w.amount} tone="sent" eyebrow="Sent to your bank" line={`${inr(w.amount)} is in the account linked to ${w.vpa}. Your bank confirmed it.`} detail={`UTR ${w.utr}`} cta="View receipt" />
        <BackBar title="Receipt" onBack={a.clearWithdrawal} />
        <div className="px-6">
          <Status k="paid" />
          <div className="num mt-4 text-[64px] leading-none font-semibold tracking-[-0.04em]">{inr(w.amount)}</div>
          <p className="mt-3 text-[18px]">Paid to {w.vpa}. Your bank confirmed it.</p>
        </div>
        <dl className="mx-6 mt-8 divide-y divide-line rounded-[24px] bg-surface text-[15px]">
          {[
            ['UTR', w.utr!],
            ['Paid on', w.paidAt ?? 'Today, 10:14 am'],
            ['To', w.vpa],
            ['Name', s.upi?.name ?? ''],
            ['Feul reference', w.id],
            ['Requested', w.requestedAt],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 px-4 py-3.5">
              <dt className="text-ink-2">{k}</dt>
              <dd className={`num text-right font-medium ${k === 'UTR' ? 'font-mono' : ''}`}>{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mx-6 mt-3 text-[13px] text-ink-3">Your bank can trace this payment with the UTR.</p>
        <div className="mt-auto flex gap-2 px-6 pt-8">
          <Btn full v="outlined" icon="share" onClick={() => a.toast('Receipt shared')}>
            Share receipt
          </Btn>
          <Btn full onClick={a.clearWithdrawal}>
            Done
          </Btn>
        </div>
      </div>
    )

  const steps = [
    ['Requested', w.requestedAt],
    ['Processing', 'Sent to your bank via UPI'],
    ['Paid', 'Bank confirms · UTR issued'],
  ]
  const at = w.status === 'requested' ? 0 : 1
  return (
    <div className="flex flex-1 flex-col pb-8">
      <BackBar title="Withdrawal" />
      <div className="px-6">
        <Status k={w.status} />
        <div className="num mt-4 text-[56px] leading-none font-semibold tracking-[-0.04em]">{inr(w.amount)}</div>
        <p className="mt-2 text-[16px] text-ink-2">
          To {w.vpa} · {w.id}
        </p>
      </div>
      <div className="mx-6 mt-6">
        {w.status === 'failed' && (
          <Banner tone="err" title="Withdrawal didn't go through" action={<div className="flex gap-2"><Btn size="sm" onClick={() => (a.clearWithdrawal(), a.push({ name: 'withdraw' }))}>Try again</Btn><Btn size="sm" v="outlined" onClick={() => a.openSheet('help')}>Get help</Btn></div>}>
            Your bank declined the transfer. {inr(w.amount)} is back in Available. Nothing was deducted.
          </Banner>
        )}
        {w.status === 'hold' && (
          <Banner tone="warn" title="On hold for a verification check" action={<Btn size="sm" v="outlined" onClick={() => a.openSheet('help')}>Ask for a review</Btn>}>
            Some recent recordings are being checked for authenticity. This takes up to 2 working days. Your {inr(w.amount)} is safe and won't be lost.
          </Banner>
        )}
        {w.status === 'delayed' && (
          <Banner tone="warn" title="Taking longer than usual" action={<Btn size="sm" v="outlined" onClick={() => a.openSheet('help')}>Contact support</Btn>}>
            Your bank hasn't confirmed yet. Delays usually clear within a working day. This isn't paid until it says Paid.
          </Banner>
        )}
      </div>
      {w.status !== 'failed' && (
        <ol className="mx-6 mt-6 space-y-4">
          {steps.map(([h, b], i) => (
            <li key={h} className="flex gap-3">
              <span className={`mt-1 h-3 w-3 shrink-0 rounded-full ${i < at ? 'bg-ultra' : i === at ? 'bg-signal ring-4 ring-signal-soft' : 'border-2 border-line-strong'}`} />
              <div>
                <div className="text-[16px] font-semibold">{h}</div>
                <div className="text-[14px] text-ink-2">{i === 2 ? `Expected ${w.expected}` : b}</div>
              </div>
            </li>
          ))}
        </ol>
      )}
      <p className={`mx-6 mt-6 text-[14px] text-ink-2 ${w.status === 'failed' ? 'hidden' : ''}`}>Not paid yet. You'll get a notification with the UTR when the bank confirms.</p>
      <div className="mt-auto px-6 pt-8">
        <Btn full v="outlined" icon="help" onClick={() => a.openSheet('help')}>
          Help with this withdrawal
        </Btn>
      </div>
    </div>
  )
}
