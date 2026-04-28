## 2024-04-03 - Auditing Icon-Only Buttons for Accessibility
**Learning:** When using components like Shadcn's `<Button size="icon">` in this project, developers frequently omit `aria-label` and `title` attributes, rendering the buttons inaccessible to screen readers and difficult to understand for some users.
**Action:** Proactively grep for `size="icon"` when auditing new or existing code in the project to ensure these critical accessibility and UX attributes are always included.
