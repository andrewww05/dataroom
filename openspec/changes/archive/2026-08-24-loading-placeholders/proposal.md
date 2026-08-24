## Why

`apps/web` paints nothing on every load path. Worst is a cold start on an authenticated route:
`_authenticated.beforeLoad` awaits `/auth/me`, and with no `defaultPendingComponent` on the router,
TanStack Router renders no match — the viewport holds `--background` (`oklch(1 0 0)`, pure white) for a
whole round trip. Three narrower paths repeat it: `index.html` ships an empty `#root`, and
`_authenticated.index` and `AuthenticatedLayout` both `return null` en route to `/f/$rootId`. Two paint
the wrong thing: the viewer's `<iframe>` is white while the blob streams, and `/s/{token}` waits behind
the centred spinner `docs/04` rules out.

FR-NAV-040 forbids this for the listing only — not the shell, the media frame, the pane, the tree or the
shared view.

## What Changes

- **New requirement FR-VIEW-070** in `docs/02` § Polish: no surface renders blank while it loads — a new
  row, not a widening of FR-NAV-040.
- A pre-mount shell silhouette in `index.html`, `defaultPendingComponent` with `defaultPendingMs: 0`,
  and both `return null` frames gone.
- Skeletons for the details pane, folder tree, shared view and footer; a placeholder behind the viewer's
  media frame until it paints.

## Capabilities

### Modified Capabilities

- `ui-shell`: FR-VIEW-070, boot through route transition. Pane, tree and footer fall under it, so
  `viewing` needs no delta for them.
- `viewing`: FR-VIEW-060, the media frame while its bytes arrive.
- `sharing`: FR-SHARE-070, the shared view resolving behind its own shell.

## Non-goals

- **Code splitting.** Lazy routes would shorten the pre-mount wait, but that is a bundle concern.
  Decided against with the user; `routeTree.gen.ts` stays eager.
- Slice 13's search spinner and slice 6's upload spinners sit inside painted surfaces; slice 18 is
  untouched.

## Impact

No new slice: this finishes slice 4's empty/skeleton/error states across the surfaces slices 7, 10, 14
and 17 added. Polish tier, delivering FR-VIEW-070, FR-NAV-040, FR-VIEW-060, FR-SHARE-070, BR-050 and
BR-100. `apps/web` only, plus one row in `docs/02`.
