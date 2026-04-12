## 2024-11-20 - Adding ARIA labels to FornecedoresList
**Learning:** Found multiple icon-only buttons (`Pencil` and `Trash2` icons) in list components that lack `aria-label` or `title` attributes, severely impacting screen reader accessibility. Mapped these to standard translations: "Editar fornecedor [Nome]" and "Excluir fornecedor [Nome]".
**Action:** When working on lists or tables, proactively ensure that all icon-only action buttons have descriptive `aria-label` and `title` attributes in Portuguese that include dynamic contextual information (like the item name).
