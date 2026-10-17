# Portfolio update notes (2026-10-17)

## Goal
Refresh https://harzva.github.io/ featured project content from Machine Hub priority list, then publish via GitHub Pages workflow.

## Source of truth
- Machine Hub cross-machine inventory (2026-10-16): Mini Ultra canonical
- Local inventory refresh already present in `src/data/portfolioInventory.json` (`generatedAt: 2026-10-16T07:26:01Z`, matrixCount 60)

## Featured / showcase priority applied
1. learn-likecc
2. Agent-Job-Interview
3. AgentWorkOS + DeepSeek Harness / dsh-* (carousel entry via dsh-superterminal Pages)
4. mobilecore (+ mobile-model-playground mentioned in copy)
5. ChinaAI-Roadmaps + awesome-ai-paper-notes (notes called out in focus copy)
6. Keep research: LDB + LDC/VLM papers block
7. Skip Just-resume seed / huge wemedia assets as featured leads

## Files changed
- `src/main.jsx`
  - `projects` carousel: learn-likecc → Agent-Job-Interview → AgentWorkOS → deepseek-harness → mobilecore → ChinaAI-Roadmaps → LDB → papers
  - `focusCards` + hero lead + focus-section blurb aligned to the same priority
  - `showcaseSpecs` / `showcaseKeywords` / `appOutputItems` updated
  - Protected concepts kept (3E, Token to Product, APP 即上下文工程, Build to Understand, Process is Content, 两端价值, Agentic engineering)
- `src/data/portfolioInventory.json` — previously refreshed inventory (Oct 16) included in this publish
- `PORTFOLIO_UPDATE_NOTES.md` — this file

## Publish path
- `npm run build` locally for verification
- Push `master` → `.github/workflows/deploy.yml` builds and deploys GitHub Pages

## Intentionally not featured as leads
- Just-resume / empty resume seeds
- Large `09-wemedia` asset trees
- Stale Project2AgentWorkOS / codex-hooks cards (replaced by AgentWorkOS + DSH)
