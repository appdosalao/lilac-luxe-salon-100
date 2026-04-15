## 2024-04-15 - Missing ARIA Labels on Icon-only Buttons
**Learning:** Icon-only buttons using `variant="ghost"` and `size="icon"` from the shadcn/ui library lack native tooltips and screen-reader accessibility by default. This is a common pattern in this application.
**Action:** Always ensure that icon-only buttons include descriptive `aria-label` attributes and native `title` attributes in Portuguese (e.g., `aria-label="Editar fornecedor" title="Editar fornecedor"`) to provide context for both screen-reader users and sighted users hovering over the button.
