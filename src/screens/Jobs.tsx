import { useState } from "react"
import {
  BASE_RATE,
  BOLO_ROLE,
  ENVS,
  FORMAT_LABEL,
  LANGS,
  LENGTHS,
  chaptersOf,
  jobTotal,
  lengthOf,
  perHour,
  type Env,
  type Lang,
  type Length,
} from "../state/model"
import { sel, useStore } from "../state/store"
import Bolo, { BoloBadge, Bubble } from "../ui/Bolo"
import {
  Btn,
  Card,
  FORMAT_ICON,
  Icon,
  Label,
  LengthTag,
  MissionRow,
  Notice,
  Player,
  RareTag,
  Segmented,
  Tag,
  buzz,
  inr,
} from "../ui/kit"

export default function Jobs() {
  const { s, a } = useStore()
  const f = s.len ?? "all"
  const [q, setQ] = useState("")
  const tier = sel.tier(s)
  const all = sel
    .eligible(s)
    .filter(
      (j) =>
        s.scene == null ||
        s.scene === "ALL" ||
        s.scene === "SAVED" ||
        j.env === s.scene,
    )
  const list = all.filter(
    (j) =>
      (f === "all" ||
        (f === "saved" ? s.saved.includes(j.id) : lengthOf(j) === f)) &&
      (!q || (j.title + j.situation).toLowerCase().includes(q.toLowerCase())),
  )
  const openable = list.filter(
    (j) => j.campaign === "open" && j.tier <= tier && j.prompts.length > 0,
  )
  const rest = list.filter((j) => !openable.includes(j))
  const count = (k: Length) => all.filter((j) => lengthOf(j) === k).length
  return (
    <div className="pb-6">
      <div className="px-5 pt-1">
        <h1 className="semi rise text-38 font-bold tracking-[-0.03em]">
          Missions
        </h1>
        <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-14 text-ink-2">
          {(s.langs ?? [s.lang]).map((l) => (
            <Tag key={l} tone={l === s.lang ? "ink" : "neutral"}>
              {LANGS[l].native}
            </Tag>
          ))}
          <span className="tnum ml-1">
            Level {tier} · sorted by fit, not pay
          </span>
        </p>
        <div className="mt-5 flex gap-2">
          <label className="flex h-12 flex-1 items-center gap-2 rounded-full bg-surface px-4 text-ink-3 shadow-[inset_0_0_0_1px_var(--color-line)] transition-shadow focus-within:shadow-[inset_0_0_0_2px_var(--color-cobalt)]">
            <Icon n="search" s={19} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search missions"
              aria-label="Search missions"
              className="min-w-0 flex-1 bg-transparent text-16 text-ink outline-none placeholder:text-ink-3"
            />
            {q && (
              <button
                aria-label="Clear search"
                onClick={() => setQ("")}
                className="grid h-6 w-6 place-items-center rounded-full bg-surface-3 text-ink-2"
              >
                <Icon n="close" s={12} stroke={2.4} />
              </button>
            )}
          </label>
          <button
            aria-label="Filters"
            onClick={() => a.openSheet("filters")}
            className="relative grid h-12 w-12 place-items-center rounded-full bg-surface shadow-[inset_0_0_0_1px_var(--color-line)] transition-transform duration-200 ease-(--ease-spring) active:scale-90"
          >
            <Icon n="sliders" s={20} />
            {s.scene && s.scene !== "ALL" && (
              <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-cobalt ring-2 ring-surface" />
            )}
          </button>
        </div>
      </div>
      <Segmented
        className="mt-4"
        value={f}
        onChange={a.setLen}
        items={[
          { k: "all" as const, l: "All", n: all.length },
          ...(["quick", "core", "deep"] as Length[]).map((k) => ({
            k,
            l: LENGTHS[k].label,
            n: count(k),
            icon: LENGTHS[k].icon,
          })),
          {
            k: "saved" as const,
            l: "Saved",
            n: s.saved.length,
            icon: "bookmark",
          },
        ]}
      />

      <div className="px-5">
        {s.scene && s.scene !== "ALL" && s.scene !== "SAVED" && (
          <button
            onClick={() => a.setScene("ALL")}
            className="mt-4 inline-flex h-8 items-center gap-1.5 rounded-full bg-cobalt-soft px-3 text-12 font-semibold text-cobalt-deep"
          >
            {ENVS[(s.scene as Env)].label}{" "}
            <Icon n="close" s={13} stroke={2.2} />
          </button>
        )}
        <button
          onClick={() => a.openSheet("bolo")}
          className="mt-4 flex w-full items-center gap-3 rounded-lg bg-surface p-3 pr-4 text-left shadow-card transition-transform duration-300 ease-(--ease-spring) active:scale-[0.98]"
        >
          <BoloBadge mood="coach" size={42} />
          <span className="min-w-0 flex-1 text-14 leading-snug">
            <span className="font-semibold">
              Every mission starts at{" "}
              <span className="tnum">{inr(BASE_RATE)}</span> an hour of
              speaking.
            </span>{" "}
            <span className="text-ink-2">
              Rare voices pay up to 1.8×. You always see the amount first.
            </span>
          </span>
          <Icon n="chev" s={16} className="text-ink-3" />
        </button>
        {f === "deep" && (
          <div className="mt-3">
            <Notice
              tone="info"
              icon="layers"
              title="Deep missions come in chapters"
            >
              Every chapter you finish is saved and paid, even if life
              interrupts the rest.
            </Notice>
          </div>
        )}
        {all.length === 0 ? (
          <div className="py-10 text-center">
            <div className="flex justify-center">
              <Bolo mood="sleep" size={110} />
            </div>
            <h3 className="semi mt-3 text-24 font-bold">
              No {LANGS[s.lang].name} missions open
            </h3>
            <p className="mt-2 text-14 leading-relaxed text-ink-2">
              Current campaigns have enough recordings in your language. This is
              a real gap in supply, not a loading problem.
            </p>
            <Btn
              className="mt-5"
              v="voice"
              icon="bell"
              onClick={() => (
                a.enableAlerts(), a.toast("Bolo will wake you when work opens")
              )}
            >
              Wake me when it opens
            </Btn>
          </div>
        ) : list.length === 0 ? (
          <div className="py-12 text-center">
            <div className="flex justify-center">
              <Bolo mood={f === "saved" ? "coach" : "think"} size={96} />
            </div>
            <p className="mx-auto mt-3 max-w-[30ch] text-16 text-ink-2">
              {f === "saved"
                ? "Nothing saved yet. Tap the bookmark on any mission to keep it here."
                : `No ${
                    f === "all" ? "" : LENGTHS[(f as Length)].label + " "
                  }missions match right now.`}
            </p>
          </div>
        ) : (
          <>
            {openable.length > 0 && (
              <div className="mt-7 mb-3 flex items-baseline justify-between">
                <Label>Open to you</Label>
                <span className="tnum text-12 font-semibold text-ink-3">
                  {openable.length}
                </span>
              </div>
            )}
            <div className="flex flex-col gap-2.5">
              {openable.map((j, i) => (
                <div
                  key={j.id}
                  className="rise"
                  style={{ animationDelay: `${Math.min(i, 6) * 45}ms` }}
                >
                  <MissionRow job={j} />
                </div>
              ))}
            </div>
            {rest.length > 0 && (
              <>
                <div className="mt-9 mb-3 flex items-baseline justify-between">
                  <Label>Not open right now</Label>
                  <span className="tnum text-12 font-semibold text-ink-3">
                    {rest.length}
                  </span>
                </div>
                <div className="flex flex-col gap-2.5">
                  {rest.map((j) => (
                    <MissionRow
                      key={j.id}
                      job={j}
                      locked={j.tier > tier && j.campaign === "open"}
                    />
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
  const total = mine?.locked.total ?? jobTotal(j)
  const inFlight =
    mine || s.submissions.some((x) => x.jobId === id && x.status !== "approved")
  const blocked =
    !mine && (j.campaign !== "open" || j.tier > tier || j.prompts.length === 0)
  const saved = s.saved.includes(id)
  const chapters = chaptersOf(j)
  const l = lengthOf(j)
  const baseFor = Math.round((j.minutes / 60) * BASE_RATE)
  return (
    <div className="relative pb-4">
      <div className="relative h-[316px] overflow-hidden bg-surface-3">
        <img
          src={j.image}
          alt=""
          className="absolute inset-0 h-full w-full scale-105 object-cover"
          onError={(e) => (e.currentTarget.style.display = "none")}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/55 via-ink/5 to-ink/45" />
        <div className="absolute inset-x-0 top-0 flex items-center justify-between px-3 pt-[54px]">
          <button
            aria-label="Back"
            onClick={a.pop}
            className="grid h-11 w-11 place-items-center rounded-full bg-white/18 text-white backdrop-blur-xl transition-transform duration-200 ease-(--ease-spring) active:scale-90"
          >
            <Icon n="back" s={20} />
          </button>
          <button
            aria-label={saved ? "Remove from saved" : "Save mission"}
            onClick={() => (a.toggleSave(id), buzz(6))}
            className={`grid h-11 w-11 place-items-center rounded-full backdrop-blur-xl transition-[scale,background-color] duration-300 ease-(--ease-spring) active:scale-75 ${
              saved ? "bg-white text-cobalt" : "bg-white/18 text-white"
            }`}
          >
            <svg
              width="19"
              height="19"
              viewBox="0 0 24 24"
              fill={saved ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinejoin="round"
            >
              <path d="M7 4h10v16l-5-4-5 4z" />
            </svg>
          </button>
        </div>
        <div className="absolute bottom-9 left-5 flex gap-1.5">
          <LengthTag l={l} dark />
          <RareTag x={j.coverage} />
        </div>
      </div>

      <div className="relative -mt-6 rounded-t-lg bg-canvas px-5 pt-6">
        <div className="flex items-center gap-1.5 text-12 font-semibold text-ink-2">
          <Icon n={FORMAT_ICON[j.format]} s={14} />
          {FORMAT_LABEL[j.format]} · {LANGS[j.lang].native} ·{" "}
          {ENVS[j.env].label}
        </div>
        <h1 className="semi mt-2 text-30 font-bold tracking-[-0.025em]">
          {j.title}
        </h1>
        <p className="mt-2 text-16 leading-relaxed text-ink-2">{j.situation}</p>

        <div className="mt-5 flex items-start gap-1">
          <div className="-ml-2 shrink-0">
            <Bolo mood={j.format === "LINES" ? "coach" : "speak"} size={64} />
          </div>
          <Bubble tail="left" className="mt-1 flex-1">
            <p className="text-14 leading-snug">{BOLO_ROLE[j.format]}</p>
          </Bubble>
        </div>

        <div className="mt-4 flex flex-col gap-2.5">
          {j.campaign === "closed" && (
            <Notice tone="neutral" title="Closed to new work">
              {inFlight
                ? "Your work here is still paid at the rate locked when you started."
                : "This campaign has enough recordings and no longer takes new sessions."}
            </Notice>
          )}
          {j.campaign === "full" && !mine && (
            <Notice tone="neutral" title="Coverage full">
              Labs have enough recordings of this situation. Similar open
              missions are in the list.
            </Notice>
          )}
          {j.campaign === "oversubscribed" && !mine && (
            <Notice tone="attention" title="Paused · oversubscribed">
              More people are recording this than it needs, so new sessions are
              paused until started work finishes.
            </Notice>
          )}
          {j.tier > tier && (
            <Notice
              tone="info"
              icon="lock"
              title={`Unlocks at level ${j.tier}`}
            >
              Levels come from reliability, how often your takes pass first
              time. Never from streaks, and never lower base pay.
            </Notice>
          )}
        </div>
      </div>

      {/* The deal: everything the contributor is agreeing to, before the microphone opens */}
      <div className="mx-5 mt-5 overflow-hidden rounded-lg bg-surface shadow-card">
        <div className="p-5">
          <div className="flex items-center justify-between">
            <Label>The deal, before you start</Label>
            {mine && (
              <Tag tone="ink" icon="lock">
                Locked for you
              </Tag>
            )}
          </div>
          <div className="mt-3 flex items-end gap-3">
            <span className="cond tnum text-64 font-bold tracking-[-0.02em]">
              {inr(total)}
            </span>
            <span className="pb-1.5 text-14 leading-tight text-ink-2">
              guaranteed once
              <br />
              automated checks pass
            </span>
          </div>
          <div className="tnum mt-4 flex flex-wrap items-center gap-1.5 text-14">
            <span className="rounded-sm bg-surface-2 px-2 py-1 font-semibold">
              {inr(baseFor)}
            </span>
            <span className="text-ink-3">
              {j.minutes} min at {inr(BASE_RATE)}/hr
            </span>
            <span className="text-ink-3">×</span>
            <span className="rounded-sm bg-cobalt-soft px-2 py-1 font-semibold text-cobalt-deep">
              {j.coverage.toFixed(1)}×
            </span>
            <span className="text-ink-3">rare voice</span>
          </div>
          {j.bonus > 0 && (
            <div className="mt-3 flex items-center gap-2.5 rounded-md bg-surface-2 px-3 py-2.5">
              <Icon n="gift" s={18} className="text-ink-2" />
              <span className="flex-1 text-14">
                <span className="tnum font-semibold">
                  +{inr(j.bonus)} quality bonus
                </span>{" "}
                <span className="text-ink-2">
                  for clear, natural takes without retakes
                </span>
              </span>
            </div>
          )}
          {j.scarcity && (
            <p className="mt-3 flex gap-2 text-14 leading-snug text-cobalt-deep">
              <Icon n="spark" s={16} className="mt-0.5" />
              {j.scarcity}
            </p>
          )}
        </div>
        <dl className="grid grid-cols-2 border-t border-line">
          {[
            ["clock", "Active time", `~${j.minutes} min`],
            ["trend", "Works out to", `≈${inr(perHour(j))}/hr`],
            ["eye", "Human review", "Usually 24h"],
            ["bank", "Paid to", "Your UPI, after approval"],
          ].map(([ic, k, v], i) => (
            <div
              key={k}
              className={`flex gap-2.5 p-4 ${
                i % 2 ? "border-l border-line" : ""
              } ${i > 1 ? "border-t border-line" : ""}`}
            >
              <Icon n={ic} s={17} className="mt-0.5 text-ink-3" />
              <div>
                <dt className="text-12 text-ink-2">{k}</dt>
                <dd className="tnum text-14 font-semibold">{v}</dd>
              </div>
            </div>
          ))}
        </dl>
        <div className="flex gap-2.5 border-t border-line bg-surface-2 px-5 py-3.5 text-12 leading-snug text-ink-2">
          <Icon n="shield" s={16} className="mt-px shrink-0" />
          {chapters.length
            ? "Paid per chapter. Stop after any chapter and what you finished is still submitted and paid."
            : "Interrupted? Your takes stay on this phone for 24h, at this locked price."}
        </div>
      </div>

      <div className="mt-8 px-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <Label>
            {chapters.length
              ? `${chapters.length} chapters`
              : j.format === "LINES"
                ? "Lines you will read"
                : "What you will do"}
          </Label>
          {j.format === "LINES" && !chapters.length && (
            <Tag tone="cobalt">{LANGS[j.lang].native}</Tag>
          )}
        </div>
        {chapters.length ? (
          <ol className="flex flex-col gap-2">
            {chapters.map((c, i) => (
              <li
                key={c.title}
                className="flex items-center gap-3.5 rounded-lg bg-surface p-4 shadow-card"
              >
                <span className="cond tnum grid h-10 w-10 place-items-center rounded-full bg-ink text-18 font-bold text-white">
                  {i + 1}
                </span>
                <div className="flex-1">
                  <div className="text-16 font-semibold">{c.title}</div>
                  <div className="tnum text-12 text-ink-2">
                    {c.count} turns · ≈
                    {inr(Math.round(total / chapters.length))} saved when done
                  </div>
                </div>
                <Icon n="layers" s={18} className="text-ink-3" />
              </li>
            ))}
          </ol>
        ) : (
          <Card className="px-4 py-1">
            <ol className="divide-y divide-line">
              {j.prompts.slice(0, 5).map((p, i) => (
                <li key={p.id} className="flex gap-3.5 py-3.5">
                  <span className="cond tnum grid h-7 w-7 shrink-0 place-items-center rounded-full bg-cobalt-soft text-14 font-bold text-cobalt-deep">
                    {i + 1}
                  </span>
                  {j.format === "LINES" ? (
                    <span className="min-w-0">
                      <span
                        lang={j.lang}
                        className="script block text-18 font-semibold"
                      >
                        {p.text}
                      </span>
                      {p.stem && (
                        <span className="mt-0.5 block text-12 leading-snug text-ink-2">
                          {p.stem}
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="text-14 leading-snug">{p.text}</span>
                  )}
                </li>
              ))}
              {j.prompts.length > 5 && (
                <li className="tnum py-3.5 text-14 text-ink-2">
                  +{j.prompts.length - 5} more
                </li>
              )}
              {j.prompts.length === 0 && (
                <li className="py-3.5 text-14 text-ink-2">
                  Prompts appear when this campaign reopens.
                </li>
              )}
            </ol>
          </Card>
        )}
      </div>

      <div className="mt-8 px-5">
        <Label className="mb-3">Hear a good take</Label>
        <Card className="p-4">
          <Player seed={j.base + 3} secs={9} label="example" />
        </Card>
      </div>

      <div className="mt-8 px-5">
        <Label className="mb-3">What your voice helps build</Label>
        <div className="flex gap-3 rounded-lg bg-ink p-5 text-white">
          <Icon n="globe" s={22} className="mt-0.5 text-peri" />
          <p className="text-16 leading-snug">{j.uses}</p>
        </div>
      </div>

      <div className="mt-8 px-5">
        <Label className="mb-3">You'll need</Label>
        <Card className="divide-y divide-line px-4 py-1 text-14">
          {[
            ["globe", "Language", LANGS[j.lang].native],
            ["pin", "Place", j.environment],
            [
              "clock",
              "Time",
              `~${j.minutes} min${
                chapters.length ? ", in chapters" : ", one sitting"
              }`,
            ],
          ].map(([ic, k, v]) => (
            <div key={k} className="flex items-center gap-3 py-3.5">
              <Icon n={ic} s={17} className="text-ink-3" />
              <span className="text-ink-2">{k}</span>
              <span className="ml-auto text-right font-semibold">{v}</span>
            </div>
          ))}
        </Card>
      </div>

      <div className="sticky bottom-0 z-10 mt-6 bg-gradient-to-t from-canvas from-60% to-transparent px-5 pt-8 pb-6">
        {mine ? (
          <Btn full size="lg" v="voice" icon="mic" onClick={a.resume}>
            Continue recording
          </Btn>
        ) : (
          <Btn
            full
            size="lg"
            v="voice"
            icon={blocked ? "lock" : "mic"}
            disabled={blocked}
            onClick={() => a.startJob(id)}
          >
            {blocked
              ? j.campaign === "closed"
                ? "Closed to new work"
                : j.tier > tier
                  ? `Unlocks at level ${j.tier}`
                  : "Not open right now"
              : `Start · ${inr(total)} guaranteed`}
          </Btn>
        )}
      </div>
    </div>
  )
}

export function FilterSheet() {
  const { s, a } = useStore()
  return (
    <div className="space-y-6">
      <div>
        <Label className="mb-2.5">Recording language</Label>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(LANGS) as Lang[]).map((k) => (
            <button
              key={k}
              onClick={() => a.chooseLang(k)}
              className={`h-11 rounded-full px-4 text-16 font-semibold transition-colors ${
                s.lang === k
                  ? "bg-ink text-white"
                  : "bg-surface-2 text-ink shadow-[inset_0_0_0_1px_var(--color-line)]"
              }`}
            >
              {LANGS[k].native}
            </button>
          ))}
        </div>
      </div>
      <div>
        <Label className="mb-2.5">Scene</Label>
        <div className="flex flex-wrap gap-2">
          {(["ALL", ...Object.keys(ENVS)] as (Env | "ALL")[]).map((k) => {
            const on = (s.scene ?? "ALL") === k
            return (
              <button
                key={k}
                onClick={() => a.setScene(k)}
                className={`h-10 rounded-full px-4 text-14 font-semibold transition-colors ${
                  on
                    ? "bg-ink text-white"
                    : "bg-surface-2 text-ink-2 shadow-[inset_0_0_0_1px_var(--color-line)]"
                }`}
              >
                {k === "ALL" ? "All scenes" : ENVS[k].short}
              </button>
            )
          })}
        </div>
      </div>
      <p className="text-14 leading-snug text-ink-2">
        Missions are ordered by fit for your voice, not by pay. The same work
        always starts at the same base rate.
      </p>
      <Btn full v="ink" size="lg" onClick={a.closeSheet}>
        Show missions
      </Btn>
    </div>
  )
}
