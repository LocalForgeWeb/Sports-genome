# Gym Optimizer — Design Exploration

## Three Directions

### 1. Kinetic Field Manual
**Very Brief Intro:** A confident training console inspired by collegiate strength rooms, sports-science charts, and annotated field guides. It makes complex programming choices feel readable, athletic, and decisive.

**Probability:** 0.047

### 2. Anatomical Atelier
**Very Brief Intro:** A quiet editorial interface that treats programming as a tailored craft, pairing pale paper surfaces with close anatomical study. It feels considered and premium rather than maximal.

**Probability:** 0.083

### 3. Trackside Signal
**Very Brief Intro:** A high-contrast performance dashboard inspired by track timing boards and competition bibs. It uses brisk type, numbered modules, and electric highlights to evoke focused preparation.

**Probability:** 0.062

---

## Chosen Direction: Kinetic Field Manual

### Design Movement

**Modern sports-science editorialism**, merging the tactile clarity of an annotated field guide with the compositional restraint of professional athletic-performance dashboards. The app will avoid generic fitness-app clichés and present each recommendation as transparent, coach-like reasoning.

### Core Principles

1. **Actionable hierarchy:** Today’s training decision always takes visual precedence over supporting information.
2. **Visible logic:** Scores, primary movers, sport carryover, and movement patterns stay explicit so users can understand why an exercise appears.
3. **Athletic restraint:** Dense capability without visual noise—precise dividers, modular cards, and calm surfaces instead of decorative clutter.
4. **Field-note character:** Athletic information is marked up with numbered labels, technical tags, and warm data accents.

### Color Philosophy

The foundational surface is **bone-paper**, suggesting a well-used training notebook rather than a sterile dashboard. Deep **ink navy** provides authority and endurance, while **signal vermilion** identifies readiness, priority, and high sport transfer. A disciplined olive-grey supports recovery and secondary information. This creates energy without resorting to dark neon or generic gradients.

### Layout Paradigm

Use an **asymmetric coach’s clipboard** structure: a fixed dark rail for route identity and workflow context, then a wide work canvas with an oversized decision panel anchored left and narrower, vertically stacked intelligence panels at right. Catalog pages use a split-review layout—exercise evidence and an interactive body map are displayed as two equal “inspection bays,” rather than a conventional centered dashboard grid.

### Signature Elements

1. **Signal grades:** Square, oversized F–SS grade stamps in vermilion, amber, olive, or navy—used consistently for sport transfer and target quality.
2. **Muscle ink map:** A two-view, vector body silhouette where activated regions appear as warm, semi-transparent anatomical ink.
3. **Field labels:** Small uppercase micro-labels, hairline rules, and compact index numbers that give every content block a credible training-manual rhythm.

### Interaction Philosophy

Interactions should feel like a coach revealing the next piece of a plan: selection states use a clean sliding rule and a single warm accent, while details expand only when requested. Tooltips provide the technical explanation behind a score; the body map makes muscles clickable to turn abstract training language into concrete information. No gratuitous motion or gamified distraction.

### Animation

Exercise details enter with a 180–240ms opacity and 8px upward transform using `cubic-bezier(0.23, 1, 0.32, 1)`. The selected navigation indicator and muscle activation fills transition in 160–220ms. Grade stamps use a one-time 0.96-to-1 scale settle when a new exercise is opened. Lists should not continuously animate; respect `prefers-reduced-motion` by removing all nonessential movement.

### Typography System

**Barlow Condensed** is the display face for highly legible athletic headlines, grades, split names, and section numbers. **DM Sans** handles all body copy, controls, and metric descriptions with a modern technical feel. Display headlines stay tightly tracked and short; labels are uppercase with positive tracking; workout prescriptions use tabular numerals where available.

### Brand Essence

**Gym Optimizer is the sport-aware training atlas for lifters who want every exercise to earn its place.**

Personality: **clear, disciplined, pragmatic.**

### Brand Voice

Headlines are direct and performance-literate. CTAs describe the immediate training action. Microcopy explains the logic in plain training language, never generic marketing filler.

Example lines: “Build a session that carries over.”

Example lines: “Choose the split. We’ll show the trade-offs.”

### Wordmark & Logo

The mark is an **interlocked “GO” motion glyph**: two offset chevrons form a compact forward-moving, body-aware symbol. It uses no lettering in its rendered logo form, remains recognizable at favicon size, and is paired with a condensed wordmark in the interface.

### Signature Brand Color

**Signal Vermilion — `#E4512E`**. It is reserved for workout priority, activated muscles, and highest-value performance signals.

## Style Decisions

- The first fold prioritizes the current sport, training intent, top fit grade, and session brief before any broader positioning language.
- Every major content block uses the field-manual grammar: an index number, uppercase technical label, hairline rule, and a visible logic cue.
- Hero imagery functions as documentary training evidence and is always paired with technical decision overlays rather than used as generic fitness atmosphere.
- Signal Vermilion remains the sole high-energy accent. The athlete-and-coach workspace uses deep ink, bone surfaces, and restrained olive-grey for all supporting states; electric lime is excluded.
- The command screen behaves as a coaching decision console: sport profile, selected movement, fit grade, rationale, and session priorities visibly outweigh any broad positioning copy.
- The product name remains **Gym Optimizer** on every screen, paired with the existing GO motion glyph. The requested blue update applies to navigation and onboarding surfaces while retaining the sport-aware training-atlas voice.
- The blue workflow shell is balanced with vermilion for decisive training actions, priority cues, and grade-like signal states. Onboarding uses evidence annotations and field-manual tags so setup reads as a coaching brief rather than generic account configuration.
