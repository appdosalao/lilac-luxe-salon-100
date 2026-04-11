## 2026-04-11 - Missing aria-labels on icon-only buttons
**Learning:** This application frequently uses icon-only buttons (especially with the Lucide React icons and shadcn `<Button variant="ghost" size="sm/icon">`) that lack `aria-label` attributes, impacting accessibility for screen reader users. The pattern spans across features like modals, lists, and tables.
**Action:** When adding or reviewing icon-only buttons (especially variations of `variant="ghost"` or `size="icon"`), always explicitly ensure an `aria-label` (in Portuguese) is added describing the action.
