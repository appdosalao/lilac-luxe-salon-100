## 2024-04-13 - Icon-Only Button Accessibility Pattern
**Learning:** Found a widespread pattern in this repository where icon-only action buttons (using shadcn `variant="ghost"` and `size="icon"`) across list components and forms are missing `aria-label` attributes, relying purely on visual context. This affects critical interactions like "Edit", "Delete", and "Remove Item".
**Action:** Always verify `aria-label` and `title` attributes (in Portuguese) when interacting with or adding icon-only buttons in forms or lists within this application.
