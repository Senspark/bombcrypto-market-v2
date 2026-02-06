# 🎨 Vibe: UX Flow Diagrams

## 🧭 Responsive Navigation Flow

This diagram illustrates how the navigation adapts from Desktop to Mobile, prioritizing key actions.

```mermaid
graph TD
    User([User])

    subgraph "Desktop (>768px)"
        D_Header[Sticky Header]
        D_Nav[Full Horizontal Menu]
        D_Content[Dashboard / Market]
    end

    subgraph "Mobile (<768px)"
        M_Header[Sticky Header]
        M_Nav[Horizontal Scrollable Menu]
        M_Content[Stacked Content]
    end

    User -->|Access| D_Header
    User -->|Access| M_Header

    D_Header --> D_Nav
    M_Header --> M_Nav

    D_Nav -->|Click| D_Content
    M_Nav -->|Tap| M_Content
```

## 🛍️ Market Filter Flow

This diagram illustrates the user journey for filtering items on the marketplace.

```mermaid
sequenceDiagram
    participant U as User
    participant UI as Market UI
    participant API as Backend API

    U->>UI: Lands on Market Page
    UI->>API: Fetch Default Listings (Page 1)
    API-->>UI: Return Hero Data
    UI->>U: Display Grid of Heroes

    U->>UI: Selects Filter (e.g., "Legendary")
    Note right of UI: Debounced Input (1s)
    UI->>UI: Update URL Query Params
    UI->>API: GET /search?rarity=Legendary

    alt Mobile View
        Note right of UI: Filters are stacked first
    else Desktop View
        Note right of UI: Filters are sticky sidebar
    end

    API-->>UI: Return Filtered Data
    UI->>U: Update Grid
```
