# 09 — IMPLEMENTATION CLARIFICATIONS & STATE CONTRACTS

**Project:** Feul  
**Document role:** Pre-build implementation clarification  
**Status:** LOCK BEFORE FIGMA MAKE BUILD  
**Purpose:** Resolve ambiguity between the existing Feul product, UX, architecture, and design-system documents without expanding product scope.

---

## 0. DOCUMENT PURPOSE

The existing Feul documents establish the product concept, contributor journey, information architecture, visual foundation, screen architecture, and portfolio-defining moments.

This document exists because a final specification/code comparison identified several areas where the product is conceptually defined but the **state transitions, guarantees, or implementation behavior are not explicit enough**.

This document therefore answers:

> **What exactly should happen between the screens that already exist?**

It is not a new product brief.

It does not introduce a new navigation model.

It does not add unnecessary features.

It does not replace the locked product concept.

It converts ambiguous product promises into explicit implementation contracts.

---

# 1. DOCUMENT AUTHORITY & PRECEDENCE

Use the existing documents as a single product specification.

When implementation details conflict or remain ambiguous, use this precedence:

### Priority 1 — Locked product concept / master blueprint
Defines what Feul fundamentally is and what it is not.

### Priority 2 — Verified screen architecture
Defines the intended contributor routes, screens, and major states.

### Priority 3 — This document
Defines state transitions, guarantees, recovery behavior, and implementation clarifications discovered during the pre-build audit.

### Priority 4 — Design-system and visual documents
Define how the already-decided product should be represented visually.

### Rule

If this document clarifies a state, **use the clarification**.

If this document appears to introduce a new product feature, **do not implement it unless another locked document already supports it**.

When uncertain, preserve the smaller scope.

---

# 2. CORE IMPLEMENTATION PRINCIPLE

## A screen is not a state.

Feul must be implemented as a connected stateful product rather than a collection of independent showcase screens.

For every important user action, model:

```text
Current state
→ user action
→ processing state
→ success / failure
→ recovery
→ resulting state
```

The UI must make meaningful state differences visible.

Do not use the same generic screen with changed copy when the underlying product state is materially different.

Examples:

```text
Recorded locally ≠ Submitted
Submitted ≠ Under review
Under review ≠ Accepted
Withdrawal requested ≠ Payment confirmed
Earned ≠ Approved
Approved ≠ Withdrawable
Repair required ≠ Rejected permanently
```

These distinctions are central to Feul's trust model.

---

# 3. FIRST-SESSION EARNING CONTRACT

The existing product concept intentionally makes **₹100 reachable in the first session** a meaningful product moment.

However, "reachable" must not be interpreted as:

> guaranteed ₹100 cash withdrawal during the first session.

Those are different promises.

## 3.1 What the promise means

The first-session experience should demonstrate a credible path where a new contributor can access eligible work whose combined base/coverage-adjusted earnings can reach approximately ₹100 **if eligible work is available and completed successfully**.

The UI must not imply guaranteed supply.

## 3.2 New contributor eligibility

A new contributor can access work according to the existing eligibility rules:

- selected language
- relevant dialect where applicable
- required format eligibility
- standing/access rules
- microphone/device requirements
- campaign availability
- daily/job limits
- any required consent

Do not invent a separate beginner-only marketplace.

## 3.3 If work fills up

If the first eligible opportunity becomes unavailable:

- explain that the opportunity is no longer available
- preserve the contributor's sense of progress
- surface another eligible opportunity when one exists
- otherwise use the existing **No Matching Work** state

Do not promise that another job will necessarily appear immediately.

## 3.4 Earning terminology

Use distinct concepts:

### Submitted earnings
Work has been submitted but has not necessarily passed review.

### Approved earnings
Work has passed the relevant quality/review process.

### Available balance
Money that is eligible for withdrawal according to the existing withdrawal rules.

### Withdrawn / paid
A withdrawal has been successfully completed.

Never imply:

> "You earned ₹100, therefore ₹100 is immediately withdrawable."

unless the underlying state actually supports it.

---

# 4. RECORDING & UPLOAD STATE CONTRACT

Recording is one of Feul's highest-trust flows.

The following states must remain distinct.

## 4.1 State model

```text
Ready to record
      ↓
Recording
      ↓
Recorded locally
      ↓
Uploading
      ↓
Submitted
      ↓
Under review
```

From relevant states:

```text
Uploading
   └── Upload failed
          ├── Retry now
          └── Upload later / recover

Recorded locally
   └── Resume later

Recorded locally
   └── Discard → confirmation → discarded
```

## 4.2 Recorded locally

Means:

> The recording exists on the contributor's device/session but has not yet been successfully submitted to Feul.

UI must not call this "submitted."

The contributor should understand:

- the recording is still recoverable
- upload has not completed
- payment/review has not started
- they can resume or retry

## 4.3 Uploading

Show an explicit in-progress state.

Do not let the interface look like submission has already succeeded.

If the user leaves the relevant surface, Home should be capable of communicating that the session is still in progress.

## 4.4 Upload failed

Must provide:

- clear failure explanation
- retry action
- safe alternative to return later where applicable
- preservation of the recording when technically possible

A failed upload is **not a rejected submission**.

## 4.5 Submitted

Only show "Submitted" after the system has successfully received the required recording.

This is the point at which the submission can move into review.

## 4.6 Discard

Discarding a locally recorded but unsubmitted recording requires confirmation.

The confirmation must communicate:

- what will be lost
- whether it can be recovered
- that the action cannot be undone if applicable

Do not hide discard behind ambiguous copy.

---

# 5. RESUME WINDOW & SESSION RECOVERY

The product supports a resume window for interrupted work.

The UI must distinguish:

### Resume available

The contributor can continue the existing session.

### Resume expired

The previous session can no longer be resumed under the defined window.

The UI must explicitly explain what happens to:

- saved recording
- submission eligibility
- potential payout
- remaining work

Do not silently reset the contributor to the beginning.

## Recovery principle

> Never make the contributor guess whether their work was saved, submitted, or lost.

---

# 6. WITHDRAWAL STATE CONTRACT

Withdrawal is a financial state machine and must not collapse multiple states into one "success" screen.

## 6.1 Primary lifecycle

```text
Available balance
      ↓
Withdrawal requested
      ↓
Processing
      ↓
Paid
```

## 6.2 Withdrawal requested

Means:

> The contributor has successfully submitted a withdrawal request.

It does **not** mean money has reached the contributor.

The balance should reflect whatever temporary availability rule the product defines.

## 6.3 Processing

Show that the withdrawal is still being processed.

The contributor should be able to understand:

- amount
- destination
- request status
- expected timing where defined
- what to do if it is delayed

## 6.4 Paid

Only show the final success receipt when payment is confirmed.

The success state should contain:

- amount
- destination
- payment date/time
- UTR when available
- relevant transaction/reference information

A submitted withdrawal request must never be represented as a confirmed payment.

---

# 7. WITHDRAWAL EXCEPTION STATES

The withdrawal flow must explicitly handle:

## UPI name mismatch

Explain that the registered name and UPI account details could not be matched according to the product's verification rule.

Provide the appropriate recovery action.

## Verification unavailable

Do not imply that the contributor's details are incorrect when the verification service itself is unavailable.

Communicate:

> Verification is temporarily unavailable.

Then provide a retry/recovery path.

## Withdrawal failed

The contributor must know:

- withdrawal did not complete
- whether funds returned to Available
- whether they need to retry
- whether support is required

## Delayed payment

Do not show "success" while a payment is merely delayed.

Use a processing/delayed state with clear status and support guidance.

## Hold

If an existing product rule places a withdrawal or payment on hold, explain the reason without exposing internal operational complexity unnecessarily.

---

# 8. UTR CONTRACT

UTR is evidence of a completed payment.

Therefore:

```text
Withdrawal requested
≠ UTR
```

and

```text
Processing
≠ UTR
```

A UTR should appear only when the payment state provides a valid transaction reference.

The receipt must therefore represent:

> **confirmed payment**

not:

> withdrawal request submitted.

---

# 9. CONSENT CONTRACT

The core rule remains:

> **No microphone capture before required consent.**

The implementation may expose consent through onboarding and/or contextual recording surfaces according to the verified architecture, but the underlying state must remain explicit.

## Required conceptual sequence

```text
Understand recording/data use
        ↓
Consent
        ↓
Microphone permission
        ↓
Recording
```

The interface must never make a contributor believe that granting microphone permission itself constitutes consent to the data-use terms.

## Consent should communicate

- what is being recorded
- why it is being collected
- how it is used
- relevant retention/data-rights information
- the contributor's ability to understand the decision before recording

Use native-language presentation where the product specification requires it.

---

# 10. FORMAT-SPECIFIC REPAIR CONTRACT

"Repair" must not assume every job consists of a single independent clip.

## LINES

Natural repair model:

```text
9/10 accepted
1 line rejected
→ retake rejected line
```

Accepted clips remain accepted.

## SCENARIO

Repair should identify the failed material/turn and require only the necessary replacement where the underlying job structure permits it.

Do not automatically force a complete restart.

## INTERVIEW

"Interview" refers to the **recording format**, not job application.

Repair should operate on the relevant recording turn/segment according to the campaign structure.

Never introduce proposal/interview/application mechanics.

## ROOM

ROOM is a multi-person recording format.

Do not assume that:

> "Retake one clip"

is always possible.

The repair state must clearly communicate whether the contributor needs to:

- replace a segment
- repeat the full room recording
- resolve participant consent
- follow another campaign-defined recovery path

The UI must not invent a partial ROOM repair model if the underlying product data does not support one.

---

# 11. PARTIAL ACCEPTANCE & PAYMENT

The product may communicate a state such as:

> 9/10 passed — Fix 1

However, payout meaning must be unambiguous.

Do not use a number such as:

> ₹25

without defining what it represents.

Possible meanings must not be mixed:

- full job payout
- remaining payout
- repaired segment value
- amount already approved

The UI should label the amount according to its actual financial meaning.

## Core rule

Accepted work remains accepted.

A repair should not silently invalidate already accepted material.

---

# 12. CAMPAIGN CLOSURE & IN-FLIGHT WORK

Campaign closure must not silently destroy contributor work that has already entered an active flow.

If a contributor has an in-flight job and the campaign closes:

- honor the defined in-flight job protection
- communicate what happens next
- preserve relevant work according to the existing product rule
- avoid showing the job as simply disappearing

The contributor should be able to understand:

> "This campaign is closed to new work, but my existing work is still being handled."

Do not invent new compensation rules beyond the existing product specification.

---

# 13. COVERAGE & PAYOUT LOCKING

Coverage-based pay is part of the core product model.

The contributor should understand the relationship between:

```text
Base payout
×
Coverage multiplier
+
Applicable bonus
=
Expected total
```

The system must establish when the payout is locked.

For an in-progress job:

- a campaign closing should not silently rewrite the contributor's already-accepted terms
- a 24-hour resume should not silently change the displayed payout
- coverage state should be consistent across Job Detail, Studio, Review, and earnings

If a payout changes for a legitimate product reason, the UI must explicitly communicate the change rather than silently replacing the amount.

---

# 14. "NO MATCHING WORK" VS "ELIGIBLE WORK"

These are different concepts.

### Eligible

The contributor satisfies the requirements for a type of work.

### Available

At least one eligible job is currently open and has remaining capacity.

Therefore:

```text
Eligible ≠ Guaranteed available supply
```

The Home and Jobs experience must not imply that eligibility guarantees a job.

If no eligible work is currently available:

> Use the existing No Matching Work state.

Do not manufacture placeholder jobs merely to make the prototype look populated.

---

# 15. SUPPORTING SURFACES

The core navigation remains:

```text
Home
Jobs
Wallet
```

Profile remains accessible from the top-right avatar/profile control.

Do not create new top-level navigation for secondary functions.

The following supporting actions may be implemented as sheets, dialogs, secondary views, or contextual destinations:

### Notifications

Notifications should deep-link to the relevant context:

- repair required
- job update
- payment update
- withdrawal status
- important account/data-rights event

Do not carry legacy validator/quest notification content into the contributor-only rebuild.

### Saved jobs

If saved jobs exist in the product architecture, provide a way to:

- view saved jobs
- understand when a saved job has closed
- remove/save jobs

Do not build an elaborate saved-job subsystem if it is not required by the existing product flow.

### Profile editing

Support relevant account editing such as:

- name
- working languages
- dialects where applicable

Do not add generic social-profile behavior.

### Notification preferences

Keep preferences focused on relevant product communication.

### Help / support

Provide a clear route from failure/payment states to help where required.

### Sign out

Provide a standard account exit action without making it a primary product destination.

---

# 16. DATA RIGHTS STATE CONTRACT

The product includes contributor data control.

Deletion/revocation should distinguish:

```text
Request received
      ↓
Deletion processing
      ↓
Deletion completed
```

Do not immediately display "Deleted" after a request is merely submitted.

## Revocation

Revoking future data use should be represented separately from historical payment settlement.

The product principle remains:

> Paid money is not clawed back simply because a contributor later exercises a supported data-rights action.

The exact legal/data policy should be represented as a reviewed product policy rather than inferred solely from a legal framework name.

---

# 17. MINOR / GUARDIAN ELIGIBILITY

The current architecture identifies minor/guardian consent as an edge case but does not fully define a complete guardian workflow.

For the focused contributor prototype:

### Preferred scope decision

Treat the prototype as an **adult-only contributor experience** unless a complete guardian-consent flow is explicitly added to the product specification.

The eligibility boundary must be clear.

Do not partially implement guardian consent and leave the user in an undefined state.

---

# 18. SUPPORTING ACCOUNT STATES

The prototype should account for the following where relevant:

- authentication failure
- OTP failure
- OTP retry/expiry
- microphone denied
- microphone unavailable
- unsupported language
- daily limit reached
- job capacity reached
- dialect mismatch
- account eligibility restriction
- no matching work

Each state should have:

1. explanation
2. current status
3. next action
4. safe recovery where possible

Avoid generic:

> "Something went wrong."

when a more useful explanation is available.

---

# 19. STATE LANGUAGE RULES

Use precise status language.

### Prefer

- Recorded on device
- Uploading
- Upload failed
- Submitted
- Under review
- Repair required
- Approved
- Payment processing
- Paid

### Avoid

- Done
- Complete
- Success

when the underlying state is not actually final.

The language should help contributors answer:

> **What happened?**

> **What happens next?**

> **Is my money/work safe?**

---

# 20. HOME STATE SYNCHRONIZATION

Home is the contributor's primary status surface.

It must reflect meaningful state changes from:

- active recording
- upload
- review
- repair
- payment
- withdrawal
- campaign closure

Examples:

### Active session

Home should offer a clear resume action.

### Upload failed

Home should communicate that work needs attention.

### Under review

Home should communicate that submission is awaiting review rather than asking the contributor to redo it.

### Repair required

Home should surface the repair as a useful next action.

### Withdrawal processing

Wallet may own the detailed state, but Home may surface a concise status when relevant.

Do not allow Home and the destination screen to show contradictory states.

---

# 21. CROSS-SCREEN CONSISTENCY CONTRACT

The same underlying entity must not change meaning between surfaces.

For a job:

```text
Jobs → Job Detail → Studio → Review → Wallet
```

the following must remain consistent:

- job name
- format
- language
- coverage state
- payout
- progress
- submission status
- repair status

For a withdrawal:

```text
Wallet → Confirmation → Processing → Receipt
```

the following must remain consistent:

- amount
- destination
- status
- timing
- transaction reference

---

# 22. WHAT NOT TO ADD

This clarification document does not authorize:

- quests
- streaks
- XP
- coins
- security reserve
- validator applications
- validator dashboards
- role switching
- social profiles
- AI copilot/chat
- generic fintech features
- unnecessary dashboards
- elaborate notification centers
- arbitrary profile metrics
- new marketplace mechanics
- speculative legal guarantees
- guaranteed job availability

If an implementation idea requires one of these, stop and check the locked product specification.

---

# 23. BUILD SCOPE

The prototype should remain focused on approximately the existing primary compositions.

Do not increase scope simply because an edge case exists.

A complex state can often be represented through:

- variant
- sheet
- dialog
- inline status
- bottom sheet
- contextual detail
- existing destination

rather than an entirely new screen.

The goal is:

> **Complete behavior, not maximum screen count.**

---

# 24. IMPLEMENTATION ORDER

Build in the following sequence.

## PASS 1 — CORE PRODUCT

1. Design tokens
2. Core components
3. Navigation
4. Home
5. Jobs
6. Job Detail
7. Studio
8. Review
9. Wallet
10. Profile

Primary journey:

```text
New contributor
→ language
→ consent
→ eligible opportunity
→ job brief
→ capture
→ review
→ submission
→ earning
→ wallet
```

---

## PASS 2 — STATE COMPLETENESS

Add the state variants that make the core product truthful:

- upload failure
- resume
- resume expiry
- discard
- under review
- partial rejection
- repair
- campaign closure
- coverage full
- no matching work
- withdrawal processing
- withdrawal failure
- UPI mismatch
- verification unavailable
- payment delay
- data deletion states
- ROOM consent
- ROOM repair behavior
- notification/support entry points

---

## PASS 3 — VISUAL REFINEMENT

Only after the product architecture is coherent:

- introduce final typography treatment
- refine composition
- establish Feul's acoustic visual identity
- introduce waveform registers
- introduce linear spectral gradients
- refine spacing/rhythm
- add purposeful motion
- improve responsive behavior
- polish micro-interactions
- prepare portfolio showcase compositions

External visual references belong here, not in the initial foundation pass.

---

# 25. PRE-BUILD ACCEPTANCE CHECKLIST

Before considering Feul's first implementation pass complete:

## Product truth

- [ ] Feul is clearly a contributor-first audio-data marketplace.
- [ ] AI directs the work; it does not become a generic AI chat product.
- [ ] Work is represented as jobs, not quests.
- [ ] Standing affects access/settlement rules, not base pay.
- [ ] Coverage-based payout is understandable.
- [ ] No false guarantee of job availability exists.

## First earning

- [ ] A new contributor can understand their first earning opportunity.
- [ ] The ₹100 path is demonstrable.
- [ ] Earned, approved, available, and paid states are distinct.

## Recording

- [ ] Consent occurs before microphone capture.
- [ ] Recording is distinct from submission.
- [ ] Uploading is distinct from submitted.
- [ ] Upload failure has recovery.
- [ ] Local recording can be distinguished from server submission.
- [ ] Discard is explicit.
- [ ] Resume behavior is understandable.
- [ ] Resume expiry is handled.

## Review

- [ ] Under review is explicit.
- [ ] Accepted material survives repair.
- [ ] Partial rejection is understandable.
- [ ] Repair behavior is format-aware.
- [ ] ROOM does not incorrectly inherit LINES repair logic.

## Money

- [ ] Wallet states are explicit.
- [ ] Withdrawal request is not payment success.
- [ ] Processing is distinct from paid.
- [ ] UTR only appears for confirmed payment.
- [ ] Failure and delayed states are understandable.
- [ ] Name mismatch has recovery.
- [ ] Verification outage is not presented as user error.

## Trust & rights

- [ ] Consent is understandable.
- [ ] Data-rights states are explicit.
- [ ] Revocation does not imply clawback of already-settled money.
- [ ] Campaign closure does not silently destroy in-flight work.

## Supporting experience

- [ ] Notifications have meaningful destinations.
- [ ] Support can be reached from important failure states.
- [ ] Profile editing has a clear path.
- [ ] No unnecessary top-level navigation is introduced.

## System quality

- [ ] Components are reused.
- [ ] States are represented as variants where appropriate.
- [ ] Identical concepts have identical terminology.
- [ ] Home and destination screens stay synchronized.
- [ ] No screen exists only because the prototype needs another screen.
- [ ] Failure states are designed with the same care as happy paths.

---

# 26. FINAL PRINCIPLE

Feul should not feel like a collection of polished screens.

It should feel like a product where the contributor always understands:

> **What am I doing?**

> **What happened?**

> **Is my work safe?**

> **Is my money safe?**

> **What happens next?**

The strongest version of this case study is therefore not the one with the most screens.

It is the one where the system remains understandable when:

- work fails,
- recordings are interrupted,
- jobs fill up,
- campaigns close,
- clips are rejected,
- money is pending,
- payments are delayed,
- consent changes,
- and data is deleted.

**Build the happy path first.  
Make every important state truthful.  
Then make the system beautiful.**
