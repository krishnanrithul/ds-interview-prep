# 07. Name and icon: Gradient Ascent

**Decision.** The app is now called **Gradient Ascent**. In ML, gradient descent minimizes a loss; gradient ascent climbs toward a maximum, which is the point of studying. It signals data science and learning on its own, and the tagline carries "interview prep".
Description used in the page metadata: "Data science interview prep that pushes back with follow-ups, then spaces out what you got wrong."

## Icon
A spruce rounded square with five cream data points and a thick marker-yellow fitted line climbing up and to the right, ending in an arrowhead. The yellow is the same marker stroke used under every question. It reads at 16 px as a rising arrow.
- `public/favicon.svg`: standalone favicon.
- `src/components/Logo.jsx`: the same drawing as a React component using the theme colors, used in the header. **Keep the two in sync.**

## What changed
| File | Change |
|------|--------|
| `index.html` | Title "Gradient Ascent", description and theme-color meta tags, favicon points to `/favicon.svg` |
| `src/App.jsx` | Header uses `Logo` and the serif wordmark "Gradient Ascent" (wordmark hidden below the `md` breakpoint, as before) |
| `README.md` | New title and one-paragraph description, with a note that the repository and data format keep the old name |

## Deliberately not renamed
- The GitHub repository (`ds-interview-prep`), the backup format name `DSInterviewPrep`, and all localStorage keys. Renaming them would break saved progress and imports of old backups.

## Name availability (checked by web search only)
Other things already use the name: the **Gradient Ascent** ML newsletter (which has written about ML interviews), a podcast of the same name, and a company page on LinkedIn. That is fine for a personal or portfolio project. Before a public launch, check trademarks and domains, and consider a modifier such as "Gradient Ascent Prep".

## Open
- No app-store or share-card images yet (Open Graph image, 512 px PNG icon). They can be exported from the SVG.
- Remaining mentions of "DS Interview Prep" in older docs and `BUILD_PLAN.md` describe history and were left as is.
