import { useState } from "react"
import {
  FORMAT_LABEL,
  LANGS,
  LEVELS,
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
  LevelRing,
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
  const lv = sel.level(s)
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
      {/* Level lives on the person: the ring around the avatar is the progress to the next level */}
      <div className="flex items-center gap-4 px-5 pt-2">
        <LevelRing pct={lv.pct} size={68} stroke={3.5}>
          <span className="grid h-[54px] w-[54px] place-items-center rounded-full bg-ink text-24 font-semibold text-white">
            {s.name[0]}
          </span>
          <span className="tnum absolute -right-1 -bottom-1 grid h-6 min-w-6 place-items-center rounded-full bg-brand px-1.5 text-11 font-semibold text-white ring-2 ring-canvas">
            {tier}
          </span>
        </LevelRing>
        <div className="min-w-0">
          <div className="semi text-20 font-semibold">{s.name} Sharma</div>
          <div className="text-14 text-ink-2">
            Level {tier} · {lv.cur.name}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {(s.langs ?? [s.lang]).map((l) => (
              <Tag key={l} tone={l === s.lang ? "ink" : "neutral"}>
                <span lang={l}>{LANGS[l].native}</span>
              </Tag>
            ))}
          </div>
        </div>
      </div>

      <section
        aria-labelledby="level-h"
        className="mx-5 mt-5 rounded-lg bg-surface p-4 shadow-card"
      >
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="level-h" className="text-16 font-semibold">
            {lv.next
              ? `Next: Level ${lv.next.n} · ${lv.next.name}`
              : "Top level reached"}
          </h2>
          {lv.next && (
            <span className="tnum shrink-0 text-12 text-ink-2">
              {lv.n} of {lv.next.goal} approved
            </span>
          )}
        </div>
        {lv.next && (
          <>
            <div
              role="progressbar"
              aria-label={`Progress to level ${lv.next.n}`}
              aria-valuemin={lv.cur.goal}
              aria-valuemax={lv.next.goal}
              aria-valuenow={lv.n}
              className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-surface-3"
            >
              <span
                className="block h-full rounded-full bg-brand transition-[width] duration-700 ease-(--ease-out)"
                style={{ width: `${Math.max(4, lv.pct * 100)}%` }}
              />
            </div>
            <p className="mt-2 text-12 leading-snug text-ink-2">
              {lv.left} more approved {lv.left === 1 ? "scene" : "scenes"}{" "}
              unlock{lv.left === 1 ? "s" : ""}{" "}
              {lv.next.unlocks[0].toLowerCase()}.
            </p>
          </>
        )}

        <ol
          aria-label="Level path"
          className="mt-4 divide-y divide-line border-t border-line"
        >
          {LEVELS.map((l) => {
            const st = l.n < tier ? "done" : l.n === tier ? "now" : "next"
            const waiting = s.jobs.filter(
              (j) =>
                j.tier === l.n && j.campaign === "open" && j.lang === s.lang,
            ).length
            return (
              <li key={l.n} className="flex gap-3 py-3">
                <span
                  className={`tnum mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-11 font-semibold ${
                    st === "done"
                      ? "bg-money-soft text-money-ink"
                      : st === "now"
                        ? "bg-brand text-white"
                        : "bg-surface-3 text-ink-3"
                  }`}
                >
                  {st === "done" ? (
                    <Icon n="check" s={12} stroke={2.6} />
                  ) : st === "next" ? (
                    <Icon n="lock" s={11} />
                  ) : (
                    l.n
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <span
                      className={`text-14 font-medium ${
                        st === "next" ? "text-ink-2" : ""
                      }`}
                    >
                      Level {l.n} · {l.name}
                    </span>
                    <span
                      className={`text-12 ${
                        st === "now"
                          ? "font-medium text-brand-deep"
                          : "text-ink-3"
                      }`}
                    >
                      {st === "done"
                        ? "Reached"
                        : st === "now"
                          ? "You're here"
                          : l.need}
                    </span>
                  </div>
                  <p className="mt-0.5 text-12 leading-snug text-ink-2">
                    {l.unlocks.join(" · ")}
                    {st === "next" && waiting > 0
                      ? ` · ${waiting} ${
                          waiting === 1 ? "scene" : "scenes"
                        } waiting`
                      : ""}
                  </p>
                </div>
              </li>
            )
          })}
        </ol>

        <dl className="grid grid-cols-2 gap-4 border-t border-line pt-3.5">
          <div>
            <dt className="text-12 text-ink-2">Reliability</dt>
            <dd className="tnum mt-0.5 text-18 font-semibold">
              {reliability == null ? "–" : `${reliability}%`}
            </dd>
            <dd className="text-11 text-ink-3">accepted first time</dd>
          </div>
          <div>
            <dt className="text-12 text-ink-2">Settlement</dt>
            <dd className="tnum mt-0.5 text-18 font-semibold">
              {tier >= 2 ? "1 day" : "2 days"}
            </dd>
            <dd className="text-11 text-ink-3">working days after approval</dd>
          </div>
        </dl>
        <p className="mt-3 text-12 leading-snug text-ink-3">
          Levels come from approved scenes, never streaks. They never go down,
          and base pay per minute stays the same.
        </p>
      </section>

      <section className="mt-7 px-5">
        <Label className="mb-2">Craft · format × language</Label>
        <ul className="divide-y divide-line border-y border-line">
          {craft.map(([f, l, n]) => (
            <li key={f} className="flex items-center gap-3 py-3">
              <span className="w-24 text-16 font-medium">
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
                      i < n ? "bg-brand" : "bg-surface-3"
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
        <div className="mx-5 mt-6 flex gap-3 rounded-lg bg-brand-soft/75 p-4">
          <Icon n="spark" s={18} className="mt-0.5 text-brand" />
          <div>
            <Label className="text-brand-deep">
              Where your voice is valuable now
            </Label>
            <p className="mt-1 text-14 leading-snug">
              Labs need more{" "}
              <span className="font-medium">
                {LANGS[top.lang].name} {FORMAT_LABEL[top.format].toLowerCase()}
              </span>{" "}
              recordings, so they pay up to{" "}
              <span className="tnum font-medium">
                {top.coverage.toFixed(1)}×
              </span>{" "}
              right now. This changes as campaigns fill.
            </p>
          </div>
        </div>
      )}

      <section className="mt-8 px-5">
        <div className="mb-1 flex items-baseline justify-between">
          <h2 className="semi text-18 font-semibold">Data vault</h2>
          <span className="tnum text-12 font-medium text-ink-3">
            {s.vault.length} items
          </span>
        </div>
        <p className="mb-3 text-14 leading-snug text-ink-2">
          Every recording you submit, and who can use it. Stopping use or
          deleting never takes back money already paid.
        </p>
        {s.vault.length === 0 && (
          <p className="border-y border-line py-4 text-14 text-ink-2">
            Nothing recorded yet. Every scene you submit shows up here, and you
            control it.
          </p>
        )}
        <ul className="divide-y divide-line border-y border-line">
          {s.vault.map((v) => {
            const [label, k] = VAULT_STATUS[v.status]
            const busy = v.status !== "active"
            return (
              <li key={v.id} className="py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-16 font-medium">{v.title}</div>
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
                      <p className="tnum mt-3 flex items-center gap-1.5 text-12 font-semibold text-money-ink">
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

      <ul className="mx-5 mt-8 divide-y divide-line border-y border-line">
        {rows.map(([ic, l, fn]) => (
          <li key={l}>
            <button
              onClick={fn}
              className="flex w-full items-center gap-3.5 py-3.5 text-left text-16"
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
            className="w-full py-3.5 text-left text-16 text-ink-2"
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
