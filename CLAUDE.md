# CLAUDE.md

## Local Development Setup

Start PostgreSQL via Docker Compose (postgres service only), then run the Nuxt dev server:

```bash
docker compose up postgres -d
npm run dev
```

App runs at http://localhost:3000.

To stop postgres:

```bash
docker compose down
```

## Database Changes

**Never modify existing migration files.** The app may already be live with those migrations recorded in `schema_migrations`. Changing them won't re-run them and will break new installs.

For any schema change — new column, new table, index, rename — create a new numbered migration file:

1. Add `server/migrations/NNNN_description.ts` with an `up(sql)` function. Write it to be safe against a live database: use `ADD COLUMN IF NOT EXISTS`, `CREATE TABLE IF NOT EXISTS`, etc.

2. Register it in `server/plugins/migrate.ts` (auto-discovery is not supported in Nitro — imports must be explicit):
```ts
import { up as up000N } from '../migrations/000N_description'

const migrations = [
  // existing entries …
  { name: '000N_description', up: up000N },
]
```

3. The migration runs automatically on next server start (dev or production rebuild). Existing data is preserved — only the new migration is applied.

## Accessibility (WCAG 2.1 AA)

Build every component accessible from the start — do not treat it as a follow-up task.

### Semantic HTML and ARIA roles

- Use native elements where possible (`<button>`, `<input>`, `<nav>`, `<main>`, `<header>`). They carry semantics and keyboard behaviour for free.
- Non-native interactive elements (e.g. a `<div>` acting as a button) must have `role="button"` and `tabindex="0"`.
- Dialogs: `role="dialog"` (or `role="alertdialog"` for confirms) + `aria-modal="true"` + `:aria-label` or `aria-labelledby`.
- Board columns / regions: `role="region"` + `:aria-label`.
- Navigation landmarks: wrap filter bars / breadcrumbs in `<nav aria-label="…">`.
- Page content entry point: `<main id="main-content">`.

### Labels for every control

- Every `<button>`, `<input>`, and `<textarea>` must have a visible label or `aria-label`.
- Icon-only buttons (×, +, toolbar icons) **must** have `aria-label`. Example: `:aria-label="\`Delete ${item.title}\`"`.
- Toggle buttons (bold, italic, etc.) should use `aria-pressed`.

### Keyboard navigation

- All interactive elements must be reachable and operable by keyboard alone.
- `Enter` and `Space` activate buttons/links; `Escape` closes overlays.
- Use Vue's `.self` modifier on parent keydown handlers to prevent child events from bubbling: `@keydown.self.enter.prevent`.
- Dropdown / picker items must be individually focusable (use `<button>` not `<div>`). Support Tab to navigate, Enter/Space to select, Escape to close.

### Focus management

- **Auto-focus on open:** When a dialog, sidebar, or inline form opens, move focus to the first interactive element immediately (`nextTick(() => el.value?.focus()`).
- **Focus return on close:** Save `document.activeElement` before opening; restore it when closing. Keep this in composables (`useItemModal`, `useConfirm`, etc.) so it is never forgotten.
- **Focus trap in overlays:** All dialogs and sidebars must trap Tab/Shift-Tab within the overlay while open. Use the `useFocusTrap` composable (`composables/useFocusTrap.ts`) and wire it to `@keydown.tab.prevent="trap"` on the dialog root.

### Skip link

Every page must include a skip-to-content link as the first focusable element:

```html
<a href="#main-content" class="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[9999] ...">
  Skip to content
</a>
```

### Color contrast

- Normal text (< 18px / non-bold): minimum **4.5 : 1** contrast ratio against its background.
- Large text (≥ 18px or ≥ 14px bold): minimum **3 : 1**.
- Do not rely on colour alone to convey information.
- Dark theme muted text: use `#9ca3af` (6.2 : 1) not `#6b7280` (3.3 : 1 — fails AA).

### Focus indicators

- Never suppress the browser focus ring without replacing it. Use Tailwind `focus:outline-2 focus:outline-black` (or equivalent) for all interactive elements.
- Icons/controls that reveal on hover should also reveal on `:focus`. Use CSS sibling selectors rather than JS:
  ```css
  .card:hover .delete-btn { opacity: 0.6; }
  .delete-btn:hover, .delete-btn:focus { opacity: 1 !important; }
  ```
- Conditionally-visible controls (delete icons) should appear when **that element itself** is focused, not when its parent is focused.

### Checklist for new components

Before marking a component done, verify:

- [ ] All interactive elements reachable and operable by keyboard
- [ ] Visible focus ring on every focusable element
- [ ] `aria-label` on every icon-only button
- [ ] Dialogs/sidebars: `role`, `aria-modal`, focus trap, auto-focus, focus return
- [ ] Color contrast passes 4.5 : 1 for normal text
- [ ] No information conveyed by color alone
