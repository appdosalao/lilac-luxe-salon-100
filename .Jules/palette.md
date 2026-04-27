## 2024-04-27 - Initial Setup
**Learning:** Initial Palette setup.
**Action:** Starting to improve accessibility.
## 2024-04-27 - Icon-only buttons accessibility pattern
**Learning:** Found an accessibility issue pattern in the app's components (like dynamic lists, e.g., FornecedoresList) where icon-only buttons (using shadcn `variant="ghost"`, `size="icon"` with Lucide React icons) consistently lack both `aria-label` for screen readers and native `title` attributes for tooltips.
**Action:** Always verify icon-only buttons (`<Button size="icon">`) have explicit, descriptive `aria-label` and `title` attributes in Portuguese (the app's language) to ensure compliance with a11y standards and native tooltip behavior.
