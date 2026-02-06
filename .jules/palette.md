## 2024-05-23 - Accessibility Pattern: Semantic Buttons
**Learning:** Found critical accessibility anti-pattern where interactive elements (like the Copy button) were implemented as clickable `div`s without keyboard support or ARIA labels.
**Action:** When auditing components, prioritize checking `components/common` for semantic validity. Refactor `div` wrappers to `<button>` tags with explicit `type="button"` and `aria-label`.
