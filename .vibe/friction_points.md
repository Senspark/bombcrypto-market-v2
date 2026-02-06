# 🎨 Vibe's Journal: Friction Points

## UX Debt & Heuristic Violations

### 1. 📱 Mobile Experience (Crucial)
*   **Severity**: Critical
*   **Location**: `frontend/src/components/layouts/Header/index.tsx`, `frontend/src/views/market.tsx`
*   **Issue**: The Header has a hardcoded `min-width: 62.5rem`, forcing horizontal scroll on mobile devices. The Market layout uses fixed flex widths that don't collapse for smaller screens.
*   **Heuristic**: Match between system and the real world (users use phones!).

### 2. 🎨 Inconsistent Design System
*   **Severity**: High
*   **Location**: Global
*   **Issue**: Colors (e.g., `#11131b`, `#3a3f54`, `#ff973a`) are hardcoded in multiple files. Spacing is inconsistent (`1rem` vs `10px`).
*   **Heuristic**: Consistency and standards.

### 3. ♿ Accessibility (WCAG)
*   **Severity**: High
*   **Location**: `frontend/src/views/market.tsx`, `frontend/src/components/layouts/Header/index.tsx`
*   **Issue**:
    *   `img` tags have empty `alt` attributes (`alt=""`).
    *   `div` elements with `onClick` handlers lack `onKeyDown` and `tabIndex` for keyboard users.
    *   Low contrast text in some areas (e.g., grey text on dark blue backgrounds).

### 4. 🐌 Performance & Feedback
*   **Severity**: Medium
*   **Location**: `frontend/src/views/market.tsx`
*   **Issue**: The `Statistics` component is monolithic. Data fetching happens directly inside the component. Loading states could be smoother (skeleton screens instead of full page spinners).
*   **Heuristic**: Visibility of system status.

### 5. 🧩 Code Structure
*   **Severity**: Medium
*   **Location**: `frontend/src/views/market.tsx`
*   **Issue**: Business logic (API calls) mixed with UI logic. Hard to test and maintain.
