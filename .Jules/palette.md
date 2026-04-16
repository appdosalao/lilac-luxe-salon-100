## 2024-06-25 - [Add ARIA labels to icon-only buttons]
**Learning:** Found several icon-only buttons lacking ARIA labels for accessibility, missing titles for tooltips, violating the basic accessibility requirements of this app. The app also heavily uses shadcn's variant="ghost" size="icon" combinations.
**Action:** Adding missing `aria-label` and `title` attributes in Portuguese to improve screen reader accessibility and provide native tooltip behavior for icon buttons in list views (like FornecedoresList).
