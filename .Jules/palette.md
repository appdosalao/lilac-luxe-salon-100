## 2026-03-07 - Icon-Only Button Accessibility
**Learning:** Icon-only buttons using Radix UI/shadcn Button component (with `size="icon"`) frequently lack `aria-label` and `title` attributes, making them inaccessible to screen readers and confusing for users without tooltip context. This pattern is common in lists (e.g., Edit/Delete actions in FornecedoresList).
**Action:** Always add `aria-label` (for screen readers) and `title` (for native tooltips) to any `<Button size="icon">` that contains only an icon component.
