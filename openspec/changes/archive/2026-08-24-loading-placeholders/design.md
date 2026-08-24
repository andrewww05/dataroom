## Context

See `proposal.md` § Why. Shaping constraint: the boot placeholder paints before `index.css` exists, so
it cannot use a Tailwind token. `index.css` sets `--background: oklch(1 0 0)` on `:root` and
`oklch(0.145 0 0)` on `.dark`; the IIFE in `index.html` already puts `.dark` on `documentElement` before
first paint (FR-VIEW-050).

## Goals / Non-Goals

**Goals:** one vocabulary — `AppShellSkeleton`, `ListingSkeleton`, `FolderTreeSkeleton`, the names
`docs/04` § Component inventory uses — reused at every call site.

**Non-Goals:** no dependency, no `Suspense`, no API change, no env var; `ui/skeleton.tsx` is the only
primitive.

## Decisions

**Boot placeholder inside `#root`, with two colour literals.** `createRoot(el).render()` destroys the
container's children, so React clears it on mount — no teardown, no sibling node to remove.

```html
<style>
  /* The one place a colour literal is allowed: no stylesheet exists yet.
     Both values are copied from src/index.css — keep them in sync. */
  #boot {
    background: oklch(1 0 0);
  }
  .dark #boot {
    background: oklch(0.145 0 0);
  }
</style>
<div id="root">
  <div id="boot"><!-- sidebar / header / rows, no URL and no control (BR-100) --></div>
</div>
```

**`defaultPendingMs: 0`.** That default — `1000` in TanStack Router — not a missing component, is why
the `/auth/me` wait shows nothing today.

```ts
createRouter({
  routeTree,
  defaultPendingComponent: AppShellSkeleton,
  defaultPendingMs: 0, // default 1000 — the whole bug
  defaultPendingMinMs: 0, // a shaped placeholder needs no anti-flicker hold
});
```

**The listing keeps its toolbar above the skeleton.** _Rejected alternative:_ `placeholderData:
keepPreviousData` — it renders the previous folder's rows under the new folder's breadcrumbs, a worse
lie than a placeholder.

**The media frame gets an overlay,** not a replacement:

```tsx
<Skeleton key={file.id} className="absolute inset-0" />   // key re-arms it when → steps
<iframe onLoad={clear} onError={fail} />                  // plus a 30s timeout → fail
```

**BR invariants.** BR-050 — every placeholder resolves to content, an empty state, or an error with
retry; the timeout upholds it when a cross-origin `<iframe>` never reports. BR-010 — the `/s/{token}`
placeholder names neither `ownerEmail` nor the node, so a `RESTRICTED` link leaks nothing while
resolving. BR-100 — as above.

## Risks / Trade-offs

- A fast resolve flashes the placeholder → same shape and palette as the shell, so it reads as the shell
  drawing.
- The `oklch()` literals drift from `index.css` → the comment names the file; the checklist re-checks
  both themes.
- `<iframe onLoad>` varies by browser on cross-origin PDFs → the timeout is the backstop.

## Validation

`scripts/validate/loading-placeholders.sh` asserts over HTTP: **FR-VIEW-070** — `GET $WEB_BASE_URL/`
serves an `index.html` with a non-empty `#root` and both background values inline; **FR-SHARE-050** and
**FR-SHARE-020** — `/shares/resolve` gives `404 NOT_FOUND` revoked and `401 SIGN_IN_REQUIRED`
restricted-anonymous, the two screens the placeholder hands off to; **FR-VIEW-060** and **BR-050** —
`/files/:id/preview` returns a fetchable URL and a tampered one is refused; **FR-ACCT-020** —
`/nodes/:id/stats` answers. It also times `/auth/me`, to show the covered window's real length.

Browser-only, so printed as its checklist: the first painted frame on a throttled reload, no layout
shift on resolve, every placeholder in dark theme, `/` → root with no blank frame, the toolbar surviving
a folder change, the PDF frame never white, `/s/{token}` naming nobody.
