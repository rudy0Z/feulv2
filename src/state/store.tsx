import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import {
  LEVELS,
  jobTotal,
  makeSession,
  scenario,
  type Job,
  type Length,
  type ScenarioKey,
  type Sheet,
  type State,
  type Submission,
  type Tab,
  type View,
  type Withdrawal,
} from "./model"

type Set = (fn: (s: State) => State) => void

const now = () => "Just now"
const later = (ms: number, fn: () => void) => window.setTimeout(fn, ms)

function actions(set: Set, get: () => State) {
  const push = (v: View) =>
    set((s) => ({ ...s, stack: [...s.stack, v], sheet: null }))
  const pop = () => set((s) => ({ ...s, stack: s.stack.slice(0, -1) }))
  const toast = (t: string) => {
    set((s) => ({ ...s, toast: t }))
    later(2600, () => set((s) => (s.toast === t ? { ...s, toast: null } : s)))
  }
  const job = (id: string) => get().jobs.find((j) => j.id === id)!

  const a = {
    push,
    pop,
    toast,
    load: (k: ScenarioKey) => set(() => scenario(k)),
    goto: (k: ScenarioKey, patch?: (s: State) => Partial<State>) =>
      set((cur) => {
        const b = scenario(k)
        return { ...b, ...(patch ? patch(b) : {}), epoch: (cur.epoch ?? 0) + 1 }
      }),
    setTab: (tab: Tab) => set((s) => ({ ...s, tab, stack: [], sheet: null })),
    setScene: (scene: NonNullable<State["scene"]>) =>
      set((s) => ({ ...s, scene })),
    openScene: (scene: NonNullable<State["scene"]>) =>
      set((s) => ({ ...s, scene, tab: "jobs", stack: [], sheet: null })),
    setLen: (len: Length | "all" | "saved") => set((s) => ({ ...s, len })),
    openLen: (len: Length | "all" | "saved") =>
      set((s) => ({ ...s, len, tab: "jobs", stack: [], sheet: null })),
    replace: (v: View) =>
      set((s) => ({ ...s, stack: [...s.stack.slice(0, -1), v] })),
    openSheet: (sheet: Sheet) => set((s) => ({ ...s, sheet })),
    closeSheet: () => set((s) => ({ ...s, sheet: null })),
    setSim: (p: Partial<State["sim"]>) =>
      set((s) => ({ ...s, sim: { ...s.sim, ...p } })),

    // Onboarding
    stage: (stage: State["stage"]) => set((s) => ({ ...s, stage })),
    chooseLang: (lang: State["lang"]) =>
      set((s) => ({
        ...s,
        lang,
        langs: [lang, ...(s.langs ?? []).filter((l) => l !== lang)],
      })),
    toggleLang: (lang: State["lang"]) =>
      set((s) => {
        const cur = s.langs ?? [s.lang]
        const langs = cur.includes(lang)
          ? cur.length > 1
            ? cur.filter((l) => l !== lang)
            : cur
          : [...cur, lang]
        // Lead with a language that has open scenes, so picking languages never leaves Home empty.
        const lead = langs.find((l) =>
          s.jobs.some((j) => j.lang === l && j.campaign === "open"),
        )
        return { ...s, langs, lang: lead ?? langs[0] }
      }),
    acceptConsent: () =>
      set((s) => {
        const fromApp = s.stack.at(-1)?.name === "consent"
        return {
          ...s,
          consent: true,
          consentLang: s.lang,
          mic: "granted",
          stage: s.stage === "consent" ? "done" : s.stage,
          stack: fromApp
            ? [...s.stack.slice(0, -1), { name: "studio" }]
            : s.stack,
        }
      }),
    setMic: (mic: State["mic"]) =>
      set((s) => {
        const fromApp = s.stack.at(-1)?.name === "mic"
        if (mic === "granted") {
          return {
            ...s,
            mic,
            stage: s.stage === "mic" ? "done" : s.stage,
            stack: fromApp
              ? [...s.stack.slice(0, -1), { name: "studio" }]
              : s.stack,
          }
        }
        return { ...s, mic }
      }),

    toggleSave: (id: string) =>
      set((s) => ({
        ...s,
        saved: s.saved.includes(id)
          ? s.saved.filter((x) => x !== id)
          : [...s.saved, id],
      })),

    // Work
    startJob: (id: string) => {
      const s = get()
      const j = job(id)
      if (
        s.session &&
        s.session.jobId !== id &&
        s.session.status !== "expired"
      ) {
        toast("Finish or discard your active session first")
        return
      }
      if (
        !s.session ||
        s.session.jobId !== id ||
        s.session.status === "expired"
      ) {
        set((st) => ({
          ...st,
          session: makeSession(j, {
            calibrated: st.submissions.length > 0 || st.ledger.length > 0,
          }),
        }))
      }
      // Consent gate: never reach the microphone before consent + permission.
      if (!get().consent || get().consentLang !== get().lang)
        return push({ name: "consent" })
      if (get().mic !== "granted") return push({ name: "mic" })
      push({ name: "studio" })
    },
    resume: () => {
      const s = get().session
      if (!s) return
      if (s.status === "upload_failed" || s.status === "reviewing")
        return push({ name: "review" })
      push({ name: "studio" })
    },
    calibrated: () =>
      set((s) => ({
        ...s,
        session: s.session && { ...s.session, calibrated: true },
      })),
    roomConsented: () =>
      set((s) => ({
        ...s,
        session: s.session && { ...s.session, roomConsented: true },
      })),
    setClip: (
      i: number,
      patch: Partial<{
        state: any
        secs: number
        retaken: boolean
      }>,
    ) =>
      set((s) => {
        if (!s.session) return s
        const clips = s.session.clips.map((c, k) =>
          k === i ? { ...c, ...patch } : c,
        )
        return { ...s, session: { ...s.session, clips } }
      }),
    goClip: (i: number) =>
      set((s) => ({
        ...s,
        session: s.session && { ...s.session, index: i, status: "capturing" },
      })),
    toReview: () => {
      set((s) => ({
        ...s,
        session: s.session && { ...s.session, status: "reviewing" },
      }))
      a.replace({ name: "review" })
    },
    leaveSession: () =>
      set((s) => ({
        ...s,
        stack: s.stack.filter(
          (v) => v.name !== "studio" && v.name !== "review",
        ),
        sheet: null,
      })),
    discard: () => {
      set((s) => ({
        ...s,
        session: null,
        stack: s.stack.filter(
          (v) => v.name !== "studio" && v.name !== "review",
        ),
        sheet: null,
      }))
      toast("Recording discarded from this device")
    },

    submit: () => {
      set((s) => {
        if (!s.session) return s
        const clips = s.session.clips.map((c) => ({
          ...c,
          state: "uploading" as const,
        }))
        return { ...s, session: { ...s.session, status: "uploading", clips } }
      })
      later(2200, () => {
        const s = get()
        if (!s.session) return
        if (s.sim.failUpload) {
          // Failure is one-shot so the retry path can be demonstrated.
          set((st) => ({
            ...st,
            sim: { ...st.sim, failUpload: false },
            session: st.session && {
              ...st.session,
              status: "upload_failed",
              clips: st.session.clips.map((c) => ({
                ...c,
                state: "upload_failed",
              })),
            },
          }))
          return
        }
        const sess = s.session
        const j = job(sess.jobId)
        if (sess.repairOf) {
          set((st) => ({
            ...st,
            session: null,
            submissions: st.submissions.map((x) =>
              x.id === sess.repairOf
                ? {
                    ...x,
                    status: "under_review",
                    waitReason:
                      "Re-checking your replacement · accepted clips are kept",
                    clips:
                      x.repair?.mode === "clip"
                        ? x.clips.map((c) =>
                            c.state === "repair_required"
                              ? { ...c, state: "repaired" }
                              : c,
                          )
                        : x.clips.map((c) => ({ ...c, state: "under_review" })),
                  }
                : x,
            ),
            ledger: st.ledger.map((l) =>
              l.id === `L-${sess.repairOf}`
                ? { ...l, note: "Waiting on re-review of your fix" }
                : l,
            ),
            stack: [
              ...st.stack.filter(
                (v) => v.name !== "studio" && v.name !== "review",
              ),
              { name: "submission", id: sess.repairOf! },
            ],
          }))
          return
        }
        const id = `S-${Date.now()}`
        const sub: Submission = {
          id,
          jobId: j.id,
          total: sess.locked.total,
          status: "under_review",
          clips: sess.clips.map((c) => ({
            id: c.id,
            prompt: c.prompt,
            state: "under_review",
            seed: c.seed,
            secs: c.secs,
          })),
          submittedAt: "Today, just now",
          waitReason: "Usually back within 24h",
          honoured: sess.honoured,
        }
        set((st) => ({
          ...st,
          session: null,
          submissions: [sub, ...st.submissions],
          ledger: [
            {
              id: `L-${id}`,
              kind: "earning",
              title: j.title,
              when: "Today, just now",
              amount: sess.locked.total,
              state: "pending",
              note: `With reviewers · ${sub.waitReason.toLowerCase()}`,
              day: 0,
            },
            ...st.ledger,
          ],
          vault: [
            {
              id: `V-${id}`,
              title: `${j.title} · ${j.lang.toUpperCase()}`,
              detail: `${sess.clips.length} clips · under review`,
              paid: 0,
              status: "active",
            },
            ...st.vault,
          ],
          notices: [
            {
              id: `N-${id}`,
              title: "Submitted",
              body: `${j.title} is under review. ₹${sess.locked.total} pending.`,
              when: "now",
              target: { name: "submission", id },
              unread: true,
            },
            ...st.notices,
          ],
          stack: [
            ...st.stack.filter(
              (v) => v.name !== "studio" && v.name !== "review",
            ),
            { name: "complete", id },
          ],
        }))
      })
    },

    // Review outcomes (driven by the reviewer system; exposed to the demo panel)
    approve: (id: string) => {
      const s = get()
      const sub = s.submissions.find((x) => x.id === id)
      if (!sub || sub.status === "approved") return
      const j = job(sub.jobId)
      const bonus = j.bonus
      set((st) => ({
        ...st,
        available: st.available + sub.total + bonus,
        submissions: st.submissions.map((x) =>
          x.id === id
            ? {
                ...x,
                status: "approved",
                clips: x.clips.map((c) => ({
                  ...c,
                  state: c.state === "repaired" ? "repaired" : "accepted",
                })),
              }
            : x,
        ),
        ledger: [
          ...(bonus > 0
            ? [
                {
                  id: `LB-${id}`,
                  kind: "bonus" as const,
                  title: `Quality bonus · ${j.title}`,
                  when: now(),
                  amount: bonus,
                  state: "settled" as const,
                  note: "Clear, natural takes",
                  day: 0,
                },
              ]
            : []),
          ...(st.ledger.some((l) => l.id === `L-${id}`)
            ? st.ledger.map((l) =>
                l.id === `L-${id}`
                  ? {
                      ...l,
                      state: "settled" as const,
                      note: undefined,
                      mins: j.minutes,
                    }
                  : l,
              )
            : [
                {
                  id: `L-${id}`,
                  kind: "earning" as const,
                  title: j.title,
                  when: now(),
                  amount: sub.total,
                  state: "settled" as const,
                  day: 0,
                  mins: j.minutes,
                },
                ...st.ledger.map((l) =>
                  l.title === j.title && l.state === "pending"
                    ? {
                        ...l,
                        state: "settled" as const,
                        note: undefined,
                        mins: j.minutes,
                      }
                    : l,
                ),
              ]),
        ],
        vault: st.vault.map((v) =>
          v.title.startsWith(j.title)
            ? {
                ...v,
                paid: sub.total,
                detail: v.detail.replace("under review", "approved"),
              }
            : v,
        ),
        notices: [
          {
            id: `NA-${id}`,
            title: "Approved",
            body: `+₹${sub.total + bonus} for ${j.title} is now available.`,
            when: "now",
            target: { tab: "wallet" },
            unread: true,
          },
          ...st.notices,
        ],
        stack: [
          ...st.stack.filter(
            (v) => v.name !== "submission" && v.name !== "complete",
          ),
          { name: "credited", amount: sub.total, bonus, title: j.title },
        ],
      }))
    },
    partial: (id: string) => {
      const s = get()
      const sub = s.submissions.find((x) => x.id === id)
      if (!sub) return
      const j = job(sub.jobId)
      const room = j.format === "ROOM"
      const bad = room ? 0 : Math.min(sub.clips.length - 1, 1)
      const repair: Submission["repair"] = room
        ? {
            code: "SILENT_PARTICIPANT",
            reason: "Participant 3 was silent for the whole take",
            why: "Room jobs are reviewed as one continuous take, so a single segment cannot be replaced.",
            example: "Each person speaks at least 3 times.",
            tip: "Ask Participant 3 to join in when plans come up.",
            mode: "full_take",
          }
        : {
            code: "BACKGROUND_SPEECH",
            reason: "Another voice overlaps your answer",
            why: "Reviewers could not separate your voice from a person talking nearby.",
            example: sub.clips[bad].prompt.text,
            tip: "Move away from the TV or other people and record this one again.",
            mode: "clip",
          }
      set((st) => ({
        ...st,
        submissions: st.submissions.map((x) =>
          x.id === id
            ? {
                ...x,
                status: "repair_required",
                repair,
                clips: x.clips.map((c, i) => ({
                  ...c,
                  state: room || i === bad ? "repair_required" : "accepted",
                })),
              }
            : x,
        ),
        ledger: st.ledger.map((l) =>
          l.id === `L-${id}`
            ? {
                ...l,
                note: room
                  ? "Held · room take must be repeated"
                  : "Held · 1 clip needs a retake",
              }
            : l,
        ),
        notices: [
          {
            id: `NR-${id}`,
            title: "Repair required",
            body: `${j.title}: ${
              room
                ? "repeat the room take"
                : "retake 1 clip, the rest are accepted"
            }.`,
            when: "now",
            target: { name: "submission", id },
            unread: true,
          },
          ...st.notices,
        ],
      }))
    },
    startRepair: (id: string) => {
      const s = get()
      const sub = s.submissions.find((x) => x.id === id)!
      const j = job(sub.jobId)
      if (s.session) return toast("Finish or discard your active session first")
      const sess = makeSession(j, {
        calibrated: true,
        repairOf: id,
        roomConsented: false,
      })
      sess.locked.total = sub.total
      if (sub.repair?.mode === "clip") {
        const failing = sub.clips.filter((c) => c.state === "repair_required")
        sess.clips = failing.map((c) => ({
          id: c.id,
          prompt: c.prompt,
          state: "ready",
          secs: 0,
          seed: c.seed + 1,
        }))
      }
      set((st) => ({ ...st, session: sess }))
      push({ name: "studio" })
    },
    appeal: (id: string) =>
      set((st) => ({
        ...st,
        submissions: st.submissions.map((x) =>
          x.id === id
            ? {
                ...x,
                status: "appeal",
                waitReason:
                  "Third reviewer re-checking the flagged clip · decision in 2–3 days",
              }
            : x,
        ),
        ledger: st.ledger.map((l) =>
          l.id === `L-${id}`
            ? {
                ...l,
                state: "appeal",
                note: "Under appeal · third reviewer, 2–3 days",
              }
            : l,
        ),
      })),

    closeCampaign: () => {
      const s = get()
      const jid =
        s.session?.jobId ??
        s.submissions.find((x) => x.status !== "approved")?.jobId
      if (!jid) return toast("No in-flight work to protect")
      set((st) => ({
        ...st,
        jobs: st.jobs.map((j) =>
          j.id === jid ? { ...j, campaign: "closed" } : j,
        ),
        session:
          st.session && st.session.jobId === jid
            ? { ...st.session, honoured: true }
            : st.session,
        submissions: st.submissions.map((x) =>
          x.jobId === jid ? { ...x, honoured: true } : x,
        ),
        notices: [
          {
            id: `NC-${jid}`,
            title: "Campaign closed to new work",
            body: `${job(jid).title}: your in-flight work is still honoured at the locked rate.`,
            when: "now",
            target: { name: "detail", jobId: jid },
            unread: true,
          },
          ...st.notices,
        ],
      }))
    },
    expireSession: () =>
      set((s) => ({
        ...s,
        session: s.session && {
          ...s.session,
          status: "expired",
          resumeLeft: "0m",
        },
      })),
    clearExpired: () => set((s) => ({ ...s, session: null })),

    // Money
    verifyUpi: (vpa: string, cb: (r: State["sim"]["upiResult"]) => void) => {
      later(1600, () => {
        const r = get().sim.upiResult
        if (r === "matched")
          set((s) => ({ ...s, upi: { vpa, name: "PRIYA SHARMA" } }))
        cb(r)
      })
    },
    requestWithdrawal: (amount: number) => {
      const s = get()
      const w: Withdrawal = {
        id: `W-${Math.floor(Math.random() * 9000 + 1000)}`,
        amount,
        vpa: s.upi!.vpa,
        status: "requested",
        requestedAt: "Today, just now",
        expected: "by tomorrow, 6 pm (1 working day)",
      }
      set((st) => ({
        ...st,
        available: st.available - amount,
        withdrawal: w,
        ledger: [
          {
            id: `L-${w.id}`,
            kind: "withdrawal",
            title: `Withdrawal to ${w.vpa}`,
            when: "Today, just now",
            amount: -amount,
            state: "processing",
            note: "Withdrawal requested · not paid yet",
            day: 0,
          },
          ...st.ledger,
        ],
        stack: [
          ...st.stack.filter((v) => v.name !== "withdraw"),
          { name: "withdrawal" },
        ],
      }))
      later(1800, () => a.advanceWithdrawal("processing"))
    },
    advanceWithdrawal: (status: Withdrawal["status"]) => {
      const w = get().withdrawal
      if (!w) return
      const noteFor: Record<Withdrawal["status"], string> = {
        requested: "Withdrawal requested · not paid yet",
        processing: "Payment processing · bank has not confirmed yet",
        delayed: "Delayed at the bank · still safe, no action needed",
        paid: "",
        failed: "Failed · ₹ returned to Available",
        hold: "On hold · verification check, 2 working days",
      }
      const utr =
        status === "paid"
          ? String(Math.floor(Math.random() * 9e11 + 1e11))
          : undefined
      set((st) => ({
        ...st,
        available:
          status === "failed" && w.status !== "failed"
            ? st.available + w.amount
            : st.available,
        withdrawal: {
          ...w,
          status,
          utr,
          paidAt:
            status === "paid"
              ? "Today, " +
                new Date().toLocaleTimeString("en-IN", {
                  hour: "numeric",
                  minute: "2-digit",
                })
              : undefined,
        },
        ledger: st.ledger.map((l) =>
          l.id === `L-${w.id}` ||
          (l.state === "processing" && l.kind === "withdrawal")
            ? {
                ...l,
                state:
                  status === "paid"
                    ? "settled"
                    : status === "failed"
                      ? "failed"
                      : "processing",
                note: status === "paid" ? `UTR ${utr}` : noteFor[status],
              }
            : l,
        ),
        notices:
          status === "paid" || status === "failed" || status === "hold"
            ? [
                {
                  id: `NW-${status}-${w.id}`,
                  title:
                    status === "paid"
                      ? "Paid"
                      : status === "failed"
                        ? "Withdrawal failed"
                        : "Withdrawal on hold",
                  body:
                    status === "paid"
                      ? `₹${w.amount} reached ${w.vpa}.`
                      : status === "failed"
                        ? `₹${w.amount} is back in Available.`
                        : "Your money is safe while we verify.",
                  when: "now",
                  target: { name: "withdrawal" },
                  unread: true,
                },
                ...st.notices,
              ]
            : st.notices,
      }))
    },
    clearWithdrawal: () =>
      set((s) => ({
        ...s,
        withdrawal: null,
        stack: s.stack.filter((v) => v.name !== "withdrawal"),
      })),

    // Data rights
    vaultAction: (id: string, kind: "revoke" | "delete") => {
      const step = (status: any, receipt?: string) =>
        set((s) => ({
          ...s,
          vault: s.vault.map((v) =>
            v.id === id ? { ...v, status, receipt: receipt ?? v.receipt } : v,
          ),
        }))
      step(kind === "revoke" ? "revoke_requested" : "delete_requested")
      later(1800, () =>
        step(kind === "revoke" ? "revoke_processing" : "delete_processing"),
      )
      later(4500, () => {
        const rc = `DR-${Math.floor(Math.random() * 90000 + 10000)}`
        step(kind === "revoke" ? "revoked" : "deleted", rc)
        set((s) => {
          const item = s.vault.find((v) => v.id === id)!
          return {
            ...s,
            ledger: s.ledger.map((l) =>
              item.title.startsWith(l.title) && l.state === "settled"
                ? {
                    ...l,
                    state: "deleted_after_revocation",
                    note: "Voice data removed · payment stays settled",
                  }
                : l,
            ),
            notices: [
              {
                id: `ND-${id}`,
                title:
                  kind === "revoke"
                    ? "Revocation completed"
                    : "Deletion completed",
                body: `${item.title}. Receipt ${rc}. Paid money stays yours.`,
                when: "now",
                target: { name: "profile" },
                unread: true,
              },
              ...s.notices,
            ],
          }
        })
      })
    },
    readNotices: () =>
      set((s) => ({
        ...s,
        notices: s.notices.map((n) => ({ ...n, unread: false })),
      })),
    setName: (name: string) =>
      set((s) => ({
        ...s,
        name,
        checklist: { ...s.checklist, profile: true },
      })),
    enableAlerts: () =>
      set((s) => ({ ...s, checklist: { ...s.checklist, alerts: true } })),
    signOut: () => set(() => scenario("fresh")),
  }
  return a
}

type Ctx = {
  s: State
  a: ReturnType<typeof actions>
}
const C = createContext<Ctx>(null!)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<State>(() => scenario("fresh"))
  const ref = useMemo(() => ({ cur: s }), [])
  ref.cur = s
  const a = useMemo(() => {
    const set: Set = (fn) =>
      setS((p) => {
        const n = fn(p)
        ref.cur = n
        return n
      })
    return actions(set, () => ref.cur)
  }, [])
  return <C.Provider value={{ s, a }}>{children}</C.Provider>
}

export const useStore = () => useContext(C)

/** Renders children against a frozen state, so a screen that is animating out keeps showing what it showed. */
type SnapshotProps = {
  s: State
  children: ReactNode
}
export function Snapshot({ s, children }: SnapshotProps) {
  const { a } = useContext(C)
  const value = useMemo(() => ({ s, a }), [s, a])
  return <C.Provider value={value}>{children}</C.Provider>
}

// Selectors shared by Home and destination screens so they never disagree.
export const sel = {
  job: (s: State, id: string) => s.jobs.find((j) => j.id === id) as Job,
  eligible: (s: State) =>
    s.supplyEmpty ? [] : s.jobs.filter((j) => j.lang === s.lang),
  openForMe: (s: State) =>
    sel
      .eligible(s)
      .filter(
        (j) =>
          j.campaign === "open" &&
          j.tier <= sel.tier(s) &&
          j.prompts.length > 0,
      ),
  /** Approved scenes so far: what levels are earned with. */
  approved: (s: State) => s.ledger.filter((l) => l.kind === "earning").length,
  tier: (s: State): 1 | 2 | 3 => {
    const n = s.ledger.filter((l) => l.kind === "earning").length
    return n >= 8 ? 3 : n >= 3 ? 2 : 1
  },
  /** Where you stand on the level path: progress is measured within the current level. */
  level: (s: State) => {
    const n = sel.approved(s)
    const tier = sel.tier(s)
    const cur = LEVELS[tier - 1]
    const next = LEVELS[tier] as typeof LEVELS[number] | undefined
    const pct = next ? Math.min(1, (n - cur.goal) / (next.goal - cur.goal)) : 1
    return {
      n,
      tier,
      cur,
      next,
      pct,
      left: next ? Math.max(0, next.goal - n) : 0,
    }
  },
  inReview: (s: State) =>
    s.submissions
      .filter((x) => x.status === "under_review" || x.status === "appeal")
      .reduce((t, x) => t + x.total, 0),
  held: (s: State) =>
    s.submissions
      .filter((x) => x.status === "repair_required")
      .reduce((t, x) => t + x.total, 0),
  thisWeek: (s: State) =>
    s.ledger
      .filter(
        (l) =>
          l.kind !== "withdrawal" && ["settled", "honoured"].includes(l.state),
      )
      .reduce((t, l) => t + l.amount, 0),
  /** Accepted active minutes this week, and what they earned per hour. */
  minsWeek: (s: State) =>
    s.ledger
      .filter(
        (l) =>
          l.kind === "earning" && ["settled", "honoured"].includes(l.state),
      )
      .reduce((t, l) => t + (l.mins ?? 0), 0),
  rate: (s: State) => {
    const m = sel.minsWeek(s)
    return m ? Math.round((sel.thisWeek(s) / m) * 60) : 0
  },
  total: (s: State) =>
    s.ledger
      .filter(
        (l) =>
          l.kind !== "withdrawal" &&
          ["settled", "honoured", "deleted_after_revocation"].includes(l.state),
      )
      .reduce((t, l) => t + l.amount, 0),
  paidOut: (s: State) =>
    s.ledger
      .filter((l) => l.kind === "withdrawal" && l.state === "settled")
      .reduce((t, l) => t - l.amount, 0),
  attention: (s: State) =>
    s.submissions.filter((x) => x.status === "repair_required"),
  total_: jobTotal,
}
export const MIN_WITHDRAW = 100
