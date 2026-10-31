import { useState } from "react"
import {
  FORMAT_LABEL,
  LANGS,
  type Format,
  type Lang,
  type VaultItem,
} from "../state/model"
import { sel, useStore } from "../state/store"
import {
  BackBar,
  Btn,
  Dialog,
  Icon,
  IconBtn,
  Label,
  Status,
  Tag,
  Timeline,
  inr,
  type Step,
} from "../ui/kit"

const VAULT_STATUS: Record<VaultItem["status"], [string, string]> = {
  active: ["In use", "ready"],
  revoke_requested: ["Revocation requested", "requested"],
  revoke_processing: ["Revocation processing", "processing"],
  revoked: ["Future use revoked", "deleted_after_revocation"],
  delete_requested: ["Deletion requested", "requested"],
  delete_processing: ["Deletion processing", "processing"],
  deleted: ["Deletion completed", "deleted_after_revocation"],
}

/** Data-rights requests use the same lifecycle shape as reviews and payouts. */
function vaultSteps(v: VaultItem): Step[] {
  const del = v.status.startsWith("delete")
  const at = v.status.endsWith("requested")
    ? 0
    : v.status.endsWith("processing")
      ? 1
      : 3
  return [
    { title: "Requested", body: "Logged with a timestamp" },
    {
      title: del
        ? "Deleting from Feul and the lab"
        : "Removing from new training",
      body: del
        ? "Can take up to 30 days"
        : "Copies already delivered follow the lab deletion schedule",
    },
    {
      title: del ? "Deleted" : "Revoked",
      body: v.receipt ? `Receipt ${v.receipt}` : "You get a receipt",
    },
  ].map((st, i) => ({
    ...st,
    state: i < at ? "done" : i === at ? "now" : "next",
  }))
}

export default function Profile() {
  const { s, a } = useStore()
  const tier = sel.tier(s)
  const [confirm, setConfirm] = useState<null | {
    id: string
    kind: "revoke" | "delete"
  }>(null)
  const earnings = s.ledger.filter((l) => l.kind === "earning")
  const final = earnings.filter((l) =>
    ["settled", "honoured", "deleted_after_revocation"].includes(l.state),
  ).length
  const fixes = s.submissions.filter(
    (x) =>
      x.status === "repair_required" ||
      x.clips.some((c) => c.state === "repaired"),
  ).length
  const decided =
    final + s.submissions.filter((x) => x.status === "repair_required").length
  const reliability = decided
    ? Math.round((Math.max(0, decided - fixes) / decided) * 100)
    : null
  const craft: [Format, Lang, number][] = [
    ["SCENARIO", s.lang, Math.min(3, earnings.length)],
    ["INTERVIEW", s.lang, Math.min(2, Math.max(0, earnings.length - 1))],
  ]
  const top = [...sel.openForMe(s)].sort((x, y) => y.coverage - x.coverage)[0]
  const item = confirm && s.vault.find((v) => v.id === confirm.id)
  const rows: [string, string, () => void][] = [
    ["user", "Name and languages", () => a.openSheet("edit")],
    ["bell", "Notification preferences", () => a.openSheet("prefs")],
    ["wave", "Bolo and the studio", () => a.openSheet("bolo")],
    ["help", "Help and support", () => a.openSheet("help")],
  ]
  return (
    <div className="relative pb-10">
      <BackBar
        title="Profile"
        right={
          <IconBtn
            n="edit"
            label="Edit profile"
            onClick={() => a.openSheet("edit")}
            className="mr-1"
          />
        }
      />
      <div className="flex items-center gap-4 px-5 pt-2">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-ink text-24 font-semibold text-white">
          {s.name[0]}
        </span>
        <div className="min-w-0">
          <div className="semi text-24 font-bold">{s.name} Sharma</div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {(s.langs ?? [s.lang]).map((l) => (
              <Tag key={l} tone={l === s.lang ? "ink" : "neutral"}>
                <span lang={l}>{LANGS[l].native}</span>
              </Tag>
            ))}
            <span className="text-12 text-ink-3">since Sep 2026</span>
          </div>
        </div>
      </div>

      <div className="mx-5 mt-6 rounded-lg bg-surface p-5 shadow-card">
        <div className="flex items-baseline justify-between gap-3">
          <Label>Level</Label>
          <span className="text-12 text-ink-2">
            affects access, never base pay
          </span>
        </div>
        <div className="mt-3 flex items-end gap-2">
          <span className="cond tnum text-64 font-bold">{tier}</span>
          <span className="pb-1.5 text-16 text-ink-2">of 3</span>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-1">
          {[1, 2, 3].map((t) => (
            <span
              key={t}
              className={`h-1.5 rounded-full ${
                t <= tier ? "bg-cobalt" : "bg-surface-3"
              }`}
            />
          ))}
        </div>
        <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-line pt-4">
          <div>
            <dt className="text-12 text-ink-2">Reliability</dt>
            <dd className="cond tnum mt-0.5 text-30 font-bold">
              {reliability == null ? "–" : `${reliability}%`}
            </dd>
            <dd className="text-12 text-ink-3">accepted first time</dd>
          </div>
          <div>
            <dt className="text-12 text-ink-2">Settlement</dt>
            <dd className="cond tnum mt-0.5 text-30 font-bold">
              {tier >= 2 ? "1 day" : "2 days"}
            </dd>
            <dd className="text-12 text-ink-3">working days after approval</dd>
          </div>
        </dl>
        <div className="mt-4 rounded-md bg-surface-2 p-3 text-14 leading-snug">
          {tier < 3 ? (
            <>
              <span className="font-semibold">Level {tier + 1}</span>{" "}
              <span className="text-ink-2">
                unlocks{" "}
                {tier === 1
                  ? "Deep missions, more role-plays"
                  : "long Interview missions"}{" "}
                and faster settlement. It comes from takes passing first time,
                never streaks.
              </span>
            </>
          ) : (
            <span className="text-ink-2">You have full access.</span>
          )}
        </div>
      </div>

      <section className="mt-8 px-5">
        <Label className="mb-3">Craft · format × language</Label>
        <ul className="divide-y divide-line rounded-lg bg-surface shadow-card">
          {craft.map(([f, l, n]) => (
            <li key={f} className="flex items-center gap-3 px-4 py-3.5">
              <span className="w-24 text-16 font-semibold">
                {FORMAT_LABEL[f]}
              </span>
              <span lang={l} className="flex-1 text-14 text-ink-2">
                {LANGS[l].native}
              </span>
              <span className="flex gap-1" role="img" aria-label={`${n} of 3`}>
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className={`h-2 w-5 rounded-full ${
                      i < n ? "bg-cobalt" : "bg-surface-3"
                    }`}
                  />
                ))}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-12 text-ink-3">
          Craft 3 in a format makes you eligible for its quality bonus.
        </p>
      </section>

      {top && (
        <div className="mx-5 mt-8 flex gap-3 rounded-lg bg-cobalt-soft p-5">
          <Icon n="spark" s={20} className="mt-0.5 text-cobalt" />
          <div>
            <Label className="text-cobalt-deep">
              Where your voice is valuable now
            </Label>
            <p className="mt-1.5 text-16 leading-snug">
              Labs need more{" "}
              <span className="font-semibold">
                {LANGS[top.lang].name} {FORMAT_LABEL[top.format].toLowerCase()}
              </span>{" "}
              recordings, so they pay up to{" "}
              <span className="tnum font-semibold">
                {top.coverage.toFixed(1)}×
              </span>{" "}
              right now. This changes as campaigns fill.
            </p>
          </div>
        </div>
      )}

      <section className="mt-10 px-5">
        <div className="mb-1 flex items-baseline justify-between">
          <h2 className="semi text-20 font-bold">Data vault</h2>
          <span className="tnum text-12 font-semibold text-ink-3">
            {s.vault.length} items
          </span>
        </div>
        <p className="mb-3.5 text-14 leading-snug text-ink-2">
          Every recording you submit, and who can use it. Stopping use or
          deleting never takes back money already paid.
        </p>
        {s.vault.length === 0 && (
          <p className="rounded-lg bg-surface p-4 text-16 text-ink-2 shadow-card">
            Nothing recorded yet. Every mission you submit shows up here, and
            you control it.
          </p>
        )}
        <ul className="space-y-2.5">
          {s.vault.map((v) => {
            const [label, k] = VAULT_STATUS[v.status]
            const busy = v.status !== "active"
            return (
              <li key={v.id} className="rounded-lg bg-surface p-4 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-16 font-semibold">{v.title}</div>
                    <div className="tnum text-12 text-ink-2">
                      {v.detail} ·{" "}
                      {v.paid ? `${inr(v.paid)} paid` : "not paid yet"}
                    </div>
                  </div>
                  <Status k={k} label={label} />
                </div>
                {busy && (
                  <div className="mt-4 rounded-md bg-surface-2 p-3.5">
                    <Timeline steps={vaultSteps(v)} />
                    {v.paid > 0 && (
                      <p className="tnum mt-3 flex items-center gap-1.5 text-12 font-semibold text-lime-ink">
                        <Icon n="check" s={13} stroke={2.2} /> {inr(v.paid)}{" "}
                        stays settled. Paid money is never clawed back.
                      </p>
                    )}
                  </div>
                )}
                {!busy && (
                  <div className="mt-3 flex gap-2">
                    <Btn
                      size="sm"
                      v="outline"
                      onClick={() => setConfirm({ id: v.id, kind: "revoke" })}
                    >
                      Stop future use
                    </Btn>
                    <button
                      onClick={() => setConfirm({ id: v.id, kind: "delete" })}
                      className="h-10 rounded-full px-4 text-14 font-semibold text-red transition-colors hover:bg-red-soft"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </section>

      <ul className="mx-5 mt-10 divide-y divide-line rounded-lg bg-surface shadow-card">
        {rows.map(([ic, l, fn]) => (
          <li key={l}>
            <button
              onClick={fn}
              className="flex w-full items-center gap-3.5 px-4 py-4 text-left text-16"
            >
              <Icon n={ic} s={19} className="text-ink-2" />
              <span className="flex-1">{l}</span>
              <Icon n="chev" s={18} className="text-ink-3" />
            </button>
          </li>
        ))}
        <li>
          <button
            onClick={a.signOut}
            className="w-full px-4 py-4 text-left text-16 text-ink-2"
          >
            Sign out
          </button>
        </li>
      </ul>

      {confirm && item && (
        <Dialog
          title={
            confirm.kind === "revoke"
              ? "Stop future use of this recording?"
              : "Delete this recording?"
          }
          actions={
            <>
              <Btn
                full
                v={confirm.kind === "delete" ? "danger" : "ink"}
                onClick={() => (
                  a.vaultAction(confirm.id, confirm.kind), setConfirm(null)
                )}
              >
                {confirm.kind === "revoke"
                  ? "Stop future use"
                  : "Request deletion"}
              </Btn>
              <Btn full v="ghost" onClick={() => setConfirm(null)}>
                Cancel
              </Btn>
            </>
          }
        >
          {confirm.kind === "revoke"
            ? `${item.title} won't be used in any new training. Copies already delivered to labs follow their deletion schedule.`
            : `${item.title} will be deleted from Feul and the lab. This takes up to 30 days and can't be undone.`}{" "}
          {item.paid
            ? `The ${inr(item.paid)} you were paid stays yours.`
            : "If it was under review, it will not be paid."}
        </Dialog>
      )}
    </div>
  )
}
