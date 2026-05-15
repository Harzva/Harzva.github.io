# Harzva.github.io Design Contract

This site is the full public portfolio for Harzva. It should read like an open-source agent infrastructure workspace, not a generic personal landing page.

## Audience

- Primary: Agent / open-source visitors who want to understand what Harzva builds and where to try it.
- Secondary: research readers, collaborators, and hiring readers who need credible proof through papers, links, and maintained projects.

## Positioning

- Lead with `Make Coding Agents Cheaper`.
- Connect that line to concrete work: prompt-cache reuse, trace evaluation, AgentWorkOS, RepoAtlas, hooks, skills, mobile coding workspace, and GitHub Pages hubs.
- Keep research visible as credibility, especially Few-Shot, Zero-Shot, VLM, and CVPR 2025 work.

## Visual Language

- Tone: restrained, technical, open-source, and readable.
- Layout: dense but calm. Use grids, matrices, proof cards, and direct links before long prose.
- Corners: 8px or less.
- Typography: clear Chinese-first sans stack; avoid oversized text inside compact cards.
- Color: mostly white / near-black with teal and slate accents. Do not drift into one-color purple or decorative gradient-heavy styling.
- Media: use existing real site assets, paper figures, project SVGs, and portrait assets. Do not replace user-selected assets without explicit approval.

## Component Rules

- First viewport must show the core identity, current focus, and actions to project matrix / research / GitHub profile.
- Project cards should show capability layer, repository link, tags, and proof. Do not hard-code star or fork counts; use dynamic shields badges or omit counts.
- Profile / current-state content should stay first-person and grounded.
- Preserve the protected thought system: Agentic Engineering, Token to Product, APP 即上下文工程（结构化更强的上下文）, Build to Understand, Process is Content, 3E, and 两端价值理论.

## Verification

- Build with `npm run build`.
- Check desktop and mobile first screen, project matrix, paper detail route, article detail route, and thought detail route.
- Search for protected concepts before finishing content or layout refactors.
