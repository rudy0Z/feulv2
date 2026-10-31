import { useState } from 'react'
import { LANGS, type Lang } from '../state/model'
import { useStore } from '../state/store'
import { Btn, SheetFrame } from '../ui/kit'
import { FilterSheet } from './Jobs'

export default function Sheets() {
  const { s, a } = useStore()
  if (!s.sheet) return null
  const close = a.closeSheet
  switch (s.sheet) {
    case 'notifications':
      return (
        <SheetFrame title="Notifications" onClose={() => (a.readNotices(), close())}>
          {s.notices.length === 0 && <p className="py-6 text-center text-[15px] text-ink-2">Review results, payments and data-rights updates will show here.</p>}
          <ul className="divide-y divide-line">
            {s.notices.map((n) => (
              <li key={n.id}>
                <button
                  onClick={() => {
                    a.readNotices()
                    if ('tab' in n.target) a.setTab(n.target.tab)
                    else a.push(n.target)
                  }}
                  className="flex w-full gap-3 py-3.5 text-left"
                >
                  <span className={`mt-2 h-2 w-2 shrink-0 rounded-full ${n.unread ? 'bg-primary-hi' : 'bg-transparent'}`} />
                  <span className="flex-1">
                    <span className="flex justify-between gap-2">
                      <span className="text-[15px] font-semibold">{n.title}</span>
                      <span className="text-[12px] text-ink-3">{n.when}</span>
                    </span>
                    <span className="block text-[14px] leading-snug text-ink-2">{n.body}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </SheetFrame>
      )
    case 'filters':
      return (
        <SheetFrame title="Filters" onClose={close}>
          <FilterSheet />
        </SheetFrame>
      )
    case 'help':
      return (
        <SheetFrame title="Help" onClose={close}>
          <ul className="space-y-3 text-[15px]">
            <li className="rounded-md bg-surface-low p-4">
              <div className="font-semibold">Chat with support</div>
              <div className="text-ink-2">Replies in {LANGS[s.lang].name} within 4 hours, 9 am–9 pm.</div>
            </li>
            <li className="rounded-md bg-surface-low p-4">
              <div className="font-semibold">Call 1800 309 4410</div>
              <div className="text-ink-2">Toll-free · payments and account issues</div>
            </li>
            <li className="rounded-md bg-surface-low p-4">
              <div className="font-semibold">Grievance officer</div>
              <div className="text-ink-2">For data-rights requests under the DPDP Act</div>
            </li>
          </ul>
          <Btn full className="mt-5" onClick={() => (close(), a.toast('Support request sent'))}>
            Start a support request
          </Btn>
        </SheetFrame>
      )
    case 'edit':
      return <EditSheet />
    case 'prefs':
      return <PrefsSheet />
    case 'upi':
      return (
        <SheetFrame title="UPI" onClose={close}>
          <p className="text-[15px]">{s.upi?.vpa}</p>
          <p className="text-[14px] text-ink-2">{s.upi?.name} · name matched</p>
          <p className="mt-3 text-[14px] text-ink-2">Changing UPI re-runs the name check. Withdrawals already in progress keep their original destination.</p>
          <Btn full v="outlined" className="mt-5" onClick={() => (close(), a.push({ name: 'withdraw' }))}>
            Change UPI
          </Btn>
        </SheetFrame>
      )
    default:
      return null
  }
}

function EditSheet() {
  const { s, a } = useStore()
  const [name, setName] = useState(s.name)
  const [lang, setLang] = useState<Lang>(s.lang)
  return (
    <SheetFrame title="Name and languages" onClose={a.closeSheet}>
      <label className="block">
        <span className="text-[13px] text-ink-2">First name (must match your UPI)</span>
        <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 h-12 w-full rounded-md border border-line-strong px-4 text-[16px] outline-none focus:ring-2 focus:ring-primary-soft" />
      </label>
      <div className="mt-5 text-[13px] text-ink-2">Working language</div>
      <div className="mt-2 flex flex-wrap gap-2">
        {(Object.keys(LANGS) as Lang[]).map((k) => (
          <button key={k} onClick={() => setLang(k)} className={`h-10 rounded-full border px-4 text-[15px] ${lang === k ? 'border-ink bg-ink text-white' : 'border-line-strong'}`}>
            {LANGS[k].native}
          </button>
        ))}
      </div>
      <p className="mt-3 text-[13px] text-ink-3">Changing language shows jobs in that language. You'll be asked to consent again in the new language before recording.</p>
      <Btn
        full
        className="mt-5"
        disabled={!name.trim()}
        onClick={() => {
          a.setName(name.trim())
          a.chooseLang(lang)
          a.closeSheet()
          a.toast('Profile updated')
        }}
      >
        Save
      </Btn>
    </SheetFrame>
  )
}

function PrefsSheet() {
  const { a } = useStore()
  const [p, setP] = useState({ review: true, pay: true, jobs: false, data: true })
  const rows: [keyof typeof p, string, string][] = [
    ['review', 'Review results', 'Approved, repair required, appeals'],
    ['pay', 'Payments', 'Withdrawal processing, paid, failed'],
    ['jobs', 'New jobs in my language', 'At most once a day'],
    ['data', 'Data-rights updates', 'Required for deletion receipts'],
  ]
  return (
    <SheetFrame title="Notifications" onClose={a.closeSheet}>
      <ul className="divide-y divide-line">
        {rows.map(([k, l, d]) => (
          <li key={k} className="flex items-center justify-between gap-4 py-3.5">
            <div>
              <div className="text-[15px] font-medium">{l}</div>
              <div className="text-[13px] text-ink-2">{d}</div>
            </div>
            <button role="switch" aria-checked={p[k]} disabled={k === 'data'} onClick={() => setP({ ...p, [k]: !p[k] })} className={`relative h-7 w-12 rounded-full transition disabled:opacity-60 ${p[k] ? 'bg-ink' : 'bg-surface-variant'}`}>
              <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${p[k] ? 'left-6' : 'left-1'}`} />
            </button>
          </li>
        ))}
      </ul>
    </SheetFrame>
  )
}
