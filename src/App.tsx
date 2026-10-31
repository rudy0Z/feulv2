import { useEffect, useRef, useState } from 'react'
import { type State, type View, type Withdrawal } from './state/model'
import { StoreProvider, useStore } from './state/store'
import { BottomNav, TopBar } from './ui/kit'
import { Auth, Consent, Landing, Language, MicPrime, Otp } from './screens/Onboarding'
import Home from './screens/Home'
import Jobs, { JobDetail } from './screens/Jobs'
import Studio from './screens/Studio'
import Review, { Credited, Submission } from './screens/Review'
import Wallet, { Withdraw, WithdrawalStatus } from './screens/Wallet'
import Profile from './screens/Profile'
import Sheets from './screens/Sheets'

function ViewScreen({ v }: { v: View }) {
  switch (v.name) {
    case 'detail':
      return <JobDetail id={v.jobId} />
    case 'studio':
      return <Studio />
    case 'review':
      return <Review />
    case 'submission':
      return <Submission id={v.id} />
    case 'credited':
      return <Credited amount={v.amount} title={v.title} pending={v.pending} />
    case 'withdraw':
      return <Withdraw />
    case 'withdrawal':
      return <WithdrawalStatus />
    case 'profile':
      return <Profile />
    case 'consent':
      return <Consent inApp />
    case 'mic':
      return <MicPrime inApp />
  }
}

function StatusBar({ dark, overlay }: { dark: boolean; overlay?: boolean }) {
  return (
    <div className={`z-40 flex h-[54px] shrink-0 items-end justify-between px-8 pb-2.5 text-[15px] font-semibold transition-colors ${overlay ? 'absolute inset-x-0 top-0 text-(--sb-ink,var(--color-ink))' : dark ? 'relative bg-carbon text-white' : 'relative text-ink'}`}>
      <span className="num w-14">9:41</span>
      <span aria-hidden className="absolute top-[11px] left-1/2 h-[34px] w-[122px] -translate-x-1/2 rounded-full bg-black" />
      <span aria-hidden className="flex w-14 items-center justify-end gap-1.5">
        <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor"><rect x="0" y="7" width="3" height="4" rx="1" /><rect x="4.5" y="5" width="3" height="6" rx="1" /><rect x="9" y="2.5" width="3" height="8.5" rx="1" /><rect x="13.5" y="0" width="3" height="11" rx="1" /></svg>
        <svg width="25" height="12" viewBox="0 0 25 12" fill="none"><rect x="0.5" y="0.5" width="21" height="11" rx="3.5" stroke="currentColor" opacity=".4" /><rect x="2" y="2" width="16" height="8" rx="2" fill="currentColor" /><rect x="23" y="4" width="1.5" height="4" rx=".75" fill="currentColor" opacity=".4" /></svg>
      </span>
    </div>
  )
}

function Phone() {
  const { s } = useStore()
  const scroller = useRef<HTMLDivElement>(null)
  const top = s.stack.at(-1)
  const key = s.stage !== 'done' ? s.stage : top ? `${s.stack.length}-${top.name}` : s.tab
  useEffect(() => {
    scroller.current?.scrollTo(0, 0)
  }, [key])
  const dark = false

  let body
  if (s.stage !== 'done') {
    body = { landing: <Landing />, auth: <Auth />, otp: <Otp />, language: <Language />, consent: <Consent />, mic: <MicPrime /> }[s.stage]
  } else if (top) {
    body = <ViewScreen v={top} />
  } else {
    body = (
      <>
        <TopBar />
        {s.tab === 'home' ? <Home /> : s.tab === 'jobs' ? <Jobs /> : <Wallet />}
      </>
    )
  }
  const showNav = s.stage === 'done' && !top
  return (
    <div className={`relative flex h-full flex-col overflow-hidden ${dark ? 'bg-carbon' : 'app-bg'}`}>
      <StatusBar dark={dark} overlay={s.stage !== 'done'} />
      <div ref={scroller} key={key} className="anim-fade no-scrollbar flex-1 overflow-y-auto overscroll-contain">
        <div className={`flex min-h-full flex-col ${showNav ? 'pb-[120px]' : 'pb-6'}`}>{body}</div>
      </div>
      {showNav && <BottomNav />}
      <Sheets />
      {s.toast && (
        <div role="status" className="anim-fade absolute inset-x-4 bottom-28 z-50 rounded-md bg-inverse px-4 py-3 text-[14px] text-white shadow-lg">
          {s.toast}
        </div>
      )}
      <span aria-hidden className={`pointer-events-none absolute bottom-2 left-1/2 z-[60] h-[5px] w-[134px] -translate-x-1/2 rounded-full ${dark ? 'bg-white/80' : 'bg-ink/85'}`} />
    </div>
  )
}

type Page = { label: string; hint: string; go: (a: ReturnType<typeof useStore>['a']) => void }
const W = (status: Withdrawal['status'], extra: Partial<Withdrawal> = {}) => (s: State): Partial<State> => ({ tab: 'wallet', stack: [{ name: 'withdrawal' }], withdrawal: s.withdrawal && { ...s.withdrawal, status, ...extra } })
const FLOWS: { title: string; pages: Page[] }[] = [
  {
    title: 'Onboarding',
    pages: [
      { label: 'Landing', hint: 'Fresh install', go: (a) => a.goto('fresh') },
      { label: 'Phone sign-in', hint: 'OTP is 123456', go: (a) => a.goto('fresh', () => ({ stage: 'auth' })) },
      { label: 'Language', hint: 'Native scripts', go: (a) => a.goto('fresh', () => ({ stage: 'language' })) },
      { label: 'Consent', hint: '18+ · DPDP', go: (a) => a.goto('fresh', () => ({ stage: 'consent' })) },
      // Archived: MicPrime — the OS permission prompt replaces it; mic use is disclosed in Consent.
    ],
  },
  {
    title: 'Home states',
    pages: [
      { label: 'New contributor', hint: 'First ₹100 path', go: (a) => a.goto('new') },
      { label: 'Returning', hint: '₹82 available', go: (a) => a.goto('returning') },
      { label: 'Resume session', hint: 'Saved 24h', go: (a) => a.goto('active') },
      { label: 'Upload failed', hint: 'Not a rejection', go: (a) => a.goto('uploadFailed') },
      { label: 'Resume expired', hint: 'Clips lost', go: (a) => a.goto('expired') },
      { label: 'No matching work', hint: 'Honest empty', go: (a) => a.goto('noWork') },
      { label: 'Notifications', hint: 'Deep links', go: (a) => a.goto('returning', () => ({ sheet: 'notifications' })) },
    ],
  },
  {
    title: 'Find & record',
    pages: [
      { label: 'Jobs list', hint: 'Search · filters', go: (a) => a.goto('returning', () => ({ tab: 'jobs' })) },
      { label: 'Job detail · Scenario', hint: 'Pay breakdown', go: (a) => a.goto('returning', () => ({ tab: 'jobs', stack: [{ name: 'detail', jobId: 'j-shop-hi' }] })) },
      { label: 'Job detail · Interview', hint: 'Answer prompts', go: (a) => a.goto('returning', () => ({ tab: 'jobs', stack: [{ name: 'detail', jobId: 'j-clinic-hi' }] })) },
      { label: 'Studio', hint: 'AI conversation', go: (a) => a.goto('active', () => ({ stack: [{ name: 'studio' }] })) },
      { label: 'Review & submit', hint: 'Before upload', go: (a) => a.goto('uploadFailed', () => ({ stack: [{ name: 'review' }] })) },
    ],
  },
  {
    title: 'Review & repair',
    pages: [
      { label: 'Under review', hint: 'Timeline', go: (a) => a.goto('returning', () => ({ stack: [{ name: 'submission', id: 'S-shop' }] })) },
      { label: 'Repair · Scenario', hint: 'Redo 1 turn', go: (a) => a.goto('repairLines', () => ({ stack: [{ name: 'submission', id: 'S-lines' }] })) },
      { label: 'Earning credited', hint: '+₹42', go: (a) => a.goto('returning', () => ({ stack: [{ name: 'credited', amount: 42, title: 'Local shop conversation' }] })) },
      { label: 'Partly approved', hint: '₹30 + ₹12 fix', go: (a) => a.goto('returning', () => ({ stack: [{ name: 'credited', amount: 30, pending: 12, title: 'Local shop conversation' }] })) },
    ],
  },
  {
    title: 'Wallet',
    pages: [
      { label: 'Wallet', hint: 'Ledger', go: (a) => a.goto('returning', () => ({ tab: 'wallet' })) },
      { label: 'Withdraw', hint: 'UPI → amount', go: (a) => a.goto('returning', () => ({ tab: 'wallet', available: 142, stack: [{ name: 'withdraw' }] })) },
      { label: 'Processing', hint: 'No UTR yet', go: (a) => a.goto('withdrawProcessing', W('processing')) },
      { label: 'Paid receipt', hint: 'With UTR', go: (a) => a.goto('withdrawProcessing', W('paid', { utr: '412893018842' })) },
      { label: 'Delayed', hint: 'Bank slow', go: (a) => a.goto('withdrawProcessing', W('delayed')) },
      { label: 'Failed', hint: 'Money returned', go: (a) => a.goto('withdrawProcessing', W('failed')) },
      { label: 'On hold', hint: 'Check pending', go: (a) => a.goto('withdrawProcessing', W('hold')) },
    ],
  },
  {
    title: 'Profile & data',
    pages: [
      { label: 'Profile & data vault', hint: 'Revoke · delete', go: (a) => a.goto('returning', () => ({ stack: [{ name: 'profile' }] })) },
      { label: 'Name & language', hint: 'Re-consent', go: (a) => a.goto('returning', () => ({ stack: [{ name: 'profile' }], sheet: 'edit' })) },
    ],
  },
]

function FlowNav() {
  const { a } = useStore()
  const [active, setActive] = useState(() => decodeURIComponent(location.hash.slice(1)) || 'Landing')
  useEffect(() => {
    FLOWS.flatMap((f) => f.pages).find((p) => p.label === active)?.go(a)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <nav aria-label="App flows" className="flex h-full w-[264px] shrink-0 flex-col border-e border-black/[.06] bg-white/70 backdrop-blur max-[1100px]:hidden">
      <div className="px-6 pt-7 pb-5">
        <div className="text-[22px] font-semibold tracking-[-0.02em]">FEUL</div>
        <div className="mt-0.5 text-[13px] font-medium text-ink-3 ">Prototype · flows</div>
      </div>
      <div className="no-scrollbar flex-1 space-y-6 overflow-y-auto px-3 pb-8">
        {FLOWS.map((f, fi) => (
          <section key={f.title}>
            <h2 className="mb-1.5 flex items-center gap-2 px-3 text-[12px] font-semibold text-ink-3">
              <span className="num font-mono text-[11px]">{String(fi + 1).padStart(2, '0')}</span>
              {f.title}
            </h2>
            <ul>
              {f.pages.map((p) => {
                const on = active === p.label
                return (
                  <li key={p.label}>
                    <button
                      aria-current={on ? 'page' : undefined}
                      onClick={() => (setActive(p.label), history.replaceState(null, '', '#' + encodeURIComponent(p.label)), p.go(a))}
                      className={`flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-start text-[14px] transition-colors ${on ? 'bg-ink text-white' : 'text-ink hover:bg-black/[.04]'}`}
                    >
                      <span className="truncate">{p.label}</span>
                      <span className={`shrink-0 text-[12px] ${on ? 'text-white/60' : 'text-ink-3'}`}>{p.hint}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
    </nav>
  )
}

function DemoPanel() {
  const { s, a } = useStore()
  const [open, setOpen] = useState(true)
  const subs = s.submissions.filter((x) => x.status === 'under_review' || x.status === 'appeal')
  const btn = 'w-full rounded-md border border-line px-3 py-2 text-left text-[13px] transition-colors hover:bg-surface-low disabled:opacity-40'
  return (
    <aside className={`fixed top-6 right-6 z-50 rounded-lg bg-surface text-ink shadow-[0_0_0_1px_rgba(14,15,20,.06),0_8px_30px_rgba(14,15,20,.08)] max-[800px]:top-auto max-[800px]:bottom-4 ${open ? 'w-[248px]' : 'w-auto'}`}>
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between px-4 py-3 text-[13px] font-medium text-ink-2 ">
        Simulate events {open ? '−' : '+'}
      </button>
      {open && (
        <div className="max-h-[70vh] space-y-4 overflow-y-auto px-3 pb-4">
          <label className="hidden px-1 text-[12px] max-[1100px]:block">
            Jump to screen
            <select
              className="mt-1 w-full rounded-md border border-line px-2 py-2 text-[14px]"
              defaultValue=""
              onChange={(e) => FLOWS.flatMap((f) => f.pages).find((p) => p.label === e.target.value)?.go(a)}
            >
              <option value="" disabled>Choose a screen</option>
              {FLOWS.map((f) => (
                <optgroup key={f.title} label={f.title}>
                  {f.pages.map((p) => (
                    <option key={p.label}>{p.label}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
          <div className="space-y-1">
            <div className="px-1 text-[11px] font-semibold text-ink-3 uppercase">Review system</div>
            {subs.length === 0 && <p className="px-1 text-[12px] text-ink-3">Submit a job to simulate review.</p>}
            {subs.map((x) => (
              <div key={x.id} className="flex gap-1">
                <button className={btn} onClick={() => a.approve(x.id)}>
                  Approve
                </button>
                <button className={btn} onClick={() => a.partial(x.id)}>
                  Reject part
                </button>
              </div>
            ))}
          </div>
          <div className="space-y-1">
            <div className="px-1 text-[11px] font-semibold text-ink-3 uppercase">Withdrawal</div>
            <div className="grid grid-cols-2 gap-1">
              {(['paid', 'delayed', 'failed', 'hold'] as const).map((k) => (
                <button key={k} disabled={!s.withdrawal || s.withdrawal.status === 'paid' || s.withdrawal.status === 'failed'} className={btn} onClick={() => a.advanceWithdrawal(k)}>
                  → {k}
                </button>
              ))}
            </div>
            <label className="flex items-center justify-between px-1 pt-1 text-[12px]">
              UPI check
              <select value={s.sim.upiResult} onChange={(e) => a.setSim({ upiResult: e.target.value as any })} className="rounded border border-line px-1 py-0.5">
                <option value="matched">matched</option>
                <option value="mismatch">mismatch</option>
                <option value="unavailable">unavailable</option>
              </select>
            </label>
          </div>
          <div className="space-y-1">
            <div className="px-1 text-[11px] font-semibold text-ink-3 uppercase">Session & campaign</div>
            <label className="flex items-center gap-2 px-1 text-[12px]">
              <input type="checkbox" checked={s.sim.failUpload} onChange={(e) => a.setSim({ failUpload: e.target.checked })} />
              Next upload fails
            </label>
            <button className={btn} disabled={!s.session || s.session.status === 'expired'} onClick={a.expireSession}>
              Expire resume window
            </button>
            <button className={btn} onClick={a.closeCampaign}>
              Close campaign of in-flight job
            </button>
          </div>
          <div className="space-y-1">
            <div className="px-1 text-[11px] font-semibold text-ink-3 uppercase">Studio</div>
            <div className="grid grid-cols-2 gap-1.5">
              <button className={btn} onClick={() => window.dispatchEvent(new CustomEvent('feul:sim', { detail: 'mic-lost' }))}>Mic lost</button>
              <button className={btn} onClick={() => window.dispatchEvent(new CustomEvent('feul:sim', { detail: 'prompt-fail' }))}>AI line fails</button>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <div className="flex h-screen bg-[#e9ebf1] max-[480px]:bg-bg">
        <FlowNav />
        <main className="flex flex-1 items-center justify-center overflow-auto p-6 max-[480px]:p-0">
          <div className="relative shrink-0 rounded-[62px] bg-[#111217] p-[11px] shadow-[0_0_0_1.5px_#2a2c34,0_40px_90px_rgba(14,15,20,.28)] [zoom:min(1,calc((100vh-48px)/866px))] max-[480px]:rounded-none max-[480px]:p-0 max-[480px]:shadow-none max-[480px]:[zoom:1]">
            <span aria-hidden className="absolute top-[170px] -left-[3px] h-[34px] w-[3px] rounded-s bg-[#2a2c34]" />
            <span aria-hidden className="absolute top-[230px] -left-[3px] h-[62px] w-[3px] rounded-s bg-[#2a2c34]" />
            <span aria-hidden className="absolute top-[304px] -left-[3px] h-[62px] w-[3px] rounded-s bg-[#2a2c34]" />
            <span aria-hidden className="absolute top-[250px] -right-[3px] h-[96px] w-[3px] rounded-e bg-[#2a2c34]" />
            <div className="relative h-[844px] w-[390px] overflow-hidden rounded-[52px] bg-bg [transform:translateZ(0)] max-[480px]:h-[100dvh] max-[480px]:w-screen max-[480px]:rounded-none">
              <Phone />
            </div>
          </div>
        </main>
        <DemoPanel />
      </div>
    </StoreProvider>
  )
}
