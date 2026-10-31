# Feul --- UX Architecture

## Mental model

The contributor's primary question changes by context:

### Home

**What should I do now?**

### Jobs

**What work can I do?**

### Job Detail

**Is this work worth doing and can I do it?**

### Studio

**What exactly do I need to perform right now?**

### Review

**What passed, what failed, and what can I fix?**

### Wallet

**What happened to my money?**

### Profile

**What have I earned access to?**

## Navigation

### Bottom navigation

Exactly three destinations:

  Destination   Purpose
  ------------- -------------------------------------
  Home          Current work, progress, next action
  Jobs          Browse available work
  Wallet        Earnings, review, withdrawal

### Top-right profile

Avatar opens Profile / Standing.

Notifications remain accessible from the top area.

## Home information architecture

The Home screen should not be a generic dashboard.

Recommended hierarchy:

1.  Greeting + language context
2.  Earning/progress state
3.  Simple task-state tabs
4.  Next opportunity
5.  More opportunities
6.  Optional recent activity

### Home tabs

Use task state, not recording format:

-   Today
-   Available
-   In review

Recording formats belong inside Jobs.

## Home dynamic states

### New contributor

Primary CTA: **Start earning**

Show: - first earning opportunity - onboarding checklist - language -
consent status - amount achievable

### Returning contributor

Primary CTA: **Continue** or **Start this job**

Show: - current earnings - next opportunity - available work - review
status

### Active session

Home becomes a resume surface:

**Continue recording**

Show: - job name - current step - elapsed/remaining time - session
progress - Resume CTA

### No suitable work

Do not show an empty generic dashboard.

Explain: - current language coverage is full - when to check again -
other eligible languages/formats if applicable

## Jobs information architecture

Header: - Find work - Search - filters

Tabs:

-   All
-   Lines
-   Scenario
-   Interview
-   Room

Each job row/card communicates:

-   title
-   short situation
-   language
-   format
-   duration
-   base/total pay
-   coverage multiplier
-   save
-   entry action

Avoid "Top paying" ranking.

Coverage information is useful because it explains why similar jobs can
have different total payouts.

## Job Detail

The contributor should be able to answer:

1.  What will I do?
2.  How long will it take?
3.  What language is required?
4.  How much will I earn?
5.  Why is the amount what it is?
6.  What do I need?
7.  Can I hear an example?
8.  What happens after submission?

Primary CTA: **Start this job**

## Studio

Studio is the most expressive part of the product.

It can use the strongest waveform treatment.

Possible formats:

-   LINES --- read speech
-   SCENARIO --- guided realistic situation
-   INTERVIEW --- respond to a prerecorded stem
-   ROOM --- one-take environment recording

Important terminology:

"Interview" is a recording format, not a job-application interview.

The interface must never become a chat UI.

## Review

Show:

-   number of clips ready
-   individual clip status
-   playback
-   retake
-   submit

## Repair

Show:

-   passed count
-   failed count
-   exact issue
-   why it matters
-   short repair instruction
-   retake
-   later
-   appeal where appropriate

## Wallet

Information hierarchy:

1.  Available
2.  In review
3.  This week
4.  Total
5.  Transaction ledger
6.  Withdrawal

Withdrawal uses an exact-gap model.

Example: If available balance is ₹82 and the threshold is ₹100:

**₹18 more to withdraw**

Do not invent reserve or streak mechanics.

## Profile / Standing

Show:

-   standing
-   reliability
-   unlocked opportunities
-   format × language craft
-   coverage context
-   data rights / data vault
-   revoke/delete pathway

Standing is an access/trust mechanism, not a gamified score.
