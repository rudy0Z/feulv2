import { useEffect, useState } from "react"
import {
  FORMAT_LABEL,
  LANGS,
  LENGTHS,
  jobTotal,
  lengthOf,
  perHour,
  type Lang,
  type Length,
  type State,
} from "../state/model"
import { MIN_WITHDRAW, sel, useStore } from "../state/store"
import Bolo, { Typed, type Mood } from "../ui/Bolo"
import {
  Btn,
  FORMAT_ICON,
  Icon,
  LengthTag,
  Money,
  Notice,
  RareTag,
  Section,
  SettingTile,
  Status,
  inr,
} from "../ui/kit"

/** Scenes already done: anything submitted, plus earnings recorded under a scene's title. */
function finished(s: State) {
  const earned = new Set(
    s.ledger.filter((l) => l.kind === "earning").map((l) => l.title),
  )
  return new Set([
    ...s.submissions.map((x) => x.jobId),
    ...s.jobs.filter((j) => earned.has(j.title)).map((j) => j.id),
  ])
}

/** Minutes of the shortest scene open to this contributor, if any. */
const shortest = (s: State) => {
  const m = Math.min(...sel.openForMe(s).map((j) => j.minutes))
  return Number.isFinite(m) ? m : null
}

export default function Home() {
  const { s, a } = useStore()
  const open = sel.openForMe(s)
  const isNew = s.ledger.length === 0 && s.submissions.length === 0
  const attention = sel.attention(s)
  const reviewing = s.submissions.filter(
    (x) => x.status === "under_review" || x.status === "appeal",
  )
  const done = finished(s)
  const fresh = open.filter((j) => !done.has(j.id) && j.id !== s.session?.jobId)
  const byTime = [...fresh].sort((x, y) => x.minutes - y.minutes)
  // First scene: the shortest one. After that: the rarest voice that still fits one sitting.
  const next = isNew
    ? byTime[0]
    : ([...fresh]
        .filter((j) => lengthOf(j) !== "deep")
        .sort((x, y) => y.coverage - x.coverage)[0] ?? byTime[0])
  const quick = byTime.filter(
    (j) => lengthOf(j) === "quick" && j.id !== next?.id,
  )
  const hr = new Date().getHours()
  const greet =
    hr < 12 ? "Good morning" : hr < 17 ? "Good afternoon" : "Good evening"
  const empty = sel.eligible(s).length === 0

  return (
    <div className="pb-6">
      <BoloStageHeader greet={greet} />
      {/* New contributors see setup first: it's short, and UPI + name gate the first payout. */}
      {isNew && <Checklist />}

      {(s.session ||
        attention.length > 0 ||
        (s.withdrawal && s.withdrawal.status !== "paid")) && (
        <div className="mt-4 flex flex-col gap-2.5 px-5">
          <SessionCard />
          {attention.map((x) => {
            const j = sel.job(s, x.jobId)
            const bad = x.clips.filter(
              (c) => c.state === "repair_required",
            ).length
            return (
              <Notice
                key={x.id}
                tone="attention"
                icon="retry"
                title={
                  j.format === "ROOM"
                    ? `${j.title}: repeat the room take`
                    : `${j.title}: ${x.clips.length - bad} of ${x.clips.length} accepted`
                }
                action={
                  <Btn
                    size="sm"
                    v="ink"
                    icon="mic"
                    onClick={() => a.push({ name: "submission", id: x.id })}
                  >
                    {j.format === "ROOM"
                      ? "See what to fix"
                      : `Retake ${bad} ${bad === 1 ? "turn" : "turns"} · 30 s`}
                  </Btn>
                }
              >
                <span className="tnum">{inr(x.total)}</span> is held, not lost.
                Accepted turns are kept.
              </Notice>
            )
          })}
          {s.withdrawal && s.withdrawal.status !== "paid" && (
            <button
              onClick={() => a.push({ name: "withdrawal" })}
              className="flex items-center gap-3 rounded-lg bg-surface p-4 text-left shadow-card transition-transform duration-300 ease-(--ease-spring) active:scale-[0.98]"
            >
              <span className="grid h-10 w-10 place-items-center rounded-full bg-wait-soft text-wait-ink">
                <Icon n="bank" s={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-14 font-semibold">
                  <span className="tnum">{inr(s.withdrawal.amount)}</span> on
                  its way to your bank
                </span>
                <span className="block truncate text-12 text-ink-2">
                  {s.withdrawal.vpa}
                </span>
              </span>
              <Status k={s.withdrawal.status} />
            </button>
          )}
        </div>
      )}

      {empty ? (
        <NoWork />
      ) : (
        <>
          {next ? (
            <section className="mt-6 px-5">
              <div className="mb-3 flex items-end justify-between">
                <h2 className="semi text-18 font-semibold">
                  {isNew ? "Your first scene" : "Picked for your voice"}
                </h2>
                <button
                  onClick={() => a.openLen("all")}
                  className="text-14 font-medium text-brand"
                >
                  All {open.length}
                </button>
              </div>
              <HeroScene id={next.id} />
            </section>
          ) : (
            <p className="mt-6 px-5 text-16 text-ink-2">
              You've started everything open for you today. New scenes show up
              here.
            </p>
          )}
          {quick.length > 0 && <QuickRail ids={quick.map((j) => j.id)} />}
          <LengthTiles />
        </>
      )}

      {reviewing.length > 0 && (
        <Section
          title="With reviewers"
          sub="Pending money is shown separately until it's approved."
          className="mt-8"
        >
          <div className="divide-y divide-line border-y border-line">
            {reviewing.map((x) => {
              const j = sel.job(s, x.jobId)
              return (
                <button
                  key={x.id}
                  onClick={() => a.push({ name: "submission", id: x.id })}
                  className="flex w-full items-center gap-3.5 py-3 text-left"
                >
                  <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full bg-wait-soft">
                    <span className="ping-soft absolute inset-2 rounded-full bg-wait/40" />
                    <span className="relative h-2 w-2 rounded-full bg-wait" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-16 font-medium">
                      {j.title}
                    </span>
                    <span className="block truncate text-12 text-ink-2">
                      {x.waitReason}
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="cond tnum block text-18 leading-none font-semibold">
                      {inr(x.total)}
                    </span>
                    <span className="text-11 font-medium text-wait-ink">
                      pending
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </Section>
      )}
    </div>
  )
}

/* Companion header: Bolo and its line share one card with the wallet/milestone strip.
   This is Home's only Bolo. */
function BoloStageHeader({ greet }: { greet: string }) {
  const { s, a } = useStore()
  const open = sel.openForMe(s)
  const isNew = s.ledger.length === 0 && s.submissions.length === 0
  const attention = sel.attention(s)
  const review = s.submissions.find((x) => x.status === "under_review")
  const sess = s.session
  let mood: Mood = "happy"
  let line = `${open.length} scenes are open in ${LANGS[s.lang].name}. The quick ones fit in a chai break.`
  if (sel.eligible(s).length === 0) {
    mood = "sleep"
    line = `No ${LANGS[s.lang].name} scenes right now. I'll wake you the moment labs need your voice.`
  } else if (isNew) {
    mood = "happy"
    const m = shortest(s)
    line = `I'm Bolo, I run the studio. ${
      m ? `Your first scene takes about ${m} minutes. ` : ""
    }I direct, you talk.`
  } else if (attention.length) {
    mood = "coach"
    line = `One turn in ${sel.job(s, attention[0].jobId).title} didn't land. We'll redo just that one, about 30 seconds.`
  } else if (sess && sess.status === "capturing") {
    mood = "coach"
    line = `You're ${sess.clips.filter((c) => c.state !== "ready").length} of ${sess.clips.length} into ${sel.job(s, sess.jobId).title}. Shall we finish it?`
  } else if (sess && sess.status === "upload_failed") {
    mood = "concern"
    line = `Your takes didn't upload, but they're safe on this phone. One tap to retry.`
  } else if (review) {
    mood = "idle"
    line = `${sel.job(s, review.jobId).title} is with reviewers. Usually back within 24 hours. I'll ping you.`
  }
  const [hello, setHello] = useState(true)
  useEffect(() => {
    const t = setTimeout(() => setHello(false), 1700)
    return () => clearTimeout(t)
  }, [])

  const inReview = sel.inReview(s) + sel.held(s)
  const gap = Math.max(0, MIN_WITHDRAW - s.available)
  const sorted = open.slice().sort((x, y) => x.minutes - y.minutes)
  let acc = 0
  const path = sorted.filter((j) =>
    acc < MIN_WITHDRAW ? ((acc += jobTotal(j)), true) : false,
  )
  const mins = path.reduce((t, j) => t + j.minutes, 0)

  return (
    <div className="px-5 pt-1">
      <div className="pb-3">
        <p className="text-12 font-medium text-ink-2">{greet}</p>
        <h1 className="semi text-24 font-semibold">{s.name}</h1>
      </div>

      {/* Bolo sits inside the card, beside the line it is saying: one speaker, one box. */}
      <div className="grad-ink relative overflow-hidden rounded-lg p-4 text-white shadow-card">
        <div className="flex items-start gap-3">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-white/[.06]">
            <Bolo
              mood={hello && mood !== "sleep" ? "hello" : mood}
              size={50}
              ground="none"
              label="Bolo"
            />
          </span>
          <p className="min-w-0 flex-1 pt-0.5 text-14 leading-snug text-white/90">
            <Typed text={line} step={32} />
          </p>
        </div>

        {isNew ? (
          <div className="mt-3.5 flex items-center justify-between gap-3 border-t border-white/10 pt-3">
            <div className="flex items-center gap-2.5">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-money text-ink">
                <Icon n="bank" s={13} />
              </span>
              <span className="tnum text-12 leading-snug text-white/75">
                First{" "}
                <span className="font-semibold text-money">
                  ₹{MIN_WITHDRAW}
                </span>{" "}
                unlocks UPI cashout ·{" "}
                <span className="text-white">
                  {path.length} scenes (~{mins} min)
                </span>
              </span>
            </div>
          </div>
        ) : (
          <div className="mt-3.5 flex items-center justify-between gap-3 border-t border-white/10 pt-3">
            <button
              onClick={() => a.setTab("wallet")}
              className="flex min-w-0 items-baseline gap-2.5 text-left"
            >
              <span className="cond tnum text-24 leading-none font-semibold text-money">
                <Money value={s.available} />
              </span>
              <span className="truncate text-12 text-white/65">
                available
                {inReview > 0 ? ` · ${inr(inReview)} in review` : ""}
              </span>
            </button>
            {gap > 0 ? (
              <button
                onClick={() => a.setTab("wallet")}
                className="tnum shrink-0 rounded-full bg-white/10 px-3 py-1.5 text-12 font-medium text-white/85 hover:bg-white/15"
              >
                {inr(gap)} to ₹{MIN_WITHDRAW} →
              </button>
            ) : (
              <Btn
                v="white"
                size="sm"
                onClick={() => a.push({ name: "withdraw" })}
                icon="bank"
              >
                Withdraw {inr(s.available)}
              </Btn>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function SessionCard() {
  const { s, a } = useStore()
  const sess = s.session
  if (!sess) return null
  const j = sel.job(s, sess.jobId)
  const done = sess.clips.filter((c) => c.state !== "ready").length
  if (sess.status === "expired") {
    const canRestart = j.campaign === "open"
    return (
      <Notice
        tone="neutral"
        icon="clock"
        title={`${j.title}: resume window ended`}
        action={
          <div className="flex gap-2">
            {canRestart && (
              <Btn
                size="sm"
                v="voice"
                icon="mic"
                onClick={() => a.startJob(j.id)}
              >
                Start fresh · {inr(jobTotal(j))}
              </Btn>
            )}
            <Btn size="sm" v="outline" onClick={a.clearExpired}>
              Clear from phone
            </Btn>
          </div>
        }
      >
        {done} takes stayed on this phone for 24h and can no longer be
        submitted. Nothing was submitted, so nothing was lost from your wallet.
      </Notice>
    )
  }
  if (sess.status === "upload_failed")
    return (
      <Notice
        tone="attention"
        icon="upload"
        title={`${j.title} didn't upload`}
        action={
          <Btn size="sm" v="ink" icon="retry" onClick={a.resume}>
            Retry upload
          </Btn>
        }
      >
        {sess.clips.length} takes are safe on this phone. This is a connection
        problem, not a rejection. Resume within {sess.resumeLeft}.
      </Notice>
    )
  if (sess.status === "uploading")
    return (
      <Notice tone="info" icon="upload" title={`Uploading ${j.title}`}>
        Keep the app open. It's "submitted" only once every take arrives.
      </Notice>
    )
  return (
    <div className="grad-voice relative overflow-hidden rounded-lg p-5 text-white shadow-brand">
      <div className="relative">
        <span className="eyebrow text-white/70">Continue recording</span>
        <div className="semi mt-1.5 text-20 leading-tight font-semibold">
          {j.title}
        </div>
        <div className="tnum mt-1 text-14 text-white/75">
          {done} of {sess.clips.length} on this phone · {inr(sess.locked.total)}{" "}
          locked
        </div>
        <div className="mt-4 flex gap-1">
          {sess.clips.map((c, i) => (
            <span
              key={i}
              className={`h-1.5 flex-1 rounded-full ${
                c.state !== "ready" ? "bg-white" : "bg-white/25"
              }`}
            />
          ))}
        </div>
        {sess.honoured && (
          <p className="mt-3 text-12 text-white/80">
            Campaign closed to new work. Your session is honoured at the locked
            rate.
          </p>
        )}
        <div className="mt-4 flex items-center gap-3">
          <Btn v="white" size="sm" icon="mic" onClick={a.resume}>
            Resume
          </Btn>
          <span className="tnum text-12 text-white/70">
            {sess.resumeLeft} left
          </span>
        </div>
      </div>
    </div>
  )
}

function HeroScene({ id }: { id: string }) {
  const { s, a } = useStore()
  const j = sel.job(s, id)
  return (
    <div className="overflow-hidden rounded-lg bg-surface shadow-card">
      <button
        onClick={() => a.push({ name: "detail", jobId: j.id })}
        className="group block w-full text-left"
      >
        <div className="flex items-center gap-3 px-5 pt-4">
          <SettingTile env={j.env} size={44} />
          <div className="flex min-w-0 flex-wrap gap-1.5">
            <LengthTag l={lengthOf(j)} />
            <RareTag x={j.coverage} />
          </div>
        </div>
        <div className="flex items-start justify-between gap-4 px-5 pt-3">
          <div className="min-w-0">
            <div className="semi text-18 leading-tight font-semibold">
              {j.title}
            </div>
            <p className="mt-1 line-clamp-2 text-14 leading-snug text-ink-2">
              {j.situation}
            </p>
            <p className="tnum mt-2 flex flex-wrap items-center gap-x-1.5 text-12 text-ink-2">
              <Icon n={FORMAT_ICON[j.format]} s={14} />
              {FORMAT_LABEL[j.format]} · ~{j.minutes} min ·{" "}
              <span lang={j.lang}>{LANGS[j.lang].native}</span>
            </p>
          </div>
          <div className="shrink-0 text-right">
            <div className="cond tnum text-24 leading-none font-semibold text-ink">
              {inr(jobTotal(j))}
            </div>
            <div className="tnum mt-1 text-11 font-medium text-ink-2">
              +{inr(j.bonus)} bonus
            </div>
          </div>
        </div>
      </button>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-line px-5 pt-3.5 pb-4">
        <span className="tnum text-12 text-ink-2">
          Guaranteed pay · ≈{inr(perHour(j))}/hr
        </span>
        <Btn size="md" v="voice" icon="mic" onClick={() => a.startJob(j.id)}>
          {s.ledger.length === 0 ? "Start my first scene" : "Start scene"}
        </Btn>
      </div>
    </div>
  )
}

function QuickRail({ ids }: { ids: string[] }) {
  const { s, a } = useStore()
  return (
    <section className="mt-8 px-5">
      <div className="mb-2 flex items-end justify-between">
        <div>
          <h2 className="semi text-18 font-semibold">Fits in a chai break</h2>
          <p className="mt-0.5 text-14 text-ink-2">
            Quick scenes, {LENGTHS.quick.range.toLowerCase()}
          </p>
        </div>
        <button
          onClick={() => a.openLen("quick")}
          className="text-14 font-medium text-brand"
        >
          See all
        </button>
      </div>
      <div className="divide-y divide-line border-y border-line">
        {ids.map((id) => {
          const j = sel.job(s, id)
          return (
            <button
              key={id}
              onClick={() => a.push({ name: "detail", jobId: id })}
              className="flex w-full items-center gap-3.5 py-3 text-left transition-colors hover:bg-surface/60"
            >
              <SettingTile env={j.env} size={40} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-16 font-medium">{j.title}</div>
                <div className="tnum mt-0.5 text-12 text-ink-2">
                  {FORMAT_LABEL[j.format]} · ~{j.minutes} min ·{" "}
                  {LANGS[j.lang].native}
                </div>
              </div>
              <div className="text-right">
                <div className="cond tnum text-18 leading-none font-semibold">
                  {inr(jobTotal(j))}
                </div>
                <div className="tnum mt-0.5 text-11 text-ink-2">
                  +{inr(j.bonus)} bonus
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}

function LengthTiles() {
  const { s, a } = useStore()
  const mine = sel.openForMe(s)
  const later = sel
    .eligible(s)
    .filter(
      (j) =>
        j.campaign === "open" && j.prompts.length > 0 && j.tier > sel.tier(s),
    )
  const keys: Length[] = ["quick", "core", "deep"]
  return (
    <Section
      title="Choose by time"
      sub="Pay is set by minutes of real effort, then lifted for rare voices."
      className="mt-8"
    >
      <div className="divide-y divide-line border-y border-line">
        {keys.map((k, i) => {
          const n = mine.filter((j) => lengthOf(j) === k).length
          const locked = later.filter((j) => lengthOf(j) === k)
          return (
            <button
              key={k}
              onClick={() =>
                n === 0 && locked.length
                  ? a.push({ name: "profile" })
                  : a.openLen(k)
              }
              className="flex w-full items-center gap-3.5 py-3 text-left transition-colors hover:bg-surface/60"
            >
              <span
                className={`grid h-9 w-9 place-items-center rounded-full ${
                  i === 0 ? "bg-brand-soft text-brand" : "bg-surface-3 text-ink"
                }`}
              >
                <Icon n={LENGTHS[k].icon} s={17} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-16 font-medium">
                  {LENGTHS[k].label}
                </span>
                <span className="tnum block text-12 text-ink-2">
                  {LENGTHS[k].range} · {LENGTHS[k].pay}
                </span>
              </span>
              <span
                className={`tnum shrink-0 text-12 font-medium ${
                  n > 0
                    ? "text-ink-2"
                    : locked.length
                      ? "text-brand-deep"
                      : "text-ink-3"
                }`}
              >
                {n > 0
                  ? `${n} open`
                  : locked.length
                    ? `Level ${Math.min(...locked.map((j) => j.tier))}`
                    : "None now"}
              </span>
              <Icon n="chev" s={16} className="shrink-0 text-ink-3" />
            </button>
          )
        })}
      </div>
    </Section>
  )
}

/** Never an empty Home: when a language has no open scenes, say when it's coming and offer a way to work now. */
function NoWork() {
  const { s, a } = useStore()
  const name = LANGS[s.lang].name
  const planned = s.jobs.some((j) => j.lang === s.lang)
  const counts = new Map<Lang, number>()
  if (!s.supplyEmpty)
    for (const j of s.jobs)
      if (j.campaign === "open" && j.prompts.length > 0 && j.lang !== s.lang)
        counts.set(j.lang, (counts.get(j.lang) ?? 0) + 1)
  const spoken = (s.langs ?? [s.lang]).filter((l) => counts.has(l))
  const offer = (
    spoken.length
      ? spoken
      : [...counts.keys()].sort((x, y) => counts.get(y)! - counts.get(x)!)
  ).slice(0, 3)
  return (
    <section className="mx-5 mt-6 overflow-hidden rounded-lg bg-surface shadow-card">
      <div className="flex items-center gap-4 bg-brand-soft/60 p-5">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white/80 text-brand-deep">
          <Icon n="bell" s={22} />
        </span>
        <div className="min-w-0">
          <span className="eyebrow text-brand-deep">
            {planned ? "Full for now" : "Coming soon"}
          </span>
          <h3 className="semi mt-1 text-18 leading-tight font-semibold">
            {planned
              ? `${name} scenes are full`
              : `${name} scenes are on the way`}
          </h3>
        </div>
      </div>
      <div className="p-5 pt-4">
        <p className="text-14 leading-relaxed text-ink-2">
          {planned
            ? `Labs have enough ${name} for their current campaigns. New ones usually open within 2–3 days. We never show filler work.`
            : `Labs are planning ${name} campaigns. Your spot is saved, and rare voices are paid more when they open.`}
        </p>
        <Btn
          full
          icon="bell"
          v="voice"
          className="mt-4"
          onClick={() => (
            a.enableAlerts(), a.toast(`Bolo will wake you when ${name} opens`)
          )}
        >
          Wake me when it opens
        </Btn>
        {offer.length > 0 && (
          <div className="mt-5 border-t border-line pt-4">
            <p className="text-12 font-medium text-ink-2">
              {spoken.length
                ? "Record now in another language you speak"
                : "Also speak one of these?"}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {offer.map((l) => (
                <button
                  key={l}
                  onClick={() => a.chooseLang(l)}
                  className="flex h-10 items-center gap-2 rounded-full bg-surface-2 pr-3.5 pl-3 shadow-[inset_0_0_0_1px_var(--color-line)] transition-transform active:scale-95"
                >
                  <span lang={l} className="text-14 font-medium">
                    {LANGS[l].native}
                  </span>
                  <span className="tnum text-12 text-ink-2">
                    {counts.get(l)} open
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
        {offer.length === 0 && (
          <Btn
            full
            v="outline"
            className="mt-2"
            onClick={() => a.openSheet("edit")}
          >
            Add another language
          </Btn>
        )}
      </div>
    </section>
  )
}

function Checklist() {
  const { s, a } = useStore()
  const m = shortest(s)
  const items = [
    {
      l: "Record your first scene",
      d: m ? `About ${m} minutes with Bolo` : "A short scene with Bolo",
      done: s.submissions.length > 0,
      go: () => a.setTab("jobs"),
      icon: "mic",
    },
    {
      l: "Add your UPI",
      d: "Where withdrawals land",
      done: !!s.upi,
      go: () => a.push({ name: "withdraw" }),
      icon: "bank",
    },
    {
      l: "Check your name",
      d: "Must match your UPI",
      done: s.checklist.profile,
      go: () => a.openSheet("edit"),
      icon: "user",
    },
    {
      l: "Turn on alerts",
      d: "Reviews and payments",
      done: s.checklist.alerts,
      go: () => (a.enableAlerts(), a.toast("Alerts on")),
      icon: "bell",
    },
  ] as const
  const n = items.filter((i) => i.done).length
  return (
    <section
      aria-labelledby="setup-h"
      className="mx-5 mt-4 rounded-lg bg-surface px-4 pt-4 pb-1 shadow-card"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="setup-h" className="semi text-16 font-semibold">
          Get set up
        </h2>
        <span className="tnum text-12 font-medium text-ink-2">
          {n} of 4 done
        </span>
      </div>
      <div
        role="progressbar"
        aria-label="Setup progress"
        aria-valuemin={0}
        aria-valuemax={4}
        aria-valuenow={n}
        className="mt-2.5 flex gap-1"
      >
        {items.map((it) => (
          <span
            key={it.l}
            className={`h-1 flex-1 rounded-full transition-colors ${
              it.done ? "bg-money" : "bg-surface-3"
            }`}
          />
        ))}
      </div>
      <div className="mt-2 divide-y divide-line">
        {items.map((it) => (
          <button
            key={it.l}
            disabled={it.done}
            onClick={it.go}
            className="flex min-h-[52px] w-full items-center gap-3 py-2 text-left disabled:cursor-default"
          >
            <span
              className={`grid h-8 w-8 shrink-0 place-items-center rounded-full transition-colors ${
                it.done
                  ? "bg-money-soft text-money-ink"
                  : "bg-surface-3 text-ink"
              }`}
            >
              <Icon n={it.done ? "check" : it.icon} s={15} stroke={2} />
            </span>
            <span className="min-w-0 flex-1">
              <span
                className={`block text-14 font-medium ${
                  it.done ? "text-ink-3 line-through" : ""
                }`}
              >
                {it.l}
              </span>
              <span className="block truncate text-12 text-ink-2">{it.d}</span>
            </span>
            {!it.done && (
              <Icon n="chev" s={16} className="shrink-0 text-ink-3" />
            )}
          </button>
        ))}
      </div>
    </section>
  )
}
