# FEUL — Contributor App Build Plan

## Context
The repo is an empty Vite + React 19 + Tailwind v4 scaffold (`src/App.tsx` is 3 lines, `src/index.css` is a single Tailwind import). Nine locked spec docs in `src/imports/` describe FEUL, a voice-data gig marketplace for Indian contributors. Goal: build a clickable mobile prototype that works as a **stateful product system**, following Doc 09's contracts (screen ≠ state). Visual direction: go straight to the Doc 02 brand layer (cool neutral, electric violet `#6C63FF`/periwinkle, waveform as the identity primitive, dark "Carbon" Studio, Anek type). It stays restrained: no decorative gradients, glass, or blobs. The user allowed "distinctive now."

## Architecture
- **No router.** A single store holds the whole product state plus a view stack: `{tab: home|jobs|wallet, stack: View[]}`. Onboarding, Job Detail, Studio, Review, Repair, Withdrawal and Profile are pushed views. Notifications, discard confirm, UPI and data-rights actions are sheets/dialogs. Bottom nav is only Home / Jobs / Wallet. The avatar in the top bar opens Profile, and the bell opens a Notifications sheet.
- Render inside a centered 390px phone frame on desktop (full-bleed on mobile).
- **Demo control:** a small, unobtrusive "Scenario" drawer outside the phone frame lets a reviewer jump to seeded states: new, returning, active session, upload failed, resume expired, repair, no work, campaign closed, withdrawal processing/failed/hold. It lives outside the product UI, so it doesn't count as product scope.

## Files
- `src/index.css`: Google Fonts `@import` (Anek Latin, Anek Devanagari, Anek Tamil, Anek Bangla) placed first. Then `@import 'tailwindcss'` and a `@theme` block of semantic tokens: surface/on-surface/outline, primary/containers, audio, success/warning/error/info, carbon studio surfaces, radii 8/14/24/pill, and the type scale. Tabular-nums utility.
- `src/state/types.ts`: entity + lifecycle enums:
  - `ClipState`: ready → recording → recorded_local → uploading → upload_failed → submitted → under_review → accepted | repair_required → repaired
  - `SessionState` with a `resumeExpiresAt` field (24h) and an expired branch
  - `WithdrawalState`: requested → processing → paid | failed | delayed | hold. The UTR is only set when paid.
  - `DeletionState`: requested → processing → completed
  - `ConsentState`, plus `MicPermission` (unknown/granted/denied)
  - `Job` fields: format (LINES|SCENARIO|INTERVIEW|ROOM), base, coverage, bonus, locked total, campaignStatus (open|full|closed), tier gate
  - Money buckets: submitted / approved / available / paid
- `src/state/seed.ts`: realistic jobs, e.g. "Local shop conversation" (Hindi, Scenario, ~6 min, ₹42, 1.6×). Plus Marathi/Tamil/Bengali/English jobs, ledger rows with explicit pending reasons, and the scenario presets.
- `src/state/store.tsx`: a `useReducer` context with actions: `acceptConsent`, `grantMic`/`denyMic`, `startJob` (locks payout), `recordClip`, `upload` (simulated with a success or fail toggle), `retryUpload`, `discard`, `submit`, `resolveReview`, `retakeClip`, `appeal`, `requestWithdrawal`, `advanceWithdrawal`, `revoke`/`delete`, `closeCampaign`, `saveJob`. The helper `total = round(base × coverage) + bonus` lives here.
- `src/components/`: TopBar, BottomNav, Button (filled/tonal/outlined/text/icon; with loading and disabled states), Tabs, JobRow, JobCard, CoverageBadge, MetaChips, Waveform (live/scrub/thumb/separator/lanes as one SVG component with a `register` prop), AudioPlayer, StatusPill (one vocabulary per Doc 09 §19), MoneyModule, LedgerRow, Sheet, Dialog, Snackbar, EmptyState, OtpInput.
- `src/screens/`, grouped by flow:
  - Onboarding: Landing → Auth → OTP (wrong code / resend countdown / locked) → Language (native script plus listen sample) → Consent (native language, DPDP delete-without-clawback, listen control, adult-only 18+ confirmation) → Mic prime (denied → settings path/retry)
  - Home: variants driven by state. New shows ₹100 progress, a checklist and the first job. Returning. An active-session resume card. A needs-attention card for upload failed, repair or missing UPI. No matching work. Tabs are Today / Available / In review.
  - Jobs: search, filter sheet, format tabs, and states for tier lock, full, oversubscribed and honest empty. A saved-jobs filter.
  - JobDetail: hero, earnings breakdown, sample scrub player, how-it-works with the AI-director explanation (no chat), requirements, the ROOM battery warning, and a CTA. Also a campaign-closed banner.
  - Studio (dark): calibration folded into the first session (15cm, two phrases). Format-specific capture:
    - LINES: script
    - SCENARIO: situation + guided turn
    - INTERVIEW: stem playback → answer
    - ROOM: roll-call consent gate → active/previous/next speakers
    - Shared: live waveform only while recording, level meter, timer, pause/cancel. Noise pause and silence states. Interruption → saved locally.
  - Review: clips with thumb waveforms and playback, retake, "Recorded on device" labels. Submit → Uploading → Upload failed (retry / upload later) → Submitted → Under review, with the wait reason.
  - Repair: "9/10 accepted — 1 line needs a retake" with labeled amounts ("₹X approved · ₹Y pending this fix"). Taxonomy reason, native example, tip, retake / later / appeal (window + timeline).
    - SCENARIO/INTERVIEW: replace the failed turn only.
    - ROOM: the result states the required path (repeat full take / resolve participant consent) and never offers a single-clip retake.
  - EarningCredited: light screen, large "+₹42", "Approved after review · available to withdraw" (or "added to In review" as appropriate).
  - Wallet: bento of Available (dominant), In review + reason, This week (7-day filter), Total. UPI status card. Ledger tabs All / Earnings / Withdrawals, with rows for pending-with-reason, settled, failed, appeal, deleted-after-revocation, and campaign-closed-honoured. The CTA shows the exact gap ("₹18 more to withdraw").
  - Withdrawal: Add UPI → name-match (matched / mismatch / verification unavailable) → Amount (presets, min ₹100) → Confirm (relative working-day date) → Requested/Processing status (support link, delayed variant) → Paid receipt with UTR + share. Failed shows "money returned to Available" + retry. Hold shows the explanation + appeal + timeline.
  - Profile: standing, reliability, unlock preview, a craft grid (format × language), coverage context, Data Vault. Revoke/delete runs request → processing → completed with a receipt and the note "paid money stays settled". Also edit profile/languages, notification prefs, help, and sign out.
- `src/App.tsx`: provider + phone frame + view renderer.

## Key contract enforcement
- The Studio mic cannot start unless `consent === accepted && mic === granted`. Otherwise it routes to the Consent or Mic prime view.
- Payout is locked at `startJob` and read from the session everywhere afterwards (Detail → Studio → Review → Wallet).
- Closing a campaign marks in-flight sessions "honoured" and adds a banner/ledger note. It never deletes them.
- Home reads the same store selectors as its destination screens, so their states can't contradict each other.
- Leaving the Studio with local clips opens the Discard dialog, which explains what is lost and that it can't be undone.
- An expired resume shows an explicit card: the local clips can't be submitted, no payout, and the job can be restarted if it's still open.

## Verification
- Walk the Doc 08 final QA path in the preview: language → consent → first job → record → review → submit → under review → credited → wallet → withdraw → processing → paid receipt with UTR → Data Vault revoke.
- Use the Scenario drawer to check each edge state has explanation, status, next action and recovery.
- Run `pnpm build` once at the end to catch type/JSX errors.
