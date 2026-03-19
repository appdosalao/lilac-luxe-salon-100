## 2024-12-04 - Missing ARIA Labels on Icon Buttons
**Learning:** Found multiple instances where `Button` components using `size="icon"` have no `aria-label`, meaning screen readers will not announce anything useful when focusing these buttons (e.g., Pencil or Trash icons without text).
**Action:** Always verify `aria-label` or `title` exists on icon-only buttons to improve accessibility.
