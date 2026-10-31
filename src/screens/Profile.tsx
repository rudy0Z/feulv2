import { useState } from 'react'
import { FORMAT_LABEL, LANGS, type Format, type Lang } from '../state/model'
import { sel, useStore } from '../state/store'
import { BackBar, Btn, Dialog, Icon, Label, Status, inr } from '../ui/kit'

const VAULT_STATUS: Record<string, [string, string]> = {
  active: ['In use', 'x'],
  revoke_requested: ['Revocation requested', 'requested'],
  revoke_processing: ['Revocation processing', 'processing'],
  revoked: ['Future use revoked', 'settled'],
  delete_requested: ['Deletion requested', 'requested'],
  delete_processing: ['Deletion processing', 'processing'],
  deleted: ['Deletion completed', 'settled'],
}

export default function Profile() {
  const { s, a } = useStore()
  const tier = sel.tier(s)
  const [confirm, setConfirm] = useState<null | { id: string; kind: 'revoke' | 'delete' }>(null)
  const earned = s.ledger.filter((l) => l.kind === 'earning').length
  const approved = s.submissions.filter((x) => x.status === 'approved').length + s.ledger.filter((l) => l.kind === 'earning' && l.state === 'settled').length
  const craft: [Format, Lang, number][] = [
    ['SCENARIO', s.lang, Math.min(3, earned)],
    ['INTERVIEW', s.lang, Math.min(2, Math.max(0, earned - 1))],
  ]
  const item = confirm && s.vault.find((v) => v.id === confirm.id)
  return (
    <div className="relative pb-10">
      <BackBar title="Profile" right={<button aria-label="Edit profile" onClick={() => a.openSheet('edit')} className="mr-2 grid h-11 w-11 place-items-center"><Icon n="edit" s={20} /></button>} />
      <div className="px-5">
        <div className="flex items-center gap-4">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-ink text-[22px] font-semibold text-white">{s.name[0]}</span>
          <div>
            <div className="text-[22px] font-semibold">{s.name} Sharma</div>
            <div className="text-[14px] text-ink-2">
              {LANGS[s.lang].native} · contributor since Sep 2026
            </div>
          </div>
        </div>
      </div>

      <div className="mx-5 mt-6 rounded-lg bg-surface p-5">
        <div className="flex items-baseline justify-between">
          <Label>Standing</Label>
          <span className="text-[13px] text-ink-2">affects access, never base pay</span>
        </div>
        <div className="mt-3 flex items-end gap-3">
          <span className="num text-[56px] leading-none font-semibold tracking-[-0.04em]">{tier}</span>
          <span className="pb-1.5 text-[15px] text-ink-2">of 3</span>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-1">
          {[1, 2, 3].map((t) => (
            <span key={t} className={`h-1.5 rounded-full ${t <= tier ? 'bg-ultra' : 'bg-surface-variant'}`} />
          ))}
        </div>
        <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-line pt-4 text-[14px]">
          <div>
            <dt className="text-ink-2">Reliability</dt>
            <dd className="num mt-0.5 text-[18px] font-semibold">{earned ? `${Math.round((approved / Math.max(1, earned)) * 100)}%` : '—'}</dd>
            <dd className="text-[12px] text-ink-3">approved first time</dd>
          </div>
          <div>
            <dt className="text-ink-2">Settlement</dt>
            <dd className="mt-0.5 text-[18px] font-semibold">{tier >= 2 ? '1 working day' : '2 working days'}</dd>
            <dd className="text-[12px] text-ink-3">after approval</dd>
          </div>
        </dl>
        <div className="mt-4 rounded-md bg-surface-low p-3 text-[14px]">
          <span className="font-semibold">Next: standing {Math.min(3, tier + 1)}</span>
          <span className="text-ink-2"> {tier < 3 ? `unlocks ${tier === 1 ? 'Room jobs' : 'long Interview jobs'} and faster settlement.` : 'You have full access.'}</span>
        </div>
      </div>

      <div className="mt-8 px-5">
        <Label className="mb-3">Craft · format × language</Label>
        <ul className="divide-y divide-line rounded-lg bg-surface">
          {craft.map(([f, l, n]) => (
            <li key={f} className="flex items-center gap-3 px-4 py-3">
              <span className="w-24 text-[15px] font-medium">{FORMAT_LABEL[f]}</span>
              <span className="flex-1 text-[14px] text-ink-2">{LANGS[l].native}</span>
              <span className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span key={i} className={`h-2 w-5 rounded-full ${i < n ? 'audio-grad' : 'bg-surface-variant'}`} />
                ))}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[13px] text-ink-3">Craft 3 in a format makes you eligible for its quality bonus.</p>
      </div>

      <div className="mx-5 mt-8 rounded-[24px] bg-primary-soft p-5">
        <Label>Where you're valuable now</Label>
        <p className="mt-2 text-[15px] leading-relaxed">
          Labs need more <span className="font-semibold">{LANGS[s.lang].name} Scenario</span> recordings. That's why they pay up to 1.6× coverage right now. Coverage changes as campaigns fill.
        </p>
      </div>

      <div className="mt-8 px-5">
        <div className="mb-3 flex items-baseline justify-between">
          <Label>Data vault</Label>
          <span className="text-[13px] text-ink-2">{s.vault.length} items</span>
        </div>
        {s.vault.length === 0 && <p className="rounded-lg bg-surface p-4 text-[15px] text-ink-2">Nothing recorded yet. Every job you submit shows up here, and you control it.</p>}
        <ul className="space-y-2">
          {s.vault.map((v) => {
            const [label, k] = VAULT_STATUS[v.status]
            const busy = v.status !== 'active'
            return (
              <li key={v.id} className="rounded-lg bg-surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[15px] font-semibold">{v.title}</div>
                    <div className="text-[13px] text-ink-2">
                      {v.detail} · {v.paid ? `${inr(v.paid)} paid` : 'not paid yet'}
                    </div>
                  </div>
                  <Status k={k} label={label} />
                </div>
                {v.receipt && (
                  <p className="mt-2 text-[13px] text-ink-2">
                    Receipt <span className="font-mono">{v.receipt}</span>. {v.paid ? `${inr(v.paid)} stays settled.` : ''}
                  </p>
                )}
                {!busy && (
                  <div className="mt-3 flex gap-2">
                    <Btn size="sm" v="outlined" onClick={() => setConfirm({ id: v.id, kind: 'revoke' })}>
                      Stop future use
                    </Btn>
                    <Btn size="sm" v="text" className="text-err hover:bg-err-soft" onClick={() => setConfirm({ id: v.id, kind: 'delete' })}>
                      Delete
                    </Btn>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </div>

      <ul className="mx-5 mt-8 divide-y divide-line rounded-lg bg-surface text-[15px]">
        {[
          ['Name and languages', () => a.openSheet('edit')],
          ['Notification preferences', () => a.openSheet('prefs')],
          ['Help and support', () => a.openSheet('help')],
        ].map(([l, fn]) => (
          <li key={l as string}>
            <button onClick={fn as () => void} className="flex w-full items-center justify-between px-4 py-4 text-left">
              {l as string}
              <Icon n="chev" s={18} className="text-ink-3" />
            </button>
          </li>
        ))}
        <li>
          <button onClick={a.signOut} className="w-full px-4 py-4 text-left text-ink-2">
            Sign out
          </button>
        </li>
      </ul>

      {confirm && item && (
        <Dialog
          title={confirm.kind === 'revoke' ? 'Stop future use of this recording?' : 'Delete this recording?'}
          actions={
            <>
              <Btn full v={confirm.kind === 'delete' ? 'danger' : 'filled'} onClick={() => (a.vaultAction(confirm.id, confirm.kind), setConfirm(null))}>
                {confirm.kind === 'revoke' ? 'Stop future use' : 'Request deletion'}
              </Btn>
              <Btn full v="text" onClick={() => setConfirm(null)}>
                Cancel
              </Btn>
            </>
          }
        >
          {confirm.kind === 'revoke'
            ? `${item.title} won't be used in any new training. Copies already delivered to labs follow their deletion schedule.`
            : `${item.title} will be deleted from Feul and the lab. This takes up to 30 days and can't be undone.`}{' '}
          {item.paid ? `The ${inr(item.paid)} you were paid stays yours.` : 'If it was under review, it will not be paid.'}
        </Dialog>
      )}
    </div>
  )
}
