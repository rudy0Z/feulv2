import { useState } from "react"
import { BASE_RATE, type LedgerEntry } from "../state/model"
import { MIN_WITHDRAW, sel, useStore } from "../state/store"
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
  Segmented,
  SlideToConfirm,
  Status,
  Timeline,
  inr,
  useTone,
} from "../ui/kit"

const DAYS = ["Wed", "Tue", "Mon", "Sun", "Sat", "Fri", "Thu"]
const dayName = (d: number) =>
  d === 0 ? "Today" : d === 1 ? "Yesterday" : DAYS[d]

export default function Wallet() {
  const { s, a } = useStore()
  const [tab, setTab] = useState<"all" | "earn" | "bonus" | "wd">("all")
  const [day, setDay] = useState<number | null>(null)
  const inReview = sel.inReview(s)
  const held = sel.held(s)
  const paid = sel.paidOut(s)
  const gap = Math.max(0, MIN_WITHDRAW - s.available)
  const week = sel.thisWeek(s)
  const mins = sel.minsWeek(s)
  const rate = sel.rate(s)
  const perDay = DAYS.map((_, d) =>
    s.ledger
      .filter(
        (l) =>
          l.day === d &&
          l.kind !== "withdrawal" &&
          ["settled", "honoured"].includes(l.state),
      )
      .reduce((t, l) => t + l.amount, 0),
  )
  const max = Math.max(1, ...perDay)
  const best = perDay.indexOf(Math.max(...perDay))
  const rows = s.ledger.filter(
    (l) =>
      (tab === "all" ||
        (tab === "wd"
          ? l.kind === "withdrawal"
          : tab === "bonus"
            ? l.kind === "bonus"
            : l.kind === "earning")) &&
      (day == null || l.day === day),
  )
  const groups = [...new Set(rows.map((l) => l.day))]
    .sort((x, y) => x - y)
    .map((d) => [d, rows.filter((l) => l.day === d)] as const)
  const w = s.withdrawal
  const wdBusy = !!w && w.status !== "paid" && w.status !== "failed"

  const flow = [
    {
      k: "With reviewers",
      v: inReview + held,
      dot: "bg-orange",
      d:
        held > 0
          ? `${inr(held)} held for a fix`
          : inReview > 0
            ? "Usually within 24h"
            : "Nothing waiting",
      go: () => a.setTab("home"),
    },
    {
      k: "Available",
      v: s.available,
      dot: "bg-lime",
      d: gap > 0 ? `${inr(gap)} to minimum` : "Ready now",
    },
    {
      k: "Paid out",
      v: paid,
      dot: "bg-ink",
      d: s.upi ? "to your UPI" : "No UPI yet",
    },
  ]

  return (
    <div className="pb-6">
      <div className="px-5 pt-1">
        <h1 className="semi rise text-38 font-bold tracking-[-0.03em]">
          Wallet
        </h1>
      </div>

      {/* Balance: lime on ink, because it is yours */}
      <div className="rise mx-5 mt-4 overflow-hidden rounded-lg bg-ink p-5 text-white shadow-float">
        <div className="flex items-center justify-between">
          <span className="eyebrow text-white/55">Available to withdraw</span>
          <span className="text-12 font-semibold text-white/55">
            No fees, ever
          </span>
        </div>
        <div className="cond mt-2 text-88 font-bold tracking-[-0.02em] text-lime">
          <Money value={s.available} />
        </div>
        {gap > 0 ? (
          <>
            <Meter
              className="mt-4 bg-white/10"
              value={s.available}
              max={MIN_WITHDRAW}
              tone="lime"
              h="h-2.5"
            />
            <p className="tnum mt-3 text-14 leading-snug text-white/65">
              <span className="font-semibold text-white">{inr(gap)} more</span>{" "}
              and you can withdraw.
              {gap <= 30 ? " About one Quick mission." : ""}
            </p>
          </>
        ) : (
          <Btn
            full
            size="lg"
            v="money"
            icon="bank"
            className="mt-4"
            disabled={wdBusy}
            onClick={() => a.push({ name: "withdraw" })}
          >
            {wdBusy ? "Withdrawal in progress" : `Withdraw ${inr(s.available)}`}
          </Btn>
        )}
      </div>

      {w && w.status !== "paid" && (
        <div className="mt-3 px-5">
          <button
            onClick={() => a.push({ name: "withdrawal" })}
            className="flex w-full items-center gap-3 rounded-lg bg-surface p-4 text-left shadow-card transition-transform duration-300 ease-(--ease-spring) active:scale-[0.98]"
          >
            <Status k={w.status} />
            <span className="tnum min-w-0 flex-1 truncate text-14">
              {inr(w.amount)} ·{" "}
              {w.status === "failed" ? "returned to Available" : w.expected}
            </span>
            <Icon n="chev" s={18} className="text-ink-3" />
          </button>
        </div>
      )}

      {/* How a rupee moves */}
      <section className="mt-10 px-5">
        <h2 className="semi text-20 font-bold">Where your money is</h2>
        <div className="mt-3.5 grid grid-cols-3 gap-2">
          {flow.map((f, i) => {
            const El = f.go ? "button" : "div"
            return (
              <El
                key={f.k}
                onClick={f.go}
                className="relative flex min-h-[124px] flex-col rounded-lg bg-surface p-3.5 text-left shadow-card"
              >
                <span className="flex items-center gap-1.5 text-12 font-semibold">
                  <span className={`h-2 w-2 rounded-full ${f.dot}`} />
                  {f.k}
                </span>
                <span className="cond tnum mt-auto text-30 leading-none font-bold">
                  {inr(f.v)}
                </span>
                {/* Two lines reserved so the three amounts share a baseline */}
                <span className="mt-1.5 min-h-[2lh] text-11 leading-snug text-ink-2">
                  {f.d}
                </span>
                {i < 2 && (
                  <span
                    aria-hidden
                    className="absolute top-1/2 -right-[9px] z-10 grid h-4 w-4 -translate-y-1/2 place-items-center rounded-full bg-canvas text-ink-3"
                  >
                    <Icon n="chev" s={11} stroke={2.4} />
                  </span>
                )}
              </El>
            )
          })}
        </div>
      </section>

      {/* Effective earnings: what an hour of talking actually paid */}
      <section className="mt-10 px-5">
        <Card>
          <div className="flex items-start justify-between gap-3">
            <div>
              <Label>This week, approved</Label>
              <div className="cond tnum mt-2 text-48 font-bold">
                {inr(week)}
              </div>
              <p className="tnum mt-1 text-14 text-ink-2">
                {mins
                  ? `from ${mins} min of accepted speaking`
                  : "Approved earnings show up here by day"}
              </p>
            </div>
            {rate > 0 && (
              <div className="rounded-md bg-surface-2 px-3 py-2.5 text-right">
                <div className="cond tnum text-30 leading-none font-bold">
                  ≈{inr(rate)}
                </div>
                <div className="mt-1 text-11 font-medium text-ink-2">
                  per hour
                </div>
              </div>
            )}
          </div>
          {rate > 0 && (
            <p className="tnum mt-3 rounded-md bg-cobalt-soft px-3 py-2.5 text-12 leading-snug text-cobalt-deep">
              {Math.round((rate / BASE_RATE - 1) * 100)}% above the{" "}
              {inr(BASE_RATE)}/hr base, from rare-voice lifts and quality
              bonuses.
            </p>
          )}
          <div
            className="mt-6 grid grid-cols-7 gap-2"
            role="group"
            aria-label="Filter activity by day"
          >
            {[...perDay].reverse().map((v, ri) => {
              const d = 6 - ri
              const on = day === d
              return (
                <button
                  key={d}
                  aria-label={`${dayName(d)}, ${inr(v)}`}
                  aria-pressed={on}
                  onClick={() => setDay(on ? null : d)}
                  className="group flex flex-col items-center gap-2"
                >
                  <span className="relative flex h-[96px] w-full flex-col items-center justify-end">
                    {v > 0 && (
                      <span
                        className={`tnum mb-1.5 text-11 font-semibold ${
                          on ? "text-ink" : "text-ink-2"
                        }`}
                      >
                        {inr(v)}
                      </span>
                    )}
                    <span
                      className={`grow-y w-full max-w-9 rounded-[10px] transition-colors duration-200 ${
                        v > 0
                          ? on
                            ? "bg-ink"
                            : d === best
                              ? "bg-lime"
                              : "bg-lime/60 group-hover:bg-lime"
                          : on
                            ? "bg-ink"
                            : "bg-line-2/70"
                      }`}
                      style={{
                        height: v > 0 ? `${Math.max(14, (v / max) * 64)}px` : 4,
                        animationDelay: `${ri * 50}ms`,
                      }}
                    />
                  </span>
                  <span
                    className={`text-12 ${
                      on || d === 0 ? "font-semibold text-ink" : "text-ink-3"
                    }`}
                  >
                    {d === 0 ? "Today" : DAYS[d].slice(0, 2)}
                  </span>
                </button>
              )
            })}
          </div>
        </Card>
      </section>

      {/* Payout destination */}
      <section className="mt-4 px-5">
        {s.upi ? (
          <button
            onClick={() => a.openSheet("upi")}
            className="flex w-full items-center gap-4 rounded-lg bg-surface p-4 text-left shadow-card"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink text-12 font-bold text-white">
              UPI
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-16 font-semibold">
                {s.upi.vpa}
              </span>
              <span className="flex items-center gap-1 text-12 font-medium text-lime-ink">
                <Icon n="check" s={13} stroke={2.2} /> Name matched · payouts
                land here
              </span>
            </span>
            <Icon n="chev" s={18} className="text-ink-3" />
          </button>
        ) : (
          <div className="flex items-center gap-4 rounded-lg bg-surface p-4 shadow-card">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-surface-3 text-12 font-bold text-ink-3">
              UPI
            </span>
            <span className="flex-1">
              <span className="block text-16 font-semibold">
                Add where we pay you
              </span>
              <span className="block text-12 text-ink-2">
                Takes a minute. The name must match yours.
              </span>
            </span>
            <Btn size="sm" v="ink" onClick={() => a.push({ name: "withdraw" })}>
              Add UPI
            </Btn>
          </div>
        )}
      </section>

      {/* Activity */}
      <section className="mt-10">
        <h2 className="semi mb-3.5 px-5 text-20 font-bold">Activity</h2>
        <Segmented
          className="px-5"
          value={tab}
          onChange={setTab}
          items={[
            { k: "all", l: "All" },
            { k: "earn", l: "Earnings" },
            { k: "bonus", l: "Bonuses", icon: "gift" },
            { k: "wd", l: "Withdrawals" },
          ]}
        />
        <div className="px-5">
          {day != null && (
            <button
              onClick={() => setDay(null)}
              className="mt-4 inline-flex h-8 items-center gap-1.5 rounded-full bg-ink px-3 text-12 font-semibold text-white"
            >
              Showing {dayName(day)} <Icon n="close" s={13} stroke={2.2} />
            </button>
          )}
          {rows.length === 0 && (
            <p className="py-12 text-center text-16 text-ink-2">
              {s.ledger.length
                ? "Nothing here for this filter."
                : "No money movement yet. Your first mission shows up here once submitted."}
            </p>
          )}
          {groups.map(([d, ls]) => (
            <div key={d} className="mt-6">
              <div className="mb-1 text-12 font-semibold text-ink-3">
                {dayName(d)}
              </div>
              <ul className="divide-y divide-line rounded-lg bg-surface px-4 shadow-card">
                {ls.map((l) => (
                  <LedgerRow key={l.id} l={l} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function LedgerRow({ l }: { l: LedgerEntry }) {
  const wd = l.kind === "withdrawal"
  const bonus = l.kind === "bonus"
  const disc = wd
    ? "bg-surface-3 text-ink"
    : bonus
      ? "bg-lime-soft text-lime-ink"
      : l.state === "pending" || l.state === "appeal"
        ? "bg-orange-soft text-orange-ink"
        : "bg-cobalt-soft text-cobalt-deep"
  return (
    <li className="flex gap-3.5 py-3.5">
      <span
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${disc}`}
      >
        <Icon n={wd ? "bank" : bonus ? "gift" : "mic"} s={17} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <span className="truncate text-16 font-semibold">{l.title}</span>
          <span
            className={`cond tnum shrink-0 text-20 leading-none font-bold ${
              l.state === "failed" ? "text-ink-3 line-through" : ""
            }`}
          >
            {l.amount > 0 ? "+" : "−"}
            {inr(l.amount)}
          </span>
        </div>
        <p className="mt-1 text-12 leading-snug text-pretty text-ink-2">
          {l.note ?? l.when}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <Status k={l.state} />
          {l.mins ? (
            <span className="tnum text-12 text-ink-3">
              {l.mins} min · ≈{inr(Math.round((l.amount / l.mins) * 60))}/hr
            </span>
          ) : null}
        </div>
      </div>
    </li>
  )
}

/* Withdrawal: Add UPI → Name match → Amount → Slide to confirm → (request created) */
export function Withdraw() {
  const { s, a } = useStore()
  const [step, setStep] = useState<"upi" | "amount" | "confirm">(
    s.upi ? "amount" : "upi",
  )
  const [vpa, setVpa] = useState("priya.sharma@okaxis")
  const [check, setCheck] =
    useState<"idle" | "checking" | "mismatch" | "unavailable" | "matched">(
      "idle",
    )
  const [amt, setAmt] = useState(s.available)
  const [busy, setBusy] = useState(false)
  useTone(
    step === "confirm" ? "light" : "dark",
    step === "confirm" ? "ink" : "canvas",
  )
  const validVpa = /^[\w.-]{2,}@[a-z]{2,}$/i.test(vpa)
  const gap = Math.max(0, MIN_WITHDRAW - amt)

  if (step === "upi")
    return (
      <div className="flex flex-1 flex-col">
        <BackBar title="Add UPI" />
        <div className="flex flex-1 flex-col px-6 pb-8">
          <h1 className="semi text-30 font-bold">Where should we pay you?</h1>
          <p className="mt-2 text-16 leading-snug text-ink-2">
            The UPI name must match the name on your Feul account (
            {s.name.toUpperCase()} SHARMA).
          </p>
          <label className="mt-6 block">
            <span className="text-12 font-medium text-ink-2">UPI ID</span>
            <input
              value={vpa}
              onChange={(e) => (setVpa(e.target.value), setCheck("idle"))}
              className={`mt-1 h-14 w-full rounded-md bg-surface px-4 text-18 outline-none transition-shadow focus:shadow-[inset_0_0_0_2px_var(--color-cobalt)] ${
                vpa && !validVpa
                  ? "shadow-[inset_0_0_0_2px_var(--color-red)]"
                  : "shadow-[inset_0_0_0_1.5px_var(--color-line-2)]"
              }`}
            />
          </label>
          {vpa && !validVpa && (
            <p className="mt-2 text-14 text-red">
              A UPI ID looks like name@bank.
            </p>
          )}
          <div className="mt-5">
            {check === "checking" && (
              <Notice
                tone="info"
                icon="clock"
                title="Checking the name with your bank…"
              >
                This takes a few seconds.
              </Notice>
            )}
            {check === "matched" && (
              <Notice tone="ok" title="Name matched">
                PRIYA SHARMA · {vpa}
              </Notice>
            )}
            {check === "mismatch" && (
              <Notice tone="error" title="Name doesn't match">
                The bank returned a different name for this UPI ID. Use a UPI in
                your own name, or update your Feul name if it's wrong.
              </Notice>
            )}
            {check === "unavailable" && (
              <Notice
                tone="attention"
                title="Verification is temporarily unavailable"
              >
                Your details aren't wrong. The bank's verification service isn't
                responding. Try again in a few minutes.
              </Notice>
            )}
          </div>
          <div className="mt-auto flex flex-col gap-2 pt-8">
            {check === "matched" ? (
              <Btn full size="lg" v="ink" onClick={() => setStep("amount")}>
                Continue
              </Btn>
            ) : (
              <Btn
                full
                size="lg"
                v="ink"
                disabled={!validVpa}
                loading={check === "checking"}
                onClick={() => (
                  setCheck("checking"), a.verifyUpi(vpa, (r) => setCheck(r))
                )}
              >
                {check === "idle" ? "Verify name" : "Try again"}
              </Btn>
            )}
            {check === "mismatch" && (
              <Btn full v="ghost" onClick={() => a.openSheet("edit")}>
                Edit my name
              </Btn>
            )}
          </div>
        </div>
      </div>
    )

  if (step === "amount")
    return (
      <div className="flex flex-1 flex-col">
        <BackBar title="Withdraw" />
        <div className="flex flex-1 flex-col px-6 pb-8">
          <div className="text-14 text-ink-2">
            Available{" "}
            <span className="tnum font-semibold text-ink">
              {inr(s.available)}
            </span>
          </div>
          <div className="mt-6 flex items-baseline gap-1">
            <span className="cond text-48 font-bold text-ink-3">₹</span>
            <input
              aria-label="Amount"
              inputMode="numeric"
              value={amt}
              onChange={(e) =>
                setAmt(
                  Math.min(
                    s.available,
                    Number(e.target.value.replace(/\D/g, "")) || 0,
                  ),
                )
              }
              className="cond tnum w-full bg-transparent text-88 leading-none font-bold tracking-[-0.02em] outline-none"
            />
          </div>
          <p
            className={`tnum mt-2 text-14 ${
              gap > 0 ? "text-red" : "text-ink-2"
            }`}
          >
            {gap > 0
              ? `${inr(gap)} more to reach the ₹100 minimum`
              : "No fee. The full amount reaches your UPI."}
          </p>
          <div className="mt-5 flex gap-2">
            {[100, 200, s.available]
              .filter((v, i, arr) => v <= s.available && arr.indexOf(v) === i)
              .map((v) => (
                <button
                  key={v}
                  onClick={() => setAmt(v)}
                  className={`tnum h-10 rounded-full px-4 text-14 font-semibold transition-colors ${
                    amt === v
                      ? "bg-ink text-white"
                      : "bg-surface shadow-[inset_0_0_0_1.5px_var(--color-line-2)]"
                  }`}
                >
                  {v === s.available ? `All ${inr(v)}` : inr(v)}
                </button>
              ))}
          </div>
          <div className="mt-8 flex items-center justify-between gap-3 rounded-md bg-surface p-4 shadow-card">
            <div className="min-w-0">
              <div className="text-12 text-ink-2">To</div>
              <div className="truncate text-16 font-semibold">{s.upi?.vpa}</div>
            </div>
            <span className="flex shrink-0 items-center gap-1 text-12 font-semibold text-lime-ink">
              <Icon n="check" s={13} stroke={2.2} /> Name matched
            </span>
          </div>
          <div className="mt-auto pt-8">
            <Btn
              full
              size="lg"
              v="ink"
              disabled={gap > 0}
              onClick={() => setStep("confirm")}
            >
              Review withdrawal
            </Btn>
          </div>
        </div>
      </div>
    )

  return (
    <div className="flex flex-1 flex-col bg-ink text-white">
      <BackBar dark onBack={() => setStep("amount")} />
      <div className="flex flex-1 flex-col px-6 pb-8">
        <div className="eyebrow text-white/55">You're withdrawing</div>
        <div className="cond tnum mt-3 text-88 leading-none font-bold tracking-[-0.02em] text-lime">
          {inr(amt)}
        </div>
        <dl className="mt-10 space-y-3.5 border-t border-white/12 pt-5 text-16">
          {[
            ["To", s.upi!.vpa],
            ["Name", s.upi!.name],
            ["Fee", "₹0"],
            ["Left in Available", inr(s.available - amt)],
            ["Expected", "by tomorrow, 6 pm · 1 working day"],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4">
              <dt className="text-white/55">{k}</dt>
              <dd className="tnum text-right font-medium">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-5 text-12 leading-snug text-white/55">
          Bank holidays and weekends can add a day. It shows Paid only once your
          bank confirms, with a UTR reference.
        </p>
        <div className="mt-auto pt-8">
          <SlideToConfirm
            label={`Slide to send ${inr(amt)}`}
            busy={busy}
            onConfirm={() => (
              setBusy(true), setTimeout(() => a.requestWithdrawal(amt), 900)
            )}
          />
        </div>
      </div>
    </div>
  )
}

export function WithdrawalStatus() {
  const { s, a } = useStore()
  const w = s.withdrawal
  if (!w) return null
  if (w.status === "paid")
    return (
      <div className="flex flex-1 flex-col pb-8">
        <MoneyMoment
          id={`paid-${w.id}`}
          amount={w.amount}
          tone="sent"
          eyebrow="Sent to your bank"
          line={`${inr(w.amount)} is in the account linked to ${w.vpa}. Your bank confirmed it.`}
          detail={`UTR ${w.utr}`}
          cta="View receipt"
        />
        <BackBar title="Receipt" onBack={a.clearWithdrawal} />
        <div className="px-6 pt-2">
          <Status k="paid" />
          <div className="cond tnum mt-4 text-88 leading-none font-bold tracking-[-0.02em]">
            {inr(w.amount)}
          </div>
          <p className="mt-3 text-18 leading-snug">
            Paid to {w.vpa}. Your bank confirmed it.
          </p>
        </div>
        <dl className="mx-6 mt-8 divide-y divide-line rounded-lg bg-surface text-16 shadow-card">
          {[
            ["UTR", w.utr!],
            ["Paid on", w.paidAt ?? "Today, 10:14 am"],
            ["To", w.vpa],
            ["Name", s.upi?.name ?? ""],
            ["Feul reference", w.id],
            ["Requested", w.requestedAt],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 px-4 py-3.5">
              <dt className="text-ink-2">{k}</dt>
              <dd
                className={`tnum text-right font-medium ${
                  k === "UTR" ? "font-mono text-14" : ""
                }`}
              >
                {v}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mx-6 mt-3 text-12 text-ink-3">
          Your bank can trace this payment with the UTR.
        </p>
        <div className="mt-auto flex gap-2 px-6 pt-8">
          <Btn
            full
            v="outline"
            icon="share"
            onClick={() => a.toast("Receipt shared")}
          >
            Share receipt
          </Btn>
          <Btn full v="ink" onClick={a.clearWithdrawal}>
            Done
          </Btn>
        </div>
      </div>
    )

  const at = w.status === "requested" ? 0 : 1
  const steps = [
    { title: "Requested", body: w.requestedAt },
    {
      title:
        w.status === "delayed"
          ? "Processing · slower than usual"
          : w.status === "hold"
            ? "On hold · verification"
            : "Processing",
      body:
        w.status === "hold"
          ? "Not sent to your bank yet · checks first"
          : "Sent to your bank via UPI",
    },
    { title: "Paid", body: `Expected ${w.expected} · UTR issued` },
  ].map((st, i) => ({
    ...st,
    state: (i < at
      ? "done"
      : i === at
        ? "now"
        : "next") as "done" | "now" | "next",
  }))
  return (
    <div className="flex flex-1 flex-col pb-8">
      <BackBar title="Withdrawal" />
      <div className="px-6 pt-2">
        <Status k={w.status} />
        <div className="cond tnum mt-4 text-64 leading-none font-bold">
          {inr(w.amount)}
        </div>
        <p className="mt-2 text-16 text-ink-2">
          To {w.vpa} · {w.id}
        </p>
      </div>
      <div className="mx-6 mt-6">
        {w.status === "failed" && (
          <Notice
            tone="error"
            title="Withdrawal didn't go through"
            action={
              <div className="flex gap-2">
                <Btn
                  size="sm"
                  v="ink"
                  onClick={() => (
                    a.clearWithdrawal(), a.push({ name: "withdraw" })
                  )}
                >
                  Try again
                </Btn>
                <Btn size="sm" v="outline" onClick={() => a.openSheet("help")}>
                  Get help
                </Btn>
              </div>
            }
          >
            Your bank declined the transfer. {inr(w.amount)} is back in
            Available. Nothing was deducted.
          </Notice>
        )}
        {w.status === "hold" && (
          <Notice
            tone="attention"
            title="On hold for a verification check"
            action={
              <Btn size="sm" v="outline" onClick={() => a.openSheet("help")}>
                Ask for a review
              </Btn>
            }
          >
            Some recent recordings are being checked for authenticity. This
            takes up to 2 working days. Your {inr(w.amount)} is safe and won't
            be lost.
          </Notice>
        )}
        {w.status === "delayed" && (
          <Notice
            tone="attention"
            title="Taking longer than usual"
            action={
              <Btn size="sm" v="outline" onClick={() => a.openSheet("help")}>
                Contact support
              </Btn>
            }
          >
            Your bank hasn't confirmed yet. Delays usually clear within a
            working day. It isn't paid until it says Paid.
          </Notice>
        )}
      </div>
      {w.status !== "failed" && (
        <Card className="mx-6 mt-4">
          <Timeline steps={steps} />
        </Card>
      )}
      {w.status !== "failed" && (
        <p className="mx-6 mt-4 text-14 text-ink-2">
          Not paid yet. You'll get a notification with the UTR when the bank
          confirms.
        </p>
      )}
      <div className="mt-auto px-6 pt-8">
        <Btn full v="outline" icon="help" onClick={() => a.openSheet("help")}>
          Help with this withdrawal
        </Btn>
      </div>
    </div>
  )
}
