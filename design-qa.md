# Scudo Logo Rebuild Design QA

## Evidence

- Source visual truth: `C:\Users\Hacker\AppData\Local\Temp\codex-clipboard-c0018b05-6469-4c7b-be7b-2783f93e7946.png`
- Earlier failed implementation: `C:\Users\Hacker\AppData\Local\Temp\codex-clipboard-ddba21b3-e1ce-47c2-b77a-b02fbdfb9f92.png`
- Final browser-rendered implementation: `C:\Users\Hacker\Documents\Codex\2026-07-25\do-not-use-the-uploaded-logo\outputs\scudo-clothing\design-qa-implementation.png`
- Focused side-by-side comparison: `C:\Users\Hacker\Documents\Codex\2026-07-25\do-not-use-the-uploaded-logo\outputs\scudo-clothing\design-qa-comparison.png`
- Route/state: `/shop`, default desktop header, no open drawer or modal.
- Source pixels: 2000 x 2000.
- Implementation screenshot pixels: 1265 x 712.
- CSS viewport: 1280 x 720.
- Device pixel ratio: 1.3125.
- Density normalization: source and rendered logo regions were cropped to their visible lockups, scaled to matching 576 px comparison panels, and placed side by side.

## Findings

- No actionable P0, P1, or P2 mismatch remains in the rebuilt header lockup.

## Required Fidelity Surfaces

- Fonts and typography: the supplied `Recoleta Black` WOFF2 is embedded as the logo display face at weight 900. Its rounded high-contrast lowercase forms closely match the source wordmark. `scudo` remains live text; `CLOTHINGS` remains live, centered DM Sans text with wide tracking.
- Spacing and layout rhythm: the shirt is right-shifted behind the `u/d` area and the subtitle has a reserved baseline below the wordmark. Desktop and 375 px mobile proportions remain contained with no clipping or overlap.
- Colors and visual tokens: near-black `#111111`, taupe `#B9A889`, and off-white `#F7F4EE` preserve the source hierarchy.
- Image quality and asset fidelity: the uploaded logo bitmap is not used. Per the user's explicit requirement, the shirt is a crisp masked SVG with a transparent collar cutout, while both text lines remain selectable live text.
- Copy and content: `scudo` and `CLOTHINGS` match the selected reference.

## Comparison History

### Pass 1 - Failed implementation

- [P1] The centered shirt was too large and visually overwhelmed the wordmark.
- [P1] A heavy black collar stroke introduced an element that does not exist in the reference.
- [P1] The wordmark and subtitle collided, making `CLOTHINGS` unreadable.
- [P2] The shadow created a muddy halo and amplified the overlap.

### Rebuild

- Replaced the centered shirt with a smaller, right-shifted silhouette.
- Replaced the black collar stroke with a transparent SVG mask cutout.
- Converted the lockup to percentage-based positioning with separate wordmark and subtitle zones.
- Reduced tracking and shadow strength.
- Added explicit desktop and mobile proportions.

### Pass 2 - Cooper fallback

- The overall layout passed, but the locally installed Cooper face was only a fallback and did not reproduce the selected source typography as closely as the supplied font.

### Pass 3 - Recoleta Black

- Embedded `F:\Recoleta\Recoleta\Recoleta Black.woff2` as `/fonts/recoleta-black.woff2`.
- Browser computed style confirms `Scudo Recoleta`, weight 900, is loaded and active.
- Focused comparison confirms the source's rounded high-contrast `s`, `c`, `u`, `d`, and `o` forms, clear subtitle spacing, clean shirt overlap, and black/taupe hierarchy.
- Desktop and 375 px mobile storefront captures remain contained and readable.

## Runtime Check

- Header logo link remains accessible as `Scudo Clothing`.
- Primary desktop and mobile storefront states rendered successfully.
- Browser console errors checked: none.
- Production build completed successfully.

## Follow-up Polish

- [P3] The coded shirt is intentionally cleaner and sharper than the low-resolution raster reference.
- The supplied font folder did not include a readable license or EULA; confirm that the Recoleta license covers commercial webfont self-hosting before public deployment.

final result: passed
