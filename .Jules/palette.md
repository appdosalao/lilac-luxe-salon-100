## 2024-05-18 - Tooltips and ARIA on Icon-Only Actions
**Learning:** Found multiple instances of icon-only action buttons (e.g. edit/delete) missing accessible names and tooltips. While the icons visually represent the action, screen readers and keyboard users lack context.
**Action:** When adding or maintaining lists and tables, ensure all icon-only action buttons have both an `aria-label` (for screen readers) and a `title` attribute (for visual tooltips on hover). This pattern should be standard for all icon-only interactive elements in the application.
