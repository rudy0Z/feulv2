import { useState } from "react"
import { FORMAT_LABEL, type ClipState } from "../state/model"
import { MIN_WITHDRAW, sel, useStore } from "../state/store"
import { BoloBadge, BoloStage, Confetti } from "../ui/Bolo"
import MoneyMoment from "../ui/MoneyMoment"
import {
  BackBar,
  Btn,
  Card,
  Icon,
  Label,
  Meter,
  Money,
  Notice,
  Player,
  STATUS,
  Status,
  Tag,
  Timeline,
  Waveform,
  inr,
  mmss,
  useTone,
} from "../ui/kit"
import { LeaveFlow } from "./Studio"

/* Dark status chip for the studio surfaces. */
function StudioStatus({ k }: { k: ClipState }) {
  const [l] = STATUS[k] ?? [k]
  const c =
    k === "upload_failed"
      ? "bg-orange/15 text-orange"
      : k === "uploading"
        ? "bg-cobalt/25 text-peri"
        : "bg-white/8 text-studio-ink-2"
  return (
    <span
      className={`inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-12 font-semibold ${c}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full bg-current ${
          k === "uploading" ? "pulse-dot" : ""
        }`}
      />
      {l}
    </span>
  )
}

/* Check before submitting: everything is still only on this phone. */
export default function Review() {
  const { s, a } = useStore()
  useTone("light", "studio")
  const sess = s.session
  const [leave, setLeave] = useState(false)
  if (!sess) return null
  const j = sel.job(s, sess.jobId)
  const room = j.format === "ROOM"
  const lines = j.format === "LINES"
  const up = sess.status === "uploading"
  const failed = sess.status === "upload_failed"
  const secs = sess.clips.reduce((t, c) => t + c.secs, 0)
  return (
    <div className="relative flex flex-1 flex-col bg-studio text-studio-ink">
      <BackBar
        dark
        title={sess.repairOf ? "Check your fix" : "Check before submitting"}
        onBack={() => setLeave(true)}
      />
      <div className="px-5 pt-2">
        <h1 className="semi text-30 font-bold tracking-[-0.02em]">{j.title}</h1>
        <p className="tnum mt-1.5 text-14 text-studio-ink-2">
          {room
            ? "One room take"
            : `${sess.clips.length} ${
                sess.clips.length === 1 ? "take" : "takes"
              }`}{" "}
          · {mmss(secs)} of audio · on this phone, not submitted
        </p>
      </div>

      <div className="mx-5 mt-5 grid grid-cols-3 divide-x divide-studio-line rounded-lg bg-studio-2 shadow-[inset_0_0_0_1px_var(--color-studio-line)]">
        {[
          [inr(sess.locked.total), "locked for you"],
          [
            sess.locked.bonus ? `+${inr(sess.locked.bonus)}` : "—",
            "bonus if clean",
          ],
          ["~24h", "human review"],
        ].map(([v, l]) => (
          <div key={l} className="px-3.5 py-3">
            <div className="cond tnum text-24 leading-none font-bold">{v}</div>
            <div className="mt-1 text-11 font-medium text-studio-ink-2">
              {l}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-col gap-2 px-5">
        {failed && (
          <div className="flex gap-3 rounded-lg bg-orange/10 p-4 shadow-[inset_0_0_0_1px_rgb(255_90_31/.4)]">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-orange text-white">
              <Icon n="upload" s={16} stroke={2} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-16 font-semibold">
                Upload didn't finish · nothing was lost
              </div>
              <p className="mt-0.5 text-14 leading-snug text-studio-ink-2">
                The connection dropped before Feul received every take. They are
                still on this phone. This is not a review decision.
              </p>
              <div className="mt-3 flex gap-2">
                <Btn size="sm" v="white" icon="retry" onClick={a.submit}>
                  Retry upload
                </Btn>
                <Btn
                  size="sm"
                  v="glass"
                  onClick={() => (
                    a.leaveSession(),
                    a.toast(
                      `Saved on this phone · resume within ${sess.resumeLeft}`,
                    )
                  )}
                >
                  Upload later
                </Btn>
              </div>
            </div>
          </div>
        )}
        {!failed && !up && sess.clips.some((c) => c.retaken) && (
          <div className="flex gap-3 rounded-lg bg-white/[.06] p-4">
            <Icon n="check" s={18} className="mt-0.5 text-lime" stroke={2.2} />
            <p className="text-14 leading-snug text-studio-ink-2">
              <span className="font-semibold text-studio-ink">
                {sess.repairOf
                  ? "Fix recorded. Only this turn is re-reviewed."
                  : "Retakes saved. Every take is ready."}
              </span>{" "}
              {sess.repairOf
                ? "Your accepted turns stay accepted."
                : "New takes replaced the old ones on this phone. Nothing is sent until you submit."}
            </p>
          </div>
        )}
      </div>

      <ul className="mx-5 mt-3 divide-y divide-studio-line overflow-hidden rounded-lg bg-studio-2 shadow-[inset_0_0_0_1px_var(--color-studio-line)]">
        {sess.clips.map((c, i) => (
          <li key={c.id} className="p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="flex min-w-0 gap-3">
                <span className="tnum grid h-7 min-w-7 shrink-0 place-items-center rounded-full bg-cobalt px-2 text-12 font-semibold text-white">
                  {room ? c.prompt.speaker : i + 1}
                </span>
                <div
                  lang={lines ? j.lang : undefined}
                  className={`line-clamp-2 pt-0.5 leading-snug ${
                    lines ? "script text-16 font-semibold" : "text-14"
                  }`}
                >
                  {c.prompt.text}
                </div>
              </div>
              <StudioStatus k={c.state} />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Player
                  dark
                  seed={c.seed}
                  secs={c.secs || 4}
                  label={`take ${i + 1}`}
                />
              </div>
              {!room && !up && (
                <button
                  onClick={() => {
                    a.setClip(i, { state: "ready", secs: 0, retaken: true })
                    a.goClip(i)
                    a.replace({ name: "studio" })
                  }}
                  className="flex h-10 items-center gap-1.5 rounded-full bg-white/8 px-3.5 text-12 font-semibold transition-[background-color,scale] duration-200 ease-(--ease-spring) hover:bg-white/12 active:scale-[0.96]"
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
            sess.clips.forEach((_, i) =>
              a.setClip(i, { state: "ready", secs: 0 }),
            )
            a.goClip(0)
            a.replace({ name: "studio" })
          }}
          className="mx-5 mt-3 self-start text-14 font-semibold text-peri"
        >
          Retake the whole room take
        </button>
      )}

      <div className="mt-auto px-5 pt-8 pb-8">
        <p className="mb-3 text-12 leading-snug text-studio-ink-2">
          You submit once. Reviewers then check the {room ? "take" : "turns"},
          usually within 24h, and the {inr(sess.locked.total)} becomes yours
          once they approve.
        </p>
        {up && (
          <div className="mb-3" aria-live="polite">
            <div className="mb-1.5 flex justify-between text-12 font-semibold text-studio-ink-2">
              <span>Uploading every take…</span>
              <span>Keep the app open</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="grow-x h-full w-full rounded-full bg-cobalt-hi"
                style={{ animationDuration: "2200ms" }}
              />
            </div>
          </div>
        )}
        {!failed && (
          <Btn
            full
            size="lg"
            v="voice"
            loading={up}
            icon="upload"
            onClick={a.submit}
          >
            {up
              ? "Uploading"
              : sess.repairOf
                ? "Send the fix"
                : "Submit for review"}
          </Btn>
        )}
      </div>
      <LeaveFlow open={leave} onClose={() => setLeave(false)} />
    </div>
  )
}

/* Session complete: the work is done and celebrated, the money is honestly still pending. */
export function Complete({ id }: { id: string }) {
  const { s, a } = useStore()
  useTone("light", "studio")
  const sub = s.submissions.find((x) => x.id === id)
  if (!sub) return null
  const j = sel.job(s, sub.jobId)
  const secs = sub.clips.reduce((t, c) => t + c.secs, 0)
  const done = new Set(s.submissions.map((x) => x.jobId))
  const next = sel.openForMe(s).find((x) => !done.has(x.id))
  const unit = j.format === "LINES" ? "line" : "turn"
  return (
    <div className="flex flex-1 flex-col bg-studio pb-8 text-studio-ink">
      <div className="flex flex-col items-center px-6 pt-[62px] text-center">
        <div className="relative">
          <BoloStage state="complete" size={216} />
          <Confetti
            n={26}
            coins={false}
            delay={300}
            colors={["#2B3BFF", "#C6F432", "#9AA3FF", "#FFFFFF", "#FF5A1F"]}
          />
        </div>
        <span
          className="eyebrow rise -mt-2 text-lime"
          style={{ animationDelay: "200ms" }}
        >
          Session complete
        </span>
        <h1
          className="semi rise mt-2 text-38 font-bold tracking-[-0.03em]"
          style={{ animationDelay: "280ms" }}
        >
          That's every {unit}.
        </h1>
        <p
          className="rise mt-2 max-w-[30ch] text-16 leading-snug text-studio-ink-2"
          style={{ animationDelay: "360ms" }}
        >
          {j.title} is with reviewers now. You'll usually hear back within 24
          hours.
        </p>
      </div>

      <div
        className="rise mx-5 mt-7 rounded-lg bg-studio-2 p-5 shadow-[inset_0_0_0_1px_var(--color-studio-line)]"
        style={{ animationDelay: "440ms" }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="cond tnum text-48 font-bold tracking-[-0.02em]">
              {inr(sub.total)}
            </div>
            <div className="mt-1 text-14 text-studio-ink-2">
              guaranteed once checks pass
            </div>
          </div>
          <span className="mt-1 inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full bg-orange/15 px-3 text-12 font-semibold whitespace-nowrap text-orange">
            <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-orange" />{" "}
            Pending review
          </span>
        </div>
        {j.bonus > 0 && (
          <div className="mt-3 flex items-center gap-2 text-14 text-studio-ink-2">
            <Icon n="gift" s={16} />
            <span>
              <span className="tnum font-semibold text-studio-ink">
                +{inr(j.bonus)} quality bonus
              </span>{" "}
              if reviewers mark it clean
            </span>
          </div>
        )}
        <div className="tnum mt-4 grid grid-cols-3 gap-2 border-t border-studio-line pt-4 text-center">
          {[
            [
              String(sub.clips.length),
              sub.clips.length === 1 ? unit : `${unit}s`,
            ],
            [mmss(secs), "of audio"],
            [
              `≈${inr(Math.round(((sub.total + j.bonus) / j.minutes) * 60))}`,
              "per hour, max",
            ],
          ].map(([v, l]) => (
            <div key={l}>
              <div className="cond text-24 leading-none font-bold">{v}</div>
              <div className="mt-1 text-11 text-studio-ink-2">{l}</div>
            </div>
          ))}
        </div>
      </div>

      <div
        className="rise mx-5 mt-3 rounded-lg bg-studio-2 p-5 shadow-[inset_0_0_0_1px_var(--color-studio-line)]"
        style={{ animationDelay: "520ms" }}
      >
        <Timeline
          dark
          steps={[
            {
              title: "Recorded and submitted",
              body: "Every take arrived safely",
              state: "done",
            },
            {
              title: "With reviewers",
              body: sub.waitReason || "Usually within 24h",
              state: "now",
            },
            {
              title: "Approved",
              body: `${inr(sub.total)} moves to Available, bonus added separately`,
              state: "next",
            },
            {
              title: "Paid to your UPI",
              body: "Withdraw from ₹100, tracked by UTR",
              state: "next",
            },
          ]}
        />
      </div>

      <div className="mt-auto flex flex-col gap-2 px-5 pt-8">
        {next ? (
          <Btn
            full
            size="lg"
            v="voice"
            icon="mic"
            onClick={() => a.startJob(next.id)}
          >
            Next: {next.title} · {inr(Math.round(next.base * next.coverage))}
          </Btn>
        ) : (
          <Btn full size="lg" v="white" onClick={() => a.setTab("jobs")}>
            Browse missions
          </Btn>
        )}
        <Btn
          full
          v="glass"
          onClick={() => a.replace({ name: "submission", id: sub.id })}
        >
          Track this submission
        </Btn>
        <Btn
          full
          v="ghost"
          className="text-studio-ink-2 hover:bg-white/5"
          onClick={() => a.setTab("home")}
        >
          Back to home
        </Btn>
      </div>
    </div>
  )
}

export function Submission({ id }: { id: string }) {
  const { s, a } = useStore()
  const sub = s.submissions.find((x) => x.id === id)
  const [appealOpen, setAppealOpen] = useState(false)
  if (!sub) return null
  const j = sel.job(s, sub.jobId)
  const acc = sub.clips.filter((c) => c.state === "accepted").length
  const bad = sub.clips.filter((c) => c.state === "repair_required")
  const repair = sub.status === "repair_required" ? sub.repair : undefined
  const room = j.format === "ROOM"
  const approved = sub.status === "approved"
  // The heading already names these states, so the tag would only repeat it.
  const echoes =
    sub.status === "under_review" ||
    sub.status === "approved" ||
    sub.status === "appeal"
  const unit = j.format === "LINES" ? "line" : "turn"

  return (
    <div className="flex flex-1 flex-col pb-8">
      <BackBar
        title={j.title}
        sub={FORMAT_LABEL[j.format]}
        right={
          <button
            onClick={() => a.openSheet("help")}
            className="mr-2 h-11 rounded-full px-3 text-14 font-semibold text-cobalt hover:bg-cobalt-soft"
          >
            Help
          </button>
        }
      />
      <div className="px-5 pt-2">
        {!echoes && <Status k={sub.status} className="mb-3" />}
        <h1 className="semi text-30 font-bold tracking-[-0.025em]">
          {repair ? (
            room ? (
              "The room take needs repeating"
            ) : (
              <>
                {acc} of {sub.clips.length} accepted
                <span className="block text-ink-3">
                  {bad.length} {bad.length === 1 ? unit : `${unit}s`} to retake
                </span>
              </>
            )
          ) : sub.status === "appeal" ? (
            "Appeal under review"
          ) : approved ? (
            "Approved"
          ) : (
            "With reviewers"
          )}
        </h1>
        <p className="mt-1.5 text-14 text-ink-2">
          Submitted{" "}
          {sub.submittedAt.replace(/^(Today|Yesterday)/, (w) =>
            w.toLowerCase(),
          )}
        </p>
      </div>

      {/* The money, in its real state */}
      <div className="mx-5 mt-5 grid grid-cols-2 overflow-hidden rounded-lg bg-surface shadow-card">
        <div className="border-r border-line p-4">
          <div className="text-12 font-medium text-ink-2">Guaranteed</div>
          <div className="cond tnum mt-1 text-30 font-bold">
            {inr(sub.total)}
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 text-12 font-semibold">
            <span
              className={`h-2 w-2 rounded-full ${
                approved ? "bg-lime" : "bg-orange"
              }`}
            />
            <span className={approved ? "text-lime-ink" : "text-orange-ink"}>
              {approved
                ? "In Available"
                : repair
                  ? "Held for the fix"
                  : "Pending review"}
            </span>
          </div>
        </div>
        <div className="p-4">
          <div className="text-12 font-medium text-ink-2">Quality bonus</div>
          <div className="cond tnum mt-1 text-30 font-bold">
            {j.bonus ? `+${inr(j.bonus)}` : "—"}
          </div>
          <div className="mt-1.5 text-12 text-ink-2">
            {j.bonus
              ? approved
                ? "Added separately"
                : "If takes are clean"
              : "Not offered here"}
          </div>
        </div>
        <div className="col-span-2 border-t border-line bg-surface-2 px-4 py-3 text-14 text-ink-2">
          {approved
            ? "Ready to withdraw now."
            : repair
              ? `Held, not lost. Released in full once the fix is approved, about 24h after you send it.`
              : "Expected by tomorrow, 9 am."}
        </div>
      </div>
      {sub.honoured && (
        <div className="mx-5 mt-3">
          <Notice
            tone="neutral"
            title="Campaign closed · your work is honoured"
          >
            The campaign stopped taking new work after you started. This
            submission is reviewed and paid at the locked rate.
          </Notice>
        </div>
      )}

      {repair && (
        <div className="mx-5 mt-5 overflow-hidden rounded-lg bg-surface shadow-card">
          <div className="h-1 bg-orange" />
          <div className="p-5">
            <Label className="text-orange-ink">
              Why · {repair.code.replace(/_/g, " ").toLowerCase()}
            </Label>
            <div className="semi mt-2 text-24 leading-tight font-bold">
              {repair.reason}
            </div>
            <p className="mt-2 text-16 leading-snug text-ink-2">{repair.why}</p>
            <div className="mt-4 rounded-md bg-surface-2 p-3.5">
              <div className="mb-1.5 text-12 font-medium text-ink-2">
                {room ? "What a good take has" : "How it could sound"}
              </div>
              <p
                lang={room ? undefined : j.lang}
                className="script mb-2 text-18 font-medium"
              >
                {repair.example}
              </p>
              {!room && <Player seed={77} secs={4} label="example" />}
            </div>
            <div className="mt-4 flex gap-3">
              <BoloBadge mood="coach" size={36} />
              <p className="pt-1 text-14 leading-snug">
                <span className="font-semibold">Tip: </span>
                {repair.tip}
              </p>
            </div>
            <div className="mt-4 rounded-md bg-surface-2 p-3.5 text-14 leading-snug text-ink-2">
              {repair.mode === "clip"
                ? `Only the ${bad.length} flagged ${
                    bad.length === 1 ? unit : unit + "s"
                  } ${
                    bad.length === 1 ? "is" : "are"
                  } re-recorded, about 30 seconds. Your ${acc} accepted ${
                    acc === 1 ? unit : unit + "s"
                  } stay accepted. The full ${inr(sub.total)} is paid once the fix is approved.`
                : repair.mode === "full_take"
                  ? `Room missions are one continuous conversation, so the whole take is recorded again with the same people. Everyone consents again. The full ${inr(sub.total)} is paid once the new take is approved.`
                  : "A participant needs to renew their consent before this take can be reviewed."}
            </div>
            <div className="mt-5 flex flex-col gap-2">
              <Btn
                full
                v="voice"
                icon="mic"
                onClick={() => a.startRepair(sub.id)}
              >
                {repair.mode === "clip"
                  ? `Retake ${bad.length} ${
                      bad.length === 1 ? unit : unit + "s"
                    }`
                  : "Record the room take again"}
              </Btn>
              <div className="flex gap-2">
                <Btn
                  full
                  v="outline"
                  onClick={() => (
                    a.pop(), a.toast("Saved. You have 7 days to fix this.")
                  )}
                >
                  Later
                </Btn>
                <Btn full v="outline" onClick={() => setAppealOpen(true)}>
                  Appeal
                </Btn>
              </div>
            </div>
          </div>
        </div>
      )}

      {appealOpen && (
        <Card className="rise mx-5 mt-3">
          <div className="text-18 font-semibold">Appeal this decision</div>
          <ul className="mt-2 space-y-1.5 text-14 leading-snug text-ink-2">
            <li>
              A third reviewer who hasn't heard it re-checks the flagged{" "}
              {room ? "take" : unit}.
            </li>
            <li>The decision comes in 2–3 days and is final.</li>
            <li>You can appeal for 7 days from the decision.</li>
          </ul>
          <Btn
            full
            v="ink"
            className="mt-4"
            onClick={() => (a.appeal(sub.id), setAppealOpen(false))}
          >
            Send appeal
          </Btn>
        </Card>
      )}

      {(sub.status === "under_review" || sub.status === "appeal") && (
        <Card className="mx-5 mt-5">
          <Label className="mb-4">What's happening</Label>
          <Timeline
            steps={[
              {
                title: "Submitted",
                body: "Feul received every take",
                state: "done",
              },
              {
                title:
                  sub.status === "appeal" ? "Appeal review" : "With reviewers",
                body: sub.waitReason,
                state: "now",
              },
              {
                title: "Approved",
                body: `${inr(sub.total)} moves to Available${
                  j.bonus ? `, plus up to ${inr(j.bonus)} bonus` : ""
                }`,
                state: "next",
              },
            ]}
          />
          <p className="mt-5 text-12 leading-snug text-ink-3">
            Reviewers check language match, clarity, background voices and
            duplicates. You don't need to do anything.
          </p>
        </Card>
      )}

      <div className="mt-6 px-5">
        <Label className="mb-2.5">{room ? "Take" : "Your takes"}</Label>
        <ul className="divide-y divide-line rounded-lg bg-surface px-4 shadow-card">
          {sub.clips.map((c, i) => (
            <li key={c.id} className="flex items-center gap-3 py-3.5">
              <div className="w-12 shrink-0">
                <Waveform
                  seed={c.seed}
                  bars={12}
                  h={22}
                  tone={
                    c.state === "accepted"
                      ? "ink"
                      : c.state === "repair_required"
                        ? "orange"
                        : "muted"
                  }
                />
              </div>
              <div
                lang={j.format === "LINES" ? j.lang : undefined}
                className="min-w-0 flex-1 truncate text-14"
              >
                {room ? c.prompt.text : `${i + 1}. ${c.prompt.text}`}
              </div>
              <Status k={c.state} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export function Credited({
  amount,
  bonus = 0,
  title,
  pending = 0,
}: {
  amount: number
  bonus?: number
  title: string
  pending?: number
}) {
  const { s, a } = useStore()
  const total = amount + bonus
  const reached = s.available >= MIN_WITHDRAW
  const partial = pending > 0
  const j = s.jobs.find((x) => x.title === title)
  const rate = j ? Math.round((total / j.minutes) * 60) : 0
  const parts = j?.format === "LINES" ? "lines" : "turns"
  return (
    <div className="flex flex-1 flex-col px-5 pt-[62px] pb-8">
      <MoneyMoment
        id={`credit-${title}-${amount}-${bonus}`}
        amount={total}
        tone="earned"
        eyebrow={partial ? "Part of this mission is paid" : "Approved"}
        line={
          partial
            ? `The accepted ${parts} of ${title} are in Available. ${inr(pending)} more is held for your retake.`
            : `${title} passed review. It's in your Available balance now.`
        }
        detail={
          bonus
            ? `Includes ${inr(bonus)} quality bonus`
            : reached
              ? "You can withdraw now"
              : `${inr(Math.max(0, MIN_WITHDRAW - s.available))} to your first withdrawal`
        }
        cta="See details"
      />
      <div className="rise relative overflow-hidden rounded-lg bg-lime p-6 text-ink">
        <Tag tone="ink" icon="check">
          {partial ? "Partly approved" : "Approved"}
        </Tag>
        <div className="cond mt-5 text-88 font-bold tracking-[-0.02em]">
          <Money value={total} sign />
        </div>
        <p className="mt-2 text-16 font-medium text-ink/70">
          {title} · now in Available
        </p>
        <dl className="tnum mt-5 space-y-2 border-t border-ink/15 pt-4 text-14">
          <div className="flex justify-between">
            <dt className="text-ink/70">Guaranteed pay</dt>
            <dd className="font-semibold">{inr(amount)}</dd>
          </div>
          {bonus > 0 && (
            <div className="flex justify-between">
              <dt className="flex items-center gap-1.5 text-ink/70">
                <Icon n="gift" s={15} /> Quality bonus
              </dt>
              <dd className="font-semibold">+{inr(bonus)}</dd>
            </div>
          )}
          {j && (
            <div className="flex justify-between">
              <dt className="text-ink/70">For ~{j.minutes} min of speaking</dt>
              <dd className="font-semibold">≈{inr(rate)}/hr</dd>
            </div>
          )}
        </dl>
      </div>

      {partial && (
        <div
          className="rise mt-3 flex items-center gap-4 rounded-lg bg-surface p-5 shadow-card"
          style={{ animationDelay: "80ms" }}
        >
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-orange-soft text-orange-ink">
            <Icon n="retry" s={18} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-16 font-semibold">
              <span className="tnum">{inr(pending)}</span> waiting on one fix
            </div>
            <p className="mt-0.5 text-12 leading-snug text-ink-2">
              One turn needs a retake. Fix it within 7 days to release the rest.
            </p>
          </div>
          <Btn size="sm" v="ink" onClick={() => a.setTab("home")}>
            Fix
          </Btn>
        </div>
      )}

      <Card className="rise mt-3" style={{ animationDelay: "140ms" }}>
        <div className="flex items-baseline justify-between">
          <span className="text-14 font-semibold">
            <span className="tnum">{inr(s.available)}</span> available
          </span>
          <span className="tnum text-12 font-medium text-ink-2">
            {reached
              ? "Ready to withdraw"
              : `${inr(MIN_WITHDRAW - s.available)} to go`}
          </span>
        </div>
        <Meter
          className="mt-3"
          value={Math.min(s.available, MIN_WITHDRAW)}
          max={MIN_WITHDRAW}
          tone="lime"
          h="h-2.5"
        />
        <p className="mt-3 text-12 text-ink-2">
          {reached
            ? "You can send this to your UPI now. No fees."
            : "Withdrawals open at ₹100. One more mission gets you there."}
        </p>
      </Card>

      <div
        className="rise mt-auto flex flex-col gap-2 pt-10"
        style={{ animationDelay: "220ms" }}
      >
        {reached ? (
          <Btn
            full
            size="lg"
            v="money"
            icon="bank"
            onClick={() => (a.setTab("wallet"), a.push({ name: "withdraw" }))}
          >
            Withdraw {inr(s.available)}
          </Btn>
        ) : (
          <Btn full size="lg" v="ink" onClick={() => a.setTab("wallet")}>
            See wallet
          </Btn>
        )}
        <Btn full v="ghost" onClick={() => a.setTab("home")}>
          Find the next mission
        </Btn>
      </div>
    </div>
  )
}
