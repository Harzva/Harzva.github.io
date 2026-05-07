# AGENTS.md

This file defines the working rules for Codex and any local agent working on this repository.
It is not a normal note. Treat it as project-level operating instructions.

## Project Boundary

This repository is the full portfolio and article site for Harzva.

- `Harzva.github.io` is responsible for the complete portfolio, papers, project pages, article collections, images, and public GitHub Pages site.
- `Harzva` is responsible for the GitHub profile entry card and should stay lightweight.
- Do not merge the two responsibilities unless the user explicitly asks.

## Core Rule

The user's ideas, article structures, personal positioning, 3E framework, two-sided value theory, and named concepts are source material.
Do not delete, rename, simplify away, or rewrite them into a different meaning just because the wording looks rough.

When improving text, preserve the original viewpoint first. Polish only expression, structure, and readability.

## Hard Prohibitions

Do not do any of the following without explicit user approval:

- Do not delete user-provided concepts, sections, article entries, images, or research notes.
- Do not remove or replace the 3E framework.
- Do not change `Easy to See`, `Easy to Use`, `Easy to Grace` into another 3E definition.
- Do not remove the two-sided value theory.
- Do not write that execution is unimportant. The intended meaning is: coding technology is no longer the main moat, but execution still matters.
- Do not replace the user's first-person positioning with third-person analysis unless requested.
- Do not make the writing sound overly polished, inflated, or generic.
- Do not add obvious AI-style metaphors, hype, or exaggerated claims.
- Do not rename `APP 即上下文工程（结构化更强的上下文）` back to a shorter or weaker title.
- Do not overwrite local assets with generated images unless the user approves the replacement.
- Do not remove article detail pages, analysis pages, or image galleries while refactoring.
- Do not commit build output or repeated large binary assets unless the repository explicitly needs them for GitHub Pages.

If a change might affect any of the above, stop and explain the risk before editing.

## Required Preservation Checklist

Before finishing any content, article, or page refactor, verify these items still exist if they existed before the edit:

- Agentic engineering thinking section
- `Token to Product`
- `APP 即上下文工程（结构化更强的上下文）`
- `Build to Understand`
- `Process is Content`
- 3E framework: `Easy to See`, `Easy to Use`, `Easy to Grace`
- Two-sided value theory
- Article analysis collection
- Paper detail pages and analysis sections
- Personal intro/current state section
- Portrait and anime character gallery, if present

## Local Commit Rule

Commit locally after each meaningful safe milestone.
This prevents accidental loss of user ideas during refactors.

Use small commits with clear messages, for example:

- `chore: preserve agentic engineering rules`
- `feat: add article analysis detail`
- `fix: restore missing 3e section`

Never use destructive git commands such as `git reset --hard` or `git checkout --` unless the user explicitly asks.

## Agent Roles

### Frontend Agent

Responsible for React components, layout, CSS, responsive behavior, and local build verification.

Rules:

- Read existing components before editing.
- Keep the visual style consistent with the current site.
- Do not remove content while changing layout.
- Run `npm run build` after meaningful UI changes.
- Check that article cards, detail pages, images, and galleries still render.

### Content Agent

Responsible for article text, page copy, README-like content, and personal positioning.

Rules:

- Preserve the user's original viewpoint.
- Prefer direct, grounded Chinese.
- Keep first-person wording for personal state.
- Remove AI flavor by cutting empty praise, broad claims, and excessive metaphors.
- Do not reduce long-form analysis into short summaries unless the user asks.
- When uncertain, keep more of the user's original material rather than deleting it.

### Research Agent

Responsible for papers, project analysis, case analysis, citations, and source-backed claims.

Rules:

- Separate facts, interpretation, and action suggestions.
- Keep concrete links and source names when available.
- Do not invent paper details, project stars, or performance claims.
- If current facts matter, verify before editing.

### Asset Agent

Responsible for images, generated covers, portrait assets, article figures, and local static resources.

Rules:

- Prefer reusing existing local images when the user points to a folder.
- Keep source images in stable public paths before referencing them in React.
- Do not replace user-selected images with new generated images unless requested.
- For narrow mobile images, use paired layouts when appropriate.
- Verify referenced paths are real and loadable.

### Git Agent

Responsible for status checks, local commits, and pushes when requested.

Rules:

- Always inspect `git status` before committing.
- Commit only relevant files.
- Do not push unless the user asks or the current task explicitly requires publishing.
- Mention the commit hash after committing.

## Writing Style

Use clear, restrained Chinese.
Avoid empty slogans.
Avoid making every paragraph sound like a marketing headline.
Keep the user's thinking visible, including rough but important original observations.

Preferred wording:

- "我现在更接近..."
- "我习惯..."
- "我正在..."
- "coding 技术不再是主要护城河，但执行力仍然重要。"

Avoid wording:

- "一针见血"
- "终极定义"
- "极具洞见"
- "颠覆式"
- "爆火" unless the user explicitly asks to use it

## Verification

For code or frontend changes:

1. Run `npm run build`.
2. Check changed page routes when practical.
3. Check that important article and thought entries are still present.
4. Commit locally after the milestone.

For content-only changes:

1. Search for protected concepts before and after editing.
2. Confirm no protected sections disappeared.
3. Commit locally after the milestone.
