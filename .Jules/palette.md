## 2026-05-11 - Added Missing ARIA Labels to Icon Buttons
**Learning:** Found several icon-only buttons using Lucide React icons and shadcn `size="icon"` that lack native `title` and `aria-label` attributes for accessibility and tooltips.
**Action:** When adding or modifying icon-only buttons, always ensure `aria-label` and native `title` attributes (in Portuguese) are included.
