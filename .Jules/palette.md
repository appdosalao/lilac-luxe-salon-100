## 2024-05-24 - Accessibility pattern for icon-only action buttons hidden text

**Learning:** When using responsive utility classes to hide descriptive button text on smaller viewports (e.g., `<span className="hidden sm:inline">Text</span>`), the button becomes functionally icon-only on mobile devices. While sighted users rely on the icon context, screen readers lose the accessible name unless an `aria-label` is explicitly provided.

**Action:** Always complement text-hiding responsive utility classes within interactive elements with explicit `aria-label`s on the parent element to guarantee a persistent accessible name across all viewport sizes.
