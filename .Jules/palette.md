## 2026-03-26 - Missing ARIA labels in Shadcn/UI icon buttons
**Learning:** During rapid UI development, icon-only buttons (like `<Button size="icon">`) frequently miss `aria-label` attributes. This is especially true in action menus (e.g., `AgendamentosList`, `AuditoriaProblemasTable`) and secondary actions (close, delete).
**Action:** Always check icon-only `<Button>` components from Shadcn/UI for `aria-label` attributes when implementing or reviewing new UI pieces to ensure screen reader accessibility.
