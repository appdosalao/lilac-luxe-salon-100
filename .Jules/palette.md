## 2024-04-18 - Missing ARIA Labels in Icon-Only Buttons
**Learning:** The application heavily relies on shadcn/ui `Button` components configured with `variant="ghost"` and `size="icon"` (or specific height/width classes) containing only Lucide icons. These often lack both `aria-label` for screen readers and native `title` attributes for mouse users.
**Action:** Always verify icon-only buttons for missing `aria-label` and `title` attributes during accessibility passes, ensuring tooltips are available natively.
