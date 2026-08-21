# Epic E09 — Mobile UX Foundations

## Purpose

This epic is not a feature, it is the vocabulary every other epic is written in. It ships and names
the touch-first interaction system that replaces the desktop file-manager primitives from the brief:
the long-press action sheet instead of right-click, the always-visible row overflow instead of hover,
selection mode instead of rubber-band drag, the destination picker instead of drag-and-drop and split
view, the bottom action bar instead of a dense toolbar, and the full-screen viewer plus details sheet
instead of a hover preview pane. It also sets the accessibility floor (WCAG 2.2 AA), the safety rules
that protect data on a small screen, and the honesty rules that forbid claiming capabilities the web
platform does not grant.

## Related documents

- [Documentation index](../README.md)
- [Personas & JTBD](../02-personas-and-jtbd.md)
- [Product overview](../03-product-overview.md)
- [Epics](../04-epics.md)
- [Functional requirements](../05-functional-requirements.md)
- [Business rules & permissions](../06-business-rules-and-permissions.md)
- [Non-functional requirements](../07-non-functional-requirements.md)
- [Mobile UX spec](../08-mobile-ux-spec.md)
- [Domain model & glossary](../09-domain-model-and-glossary.md)
- [Master backlog](../11-master-backlog.md)
- [Risks & open questions](../12-risks-and-open-questions.md)
- Sibling backlogs: [E01 Access & Identity](./epic-01-access-and-identity.md),
  [E02 Data Rooms & Workspace Home](./epic-02-data-rooms-and-workspace-home.md),
  [E03 Folder Hierarchy & Navigation](./epic-03-folder-hierarchy-and-navigation.md),
  [E04 File Operations](./epic-04-file-operations.md),
  [E05 Viewing, Preview & File Details](./epic-05-viewing-preview-and-file-details.md),
  [E06 Search & Discovery](./epic-06-search-and-discovery.md),
  [E07 Sharing & Access Control](./epic-07-sharing-and-access-control.md),
  [E08 Conflict Resolution & Data Integrity](./epic-08-conflict-resolution-and-data-integrity.md),
  [E10 Performance, Offline & Scale](./epic-10-performance-offline-and-scale.md)

## Epic summary

| Field | Value |
| --- | --- |
| Epic ID | E09 |
| Goal | Ship a named, documented, tested interaction system for touch first and desktop second, so that touch behaviour is a platform decision made once rather than a screen decision made forty times, and so that every other epic inherits WCAG 2.2 AA, one-handed reach and destructive-action safety by construction. |
| Primary personas | All six. P4 Ashley Kim and P6 Ray Okonkwo will find its defects first: P4 because she does 30 to 40 percent of her touches on a phone and expects bulk operations to work there, P6 because he is on one bar of LTE with a cracked screen and gloves half off. P2 Dev Raman and P5 Ingrid Sørensen set the patience budget; P1 Marcy Doyle sets the one-handed requirement; P3 Tomás Ferreira justifies the desktop enhancement layer. |
| Release span | R1 (stories 01 to 16), R2 (stories 17 to 18) |
| Story count | 18 |
| Total points | 109 |
| Depends on | Nothing inside this doc set. This epic is sprints one and two, and its first deliverable is tokens plus the five components E03 needs, not a complete library. |
| Blocks | E01, E02, E03, E04, E05, E06, E07, E08 — every screen in the product is assembled from these components, and every acceptance criterion elsewhere assumes their behaviour. |

## Mobile-first design stance

- **360 CSS px is the design surface and 320 CSS px is the pass gate.** Every component is specified at
  360 x 640 first; SC 1.4.10 Reflow requires no two-dimensional scrolling at 320 px, so 320 is where
  the automated test asserts. Desktop is what gets *added* at 600, 840, 1200 and 1600 px, never what
  gets *reduced*.
- **48 CSS px targets with 8 px gaps, chosen deliberately to satisfy three rulebooks at once.** Apple
  wants 44 pt, Material wants 48 dp, WCAG 2.2 SC 2.5.8 floors at 24 x 24 CSS px. One web codebase
  cannot hold three numbers, so the product specifies 48 CSS px minimum with 8 CSS px minimum
  separation, which clears all three simultaneously.
- **Every desktop primitive in the brief gets a named touch replacement, and the replacement is the
  baseline.** Right-click becomes long-press plus an always-visible row overflow. Hover becomes tap
  for a details sheet at the medium detent. Drag-and-drop becomes Select then "Move to…" with a
  destination picker, which is also what SC 2.5.7 Dragging Movements requires. Rubber-band selection
  becomes selection mode with a contextual action bar. The folder tree becomes breadcrumb plus
  drill-down, with the tree returning as a rail at >= 840 dp. Split view becomes a single pane plus a
  staging tray or a destination picker. Keyboard navigation is kept in full, because SC 2.1.1 is Level
  A and because roving-tabindex grid semantics is simultaneously the screen-reader model.
- **A gesture is a shortcut, never a mechanism.** Long-press, swipe and pull-to-refresh each have a
  visible equivalent, because gestures have no signifier and NN/g documents that hidden navigation
  costs more than 20 percent of content discoverability. Swipe also never starts within 24 CSS px of
  either screen edge, because the Android system back gesture owns both edges and an app can exclude
  at most 200 dp per edge.
- **One sheet at a time, and every sheet is a history entry.** Stacking sheets loses people. Apple is
  explicit: close the first sheet before presenting the second. On Android every sheet, selection mode
  and preview must be popable so predictive back animates to a sane place; on iOS in standalone display
  mode there is no browser chrome, so an in-app back affordance is mandatory.
- **Destructive actions commit on the up-event, state their blast radius, and are undoable.** Mis-taps
  are the norm on touch. SC 2.5.2 Pointer Cancellation forbids firing on the down-event; the brief
  demands a warning that states what will be deleted; NN/g's swipe research names accidental data loss
  as the consequence of cheap gestures. All three converge on one pattern, specified once here in
  US-E09-14 and reused by E03, E04, E07 and E08.
- **The product never claims a capability the platform does not grant.** No "uploading in the
  background" where Background Fetch does not exist. No "available offline" presented as durable, when
  Safari deletes script-created storage for an origin with no interaction in seven days and eviction is
  all-or-nothing. No implied save location, because a web page is never told where an iOS download
  landed. The honest replacements are specified as copy in US-E09-16.
- **Field conditions are design inputs.** High contrast in sunlight, targets that survive a gloved or
  cracked-screen tap, no interaction that requires precision in a screen corner, and no single
  load-bearing control in the lower-right quadrant, because more than 80 percent of field workers have
  damaged their devices and three in four have cracked screens.

---

## User stories

### US-E09-01 — Design tokens and the theme foundation

**As a** front-end engineer building every other epic **I want** one token layer that carries the whole
light palette unconditionally and redefines only values for dark **so that** a new theme never requires
a component change and no screen invents its own colour.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 5 |
| Depends on | none |
| Traces to | FR-MOB-024, FR-MOB-025, FR-MOB-026, NFR-A11Y-001, NFR-MAINT-001, NFR-COMPAT-001 |

**Acceptance criteria**

1. **Given** the token layer **when** it is authored **then** the complete light palette is defined on
   bare `:root`, the dark palette redefines only token values inside
   `@media (prefers-color-scheme: dark)` guarded as `:root:not([data-theme="light"])`, and again inside
   `:root[data-theme="dark"]`, so an explicit user choice wins in both directions and the system
   default works with no attribute present.
2. **Given** any component **then** it references semantic tokens only (`--surface`, `--surface-raised`,
   `--text-primary`, `--text-secondary`, `--accent`, `--destructive`, `--border`, `--focus-ring`,
   `--overlay`), and a CI lint rule fails the build on a raw hex value, `rgb()` or named colour outside
   the token file.
3. **Given** the palette **when** contrast is measured **then** every text token on every surface token
   it is permitted to pair with meets 4.5:1 for body text and 3:1 for large text and non-text UI
   components, in both schemes, asserted by an automated contrast test over the permitted pairings
   matrix.
4. **Given** the theme setting **then** it has three values: `system` (default), `light`, `dark`; it is
   persisted per account via `PATCH /me` and mirrored to local storage so the first paint after a cold
   start does not flash the wrong scheme.
5. **Given** the app is installed to the Home Screen **then** the manifest `theme_color` and the
   `meta[name="theme-color"]` values follow the resolved scheme, so the status bar and the standalone
   window chrome match, verified on both platforms.
6. **Given** the OS scheme changes while the app is open and the setting is `system` **then** the app
   re-themes within one frame with no full re-render and no layout shift (CLS contribution 0).
7. **Given** `body` **then** it has an explicit token background, because a transparent body borrows the
   host's colour and produces an unreadable screen in the opposite scheme.
8. **Given** the token file **then** it also carries spacing, radius, elevation, motion duration and
   type-scale tokens, so density and text-size personalisation in US-E09-18 changes values rather than
   components.

**Mobile acceptance criteria**

- No flash of incorrect theme on cold start on a mid-range Android over 4G: the resolved scheme is
  applied by an inline script before first paint, verified by a video capture at 60 fps showing zero
  frames in the wrong scheme.
- Contrast is verified on a physical phone at maximum brightness in direct sunlight as a manual QA step
  (pass criterion: file names in a listing are readable at arm's length), because the field personas
  work outdoors.
- Switching theme in settings applies immediately without a reload and keeps the user's scroll position
  and any open sheet.
- With `prefers-contrast: more` set, border tokens increase to a 3:1 minimum against their adjacent
  surface.
- Screen reader is unaffected: no token change alters the accessibility tree.

**Edge cases & negative paths**

- Browser reports no `prefers-color-scheme` support: light is used, and the manual toggle still works.
- User's OS is in dark mode but the app setting is `light`: the app is light, including the status bar
  colour, with no mixed-scheme surfaces.
- Print stylesheet: forced to the light palette with backgrounds removed, because a printed dark theme
  is unusable.

---

### US-E09-02 — The responsive size-class ladder and the progressive-enhancement contract

**As a** designer and engineer specifying any screen **I want** one published set of breakpoints and one
rule about what each adds **so that** nobody designs desktop-first and retrofits touch.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 5 |
| Depends on | US-E09-01 |
| Traces to | FR-MOB-010, FR-MOB-031, FR-MOB-046, NFR-A11Y-001, NFR-COMPAT-001, NFR-MAINT-001 |

**Acceptance criteria**

1. **Given** the layout system **then** it defines width classes Compact (< 600 px), Medium (600 to 839
   px), Expanded (840 to 1199 px), Large (1200 to 1599 px) and Extra-large (>= 1600 px), and height
   classes Compact (< 480 px), Medium (480 to 899 px) and Expanded (>= 900 px), exposed as data
   attributes on the app root so components can branch declaratively.
2. **Given** any two-pane layout (split view, tree rail plus content, list plus inspector) **then** it
   is enabled only when width is Medium or above AND height is Medium or above; a landscape phone at
   740 x 360 (Medium width, Compact height) renders the single-pane layout, verified by an explicit
   test at that viewport.
3. **Given** the enhancement ladder **then** it is fixed and documented: Compact ships bottom
   navigation, bottom action bar, sheets and drill-down; Medium adds a navigation rail and a two-column
   settings layout; Expanded adds the folder tree rail, the docked preview inspector and the split-pane
   transfer view; Large and Extra-large add wider content columns and the permission matrix table. No
   feature exists only above Compact unless it is listed in the epic's desktop-enhancement table.
4. **Given** every component **then** it renders correctly at 320, 360, 390, 414, 600, 840, 1200 and
   1600 px, and a visual-regression suite captures all eight widths for every component and every
   screen.
5. **Given** the 320 px case **then** there is no two-dimensional scrolling anywhere: wide content
   (tables, code blocks, breadcrumbs, wide diagrams) scrolls inside its own container with
   `overflow-x: auto`, and the page body never scrolls horizontally.
6. **Given** orientation **then** no screen locks or gates on orientation (SC 1.3.4), and every screen
   is verified in both portrait and landscape at phone and tablet sizes.
7. **Given** hover-capable pointers **then** hover affordances are added only inside
   `@media (hover: hover) and (pointer: fine)` and never carry unique information; a CI check fails on a
   `:hover` rule outside that guard that changes `opacity`, `visibility` or `display`.
8. **Given** a hybrid device (touchscreen laptop, iPad with a trackpad) **then** both input models work
   simultaneously: the touch affordances remain rendered and the pointer affordances are additive.

**Mobile acceptance criteria**

- The width and height classes are derived from the visual viewport, not from `window.innerWidth`, so
  the software keyboard does not change the width class and re-lay-out the screen mid-typing.
- A resize or rotation completes within 200 ms on the reference device with no long task over 50 ms and
  no scroll-position loss.
- At 360 x 640 with the keyboard up (roughly 360 x 300 usable), every screen still exposes its primary
  action without the user scrolling to find it.
- The visual-regression suite includes a 360 x 640 device-pixel-ratio-3 capture, because 1x captures
  hide sub-pixel target-size failures.

**Edge cases & negative paths**

- Foldable device with a hinge: the layout uses viewport segments where exposed and otherwise falls back
  to single-pane; nothing critical is placed in the centre 40 px.
- Extremely narrow viewport (280 px, small Android split-screen): the layout is allowed to scroll
  horizontally below 320 px, but no data is lost and no control becomes unreachable.
- Browser zoom at 400 percent on desktop (equivalent to a 320 px viewport): the Compact layout is used,
  which is the point of specifying it first.

---

### US-E09-03 — App shell: safe areas, bottom navigation, sticky breadcrumb and the standalone back affordance

**As a** P1 Marcy Doyle holding the phone in one hand **I want** navigation and the current location to
be permanently visible and reachable with a thumb **so that** I never lose track of which deal I am
looking at.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 8 |
| Depends on | US-E09-01, US-E09-02 |
| Traces to | FR-MOB-007, FR-MOB-011, FR-MOB-017, FR-MOB-042, FR-MOB-044, NFR-MOB-006, NFR-A11Y-002, NFR-COMPAT-001 |

**Acceptance criteria**

1. **Given** the app shell at Compact width **then** it has a bottom navigation bar with between three
   and five destinations (Rooms, Search, Uploads, Notifications, Me), each with an icon and a visible
   text label, each target >= 48 CSS px in both dimensions with >= 8 CSS px separation.
2. **Given** the viewport meta **then** it is `width=device-width, initial-scale=1, viewport-fit=cover`
   and never contains `user-scalable=no` or a `maximum-scale` below 5 (SC 1.4.4).
3. **Given** any fixed bottom element (bottom navigation, bottom action bar, contextual action bar,
   upload progress bar, toast) **then** it adds `env(safe-area-inset-bottom)` to its padding, and a
   device test on a notched iPhone and an Android with a gesture pill confirms no control sits under the
   home indicator.
4. **Given** any fixed top element **then** it adds `env(safe-area-inset-top)`, and content extends
   edge-to-edge behind the bars while every control stays inside the safe area.
5. **Given** a folder screen **then** a sticky header holds the current location: the breadcrumb rail
   (US-E09-11), the room name, and permanently visible Search, Upload and New-folder affordances;
   only tertiary commands sit behind an overflow, per NN/g's finding that hidden navigation costs more
   than 20 percent of discoverability.
6. **Given** the app is running in standalone display mode (installed) **then** a persistent in-app
   back affordance is present in the header on every screen below the root, because iOS has no system
   back and standalone mode removes the browser chrome.
7. **Given** the Android system back gesture or button **when** it is used **then** it pops exactly one
   level of in-app history: an open sheet closes, then selection mode exits, then the folder goes up one
   level, then the app leaves; a test asserts the sequence never skips a level and never exits the app
   with a sheet open.
8. **Given** the web app manifest **then** it declares name, short name, a full icon set including
   maskable icons, `display: standalone`, `start_url`, `theme_color` and `background_color`, and the app
   passes installability checks in Chrome; on iOS the install path is Share then Add to Home Screen and
   is taught in-product rather than by a non-functional install button.
9. **Given** scrolling **then** the sticky header collapses its secondary row on scroll-down and
   restores it on scroll-up, but the breadcrumb and the current location never disappear entirely.

**Mobile acceptance criteria**

- Thumb-zone rule, verified with a physical device and a 75 mm reach template: every primary action on
  every screen falls within the bottom 45 percent of a 640 px-tall viewport; no primary action sits in
  the top 20 percent.
- Bottom navigation labels remain readable at 200 percent text size, wrapping to two lines and growing
  the bar height rather than truncating (a maximum bar height of 96 CSS px, after which labels are
  hidden but accessible names are retained).
- In landscape on a phone (740 x 360), the bottom navigation converts to a compact rail on the leading
  edge rather than consuming 25 percent of the available height.
- The in-app back control is >= 48 CSS px, sits on the leading edge of the header, and its accessible
  name states the destination ("Back to Acme HVAC").
- With a screen reader on, the shell exposes landmark roles: `banner` for the header, `navigation` for
  the bottom bar with an accessible name, `main` for content; the bottom bar's current item carries
  `aria-current="page"`.
- On a cold start over Slow 4G, the shell paints within the LCP budget with skeleton content, so the
  navigation is usable before data arrives.

**Edge cases & negative paths**

- Notification permission or install banner competing for the bottom area: at most one system-level
  prompt row is shown at a time, and it never overlays the bottom navigation.
- Device with an on-screen keyboard that overlays the bottom bar: the bar is hidden while the keyboard
  is up (its actions move into the keyboard accessory area or the sheet), so it never floats above the
  keyboard.
- iOS Safari's collapsing URL bar changing the visual viewport height mid-scroll: layout uses
  `dvh`/visual-viewport measurements so the bottom bar does not jump.
- User installs on Android and later opens the same URL in a browser tab: both surfaces work, and the
  in-app back affordance appears only in standalone mode.

---

### US-E09-04 — Bottom action bar and the contextual thumb-zone rule

**As a** P1 Marcy Doyle acting with one thumb **I want** the three to five actions I actually need on
this screen in a labelled bar at the bottom **so that** I never reach for a toolbar at the top of the
screen.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 5 |
| Depends on | US-E09-03 |
| Traces to | FR-MOB-008, FR-MOB-011, FR-MOB-036, NFR-A11Y-002, NFR-A11Y-004, NFR-MOB-006 |

**Acceptance criteria**

1. **Given** any content screen **then** it has a bottom action bar with between three and five primary
   actions plus one overflow, every item carrying a visible text label under its icon, and no
   icon-only item anywhere in the bar.
2. **Given** the overflow **when** it is opened **then** it presents a sectioned modal bottom sheet with
   labelled groups, not a flat scrolling list of buttons, because a file screen attracts a dozen
   commands and an action sheet caps at four buttons including Cancel and must not scroll.
3. **Given** the create action (New folder, Upload) **then** it is always one of the visible primary
   items and is never hidden behind the overflow, per the platform convention that an explicit Add
   affordance must exist regardless of shortcuts.
4. **Given** any bar item **then** its accessible name contains its visible label text exactly (SC
   2.5.3), so voice control activates it by the name the user reads; a unit test asserts this for every
   item in the component's registry.
5. **Given** actions the current principal may not perform **then** they are absent from the bar and
   from the overflow rather than dimmed, so a Viewer never taps a control that then fails.
6. **Given** the bar **then** it does not obscure the last row of the scrollable content: the scroll
   container carries `scroll-padding-bottom` equal to the bar height plus
   `env(safe-area-inset-bottom)`, and the last row is fully reachable.
7. **Given** the bar at Expanded width **then** it is replaced by a horizontal toolbar with icon plus
   label and keyboard shortcut hints in the main menus, while the same command registry backs both, so
   the two can never diverge.

**Mobile acceptance criteria**

- Each item's hit area is >= 48 x 48 CSS px with >= 8 CSS px separation, measured on a physical device
  with a 360 px viewport where five items must fit: item width is at least 64 CSS px including padding.
- At 200 percent text size, labels wrap to two lines and the bar grows; at 250 percent the bar drops to
  three items plus overflow rather than clipping.
- The bar is reachable one-handed: its centre line sits no more than 120 CSS px above the bottom safe
  inset.
- With a screen reader on, the bar is a `toolbar` with an accessible name, items are traversable with
  one swipe each, and the overflow announces "More actions, opens a sheet".
- On a cracked-screen device test, no single item is the only route to any action: every bar item is
  also reachable from the row overflow or the screen's overflow sheet.

**Edge cases & negative paths**

- Screen with only two meaningful actions: the bar renders two items plus overflow rather than padding
  with placeholders.
- Long action label in a translated locale (German "Ordner erstellen"): the label wraps or abbreviates
  with an accessible name containing the full text.
- Bar during an active upload: the upload progress bar sits above it, both respecting safe insets, and
  the combined height never exceeds 25 percent of a 640 px viewport.

---

### US-E09-05 — The item row component

**As a** P2 Dev Raman scanning a folder on a train **I want** every row to show what the item is and give
me one obvious way to act on it **so that** I can work with a thumb without accidental taps.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 5 |
| Depends on | US-E09-01, US-E09-02 |
| Traces to | FR-MOB-002, FR-MOB-028, FR-MOB-037, FR-VIEW-004, NFR-A11Y-002, NFR-A11Y-004, NFR-PERF-003 |

**Acceptance criteria**

1. **Given** a row **then** it renders: a type icon or thumbnail, the name (middle-truncated when too
   long, never end-truncated, because extensions and version markers live at the end), one secondary
   line (size and modified date for a file, item count for a folder), the shared-state indicator, and
   one overflow control.
2. **Given** a row **then** it has exactly two independent targets: the row body (navigates for a
   folder, opens the viewer for a file) and the overflow control (opens the item action sheet), with
   >= 8 CSS px between them and no third target, per the platform warning about competing trailing
   controls.
3. **Given** the overflow control **then** it is always rendered in its resting state and is never
   revealed on hover, and it contains every action the long-press sheet contains, so no action is
   gesture-only (FR-MOB-002).
4. **Given** a row **then** its total height is >= 56 CSS px in comfortable density and >= 48 CSS px in
   compact density, and both densities keep every target >= 48 CSS px.
5. **Given** a screen reader **then** the row announces, in order: name, type, size or item count,
   modified date, shared state, and selection state when selection mode is active; the overflow control
   is a separate focusable element named "More actions for Lease.pdf".
6. **Given** a list of rows **then** it is exposed as a semantic list (or a grid when in tiles view)
   with `aria-rowcount` reflecting the total item count, not just the loaded page, so a screen-reader
   user knows the size of the folder.
7. **Given** row rendering **then** a single row's render costs no long task: a virtualised list of
   10,000 stub rows scrolls at 60 fps on the reference device with no task exceeding 50 ms, measured in
   CI (this is the E10 budget, asserted here for the component).
8. **Given** a row in an error or pending state (upload waiting, sync queued, scan pending) **then** the
   state is a text label plus icon on the secondary line, never a colour-only treatment, and it is part
   of the accessible name.

**Mobile acceptance criteria**

- At 360 px, a row shows the name truncated in the middle plus the full secondary line plus both
  targets without any element overlapping; a QA screenshot test covers a 120-character file name.
- The thumbnail placeholder occupies its final dimensions before the image loads, so a loaded thumbnail
  causes zero layout shift.
- Long-press on the row body does exactly one thing across the entire product, chosen once (see
  US-E09-06), and the other affordance always has a visible entry point.
- At 200 percent text size the row grows to two or three lines and the overflow control remains fully
  on screen; a test asserts the overflow is never clipped off the trailing edge.
- With TalkBack and VoiceOver, moving between rows requires exactly one swipe per row, and the overflow
  is reachable with a second swipe rather than being buried in a group.

**Edge cases & negative paths**

- Item whose name is entirely right-to-left inside a left-to-right list: bidirectional isolation keeps
  the extension in the correct visual position and truncation does not reorder characters.
- Zero-byte file: the secondary line reads "0 bytes" rather than being blank.
- Folder with unknown item count (not yet loaded): the secondary line shows a skeleton of the final
  width, not a spinner, so no shift occurs when the count arrives.
- Row for an item the user cannot open (unsupported preview, download denied): the row body still
  activates and leads to a state that explains why, never a dead tap.

---

### US-E09-06 — Long-press action sheet: the mobile context menu

**As a** P4 Ashley Kim acting on a file with one hand **I want** a long-press to open the item's actions,
with the same actions available from a visible button **so that** I never have to know a gesture to get
work done.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 5 |
| Depends on | US-E09-05, US-E09-07 |
| Traces to | FR-MOB-001, FR-MOB-002, FR-MOB-003, FR-MOB-004, FR-MOB-006, NFR-A11Y-004, NFR-MOB-006 |

**Acceptance criteria**

1. **Given** any item row **when** the user long-presses it for 500 ms **then** the item action sheet
   opens; this is the touch equivalent of the desktop right-click context menu, and the identical sheet
   opens from the row's overflow control.
2. **Given** long-press **then** it has exactly one meaning across the whole product: it opens the
   action sheet. It never also enters selection mode. Selection mode has its own visible "Select"
   entry point (US-E09-08), and the choice is applied to every list in the product without exception.
3. **Given** the long-press **then** the action commits on the up-event, and sliding the finger off the
   row before release aborts with no action taken (SC 2.5.2 Pointer Cancellation); a visual press state
   appears at 150 ms so the gesture is discoverable.
4. **Given** the sheet **then** actions unavailable to the principal are hidden, not dimmed, per the
   platform rule specific to context menus, and the visible set therefore differs by role.
5. **Given** more than four actions **then** the sheet is a sectioned modal bottom sheet with labelled
   groups (Open, Organise, Share, Danger) rather than a flat action sheet, because an action sheet caps
   at four buttons including Cancel and must never scroll.
6. **Given** destructive actions **then** they sit in a visually separated final group, are styled
   destructive, and are never adjacent to the item the thumb most likely lands on after the sheet
   opens.
7. **Given** submenus **then** there is at most one level; a second level is refactored into a separate
   sheet reached by a full-width row, replacing the current sheet rather than stacking.
8. **Given** desktop **then** the same sheet content is bound to `contextmenu`, secondary click and
   `Shift+F10`, rendered as a positioned popover rather than a bottom sheet, from the same command
   registry.
9. **Given** the sheet **then** its title states the item it acts on ("Lease.pdf"), and in selection
   mode it states the count ("3 items"), so a user is always reminded of the scope.

**Mobile acceptance criteria**

- Long-press works with a gloved or partially wet finger: the gesture tolerates up to 12 CSS px of
  movement before it is treated as a scroll, tested on a physical device.
- Long-press never fires while the list is decelerating from a scroll; a 150 ms quiet period after
  scroll end is enforced, so a thumb that stops a scroll does not open a sheet.
- The press state is haptic-free in R1 (haptics land in US-E09-17) but always visual, and it respects
  `prefers-reduced-motion` by using an opacity change rather than a scale animation.
- The sheet's first interactive element is at least 120 CSS px above the bottom safe inset so a thumb
  that just released a long-press does not land on it.
- With a screen reader on, long-press is not required at all: the overflow control is the primary route,
  and the sheet traps focus, announces its title, and returns focus to the overflow control on dismiss.
- Text selection and the platform's own long-press menu (copy, look up) are suppressed on rows via
  `user-select: none` and `-webkit-touch-callout: none`, so the app's sheet is not competing with the
  OS menu.

**Edge cases & negative paths**

- Long-press starting on the overflow control: the overflow's own tap wins; long-press on a control is
  never a second gesture.
- Long-press while a sheet is already open: ignored, because only one sheet may be open.
- Long-press on a row that disappears mid-gesture (deleted by another user): the sheet does not open and
  a polite announcement states "That item is no longer available."
- External keyboard attached: the context menu key and `Shift+F10` open the sheet with focus on its
  first item, and `Escape` closes it.

---

### US-E09-07 — The sheet system: detents, grabber, one-sheet rule, popable history

**As a** P5 Ingrid Sørensen reading between meetings **I want** sheets that behave the way my phone
behaves **so that** I always know how to get back to what I was looking at.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 8 |
| Depends on | US-E09-03 |
| Traces to | FR-MOB-005, FR-MOB-006, FR-MOB-018, FR-MOB-034, FR-MOB-041, NFR-A11Y-004, NFR-MOB-006 |

**Acceptance criteria**

1. **Given** the sheet component **then** it supports two detents, medium (approximately 50 percent of
   the available height) and large (full available height), and a sheet may declare medium-only,
   large-only or both; details and access sheets default to medium so the underlying list remains
   partly visible.
2. **Given** a resizable sheet **then** it renders a grabber that is >= 48 CSS px in both dimensions,
   cycles detents on tap, and is operable by keyboard and screen reader, which is the single-pointer
   non-dragging alternative SC 2.5.7 requires.
3. **Given** any sheet **then** it dismisses on swipe-down, on the platform back gesture or button, on
   `Escape`, and on a tap on the scrim; a sheet with unsaved input confirms before discarding, naming
   what will be lost.
4. **Given** a sheet is open **then** no second sheet may open: opening another closes the first, and a
   development-mode assertion throws if two sheets mount simultaneously so the rule cannot regress.
5. **Given** any sheet, selection mode or full-screen preview **then** each is a distinct history entry,
   so Android predictive back animates to the right place and the iOS in-app back affordance behaves
   identically; a test asserts the history depth after opening a folder, a sheet and a preview is
   exactly three.
6. **Given** a sheet is open **then** focus is moved into it, focus is trapped inside it, background
   content is `aria-hidden`, and on dismiss focus returns to the exact control that opened it.
7. **Given** a sheet containing a form **then** the focused field and the primary action are both
   visible above the software keyboard, using `env(keyboard-inset-bottom)` with a `visualViewport`
   fallback (SC 2.4.11), and the sheet's own content scrolls while the primary action stays pinned.
8. **Given** a sheet at Medium width and above **then** it is presented as a centred modal dialog or a
   docked inspector, from the same component, with the same focus and dismissal semantics.
9. **Given** sheet content taller than the large detent **then** it scrolls internally with the sheet's
   header and primary action fixed, and the scroll container carries momentum consistent with the
   platform.

**Mobile acceptance criteria**

- On a 360 x 640 viewport, the medium detent leaves at least 280 CSS px of the underlying screen
  visible, so the user retains context.
- Swipe-down to dismiss requires at least 64 CSS px of travel or a velocity threshold, so an
  accidental scroll inside the sheet does not close it; a test scrolls the sheet content to the top and
  continues dragging, confirming the sheet then dismisses (rubber-band handoff).
- Sheet open and close animations are 200 to 250 ms and are replaced by an instant transition when
  `prefers-reduced-motion: reduce` is set.
- No sheet ever covers the offline banner's message text; the banner sits above the scrim.
- With a screen reader on, the sheet is a `dialog` with `aria-modal="true"` and an accessible name, and
  the grabber announces "Resize sheet, currently half height, double tap to expand".
- Backgrounding the app with a sheet open and returning restores the same sheet at the same detent with
  its typed input intact, persisted on `visibilitychange` to hidden.

**Edge cases & negative paths**

- Sheet opened from within a sheet by a legacy code path: blocked by the assertion, and the correct
  pattern (replace content in place, with an internal breadcrumb) is documented in the component's
  README.
- Sheet open when a push notification navigation arrives: the sheet closes first, then navigation
  proceeds, so the user never lands in an orphaned sheet.
- Very small height (landscape phone, 360 px tall): medium detent is skipped and the sheet opens large,
  because a 180 px sheet is unusable.
- Keyboard opens while the sheet is at the medium detent: the sheet promotes to large automatically so
  the form is not squeezed into 120 px.

---

### US-E09-08 — Selection mode and the contextual action bar

**As a** P4 Ashley Kim fixing a misfiled batch from a train **I want** to select nine files with my thumb
and act on all of them **so that** bulk work is not a desktop-only capability.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 5 |
| Depends on | US-E09-04, US-E09-05 |
| Traces to | FR-MOB-009, FR-MOB-041, FR-FILE-038, NFR-A11Y-002, NFR-A11Y-004, NFR-PERF-003 |

**Acceptance criteria**

1. **Given** a list **then** selection mode is entered by a visible "Select" control in the screen
   header or overflow, and never by long-press (which is reserved for the action sheet); once in
   selection mode a checkbox appears on every row and tapping a row toggles its selection instead of
   navigating.
2. **Given** selection mode **then** the bottom action bar is replaced by a contextual action bar
   showing the live count ("3 selected") plus the batch actions permitted for the whole selection, with
   an explicit Cancel that exits selection mode.
3. **Given** the contextual bar **then** it offers Select all and Select none as explicit controls, and
   a range selection is offered as "Select from here to…" on a row's overflow rather than as a drag,
   because a path-based drag has no touch analogue and SC 2.5.1 forbids gesture-only functionality.
4. **Given** a mixed selection (files and folders, or items with different permissions) **then** the
   bar shows only actions valid for every selected item and states the reason when an action is
   unavailable ("Download is off for 2 of these files").
5. **Given** a selection larger than the per-operation cap **then** the bar states the cap and the
   current count and refuses to start rather than failing part-way.
6. **Given** selection mode **then** it is a history entry: the system back exits selection mode before
   navigating away, and exiting restores the previous bottom action bar with the list's scroll position
   unchanged.
7. **Given** a batch action is started **then** the acted-on rows remain visible with per-row progress,
   the bar shows determinate overall progress, and the result is a per-item result list per E04 and
   E08, never a single "some items failed".
8. **Given** a screen reader **then** entering selection mode is announced, each row exposes
   `aria-selected`, the count is announced politely on change (debounced to at most once per second),
   and the contextual bar is reachable as a `toolbar` landmark.

**Mobile acceptance criteria**

- Checkboxes are >= 48 x 48 CSS px, sit on the leading edge, and do not displace the name so far that
  it truncates differently from non-selection mode (the row layout reserves the space in both states,
  so entering selection mode causes zero layout shift).
- Selecting 50 rows in sequence produces no task over 50 ms on the reference device, and the count
  updates within one frame of each tap.
- The contextual bar respects `env(safe-area-inset-bottom)` and its destructive action is at the
  trailing end, separated from the most-used action by at least 16 CSS px.
- At 360 px with five batch actions, labels abbreviate to a single word with the full text as the
  accessible name; at 200 percent text size the bar reduces to three actions plus overflow.
- QA test with a cracked lower-right screen area: every batch action is also available from the
  contextual bar's overflow sheet, which opens from the leading side.

**Edge cases & negative paths**

- An item in the selection is deleted by another user: it is dropped from the selection, the count
  updates, and a polite announcement states "1 selected item is no longer available."
- Navigation into a folder while in selection mode: selection is scoped to a single folder in R1, so
  entering a folder exits selection mode with a confirmation ("Leave selection? 3 items selected") to
  avoid silent loss.
- Select all in a 10,000-item folder: "Select all" selects the whole folder as a server-side scope
  rather than 10,000 client ids, the bar reads "All 10,000 items selected", and the batch endpoint
  accepts the scope form.
- Zero items selected: batch actions are hidden rather than dimmed, and the bar reads "Select items".

---

### US-E09-09 — The destination picker: the touch replacement for drag-and-drop and split view

**As a** P4 Ashley Kim moving files without a mouse **I want** a single sheet in which I can browse to a
destination and drop the selection there **so that** move and copy are not desktop-only.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 8 |
| Depends on | US-E09-07, US-E09-08 |
| Traces to | FR-MOB-041, FR-FILE-021, FR-FILE-038, NFR-A11Y-004, NFR-MOB-006, NFR-PERF-002 |

**Acceptance criteria**

1. **Given** a selection **when** the user chooses "Move to…" or "Copy to…" **then** one sheet opens
   containing an internal breadcrumb, a scrollable list of folders at the current level, a "New folder"
   action, and a primary "Move here" / "Copy here" button naming the destination.
2. **Given** the picker **then** drilling into a folder updates the sheet's content and its internal
   breadcrumb in place; it never opens a second sheet, per the one-sheet rule.
3. **Given** invalid destinations (the source itself, any descendant of a source folder, a folder the
   user cannot write to, the current parent when the operation would be a no-op) **then** they are
   rendered but not selectable, each with a one-line reason, and the primary button is disabled with a
   visible reason line when the current folder is invalid.
4. **Given** HTML5 drag-and-drop **then** it is enabled only inside
   `@media (hover: hover) and (pointer: fine)`, and "Move to…" remains the primary path on every
   pointer type, because a finger does not fire `DragEvent` on Chrome for Android, Firefox Android or
   Samsung Internet, and because SC 2.5.7 requires a non-dragging alternative regardless.
5. **Given** the split-view requirement from the base FM brief **then** at Compact width it is satisfied
   by two mechanisms: the destination picker above, and a persistent staging tray — a slim bar reading
   "3 items ready to move" that survives navigation to the destination folder and offers "Paste here",
   which is the touch analogue of cut, copy and paste.
6. **Given** Medium or Expanded width with Medium height or above **then** a genuine two-pane split view
   is offered as an enhancement, and the picker and tray continue to work unchanged.
7. **Given** the destination is chosen **then** the operation proceeds through the conflict and
   access-change flows in [E08](./epic-08-conflict-resolution-and-data-integrity.md) and
   [E07](./epic-07-sharing-and-access-control.md) within the same sheet, and the sheet closes only when
   the operation is submitted.
8. **Given** the picker is opened for a room-level move **then** it can also target another room the
   user has write access to, with the room named in the breadcrumb root, subject to the cross-room
   rules in E04.

**Mobile acceptance criteria**

- The picker's primary button is pinned to the sheet's bottom edge above `env(safe-area-inset-bottom)`,
  is >= 48 CSS px tall, and names the destination ("Move 3 items to Financials") so the target is
  unambiguous.
- The internal breadcrumb is a horizontally scrollable chip rail with the current folder always visible
  at the trailing end; it never wraps to two lines and never causes page-level horizontal scrolling.
- Loading a level over Slow 4G shows skeleton folder rows matching the final height within 200 ms, and
  the primary button is disabled until the level has loaded so the user cannot commit to an unloaded
  destination.
- The staging tray occupies at most 48 CSS px, sits above the bottom navigation, states the count, and
  offers Cancel; it persists across folder navigation and across app backgrounding, restored from
  durable storage.
- With a screen reader on, the picker announces its current level on each drill-in, invalid rows
  announce their reason, and "New folder" is reachable without leaving the sheet.
- Verified at 360 x 640: the picker shows at least four destination rows plus the breadcrumb plus the
  primary button without scrolling the button off screen.

**Edge cases & negative paths**

- Destination folder created inside the picker collides with an existing name: the conflict sheet
  replaces the picker content in place, resolves, and returns to the picker at the same level.
- Selection includes an item the user loses permission on while the picker is open: on commit, the
  per-item result reports it and the rest proceed.
- Offline: the picker uses the cached tree, states "Showing folders you have opened before", and the
  operation is queued per US-E08-17 with the tray marker on the affected rows.
- Very deep destination (depth 31): the picker allows selection but the operation is refused for path
  length with the specific message from E08, and the picker shows the resulting path length before
  commit.

---

### US-E09-10 — Keyboard avoidance and focus that is never obscured

**As a** P1 Marcy Doyle renaming a folder one-handed **I want** the field and the Save button to stay
visible when the keyboard is up **so that** I do not have to close the keyboard to find the button.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 5 |
| Depends on | US-E09-07 |
| Traces to | FR-MOB-018, FR-MOB-034, NFR-A11Y-004, NFR-MOB-002, NFR-COMPAT-001 |

**Acceptance criteria**

1. **Given** any form, sheet or dialog **when** a field receives focus and the software keyboard opens
   **then** the focused field and the form's primary action are both fully visible, implemented with
   `env(keyboard-inset-bottom)` where available and a `visualViewport` resize listener as the fallback.
2. **Given** any sticky element (bottom bar, contextual bar, upload progress bar, toast, open sheet)
   **then** no element receiving keyboard focus is entirely hidden behind it (SC 2.4.11), enforced by
   `scroll-padding-bottom` sized to the tallest active sticky element plus the safe-area inset.
3. **Given** an automated test suite **then** it walks the focus order of every screen at 360 x 640
   with a simulated 300 px keyboard and asserts that each focused element's bounding box is at least 90
   percent visible; the suite fails the build otherwise.
4. **Given** the keyboard opens **then** the layout does not reflow the width class (measurements come
   from the visual viewport height only), so the screen does not switch layouts mid-typing.
5. **Given** the keyboard closes **then** the previous scroll position is restored and no content jumps.
6. **Given** a multi-field form **then** the keyboard's next/previous accessory controls move between
   fields in DOM order, `enterkeyhint` is set appropriately per field, and the final field's
   `enterkeyhint` is `done` and submits.
7. **Given** an error appears under a focused field **then** the field, the error text and the primary
   action remain visible together; if all three cannot fit, the error is shown above the field.

**Mobile acceptance criteria**

- Verified on physical devices on both platforms, because iOS Safari and Chrome for Android report
  keyboard geometry differently; the QA step names both.
- With a hardware keyboard attached to a phone (no software keyboard), the layout does not reserve
  space, and the focus ring is visible on every focusable element.
- With a third-party keyboard that includes a suggestion strip (taller than the system keyboard), the
  layout adapts to the reported inset rather than to a hard-coded height.
- Rotating the device while the keyboard is open keeps focus in the same field with the caret position
  preserved.
- With a screen reader on, opening the keyboard does not move focus, and the announced context does not
  change.

**Edge cases & negative paths**

- Keyboard that overlays without reporting an inset (older WebView): the fallback shrinks the sheet's
  content area by a measured delta from `visualViewport.height`, and a manual QA case covers it.
- Split keyboard or floating keyboard on iPad: the inset is zero or partial, and the layout does not
  add phantom padding.
- Field inside a scrollable sheet inside a scrollable page: only the innermost scroller adjusts, and a
  test asserts no double-scroll jump.
- Autofill dropdown covering the primary action: the action remains reachable because the sheet reserves
  space for the accessory area, and dismissing autofill does not lose the typed value.

---

### US-E09-11 — Sticky breadcrumb rail and the collapsed path chip

**As a** P3 Tomás Ferreira three levels deep in a room **I want** to always see where I am and jump back
in one tap **so that** I never lose my place on a small screen.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 3 |
| Depends on | US-E09-03 |
| Traces to | FR-MOB-011, FR-FLDR-012, NFR-A11Y-002, NFR-A11Y-004, NFR-I18N-001 |

**Acceptance criteria**

1. **Given** any folder screen **then** the breadcrumb is a horizontally scrollable chip rail in the
   sticky header, with the current folder always visible at the trailing end and the room at the
   leading end.
2. **Given** the rail does not fit **then** it collapses the middle to a single tappable overflow chip
   ("…") that opens a sheet listing the full ancestor chain, each row tappable to jump; the room chip
   and the current folder chip are never collapsed.
3. **Given** the rail **then** it never wraps to a second line and never causes page-level horizontal
   scrolling; it scrolls inside its own `overflow-x: auto` container with the trailing end initially in
   view.
4. **Given** an up-one-level affordance **then** it is present as a distinct control (the in-app back in
   standalone mode, and the leading chip otherwise), so going up does not require finding a chip.
5. **Given** the breadcrumb **then** it is exposed as a `nav` with an accessible name "Breadcrumb", the
   chips are a list, and the current folder carries `aria-current="page"`.
6. **Given** a recipient on a share link **then** the rail is rooted at the link's scope and shows no
   ancestor above it, per [US-E07-02](./epic-07-sharing-and-access-control.md) criterion 3.
7. **Given** a right-to-left locale **then** the rail's direction, chevrons and scroll affordance mirror
   correctly, and mixed-direction folder names render with bidirectional isolation.

**Mobile acceptance criteria**

- Each chip's hit area is >= 44 x 44 CSS px tall (the rail's own height may be 44 px to conserve
  vertical space, which is the one documented exception to the 48 px rule, justified by SC 2.5.8's
  24 px floor plus adequate spacing) with >= 8 CSS px separation.
- At 360 px with a path of depth 8, the rail shows the room chip, the overflow chip and the current
  folder chip, and the current folder name is truncated in the middle if necessary rather than hidden.
- The rail stays visible while the list scrolls; the header's secondary row may collapse but the rail
  may not.
- At 200 percent text size, the rail keeps a single line and relies on scrolling plus the overflow
  sheet rather than growing to two lines.
- With a screen reader on, the rail is skippable as a single landmark, and the overflow chip announces
  "Show 6 more folders in this path".

**Edge cases & negative paths**

- Extremely long single folder name (200 characters): the current chip truncates in the middle and its
  full name is the accessible name and is shown in the overflow sheet.
- Path changed under the user (an ancestor renamed): the rail updates in place with a brief "Renamed"
  marker, per US-E08-13.
- Room root: the rail shows only the room chip and the up-one-level control is replaced by "Back to my
  rooms".
- Depth beyond 32 (impossible by rule, but tested): the rail degrades to overflow-only rather than
  breaking.

---

### US-E09-12 — Loading, skeletons, empty states and long-list landmarks

**As a** P2 Dev Raman on a slow train connection **I want** the screen to show its shape immediately and
never lose my place in a long list **so that** I can tell the difference between loading and empty.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 8 |
| Depends on | US-E09-05, US-E09-02 |
| Traces to | FR-MOB-015, FR-MOB-016, FR-MOB-020, NFR-PERF-001, NFR-PERF-002, NFR-A11Y-004, NFR-SCALE-001 |

**Acceptance criteria**

1. **Given** any list or sheet whose content has not arrived within 200 ms **then** skeleton
   placeholders matching the final layout's exact row heights and element positions are rendered, so
   replacing them with content produces a CLS contribution of 0, asserted in CI.
2. **Given** a long list **then** infinite scroll is never the only model: the screen carries a
   persistent "n of N items" count, sort and filter controls, search-in-folder, a sticky breadcrumb
   header and an explicit "Load more" control at the end of each loaded page.
3. **Given** the user navigates into a child folder or opens a preview and returns **then** the list's
   scroll position is restored to the same row, not the same pixel offset, and the previously loaded
   pages are still loaded; a test scrolls to row 300 of 1,000, navigates away and back, and asserts row
   300 is the first visible row.
4. **Given** pull-to-refresh **then** it is available on every scrollable list, and a Refresh action is
   also present in that screen's overflow, because a gesture may never be the only route.
5. **Given** an empty state **then** it names the cause and the next action, and the three cases are
   visually distinct: empty folder ("Nothing here yet" plus Upload and New folder), no search results
   ("No files match 'lease'" plus Clear filters), and error ("We could not load this folder" plus
   Retry). A spinner that never resolves is a defect.
6. **Given** a loading list **then** the count is not shown as 0; it is shown as a skeleton until the
   real total is known, because "0 items" during loading is a false statement.
7. **Given** a refresh **then** it does not scroll the user to the top and does not reorder rows under
   the thumb; new rows are marked "New" for 5 seconds per US-E08-13.
8. **Given** any status change **then** it is announced through the polite live region from US-E09-13
   ("Loading more items", "Showing 100 of 1,240 items").

**Mobile acceptance criteria**

- Pull-to-refresh requires >= 64 CSS px of travel, shows a determinate indicator, does not trigger from
  a horizontal drag, and does not conflict with the browser's own overscroll refresh on Android (the
  list container uses `overscroll-behavior: contain`).
- On a Slow 4G profile, the skeleton appears within 200 ms of navigation and the first real rows within
  the LCP budget; a captured trace shows no layout shift at the swap.
- "Load more" is >= 48 CSS px tall, full width, and states what it will load ("Load 50 more").
- Scroll restoration works after the page has been frozen and restored by the browser, because state is
  persisted on `visibilitychange` to hidden.
- With reduced motion set, skeletons do not shimmer; they render as static blocks.
- With a screen reader on, the list announces its total via `aria-rowcount`, and "Load more" announces
  the resulting range after loading.

**Edge cases & negative paths**

- Folder emptied by another user while the list is open: the empty state replaces the rows with an
  explanation ("This folder is now empty. Ashley Kim removed the last item.") rather than a bare empty
  state.
- Error on the second page only: the loaded rows stay, and an inline retry row appears at the end
  rather than the whole list becoming an error state.
- 10,000-item folder: virtualisation keeps DOM nodes under 60, memory under the E10 budget, and the
  count is exact rather than "many".
- Very slow response (30 s): after 10 s the skeleton is accompanied by "This is taking longer than
  usual" plus Retry, and never becomes a silent permanent skeleton.

---

### US-E09-13 — Toast, undo and the status announcer

**As a** P6 Ray Okonkwo working with gloves on **I want** every action to confirm itself and every
reversible one to be undoable **so that** a mis-tap costs me one tap, not a document.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 5 |
| Depends on | US-E09-03 |
| Traces to | FR-MOB-021, FR-MOB-035, FR-FLDR-013, NFR-A11Y-004, NFR-MOB-006, BR-176 |

**Acceptance criteria**

1. **Given** any reversible action **then** it is confirmed by a toast carrying an Undo control, and the
   toast states what happened with counts where relevant ("Moved 4 items to Financials").
2. **Given** an undo window **then** it is 6 seconds for non-destructive actions and 10 seconds for
   destructive ones, the remaining time is conveyed by a determinate visual timer, and the timer pauses
   while the toast has focus, while a screen reader is reading it, or while the user is touching the
   screen.
3. **Given** the toast **then** it sits above the bottom action bar plus `env(safe-area-inset-bottom)`,
   never covers the focused element, never covers the bottom bar's primary action, and never covers the
   row it refers to.
4. **Given** Undo is activated **then** the reversal is a server operation with its own idempotency key,
   its result is confirmed by a second toast ("Restored 4 items"), and a failed undo is reported
   explicitly ("We could not undo that") rather than silently.
5. **Given** an irreversible action **then** no Undo is offered and the toast says so ("Permanently
   deleted. This cannot be undone."), so the presence of Undo is a reliable signal.
6. **Given** the status announcer **then** the app has exactly one polite live region for progress and
   outcomes and one assertive region for errors that stop the task; every status message in the product
   routes through them, including "Uploading 3 of 12 — 41%", "Upload paused, reopen the app to
   continue", "Moved 4 items", "Folder deleted, undo available", "Link revoked", "Storage 8.2 GB of 10
   GB used" and "Loading more items".
7. **Given** rapid successive actions **then** toasts coalesce rather than stack: at most one toast is
   visible, and a second action replaces the first with its own timer, while the first action's undo
   remains available from the action's row for the remainder of its window.
8. **Given** navigation away from the screen **then** the toast and its Undo survive one navigation
   within the same room, because a user often navigates immediately after acting.

**Mobile acceptance criteria**

- The Undo control is >= 48 x 48 CSS px, sits at the trailing end of the toast, and is separated from
  any dismiss control by >= 8 CSS px.
- At 360 px the toast is a single line plus the Undo control for messages up to 48 characters, and wraps
  to two lines beyond that without clipping Undo.
- At 200 percent text size the toast grows and Undo moves to its own row rather than being pushed off
  screen.
- Announcements are debounced so progress updates announce at most once every 2 seconds, because a
  screen-reader user cannot use a list that announces on every percentage point.
- With reduced motion set, toasts appear and disappear without slide animation.
- If the app is backgrounded while a toast with an active undo is showing, the undo is no longer offered
  on return (the window has elapsed) and the action's result is instead available in the room's activity
  feed; the copy never implies an undo that no longer exists.

**Edge cases & negative paths**

- Undo tapped after the window elapsed due to a slow render: the server returns 410 and the toast
  becomes "Too late to undo. Restore it from Trash instead."
- Two undos available at once (rapid destructive actions): only the most recent is in the toast; the
  older is available from the Trash screen, and the toast for the second states "1 earlier deletion is
  in Trash".
- Screen reader focus is inside a sheet when a toast appears: the polite announcement is queued and the
  toast is not focusable by default, so it does not steal focus mid-task.
- Toast during an active upload progress bar: both are visible, stacked, and their combined height plus
  the bottom bar does not exceed 25 percent of a 640 px viewport.

---

### US-E09-14 — The destructive-action confirmation pattern

**As a** P4 Ashley Kim one tap away from deleting a live deal's document set **I want** one consistent
confirmation that states exactly what will be destroyed **so that** a mis-tap on a small screen cannot
cost me a mandate.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 5 |
| Depends on | US-E09-07, US-E09-13 |
| Traces to | FR-MOB-004, FR-FLDR-010, FR-FLDR-011, NFR-A11Y-004, NFR-SEC-001, BR-172, BR-174, BR-176 |

**Acceptance criteria**

1. **Given** any destructive action **then** it uses this one component, which renders: a title naming
   the item, a blast-radius block stating server-supplied counts (subfolders, files, total bytes,
   affected shares), a consequence sentence including the retention or irreversibility statement, a
   destructive commit control, and Cancel.
2. **Given** the counts **then** they come from the server at the moment the confirmation opens; the
   commit control is disabled until they arrive, and a confirmation that cannot show counts cannot
   commit.
3. **Given** the counts change before commit **then** the request is rejected with 409 and the
   confirmation re-renders with the new counts, so a user never confirms a number that is no longer
   true.
4. **Given** the blast radius exceeds the threshold (Assumption: more than 25 items, or any active
   share affected, or a permanent deletion) **then** a second, explicitly distinct confirmation gesture
   is required within the same sheet: a separate section whose commit control is at the opposite end of
   the sheet from the first, so a double-tap cannot complete both steps.
5. **Given** the commit control **then** the action fires on the up-event with an abort path if the
   finger slides off before release (SC 2.5.2), and press-and-hold is explicitly not used as a
   confirmation mechanism.
6. **Given** the action completes **then** a toast with Undo is shown for 10 seconds for soft-delete
   paths, and for irreversible paths the toast states that no undo exists.
7. **Given** the destructive control **then** it is styled destructive, is placed at the end of the
   sheet, and is never the control nearest the thumb's resting position after the sheet opens; the
   component measures and enforces this by layout, not by convention.
8. **Given** a screen reader **then** the destructive control's accessible name contains the blast
   radius ("Delete 3 folders and 47 files, cannot be undone for 30 days"), so a user who jumps straight
   to the button still hears the consequence.

**Mobile acceptance criteria**

- The counts are the largest text in the sheet (>= 20 CSS px), meet 4.5:1 contrast, and are legible at
  arm's length in sunlight as a manual QA check.
- At 360 x 640 the whole confirmation fits without scrolling for the common case; where it must scroll,
  the commit control is pinned and the counts remain visible above it.
- The commit control is >= 48 CSS px and separated from Cancel by >= 16 CSS px, which is double the
  standard gap, because this is the highest-consequence pair in the product.
- Backgrounding after commit but before the response: the operation completes server-side and its
  result plus a still-valid undo (extended to 30 seconds in this path) is shown as a persistent notice
  on next open.
- Offline: the confirmation states "You are offline. This will be queued and applied when you
  reconnect" for queueable deletes, and refuses outright for permanent deletion.
- With reduced motion, the second-step section appears without animation.

**Edge cases & negative paths**

- Counts request fails: the sheet shows "We could not check what this will delete" plus Retry, and the
  commit control stays disabled. A destructive action never proceeds without counts.
- Item already deleted by someone else: 404 and the sheet becomes "That item was already deleted",
  with a link to Trash.
- Extremely large blast radius (8,000 items): the counts are exact and the sheet adds "This is a large
  deletion" plus the second step; the operation runs asynchronously with progress.
- User with permission to delete but not to permanently delete: the permanent option is absent, not
  dimmed.

---

### US-E09-15 — Screen-reader semantics, roving tabindex and full keyboard operation

**As a** P3 Tomás Ferreira using an external keyboard, and any user of a screen reader **I want** every
function to be operable without a touch gesture **so that** the product is usable by everyone and by
anyone with a keyboard attached.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 8 |
| Depends on | US-E09-05, US-E09-07, US-E09-08 |
| Traces to | FR-MOB-034, FR-MOB-036, FR-MOB-037, FR-MOB-038, FR-MOB-040, FR-MOB-041, NFR-A11Y-001, NFR-A11Y-002, NFR-A11Y-004, NFR-A11Y-005 |

**Acceptance criteria**

1. **Given** every function in the product **then** it is operable from a keyboard alone (SC 2.1.1),
   including on a phone with a keyboard attached; an automated test drives every screen's primary
   journeys with keyboard events only.
2. **Given** a list or grid of items **then** it implements roving tabindex: the list is one tab stop,
   arrow keys move between rows (and between columns in tiles view), `Home` and `End` jump to the ends,
   type-ahead jumps to the first row whose name starts with the typed characters, `Space` toggles
   selection, `Enter` activates, and `Shift+Arrow` extends a range.
3. **Given** the same list **then** the roving-tabindex structure is exactly the structure a screen
   reader traverses, so the two are implemented once; each row exposes name, type, size, modified date,
   shared state and selection state.
4. **Given** every icon-only control **then** its accessible name contains its visible label text where
   one is shown, and a descriptive name where none is (SC 2.5.3), so voice control activates it by the
   name the user reads; the ambiguous pairs (move versus copy, share versus export, link versus
   permissions, archive versus delete) are all labelled, never glyph-only.
5. **Given** focus **then** a visible focus indicator is present on every focusable element with a
   contrast ratio of at least 3:1 against both the element and the adjacent background, and it is never
   removed by a reset.
6. **Given** any multipoint or path-based gesture in the product (pinch-zoom in the viewer, swipe to
   next page, swipe row actions, sheet drag) **then** a single-pointer, non-path alternative exists and
   is documented in the gesture dictionary (SC 2.5.1 and 2.5.7).
7. **Given** the core shortcut set **then** it is active only when a physical keyboard is detected and
   covers: `/` search, `n` new folder, `u` upload, `r` rename, `Delete` delete, `m` move, `c` copy,
   `Escape` close sheet or exit selection mode, `?` shortcut sheet, `g` then `h` go home. Shortcuts are
   listed in the shortcut sheet and in the desktop main menus, never in context menus.
8. **Given** a modal sheet or dialog **then** focus enters it, is trapped, and returns to the invoking
   control on close; the page behind is `aria-hidden` and not reachable by tab.
9. **Given** the automated accessibility suite (axe-core or equivalent) **then** it runs on every screen
   in both themes at 360 px and 1280 px in CI, and any violation of a WCAG 2.2 A or AA rule fails the
   build.

**Mobile acceptance criteria**

- Manual pass with VoiceOver on iOS and TalkBack on Android for the five core journeys (open a room,
  navigate a folder, preview a file, share a file, delete a folder), documented as a signed-off
  checklist per release.
- Swipe navigation with a screen reader requires exactly one swipe per row, and the row's actions are
  reachable without entering a rotor menu.
- With an external keyboard on a phone, the focused row is never hidden behind the bottom bar, an open
  sheet, a toast or the software keyboard (SC 2.4.11), verified at 360 x 640.
- Type-ahead in a list works with the on-screen keyboard closed when a hardware keyboard is present,
  and is replaced by the search box as the equivalent affordance on touch.
- Reduced motion is respected in focus transitions: focus moves without a smooth-scroll animation.

**Edge cases & negative paths**

- Virtualised list and screen-reader traversal: `aria-rowcount` and `aria-rowindex` report true
  positions in the full folder, and rows outside the render window are reachable because traversal
  triggers loading rather than dead-ending.
- Voice control saying "tap Move" where two Move controls are visible (bar and sheet): the sheet's
  control takes precedence because the sheet is modal, and the bar's control is not exposed while a
  sheet is open.
- Screen reader with a Braille display: no information is conveyed by colour, animation or position
  alone; a review checklist covers each status treatment.
- Keyboard user in selection mode: `Escape` exits selection mode before it closes the page, matching
  the back-gesture order in US-E09-03.

---

### US-E09-16 — Dynamic type, reflow, orientation, reduced motion, and honest capability copy

**As a** P5 Ingrid Sørensen with large text set on her phone **I want** the product to work at my text
size and to tell me the truth about what it can do **so that** I neither squint nor trust a promise the
platform cannot keep.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 8 |
| Depends on | US-E09-01, US-E09-02 |
| Traces to | FR-MOB-022, FR-MOB-023, FR-MOB-030, FR-MOB-031, FR-MOB-032, FR-MOB-033, FR-MOB-043, NFR-A11Y-001, NFR-COMPAT-001, NFR-PRIV-002 |

**Acceptance criteria**

1. **Given** text scaled to 200 percent **then** every screen remains fully usable with no clipped
   control, no lost action and no two-dimensional scrolling (SC 1.4.4), verified by a parameterised test
   at 100, 150 and 200 percent across all screens at 360 px.
2. **Given** a 320 CSS px viewport **then** content is presented without loss of information or
   functionality and without two-dimensional scrolling (SC 1.4.10); wide content scrolls inside its own
   container.
3. **Given** the platform text-size setting **then** the app honours it (relative units throughout, no
   `px` font sizes, no viewport-locked typography, no `user-scalable=no`), and a user's in-app text-size
   preference from US-E09-18 multiplies on top of it rather than replacing it.
4. **Given** `prefers-reduced-motion: reduce` **then** all non-essential motion and parallax is removed:
   sheet transitions become instant, skeletons stop shimmering, list reorders do not animate, and
   progress indicators remain determinate but static in their decoration.
5. **Given** orientation **then** no screen is locked or gated (SC 1.3.4), and landscape phone
   (Medium width, Compact height) is an explicitly tested layout rather than an accident.
6. **Given** the offline state **then** a persistent banner states what remains available ("You are
   offline. You can read files you have already opened and queue changes."), and it is removed
   automatically on reconnection.
7. **Given** a connection that is present but degraded **then** a distinct indicator is shown ("Slow
   connection. Loading may take longer.") and a degraded connection is never presented as an outage.
8. **Given** the honesty rules **then** the product never claims a capability the platform does not
   grant, and these exact substitutions are enforced by a copy review and by a lint rule over the
   string catalogue:

   | Never say | Say instead | Because |
   | --- | --- | --- |
   | "Uploading in the background" | "Paused — reopen the app to continue" | Background Fetch is Chrome-only and absent on iOS and in WebViews; a frozen page cannot run fetch callbacks. |
   | "Available offline" (as durable storage) | "Cached copy, may be cleared by your browser" | WebKit deletes script-created storage for an origin with no interaction in seven days, and eviction is all-or-nothing across IndexedDB, Cache and OPFS. |
   | "Saved to your device" with a path | "Saved to your Downloads folder (Files app)" | A web page is never told where an iOS download landed and gets no completion callback. |
   | "Screenshots are blocked" | "Pages show the viewer's email, so copies can be traced" | The web platform cannot prevent screenshots. |
   | "Locked with Face ID" | "Confirm it is you to continue" | There is no web API that forces a biometric check on resume; it is a re-authentication ceremony, not an OS lock. |
   | "Syncing your camera roll" | "Choose the photos you want to add" | Photo pickers are selection-scoped by design on both platforms; library enumeration is not available. |

9. **Given** the PWA install path **then** on platforms with no install prompt (iOS) the app teaches the
   exact steps in-product ("Tap Share, then Add to Home Screen") and never renders a non-functional
   Install button.

**Mobile acceptance criteria**

- At 200 percent text size on a 360 px viewport, the folder listing, the share sheet, the conflict sheet
  and the delete confirmation are each verified by screenshot: no truncated action label, no control
  off-screen, no overlapping text.
- The offline banner occupies at most 56 CSS px, sits directly below the sticky header, does not cover
  the breadcrumb, and its message is announced politely once on state change.
- The degraded-connection indicator is derived from measured request latency and throughput rather than
  from `navigator.connection` alone, because effective type is unreliable; the threshold is documented
  (Assumption: p50 request latency over 1.5 s or throughput under 200 Kbps over a 10 s window).
- With reduced motion set, a manual QA pass confirms no animation exceeds an opacity change anywhere in
  the product.
- The install-teaching row appears at most once per 30 days, is dismissible, never blocks content, and
  never appears on a recipient's first visit through a share link.

**Edge cases & negative paths**

- Platform text size beyond 200 percent (iOS accessibility sizes): the layout continues to grow and
  scroll rather than clipping; the pass criterion above 200 percent is "no data loss", not "no
  scrolling".
- User with both reduced motion and a screen reader: announcements are unaffected by motion settings.
- Offline banner and degraded banner both applicable: only the offline banner is shown, because it is
  strictly worse news.
- Copy added in a future release that violates the honesty table: the string-catalogue lint fails the
  build with the offending key named.

---

### US-E09-17 — Row swipe actions and haptics, as shortcuts only

**As a** P1 Marcy Doyle who deletes a lot of duplicates **I want** an optional swipe shortcut and a
physical confirmation **so that** frequent actions are faster without becoming the only way to do them.

| | |
|---|---|
| Priority | Should |
| Release | R2 |
| Estimate | 5 |
| Depends on | US-E09-05, US-E09-13 |
| Traces to | FR-MOB-012, FR-MOB-013, FR-MOB-014, FR-MOB-019, NFR-A11Y-004, NFR-MOB-006 |

**Acceptance criteria**

1. **Given** a list row **then** at most one swipe action exists per direction: trailing swipe reveals
   Delete (destructive), leading swipe reveals Share; every swipe action is duplicated in that row's
   overflow, so swipe is never a mechanism.
2. **Given** a horizontal drag that begins within 24 CSS px of either screen edge **then** it is not
   treated as a row swipe, so the Android system back gesture and the browser's edge gestures are never
   intercepted; a device test confirms back still works from both edges on every list.
3. **Given** a swipe action **then** it completes on release, not on the down-event or on crossing a
   threshold mid-drag, and releasing below the threshold springs back with no action (SC 2.5.2).
4. **Given** a destructive swipe **then** it uses the confirmation pattern from US-E09-14 when the blast
   radius warrants it, always produces a 10-second undo toast, and the acted-on row remains visible
   while the undo is available (never scrolled away or collapsed), because NN/g documents that a swipe
   commonly hides the very item being acted on.
5. **Given** more than one action per direction would be needed **then** swipe is dropped for that list
   entirely rather than fanning one gesture across several outcomes.
6. **Given** haptics **then** a short pulse is emitted on entering selection mode, on committing a
   destructive action and on a failed action, only on platforms exposing the Vibration API, and never as
   the sole feedback for anything.
7. **Given** the system reduced-motion setting or a platform haptics setting is off **then** no haptic
   is emitted, and the absence of haptics never changes what the user can do or perceive.
8. **Given** iOS Safari, where the Vibration API is unavailable **then** haptics are simply absent, no
   fallback is faked, and no copy references vibration.

**Mobile acceptance criteria**

- Swipe requires >= 72 CSS px of horizontal travel and a horizontal-to-vertical ratio above 2:1 before
  it engages, so a diagonal thumb drag scrolls the list instead of revealing an action.
- The revealed action's target is >= 48 CSS px wide with a visible text label, not an icon alone.
- With a screen reader on, swipe is not exposed as a gesture; the row's actions are reached through the
  overflow, and the swipe affordance is `aria-hidden`.
- A QA test with a cracked screen edge confirms that no swipe is required to complete any task.
- Haptic pulses are <= 20 ms and are never repeated more than once per action, verified on a physical
  Android device.

**Edge cases & negative paths**

- Swipe started on a row that is removed mid-gesture: the gesture is cancelled and the list does not
  jump.
- Two rows swiped in quick succession: only one row may be open at a time; opening a second closes the
  first with no action taken.
- Right-to-left locale: leading and trailing swipe directions mirror, and the destructive direction
  follows the trailing edge in both.
- Swipe on a row the user has no permission to act on: no action is revealed, and the row springs back
  with a polite announcement stating why once per session.

---

### US-E09-18 — Personalisation and the desktop enhancement layer

**As a** P4 Ashley Kim at a MacBook and P6 Ray Okonkwo on a bright site **I want** to tune accent,
density and text size, and to get real keyboard power and the tree and split views on a big screen
**so that** mobile-first does not mean capped at a toy when I am doing real work.

| | |
|---|---|
| Priority | Should |
| Release | R2 |
| Estimate | 8 |
| Depends on | US-E09-01, US-E09-02, US-E09-15 |
| Traces to | FR-MOB-010, FR-MOB-027, FR-MOB-029, FR-MOB-039, NFR-A11Y-001, NFR-COMPAT-001, NFR-MAINT-001 |

**Acceptance criteria**

1. **Given** appearance settings **then** the user can choose an accent from a curated set (Assumption:
   six options), a list density (comfortable or compact) and a text size (100, 112 or 125 percent),
   persisted per account via `PATCH /me` and applied immediately without a reload.
2. **Given** any accent option **then** every state derived from it (default, hover, pressed, focus
   ring, on-accent text) is validated for contrast in both light and dark schemes by an automated test,
   and an accent that fails is not shippable.
3. **Given** compact density **then** every interactive target remains >= 48 CSS px and every gap
   remains >= 8 CSS px; density changes row height and internal padding, never target size.
4. **Given** the in-app text size **then** it multiplies the platform setting rather than replacing it,
   and the 200 percent usability requirement in US-E09-16 is re-verified at the 125 percent in-app
   setting combined with the platform's largest size.
5. **Given** a physical keyboard is detected **then** the extended shortcut set is enabled and a
   shortcut sheet is available from `?` and from the Help overflow, listing every shortcut grouped by
   task; shortcuts are shown in desktop main menus and never inside context menus.
6. **Given** Expanded width and Medium height or above **then** the desktop enhancements light up: the
   folder tree in a navigation rail (with the drill-down list still available), the docked preview
   inspector replacing the details sheet, the two-pane split transfer view, marquee selection with
   `Shift`-click ranges and `Cmd`/`Ctrl`-click toggles, HTML5 drag-and-drop as an additional move path,
   and the permission matrix table from E07.
7. **Given** every desktop enhancement **then** its touch equivalent remains present and functional at
   that width, so a touchscreen laptop user is never forced into a mouse-only path, and each enhancement
   is driven by the same command registry as its touch counterpart.
8. **Given** the tree rail **then** it is never rendered at Compact width, because deep indentation
   inside 320 CSS px forces horizontal scrolling and twisties fall below the target-size floor; a test
   asserts the tree is absent below 840 px.
9. **Given** appearance settings **then** they are also honoured on the recipient path for a signed-in
   recipient, and default to system for an anonymous link visitor.

**Mobile acceptance criteria**

- The appearance settings screen is fully operable at 360 x 640: accent swatches are >= 48 CSS px with
  >= 8 CSS px gaps and carry text names, not colour alone; the current selection is marked with a
  checkmark, not only a border.
- Changing density or text size preserves the user's current screen and scroll position and causes no
  more than one layout pass, with no long task over 50 ms on the reference device.
- A live preview row shows a sample file row in the chosen density and text size inside the settings
  screen, so the choice is legible before it is applied.
- With a screen reader on, each accent option announces its name and selected state, and the text-size
  control announces the resulting scale ("Text size 112 percent").
- On a phone with an external keyboard, the shortcut sheet is reachable from `?` and its content fits
  360 x 640 with internal scrolling and a pinned close control.

**Edge cases & negative paths**

- Accent chosen that clashes with the destructive colour: the palette reserves the destructive hue and
  no accent option is permitted within a defined hue distance of it, asserted by a test.
- Platform text size already at maximum plus in-app 125 percent: the layout scrolls and no data is
  lost; the settings screen warns "Combined with your phone's text size, some screens will scroll
  more."
- Keyboard detected then removed (Bluetooth disconnect): shortcuts are disabled and the shortcut sheet
  entry disappears, with no lingering key handlers.
- Touchscreen laptop at 1280 px: both the tree rail and the drill-down list are available, and the
  bottom action bar is replaced by the toolbar while long-press still opens the item sheet.

---

## Out of scope for this epic

| Topic | Where it lives |
| --- | --- |
| Any domain behaviour: what a folder is, what a share does, what a conflict means | [E02](./epic-02-data-rooms-and-workspace-home.md), [E03](./epic-03-folder-hierarchy-and-navigation.md), [E07](./epic-07-sharing-and-access-control.md), [E08](./epic-08-conflict-resolution-and-data-integrity.md) |
| Performance budgets, their instrumentation, CI gates and real-user monitoring (this epic must fit inside them and asserts component-level limits only) | [E10](./epic-10-performance-offline-and-scale.md) |
| List virtualisation, cursor pagination and prefetch internals (this epic owns the list's landmarks and semantics) | [E10](./epic-10-performance-offline-and-scale.md) |
| The preview pipeline, the preview support matrix and the viewer's zoom and page-jump behaviour (this epic owns the sheet and full-screen presentation) | [E05](./epic-05-viewing-preview-and-file-details.md) |
| Web push delivery, the notification centre and per-room preferences (this epic owns the permission-request rule and the honesty copy) | [E11](./epic-11-trust-audit-and-notifications.md) |
| Authentication forms and session behaviour (this epic owns their keyboard-avoidance and target-size rules) | [E01](./epic-01-access-and-identity.md) |
| Native iOS and Android shells | Explicitly a later, separately scoped option. Recorded as OQ93. |
| A published external design system or component library for third parties | Not in R1 to R3. Recorded as OQ95. |

## Open questions

| ID | Question | Owner | Needed by |
| --- | --- | --- | --- |
| OQ89 | Long-press is specified to open the action sheet, with a visible Select control for selection mode. Dropbox and iOS Files use long-press to enter selection instead. Which does the beachhead expect? The decision must be made once and applied everywhere. | Product + design partners | Before US-E09-06 build |
| OQ90 | Is the breadcrumb chip rail permitted to use 44 CSS px targets (the documented exception) or must it hold the 48 px rule at the cost of vertical space on a 640 px screen? | Design + accessibility review | Before US-E09-11 build |
| OQ91 | What is the correct undo window on a phone: 6 seconds is the common convention, but a user in a car park may not look at the screen for 20 seconds. Should destructive undo be 10 s, 30 s, or persist until the next navigation? | Product + design partners | Before R1 code freeze |
| OQ92 | Should selection mode persist across folder navigation (enabling cross-folder batch moves) or stay scoped to one folder? Cross-folder selection is powerful for P4 and dangerous for everyone else. | Product + Engineering | R2 planning |
| OQ93 | At what evidence threshold do we build native shells? The capability gaps that would justify it are background upload, file-system access, push on iOS in a browser tab and biometric re-unlock. | Product + Engineering | R3 planning |
| OQ94 | Do we need a haptics setting of our own, or is respecting the platform setting sufficient? Field personas work with gloves where haptics matter more than visuals. | Product + design partners | R2 |
| OQ95 | Is the interaction system published as external documentation (a marketing asset, per the whitespace analysis) or kept internal? Publishing it is part of the differentiation argument. | Product + Marketing | R2 |
