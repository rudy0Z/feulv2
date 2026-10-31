# Feul --- Verified Screen Architecture v2

## Status

This is the pre-Figma architecture pass.

It was checked against: - `MASTER-BLUEPRINT.md` - `07-CONCEPT-LOCK.md` -
`08-PHASE-1-ONBOARDING-FIRST-EARN.md` -
`08-PHASE-2-WALLET-WITHDRAWAL.md` - `08-PHASE-3-JOBS-STUDIO.md` -
`08-PHASE-4-REMAINING.md` - `03-EDGE-CASES.csv` -
`PORTFOLIO-DIRECTION.md` - contributor design/audit rules

The source product logic is preserved. The recent visual decisions are
treated as an intentional v2 direction: - 3 bottom-nav destinations:
Home / Jobs / Wallet - Profile accessible from the top - crisp
cool-neutral visual system - violet/periwinkle as restrained brand
accent - waveform as product identity, not decoration

Do not send this to Figma Make until this architecture is accepted.

------------------------------------------------------------------------

# 1. PRODUCT STORY

## What is the product?

A gig marketplace for the AI data economy.

Indian contributors earn rupees by performing real situations that AI
labs need for coverage:

**speaker × dialect × district × acoustic condition**

The product is not: - an AI chatbot - an AI interview platform - a
productivity app - a finance app - a gamified quest app

The contributor is doing paid work.

AI is infrastructure/director: - labs define situation and acceptance
criteria - AI generates/directs stems, turns, and questions - the human
performs - validation checks quality - the marketplace handles work and
payment

## The contributor story

### Before

"I need to earn, but I don't know what work is available, whether I can
trust it, what I am agreeing to, or when I will get paid."

### Product promise

"Show me work I can actually do, explain exactly what I will record, let
me consent in my language, let me finish the work, and show me where my
money is."

### After

The contributor understands: - what work exists - why a job pays what it
pays - what will be recorded - who can access it - what passed/failed -
when money is expected - what happens if something goes wrong

------------------------------------------------------------------------

# 2. INFORMATION ARCHITECTURE

## Primary navigation

### Home

Current state and next action.

### Jobs

Available work.

### Wallet

Money movement and history.

### Profile

Top-right avatar; not a bottom-nav destination.

### Studio

Not navigation.

Studio is entered from: - Home - Jobs - active/resume card

This keeps the product model clean:

**Home → Work → Money**

------------------------------------------------------------------------

# 3. SCREEN ARCHITECTURE

The product contains many states, but they should not become 30 visually
unrelated screens.

Target approximately 10--12 primary compositions with state variants.

------------------------------------------------------------------------

## FLOW A --- ENTRY / ONBOARDING

### A01 --- Market / Landing

Purpose: Explain the opportunity before asking for account creation.

Content: - product placeholder/brand slot - benefit headline - earning
range - payment timing - concise local contributor proof if retained -
Google - Phone - Email

Important: No Hindi-only chrome before language selection.

Do not oversell AI.

Primary question: **"What is this, and how do I earn?"**

------------------------------------------------------------------------

### A02 --- Authentication

Google / Phone / Email.

If phone: OTP screen.

------------------------------------------------------------------------

### A03 --- OTP

Required states: - idle - filled - wrong code - resend countdown - rate
limited - locked/cooldown

Six-digit OTP.

Touch targets ≥44px.

Error must explain what happened.

------------------------------------------------------------------------

### A04 --- Language Selection

This is one of the most important onboarding screens.

Purpose: Choose the contributor's working language and establish the
language for consent.

Each language option: - native script - language name - short listen
sample

Examples: Hindi / Marathi / Tamil / Bengali / English

Do not make language a decorative preference.

It directly changes: - consent language - available work - job
eligibility - recording expectations

Primary CTA: **Start earning**

------------------------------------------------------------------------

### A05 --- Consent Gate

This MUST occur before any microphone access.

No calibration microphone access before consent.

Explain in the selected language: - what is recorded - who can access
it - why it is used - how withdrawal/data rights work

Required legal concept: Under DPDP Act 2023, voice data can be deleted
and money already paid is not clawed back.

Also provide: - listen-to-protection control - readable text - clear
consent action

This screen is a trust gate, not a legal wall of text.

------------------------------------------------------------------------

### A06 --- Microphone Permission Prime

In-context explanation immediately after consent.

Explain: - why microphone access is needed - what happens next

If denied: - rationale - OS settings path - retry

------------------------------------------------------------------------

# FLOW B --- FIRST EARNING

## B01 --- Home: New Contributor

The first Home state must answer:

**"How do I make my first money?"**

Hierarchy:

1.  Header
2.  first-earning progress
3.  task-state tabs
4.  first opportunity
5.  onboarding checklist
6.  optional recent state

Checklist: - Record first clip → earning amount - Add UPI - Complete
profile - Enable alerts

The first task should be real work, not a tutorial quest.

------------------------------------------------------------------------

## B02 --- First Job Brief

Before recording:

Show: - job title - language - format - duration - total payout - base ×
coverage multiplier + bonus - scene - excerpt/example - how it works -
quiet-room guidance - battery warning for ROOM

The contributor must understand the commitment before recording.

------------------------------------------------------------------------

## B03 --- Calibration + Capture

Calibration is folded into the first recording experience.

Do not make calibration a separate product destination.

Calibration: - phone approximately 15cm - two phrases - live level
feedback

Then: - actual task turns - progress - live mic level - timer -
waveform - pause/cancel - inline quality warnings

Studio is dark only because recording is a distinct functional state.

------------------------------------------------------------------------

## B04 --- Review

Show: - number of clips - playable audio - waveform thumbnails -
pass/issue states - retake - submit

The contributor should be able to judge what they recorded before
submission.

------------------------------------------------------------------------

## B05 --- Pending Review

Show: - submitted state - expected approval timing - amount - what is
being checked

Never show a meaningless spinner.

------------------------------------------------------------------------

## B06 --- Earning Credited

This is a major product moment.

Light surface.

Large money number.

One truth line.

Example: **+₹42** **Settled after review**

No confetti.

No giant animation.

No gamified fireworks.

The emotional reward is clarity: the money exists.

------------------------------------------------------------------------

# FLOW C --- HOME

## C01 --- Home / Returning

Home is not a dashboard.

It answers:

**What should I do now?**

Structure:

### Header

-   product slot
-   notifications
-   profile avatar

### Personal state

-   name
-   selected language
-   relevant opportunity count

### Earnings/progress

-   current available/recent earnings
-   progress toward meaningful threshold
-   in-review amount where useful

### Home tabs

Use task state:

-   Today
-   Available
-   In review

Do NOT use LINES/SCENARIO/INTERVIEW/ROOM as Home tabs.

Those are Jobs filters.

### Next opportunity

One high-priority job.

### More opportunities

Compact list.

### Needs attention

Only when needed: - repair - missing UPI - interrupted session - offline
queue - review issue

------------------------------------------------------------------------

## C02 --- Home / Active Session

If a job is in progress:

The first module becomes:

**Continue recording**

Show: - job name - current step - progress - time/status - Resume

The user should not have to search Jobs to recover work.

This directly supports the 24-hour resume rule.

------------------------------------------------------------------------

## C03 --- Home / No Matching Work

Honest empty state.

Explain: - which language/format has no current work - the supply gap -
notify option - alternative eligible work

Never fake an infinite loading state.

------------------------------------------------------------------------

# FLOW D --- JOB MARKETPLACE

## D01 --- Jobs Feed

Header: **Jobs**

Controls: - search - filters

Format tabs: - All - Lines - Scenario - Interview - Room

These are recording formats.

A job row communicates: - title - situation - language - format -
duration - turns - payout - coverage multiplier - save - open

Do not create a "Top pay" default sort.

Same work has the same base pay.

------------------------------------------------------------------------

## D02 --- Job Detail / Brief

The contributor should be able to answer:

1.  What am I doing?
2.  What language?
3.  How long?
4.  What do I earn?
5.  Why this payout?
6.  What do I need?
7.  Can I hear an example?
8.  What happens after I submit?

Sections: - contextual hero - earnings breakdown - metadata - scene -
sample - how it works - requirements - AI-director explanation - CTA

AI-director explanation must never become a chat UI.

------------------------------------------------------------------------

# FLOW E --- STUDIO

## E01 --- Studio Capture

Dark Carbon functional environment.

Core elements: - context - segmented progress - script - prompt/stem -
live waveform - live mic level - timer - recording trigger - pause -
cancel - posture guidance

The waveform moves only when audio exists.

------------------------------------------------------------------------

## E02 --- Follow-up Turn

This is not chat.

Mental model:

**Situation → prompt/stem → contributor response → next turn**

The screen should visually communicate sequential recording.

For INTERVIEW format: - prerecorded stem - contributor answer

For SCENARIO: - situation + guided turn

For LINES: - read the provided content

For ROOM: - multi-person one-take

------------------------------------------------------------------------

## E03 --- Studio Quality State

Possible states: - recording - listening - processing - noise warning -
silence - mic denied - interrupted - ready for next turn

Noise warning pauses recording and explains how to continue.

It does not silently discard work.

------------------------------------------------------------------------

## E04 --- Room Consent

Before ROOM capture:

-   identify participants
-   each person consents
-   minor check
-   guardian path where required
-   blocking state until all required consent is complete

------------------------------------------------------------------------

## E05 --- Room Capture

Show: - active speaker - previous speakers - future speakers - live
waveform/level - manual/VAD progression

Do not force people forward with a fixed timer.

------------------------------------------------------------------------

# FLOW F --- REVIEW / REPAIR

## F01 --- Review

Contributor reviews each clip.

Use: - playable clip - waveform thumbnail - duration - status - retake

Submit once.

------------------------------------------------------------------------

## F02 --- Partial Rejection / Repair

Example:

**9/10 passed** **Fix 1 → ₹25**

Show: - accepted clips remain accepted - failed clip - exact taxonomy
reason - why - native-language example - correction tip - re-record -
later - appeal where applicable

Retaking one clip should not destroy accepted work.

------------------------------------------------------------------------

## F03 --- Quality Dispute

Bounded appeal: - appeal window - what gets rechecked - expected
timeline - third-reviewer escalation - final result

------------------------------------------------------------------------

# FLOW G --- WALLET

Wallet needs its own story.

It is not a banking dashboard.

It answers:

**"What money do I actually have, what is still being checked, and when
can I withdraw it?"**

## G01 --- Wallet Home

Hero is NOT one giant balance.

The hero is a varied bento hierarchy.

### Available

Large and visually dominant.

### In review

Pending money + explicit reason.

### This week

Neutral progress/trend.

### Total

Quiet historical context.

### UPI

-   VPA
-   Name matched
-   expected settlement timing
-   edit

### Tabs

Exactly:

**All \| Earnings \| Withdrawals**

These tabs filter the ledger.

------------------------------------------------------------------------

## G02 --- Wallet Ledger

Each row:

-   transaction/job
-   date/time
-   amount
-   state
-   reason when pending
-   bonus separately

States: - pending - settled - failed - under appeal - deleted after
revocation - campaign closed but submission honoured

Every pending row says what it is waiting for.

Example: **Waiting on validator review**

Never use "Pending" alone.

------------------------------------------------------------------------

## G03 --- Weekly Filter

A compact seven-day control can filter ledger/activity.

It is not a second navigation system.

------------------------------------------------------------------------

## G04 --- Withdrawal: Add UPI

-   VPA input
-   validation
-   name matching

------------------------------------------------------------------------

## G05 --- Name Match

Short verification ceremony.

Result: **Name matched**

------------------------------------------------------------------------

## G06 --- Withdrawal Amount

Show: - available - amount - exact gap to ₹100 if below minimum -
presets - no-fee/minimum explanation - destination VPA

If ₹82 available:

**₹18 more to withdraw**

The user never has to calculate.

------------------------------------------------------------------------

## G07 --- Withdrawal Confirm

One intentional hero exception.

Show: - amount - breakdown - destination - expected relative date -
working-day expectation

Do not say instant if the system is not instant.

------------------------------------------------------------------------

## G08 --- Withdrawal Success

Show: - success - amount - reference - UTR - VPA - timestamp - receipt -
share option

The receipt is a trust artifact.

------------------------------------------------------------------------

## G09 --- Withdrawal Failure / Hold

Branches: - payment failed → money stays available + retry -
spoof/verification hold → explanation + appeal + timeline + money stays
safe

------------------------------------------------------------------------

# FLOW H --- PROFILE / STANDING

## H01 --- Profile

Profile is not social.

Show:

### Standing

-   current standing
-   reliability
-   access/unlock preview

### Craft

Per: - format × language

Show bonus eligibility context.

### Coverage context

Explain where the contributor is valuable in the current marketplace.

Do not turn it into another progress bar.

### Data Vault

Recorded data grouped by meaningful items.

Each item: - data summary - revoke - revocation receipt

Money already paid remains settled after deletion.

------------------------------------------------------------------------

# FLOW I --- REWARDS / STANDING

Rewards is secondary.

Use: - standing hero - perks - unlocks - badges where useful

No: - streaks - fake XP - daily coins - gamified quests

Standing exists because it affects: - access - settlement speed

It does not change base pay.

------------------------------------------------------------------------

# 4. REQUIRED EDGE STATES

The architecture must include these as reachable states:

1.  Room consent incomplete
2.  Coverage full
3.  Campaign closes during browsing
4.  Session interrupted
5.  Consent revoked after payment
6.  Suspected synthetic/spoof hold
7.  Dialect mismatch
8.  Silent room participant
9.  Quality dispute
10. Minor/guardian consent
11. Offline/upload queue
12. Partial rejection
13. Mic permission denied
14. Noise threshold breach
15. Low battery for ROOM
16. Campaign cancelled after submission
17. Validator disagreement pending
18. Validator quality degradation (Tier 3)
19. Validator queue empty (Tier 3)
20. Marketplace empty
21. Campaign oversubscribed
22. All campaigns locked except guaranteed eligible LINES
23. Wrong language / duplicate / daily limit / UPI failure /
    below-minimum

Tier 3 validator states should not dominate the contributor build.

------------------------------------------------------------------------

# 5. WHAT IS ACTUALLY PORTFOLIO-WORTHY

Do not make every state a showcase.

Primary visual/story compositions:

1.  Language selection
2.  Consent gate
3.  New Contributor Home
4.  First Job Brief
5.  Studio Capture
6.  Review → Repair
7.  Wallet
8.  Withdrawal confirmation
9.  Earning credited
10. Profile / Standing

Everything else supports these.
