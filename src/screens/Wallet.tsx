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
      dot: "bg-wait",
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
      dot: "bg-money",
      d: gap > 0 ? "Below minimum" : "Ready now",
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
        <h1 className="semi rise text-24 font-semibold">Wallet</h1>
      </div>

      {/* Balance first, with the way out right beside it. The pipeline explains where the rest is. */}
      <section
        aria-label="Balance"
        className="rise mx-5 mt-3 rounded-lg bg-surface p-4 shadow-card"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-12 font-medium text-ink-2">
              <span className="h-1.5 w-1.5 rounded-full bg-money" /> Available
            </p>
            <div className="cond tnum mt-1 text-38 leading-none font-semibold">
              <Money value={s.available} />
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <Btn
              size="md"
              v="money"
              icon={gap > 0 || wdBusy ? "lock" : "bank"}
              disabled={gap > 0 || wdBusy}
              describedBy="wd-why"
              onClick={() => a.push({ name: "withdraw" })}
            >
              Withdraw
            </Btn>
            <span id="wd-why" className="tnum text-11 text-ink-3">
              {wdBusy
                ? "One at a time"
                : gap > 0
                  ? `From ${inr(MIN_WITHDRAW)}`
                  : "No fees, ever"}
            </span>
          </div>
        </div>

        {gap > 0 && !wdBusy && (
          <div className="mt-3.5">
            <Meter
              value={s.available}
              max={MIN_WITHDRAW}
              tone="money"
              h="h-1.5"
            />
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="tnum text-12 leading-snug text-ink-2">
                <span className="font-medium text-ink">{inr(gap)} more</span> to
                withdraw{gap <= 30 ? ", about one quick scene" : ""}
              </p>
              <button
                onClick={() => a.openLen("quick")}
                className="shrink-0 text-12 font-semibold text-brand-deep"
              >
                Find one
              </button>
            </div>
          </div>
        )}

        <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-3.5">
          {flow.map((f) => {
            const El = f.go ? "button" : "div"
            return (
              <El
                key={f.k}
                onClick={f.go}
                className="flex min-w-0 flex-col text-left"
              >
                <dt className="flex items-center gap-1.5 truncate text-11 font-medium text-ink-2">
                  <span
                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${f.dot}`}
                  />
                  {f.k}
                </dt>
                <dd className="cond tnum mt-1 text-18 leading-none font-semibold">
                  {inr(f.v)}
                </dd>
                <dd className="mt-1 text-11 leading-snug text-ink-3">{f.d}</dd>
              </El>
            )
          })}
        </dl>
      </section>

      {w && w.status !== "paid" && (
        <div className="mt-3 px-5">
          <button
            onClick={() => a.push({ name: "withdrawal" })}
            className="flex w-full items-center gap-3 rounded-lg bg-surface p-3.5 text-left shadow-card"
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

      {/* Effective earnings: what an hour of talking actually paid */}
      <section className="mt-7 px-5">
        <div className="border-b border-line pb-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <Label>This week, approved</Label>
              <div className="cond tnum mt-1.5 text-30 font-semibold">
                {inr(week)}
              </div>
              <p className="tnum mt-0.5 text-12 text-ink-2">
                {mins
                  ? `from ${mins} min of accepted speaking`
                  : "Approved earnings show up here by day"}
              </p>
            </div>
            {rate > 0 && (
              <div className="text-right">
                <div className="cond tnum text-18 leading-none font-semibold text-money-ink">
                  ≈{inr(rate)}/hr
                </div>
                <div className="mt-1 text-11 font-medium text-ink-2">
                  +{Math.round((rate / BASE_RATE - 1) * 100)}% vs{" "}
                  {inr(BASE_RATE)} base
                </div>
              </div>
            )}
          </div>
          <div
            className="mt-4 grid grid-cols-7 gap-2"
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
                  <span className="relative flex h-[76px] w-full flex-col items-center justify-end">
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
                              ? "bg-money"
                              : "bg-money/60 group-hover:bg-money"
                          : on
                            ? "bg-ink"
                            : "bg-line-2/70"
                      }`}
                      style={{
                        height: v > 0 ? `${Math.max(12, (v / max) * 52)}px` : 4,
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
        </div>
      </section>

      {/* Payout destination */}
      <section className="mt-4 px-5">
        {s.upi ? (
          <button
            onClick={() => a.openSheet("upi")}
            className="flex w-full items-center gap-3.5 border-b border-line pb-4 text-left"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink text-11 font-semibold text-white">
              UPI
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-16 font-medium">
                {s.upi.vpa}
              </span>
              <span className="flex items-center gap-1 text-12 font-medium text-money-ink">
                <Icon n="check" s={13} stroke={2.2} /> Name matched · payouts
                land here
              </span>
            </span>
            <Icon n="chev" s={18} className="text-ink-3" />
          </button>
        ) : (
          <div className="flex items-center gap-3.5 border-b border-line pb-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface-3 text-11 font-semibold text-ink-3">
              UPI
            </span>
            <span className="flex-1">
              <span className="block text-16 font-medium">
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
      <section className="mt-7">
        <h2 className="semi mb-3 px-5 text-18 font-semibold">Activity</h2>
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
                : "No money movement yet. Your first scene shows up here once submitted."}
            </p>
          )}
          {groups.map(([d, ls]) => (
            <div key={d} className="mt-5">
              <div className="mb-1 text-12 font-medium text-ink-3">
                {dayName(d)}
              </div>
              <ul className="divide-y divide-line border-y border-line">
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
      ? "bg-money-soft text-money-ink"
      : l.state === "pending" || l.state === "appeal"
        ? "bg-wait-soft text-wait-ink"
        : "bg-brand-soft text-brand-deep"
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
              className={`mt-1 h-14 w-full rounded-md bg-surface px-4 text-18 outline-none transition-shadow focus:shadow-[inset_0_0_0_2px_var(--color-brand)] ${
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
        <div className="flex flex-1 flex-col justify-between px-6 pb-8">
          <div className="my-auto py-4 text-center">
            <div className="text-14 text-ink-2">
              Available{" "}
              <span className="tnum font-medium text-ink">
                {inr(s.available)}
              </span>
            </div>
            <div className="mt-4 inline-flex items-baseline justify-center gap-1">
              <span className="cond text-38 font-semibold text-ink-3">₹</span>
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
                style={{ width: `${Math.max(2, String(amt).length) * 1.05}ch` }}
                className="cond tnum bg-transparent text-center text-64 leading-none font-semibold tracking-[-0.03em] outline-none"
              />
            </div>
            <p
              className={`tnum mt-3 text-14 ${
                gap > 0 ? "text-red" : "text-ink-2"
              }`}
            >
              {gap > 0
                ? `${inr(gap)} more to reach the ₹100 minimum`
                : "No fee. The full amount reaches your UPI."}
            </p>
            <div className="mt-5 flex justify-center gap-2">
              {[100, 200, s.available]
                .filter((v, i, arr) => v <= s.available && arr.indexOf(v) === i)
                .map((v) => (
                  <button
                    key={v}
                    onClick={() => setAmt(v)}
                    className={`tnum h-10 rounded-full px-4 text-14 font-medium transition-colors ${
                      amt === v
                        ? "bg-ink text-white"
                        : "bg-surface shadow-[inset_0_0_0_1.5px_var(--color-line-2)]"
                    }`}
                  >
                    {v === s.available ? `All ${inr(v)}` : inr(v)}
                  </button>
                ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 rounded-md bg-surface p-4 shadow-card">
              <div className="min-w-0">
                <div className="text-12 text-ink-2">To</div>
                <div className="truncate text-16 font-medium">{s.upi?.vpa}</div>
              </div>
              <span className="flex shrink-0 items-center gap-1 text-12 font-medium text-money-ink">
                <Icon n="check" s={13} stroke={2.2} /> Name matched
              </span>
            </div>
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
        <div className="cond tnum mt-3 text-88 leading-none font-bold tracking-[-0.02em] text-money">
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
      <div className="flex flex-1 flex-col justify-between pb-8">
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

        {/* Scalloped payment receipt ticket (inspired by the Payment Receipt reference) */}
        <div className="mx-5 overflow-hidden rounded-lg bg-surface shadow-card">
          <div className="grad-money-soft px-6 pt-6 pb-5 text-ink">
            <div className="flex items-center justify-between">
              <Status k="paid" />
              <span className="grid h-10 w-10 place-items-center rounded-full bg-ink text-money">
                <Icon n="bank" s={18} />
              </span>
            </div>
            <div className="mt-4 text-18 font-medium text-ink-2">
              We sent your payout of{" "}
              <span className="cond tnum font-semibold text-ink">
                {inr(w.amount)}
              </span>
            </div>
            <p className="mt-1 text-12 text-ink-2">
              Paid to {w.vpa} · confirmed by your bank
            </p>
          </div>

          <svg
            viewBox="0 0 360 12"
            preserveAspectRatio="none"
            className="-mt-1.5 block h-3 w-full text-surface"
            aria-hidden
          >
            <path
              fill="currentColor"
              d="M0 12 V6 Q9 0 18 6 T36 6 T54 6 T72 6 T90 6 T108 6 T126 6 T144 6 T162 6 T180 6 T198 6 T216 6 T234 6 T252 6 T270 6 T288 6 T306 6 T324 6 T342 6 T360 6 V12 Z"
            />
          </svg>

          <div className="space-y-4 px-5 pt-3 pb-5 text-14">
            <div>
              <div className="mb-1.5 text-12 font-medium text-ink-3">
                Summary
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between gap-4 rounded-md bg-surface-2 px-3.5 py-2.5">
                  <span className="text-ink-2">From</span>
                  <span className="font-medium">Feul contributor payouts</span>
                </div>
                <div className="flex justify-between gap-4 rounded-md bg-surface-2 px-3.5 py-2.5">
                  <span className="text-ink-2">To</span>
                  <span className="truncate font-medium">
                    {w.vpa} ({s.upi?.name ?? ""})
                  </span>
                </div>
              </div>
            </div>
            <div>
              <div className="mb-1.5 text-12 font-medium text-ink-3">
                Transaction details
              </div>
              <div className="tnum space-y-1.5">
                {[
                  ["Amount", inr(w.amount)],
                  ["Paid on", w.paidAt ?? "Today, 10:14 am"],
                  ["UTR reference", w.utr!],
                  ["Feul ID", w.id],
                ].map(([k, v]) => (
                  <div
                    key={k}
                    className="flex justify-between gap-4 rounded-md bg-surface-2 px-3.5 py-2.5"
                  >
                    <span className="text-ink-2">{k}</span>
                    <span
                      className={`text-right font-medium ${
                        k === "UTR reference" ? "font-mono text-12" : ""
                      }`}
                    >
                      {v}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-12 text-ink-3">
              Your bank can trace this payment with the UTR.
            </p>
          </div>
        </div>

        <div className="flex gap-2 px-5 pt-4">
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
