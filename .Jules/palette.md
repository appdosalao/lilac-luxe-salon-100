## 2024-05-24 - Missing ARIA labels in icon-only buttons
**Learning:** Found that many standard CRUD lists in this application have edit/delete icon-only buttons without `aria-label` or `title` attributes. This is a common pattern when using shadcn/ui `size="icon"` buttons.
**Action:** Always add `aria-label` and `title` in Portuguese to icon-only buttons to improve accessibility and usability.
