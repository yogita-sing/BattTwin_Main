# UI Redesign: ZEN Electric Lime & Dark Obsidian with Parallax Scrolling

Transform the platform's visual identity to match the high-end creative agency design language from the reference screenshot (**ZEN**): rich dark-obsidian surfaces, vivid electric lime (`#B8FF24`) typography and accents, organic emerald glass textures, and a smooth **GSAP + Lenis** parallax scrolling hero banner seamlessly opening into the battery design platform.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following decisions have been confirmed through your clarifying responses:

- **Confirmed Decision 1 (Scope & Aesthetic Integration)**: The BattTwin platform will be overhauled with the **ZEN electric lime and dark obsidian aesthetic**—delivering the exact color palette, custom block branding, pill action controls, and high-contrast urban/technical card styling from the image while retaining all engineering capabilities.
- **Confirmed Decision 2 (Parallax Placement)**: The **GSAP + Lenis Parallax Scrolling component** will be positioned as an interactive hero showcase banner at the top of the application, welcoming users with depth-layered visuals before transitioning smoothly into the studio controls.
- **Confirmed Decision 3 (Color Palette)**: Deep charcoal-obsidian backdrop (`#080b08`), panel surfaces (`#111612`), hairline foliage borders (`#1e2920`), and vivid electric lime (`#B8FF24`) text highlights, glowing indicators, and pill CTA buttons.
- **Component Folder Path & Architectural Rationale**:
  - The default path for shadcn components is **`/src/components/ui`** (aliased as `@/components/ui/*`).
  - *Why this folder is essential*: Isolating atomic UI primitives (like `parallax-scrolling.tsx`, buttons, dialogs, sliders) under `/components/ui` prevents coupling with domain-specific feature logic (`visualizer3d/`, `engineer_mode/`, `student_mode/`). It guarantees consistent design tokens, path alias compatibility with `@/*`, and effortless integration with shadcn CLI and community registries.

---

## 1. Overview & Core Concept

- **What It Does**: Upgrades the entire user experience with an editorial, ultra-modern aesthetic inspired by modern creative agencies. It greets users with a parallax multi-layer depth canvas powered by GSAP and Lenis smooth scrolling, featuring the headline `"IDEAS BUILT TO MOVE."` with electric lime branding, then opens directly into the live digital battery twin platform.
- **Target Persona**: Battery engineers, founders, and students who demand both rigorous engineering depth and a visually stunning, non-AI-generated design presentation.
- **Key Value**: Replaces generic dark SaaS tropes with an authoritative, high-fashion technical identity that elevates the platform's presentation value for demos, pitches, and reviews.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Parallax Hero Entry**:
   - The user arrives at the top of the page greeted by the **ZEN-inspired Parallax Header**.
   - As the user scrolls, **Lenis smooth scroll** drives the **GSAP ScrollTrigger timeline**, moving visual layers at distinct velocity percentages (`70%`, `55%`, `40%`, `10%`) to create visceral 3D spatial depth.
   - The central typography displays the custom block glyph logo and the headline:  
     `<span class="text-[#B8FF24]">IDEAS</span> BUILT TO MOVE.`
   - Center cards feature the 3 geometric cut-outs with monochromatic green-filtered architectural and technical photography.
   - A bold electric-lime pill button (`Start Design Twin ↗`) smoothly anchors into the interactive studio below.
2. **Seamless Transition to Studio Dashboard**:
   - The parallax header gracefully fades via a vertical gradient into the deep obsidian studio workspace.
   - The navigation bar floats with a blur backdrop, showing the block brand mark, navigation anchors, and a neon-bordered pill button (`LET'S TALK ↗` / `EXPORT DOSSIER ↗`).
3. **Restyled BattTwin Engineering Workspace**:
   - **Controls & Sliders**: Recalibrated with electric lime track fills, custom monospace readouts, and foliage borders.
   - **3D & 2D Visualizers**: 3D Three.js pack tuned with dark emerald glass shading, cyan-to-lime-to-amber-to-crimson heat maps, and high-contrast wireframe ladder.
   - **Veto & Compliance**: High-contrast neon green for compliant states and vivid crimson for safety veto alerts.

### Visual Identity & Theme Tokens

- **Dominant Background (60%)**: Deep obsidian with chlorophyll undertones (`#080B08` and `#0C110D`).
- **Structural Surfaces (30%)**: Technical charcoal panels (`#111612`), hairline borders (`#1E2A20`), and subtle drop-shadows.
- **Semantic Accents (10%)**:
  - *Primary Accent*: Electric Acid Lime (`#B8FF24` / `hsl(80, 100%, 57%)`) for primary CTAs, active highlights, and key brand titles.
  - *Compliant State*: Emerald Leaf (`#10B981`).
  - *Warning / Spread*: Warm Amber (`#F59E0B`).
  - *Safety Veto / Breach*: Signal Crimson (`#EF4444`).
- **Typography**:
  - *Display / Hero*: Bold neo-grotesque `Plus Jakarta Sans` with heavy weights (`font-extrabold` / `tracking-tight`).
  - *Prose*: Crisp clean `Plus Jakarta Sans` in muted sage gray (`#8A9A8C`).
  - *Data & Telemetry*: High-contrast `JetBrains Mono` with `tabular-nums`.

---

## 3. Key Product Decisions & Trade-Offs

- **NPM Package Installations (`gsap`, `@studio-freight/lenis`)**:
  - *Chosen Approach*: Install `gsap` and `@studio-freight/lenis` via npm and configure standard TypeScript declarations.
  - *Why*: Provides hardware-accelerated smooth scrolling and precise multi-layer scrubbed timeline control without lag or jerky native scroll behavior.
- **Path Alias Configuration (`@/*`)**:
  - *Chosen Approach*: Add path alias `@/*` -> `./src/*` in `tsconfig.json` and `vite.config.ts`.
  - *Why*: Standardizes shadcn component imports such as `@/components/ui/parallax-scrolling`, matching official shadcn ecosystem conventions.
- **Dual-Mode Preservation**:
  - *Chosen Approach*: Maintain full dual-mode operation (Student Mode & Engineer Mode), the 3D Three.js pack visualizer, 2D circuit schematic, FMEA fault injector, and Assumption Registry while skinning them uniformly in the new ZEN aesthetic.

---

## 4. Technical Architecture & Component Structure

```
┌────────────────────────────────────────────────────────────────────────┐
│ ZEN-INSPIRED PARALLAX HERO SECTION                                    │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │ Top Nav: Brand "ZEN / BATTTWIN", Links, Pill "LET'S TALK ↗"       │ │
│ ├────────────────────────────────────────────────────────────────────┤ │
│ │ GSAP + Lenis Parallax Layers                                       │ │
│ │ • Layer 1: Background Depth Atmosphere (y: 70%)                    │ │
│ │ • Layer 2: 3 Geometric Photo Cut-out Cards (y: 55%)                │ │
│ │ • Layer 3: Bold Headline "IDEAS BUILT TO MOVE." (y: 40%)           │ │
│ │ • Layer 4: Foreground Glass Sphere / Floating Accents (y: 10%)     │ │
│ │ • Subtitle: "From strategy to content, we build digital twins..."  │ │
│ │ • CTA: Electric Lime Pill Button "Start Design Twin ↗"             │ │
│ └────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
                                   │ (Smooth Gradient Fade)
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│ RESTYLED BATTTWIN ENGINEERING STUDIO                                   │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │ Header: Mode Switcher, Commit Hash, Safety Veto Badge              │ │
│ │ Hierarchy Switcher: 4S2P Module vs 12S2P Light-EV Pack             │ │
│ ├────────────────────────────────────────────────────────────────────┤ │
│ │ Parameter Sliders (Electric Lime Accent Tracks)                    │ │
│ ├──────────────────────────────────┬─────────────────────────────────┤ │
│ │ 3D Canvas / 2D Circuit Ladder    │ Live Cell Inspector             │ │
│ ├──────────────────────────────────┴─────────────────────────────────┤ │
│ │ Mode Panels (Student Discovery Lab / Engineer Studio with 8 Tabs)  │ │
│ └────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

### Proposed Changes

1. **Dependencies**:
   - Install `gsap` and `@studio-freight/lenis`.
   - Install dev types if needed.
2. **Configuration**:
   - Configure path alias `@/*` in `vite.config.ts` and `tsconfig.json`.
3. **Styles (`src/style.css`)**:
   - Add styles for `.parallax`, `.parallax__header`, `.parallax__layers`, `.parallax__layer-img`, and Lenis smooth scroll classes.
   - Define custom CSS variables for the electric lime palette (`--primary: #B8FF24; --background: #080B08;`).
4. **Shadcn Primitive (`src/components/ui/parallax-scrolling.tsx`)**:
   - Implement the parallax scrolling component using GSAP `ScrollTrigger` and Lenis.
5. **Hero Section (`src/components/common/ZenHero.tsx`)**:
   - The iconic three-card layout from the screenshot with geometric overlay lines, electric-lime typography `"IDEAS BUILT TO MOVE."`, and direct scroll-into-studio button.
6. **Platform Restyling**:
   - Update `Header.tsx`, `HierarchySwitcher.tsx`, `ParameterControls.tsx`, `CircuitSchematic2D.tsx`, `CellInspector.tsx`, and `EngineerModePanel.tsx` with the electric lime (`#B8FF24`) on dark obsidian (`#080B08` / `#111612`) aesthetic.
