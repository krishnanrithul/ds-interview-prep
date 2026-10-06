# Rename to Saddle Point (doc 20)

**Date**: 2026-10-05

Gradient Ascent is already the name of an ML newsletter (Art of Saience), another Substack and a podcast, so search results and the audience would overlap. After comparing alternatives (Steepest Ascent, Peak Likelihood, Max Margin, Residual, Convergence and others), Rithul chose **Saddle Point**.

**Why it fits:** a saddle point is where the gradient is flat but you're at neither a peak nor a valley, so training looks stuck without being done. That's the plateau the app helps you break through. In climbing, a saddle is the pass between two peaks, the route to the summit.

**Changed:** the page title (`index.html`), the header name (`src/App.jsx`), the logo and favicon labels (`src/components/Logo.jsx`, `public/favicon.svg`), `README.md` and `THINGS_TO_DO.md`.
**Unchanged on purpose:** the repo name, the backup format name `DSInterviewPrep` and all localStorage keys, so existing progress and backups keep working. Earlier docs keep the old name as history.

**Open:**
- A trademark search (USPTO, IP India) and a domain.
- ~~A new mark~~ Done 2026-10-06: the mountain pass (see below).
- A tagline, e.g. "Stuck at a saddle point? Practice your way out."

## Update: new mark (2026-10-06)
Three directions were drawn in the brand colors and compared at full, header and tab size, in light and dark: A, a saddle surface (a wireframe hyperbolic paraboloid); B, a mountain pass; C, a contour map whose line crosses itself at the saddle. Rithul chose **B**: two peaks with the saddle point as a yellow dot in the pass, and a dotted yellow path climbing to it. It was the clearest at small sizes and keeps the climbing feel of the old name.
- `src/components/Logo.jsx`: full mark (peaks, dotted path, dot), theme colors via `--ink`, `--ink-foreground`, `--marker`.
- `public/favicon.svg`: the bolder small version (thicker peaks, bigger dot, no path) so it reads at 16 px.
- Still to make for the PWA and iOS: PNG icons (180, 192, 512 and 1024 px) from the same artwork.
