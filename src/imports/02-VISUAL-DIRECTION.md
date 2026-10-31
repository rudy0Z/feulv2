# Feul --- Visual Direction

## Desired feeling

Crisp. Premium. Modern. Editorial. Technical without looking like an AI
dashboard. Human without becoming playful. Buildable.

The visual target is closer to a refined consumer app than a generic
SaaS dashboard.

## Important rejection

Do NOT use the previous warm/terracotta visual direction as the primary
brand language.

Avoid: - warm beige-heavy UI - terracotta as dominant accent -
fintech-looking cards - excessive pastel surfaces - decorative blobs -
generic AI gradients - glassmorphism everywhere - neumorphism - 3D clay
assets - neon cyberpunk styling - Dribbble-style visual effects

## Material 3 foundation

Use Material 3 as the structural foundation:

-   semantic color roles
-   typography roles
-   component behavior
-   accessible contrast
-   buttons
-   navigation
-   chips
-   cards
-   dialogs
-   bottom sheets
-   text fields
-   progress
-   snackbars
-   state handling
-   adaptive layout

Do not make the product look like an unmodified Material 3 demo.

## Feul brand layer

Feul should have a distinctive visual identity built around **voice and
acoustic data**.

Suggested foundation:

### Neutrals

-   Background: cool near-white
-   Surface: white
-   Primary text: near-black
-   Secondary text: cool gray
-   Dividers: very subtle gray

### Accent

Explore an electric violet / periwinkle family.

Example starting values:

-   Violet: `#6C63FF`
-   Periwinkle: `#8FA7FF`
-   Deep violet: `#5147D9`

These are starting points, not immutable values.

### Semantic colors

-   Success: green
-   Warning/review: amber
-   Error: red

Do not let semantic colors become decorative.

## Gradient rule

Gradient is a **voice interaction signal**, not a background decoration.

Use gradient primarily for:

-   active waveform
-   recording
-   audio playback
-   selected audio states
-   important voice-related progress
-   primary action when appropriate

Normal marketplace browsing should remain mostly neutral.

## Waveform identity

Waveform is the key Feul visual primitive.

Five registers:

### 1. Live

Real-time recording waveform.

### 2. Scrub

Audio playback timeline.

### 3. Thumb

Tiny waveform attached to compact audio/task metadata.

### 4. Separator

Subtle waveform mark used as a visual divider.

### 5. Lanes / Voiceprint

Larger visual used for Studio or meaningful audio progress.

Rules:

-   Never use waveform as random decoration.
-   Waveform should communicate audio, recording, playback, or progress.
-   Prefer simple geometry that can be implemented with SVG/canvas.
-   Avoid photorealistic waveform effects.
-   Avoid excessive glow.

## Typography

Use a modern sans-serif system with strong multilingual support.

Existing system direction: - Anek Latin - Anek Devanagari - Anek Tamil -
system-ui fallback

Use a restrained type hierarchy.

Suggested scale:

`11 / 12 / 14 / 16 / 18 / 20 / 24 / 30 / 38 / 48 / 64`

Body text should generally not fall below 16px in primary flows.

Use tabular numerals for money, duration, and measurable data.

## Shape

Use a restrained radius system:

-   small: 8
-   medium: 14
-   large: 24
-   pill: 999

Do not make every element a pill.

## Elevation

Use:

-   flat
-   subtle surface elevation
-   focused elevation
-   rare glow

No permanent floating/glowing cards.

## Layout philosophy

Take the smooth spatial rhythm from the provided references.

Prioritize:

-   large breathing areas
-   strong alignment
-   clear sections
-   controlled density
-   repeated spacing rhythm
-   few high-value modules

Do not create a grid of four random feature cards just to fill space.

## Reference interpretation

### Speaksy reference

Take: - three-item bottom navigation - profile at top - restrained
visual language - strong typography - simple screen composition

Do not copy its translation product or illustrations.

### TaskMind reference

Take: - clean task tabs - straightforward information hierarchy -
scannable task lists - controlled cards

Do not copy its AI assistant concept.

### Food app reference

Take: - smooth spatial rhythm - section composition - calm browsing -
strong visual breathing room

Do not copy its content or color language.

## Buildability rule

Every visual treatment must have a plausible implementation in:

-   Figma
-   React / React Native
-   standard SVG
-   CSS
-   Material 3 components

If an effect would be difficult to implement reliably, remove it.
