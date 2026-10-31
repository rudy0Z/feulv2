import { useState } from "react"
import {
  BASE_RATE,
  LANGS,
  LENGTHS,
  type Lang,
  type Length,
  type Notice,
} from "../state/model"
import { useStore } from "../state/store"
import {
  BOLO_STATES,
  BoloBadge,
  BoloStage,
  useVoiceLevel,
  type BoloState,
} from "../ui/Bolo"
import { Btn, Icon, Label, SheetFrame, Toggle, inr } from "../ui/kit"
import { FilterSheet } from "./Jobs"

export default function Sheets() {
  const { s, a } = useStore()
  const close = a.closeSheet
  switch (s.sheet) {
    case "notifications":
      return <NotificationsSheet />
    case "filters":
      return (
        <SheetFrame title="Filters" onClose={close}>
          <FilterSheet />
        </SheetFrame>
      )
    case "help":
      return (
        <SheetFrame title="Help" onClose={close}>
          <ul className="space-y-2">
            {[
              [
                "chat",
                "Chat with support",
                `Replies in ${LANGS[s.lang].name} within 4 hours, 9 am–9 pm.`,
              ],
              [
                "headphones",
                "Call 1800 309 4410",
                "Toll-free · payments and account issues",
              ],
              [
                "shield",
                "Grievance officer",
                "For data-rights requests under the DPDP Act",
              ],
            ].map(([ic, t, d]) => (
              <li
                key={t}
                className="flex items-center gap-3.5 rounded-md bg-surface-2 p-4"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface text-ink shadow-card">
                  <Icon n={ic} s={18} />
                </span>
                <span>
                  <span className="block text-16 font-semibold">{t}</span>
                  <span className="block text-14 leading-snug text-ink-2">
                    {d}
                  </span>
                </span>
              </li>
            ))}
          </ul>
          <Btn
            full
            size="lg"
            className="mt-5"
            onClick={() => (close(), a.toast("Support request sent"))}
          >
            Start a support request
          </Btn>
        </SheetFrame>
      )
    case "edit":
      return <EditSheet />
    case "prefs":
      return <PrefsSheet />
    case "upi":
      return (
        <SheetFrame title="UPI" onClose={close}>
          <div className="flex items-center gap-4 rounded-md bg-surface-2 p-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink text-12 font-bold text-white">
              UPI
            </span>
            <span className="min-w-0">
              <span className="block truncate text-16 font-semibold">
                {s.upi?.vpa}
              </span>
              <span className="flex items-center gap-1 text-12 font-medium text-lime-ink">
                <Icon n="check" s={13} stroke={2.2} /> {s.upi?.name} · name
                matched
              </span>
            </span>
          </div>
          <p className="mt-4 text-14 leading-snug text-ink-2">
            Changing UPI re-runs the name check. Withdrawals already in progress
            keep their original destination.
          </p>
          <Btn
            full
            v="outline"
            className="mt-5"
            onClick={() => (close(), a.push({ name: "withdraw" }))}
          >
            Change UPI
          </Btn>
        </SheetFrame>
      )
    case "bolo":
      return <BoloSheet />
    default:
      return null
  }
}

const NOTICE_ICON: Record<string, string> = {
  submission: "eye",
  complete: "eye",
  credited: "wallet",
  withdrawal: "bank",
  withdraw: "bank",
  profile: "shield",
  detail: "missions",
}
const noticeIcon = (n: Notice) =>
  "tab" in n.target ? "wallet" : (NOTICE_ICON[n.target.name] ?? "bell")

function NotificationsSheet() {
  const { s, a } = useStore()
  return (
    <SheetFrame
      title="Notifications"
      onClose={() => (a.readNotices(), a.closeSheet())}
    >
      {s.notices.length === 0 && (
        <p className="py-8 text-center text-16 text-ink-2">
          Review results, payments and data-rights updates will show here.
        </p>
      )}
      <ul className="divide-y divide-line">
        {s.notices.map((n) => (
          <li key={n.id}>
            <button
              onClick={() => {
                a.readNotices()
                if ("tab" in n.target) a.setTab(n.target.tab)
                else a.push(n.target)
              }}
              className="flex w-full gap-3.5 py-3.5 text-left"
            >
              <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface-2 text-ink">
                <Icon n={noticeIcon(n)} s={18} />
                {n.unread && (
                  <span className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-cobalt ring-2 ring-surface" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span
                    className={`text-16 ${
                      n.unread ? "font-bold" : "font-semibold"
                    }`}
                  >
                    {n.title}
                  </span>
                  <span className="shrink-0 text-12 text-ink-3">{n.when}</span>
                </span>
                <span className="block text-14 leading-snug text-ink-2">
                  {n.body}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </SheetFrame>
  )
}

function EditSheet() {
  const { s, a } = useStore()
  const [name, setName] = useState(s.name)
  const [lang, setLang] = useState<Lang>(s.lang)
  return (
    <SheetFrame title="Name and languages" onClose={a.closeSheet}>
      <label className="block">
        <span className="text-12 font-medium text-ink-2">
          First name (must match your UPI)
        </span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 h-12 w-full rounded-md bg-surface px-4 text-16 shadow-[inset_0_0_0_1.5px_var(--color-line-2)] outline-none transition-shadow focus:shadow-[inset_0_0_0_2px_var(--color-cobalt)]"
        />
      </label>
      <div className="mt-5 text-12 font-medium text-ink-2">
        Working language
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {(Object.keys(LANGS) as Lang[]).map((k) => (
          <button
            key={k}
            lang={k}
            aria-pressed={lang === k}
            onClick={() => setLang(k)}
            className={`h-11 rounded-full px-4 text-16 font-semibold transition-colors ${
              lang === k
                ? "bg-ink text-white"
                : "bg-surface-2 text-ink shadow-[inset_0_0_0_1px_var(--color-line)]"
            }`}
          >
            {LANGS[k].native}
          </button>
        ))}
      </div>
      <p className="mt-3 text-12 leading-snug text-ink-3">
        Changing language shows missions in that language. You'll be asked to
        consent again in the new language before recording.
      </p>
      <Btn
        full
        size="lg"
        className="mt-5"
        disabled={!name.trim()}
        onClick={() => {
          a.setName(name.trim())
          a.chooseLang(lang)
          a.closeSheet()
          a.toast("Profile updated")
        }}
      >
        Save
      </Btn>
    </SheetFrame>
  )
}

function PrefsSheet() {
  const { a } = useStore()
  const [p, setP] = useState({
    review: true,
    pay: true,
    jobs: false,
    data: true,
  })
  const rows: [keyof typeof p, string, string][] = [
    ["review", "Review results", "Approved, retake needed, appeals"],
    ["pay", "Payments", "Withdrawal processing, paid, failed"],
    ["jobs", "New missions in my language", "At most once a day"],
    ["data", "Data-rights updates", "Required for deletion receipts"],
  ]
  return (
    <SheetFrame title="Notifications" onClose={a.closeSheet}>
      <ul className="divide-y divide-line">
        {rows.map(([k, l, d]) => (
          <li
            key={k}
            className="flex items-center justify-between gap-4 py-3.5"
          >
            <div>
              <div className="text-16 font-semibold">{l}</div>
              <div className="text-12 text-ink-2">{d}</div>
            </div>
            <Toggle
              on={p[k]}
              disabled={k === "data"}
              label={l}
              onChange={(v) => setP({ ...p, [k]: v })}
            />
          </li>
        ))}
      </ul>
    </SheetFrame>
  )
}

/* ---------- Meet Bolo: the director, the deal, and what each state means ---------- */

const GALLERY: BoloState[] = [
  "idle",
  "speaking",
  "listening",
  "recording",
  "processing",
  "passed",
  "retry",
  "coaching",
  "complete",
]

function BoloSheet() {
  const { s, a } = useStore()
  // Simulated only: the gallery never opens the microphone.
  const level = useVoiceLevel(true)
  const pay: [string, string, string][] = [
    [
      "clock",
      `${inr(BASE_RATE)} per hour of speaking`,
      "Every mission is priced from its realistic active minutes, retries included.",
    ],
    [
      "spark",
      "Up to 1.8× for rare voices",
      "When labs have few recordings like yours, the same minutes pay more.",
    ],
    [
      "lock",
      "Guaranteed once checks pass",
      "The amount is locked when you start. It cannot drop mid-mission.",
    ],
    [
      "gift",
      "Quality bonus, separate",
      "Paid on top after human review approves clear, natural takes.",
    ],
  ]
  return (
    <SheetFrame
      title="Meet Bolo"
      onClose={a.closeSheet}
      icon={<BoloBadge mood="hello" size={44} />}
    >
      <p className="text-16 leading-snug text-ink-2">
        Bolo runs the studio. It plays the other person, tells you when it's
        your turn and checks each take on this phone. It never decides your pay.
      </p>

      <Label className="mt-6 mb-2.5">How pay works</Label>
      <ul className="divide-y divide-line rounded-lg bg-surface-2 px-4">
        {pay.map(([ic, t, d]) => (
          <li key={t} className="flex gap-3.5 py-3.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface text-ink shadow-card">
              <Icon n={ic} s={17} />
            </span>
            <span>
              <span className="tnum block text-16 font-semibold">{t}</span>
              <span className="block text-14 leading-snug text-ink-2">{d}</span>
            </span>
          </li>
        ))}
      </ul>

      <Label className="mt-6 mb-2.5">Mission lengths</Label>
      <div className="grid grid-cols-3 gap-2">
        {(["quick", "core", "deep"] as Length[]).map((k) => (
          <div key={k} className="rounded-md bg-surface-2 p-3">
            <Icon n={LENGTHS[k].icon} s={17} />
            <div className="mt-2 text-16 font-semibold">{LENGTHS[k].label}</div>
            <div className="tnum text-12 text-ink-2">{LENGTHS[k].range}</div>
            <div className="tnum mt-1 text-12 font-semibold">
              {LENGTHS[k].pay}
            </div>
          </div>
        ))}
      </div>

      <Label className="mt-6 mb-2.5">What Bolo is telling you</Label>
      <div className="grid grid-cols-2 gap-2">
        {GALLERY.map((st, i) => {
          const wide = i === GALLERY.length - 1
          return (
            <div
              key={st}
              className={`rounded-md bg-studio p-3 text-studio-ink ${
                wide ? "col-span-2 flex items-center gap-3" : ""
              }`}
            >
              <div className={wide ? "shrink-0" : "flex justify-center"}>
                <BoloStage state={st} size={wide ? 104 : 124} level={level} />
              </div>
              <div className={wide ? "min-w-0 flex-1" : ""}>
                <div className="text-14 font-semibold">
                  {BOLO_STATES[st].label}
                </div>
                <p className="mt-0.5 text-12 leading-snug text-studio-ink-2">
                  {BOLO_STATES[st].note}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-6 flex items-start gap-4 rounded-lg bg-surface-2 p-4">
        <div className="flex-1">
          <div className="text-16 font-semibold">
            Follow my real voice level
          </div>
          <p className="mt-0.5 text-14 leading-snug text-ink-2">
            Off by default. When on, the studio asks for the microphone only
            while you record. The level is worked out on this phone and thrown
            away. It never changes what is recorded.
          </p>
        </div>
        <Toggle
          on={s.sim.realMic}
          label="Follow my real voice level"
          onChange={(v) => (
            a.setSim({ realMic: v }),
            a.toast(
              v
                ? "Live level on. Asked only when you record."
                : "Live level off. Bolo uses a simulated level.",
            )
          )}
        />
      </div>
    </SheetFrame>
  )
}
