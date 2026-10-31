# Feul --- Design System Foundation

## System strategy

Build the product in two layers.

### Layer 1 --- Material 3 foundation

Create the complete functional component system first.

### Layer 2 --- Feul brand layer

Apply the acoustic visual identity, typography, color, waveform, and
motion language.

Do not create two separate design systems.

## Color tokens

Create semantic tokens, not raw color usage.

### Surface

-   surface
-   surface-container
-   surface-container-low
-   surface-container-high
-   surface-variant
-   inverse-surface

### Content

-   on-surface
-   on-surface-variant
-   outline
-   outline-variant

### Brand

-   primary
-   on-primary
-   primary-container
-   on-primary-container

### Accent

-   audio
-   audio-container
-   on-audio

### Semantic

-   success
-   warning
-   error
-   info

## Typography roles

Create semantic text styles:

-   display-large
-   display-medium
-   headline-large
-   headline-medium
-   title-large
-   title-medium
-   title-small
-   body-large
-   body-medium
-   body-small
-   label-large
-   label-medium
-   label-small
-   numeric-display
-   numeric-data

## Spacing

Use a consistent 4px base.

Primary spacing values:

`4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64`

## Components

Build reusable components before screens.

### Navigation

-   Top app bar
-   Bottom navigation
-   Avatar
-   Notification button

### Buttons

-   Filled
-   Tonal
-   Outlined
-   Text
-   Icon
-   Full-width primary CTA

States: - default - pressed - focused - disabled - loading

### Task components

-   Task row
-   Task card
-   Task tabs
-   Language metadata
-   Format metadata
-   Duration metadata
-   Earnings
-   Coverage multiplier
-   Save action

### Audio

-   Waveform thumb
-   Audio player
-   Playback control
-   Live waveform
-   Recording indicator
-   Audio progress
-   Audio status

### Money

-   Earnings module
-   Balance
-   Ledger row
-   Withdrawal CTA
-   Payout status

### Feedback

-   Success
-   Warning
-   Error
-   In review
-   Quality issue
-   Repair state

## States are mandatory

Every interactive component should have:

-   default
-   hover where applicable
-   pressed
-   focused
-   disabled
-   loading
-   error where applicable

Every product flow should have:

-   empty
-   loading
-   success
-   failure
-   interrupted
-   permission denied
-   offline where relevant

## Responsive behavior

Primary target: - Android mobile - approximately 360--430px wide

Must remain usable at: - 320px - 150% text scaling - low-end Android
hardware

Avoid: - backdrop blur as a requirement - expensive per-frame effects -
animation that blocks usability
