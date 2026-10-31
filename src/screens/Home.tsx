import { useEffect, useState } from "react"
import {
  FORMAT_LABEL,
  LANGS,
  LENGTHS,
  jobTotal,
  lengthOf,
  perHour,
  type Length,
  type State,
} from "../state/model"
import { MIN_WITHDRAW, sel, useStore } from "../state/store"
import Bolo, { Bubble, Typed, type Mood } from "../ui/Bolo"
import {
  Btn,
  Card,
  FORMAT_ICON,
  Icon,
  LengthTag,
  Money,
  Notice,
  RareTag,
  Section,
  Status,
  Tag,
  Waveform,
  inr,
} from "../ui/kit"

/** Missions already done: anything submitted, plus earnings recorded under a mission's title. */
function finished(s: State) {
  const earned = new Set(
    s.ledger.filter((l) => l.kind === "earning").map((l) => l.title),
  )
  return new Set([
    ...s.submissions.map((x) => x.jobId),
    ...s.jobs.filter((j) => earned.has(j.title)).map((j) => j.id),
  ])
}

/** Minutes of the shortest mission open to this contributor, if any. */
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
  // First mission: the shortest one. After that: the rarest voice that still fits one sitting.
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
      <BoloGreeting greet={greet} />

      {(s.session ||
        attention.length > 0 ||
        (s.withdrawal && s.withdrawal.status !== "paid")) && (
        <div className="mt-5 flex flex-col gap-2.5 px-5">
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
              <span className="grid h-10 w-10 place-items-center rounded-full bg-orange-soft text-orange-ink">
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

      {isNew ? <FirstHundred /> : <MoneyCard />}

      {empty ? (
        <NoWork />
      ) : (
        <>
          {next ? (
            <section className="mt-9 px-5">
              <div className="mb-3.5 flex items-end justify-between">
                <h2 className="semi text-20 font-bold">
                  {isNew ? "Your first mission" : "Picked for your voice"}
                </h2>
                <button
                  onClick={() => a.openLen("all")}
                  className="text-14 font-semibold text-cobalt"
                >
                  All {open.length}
                </button>
              </div>
              <HeroMission id={next.id} />
            </section>
          ) : (
            <p className="mt-9 px-5 text-16 text-ink-2">
              You've started everything open for you today. New missions show up
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
          className="mt-10"
        >
          <Card className="divide-y divide-line px-4 py-1">
            {reviewing.map((x) => {
              const j = sel.job(s, x.jobId)
              return (
                <button
                  key={x.id}
                  onClick={() => a.push({ name: "submission", id: x.id })}
                  className="flex w-full items-center gap-3.5 py-3.5 text-left"
                >
                  <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-orange-soft">
                    <span className="ping-soft absolute inset-2 rounded-full bg-orange/40" />
                    <span className="relative h-2 w-2 rounded-full bg-orange" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-16 font-semibold">
                      {j.title}
                    </span>
                    <span className="block truncate text-12 text-ink-2">
                      {x.waitReason}
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="cond tnum block text-20 leading-none font-bold">
                      {inr(x.total)}
                    </span>
                    <span className="text-11 font-semibold text-orange-ink">
                      pending
                    </span>
                  </span>
                </button>
              )
            })}
          </Card>
        </Section>
      )}

      {isNew && <Checklist />}
    </div>
  )
}

/* Bolo's line is always about the user's actual situation — never filler. */
function BoloGreeting({ greet }: { greet: string }) {
  const { s } = useStore()
  const open = sel.openForMe(s)
  const isNew = s.ledger.length === 0 && s.submissions.length === 0
  const attention = sel.attention(s)
  const review = s.submissions.find((x) => x.status === "under_review")
  const sess = s.session
  let mood: Mood = "idle"
  let line = `${open.length} missions are open in ${LANGS[s.lang].name}. The quick ones fit in a chai break.`
  if (sel.eligible(s).length === 0) {
    mood = "sleep"
    line = `No ${LANGS[s.lang].name} missions right now. I'll wake you the moment labs need your voice.`
  } else if (isNew) {
    mood = "idle"
    const m = shortest(s)
    line = `I'm Bolo, I run the studio. ${
      m ? `Your first mission takes about ${m} minutes. ` : ""
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
    mood = "think"
    line = `${sel.job(s, review.jobId).title} is with reviewers. Usually back within 24 hours. I'll ping you.`
  }
  const [hello, setHello] = useState(true)
  useEffect(() => {
    const t = setTimeout(() => setHello(false), 1700)
    return () => clearTimeout(t)
  }, [])
  return (
    <div className="px-5 pt-1">
      <h1 className="semi rise text-30 font-bold tracking-[-0.025em]">
        {greet}, {s.name}
      </h1>
      <div className="mt-3 flex items-start gap-2">
        <div className="-ml-2 shrink-0">
          <Bolo
            mood={hello && mood !== "sleep" ? "hello" : mood}
            size={78}
            label="Bolo"
          />
        </div>
        <Bubble tail="left" className="mt-2 flex-1">
          <p className="text-14 leading-snug">
            <Typed text={line} step={32} />
          </p>
        </Bubble>
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
    <div className="relative overflow-hidden rounded-lg bg-cobalt p-5 text-white shadow-cobalt">
      <div className="relative">
        <span className="eyebrow text-white/70">Continue recording</span>
        <div className="semi mt-1.5 text-24 leading-tight font-bold">
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

/* Ink plate: lime is money that's yours, orange is money waiting on reviewers. They never merge. */
function MoneyCard() {
  const { s, a } = useStore()
  const inReview = sel.inReview(s) + sel.held(s)
  const gap = Math.max(0, MIN_WITHDRAW - s.available)
  const scale = Math.max(MIN_WITHDRAW, s.available + inReview)
  const rate = sel.rate(s)
  return (
    <div className="rise relative mx-5 mt-5 overflow-hidden rounded-lg bg-ink p-5 text-white shadow-float">
      <div className="flex items-center justify-between">
        <span className="eyebrow text-white/55">Yours to withdraw</span>
        {rate > 0 && (
          <Tag tone="studio" icon="trend">
            <span className="tnum">≈{inr(rate)}/hr</span>
          </Tag>
        )}
      </div>
      <div className="cond mt-2 text-88 font-bold tracking-[-0.02em] text-lime">
        <Money value={s.available} />
      </div>
      <p className="tnum mt-1 text-14 text-white/60">
        +{inr(sel.thisWeek(s))} approved this week from {sel.minsWeek(s)} min of
        speaking
      </p>

      <div
        className="mt-5 flex h-2.5 gap-[3px] overflow-hidden rounded-full bg-white/10"
        role="img"
        aria-label={`${inr(s.available)} available, ${inr(inReview)} in review`}
      >
        <span
          className="grow-x h-full rounded-full bg-lime"
          style={{ width: `${(s.available / scale) * 100}%` }}
        />
        {inReview > 0 && (
          <span
            className="grow-x pulse-dot h-full rounded-full bg-orange"
            style={{
              width: `${(inReview / scale) * 100}%`,
              animationDelay: "200ms",
            }}
          />
        )}
      </div>
      <div className="tnum mt-2.5 flex items-center justify-between text-12 text-white/60">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-lime" /> Available
          {inReview > 0 && (
            <>
              <span className="ml-2 h-2 w-2 rounded-full bg-orange" />{" "}
              {inr(inReview)} with reviewers
            </>
          )}
        </span>
        <span>{gap > 0 ? `${inr(gap)} to ₹${MIN_WITHDRAW}` : "No fees"}</span>
      </div>

      <div className="my-4 opacity-25">
        <Waveform seed={9} bars={64} h={10} tone="light" />
      </div>
      <div className="flex items-center gap-2">
        {gap > 0 ? (
          <Btn
            v="glass"
            size="sm"
            onClick={() => a.setTab("wallet")}
            iconRight="arrow"
          >
            Open wallet
          </Btn>
        ) : (
          <Btn
            v="money"
            size="sm"
            onClick={() => a.push({ name: "withdraw" })}
            icon="bank"
          >
            Withdraw {inr(s.available)}
          </Btn>
        )}
        <span className="text-12 text-white/50">
          {gap > 0
            ? gap <= 30
              ? "One Quick mission and you can withdraw."
              : "A few missions and you can withdraw."
            : "Reaches your UPI in 1 working day."}
        </span>
      </div>
    </div>
  )
}

function FirstHundred() {
  const { s } = useStore()
  const open = sel
    .openForMe(s)
    .slice()
    .sort((x, y) => x.minutes - y.minutes)
  let acc = 0
  const path = open.filter((j) =>
    acc < MIN_WITHDRAW ? ((acc += jobTotal(j)), true) : false,
  )
  const mins = path.reduce((t, j) => t + j.minutes, 0)
  return (
    <div className="rise relative mx-5 mt-5 overflow-hidden rounded-lg bg-ink p-5 text-white shadow-float">
      <span className="eyebrow text-white/55">Your first withdrawal</span>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="cond text-88 font-bold text-lime">₹0</span>
        <span className="cond tnum text-30 font-bold text-white/35">
          / ₹{MIN_WITHDRAW}
        </span>
      </div>
      <div className="mt-5 flex items-center gap-1">
        {path.map((j, i) => (
          <div
            key={j.id}
            className="relative h-2.5 min-w-0 overflow-hidden rounded-full bg-white/15"
            style={{ flex: jobTotal(j) }}
          >
            <span
              className="sheen absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/50 to-transparent"
              style={{ animationDelay: `${600 + i * 180}ms` }}
            />
          </div>
        ))}
        <span className="ml-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-lime text-ink">
          <Icon n="bank" s={14} />
        </span>
      </div>
      <p className="tnum mt-4 text-14 leading-snug text-white/70">
        <span className="font-semibold text-white">
          {path.length} missions, about {mins} minutes of talking,
        </span>{" "}
        get you to ₹{MIN_WITHDRAW}. Money becomes yours once reviewers approve
        each one.
      </p>
    </div>
  )
}

function HeroMission({ id }: { id: string }) {
  const { s, a } = useStore()
  const j = sel.job(s, id)
  return (
    <div
      className="rise overflow-hidden rounded-lg bg-surface shadow-card"
      style={{ animationDelay: "120ms" }}
    >
      <button
        onClick={() => a.push({ name: "detail", jobId: j.id })}
        className="group block w-full text-left"
      >
        <div className="relative h-[176px] overflow-hidden bg-surface-3">
          <img
            src={j.image}
            alt=""
            className="h-full w-full object-cover transition-transform duration-[1200ms] ease-(--ease-out) group-hover:scale-105"
            onError={(e) => (e.currentTarget.style.visibility = "hidden")}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/55 via-transparent to-transparent" />
          <div className="absolute top-3.5 left-3.5 flex gap-1.5">
            <LengthTag l={lengthOf(j)} dark />
            <RareTag x={j.coverage} />
          </div>
          <div className="absolute right-4 bottom-3.5 left-4 flex items-center gap-1.5 text-12 font-semibold text-white">
            <Icon n={FORMAT_ICON[j.format]} s={14} />
            {FORMAT_LABEL[j.format]} ·{" "}
            <span className="tnum">~{j.minutes} min</span> · {j.turns}{" "}
            {j.format === "LINES" ? "lines" : "turns"} · {LANGS[j.lang].native}
          </div>
        </div>
        <div className="px-5 pt-4">
          <div className="semi text-24 leading-tight font-bold tracking-[-0.015em]">
            {j.title}
          </div>
          <p className="mt-1 line-clamp-2 text-14 leading-snug text-ink-2">
            {j.situation}
          </p>
        </div>
      </button>
      <div className="mx-5 mt-4 grid grid-cols-3 divide-x divide-line rounded-md bg-surface-2">
        {[
          [inr(jobTotal(j)), "guaranteed"],
          [`+${inr(j.bonus)}`, "quality bonus"],
          [`≈${inr(perHour(j))}`, "per hour"],
        ].map(([v, l]) => (
          <div key={l} className="px-3 py-2.5">
            <div className="cond tnum text-24 leading-none font-bold">{v}</div>
            <div className="mt-1 text-11 font-medium text-ink-2">{l}</div>
          </div>
        ))}
      </div>
      <div className="p-5 pt-4">
        <Btn
          full
          size="lg"
          v="voice"
          icon="mic"
          onClick={() => a.startJob(j.id)}
        >
          {s.ledger.length === 0 ? "Start my first mission" : "Start mission"}
        </Btn>
      </div>
    </div>
  )
}

function QuickRail({ ids }: { ids: string[] }) {
  const { s, a } = useStore()
  return (
    <section className="mt-9">
      <div className="mb-3.5 flex items-end justify-between px-5">
        <div>
          <h2 className="semi text-20 font-bold">Fits in a chai break</h2>
          <p className="mt-0.5 text-14 text-ink-2">
            Quick missions, {LENGTHS.quick.range.toLowerCase()}
          </p>
        </div>
        <button
          onClick={() => a.openLen("quick")}
          className="text-14 font-semibold text-cobalt"
        >
          See all
        </button>
      </div>
      <div className="no-scrollbar flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-5 pb-2">
        {ids.map((id, i) => {
          const j = sel.job(s, id)
          return (
            <button
              key={id}
              onClick={() => a.push({ name: "detail", jobId: id })}
              className="rise group w-[172px] shrink-0 snap-start overflow-hidden rounded-lg bg-surface text-left shadow-card transition-transform duration-300 ease-(--ease-spring) active:scale-[0.97]"
              style={{ animationDelay: `${160 + i * 60}ms` }}
            >
              <div className="relative h-[92px] overflow-hidden bg-surface-3">
                <img
                  src={j.image}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  onError={(e) => (e.currentTarget.style.visibility = "hidden")}
                />
                <span className="absolute top-2 left-2">
                  <Tag tone="white" icon={FORMAT_ICON[j.format]}>
                    {LANGS[j.lang].native}
                  </Tag>
                </span>
              </div>
              <div className="p-3">
                <div className="truncate text-14 font-semibold">{j.title}</div>
                <div className="mt-1.5 flex items-baseline justify-between">
                  <span className="cond tnum text-24 leading-none font-bold">
                    {inr(jobTotal(j))}
                  </span>
                  <span className="tnum text-12 text-ink-2">
                    {j.minutes} min
                  </span>
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
      className="mt-9"
    >
      <div className="grid grid-cols-3 gap-2">
        {keys.map((k, i) => {
          const n = mine.filter((j) => lengthOf(j) === k).length
          const locked = later.filter((j) => lengthOf(j) === k)
          return (
            <button
              key={k}
              onClick={() => a.openLen(k)}
              className="rise flex h-[148px] flex-col justify-between rounded-lg bg-surface p-3.5 text-left shadow-card transition-transform duration-300 ease-(--ease-spring) active:scale-[0.96]"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <span
                className={`grid h-9 w-9 place-items-center rounded-full ${
                  i === 0 ? "bg-ink text-white" : "bg-surface-3 text-ink"
                }`}
              >
                <Icon n={LENGTHS[k].icon} s={17} />
              </span>
              <span>
                <span className="block text-16 font-semibold">
                  {LENGTHS[k].label}
                </span>
                <span className="tnum block text-12 text-ink-2">
                  {LENGTHS[k].range}
                </span>
                <span className="tnum block text-12 text-ink-2">
                  {LENGTHS[k].pay}
                </span>
                <span className="tnum mt-1 block text-12 font-semibold">
                  {n > 0
                    ? `${n} open`
                    : locked.length
                      ? `Level ${Math.min(...locked.map((j) => j.tier))} unlocks`
                      : "None open now"}
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </Section>
  )
}

function NoWork() {
  const { s, a } = useStore()
  return (
    <div className="mx-5 mt-8 rounded-lg bg-surface p-6 text-center shadow-card">
      {/* Bolo already says this above; the card stays a quiet, flat waveform. */}
      <Waveform
        seed={3}
        bars={28}
        h={32}
        progress={0}
        className="mx-auto max-w-[168px]"
      />
      <h3 className="semi mt-4 text-24 font-bold">
        {LANGS[s.lang].name} is full for now
      </h3>
      <p className="mt-2 text-14 leading-relaxed text-ink-2">
        Labs have enough {LANGS[s.lang].name} recordings for their current
        campaigns. New ones usually open within 2–3 days. We never show filler
        work.
      </p>
      <div className="mt-5 flex flex-col gap-2">
        <Btn
          icon="bell"
          v="voice"
          onClick={() => (
            a.enableAlerts(),
            a.toast(`Bolo will wake you when ${LANGS[s.lang].name} work opens`)
          )}
        >
          Wake me when it opens
        </Btn>
        <Btn v="outline" onClick={() => a.openSheet("edit")}>
          Add another language
        </Btn>
      </div>
    </div>
  )
}

function Checklist() {
  const { s, a } = useStore()
  const m = shortest(s)
  const items = [
    {
      l: "Record your first mission",
      d: m ? `About ${m} minutes with Bolo` : "A short mission with Bolo",
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
  ]
  const n = items.filter((i) => i.done).length
  return (
    <Section
      title="Get set up"
      action={
        <span className="tnum text-14 font-semibold text-ink-2">{n}/4</span>
      }
      className="mt-10"
    >
      <Card className="px-2 py-1">
        {items.map((it) => (
          <button
            key={it.l}
            disabled={it.done}
            onClick={it.go}
            className="flex w-full items-center gap-3.5 rounded-md px-2 py-3 text-left transition-colors hover:bg-surface-2 disabled:hover:bg-transparent"
          >
            <span
              className={`grid h-9 w-9 place-items-center rounded-full transition-colors ${
                it.done ? "bg-lime text-ink" : "bg-surface-3 text-ink"
              }`}
            >
              <Icon n={it.done ? "check" : it.icon} s={16} stroke={2} />
            </span>
            <span className="flex-1">
              <span
                className={`block text-16 font-semibold ${
                  it.done ? "text-ink-3 line-through" : ""
                }`}
              >
                {it.l}
              </span>
              <span className="block text-12 text-ink-2">{it.d}</span>
            </span>
            {!it.done && <Icon n="chev" s={18} className="text-ink-3" />}
          </button>
        ))}
      </Card>
    </Section>
  )
}
