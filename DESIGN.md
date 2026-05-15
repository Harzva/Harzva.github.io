# Harzva.github.io Design Contract

This site is the full public portfolio for Harzva. It should read like an open-source agent infrastructure workspace, not a generic personal landing page.

## Source Inspiration

- Use the Open Design / Stitch style workflow: pick a named direction, bind concrete tokens, build against the contract, then visually verify.
- Direction chosen for this site: `tech-utility` with a small amount of `modern-minimal`.
- Source references: GitHub, Datadog, Sentry, Linear, Vercel, and the open-design direction-library pattern.

## Audience

- Primary: Agent / open-source visitors who want to understand what Harzva builds and where to try it.
- Secondary: research readers, collaborators, and hiring readers who need credible proof through papers, links, and maintained projects.

## Positioning

- Lead with `Make Agents Cheaper`.
- Connect that line to concrete work: prompt-cache reuse, trace evaluation, AgentWorkOS, RepoAtlas, hooks, skills, mobile coding workspace, and GitHub Pages hubs.
- Keep research visible as credibility, especially Few-Shot, Zero-Shot, VLM, and CVPR 2025 work.

## Tokens

```css
:root {
  --bg: oklch(98% 0.005 250);
  --surface: oklch(100% 0 0);
  --surface-2: oklch(96% 0.006 250);
  --fg: oklch(22% 0.02 240);
  --muted: oklch(50% 0.018 240);
  --border: oklch(90% 0.008 240);
  --accent: oklch(58% 0.16 145);
  --accent-2: oklch(58% 0.18 255);
  --ink: #0d1117;
  --ink-2: #151b23;
  --font-display: "Noto Sans SC", "Segoe UI Variable", system-ui, sans-serif;
  --font-body: "Noto Sans SC", "Segoe UI Variable", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", "Cascadia Code", ui-monospace, monospace;
}
```

Do not introduce new dominant colors. Add one local signal color only when a component genuinely needs status meaning.

## Visual Language

- Tone: restrained, technical, open-source, and readable.
- Layout: dense but calm. Use grids, matrices, proof cards, and direct links before long prose.
- Corners: 8px or less.
- Typography: Chinese-first sans stack, mono metadata and numerics, no negative letter spacing.
- Background: neutral technical grid, not decorative orbs, bokeh, beige wash, or generic AI gradients.
- Depth: hairline borders first. Shadows only for modals/dropdowns; ordinary cards stay flat.
- Media: use existing real site assets, paper figures, project SVGs, and portrait assets. Do not replace user-selected assets without explicit approval.

## Component Rules

- First viewport must show the core identity, current focus, and actions to project matrix / research / GitHub profile.
- Project cards should show capability layer, repository link, tags, and proof. Do not hard-code star or fork counts; use dynamic shields badges or omit counts.
- Use mono for numeric proof (`08`, `11`, dates, repository stats labels), hashes, IDs, and metadata.
- Profile / current-state content should stay first-person and grounded.
- Preserve the protected thought system: Agentic Engineering, Token to Product, APP 即上下文工程（结构化更强的上下文）, Build to Understand, Process is Content, 3E, and 两端价值理论.

## Verification

- Build with `npm run build`.
- Check desktop and mobile first screen, project matrix, paper detail route, article detail route, and thought detail route.
- Search for protected concepts before finishing content or layout refactors.
- If a screenshot reads as a marketing template instead of an open-source tool surface, tighten spacing, reduce decoration, and expose more concrete proof.
