## 2026-04-23 - Added ARIA labels and titles to FornecedoresList icon buttons
**Learning:** Found missing ARIA labels and title attributes on the 'Edit' and 'Delete' icon-only buttons in the `FornecedoresList` component.
**Action:** Always ensure icon-only buttons utilizing `lucide-react` icons have descriptive `aria-label`s and native `title`s for accessibility and better UX with tooltips.
