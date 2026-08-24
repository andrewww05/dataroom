## 1. The requirement of record

- [x] 1.1 Add the `FR-VIEW-070` row to the Polish table in [docs/02-requirements.md](../../../docs/02-requirements.md)
      ("No surface renders blank while it loads…") and extend the **Empty, loading, error** paragraph in
      [docs/04-ux.md](../../../docs/04-ux.md#empty-loading-error) to say the rule covers the shell, the
      viewer's media frame and `/s/{token}`, not only the listing. Verify: `docs/02` lists FR-VIEW-070
      exactly once, no existing ID is renumbered, and `grep -rn "FR-VIEW-070" docs/` shows both files.

## 2. Placeholder vocabulary

- [x] 2.1 Add the boot placeholder to [apps/web/index.html](../../../apps/web/index.html): shell-outline
      markup inside `#root` plus an inline `<style>` carrying the `oklch(1 0 0)` / `oklch(0.145 0 0)`
      literals from `index.css`, keyed off `.dark`, with a comment naming `index.css` as their source.
      No URL, host or port, and no control (BR-100). Verify: `pnpm --filter @dataroom/web build` then
      `pnpm --filter @dataroom/web preview` — `curl` the page and `#root` is non-empty; a hard reload
      with the network throttled paints the outline in the stored theme, and React clears it on mount
      with no leftover node in the DOM inspector.
- [x] 2.2 Add `apps/web/src/components/skeletons.tsx` exporting `AppShellSkeleton`, `ListingSkeleton` and
      `FolderTreeSkeleton`, all built on `components/ui/skeleton.tsx` — the names
      [docs/04 § Component inventory](../../../docs/04-ux.md#component-inventory) already uses.
      `ListingSkeleton` is the table currently inlined at
      [_authenticated.f.$folderId.tsx:213-251](../../../apps/web/src/routes/_authenticated.f.$folderId.tsx#L213-L251),
      moved verbatim so the rows keep their column widths (FR-VIEW-070, no layout shift). Verify:
      `pnpm typecheck --filter @dataroom/web` passes and the route imports it instead of its own copy.

## 3. Shell and routing

- [x] 3.1 In [main.tsx](../../../apps/web/src/main.tsx) pass `defaultPendingComponent: AppShellSkeleton`,
      `defaultPendingMs: 0` and `defaultPendingMinMs: 0` to `createRouter`, then replace the
      `return null` at [_authenticated.tsx:81](../../../apps/web/src/routes/_authenticated.tsx#L81) and
      [_authenticated.index.tsx:15](../../../apps/web/src/routes/_authenticated.index.tsx#L15) with
      `<AppShellSkeleton />`. Verify: with the API stopped mid-request (or `/auth/me` throttled), loading
      `/` shows the shell for the whole wait and `/` → `/f/$rootId` passes through no empty frame
      (FR-VIEW-070).
- [x] 3.2 In [_authenticated.f.$folderId.tsx](../../../apps/web/src/routes/_authenticated.f.$folderId.tsx)
      render `ListingToolbar` above `<ListingSkeleton />` on the `isLoading` branch instead of returning
      the bare table, so the toolbar does not vanish on a folder change. Do **not** add
      `placeholderData: keepPreviousData` — see `design.md` § Decisions. Verify: opening a nested folder
      keeps New folder / Upload on screen throughout the fetch (FR-VIEW-070).

## 4. Surfaces inside the shell

- [x] 4.1 Replace the three bare waits inside the shell: `Loading...` in
      [FolderPicker.tsx:184-190](../../../apps/web/src/components/dialogs/FolderPicker.tsx#L184-L190) with
      `FolderTreeSkeleton` at the same indent, `Loading stats...` in
      [DetailsPane.tsx:152](../../../apps/web/src/components/DetailsPane.tsx#L152) with skeleton lines the
      size of the figures they stand in for, and the empty `h-24` box in
      [StorageFooter.tsx:11](../../../apps/web/src/components/StorageFooter.tsx#L11) with a labelled bar
      placeholder. Verify: each shows a shaped placeholder and none shifts its container when the real
      value lands (FR-VIEW-070, FR-ACCT-020).
- [x] 4.2 In [FileViewer.tsx](../../../apps/web/src/components/FileViewer.tsx) put an absolutely positioned
      `Skeleton` over the PDF `<iframe>` and the `<img>`, keyed on `file.id` so `→` re-arms it; clear it on
      `onLoad`, and swap to the existing "Could not load preview" state on `onError` or after a 30 s
      timeout (BR-050 — a cross-origin `<iframe>` may never report). Also give
      `ViewerContent`/`TextViewer`'s `Loading preview...` a skeleton. Verify: a large PDF shows no white
      rectangle at any point in dark theme, and a tampered preview URL lands on the failure state rather
      than a permanent placeholder (FR-VIEW-060).
- [x] 4.3 In [s.$token.tsx:349-358](../../../apps/web/src/routes/s.$token.tsx#L349-L358) replace the centred
      spinner with the shared view's own shell — header strip, breadcrumb bar, placeholder rows — carrying
      **no** `ownerEmail` and no node name, since neither is known until the token resolves and a
      `RESTRICTED` link must reveal neither (BR-010, FR-SHARE-020). Verify: a revoked token and a
      restricted token each replace the placeholder with their own screen and no blank frame appears.

## 5. Tests

- [x] 5.1 Add Vitest specs alongside the existing ones: `skeletons.spec.tsx` (each placeholder renders its
      landmarks and no empty container), `FileViewer.spec.tsx` additions (the overlay is present before
      `load`, gone after dispatching `load` on the frame, and replaced by the failure state on `error` —
      BR-050), and an `s.$token.spec.tsx` case asserting the resolve-wait render contains the read-only
      header strip and **does not** contain the owner email (BR-010). Verify:
      `pnpm test --filter @dataroom/web` passes, and each new case fails when its placeholder is reverted.

## 6. Validation

- [x] 6.1 Write `scripts/validate/loading-placeholders.sh` asserting the placeholders are visible when
      [AGENTS.md § Testing Strategy](../../../AGENTS.md#testing-strategy) — `set -euo pipefail`,
      `API_BASE_URL` / `WEB_BASE_URL` from the environment with local defaults, its own accounts and files
      created and deleted through the public API. It asserts: FR-VIEW-070 (`#root` non-empty in the served
      `index.html`, both `oklch` values present in its inline style), FR-SHARE-050 (`404 NOT_FOUND` on a
      revoked token), FR-SHARE-020 (`401 SIGN_IN_REQUIRED` on a restricted token anonymously),
      FR-VIEW-060 + BR-050 (`/files/:id/preview` returns a fetchable URL; a tampered URL is refused),
      FR-ACCT-020 (`/nodes/:id/stats` answers), and prints the measured `/auth/me` latency. It closes with
      the browser-only checklist from `design.md` § Validation. Verify: `chmod +x`, it exits 0 twice in a
      row against the running stack, and exits non-zero with the URL printed when the API is stopped.
