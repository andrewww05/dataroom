# Mobile-First UX Specification

## Purpose

This is the file a designer and a front-end engineer build from for the internal data room the
company operates for its own staff and for the external recipients those staff share with. It
defines the interaction system that every other epic depends on: the size classes, the thumb
zones, the translation of every desktop file-manager primitive into a touch-native equivalent,
the screen inventory with wireframes and states, the gesture dictionary, the sheet rules, the
motion and haptics budget, the offline state machine, the theming tokens, and the accessibility
and review gates a story must pass before it is Done.

Two things this document is not. It is not a visual design: no hex values are prescribed beyond
contrast constraints, and no typography scale is fixed here. And it is not a list of suggestions:
sizes, durations, detents and gesture assignments below are binding, because an interaction
system that each screen interprets differently is not a system.

The governing constraint is the one from the brief. Every requirement is specified for a small
touch screen **first**, then progressively enhanced. Every desktop-only primitive in the base
file-manager list gets an explicit mobile-native equivalent. "Not available on mobile" is not an
acceptable answer for any of them, and "we shrank the desktop control" is not an equivalent.

## Related documents

- [Documentation index](./README.md)
- [Personas & JTBD](./02-personas-and-jtbd.md)
- [Product overview](./03-product-overview.md)
- [Epics](./04-epics.md)
- [Functional requirements](./05-functional-requirements.md)
- [Business rules & permissions](./06-business-rules-and-permissions.md)
- [Non-functional requirements](./07-non-functional-requirements.md)
- [Domain model & glossary](./09-domain-model-and-glossary.md)
- [Success metrics & analytics](./10-success-metrics-and-analytics.md)
- [Mobile UX Foundations stories](./backlog/epic-09-mobile-ux-foundations.md)
- [Folder Hierarchy & Navigation stories](./backlog/epic-03-folder-hierarchy-and-navigation.md)
- [File Operations stories](./backlog/epic-04-file-operations.md)
- [Viewing, Preview & File Details stories](./backlog/epic-05-viewing-preview-and-file-details.md)
- [Search & Discovery stories](./backlog/epic-06-search-and-discovery.md)
- [Sharing & Access Control stories](./backlog/epic-07-sharing-and-access-control.md)
- [Performance, Offline & Scale stories](./backlog/epic-10-performance-offline-and-scale.md)

Terminology, ID references and the enforcement gates named as `G1`–`G9` are defined in
[07-non-functional-requirements.md](./07-non-functional-requirements.md#how-an-nfr-is-verified).

### What this file owns, and what it cites

This file owns interaction design: zones, gestures, sheet rules, states, copy, motion and the
review gates. It owns **no** numbers of its own. Specifically:

| Thing | Owned by | This file |
| --- | --- | --- |
| The responsive size-class ladder | [03](./03-product-overview.md#responsive-size-class-ladder) | cites `compact` / `medium` / `expanded` / `large`, and defines no breakpoint |
| Release tag and priority of any capability | [05](./05-functional-requirements.md) | cites `R1` / `R1.1` / `R2` / `R3` as 05 tags them |
| Every threshold, limit, retention window and timing guarantee | [06](./06-business-rules-and-permissions.md) | writes the figure with its owning rule in parentheses, for example "10 seconds (BR-176)" |
| Metric IDs and event names | [10](./10-success-metrics-and-analytics.md) | cites, never invents |
| Entity field names and error codes | [09](./09-domain-model-and-glossary.md) | cites |

Where a number appears below without a citation it is a *design* dimension — a touch-target size,
a gutter, an animation duration — which this file does own.

## Design principles for a thumb

Eight principles. Each has a rule you can apply and an anti-rule you can fail a review against.
Where a principle maps to a hard requirement it names the NFR.

### P-1. The thumb owns the bottom third

- **Rule.** Every primary action lives in the bottom third of the viewport, in a bottom action
  bar, a bottom sheet, or a floating create button anchored above the safe-area inset. The top of
  the screen carries identity and orientation only: where am I, and how do I get back or search.
  (`NFR-MOB-001`)
- **Anti-rule.** No primary action in the top bar. A "Save", "Share" or "Delete" in the top-right
  corner is a desktop reflex, not a design decision — on a 6.7-inch phone it is the single
  hardest pixel on the screen to reach one-handed.

### P-2. Every consequential action is confirmed in proportion to its blast radius

- **Rule.** Reversible and cheap: act immediately, show a toast with **Undo** for 10 seconds
  (`BR-176`).
  Reversible but expensive: act immediately, show a persistent undo affordance until the next
  navigation. Irreversible or permission-widening: require a confirmation surface that **states
  the exact effect as text**, including counts. Delete of a folder always enumerates what will be
  destroyed. (`NFR-SEC-029`, `NFR-A11Y-022`)
- **Anti-rule.** No confirmation dialog that says only "Are you sure?". A dialog with no numbers
  in it is a speed bump, not a safeguard, and users learn to tap through it within a day.

### P-3. Nothing is reachable only by a gesture

- **Rule.** Every gesture is a shortcut on top of a visible control. Long-press (which enters
  selection mode) has a visible **Select** command; the action sheet is opened by a visible
  overflow button and never by a gesture at all (`FR-MOB-001`, `FR-FILE-035`).
  Swipe-to-delete has a menu item. Pinch-zoom has zoom buttons. Edge-swipe back has a
  Back control. (`NFR-A11Y-004`, `NFR-A11Y-005`)
- **Anti-rule.** No feature whose only entry point is a gesture, and no gesture that carries
  unique information. Apple's own rule is explicit: context-menu items must always exist in the
  main interface too, and shortcut gestures supplement standard gestures rather than replacing
  them.

### P-4. The current location is always visible

- **Rule.** The room name and the current folder are on screen at all times inside a room, in a
  sticky header that survives scrolling. The path is one tap away. Item counts are shown, so the
  user knows the size of what they are looking at.
- **Anti-rule.** Never hide navigation or the current path behind a hamburger. Quantitatively,
  hidden navigation cost more than 20% of content discoverability against visible navigation,
  raised perceived task difficulty from 2.1 to 2.6 on a 7-point scale, and made users at least
  15% slower on mobile ([NN/g, 179 participants, 2016](https://www.nngroup.com/articles/hamburger-menus/) —
  the oldest figure cited in this document, flagged as such).

### P-5. Search is the primary navigation, not a fallback

- **Rule.** Search is reachable in one tap from any folder and two taps from anywhere.
  Type-ahead begins at one character with a 250 ms debounce and shows the containing path on every
  result row so a result is also a navigation target. (`NFR-MOB-032`, `NFR-PERF-014`)
- **Anti-rule.** Never require folder-tree traversal to reach a known item. Persona P3 needs to
  answer "is the AR ageing in here yet" in fifteen seconds while standing in someone else's
  reception area, and four levels of drill-down with a thumb is not fifteen seconds.

### P-6. Tell the truth about the platform

- **Rule.** State the real capability of the real device. "Paused — reopen the app to continue",
  not a background progress bar. "Cached copy — your browser may clear this", not "Available
  offline". "Saved to your Downloads folder (Files app)", not "Saved to your device". Where a
  capability is absent, name the alternative in the same sentence.
  (`NFR-MOB-012`, `NFR-MOB-014`, `NFR-MOB-022`, `NFR-MOB-025`)
- **Anti-rule.** Never show an affordance that the platform cannot honour. A dead control is
  worse than an absent feature, because the user blames themselves first and us second.

### P-7. One sheet, one scope, one decision

- **Rule.** A sheet answers one question and applies one change, with an explicit primary action
  and a summary of exactly what will change. If a task inside a sheet needs another sheet, the
  first closes before the second opens. Destination pickers drill **inside** one sheet with their
  own internal breadcrumb.
- **Anti-rule.** No stacked sheets, and no inline accordion for grouped permission settings.
  Apple: "Display only one sheet at a time from the main interface… If something people do within
  a sheet results in another sheet appearing, close the first sheet before displaying the new
  one." Baymard found users could not tell which fields in an inline accordion form were in scope
  for submission — for an access-control sheet, that ambiguity is a security bug, not a cosmetic
  one.

### P-8. Degrade visibly, never silently

- **Rule.** Every degraded state is named on screen: offline, slow connection, read-only, queued,
  scanning, partially failed, permission-denied. A bulk operation that partly failed lists every
  failed item and why. A queued mutation is visible in the list where it will land.
  (`NFR-A11Y-011`, `NFR-SCALE-011`)
- **Anti-rule.** Never a spinner that resolves to nothing, and never a success toast for an
  operation that partly failed. Prior-art evidence: uploads that "often stall requiring further
  intervention" and folder moves that happen without confirmation are the two most-cited
  operational complaints in the tools reviewed in
  [01-prior-art-and-ux-benchmark.md](./01-prior-art-and-ux-benchmark.md), and both are
  silent-failure bugs.

## Size classes and reference viewports

**This document defines no breakpoints.** There is one ladder for the whole product and it lives in
[03-product-overview.md § Responsive size-class ladder](./03-product-overview.md#responsive-size-class-ladder):
`compact` below 600 CSS px, `medium` 600 to 839, `expanded` 840 to 1279, `large` 1280 and above,
following the platform-sanctioned width classes
([Android window size classes](https://developer.android.com/develop/ui/compose/layouts/adaptive/window-size-classes))
so that the progressive-enhancement ladder matches what users already expect from native apps.
Every layout statement in this file cites a class name. Where an older draft of this file named
768, 900, 1024 or 1440 as a threshold, that number is withdrawn: the ladder replaced it.

| Size class | CSS width | Layout | Navigation model | Appears at this class | Absent at this class |
| --- | --- | --- | --- | --- | --- |
| **`compact`** | below 600 | 1 column, 16 px inline gutters, 64 px rows | Bottom tab bar (4 tabs) + sticky room/folder header + FAB | The whole baseline product: list and tiles views, breadcrumb chip rail with its collapse ladder, bottom action bar, contextual action bar, sheets, drill-down, full-screen viewer, details sheet, destination picker, staging tray | Folder tree rail; two-pane split view; docked inspector; hover affordances; marquee selection; drag-and-drop; menu bar |
| **`medium`** | 600 to 839 | 1 column content with a 240 px leading navigation rail | Navigation **rail** replaces the bottom tab bar; in-app Back retained | Persistent rooms rail; sort and filter as a toolbar rather than a chip rail; a persistent checkbox column as a second route into selection; the row action sheet renders as a popover anchored to its ⋯ button | Folder tree rail; two-pane split view; docked inspector — all three wait for `expanded` |
| **`expanded`** | 840 to 1279 | Up to 3 columns: tree rail + fluid list + inspector | Persistent rail/tree + top toolbar + menu bar | The first class where a second persistent surface is permitted: **folder tree rail** (`FR-FLDR-022`), **docked details inspector** (`FR-VIEW-032`), and **two-pane split view** (`FR-VIEW-029`, subject to the height floor below). Bottom sheets become popovers and modals | Bottom tab bar; bottom action bar (it became a top toolbar at `medium`) |
| **`large`** | 1280 and above | As `expanded`, wider content measure, more tile columns | As `expanded` | Nothing new. Wider measures, more columns, larger listing page sizes | No capability exists here that `expanded` lacks |

Three affordances, and only these three, are gated on the ladder. The gate is stated once, in 03,
and reproduced here verbatim rather than reinterpreted:

| Affordance | Appears when | Requirement |
| --- | --- | --- |
| Two-pane split view | `expanded` or `large` **and** viewport height is at least 480 CSS px | `FR-VIEW-029` |
| Persistent desktop folder tree rail | `expanded` or `large` | `FR-FLDR-022` |
| Docked details inspector pane | `expanded` or `large` | `FR-VIEW-032` |

### Reference viewports — a test matrix, not a breakpoint set

These are the viewports a story is verified at (`FR-MOB-046`, `G3`). No layout rule keys off any of
them; each one is named only so a reviewer knows which device to hold.

| Reference viewport | Class | Why it is in the matrix |
| --- | --- | --- |
| 320 × 568 | `compact` | The conformance floor for SC 1.4.10 Reflow. Verify no two-dimensional scrolling; do not design here (`NFR-A11Y-007`) |
| 360 × 800 | `compact` | The **design baseline**. Every first design artefact is composed at this size (`MF-1`) |
| 390 × 844 | `compact` | The most common current handset width |
| 414 × 896 | `compact` | The wide end of `compact` in practice; the row's container query adds the size column here |
| 844 × 390 (landscape phone) | `expanded` width, **under** the 480 px height floor | The case a width-only rule gets wrong: split view must **not** appear (`NFR-MOB-007`) |
| 1024 × 768 (tablet landscape) | `expanded` | Tree rail, docked inspector and split view all present |
| 1440 × 900 (laptop) | `large` | Full desktop layout with the menu bar |

### Binding rules on the ladder

1. **Height gates the two-pane split view, width alone never does.** Split view requires
   `expanded` or `large` **and** height ≥ 480 CSS px (`FR-VIEW-029`). A landscape phone at
   844 × 390 satisfies the width condition and fails the height one, and two panes there are
   impractical. Test that case explicitly (`NFR-MOB-007`).
2. **320 px is a conformance floor, not a design target.** Design at 360 px; verify at 320 px that
   nothing requires two-dimensional scrolling (`NFR-A11Y-007`, WCAG 2.2 SC 1.4.10).
3. **Bottom tab bar carries 4 destinations.** Material caps a bottom navigation bar at three to
   five; four is chosen so each label fits at 200% text scale on a 360 px screen without
   truncation.
4. **Enhancements are additive only.** No enhancement removes a touch path. The "Move to…"
   command still exists at `large` alongside drag-and-drop; the overflow button still exists
   alongside right-click.
5. **Within a class, adaptation is by container query, never by a new breakpoint.** The class
   query uses `min-width` on logical properties at the four ladder boundaries and nowhere else.
   Everything that varies *inside* a class — the file row dropping to one metadata line at the
   narrow end of `compact` and gaining a size column at the wide end, the breadcrumb collapsing to
   a single chip, tiles going from three across to four, the details panel reflowing between a
   sheet, a rail and a full screen — is a container query on the component, so the same component
   is correct in every host. This is what replaced the eight-tier table this section used to carry.
6. **Capability, not class, gates input affordances.** Hover styles, right-click, marquee
   selection, drag-and-drop and the keyboard shortcut set are gated on
   `@media (hover: hover) and (pointer: fine)` and on hardware-keyboard detection, at **any** size
   class — a phone with a Bluetooth keyboard gets the shortcuts, and a touchscreen laptop gets
   both paths (`NFR-COMPAT-004`, `NFR-COMPAT-011`).

**Withdrawn in the internal-tool rework.** The eight-tier breakpoint table (`XS`, `S`, `M`, `L`,
`T1`, `T2`, `D1`, `D2`) and every threshold it carried — 768 px for the tree rail and split view,
900 px for the docked inspector, 1024 px and 1440 px for the desktop tiers, and the 600 px height
floor for split view — are withdrawn under D10. They restated breakpoints that 03 owns and
contradicted it in four places. Any reference elsewhere to a "T2" or "D1" width means `expanded`;
the split-view height floor is 480 CSS px, not 600.

## Reachability and layout zones

The phone screen divides into four zones by thumb reach for a right-handed one-handed grip. The
mirrored case (left-handed) is symmetric, which is why nothing unique may live in a horizontal
corner.

```
        360 px wide  ×  800 px tall   (design baseline, portrait)
   ┌─────────────────────────────────────────┐  ← env(safe-area-inset-top)
   │  ZONE A — ORIENTATION (top 0–15%)       │
   │  ┌───────────────────────────────────┐  │   Hard to reach. One-handed
   │  │ ‹ Back    Room name         🔍 ⋯  │  │   thumb cannot get here
   │  └───────────────────────────────────┘  │   without a grip shift.
   │  Allowed: Back, room/folder title,      │
   │  Search entry, overflow (secondary).    │   NEVER: destructive actions,
   │  Sticky. Survives scroll.               │   primary CTAs, Save, Share.
   ├─────────────────────────────────────────┤  ~120 px
   │  ZONE B — CONTENT (15–62%)              │
   │                                         │   Scroll region. Reachable
   │   ▸ Folder                  12 items ⋯  │   by scrolling the target
   │   ▸ Folder                   3 items ⋯  │   into Zone C, which is the
   │   ▪ File.pdf          2.4 MB · 12 Aug ⋯ │   whole point of a list.
   │   ▪ File.xlsx        882 KB · 11 Aug ⋯  │
   │                                         │   Rows are 64 px tall
   │   (virtualised, infinite + Load more)   │   (72 px at 200% text).
   │                                         │
   ├─────────────────────────────────────────┤  ~500 px
   │  ZONE C — THE THUMB ARC (62–88%)        │
   │                                         │   ★ Easiest region on the
   │   ← the natural resting position →      │   screen. Also the most
   │                                         │   dangerous: a mis-tap here
   │   Allowed: row targets, sheet primary   │   is the default outcome.
   │   actions, the create (+) button.       │
   │                                         │   NEVER place a destructive
   │   Destructive actions permitted ONLY    │   action here as the first
   │   behind an explicit confirm step.      │   tap of a flow.
   ├─────────────────────────────────────────┤  ~704 px
   │  ZONE D — PERSISTENT CONTROLS (88–100%) │
   │  ┌───────────────────────────────────┐  │   Bottom tab bar, or the
   │  │  Rooms   Recents   Search  Account│  │   contextual action bar in
   │  └───────────────────────────────────┘  │   selection mode.
   └─────────────────────────────────────────┘  ← env(safe-area-inset-bottom)
        ↑ 16 px inline gutters both sides ↑        (≥ 34 px on notched iPhones)
```

### Zone rules

| Zone | May contain | Must not contain | Notes |
| --- | --- | --- | --- |
| **A** (top 0–15%) | Back, current room and folder title, breadcrumb path chip, Search entry, screen-level overflow | Any primary action; any destructive action; Save; Share; Delete; the create button | Sticky, with `env(safe-area-inset-top)` padding. Minimum height 56 px, 64 px when the breadcrumb chip is present. |
| **B** (15–62%) | Scrolling content: rows, tiles, results, sheet body content | Fixed controls of any kind | The only 2-D scrollable region on any screen. Horizontal scrolling permitted only inside a self-contained chip rail or a wide table container. |
| **C** (62–88%) | Row targets, the create (+) FAB, sheet primary and secondary buttons, the confirm button of a confirmation sheet | The **first** tap of any destructive flow; any control that both destroys data and requires no confirmation | The FAB sits 16 px from the trailing edge and 16 px above Zone D, so its centre lands at roughly 80% of viewport height. |
| **D** (88–100%) | Bottom tab bar (4 destinations), contextual action bar in selection mode, upload progress bar, offline banner when pinned, toast (floats above) | Anything that changes meaning without changing appearance | Height 56 px plus `env(safe-area-inset-bottom)`. In selection mode the tab bar is **replaced**, not covered, so nothing is hidden behind it. |

### The destructive-action placement rule, stated precisely

A destructive action may appear in Zone C **only** as the confirming step of a flow whose
preceding step was a deliberate, non-adjacent tap. Concretely:

- Allowed: row overflow (Zone B/C) → action sheet → "Delete folder" listed **last** in the sheet
  and styled destructive → confirmation sheet whose confirm button is in Zone C and whose body
  text states the counts.
- Allowed: selection mode → contextual action bar Delete (Zone D) → confirmation sheet with
  counts, confirm in Zone C.
- Forbidden: a Delete button in the resting thumb arc that deletes on the first tap.
- Forbidden: a Delete adjacent to a frequently-used action with less than 12 px separation. Apple
  advises treating spacing between controls as being as important as size, with about 12 points of
  padding around elements; for destructive neighbours this specification requires **16 px**.
- Forbidden: Delete as the top item of a sheet on Android, or the bottom item on iOS adjacent to
  Cancel. See [Action sheets and bottom sheets](#action-sheets-and-bottom-sheets) for the exact
  ordering rule, which differs by surface type.

### One-handed verification procedure (part of `G3`)

Hold the reference handset in one hand, thumb only, no grip shift, no second hand, no table. Then
complete: open a room, drill two folders deep, open a file preview, close it, enter selection
mode, select three items, move them to another folder, undo the move, create a folder, rename it,
delete it and confirm. Any step that requires a second hand or a grip shift fails the gate.

## Desktop primitive to touch primitive translation

This is the centrepiece of the document. Every primitive in the base file-manager brief has a
touch-native replacement that is designed for the phone first, and a progressive enhancement that
restores or exceeds the desktop behaviour at larger widths. Nothing is dropped, and nothing is
merely shrunk.

| # | Desktop primitive | Desktop behaviour | Mobile-first replacement | Gesture / affordance | Why (constraint or evidence) | Progressive enhancement at `medium`, `expanded` and `large` |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | **Right-click context menu** | Secondary click on an item opens a menu of every action for that item | **Action sheet** with grouped, labelled sections, opened from a **permanently visible per-row overflow (⋯) button** and from nothing else. No gesture opens the sheet (`FR-MOB-001`) | Tap ⋯ — the only route. The button is on the row's **trailing edge**, at no less than **48 × 48 CSS px**, present on every row in its resting state. **Long-press does not open this sheet**: long-press on a row enters selection mode and selects that row (`FR-FILE-035`), which is its single meaning product-wide | Apple's rule is that context-menu items must "always be available in the main interface, too", and that context menus must be supported consistently or users think the product is broken. iOS 14 reworked Files itself to route secondary actions through one "more" button, which is also what Google Drive and Dropbox do. A discoverable button satisfies WCAG 2.2 SC 2.5.1 on its own, so no separate gesture fallback is needed — whereas a long-press-only menu is undiscoverable (P-3), fails SC 2.5.1, and steals the gesture that selection needs (D01, resolving OQ89) | `medium`: the same sheet renders as a popover anchored to the ⋯ button. With a fine pointer at any class: additionally bound to `contextmenu` (right-click), `Shift+F10` and the `Menu` key, with keyboard shortcuts shown in the app menu bar but **not** in the context menu itself (per HIG). The ⋯ button remains, revealed on row hover **and** always present in the focused row. |
| 2 | **Hover** | Hover reveals row actions, tooltips, and populates the preview pane | Three replacements, because hover carried three different jobs: (a) row actions are **always rendered** in their resting state; (b) tooltips become **visible labels** or are removed; (c) the hover-populated preview pane becomes the **details sheet at the medium detent** (tap the row's info affordance) plus the **full-screen viewer** (tap the row) | Tap the row → full-screen viewer. Tap the row's ⓘ region or swipe up from the row's sheet → details sheet at medium detent, list still partly visible behind it. | There is no hover on touch, so nothing may be gated behind it. Medium-detent sheets are Apple's own example of progressive disclosure. A hover-driven UI is also a UI whose responsiveness Google never measures, because hovering is explicitly excluded from INP. | With a fine pointer at any class: hover affordances are added **inside** `@media (hover: hover) and (pointer: fine)` only, and never carry unique information. The docked inspector at `expanded` and above shows the same content as the details sheet, from the same component, driven by selection rather than hover — so a keyboard user gets it too. |
| 3 | **Toolbar** (dense row of icon buttons) | A horizontal strip of 10–20 actions above the file list | **Bottom action bar** with 3–5 labelled primary actions plus an overflow, replaced by the **contextual action bar** in selection mode. Grouped secondary actions live in a **modal bottom sheet with section headers**, never a long flat list of buttons | Tap. The create (+) affordance is a distinct, always-visible FAB in Zone C. | Material caps a bottom navigation bar at three to five destinations, and the thumb arc caps useful reach. Apple's file guidance requires an Add (+) button for creating documents and folders regardless of keyboard shortcuts. Grouped sections rather than a long sheet, because iOS action sheets cap at four buttons including Cancel and must not scroll. | `medium`: expands to a top toolbar with icon + label, and the bottom bar is **removed**, not merely hidden, so nothing is duplicated. `expanded` and above: full horizontal toolbar with icon + label + keyboard shortcut hints in the menu bar, overflow retained for tertiary items. |
| 4 | **Folder tree view** | A persistent, indented, expand/collapse tree of the whole hierarchy in a side panel | **Breadcrumb + drill-down** as the primary, plus a **mobile tree equivalent**: the path chip opens a sheet listing the full ancestor chain (tap an ancestor to jump), and a "Folder map" sheet renders the current folder's descendants two levels deep as an indent-free, tappable, grouped list with child counts | Tap a folder row → drill in. Tap the path chip → ancestor sheet. Long-press the path **chip** → jump to the room root — the one long-press in the product that is not selection, because a chip is not a row and a chip cannot be selected; the same jump is the first row of the ancestor sheet, so the gesture carries no unique information. Long-press a folder **row** enters selection mode like any other row (`FR-FILE-035`). "Folder map" from the folder's ⋯ button. | Indentation inside the 320 CSS px reflow width truncates names to uselessness (WCAG 1.4.10), and expand/collapse twisties are routinely under the 24 × 24 CSS px floor of SC 2.5.8 while competing with the row's own navigate target — the same "two adjacent trailing controls" failure Apple warns about for indexes next to disclosure indicators. | `expanded` and above: the **real tree** returns in the leading rail (`FR-FLDR-022`), with 24 px indent per level, 48 px rows and 48 px twisties. It is persistent, resizable to preset widths (240 / 280 / 360 px — presets, not a draggable divider, per SC 2.5.7), keyboard-navigable with arrow keys, and supports type-to-jump. Drill-down, the ancestor sheet and the folder map still work at every class. |
| 5 | **Split view** (manage files between two locations) | Two independent panes, each with its own path, drag between them | Two touch mechanisms, both first-class: (a) **"Move to…" / "Copy to…" destination picker** — one sheet with in-sheet drill-down and its own internal breadcrumb; (b) the **staging tray** — a slim persistent bar reading "3 items ready to move · Paste here · Cancel" that **survives navigation**, so the user picks up in folder A, walks to folder B, and pastes. The tray is the touch analogue of cut/copy/paste from the base brief | Selection mode → Move/Copy → destination sheet. Or selection mode → "Hold for later" → navigate freely → tap "Paste here" in the tray. | A genuine two-pane layout cannot satisfy SC 1.4.10 at 320 px. One sheet only, because stacked sheets lose the user. The tray exists because the destination is sometimes not known in advance, which is exactly the case split view served on desktop. | `expanded` or `large` **and** height ≥ 480 CSS px (`FR-VIEW-029`, and no other threshold): a real two-pane split view, each pane with its own breadcrumb and independent scroll. With the tree rail also present it is two panes plus the tree, drag between panes enabled, and a "swap panes" control. The destination picker and the tray remain available at every class and are the keyboard-accessible path. |
| 6 | **Rubber-band multi-select** (marquee drag) | Click-drag a rectangle across items to select a range | **Explicit selection mode.** Long-press a row, or tap **Select** in the screen overflow, to enter. Checkboxes appear on every row. Tap toggles. A contextual action bar replaces the bottom tab bar and shows the live count. "Select all" / "Select none" are explicit buttons. Range selection is offered as **"Select from here to…"** in a row's action sheet, never as a drag | **Long-press on a row enters selection mode and selects that row** (`FR-FILE-035`). This is long-press's single meaning on a row, product-wide: it never opens the action sheet, which is reached only by the row's ⋯ button on the trailing edge at ≥ 48 × 48 CSS px (`FR-MOB-001`). Then tap → toggle. | Platform-sanctioned model: "In iOS and iPadOS, people must enter an edit mode before they can select table items." A marquee has no touch analogue, and a drag-based selection would fail SC 2.5.7 as well. Dropbox's own Android instructions are "tap and hold on a file (long press) until you see the checkboxes", and iOS Files and Google Drive behave the same way — which is also why long-press cannot be spent on the action sheet: a colleague trying to select three files would be offered "Delete" three times instead (D01). | `medium` and above: a persistent checkbox column as a second route in. With a fine pointer at any class: `Shift`-click range, `Cmd`/`Ctrl`-click toggle, and marquee drag as a third route. Selection mode itself is retained at every class because it is the keyboard- and screen-reader-accessible route. |
| 7 | **Drag-and-drop** (move/copy by dragging) | Drag an item onto a folder or another pane to move or copy it | The **destination picker** and the **staging tray** from row 5, reached from the row sheet or the contextual action bar. Upload by drag is replaced by the **upload tray**: camera, photo library, device files, and (Android) the OS share sheet | Tap-driven throughout. No drag anywhere on compact width. | Two independent blockers. (1) WCAG 2.2 SC 2.5.7 requires a single-pointer non-dragging alternative unless dragging is essential — and it is not. (2) HTML5 drag events do not fire from a finger on Chrome for Android, Firefox Android or Samsung Internet; only a mouse, trackpad, DeX or an S Pen produces them, so touch drag needs a fragile Pointer Events shim. Real precedent: iOS Files uses Select → folder icon → destination → Move; Dropbox Android uses long-press → select → Move. | With a fine pointer at `expanded` and above (the tree rail must exist to be a drop target): HTML5 drag-and-drop between the tree and the list, file drops from the OS onto a folder, drag between split panes, and `Alt`/`Option` to copy instead of move. "Move to…" remains the primary command in every menu at every class. |
| 8 | **Keyboard navigation** | Arrow keys traverse, Enter opens, F2 renames, Delete deletes, type-to-jump, shortcuts for everything | **Kept in full** — it is a WCAG Level A obligation (SC 2.1.1), not a desktop nicety, because phones support hardware keyboards and switch access. Its touch-side equivalents ship alongside: (a) screen-reader traversal where every row announces name, type, size, modified date, share state and selected state; (b) polite live regions for every status message; (c) **search type-ahead** as the mobile substitute for type-to-jump in a list; (d) SC 2.5.3-compliant accessible names on every icon-only control so voice control works | Roving `tabindex` grid semantics on the list. When a hardware keyboard or fine pointer is detected, shortcuts activate and a visible focus ring appears. | Level A, so non-negotiable. It also converges with the touch design: a list that is fully keyboard-operable is a list with correct grid semantics, which is exactly what a screen-reader user needs on touch. | **Any class** with a hardware keyboard attached: the full shortcut set of `FR-MOB-039` — including **move** and **toggle view** — plus the discoverable shortcut sheet (`?`). A keyboard is a capability, not a width, so a phone with a Bluetooth keyboard gets all of it. With a fine pointer: marquee, right-click, hover, and menu-bar shortcut hints. The focused row is never obscured by the sticky bar or an open sheet (SC 2.4.11). See [Keyboard and external-keyboard support](#keyboard-and-external-keyboard-support). |
| 9 | **Preview pane** (docked, hover- or selection-driven) | A pane beside the list showing a rendered preview plus file information | Two surfaces, deliberately separated. (a) **Full-screen viewer**, presented as its own history entry so Android system back and the iOS in-app Back both close it, with swipe-down to dismiss and horizontal swipe to the previous/next file in the folder. (b) **Details sheet** at the medium detent, invoked from the viewer or the row, carrying size, type, created, modified, owner, path, version, permissions and share state | Tap row → viewer. Swipe down → dismiss. Swipe left/right → adjacent file. Tap ⓘ in the viewer → details sheet over the document. | A fixed-width preview pane cannot satisfy SC 1.4.10 at 320 px, and file information in a side rail is unreadable at phone width. Following Quick Look, the viewer previews types the app cannot open or edit, with an explicit unsupported-type fallback rather than a silent download. | `expanded` and above (`FR-VIEW-032`, and no other threshold): the same details component **docks** as a trailing inspector, driven by selection, not hover. The inspector is persistent and resizable to presets; the details sheet content becomes a collapsible section stack inside it; the full-screen viewer remains available via `Enter` or double-click for focused reading. |
| 10 | **Double-click to open** | Single click selects, double click opens | **Single tap opens.** Selection is a separate, explicit mode (row 6), so tap never has to disambiguate | Single tap on the row body → open (folder: drill in; file: viewer). Single tap on the ⋯ → sheet. Single tap on the checkbox (in selection mode) → toggle. | There is no reliable double-tap on touch that does not collide with double-tap-to-zoom and does not introduce a 300 ms delay on every single tap. Apple's disclosure-indicator guidance also separates "reveal the next level" from "show details about this item"; conflating them on a file row is a known failure. | With a fine pointer at any class: single click selects and shows in the inspector; **double click** opens the full-screen viewer or drills into the folder; `Enter` does the same from the keyboard. Both behaviours coexist because they are on different pointer types, and the single-tap-opens behaviour is retained for touch on a touchscreen laptop. |
| 11 | **Status bar** (used storage, item counts, selection count, transfer progress) | A thin strip at the bottom of the window showing counts, selection and storage | Four separate, purpose-built surfaces, because one strip is illegible at 360 px. (a) **Item count** in the sticky folder header: "12 folders · 47 files". (b) **Selection count** in the contextual action bar title: "3 selected". (c) **Transfer progress** in the **upload tray**, a pinned bar above the bottom bar with an aggregate ("Uploading 3 of 12 · 41%") that expands to a per-file sheet. (d) **Used storage** on the Account tab and in room settings, with a bar, a per-room breakdown (`FR-ACCT-005`) and the warning state for the administrator-set quota (`BR-199`, thresholds `BR-196`) | Tap the upload tray → expands to the per-file sheet. Tap the storage bar → per-room breakdown. | All four are status messages and must be announced through polite live regions (SC 4.1.3), which a decorative status strip typically is not. Splitting them also lets each one be sized for its own importance rather than competing for one strip. | `expanded` and above: the four surfaces consolidate into a real status bar at the window foot, retaining the live regions. The upload tray becomes a docked transfer panel with per-file rows, cancel and retry. The storage breakdown gains a chart. |
| 12 | **Menu bar / application menus** | File, Edit, View, Help menus containing every command with its shortcut | The **screen-level overflow** in Zone A (secondary commands for the current screen: sort, group, view density, select, folder map, room settings, refresh) plus the **Account tab** for global commands | Tap ⋯ in the header → screen overflow sheet with labelled sections. | Every command must be reachable without a menu bar, and a menu bar has no touch analogue that survives 320 px. Grouped sections in a modal bottom sheet, not a flat action sheet, because of the four-button cap. | `expanded` and above: a real menu bar (or an application menu button) containing every command with its keyboard shortcut, which is also where shortcut discovery lives. The screen overflow persists for the subset of commands that are contextual. |
| 13 | **Resizable panes / draggable dividers** | Drag a divider to resize the tree or the preview pane | Not applicable on compact width (there are no panes), but the principle carries: any future size adjustment is offered as **preset ratios** in a menu, never as a drag-only control | Tap a preset. | SC 2.5.7: a draggable divider needs a single-pointer non-dragging alternative. Presets are also more usable one-handed and are keyboard- and screen-reader-operable. | `expanded` and above, with a fine pointer: dragging the divider is added as a shortcut, with the presets (Narrow / Default / Wide, and Hide) remaining in the View menu and bound to keyboard shortcuts. |

### Long-press has exactly one meaning per surface

**On a row, long-press means selection and nothing else** (`FR-FILE-035`, resolving OQ89 by D01).
The action sheet is opened by the row's visible **⋯ button on the trailing edge, at no less than
48 × 48 CSS px** (`FR-MOB-001`), and by no gesture. Because long-press is the scarcest gesture in
the product, its assignment is fixed here and may not vary by screen:

| Surface | Long-press does | The other behaviour is reached by |
| --- | --- | --- |
| File or folder row, browse mode | **Enters selection mode** and selects that row | The row's **⋯ button** (trailing edge, ≥ 48 × 48 CSS px) opens the action sheet. Long-press never opens it |
| File or folder row, selection mode | **"Select from here to…"** range selection | The row's **⋯ button** still opens the action sheet |
| Room card, Rooms home | **Enters selection mode** for rooms and selects that card | The card's **⋯ button** (trailing edge, ≥ 48 × 48 CSS px) opens the room action sheet |
| Breadcrumb path chip | Jumps to the room root. A chip is not a row and cannot be selected, so this is the one long-press in the product that is not selection | Tapping the chip opens the ancestor sheet, whose first row is the same "Go to room root" jump — so the gesture carries no unique information |
| Search result row | Enters selection mode (same as a file row) | The result row's **⋯ button** opens the action sheet |
| Tile in tiles view | Enters selection mode | The tile's **⋯ overlay button** (trailing corner, 48 × 48 CSS px target) opens the action sheet |
| Anywhere else | Nothing. Long-press is not assigned elsewhere. | — |

There is no row anywhere in this document, and none permitted anywhere in the product, where a
long-press opens a contextual action sheet. A sheet on long-press is a defect against
`FR-FILE-035` and `FR-MOB-001`, and it is reportable as such in review.

Apple's consistency rule is the reason for fixing the assignment: "If you provide context menus
for items in some places but not in others, people won't know where they can use the feature and
may think there's a problem." The same argument applies to selection mode, and it is why selection
gets the gesture while the sheet gets a button: a colleague who long-presses expecting to select
three files must never be handed "Delete" instead. Long-press always responds on the **up** event
with an abort path (slide off before releasing cancels), per SC 2.5.2.

## Navigation architecture

### Bottom tab bar (compact width only)

Four destinations, fixed order, labelled, 56 px tall plus `env(safe-area-inset-bottom)`. Each tab
is a 48 × 48 px minimum target with the label inside the accessible name.

| # | Tab | Icon + label | Contains | Badge |
| --- | --- | --- | --- | --- |
| 1 | **Rooms** | Folder-stack + "Rooms" | Rooms home: pinned, my rooms, shared with me. The default landing destination for an authenticated owner. | None |
| 2 | **Recents** | Clock + "Recents" | Recently viewed files and folders across all rooms, and recently uploaded items, newest first, grouped by day. Doubles as the resume-where-I-left-off surface. | None |
| 3 | **Search** | Magnifier + "Search" | Global search with scope selection, filters, recent and saved searches. Focuses the field and raises the keyboard on tap. | None |
| 4 | **Activity** | Bell + "Activity" | The notification centre: access requests, new uploads, views of your documents, security events, and the per-room activity feed entry points. | Unread count, capped at "9+" |

Account, settings and storage live behind the avatar in Zone A of the Rooms and Activity tabs,
not as a fifth tab — four labels is the maximum that survives 200% text scale at 360 px.

Tab bar behaviour:

- Tapping the active tab scrolls its list to the top; tapping again returns to that tab's root.
- Each tab maintains its **own navigation stack**. Switching tabs preserves the other tabs' depth
  and scroll position.
- The tab bar is **replaced** by the contextual action bar in selection mode and by nothing else.
  It is never covered by a sheet: a sheet at the medium detent stops above it, and a sheet at the
  large detent takes over the screen and includes its own dismissal control.
- The tab bar hides when the software keyboard is open (it would otherwise be pushed off-screen
  or float over content), and reappears on keyboard dismissal.

### Room-to-folder drill-down model

```
Rooms home
  └─ Room  (room root = an implicit folder)
       └─ Folder
            └─ Folder
                 └─ File  →  Full-screen viewer  →  Details sheet
```

- A room is the top-level container and its root behaves exactly like a folder, so there is one
  navigation model, not two.
- Each level is a **full screen**, pushed onto the Rooms tab stack. There is no accordion, no
  inline expansion, and no modal for folder navigation.
- Every folder screen shows: room name, current folder name, item counts, and the breadcrumb path
  chip, all sticky.
- Depth is capped at 32 levels below the room root (`BR-160`, verified by `NFR-SCALE-002`). At
  depth 30 the create-folder sheet warns; at 32 it refuses with the limit named.

### Breadcrumb behaviour at 360 px

The breadcrumb is a **single-line, sticky, horizontally-scrollable chip rail** in Zone A, directly
beneath the title row. It is never allowed to wrap to two lines and never causes body-level
horizontal scroll.

Collapse rule, applied in order until the rail fits the available width:

1. **Full path** if it fits: `Room ▸ Diligence ▸ Financials ▸ 2025`.
2. **Drop the room name** to a leading home glyph: `⌂ ▸ Diligence ▸ Financials ▸ 2025`.
3. **Elide the middle**, always keeping the home glyph, the immediate parent and the current
   folder: `⌂ ▸ … ▸ Financials ▸ 2025`.
4. **Truncate the current segment** with a trailing ellipsis at a minimum of 12 characters, never
   below: `⌂ ▸ … ▸ Financials ▸ Q3 Manage…`.
5. **Collapse to a single path chip** when even that does not fit (deep paths, long names, 200%
   text scale): `⌂ … ▸ Q3 Manage… ⌄`.

Interactions on the rail:

| Interaction | Result |
| --- | --- |
| Tap an ancestor chip | Navigate to that ancestor, popping the intervening stack entries |
| Tap the `…` elision chip, or the collapsed single chip | Open the **ancestor sheet**: the full path as a vertical list, one row per level, each 48 px, with the current level marked and non-tappable |
| Tap the current (trailing) chip | Open the **folder overflow sheet** for the current folder (rename, move, share, folder map, sort, select, delete) |
| Long-press any chip | Jump to the room root. A chip is not a row, so this does not enter selection mode; the same jump is the first row of the ancestor sheet |
| Horizontal drag on the rail | Scrolls the rail. Never initiated within 24 px of a screen edge, and the rail never consumes a vertical drag. |
| Keyboard | The rail is a single tab stop; arrow keys move between chips; `Enter` navigates; `Home` jumps to the room root |

The ancestor sheet is the mobile tree's "where am I in the hierarchy" answer, and the folder map
sheet (row 4 of the translation table) is its "what is below me" answer. Together they replace the
tree without indentation.

### Back semantics

| Platform / surface | Back affordance | Behaviour |
| --- | --- | --- |
| **Android, gesture navigation** | System edge swipe (either edge) and the predictive-back animation | Pops exactly one history entry. Every sheet, selection mode, viewer, destination picker and search overlay is a separate popable entry, so back always does the least surprising thing. Predictive back is enabled by default from Android 13 and opting out is explicitly discouraged, so the app never intercepts it. |
| **Android, 3-button navigation** | System back button | Identical semantics. |
| **iOS Safari tab** | Browser back, plus the in-app Back control | Identical semantics. |
| **iOS installed (standalone) web app** | **In-app Back control only** — there is no browser chrome and iOS has no system back | The in-app Back in Zone A is mandatory, not optional. A left-edge swipe is additionally supported as a shortcut where it does not conflict with a horizontal rail. Apple's guidance is explicit: users expect a Back button in a top toolbar, with the swipe as an accelerator that supplements rather than replaces it. |
| **All platforms** | — | Back from a room root goes to Rooms home, not out of the app. Back at Rooms home is the only place the app may exit, and the first back press there shows a toast rather than exiting if there is a queued mutation pending. |

Back never: discards an in-progress upload (it backgrounds the tray instead), silently abandons an
unsaved rename (it prompts), or exits from a nested folder.

### Deep links and cold start into a deep folder

Deep-linkable routes: room, folder, file (viewer), search query, share-management screen, and
activity item. All are shareable URLs and all are restorable from cold.

Cold-start resolution order, with the behaviour for each outcome:

| Situation | Behaviour |
| --- | --- |
| Authenticated, authorised | The target renders directly. The breadcrumb is **fully reconstructed** from the path, so back walks up the real hierarchy rather than exiting. A skeleton of the target folder shows within 400 ms; rows within `NFR-PERF-009`. |
| Authenticated, holds no grant on the target | The **not-found state**, byte-identical and timing-equivalent to the state for an identifier that never existed (`BR-233`, `BR-049`): "This item is not available." and a route back to Rooms home. It never names the item, the folder, the room, the owner or the sharer, never says "you do not have access", and never offers "Request access" from this screen, because all four would confirm that the target exists. No redirect to home either — a redirect is itself a signal. |
| Authenticated, holds a grant but is exceeding it | The only case where denial may be stated, because the principal already knows the target exists (`BR-233`). A Viewer who follows a link to a write surface lands on the item in its [read-only state](#2-room-contents--list-view) with "Your access is Viewer" and **Ask for more access**. This is the sole surviving entry point for an access request from a deep link. |
| Not authenticated, permissioned share | One authentication step, pre-filled with the invited email where the link carries it, returning to the exact target. No intermediate home screen. |
| Not authenticated, public link | The content renders with no gate. Any email-capture or password gate is a single step that names the room and returns to the target. |
| Link dead — expired, revoked, rotated, quarantined or never issued | **One generic state, identical for all five causes.** Its entire disclosure is the sentence **"This link is no longer active."** plus a request-access action (`BR-099`, `BR-234`, `FR-SHARE-028`). No item name, no folder, no room, no owner, no sharer, no reason, no expiry date, no expiry duration, and no signal distinguishing a link that once existed from a token that never did. It fits without scrolling at 360 CSS px and its action sits in the thumb zone. |
| Wrong account signed in, **and the URL carries a live invitation or link token covering the target** | "You are signed in as a@b.com. This link was sent to someone else. Switch account?" with a one-tap switch that returns to the target. Permitted only in this token-bearing case: the token itself already carries the grant, so the prompt discloses nothing the visitor did not hold (`BR-233`). Without a live token the signed-in account holds no grant, and the row above applies instead. |
| Item deleted, **and the visitor holds a grant on it** | "This file was deleted on 12 August 2026" plus, for a principal permitted to restore, "Restore from trash". A visitor with no grant gets the not-found state, because "it was deleted" is an existence disclosure. |
| Offline at cold start | If the target is cached: render from cache with the offline banner. If not: "You are offline. This folder is not saved on this device." plus a Retry that resolves automatically on reconnect. |

Deep-link entry always initialises the Rooms tab stack to the reconstructed ancestor chain, so
back and the breadcrumb agree. A deep link never lands the user in a stack of depth one.

**The existence rule, stated once for every screen in this document (D02).** A principal holding no
grant on the target sees exactly what a principal holding an identifier that never existed sees:
the same words, the same layout, the same status code, the same response timing (`BR-233`,
`BR-049`). The interface therefore has **no** "you do not have access" screen and **no** "access
denied" screen. A denial may be stated only to a principal that already holds a grant on that exact
target and is exceeding it — the read-only state, and nothing else. Every "Request access" entry
point in this file is either on the generic dead-link page, where it is shown unconditionally and
so discloses nothing (`BR-099`), or inside the read-only state of an item the user can already see.

**Withdrawn in the internal-tool rework.** Three things are deleted from this section under D02:
the "Authenticated, not authorised" screen and its copy "You do not have access to this folder";
the instruction **"Never a 404"**, which was the defect — a 404 is now mandatory, not forbidden;
and the disclosure of the owner's display name, the room name and the phrase "Never a generic
error" on the dead-link page, since a generic page is precisely the requirement. The corresponding
whole-screen permission-denied state in [Core screens § 2](#2-room-contents--list-view) is
withdrawn with them.

### Scroll-position restoration

Binding behaviour (`NFR-MOB-029`):

- Returning from a viewer, a child folder, a sheet, or a search restores the scroll offset to
  within ±40 px, including inside a virtualised list of up to 10,000 items.
- Restoration is keyed on `(route, listId, sortOrder, filterState)`. Changing the sort or filter
  intentionally resets to the top, with the list announcing "Sorted by name, 59 items".
- The restored position survives a page freeze, because the offset is written to session storage
  on every `visibilitychange` to hidden.
- Pull-to-refresh does **not** reset the scroll position; it refreshes in place and announces
  "Updated · 3 new items", with the new items marked so the user can find them without hunting.
- If restoration is impossible because the anchor item was deleted, the list restores to the
  nearest surviving item and announces "The item you were viewing was deleted".
## Core screens

Each screen below gives an ASCII wireframe at the 360 px baseline, the full state list (loading,
empty, error, offline, partial, permission-denied), and the exact interactions available. States
that do not apply to a screen are marked "n/a" with the reason, so a reviewer can tell a
considered omission from an oversight.

### 1. Rooms home

```
┌──────────────────────────────────────────┐
│ (AK)  Data Room                    🔍 ⋯  │  Zone A, sticky. Avatar → Account.
├──────────────────────────────────────────┤
│  Storage  ▓▓▓▓▓▓▓▓░░░░  842 / 1024 GB ›  │  Administrator-set quota (BR-199).
│                                          │  Tap → per-room breakdown. Amber at
│                                          │  75%, red at 100% (BR-196).
├──────────────────────────────────────────┤
│  PINNED                                  │
│  ┌────────────────────────────────────┐  │
│  │ ★ Riverside HVAC — Sale       ⚠ 3 │  │  ⚠ = pending access requests
│  │   14 folders · 212 files · 2 shared│  │
│  │   Updated 2 h ago              ⋯  │  │
│  └────────────────────────────────────┘  │
│                                          │
│  MY ROOMS                          Aa ⇅  │  Aa = density, ⇅ = sort
│  ┌────────────────────────────────────┐  │
│  │ ▣ Delta Landscaping           🔗 2 │  │  🔗 = active public links
│  │   8 folders · 64 files             │  │
│  │   Updated yesterday            ⋯  │  │
│  ├────────────────────────────────────┤  │
│  │ ▣ Mercer Dental                    │  │
│  │   3 folders · 19 files · Private   │  │
│  │   Updated 4 Aug                ⋯  │  │
│  └────────────────────────────────────┘  │
│                                          │
│  SHARED WITH ME                          │
│  ┌────────────────────────────────────┐  │
│  │ ◈ Northgate Retail        Viewer   │  │  Role badge always visible
│  │   from t.ferreira@…  ·  Read-only  │  │
│  │   Updated 3 d ago              ⋯  │  │
│  └────────────────────────────────────┘  │
│                                          │
│                              ┌─────┐     │
│                              │  +  │     │  FAB, Zone C, 16 px insets
│                              └─────┘     │
├──────────────────────────────────────────┤
│  Rooms   Recents   Search    Activity③   │  Zone D
└──────────────────────────────────────────┘
```

| State | Presentation |
| --- | --- |
| **Loading** | Storage bar and three room cards as skeletons, real shape and height, no shimmer under reduced motion. Header renders immediately with the real avatar from cache. |
| **Empty (no rooms)** | Illustration-free empty state: "No data rooms yet." / "A data room is a private folder you share outside the company. Only people you invite, or people holding a link you created, can see it." / primary button **Create your first room**, and a secondary "Start from a template" (R2). The FAB is retained so there are two routes. |
| **Empty (no shared-with-me)** | The section header is omitted entirely rather than shown empty. |
| **Error** | Inline card in place of the list: "We could not load your rooms." / "This is usually a connection problem." / **Try again**. Cached rooms, if any, render above the error with an "Showing your saved copy" note. |
| **Offline** | Persistent banner below Zone A: "Offline — showing your saved copy." Rooms opened in the last 7 days render normally; others are dimmed with a small cloud-slash glyph and are not tappable, with an accessible name suffix "not available offline". |
| **Partial** | If the room list loads but counts or storage fail, counts render as "—" with the row still tappable, and the storage bar collapses to a single tappable "Storage unavailable" row. Never blocks navigation. |
| **Permission-denied** | n/a at this level — a user always sees their own rooms. A room revoked while the list was cached shows "Access removed" on the card and offers **Remove from list**. |
| **Quota reached** | Storage bar turns red and a non-dismissible row appears above the list: "Storage is full. New uploads are blocked. Nothing has been deleted." with **See what is using space** and **Request more space**, which names the administrator on the account (`BR-199`, `BR-201`). Everything that does not add bytes keeps working — listing, search, preview, download, share, revoke, rename, move, delete and export (`BR-204`). |

Interactions: tap card → room root. Tap ⋯ → room action sheet (Open, Rename, Duplicate, Share,
Manage access, Pin, Archive, Delete). Long-press card → selection mode for rooms (pin, archive,
delete in bulk). Pull-to-refresh. Tap the ⚠ badge → the access-requests list for that room. Tap
FAB → create sheet (New room, Upload here is absent at this level).

### 2. Room contents — list view

```
┌──────────────────────────────────────────┐
│ ‹  Riverside HVAC — Sale           🔍 ⋯  │  ⋯ = screen overflow
│    ⌂ ▸ … ▸ Financials ▸ 2025        ⌄   │  Breadcrumb chip rail, sticky
│    12 folders · 47 files    Viewer×3 🔗  │  Counts + who-can-see-this
├──────────────────────────────────────────┤
│  Name ⇅   Modified   Size      ▤ ▦  ⚙   │  Sort chip rail + view toggle
├──────────────────────────────────────────┤
│  ▸ 01 Corporate                      ⋯   │  64 px rows
│    9 items · Shared with 2               │
│  ▸ 02 Financials                     ⋯   │
│    23 items                              │
│  ▪ P&L 2025 YTD.pdf                  ⋯   │
│    2.4 MB · PDF · 12 Aug · ● offline     │
│  ▪ Lease — Riverside.pdf         ⏳  ⋯   │  ⏳ = queued mutation
│    1.1 MB · PDF · 12 Aug                 │
│  ▪ Payroll register.xlsx             ⋯   │
│    882 KB · Excel · 11 Aug · 🔒 no dl    │
│  ▪ Scan 2026-08-21.pdf     ⟳ 41%     ✕   │  Uploading, tap ✕ to cancel
│    Uploading 3 of 12                     │
│                                          │
│         ── Load more (47 of 212) ──      │  Explicit affordance + count
│                              ┌─────┐     │
│                              │  +  │     │
│                              └─────┘     │
├──────────────────────────────────────────┤
│ ⟳ Uploading 3 of 12 · 41%            ⌃  │  Upload tray, pinned
├──────────────────────────────────────────┤
│  Rooms   Recents   Search    Activity③   │
└──────────────────────────────────────────┘
```

| State | Presentation |
| --- | --- |
| **Loading (first paint)** | Sticky header with the real room and folder name from the route, then 8 row skeletons at the exact row height so nothing shifts (`NFR-PERF-003`). First real rows within `NFR-PERF-009`. |
| **Loading (page-in)** | A 3-row skeleton block appears at the list foot within 100 ms of crossing the scroll threshold; the "Load more" affordance is replaced by it, not stacked with it. |
| **Empty folder** | "This folder is empty." / "Add files from your camera, your photos, or your device." / three labelled buttons: **Take a photo**, **Choose photos**, **Choose files**, plus **New folder**. On Android a fourth line notes that items shared from other apps land here. |
| **Empty room root** | As above plus "Start from a template" (R2) and, for a new room, an inline three-step checklist: add folders, upload files, invite someone. |
| **Error** | Full-width inline card replacing the list: "We could not open this folder." / cause when known ("The connection dropped" / "This folder no longer exists") / **Try again**. Breadcrumb and header remain so the user is not stranded. |
| **Offline** | Banner: "Offline — you can read what is saved on this device." Cached rows render normally; uncached rows are absent and a foot note reads "More items will load when you reconnect." Actions that mutate are visible but disabled with the accessible name suffix "unavailable offline"; the three queueable kinds — **upload, rename, delete-to-trash** (`BR-130`) — stay enabled and queue. |
| **Partial** | Thumbnails failing → type glyph, silently. Counts failing → "—". Some children unreadable due to a permission subset → those rows are simply absent, and a foot note reads "Some items in this folder are not shared with you." (never a list of forbidden names, per the invisibility rule). |
| **Permission-denied** | n/a as a distinct state, by design (D02). A principal with no grant on this folder gets the **not-found state** — "This item is not available." and a route back to Rooms home — identical to the state for a folder that never existed (`BR-233`). No room name, no breadcrumb remnant, no "Request access", because each would confirm the folder exists. A principal that *does* hold a grant and is merely exceeding it sees the **Read-only** row below instead. |
| **Read-only** | A persistent, non-dismissible chip in the sort rail: "Read-only". The FAB is absent, not disabled. Mutating items are hidden from every sheet rather than dimmed, per the context-menu rule. Tapping the chip states the reason and offers **Ask for more access** — legitimate here, and only here, because this principal already holds a grant on what it is looking at (`BR-233`). |
| **Scanning** | A newly uploaded file shows "Scanning" in place of its size, is openable by the uploader, and is not servable on a public link. On completion the row updates in place with a polite announcement. |

Interactions: tap row body → drill in (folder) or open viewer (file). Tap ⋯ → file or folder
action sheet. Long-press row → selection mode. Swipe left on a row → Delete (with undo). Swipe
right on a row → Share. Pull-to-refresh. Tap the sort chip → sort sheet (Name, Modified, Size,
Type, ascending/descending, and Group by type/date/none). Tap ▤/▦ → list/tiles toggle, persisted
per user. Tap ⚙ → density (Comfortable / Compact). Tap the counts row → the "who can see this"
sheet. Tap the upload tray → expand to the per-file sheet. Tap FAB → create sheet.

### 3. Room contents — tiles view

```
┌──────────────────────────────────────────┐
│ ‹  Riverside HVAC — Sale           🔍 ⋯  │
│    ⌂ ▸ … ▸ Financials ▸ 2025        ⌄   │
│    12 folders · 47 files    Viewer×3 🔗  │
├──────────────────────────────────────────┤
│  Name ⇅   Modified   Size      ▤ ▦  ⚙   │
├──────────────────────────────────────────┤
│  ┌────────┐ ┌────────┐ ┌────────┐        │  Container query on a 104 px
│  │   ▸    │ │   ▸    │ │ ┌────┐ │        │  minimum tile: 3 across at the
│  │        │ │        │ │ │IMG │ │        │  360 px baseline, 4 at the wide
│  │ 01 Cor…│ │ 02 Fin…│ │ └────┘ │        │  end of `compact`, more at
│  │ 9 items│ │23 items│ │ P&L 20…│        │  `medium` and above. No breakpoint.
│  │      ⋯ │ │      ⋯ │ │ 2.4 MB⋯│        │  ⋯ overlay, 48 × 48 target
│  └────────┘ └────────┘ └────────┘        │
│  ┌────────┐ ┌────────┐ ┌────────┐        │
│  │ ┌────┐ │ │ ┌────┐ │ │ ┌────┐ │        │
│  │ │PDF │ │ │ │XLS │ │ │ │ ⟳  │ │        │  Uploading tile shows ring
│  │ └────┘ │ │ └────┘ │ │ └41%┘ │        │
│  │Lease —…│ │Payroll…│ │Scan 2…│        │
│  │ 1.1 MB⋯│ │882 KB⋯ │ │  ✕    │        │
│  └────────┘ └────────┘ └────────┘        │
│         ── Load more (47 of 212) ──      │
│                              ┌─────┐     │
│                              │  +  │     │
│                              └─────┘     │
├──────────────────────────────────────────┤
│  Rooms   Recents   Search    Activity③   │
└──────────────────────────────────────────┘
```

States: identical to the list view, with three differences. **Loading** uses tile-shaped skeletons
with the aspect ratio reserved so thumbnail arrival never shifts the grid. **Offline** suppresses
thumbnails for uncached items and shows the type glyph. **Low-data mode** (`NFR-MOB-017`)
suppresses thumbnails entirely and renders type glyphs, with a one-time note: "Thumbnails are off
to save data. Change in Settings."

Interactions: as list view. Tile name truncates to two lines with a middle ellipsis that preserves
the file extension where extensions are shown. Tiles view is never the default: list is the
default because it carries more legible metadata at 360 px, and the preference persists per user
per device once changed.

### 4. File details sheet

Presented at the **medium detent** over the list or over the viewer, so the context behind stays
partly visible. This is the mobile replacement for the desktop preview pane's information half.

```
┌──────────────────────────────────────────┐
│  (list or viewer remains visible above)  │
│                                          │
├══════════════════════════════════════════┤  ← medium detent (~50%)
│                ▁▁▁▁▁                     │  Grabber, 48 × 48 target,
│  ┌────┐                                  │  tap to cycle detents
│  │PDF │  P&L 2025 YTD.pdf            ⋯  │
│  └────┘  2.4 MB · PDF · 14 pages         │
├──────────────────────────────────────────┤
│  ⬇ Download    ↗ Open in…    🔗 Share    │  3 primary, labelled
├──────────────────────────────────────────┤
│  WHO CAN SEE THIS                        │
│  ◈ 3 people · 1 public link          ›   │  Always visible, always current
├──────────────────────────────────────────┤
│  DETAILS                                 │
│  Location     ⌂ ▸ Financials ▸ 2025  ›   │  Tappable → navigates there
│  Owner        Marcy Doyle                │
│  Created      12 Aug 2026, 09:14 EDT     │
│  Modified     12 Aug 2026, 14:02 EDT     │
│  Version      3 of 3                 ›   │
│  Your access  Viewer · download allowed  │
│  Offline      ● Saved on this device     │
├──────────────────────────────────────────┤
│  ACTIVITY                                │
│  Opened by 4 people · last 2 h ago   ›   │
└──────────────────────────────────────────┘
```

| State | Presentation |
| --- | --- |
| **Loading** | Sheet opens immediately at the medium detent with the name, type and size already known from the row; the remaining rows are skeletons. The sheet never waits for data to appear. |
| **Empty** | n/a — a details sheet always has a subject. |
| **Error** | The Details section shows "Some details could not be loaded" with a Retry link; the primary actions remain usable if the file itself is reachable. |
| **Offline** | Cached fields render; uncached fields show "—" with a note "Details will update when you reconnect". "Who can see this" shows the cached value with an explicit "as of" timestamp, because a stale permission display is dangerous. |
| **Partial** | Version history unavailable → the Version row is non-tappable and shows the number only. Activity unavailable → the Activity section is omitted entirely. |
| **Permission-denied** | Reached only from a row the user can see, so denial appears as reduced content: no Activity section for a Viewer, no "Who can see this" detail beyond a count, and mutating items absent from the ⋯ sheet. |
| **Read-only** | Download button present only if the download-allowed flag is set; otherwise it is absent and a line reads "Downloads are turned off for this file." |

Interactions: swipe down or tap the grabber → dismiss. Tap the grabber → cycle medium ↔ large
detent (the tap-to-cycle route is what satisfies SC 2.5.7 without a drag). Tap Location → navigate
to the containing folder, dismissing the sheet. Tap "Who can see this" → share-management sheet.
Tap Version → version list with Restore. Tap ⋯ → the full file action sheet. Only one sheet at a
time: opening the share sheet closes this one first.

### 5. Full-screen viewer

Its own history entry, so Android system back and the iOS in-app Back both close it.

```
┌──────────────────────────────────────────┐
│ ✕   P&L 2025 YTD.pdf            ⓘ  ⋯   │  Chrome auto-hides after 3 s
│                                          │  of no interaction; any tap
│                                          │  restores it.
│   ┌──────────────────────────────────┐   │
│   │                                  │   │
│   │   Riverside HVAC LLC             │   │
│   │   Profit & Loss — YTD 2025       │   │  Fit-width by default.
│   │                                  │   │  Text reflows at phone width
│   │   Revenue          1,284,300     │   │  where the format allows;
│   │   COGS               612,900     │   │  otherwise fit-width with a
│   │   Gross profit       671,400     │   │  "Reflow text" toggle in ⋯.
│   │                                  │   │
│   │   [ MARCY DOYLE · 21 AUG 2026 ]  │   │  Dynamic per-viewer watermark,
│   │                                  │   │  server-composited into the
│   │                                  │   │  rendered tile (R1.1)
│   └──────────────────────────────────┘   │
│                                          │
│  ‹ prev                          next ›  │  Visible controls, not just
├──────────────────────────────────────────┤  swipe (SC 2.5.1)
│  ⊖  ─────●──────  ⊕      Page 3 / 14 ⌄  │  Zoom buttons + page jump
└──────────────────────────────────────────┘
```

| State | Presentation |
| --- | --- |
| **Loading** | The first page paints progressively: a low-resolution placeholder within 600 ms, legible text within `NFR-PERF-011`. A determinate progress line sits under the top chrome. Page count appears as soon as known; before that the indicator reads "Page 1". |
| **Empty** | n/a. |
| **Error** | Centred card over a neutral ground: "We could not display this file." / cause ("The file may still be uploading" / "This format is not supported yet") / **Download instead** and **Try again**. Never a blank black screen. |
| **Offline** | If the document is pinned or recently viewed, it renders from cache with a small "Saved copy" chip. If not: "You are offline. This document is not saved on this device." plus **Save for offline when I reconnect**, which queues the pin. |
| **Partial** | Pages render as they arrive; an unavailable page shows a placeholder with its number and a Retry, and the page indicator reports "Page 7 of 14 · 2 pages unavailable". Never silently skips a page. |
| **Access removed mid-view** | The rendered content is **cleared**, not left on screen, on the first refused request — which arrives within the 30-second loaded-page re-check interval at the latest (`BR-112`), inside the 60-second absolute revocation bound (`BR-108`). What replaces it depends on what the viewer was: a link visitor gets the generic **"This link is no longer active."** page (`BR-099`); a signed-in principal whose grant was revoked gets the **not-found state**, since it now holds no grant on this item (`BR-233`). Neither names the owner, the sharer or the reason, and neither offers "Request access" beyond the unconditional action on the dead-link page. |
| **Unsupported type** | Following the Quick Look principle: show what we can (icon, name, size, type, first-page image if any) and offer **Download** and **Open in…**, with the copy "We cannot preview this file type yet. You can still download it or open it in another app." |
| **Download disabled** | The ⋯ sheet omits Download and Open in…, and a chip reads "Downloads off". Screenshot deterrence is not claimed, because the web platform cannot enforce it. |

Interactions: tap → toggle chrome. Swipe down → dismiss (returns to the list at the restored
scroll position). Swipe left/right → previous/next file **in the current folder**, with the
adjacent file's name announced on arrival. Pinch → zoom, with `⊖`/`⊕` buttons as the required
single-pointer equivalent and double-tap as a shortcut to fit-width ↔ 2×. Two-finger drag → pan
while zoomed; while zoomed, single-finger drag also pans and the horizontal file-swipe is
suspended to avoid conflict. Tap the page indicator → page-jump sheet with a number field and a
thumbnail strip. Tap ⓘ → details sheet at medium detent over the document. Tap ⋯ → viewer overflow
(Reflow text, Rotate, Download, Open in…, Share, Save for offline, Report a problem).

### 6. Search

```
┌──────────────────────────────────────────┐
│ ‹  ┌────────────────────────────────┐ ✕  │  Field autofocused on entry
│    │ 🔍 lease                       │    │  from the Search tab only
│    └────────────────────────────────┘    │
├──────────────────────────────────────────┤
│  This folder │ This room │ All rooms     │  Scope segmented control,
│              └─ selected ─┘              │  defaults to This room
├──────────────────────────────────────────┤
│  Type ⌄   Date ⌄   Size ⌄   Shared ⌄     │  Filter chip rail, scrollable
├──────────────────────────────────────────┤
│  4 results · searching all rooms…        │  Live region
│                                          │
│  ▪ Lease — Riverside.pdf             ⋯   │
│    Riverside HVAC ▸ 02 Financials ▸ 2025 │  Path always shown, tappable
│    1.1 MB · 12 Aug                       │
│  ▪ Lease amendment 2.pdf             ⋯   │
│    Riverside HVAC ▸ 01 Corporate         │
│    240 KB · 4 Aug                        │
│  ▸ Leases                            ⋯   │
│    Delta Landscaping ▸ 03 Property       │
│    6 items                               │
│                                          │
│  RECENT SEARCHES                         │
│  ⟲ payroll register                  ✕   │
│  ⟲ AR ageing                         ✕   │
├──────────────────────────────────────────┤
│  Rooms   Recents   Search    Activity③   │  Hidden while keyboard is up
└──────────────────────────────────────────┘
```

| State | Presentation |
| --- | --- |
| **Loading / in-flight** | Results from the previous query remain visible, dimmed to 60% opacity, with a determinate top progress line. Never a full-screen spinner over results the user is reading. A 250 ms debounce means one keystroke does not produce one request. |
| **Empty (no query)** | Recent searches (up to 8), then saved searches (R2), then a hint: "Search by file or folder name. Content search is coming later." — an honest statement, since R1 is filename search only. |
| **Zero results** | "No matches for **lease**." / "Try a shorter word, or change the scope." / the scope control repeated inline with the wider scope highlighted, and each active filter shown as a removable chip so the user can see what is narrowing the search. |
| **Error** | "Search is unavailable right now." / **Try again**. Recent searches remain listed and tappable, and browsing is unaffected. |
| **Offline** | Scope collapses to "Saved on this device" with an explanatory line, and searches the local cache only. The other scopes are visible but disabled with the accessible suffix "needs a connection". |
| **Partial** | When one room in an "All rooms" search fails, results render with a foot note: "Could not search 1 of 12 rooms." plus Retry. Never silently omits a room. |
| **Permission-denied** | Results never include items the user cannot see, and no count leaks their existence. A stale result whose access was revoked resolves to the not-found state on tap (`BR-233`), never to a permission error and never naming what was lost. |
| **Slow connection** | Type-ahead switches to submit-on-enter after two consecutive requests exceed 1.5 s, with a one-time note "Search will run when you press Enter on this connection." This is the concrete answer to results-as-you-type on a slow link. |

Interactions: type → debounced type-ahead. Tap a result → open the item; tap the path line → open
the containing folder instead. Tap ⋯ → the item's action sheet. Long-press a result → selection
mode. Tap ✕ in the field → clear query, keep scope and filters. Tap ‹ → leave search, restoring
the previous screen and scroll position. Tap a filter chip → filter sheet (single sheet, one
scope). Swipe down on the results list → dismiss the keyboard without losing the query. Saved
searches: ⋯ → "Save this search" (R2).

### 7. Upload tray

The upload tray is a pinned bar above Zone D that expands into a sheet. It is the product's
honesty surface, so its copy is specified verbatim.

```
Collapsed (pinned above the bottom bar):
├──────────────────────────────────────────┤
│ ⟳ Uploading 3 of 12 · 41%            ⌃  │  Tap or swipe up → expand
├──────────────────────────────────────────┤

Expanded (large detent):
┌──────────────────────────────────────────┐
│                ▁▁▁▁▁                     │
│  Uploads                        Done ✓   │
├──────────────────────────────────────────┤
│  Uploading 3 of 12 · 41% · 2 min left    │  Live region, polite
│  ▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░                   │
│  Keep this screen on until it finishes.  │  Shown when wake lock is held
├──────────────────────────────────────────┤
│  ▪ Scan 2026-08-21.pdf     ⟳ 41%     ✕   │
│    2.1 MB of 5.2 MB · to ▸ 2025          │
│  ▪ Scan 2026-08-21 (2).pdf   Queued  ✕   │
│    4.8 MB · to ▸ 2025                    │
│  ▪ Rent roll.xlsx          ⏸ Paused  ↻   │
│    Reopen the app to continue            │  ← never "uploading in background"
│  ▪ Survey.pdf                Failed  ↻   │
│    Connection lost · 12 MB of 40 MB      │
│  ▪ Lease.pdf              Name clash ⚠   │
│    A file with this name already exists  │
│  ▪ P&L 2025.pdf                  ✓  ⋯   │
│    Uploaded · Scanning                   │
├──────────────────────────────────────────┤
│  Retry all failed        Cancel all      │
└──────────────────────────────────────────┘
```

| State | Presentation |
| --- | --- |
| **Loading** | n/a — the tray appears already populated, because the queue is client-side and known at the moment of selection. |
| **Empty** | The tray is absent, not empty. It appears on the first queued item and disappears 4 s after the last item resolves, or immediately on **Done**. |
| **Error (per item)** | Row shows the reason in plain language and a **↻ Retry**: "Connection lost", "File is too large (limit 5 GB)", "Storage full", "You do not have permission to upload here", "This file type is blocked". Never a status code. |
| **Offline** | Tray banner: "Offline — uploads will continue when you reconnect." Items move to Queued, retaining their destination folder. Resume is automatic on reconnect and within 5 s (`NFR-PERF-017`). |
| **Paused (backgrounded)** | The binding copy is **"Paused — reopen the app to continue."** No progress advances, no notification is posted, and nothing implies background transfer (`NFR-MOB-025`). |
| **Partial** | A batch where some items succeeded and some failed shows a summary row: "9 of 12 uploaded · 3 failed" with **Retry 3 failed** and a per-item reason list. The success toast is never shown for a partial batch. |
| **Permission-denied** | Items destined for a folder whose permission changed mid-flight fail individually with "You no longer have permission to upload to this folder", and offer **Choose another folder** rather than discarding the file. |
| **Name clash** | Row enters a decision state with three explicit choices in a sheet: **Keep both** (with the resulting name shown, e.g. "Lease (2).pdf"), **Replace as a new version**, **Cancel this file**. Never resolved silently. |
| **Quota reached mid-batch** | Remaining items pause with "Storage is full — nothing was lost. Free up space, or ask your administrator to raise the quota." Uploaded items are kept. The refusal happens at initiation, before any byte of the failing file is accepted (`BR-201`), and data is never silently truncated, downsampled or partially committed (`BR-205`). |

Interactions: tap collapsed tray → expand. Swipe down or tap Done → collapse (the queue keeps
running). Tap ✕ on an item → cancel that item, with a 10 s undo (`BR-176`). Tap ↻ → retry. Tap a completed
row → open the file. Tap ⋯ on a completed row → its action sheet. The tray persists across
navigation within the app and is reconstructed from durable storage on next app open
(`NFR-MOB-005`).

Entry points to upload, all of which route into this tray:

| Entry | Availability | Notes |
| --- | --- | --- |
| **Take a photo** | iOS and Android | `capture="environment"`. Multi-page capture assembles one PDF. Two taps from a folder (`NFR-MOB-020`). |
| **Choose photos** | All | Selection-scoped by the OS photo picker. The product never claims to sync a camera roll, because the platform grants only the explicit selection. |
| **Choose files** | All | The OS file picker. The product cannot pre-position it or remember the last location, and does not pretend to. |
| **Choose a folder** | Where `webkitdirectory` works; otherwise the fallback | Where unsupported: "Picking a whole folder is not supported on this device. Select the files, or upload a .zip and we will unpack it." (`NFR-MOB-021`) |
| **Share from another app** | Android only | Via `share_target`. Absent on iOS, and the iOS copy never mentions it (`NFR-MOB-011`, `NFR-MOB-012`). |
| **Drag files in** | Desktop and tablet with a fine pointer | Progressive enhancement only. |
### 8. Move / copy destination picker

**One sheet.** Drill-down happens inside it, with its own internal breadcrumb. It never opens a
second sheet, including for "New folder", which is an inline row inside this sheet.

```
┌──────────────────────────────────────────┐
│  (source list dimmed behind)             │
├══════════════════════════════════════════┤  ← large detent
│                ▁▁▁▁▁                     │
│  Move 3 items                    Cancel  │  Title states the operation
│                                          │  and the count, always
├──────────────────────────────────────────┤
│  ⌂ Riverside HVAC ▸ 02 Financials    ⌄  │  Internal breadcrumb of the
│                                          │  PICKER, not the source
├──────────────────────────────────────────┤
│  ＋ New folder here                      │  Inline, expands to a field
├──────────────────────────────────────────┤
│  ▸ 2024                          9 items │
│  ▸ 2025                    ✓ current     │  Source folder marked, and
│  ▸ Bank statements              14 items │  it is not selectable
│  ▸ Tax returns                   6 items │
│  ▸ 2025 ▸ Q3          ⊘ inside selection │  A descendant of a selected
│                                          │  folder is disabled with a
│                                          │  reason, not hidden
├──────────────────────────────────────────┤
│  Moving to: 02 Financials                │  Live summary of the target
│  ┌────────────────────────────────────┐  │
│  │            Move here               │  │  Primary, Zone C, full width
│  └────────────────────────────────────┘  │
│         Hold for later instead           │  → staging tray
└──────────────────────────────────────────┘
```

| State | Presentation |
| --- | --- |
| **Loading** | The sheet opens instantly at the current folder with its children as skeletons. Navigating one level deeper shows skeletons in place, never a full-sheet spinner. |
| **Empty (folder has no subfolders)** | "No folders here." plus the always-present **New folder here** row and an enabled **Move here** button, because moving into an empty folder is valid. |
| **Error** | Inline within the sheet: "We could not load this folder." plus Retry. The breadcrumb and the Cancel button remain, so the user is never trapped in a sheet. |
| **Offline** | The picker is not offered. Move and copy are **not queueable** (`BR-130`), so the command that opens this sheet is disabled at source with the reason stated in its accessible name: "Moving needs a connection." Refusing at the point of attempt is the honest behaviour; accepting a move into a queue that cannot honour it is not. The staging tray still holds a selection offline, and **Paste here** becomes available on reconnect. |
| **Partial** | Folders the user cannot write to are listed but disabled with the reason "You cannot add items here". Folders the user cannot see are absent. |
| **Permission-denied (target)** | If permission changes between selection and confirmation, the confirm returns an inline error inside the sheet: "You no longer have permission to add items to 02 Financials." with **Choose another folder**. The selection is preserved. |
| **Invalid target** | A folder that is the selection itself, or a descendant of it, is disabled with "inside selection", because a folder cannot be moved into its own descendant. The reason is text, not just a dimmed row. |
| **Cross-room** | Selecting a different room is permitted only where the user has write access to both; the sheet's root level lists rooms, and a cross-room move shows an extra confirmation line stating that permissions will be inherited from the destination room. |

Interactions: tap a folder row → drill in **within the sheet**. Tap an internal breadcrumb segment
→ jump up within the sheet. Tap **New folder here** → inline text field with the keyboard raised,
confirming creates and drills into it. Tap **Move here** / **Copy here** → execute, dismiss, show
a toast with Undo. Tap **Hold for later instead** → dismiss and arm the staging tray. Swipe down →
Cancel, with a confirmation only if a new folder was created but not used. Keyboard: `Enter` on a
folder drills in, `Backspace` goes up, `Cmd/Ctrl+Enter` confirms.

### Staging tray (the touch analogue of cut / copy / paste and of split view)

```
├──────────────────────────────────────────┤
│ 📋 3 items ready to move  Paste here  ✕  │  Persists across navigation
├──────────────────────────────────────────┤
```

- Armed from selection mode ("Hold for later") or from the destination picker.
- Survives navigation across folders and rooms, and survives a page reload for up to 30 minutes.
- **Paste here** is enabled only where the current folder is a valid target; otherwise it is
  disabled with the reason as its accessible name ("You cannot add items here").
- Tapping the tray body opens a sheet listing the held items, each removable individually.
- ✕ clears the tray with a 10 s undo (`BR-176`).
- Only one tray is armed at a time; arming a new one asks "Replace the 3 items you were holding?"

### 9. Multi-select mode

```
┌──────────────────────────────────────────┐
│ ✕   3 selected              Select all   │  Zone A becomes the selection
│    ⌂ ▸ … ▸ Financials ▸ 2025             │  header. Count is the title.
├──────────────────────────────────────────┤
│  ☑ ▸ 01 Corporate                        │  Checkbox leading, 48 × 48
│    9 items · Shared with 2                │
│  ☐ ▸ 02 Financials                       │
│    23 items                               │
│  ☑ ▪ P&L 2025 YTD.pdf                    │
│    2.4 MB · PDF · 12 Aug                  │
│  ☑ ▪ Lease — Riverside.pdf                │
│    1.1 MB · PDF · 12 Aug                  │
│  ☐ ▪ Payroll register.xlsx    🔒 no dl    │
│    882 KB · Excel · 11 Aug                │
│                                          │
│  ⚠ 1 of 3 items is read-only for you.    │  Mixed-permission notice,
│    Move and Delete are unavailable.  ›   │  tappable for the detail
├──────────────────────────────────────────┤
│  ⬇        ↗        📁        🔗       ⋯  │  Contextual action bar
│ Download  Copy     Move     Share   More │  REPLACES the tab bar
└──────────────────────────────────────────┘
```

**Entering:** long-press any row, or the screen overflow → **Select**. Long-press selects the
pressed row immediately, so the first gesture is never wasted. Long-press does **not** open the row
action sheet, here or anywhere (`FR-FILE-035`); the sheet is opened by the row's ⋯ button on the
trailing edge, ≥ 48 × 48 CSS px, which remains present and tappable in selection mode too
(`FR-MOB-001`).

**Exiting:** tap ✕, press Android back, press `Escape`, or deselect the last item (which exits
automatically after a 300 ms grace period so a mis-tap does not dump the mode). Navigating to
another folder also exits, after warning if items are selected: "Leave selection? 3 items will be
deselected."

**The counter** is the screen title, announced on every change ("4 selected"), and is the
accessible name prefix of the contextual action bar so a screen-reader user always knows the scope
of the action they are about to take.

**Select-all scope** is explicit and stated, because "all" is ambiguous in a paginated list:

| Control | Scope | Copy |
| --- | --- | --- |
| **Select all** | The items currently loaded in this folder | "Select all 47 loaded" |
| Then a second row appears | Every item in this folder, including not-yet-loaded pages | "Select all 212 in this folder" — resolved server-side, and the count is authoritative |
| **Select none** | Clears the selection, stays in selection mode | "Select none" |
| Range | From the last-tapped item to this one | Row sheet → "Select from here to…" |

Select-all never crosses a folder boundary and never includes items the user cannot see.

**Contextual action bar contents**, in fixed order: Download, Copy, Move, Share, More. "More"
opens a grouped sheet: Add to offline, Remove from offline, Rename (single selection only), Change
permissions, Restore (trash only), Delete. A single request carries at most 500 items for
move, copy, delete, restore or share (`BR-219`); above that the interface **splits** the operation
rather than failing it, running it as a server-side job with a progress notification and a
partial-failure report (`NFR-SCALE-011`).

**Mixed permissions.** When a selection spans items with different rights, the rule is: the action
bar shows the **intersection** of permitted actions, and the excluded items are named.

| Situation | Behaviour |
| --- | --- |
| Some items read-only for this user | Move, Delete, Rename and Change permissions are **hidden** (not dimmed, per the context-menu rule). The notice row states "1 of 3 items is read-only for you" and is tappable to list which. |
| Some items have download disabled | Download remains available and acts on the permitted subset **only after** an explicit confirmation naming the split: "Download 2 of 3 items? Downloads are off for 1 item." |
| Selection spans folders and files | Actions valid for both remain; file-only actions (Open in…, Version history) are hidden. |
| Selection spans rooms (from search results) | Move and Copy are hidden; Share is hidden; Download and Add to offline remain. A notice reads "These items are in different rooms." |
| An item's permission changes mid-selection | The item is marked with a small warning glyph, the notice row updates, and any action already dispatched reports it in the partial-failure list rather than failing the whole batch. |

| State | Presentation |
| --- | --- |
| **Loading** | Selection survives a page-in; newly loaded rows arrive unselected unless "Select all in this folder" was used, in which case they arrive selected and the counter updates. |
| **Empty** | Cannot be entered on an empty folder; the Select command is absent. |
| **Error** | A failed bulk action reports per item and leaves the selection intact so the user can retry the failures only. |
| **Offline** | Only the queueable kinds remain: **Rename** (single selection) and **Delete** to trash (`BR-130`). Move, Copy, Share, Change permissions, Restore, Add to offline and Download are disabled with the reason "needs a connection" in the accessible name. |
| **Partial** | The result is always a named list, never a count alone: "Moved 7 items. 2 could not be moved: Lease.pdf (name already exists), Survey.pdf (no permission)." with **Retry these 2**. |
| **Permission-denied** | See the mixed-permission table above. |

### 10. Share sheet

The product's most consequential surface, so it obeys P-7 absolutely: one sheet, one scope, one
explicit Apply, and a summary of exactly what will change.

```
┌──────────────────────────────────────────┐
├══════════════════════════════════════════┤  ← large detent
│                ▁▁▁▁▁                     │
│  Share                            Done   │
│  ▸ 02 Financials  ·  in Riverside HVAC   │  The subject, unambiguous
├──────────────────────────────────────────┤
│  INVITE PEOPLE                           │
│  ┌────────────────────────────────────┐  │
│  │ Email address              Viewer ⌄│  │  Role picker inline
│  └────────────────────────────────────┘  │
│  Recently invited:  t.ferreira@… +       │  SC 3.3.7 — never retype
│                     d.raman@…      +     │
│  ☐ Allow download                        │  Explicit, defaults OFF
│  ┌────────────────────────────────────┐  │
│  │             Send invite            │  │
│  └────────────────────────────────────┘  │
├──────────────────────────────────────────┤
│  WHO HAS ACCESS  (4)                     │
│  ◈ Marcy Doyle          Owner            │
│  ◈ t.ferreira@…         Viewer  ⬇    ⋯  │  ⬇ = download allowed
│  ◈ d.raman@…            Viewer       ⋯  │
│  ◈ a.kim@…              Contributor  ⋯  │
│  ⧗ j.smith@…    Invited 2 d ago · Resend │
├──────────────────────────────────────────┤
│  PUBLIC LINK                             │
│  ○ Off   ● On                            │
│  https://…/s/7Kq2…            Copy  ⧉    │
│  Expires      21 Sep 2026 (EDT)      ›   │
│  Password     Not set                ›   │
│  Download     Off                    ›   │
│  Opened by    12 people              ›   │
│  ┌────────────────────────────────────┐  │
│  │       Turn off and revoke link     │  │  Destructive, styled, last
│  └────────────────────────────────────┘  │
├──────────────────────────────────────────┤
│  Inherited from: Riverside HVAC (room)   │
│  2 people can see this because they can  │
│  see the whole room.                 ›   │
└──────────────────────────────────────────┘
```

| State | Presentation |
| --- | --- |
| **Loading** | The subject line and the inherited-access summary render immediately from the row's cached state; the access list and link state are skeletons. The invite field is usable before the list loads. |
| **Empty (no shares)** | "Only you can see this." then the invite form and the public-link toggle. The inheritance section still renders if the parent grants access, because "only you" would otherwise be a lie. |
| **Error** | "We could not load who has access." plus Retry. The invite form and the link toggle are **disabled** while access state is unknown, because acting on unknown permission state is the one place optimism is unacceptable. |
| **Offline** | The whole sheet is read-only with a banner: "Offline — you cannot change sharing while offline." The cached access list shows with an "as of 14:02" timestamp. Sharing changes are never queued: a permission change that applies at an unknown future moment is a security hazard. |
| **Partial** | If the link's view count fails to load, that row shows "—"; everything else remains actionable. |
| **Permission-denied** | A Viewer or Contributor sees a read-only version: the subject, "Your access: Viewer", and the inheritance summary. No invite form, no link controls, no member list. |
| **Revocation in flight** | The row shows a spinner and "Revoking…", and becomes "Revoked" only when the server has acknowledged — the propagation bound is 5 s at p95 and 60 s absolute (`BR-108`, verified by `NFR-SEC-012`). Failure reports inline with Retry. Never optimistic: a UI that says "revoked" while access persists is the worst possible lie in this product. A download already streaming is cut at the next range boundary and in no case more than 30 s after revocation (`BR-111`), and the sheet says so rather than implying the bytes are recalled. |

Interactions: every control applies on its own explicit confirmation, and every change produces an
audit entry and a toast naming the effect ("t.ferreira@… can now view · Undo"). Role change → a
sheet listing roles with a one-line description of each, and the change summary. Revoke a person →
confirmation naming them and what they lose. Turn off the link → confirmation stating "Anyone with
this link will lose access immediately. 12 people have opened it." Expiry and password each open
their own single sheet, closing this one first. Copy → clipboard plus a toast; the link is never
auto-copied without a tap, so it cannot land in a paste buffer by accident.

### 11. Activity log

```
┌──────────────────────────────────────────┐
│ ‹  Activity                        ⚙ ⋯  │  ⚙ = notification settings
│    Riverside HVAC — Sale             ⌄  │  Scope switcher: room / folder
├──────────────────────────────────────────┤
│  All │ Views │ Changes │ Access │ Security│  Filter segmented control
├──────────────────────────────────────────┤
│  TODAY                                   │
│  ◉ d.raman@… opened P&L 2025 YTD.pdf     │
│    14:02 · 4 min · 9 of 14 pages     ›   │  Page-level for PDFs (R2)
│  ◉ You revoked access for j.smith@…      │
│    11:20 · from iPhone · Tampa, FL   ›   │
│  ◉ a.kim@… uploaded 9 files to 2025      │
│    09:14 · from Mac                  ›   │
│  YESTERDAY                               │
│  ◉ t.ferreira@… downloaded Lease.pdf     │
│    18:44 · 1.1 MB                    ›   │
│  ◉ New sign-in from a new device         │
│    07:02 · Android · Tampa, FL       ›   │  Security event, marked
│                                          │
│         ── Load more (24 of 1,204) ──    │
├──────────────────────────────────────────┤
│  Rooms   Recents   Search    Activity    │
└──────────────────────────────────────────┘
```

| State | Presentation |
| --- | --- |
| **Loading** | Day headers and 6 row skeletons. The scope switcher and filters are interactive immediately. |
| **Empty** | "No activity yet." / "You will see who opened, downloaded and changed things here." For a filtered view: "No access changes in the last 30 days." with a **Clear filters** action. |
| **Error** | "We could not load activity." plus Retry. Never a partial log presented as complete — if the log cannot be trusted to be complete, it says so: "Some activity may be missing. Try again." |
| **Offline** | Cached entries render with a banner "Offline — showing activity up to 14:02." No infinite scroll beyond the cache; the foot note says so explicitly. |
| **Partial** | If viewer analytics (page-level detail) is unavailable, the row renders without the page detail rather than being omitted. Never drop an event to hide a missing field. |
| **Permission-denied** | Only Owner and Manager see the room activity log. A Contributor sees their own actions only, with the header "Your activity". A Viewer has no entry point at all. |
| **Retention boundary** | At the end of the retained window: "Activity before 21 Aug 2024 is no longer retained." plus a link to retention settings, which state the period and who set it — 24 months by default, administrator-configurable within a 6-to-84-month range (`BR-195`). Never a silent end of list. |

Interactions: tap an entry → detail sheet (actor, action, target with a tappable path, exact
timestamp with timezone, IP, device family, request id for support). Tap the scope switcher →
room / specific folder / specific file. Tap a filter → filter the list, with the count announced.
⋯ → **Export CSV** (streams, produces the digest-bearing manifest of `NFR-COMPL-004`), **Mute this
room**, **Notification settings**. Security events are visually distinguished and cannot be
filtered out of the "All" view.

### 12. Settings and theme

```
┌──────────────────────────────────────────┐
│ ‹  Settings                              │
├──────────────────────────────────────────┤
│  (AK)  Andrii K.                     ›   │
│        andrii@…  ·  Staff account        │  Signed in through the company
│                                          │  identity provider
├──────────────────────────────────────────┤
│  APPEARANCE                              │
│  Theme        ● System  ○ Light  ○ Dark  │  Follows OS by default
│  Accent       ⬤ ⬤ ⬤ ⬤ ⬤ ⬤            │  6 pre-validated swatches
│  Density      ● Comfortable  ○ Compact   │
│  Text size    A ──────●──── A            │  Multiplier 0.9–1.6×
│  Reduce motion            Follow system ⌄│
│  ┌────────────────────────────────────┐  │
│  │  Preview                           │  │  Live preview of a real row
│  │  ▪ P&L 2025 YTD.pdf            ⋯  │  │  at the chosen settings
│  │    2.4 MB · PDF · 12 Aug           │  │
│  └────────────────────────────────────┘  │
├──────────────────────────────────────────┤
│  STORAGE                                 │
│  842 GB of 1024 GB used              ›   │  Quota set by an administrator
│                                          │  (BR-199), not by a plan
├──────────────────────────────────────────┤
│  OFFLINE                                 │
│  Saved on this device      412 MB    ›   │
│  ⓘ Your browser may clear saved files    │  Honest, always shown
│    if you do not open the app for a      │
│    week.                                 │
├──────────────────────────────────────────┤
│  DATA USE                                │
│  Load thumbnails    ● Wi-Fi only ⌄       │
│  Preview quality    ● Automatic  ⌄       │
├──────────────────────────────────────────┤
│  NOTIFICATIONS                       ›   │
│  Push on this device: Not available on   │  Per-device truth, not a
│  iOS unless you add the app to your      │  generic toggle
│  Home Screen.  How to do that ›          │
├──────────────────────────────────────────┤
│  SECURITY                                │
│  Passkeys · Sessions · Sign out all  ›   │
├──────────────────────────────────────────┤
│  ADMINISTRATION                      ›   │  Only for a principal holding
│  Storage limits · Retention · People     │  the administrator capability
│                                          │  (BR-044). Absent, not
│                                          │  disabled, for everyone else
├──────────────────────────────────────────┤
│  File extensions      ○ Hide  ● Show     │  Hidden by default per HIG
├──────────────────────────────────────────┤
│  Sign out                                │
│  Delete account                      ›   │  Destructive, last, styled
└──────────────────────────────────────────┘
```

| State | Presentation |
| --- | --- |
| **Loading** | Sections render from local preferences immediately; only the account and storage figures are skeletons. Appearance settings must never wait on the network. |
| **Empty** | n/a. |
| **Error** | Per-section inline: "Could not load your storage usage." plus Retry. Appearance and data-use settings continue to work, because they are local. |
| **Offline** | All appearance, density, text-size and data-use settings work and persist locally. The account, storage and security sections show cached values with an "as of" note; changes to them are disabled with "needs a connection". |
| **Partial** | Storage total unavailable → the bar collapses to "Storage unavailable" and the offline figure still renders, because it is local. |
| **Permission-denied** | An external recipient who arrived on a link with no account sees a reduced Settings: appearance, data use, and — where they authenticated at all — "Sign out". No account, storage, retention, administration or security sections, and no indication that they exist. |
| **Quota reached** | The storage row is red and repeated at the top of the screen with **Free up space** and **Request more space**, which names the administrator on the account (`BR-199`, `BR-201`). |
| **Not an administrator** | The ADMINISTRATION section is absent rather than disabled, and the STORAGE row names who sets the limit ("Limit set by Ashley Kim"), so the user has someone to ask instead of a dead control. |

Interactions: theme, accent, density and text size apply **immediately and live**, with the
preview row rendering the result, and persist per account with a per-device override. Any accent
selection that would fail contrast is not offered (see
[Theming and customisation](#theming-and-customisation)). "How to do that" opens the iOS install
coach mark. Delete account → a dedicated flow stating exactly what is destroyed, the 30-day
retention window and the further 35-day backup horizon after it (`BR-190`, `BR-194`), and
requiring the account email to be typed.

**Withdrawn in the internal-tool rework.** Deleted from this screen and from the screen inventory
under I02, as deletions and not deferrals:

| Withdrawn | Reason |
| --- | --- |
| The plan line under the account name ("Pro plan") | There are no plans. The line now states the account kind |
| The **Upgrade** action, in both the Rooms-home quota row and the Settings quota row | Nothing is purchased. The quota is set by an administrator (`BR-199`) and raised by asking one (`BR-201`) |
| The "Could not load your plan" error and every "plan" row in the loading, offline and permission-denied states | No plan state is fetched, so none can fail to load |
| The "no longer retained on your plan" retention-boundary copy in [Core screens § 11](#11-activity-log) | Retention is administrator-configurable (`BR-195`) |
| "upgrade to continue" in the upload tray's quota state and in the error-copy examples | Same reason. The remedy is free space or an administrator |

No billing, checkout, payment-method, card-entry, invoice or plan-comparison screen was ever
specified in this document, so none was removed; the review gate below now forbids adding one.
Storage governance itself is untouched: the warning thresholds (`BR-196`), the hard stop at the
limit (`BR-201`), the full read-and-share authority retained at the limit (`BR-204`) and the
never-silently-drop-data guarantee (`BR-205`) all remain, and the per-room breakdown remains a
first-class surface (`FR-ACCT-005`).
## Gesture dictionary

Every gesture in the product, with its single assigned meaning, its conflict risk, and its
mandatory non-gesture fallback. A gesture with no fallback fails WCAG 2.2 SC 2.5.1 (Level A) or SC
2.5.7 (AA) and cannot ship.

| Gesture | Where | Action | Conflict risk | Accessible / non-gesture fallback |
| --- | --- | --- | --- | --- |
| **Tap** | Everywhere | Activate. Row body → open. ⋯ → action sheet. Checkbox → toggle (selection mode only). | None. Never used with a delay to disambiguate from double-tap. | This *is* the fallback for everything else. Minimum 48 × 48 px target (`NFR-MOB-002`). |
| **Double-tap** | Viewer only | Toggle fit-width ↔ 2× zoom | Collides with browser double-tap-to-zoom; suppressed inside the viewer via `touch-action`. Never assigned on a list row, because it would add latency to every single tap. | `⊖` / `⊕` zoom buttons in the viewer footer, and `+` / `-` keys. |
| **Long-press (≈500 ms)** | File/folder row, room card, tile, search result | Enters selection mode and selects that item. **One meaning only**, product-wide. It does **not** open the action sheet (`FR-FILE-035`). | Collides with the browser text-selection and callout menu; suppressed with `-webkit-touch-callout: none` and `user-select: none` on row chrome (never on selectable text). | The **Select** command in the screen overflow is the non-gesture route into selection mode. The action sheet is a separate affordance entirely: the row's ⋯ button on the trailing edge, ≥ 48 × 48 CSS px, always visible (`FR-MOB-001`) — so the sheet needs no gesture fallback because it has no gesture. Long-press completes on release and aborts if the finger slides off (SC 2.5.2). |
| **Long-press** | Breadcrumb chip | Jump to the room root. The one long-press that is not selection, because a chip is not a selectable row. | Same as above. | "Go to room root" as the first row of the ancestor sheet, so the gesture carries no unique information. |
| **Swipe left on a row** | File/folder rows, search results | Reveal **Delete** (one action only), which commits on release and shows a 10 s undo toast (`BR-176`) | Owns the horizontal axis; must not start within 24 px of either edge because the Android system back gesture owns both edges and apps may exclude at most 200 dp per edge. Also conflicts with a horizontal chip rail, so rows never contain one. | **Delete** in the row's action sheet, and in the contextual action bar in selection mode. The swipe is a shortcut, never the mechanism. |
| **Swipe right on a row** | File/folder rows | Reveal **Share** (one action only) | As above. | **Share** in the row's action sheet. |
| **Swipe down** | Any sheet | Dismiss | Conflicts with a scrollable sheet body; the sheet only dismisses when the body is already scrolled to top, otherwise the drag scrolls the body. | The sheet's **Cancel** / **Done** button, `Escape`, and Android back. Tapping the grabber cycles detents (SC 2.5.7's non-drag alternative). |
| **Swipe down** | Full-screen viewer | Dismiss and return to the list at the restored scroll position | Conflicts with pan while zoomed; disabled whenever zoom > 1. | The ✕ control in the viewer's top chrome, `Escape`, and Android back. |
| **Swipe left / right** | Full-screen viewer, zoom = 1 | Previous / next file **within the current folder** | Conflicts with horizontal pan when zoomed; suspended whenever zoom > 1. | Visible `‹ prev` / `next ›` controls in the viewer, and `←` / `→` keys. |
| **Pull-to-refresh** | Rooms home, folder lists, search results, activity log | Refresh in place, preserving scroll position, announcing "Updated · 3 new items" | Conflicts with the sheet-dismiss drag and with over-scroll bounce; armed only when the list is at scroll-top. | **Refresh** in the screen overflow sheet, and `Cmd/Ctrl+R`. Apple is explicit that shortcut gestures supplement standard gestures rather than replacing them, so the menu item is mandatory. |
| **Pinch-zoom** | Full-screen viewer, image and PDF | Zoom 1× to 8× | Multi-point, so SC 2.5.1 applies at Level A. | `⊖` / `⊕` buttons, double-tap, and `+` / `-` keys. The page is never `user-scalable=no`, so browser zoom also works everywhere. |
| **Two-finger drag** | Full-screen viewer, zoom > 1 | Pan the zoomed document | Multi-point, so SC 2.5.1 applies. When zoomed, single-finger drag also pans, which is the primary. | Single-finger drag while zoomed, and arrow keys when the viewer has focus. |
| **Edge-swipe (system)** | Android, either edge | System back — pops exactly one app history entry | The app never assigns anything to an edge swipe and never intercepts it. Predictive back is left enabled. | The in-app **Back** control in Zone A, present on every screen on every platform. Mandatory on iOS standalone, which has no system back. |
| **Edge-swipe (iOS)** | iOS, leading edge | Back, where it does not conflict with a horizontal rail | Conflicts with the breadcrumb rail; the rail therefore sits below the title row with a 24 px inline margin so the edge region is clear. | The in-app **Back** control. |
| **Vertical drag on the sheet grabber** | Any sheet | Resize between medium and large detents | SC 2.5.7 applies. | **Tap** the grabber to cycle detents — the platform-native non-drag alternative, which also works with a screen reader. |
| **Horizontal drag on a chip rail** | Breadcrumb, filter chips, sort chips | Scroll the rail | Conflicts with system edge-back and with row swipe; rails never begin within 24 px of an edge and never occupy a row that also has swipe actions. | Rails are keyboard-navigable with arrow keys, and every chip is also reachable from the corresponding sheet (ancestor sheet, filter sheet, sort sheet). |
| **Drag-to-reorder** | Not used on compact width | — | — | Ordering is by sort criteria only; there is no manual ordering in R1. If manual ordering ships later, it must provide "Move up" / "Move down" / "Move to position" commands per SC 2.5.7, and the drag is added only as a shortcut. |
| **Drag-and-drop (files)** | Tablet and desktop with a fine pointer only | Move (or copy with `Alt`/`Option`) | HTML5 drag events do not fire from a finger on Chrome for Android, Firefox Android or Samsung Internet, so this is a fine-pointer enhancement, never a touch mechanism. | **Move to…** / **Copy to…** in every menu at every width, plus the staging tray. |
| **Shake / device motion** | Not used | — | — | No functionality is bound to device motion. |
| **Force-touch / 3D Touch** | Not used | — | — | No functionality is bound to pressure, which is not available across the platform matrix. |

### Global gesture rules

1. **One meaning per gesture per surface.** A gesture never means two things on the same screen.
2. **At most one swipe action per direction per row.** If a row needs more than two actions, swipe
   is dropped entirely for that row type. NN/g documents the "fan effect" where one cue mapped to
   many actions destroys learnability and recall.
3. **The acted-on item stays visible.** A swipe never scrolls the target off screen before the
   action resolves, because the user must be able to confirm what they are about to destroy.
4. **Destructive gestures always pair with undo.** Swipe-delete is a soft delete to trash plus an
   10-second undo toast (`BR-176`), never a permanent delete.
5. **No gesture starts within 24 px of a screen edge**, and no app gesture is assigned to an edge.
6. **Every gesture is abortable** before commit: sliding off cancels a long-press, releasing short
   of the threshold cancels a swipe, and nothing fires on `pointerdown` (SC 2.5.2).
7. **Gestures are announced.** When a gesture-triggered state change occurs (selection mode
   entered, item deleted, page changed), it is announced through a polite live region, because a
   screen-reader user reaches the same state by a different route.

## Action sheets and bottom sheets

Two surface types with different rules. Choosing the wrong one is the most common cause of an
overstuffed, scrolling sheet.

| | **Action sheet** | **Modal bottom sheet** |
| --- | --- | --- |
| Use for | A short set of choices in response to an action the user just initiated (confirm a delete, resolve a name clash, pick move-or-copy) | A grouped set of commands or a form (the file action sheet, the share sheet, the filter sheet, the destination picker, the details sheet) |
| Maximum items | **3 real choices plus Cancel = 4 buttons total.** Apple: "Avoid displaying more than four buttons in an action sheet, including the Cancel button" | No hard cap, but ≤ 12 rows before the sheet must be reorganised into sections, and the body scrolls only when it exceeds the large detent |
| Scrolling | **Never.** Apple: "Avoid letting an action sheet scroll… scrolling an action sheet can be hard to do without inadvertently tapping a button" | Permitted inside the body at the large detent, with the header and primary action pinned |
| Detents | Content height only | Medium (~50%) and large (~90%) |
| Grabber | No | Yes — minimum 48 × 48 px target, tappable to cycle detents |
| Destructive placement | **First**, styled destructive, separated by 16 px, with Cancel last | **Last**, in its own section under a divider, styled destructive |
| Dismissal | Cancel button, tap outside, `Escape`, Android back | Grabber tap, swipe down from scroll-top, Cancel/Done, `Escape`, Android back |
| Backdrop | Scrim at 40% opacity, taps dismiss | Scrim at 40% opacity, taps dismiss unless there are unsaved edits, in which case an action sheet confirms |

Why the destructive placement differs: in an action sheet the destructive item goes at the top
because it must be the most noticeable and furthest from Cancel; in a context-menu-style command
list it goes at the end, per Apple's context-menu guidance ("list destructive items at the end and
mark them destructive"). The two rules are not in conflict — they apply to different surfaces —
and both are implemented, so a reviewer must check which surface they are looking at.

### Universal sheet rules

- **One sheet at a time.** If an action inside a sheet needs another sheet, the first closes first.
  The destination picker is one sheet with internal drill-down for exactly this reason.
- **Every sheet is a history entry**, so Android back and iOS in-app Back close it (`NFR-MOB-028`).
- **Focus is trapped** inside an open sheet, returns to the invoking control on dismissal, and the
  focused element is never behind the keyboard (SC 2.4.11).
- **Unavailable commands are hidden, not dimmed.** Apple's context-menu rule inverts the usual
  convention here, and it also protects the invisibility rule: a dimmed "Manage access" tells a
  Viewer that access management exists on this item.
- **Sheets never cover the bottom tab bar at the medium detent**, so the user always knows where
  they are.
- Sheet height is capped at `100dvh - env(safe-area-inset-top) - 24px` so the scrim is always
  visible and the sheet never reads as a full screen without a dismissal affordance.

### Exact item lists

**A file row's action sheet** (modal bottom sheet, grouped). Items absent when not permitted.

| Section | Items |
| --- | --- |
| *(header)* | Icon, full name, size · type · modified |
| Open | Open, Open in… , Download |
| Organise | Rename, Move to… , Copy to… , Hold for later |
| Share | Share, Manage access, Copy link |
| Offline | Save for offline / Remove from offline |
| Info | Details, Version history, Activity |
| *(divider)* | |
| Destructive | **Delete** — destructive style, last |

**A folder row's action sheet**

| Section | Items |
| --- | --- |
| *(header)* | Folder glyph, name, "12 folders · 47 files" |
| Open | Open, Folder map |
| Add | Upload here, New folder inside, Take a photo into this folder |
| Organise | Rename, Move to… , Copy to… , Hold for later |
| Share | Share, Manage access, Copy link |
| Offline | Save this folder for offline / Remove |
| Info | Details, Activity |
| *(divider)* | |
| Destructive | **Delete folder and everything in it** — destructive style, last, and the label itself states the blast radius before the confirmation is even opened |

**A multi-selection's "More" sheet** (the contextual action bar carries Download, Copy, Move,
Share, More)

| Section | Items |
| --- | --- |
| *(header)* | "3 selected" and, when relevant, "1 item is read-only for you" |
| Organise | Rename *(single selection only)*, Hold for later |
| Offline | Save for offline, Remove from offline |
| Access | Change permissions *(hidden if any item is read-only for this user)* |
| Restore | Restore *(trash only)* |
| *(divider)* | |
| Destructive | **Delete 3 items** — destructive style, last, count in the label |

**Confirmation action sheets** (the only sheets with a 4-button cap), examples with verbatim copy:

| Trigger | Sheet |
| --- | --- |
| Delete a folder | Title: "Delete 02 Financials?" · Body: "This will permanently delete **3 folders** and **47 files**, including 12 files shared with 2 people. They go to Trash for 30 days (`BR-177`)." · Buttons: **Delete 50 items** (destructive, first), Cancel |
| Name clash on upload | Title: "Lease.pdf already exists" · Buttons: **Keep both** (result: "Lease (2).pdf"), **Replace as a new version**, Cancel |
| Revoke a public link | Title: "Turn off this link?" · Body: "Anyone with the link loses access immediately. 12 people have opened it." · Buttons: **Turn off link** (destructive, first), Cancel |
| Leave selection | Title: "Leave selection?" · Body: "3 items will be deselected." · Buttons: **Leave**, Cancel |

## Selection mode

The wireframe, the select-all scope table and the mixed-permission table are in
[Core screens § 9](#9-multi-select-mode). This section is the normative behaviour spec.

### Lifecycle

```
  browse ──long-press row──────────────►  selecting (n = 1)
  browse ──overflow ▸ Select───────────►  selecting (n = 0)
                                              │
                             tap row ─────────┤ n ± 1, counter announced
                    "Select from here to…" ───┤ n += range
                          "Select all" ───────┤ n = loaded count
              "Select all in this folder" ────┤ n = authoritative server count
                                              │
  selecting ──✕ / Escape / Android back ─────►  browse
  selecting ──deselect last (+300 ms grace)──►  browse
  selecting ──navigate away (confirm) ───────►  browse
  selecting ──action dispatched ─────────────►  selecting (selection retained
                                                 on partial failure) or browse
                                                 (on full success)
```

- Entry is instantaneous: long-press selects the pressed row in the same gesture, so no tap is
  wasted.
- The **300 ms grace period** on deselecting the last item exists so that a mis-tap does not
  collapse the mode and lose the user's place; re-selecting within the grace period cancels the
  exit.
- On full success, the mode exits and the toast reports the outcome. On partial failure, the mode
  stays open with only the failed items selected, so **Retry** acts on exactly the failures.
- Selection state is held in memory only. It does not survive a reload, and the mode is not
  restored on cold start, because a restored selection the user does not remember making is a
  hazard next to a Delete button.
- Entering selection mode replaces the bottom tab bar rather than covering it, and hides the FAB,
  so nothing is stacked and nothing is obscured.

### Permission intersection

The contextual action bar renders the intersection of what is permitted across the whole
selection, computed client-side for responsiveness and re-checked server-side on dispatch:

```
allowed(action) = every selected item permits action
                  AND action is valid for every selected item's kind
                  AND (action is not mutating OR the room is not read-only for this user)
```

Actions failing the test are **hidden**, not dimmed, and the notice row names the count and the
reason. The server remains the enforcement point: a client-side intersection is a courtesy, and
`NFR-SEC-015` requires every mutating route to reject a non-permitted principal regardless of
client state.

### Announcements

| Event | Announcement (polite live region) |
| --- | --- |
| Mode entered | "Selection mode. 1 selected." |
| Item toggled | "4 selected." |
| Select all (loaded) | "47 selected. Select all 212 in this folder is available." |
| Select all (folder) | "212 selected." |
| Mode exited | "Selection cancelled." |
| Action dispatched | "Moving 3 items." |
| Action completed | "Moved 3 items. Undo available." |
| Partial failure | "Moved 7 items. 2 could not be moved. Review the list." |

## Feedback, motion and haptics

### Toasts and undo

| Property | Value |
| --- | --- |
| Placement | Floating, 16 px above the bottom action bar or tab bar, plus `env(safe-area-inset-bottom)`. Never over the bar, never at the top, never over the FAB. |
| Width | `min(100% - 32px, 480px)`, centred |
| Duration | **10 seconds** when it carries an Undo, so that the toast lives exactly as long as the window it offers (`BR-176`); **4 seconds** for pure acknowledgement; **persistent with a manual dismiss** for an error the user must act on |
| Undo window | **10 seconds** (`BR-176`) — one figure, product-wide, for move, copy, rename, delete-to-trash, permission grant, and pin/unpin. It is stated implicitly by the toast's presence, and the action is committed server-side immediately with a compensating operation on undo — never held client-side, because a held operation is lost when the page freezes. For a delete, activating it restores the entire subtree to its exact prior state including grants revoked by the delete; after the window closes, recovery is through trash for 30 days (`BR-177`) |
| Stacking | One toast at a time. A new toast replaces the current one, and the replaced action is committed (its undo window ends). Rapid repeat actions coalesce: "Moved 6 items" rather than six toasts |
| Interaction | Tapping the body dismisses; tapping **Undo** reverts; swiping the toast horizontally dismisses without committing early |
| Accessibility | Rendered into a polite live region (SC 4.1.3), never focus-stealing. The Undo control is keyboard-reachable for the full window, and `Cmd/Ctrl+Z` triggers it. |
| Reduced motion | Fades in over 100 ms instead of sliding |

Actions with **no** undo, which therefore require confirmation instead: permanent delete from
trash, revoke a share, turn off a public link, remove a member, transfer ownership, delete a room,
delete an account.

### Progress representation

| Situation | Representation |
| --- | --- |
| Known duration, single item | Determinate linear progress with a percentage and a byte count |
| Known duration, batch | Aggregate determinate bar plus "3 of 12" plus a time estimate, only shown once two chunks have completed so the estimate is not a guess |
| Unknown duration, < 1 s expected | Nothing. Optimistic UI applies (`NFR-PERF-028`) |
| Unknown duration, 1–3 s expected | Skeleton of the awaited content |
| Unknown duration, > 3 s expected | Skeleton plus, after 3 s, a line of honest copy naming what is happening ("Preparing 212 files…") |
| Server-side job (bulk over the 500-item request cap, `BR-219`) | A persistent row in the Activity tab with progress, plus a completion notification, because the user is expected to navigate away |
| Long document render | Determinate line under the viewer's top chrome, plus a progressive first page |

**Skeleton versus spinner rule.** Use a **skeleton** whenever the shape of the incoming content is
known — lists, rows, tiles, sheets, detail panels. Use a **spinner** only for an indeterminate
action with no shape, and only inside the control that triggered it (a button's inline spinner).
Never a full-screen spinner over content the user is already reading; dim the stale content to 60%
instead. Skeletons match the real element's height exactly so that arrival causes no layout shift
(`NFR-PERF-003`).

### Motion

| Transition | Duration | Easing | Reduced-motion variant |
| --- | --- | --- | --- |
| Screen push / pop (folder drill-down) | 280 ms | `cubic-bezier(0.2, 0, 0, 1)` (emphasised decelerate) | 100 ms opacity fade, no translation |
| Sheet present | 320 ms | `cubic-bezier(0.05, 0.7, 0.1, 1)` | 100 ms fade |
| Sheet dismiss | 240 ms | `cubic-bezier(0.3, 0, 0.8, 0.15)` | 100 ms fade |
| Detent change | 200 ms | `cubic-bezier(0.2, 0, 0, 1)` | Instant |
| Toast in / out | 200 / 150 ms | Standard decelerate / accelerate | 100 ms fade |
| Viewer open from a row | 300 ms shared-element transform | Emphasised decelerate | 100 ms fade, no transform |
| Row swipe reveal | Tracks the finger 1:1; snap 180 ms | Standard | Swipe disabled; overflow only |
| Checkbox appearance on entering selection mode | 160 ms, staggered 12 ms per row, capped at 8 rows | Standard | Instant, no stagger |
| Progress bar fill | Continuous, no easing | Linear | Unchanged (informational, not decorative) |
| Skeleton shimmer | 1,400 ms loop | Linear | **Removed.** Static tinted block |
| Pull-to-refresh spinner | Tracks the finger, then 600 ms rotation | Linear | Static glyph with the announcement only |

Rules: nothing animates for longer than 320 ms; no animation blocks input; no parallax anywhere;
no animation on a list that is scrolling. Under `prefers-reduced-motion: reduce` a single motion
token switch removes every transform-based animation, and this is asserted by test
(`NFR-A11Y-014`).

### Haptics

Haptics fire on exactly five events, and nowhere else (`NFR-MOB-030`):

| Event | Pattern | Notes |
| --- | --- | --- |
| Selection mode entered | Single light impact | Confirms the long-press landed, which is otherwise invisible until the checkboxes render |
| Destructive action confirmed | Single medium impact | Fires on the confirm tap, not on opening the confirmation |
| Upload batch completed | Single success pattern | Only for a batch, never per file |
| Error requiring action | Single error pattern | Paired with the toast, never alone |
| Pull-to-refresh threshold reached | Single light impact | Fires at the threshold, not at release |

Never on: scroll, every tap, page turn, toggle, keystroke, or progress milestones. Suppressed
entirely under `prefers-reduced-motion: reduce` and under an explicit Settings toggle. On iOS
Safari, where the Vibration API is unavailable, haptics are a documented no-op and no copy
promises them.
## Forms and text input on mobile

### Keyboard type per field

Every text input declares `type`, `inputmode`, `enterkeyhint`, `autocomplete`, `autocapitalize`
and `spellcheck` explicitly. Defaults are wrong for almost every field in this product.

| Field | `type` | `inputmode` | `enterkeyhint` | `autocomplete` | Capitalise | Spellcheck |
| --- | --- | --- | --- | --- | --- | --- |
| Email (sign-in, invite) | `email` | `email` | `next` / `send` | `email` / `username` | off | off |
| Password | `password` | — | `done` | `current-password` | off | off |
| New password | `password` | — | `done` | `new-password` | off | off |
| One-time code | `text` | `numeric` | `done` | `one-time-code` | off | off |
| Folder name | `text` | `text` | `done` | `off` | sentences | off |
| File name (rename) | `text` | `text` | `done` | `off` | off | off |
| Room name | `text` | `text` | `done` | `off` | words | on |
| Search query | `search` | `search` | `search` | `off` | off | off |
| Link password | `text` (with a reveal toggle) | `text` | `done` | `off` | off | off |
| Expiry date | `date` | — | `done` | `off` | — | — |
| Page number (viewer jump) | `text` | `numeric` | `go` | `off` | off | off |
| Note / message on an invite | `textarea` | `text` | `enter` | `off` | sentences | on |

Rules: paste is never blocked, including in password and one-time-code fields (SC 3.3.8,
`NFR-A11Y-020`). Autofill and password managers are supported through correct `autocomplete`
tokens. `maxlength` is never used as the only length control, because it silently truncates a paste
— length is validated and reported instead. `autocorrect` is off for every filename field, because
autocorrecting "Q3 mgmt accts" is destructive.

### The rename pattern

There is no double-click-to-edit and no inline contenteditable row. Rename is a sheet:

```
├══════════════════════════════════════════┤  ← medium detent, keyboard up
│                ▁▁▁▁▁                     │
│  Rename file                     Cancel  │
├──────────────────────────────────────────┤
│  ┌────────────────────────────────────┐  │
│  │ P&L 2025 YTD                       │  │  Basename only is selected.
│  └────────────────────────────────────┘  │  Extension is not shown while
│  .pdf will be kept                       │  extensions are hidden, and is
│                                          │  never editable by accident.
│  ⚠ A file called "P&L 2025 YTD" already  │  Live conflict check, debounced
│    exists here.                          │  400 ms, after first blur or
│    ○ Keep both  ○ Replace as new version │  after 3 characters typed
│  ┌────────────────────────────────────┐  │
│  │               Rename               │  │  Zone C, above the keyboard
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
     ┌──────────────────────────────────┐
     │  software keyboard               │
     └──────────────────────────────────┘
```

- The field is prefilled with the current name and **only the basename is preselected**, so typing
  replaces the name and never destroys the extension. Extensions are hidden by default per Apple's
  file guidance, with a Settings toggle to show them; when shown, the extension is a separate,
  editable field with a warning if it is changed.
- Duplicate-name conflict is surfaced **in the same sheet** as an explicit choice (Keep both /
  Replace as a new version / Cancel), never a silent auto-rename. "Keep both" shows the resulting
  name before the user commits.
- Forbidden characters are rejected as they are typed, with the reason named once ("Names cannot
  contain / or \\"), not with a silent filter that makes the keyboard feel broken.
- The length limit is enforced in **UTF-8 bytes** (255, `BR-158`) because that is what storage
  enforces, and warned about in **graphemes** at 80 percent of the allowance (`BR-161`), because a
  byte count is meaningless to the person typing. `maxlength` is never used, so a paste over the
  limit is reported rather than silently truncated.
- Trailing spaces and dots are trimmed on commit, and the trim is shown in the resulting name
  before confirmation.

### Keyboard avoidance

The binding rule: with the software keyboard open, the focused field, its label, its validation
message and the primary confirm button are simultaneously visible (`NFR-MOB-004`, SC 2.4.11).

Implementation:

1. `interactive-widget=resizes-content` in the viewport meta so the layout viewport shrinks.
2. `env(keyboard-inset-bottom)` (with a `visualViewport` listener as the fallback) as bottom
   padding on the sheet, so the primary action rides above the keyboard.
3. `scroll-padding-bottom` on the scroll container sized to the keyboard inset plus the sticky bar
   plus `env(safe-area-inset-bottom)`, so browser-driven scroll-into-focus lands correctly.
4. The bottom tab bar hides while the keyboard is open, and the FAB hides, so the confirm button
   is the only bottom-anchored control.
5. On the keyboard dismissing, scroll position is preserved rather than reset.

### Autofocus policy

| Screen | Autofocus? |
| --- | --- |
| Search, entered from the Search tab | **Yes.** The user's intent is unambiguous. |
| Search, entered from a folder's magnifier | **Yes**, with the scope preset to that folder. |
| Rename sheet | **Yes**, basename preselected. |
| New folder sheet | **Yes**, empty field. |
| Sign-in | **Yes** on the email field, on first load only, never after a validation error (the error is announced instead, and focus stays where the user left it). |
| Invite email field in the share sheet | **No.** The sheet has other content the user must read first, and raising the keyboard would hide the access list. |
| Link password / expiry sheets | **Yes**, single-purpose sheets. |
| Page-jump field | **Yes**, numeric keyboard. |
| Any confirmation sheet | **No.** Focus goes to the sheet container, and the destructive button is never the initially focused element. |

### Validation timing and error placement

| When | What |
| --- | --- |
| While typing | Only **permissive** feedback: character counters, the "Keep both" resulting-name preview, and rejection of forbidden characters with a single explanatory message. Never a red error on a field the user has not finished. |
| On blur | Format validation (email shape, date validity). Errors appear **below** the field, in text, associated by `aria-describedby`, announced politely. |
| On submit | Server validation. The first invalid field receives focus, the error is announced, and the summary appears above the primary action, never at the top of a scrolled-away form. |
| Async (name conflict) | Debounced 400 ms, shown as a warning with choices rather than an error, because a conflict is a decision and not a mistake. |
| Never | A validation error that fires mid-IME-composition (`NFR-I18N-011`), or a submit button disabled with no explanation of why. |

Errors are always: **below the field**, in text (never colour alone), 4.5:1 contrast, prefixed by
an icon with an accessible name, and reachable without scrolling from the field they describe.

## Offline and poor-network UX

### State machine

```
                    ┌──────────────────────────────────────┐
                    │              ONLINE                  │
                    │  No banner. Full function.           │
                    └───┬───────────────────────────┬──────┘
       2 requests > 1.5s│                           │ navigator.onLine = false
       or effectiveType │                           │ or 3 consecutive
       2g / slow-2g     ▼                           ▼ network failures
        ┌───────────────────────────┐   ┌──────────────────────────────┐
        │           SLOW            │   │           OFFLINE            │
        │ Amber banner. Thumbnails  │   │ Grey banner. Reads from      │
        │ off, prefetch off, search │◄──┤ cache. 3 BR-130 kinds queue. │
        │ submit-on-enter.          │   │ Everything else is refused.  │
        └───────────┬───────────────┘   └──────────┬───────────────────┘
                    │                              │ online event, or a
       3 fast        │                              │ successful probe
       requests      │                              ▼
                    │              ┌──────────────────────────────────┐
                    │              │          RECONNECTING            │
                    │              │ Blue banner. Queue draining.     │
                    └──────────────┤ Conflicts surfaced individually. │
                       queue empty └──────────────┬───────────────────┘
                       + probe ok                 │ queue drained
                            ▲                     │
                            └─────────────────────┘  → ONLINE
```

Transitions are debounced by 2 seconds in each direction so a brief blip does not flash a banner,
except the transition **into** OFFLINE on an explicit `offline` event, which is immediate because
the user needs to know before they tap something.

### Banner copy, verbatim

| State | Banner | Placement | Dismissible |
| --- | --- | --- | --- |
| ONLINE | *(none)* | — | — |
| SLOW | "Slow connection — images are off to keep things moving." | Below Zone A, amber, 40 px | Yes, returns if the state persists after 5 minutes |
| OFFLINE | "Offline — you can read what is saved on this device. Changes will be sent when you reconnect." | Below Zone A, grey, 40 px (56 px when it wraps at 200% text) | No |
| OFFLINE, nothing cached | "Offline — this room is not saved on this device." | As above | No |
| RECONNECTING | "Back online — sending 3 changes…" | Below Zone A, blue, 40 px | No, disappears on drain |
| RECONNECTING, conflict | "Back online. 1 change needs your attention." + **Review** | As above | No, until resolved |
| READ-ONLY (server write path down) | "Read-only right now — we cannot save changes. Your queued changes are safe." | Below Zone A, amber | No |

Every banner is a polite live region, and every banner change is announced once, not on every
re-render.

### What is readable offline

| Content | Offline availability |
| --- | --- |
| Rooms list, room names, room metadata | Yes, for rooms opened in the last 7 days |
| Folder structure and item metadata | Yes, for folders visited in the last 7 days |
| Explicitly pinned files | Yes, in full |
| Last 20 viewed documents | Yes, in full |
| Thumbnails | Yes, for cached items only |
| Search | Local cache only, scope forced to "Saved on this device" |
| Activity log | Cached entries only, with an explicit "up to" timestamp |
| Share state ("who can see this") | Cached, with a mandatory "as of HH:MM" timestamp |
| Sharing changes | **Not available**, by design |
| Storage figures | Cached, marked as of a timestamp |

Every offline-available item carries the honest label "Saved on this device" and the caveat "Your
browser may clear saved files if you do not open the app for a week", stated once in Settings and
once in the offline banner's detail sheet (`NFR-MOB-014`). This is not a soft promise dressed up:
Safari deletes script-created storage for an origin with no interaction in the last seven days, and
eviction is all-or-nothing across IndexedDB, Cache API and OPFS together.

### What is queued, and how a queued mutation looks

**The queueable mutation kinds are exactly three: file upload, rename, and delete-to-trash**
(`BR-130`). That list is complete and closed, and this file states no fourth.

| Kind | Queued offline | Cited |
| --- | --- | --- |
| File upload | Yes. Items sit in the upload tray as **Queued**, retaining their destination folder, and resume automatically on reconnect | `BR-130` |
| Rename | Yes. The row shows the pending name in words | `BR-130` |
| Delete to trash | Yes. The row is dimmed and marked, and the 10-second undo (`BR-176`) runs against the queue entry | `BR-130` |

Everything else requires a live connection and is **refused at the point of attempt**, with the
reason stated in the control's accessible name rather than accepted into a queue the product cannot
honour: move, copy, replace-as-new-version, folder create, restore from trash, permanent delete,
pin/unpin for offline, any permission change, share creation, share revocation, link configuration,
role change, ownership transfer, and every account-level action. Two different reasons converge
here. A permission change that applies at an unknown future moment is a security hazard. And a move
or a copy queued against a hierarchy that may have been reorganised in the meantime has no
well-defined target, so honouring it later is guesswork dressed as reliability.

**Withdrawn in the internal-tool rework.** This section previously listed eight queueable kinds.
Five are withdrawn under D17 as defects against `BR-130`: **create folder**, **move**, **copy**,
**restore-from-trash** and **pin/unpin for offline**. Each is now in the refused list above, and
the three places that depended on them are corrected with it — the offline state of
[Core screens § 2](#2-room-contents--list-view), the offline state of the
[destination picker](#8-move--copy-destination-picker), and the offline row of
[selection mode](#9-multi-select-mode).

A queued mutation appears **in place**, where its result will land:

```
  ▪ Lease — Riverside.pdf           ⏳  ⋯   │  ⏳ = queued, 60% opacity
    1.1 MB · PDF · Will be renamed to       │  Secondary line states the
    "Lease v2.pdf"                          │  pending change in words

  ▪ Scan 2026-08-21.pdf             ⏳  ⋯   │  An upload queued while
    4.8 MB · Will upload to ▸ 2025          │  offline appears in place,
                                            │  dimmed, from the moment it
                                            │  is chosen
```

- The item is interactive: tapping ⋯ offers **Cancel this change**.
- The queue is inspectable from the offline banner: tap → a sheet listing every pending change in
  order, each cancellable.
- The queue is durable, reconstructed on next app open, and every entry carries a client-generated
  operation id so replay is idempotent (`NFR-MOB-016`).
- Ordering is preserved: a rename followed by a delete-to-trash replays in that order, and a
  dependent operation whose predecessor failed is held, not applied, with the dependency named.

### Conflict surfacing on reconnect

Conflicts are never resolved silently and never resolved in bulk. Each is a separate decision:

```
├══════════════════════════════════════════┤
│                ▁▁▁▁▁                     │
│  1 change needs your attention           │
├──────────────────────────────────────────┤
│  ▪ Lease — Riverside.pdf                 │
│  You renamed this to "Lease v2.pdf"      │
│  while offline. Someone else renamed it  │
│  to "Lease — final.pdf" at 14:20.        │
│                                          │
│  ○ Keep their name  (Lease — final.pdf)  │
│  ○ Use my name      (Lease v2.pdf)       │
│  ○ Keep both        (creates a copy)     │
│  ┌────────────────────────────────────┐  │
│  │               Apply                │  │
│  └────────────────────────────────────┘  │
│  Skip for now                            │
└──────────────────────────────────────────┘
```

| Conflict | Choices offered |
| --- | --- |
| Both renamed | Keep theirs / Use mine / Keep both (creates a copy) |
| Moved by both — a **live** conflict between two connected sessions, never a queued one, since move is not queueable (`BR-130`) | Keep their location / Use my location, each naming the actual folder path |
| Edited an item deleted by someone else | Restore it with my change / Discard my change |
| Uploaded a name that now exists | Keep both (resulting name shown) / Replace as a new version / Cancel |
| Version token stale (a 409 from the API) | Show what changed, then Retry my change / Discard my change |
| Permission removed while a change was queued | "You no longer have permission to change this." / Discard, with the item named |

"Skip for now" leaves the conflict in the queue and keeps the banner, so nothing is silently lost.

## Theming and customisation

### Token architecture

Three layers, and components may only reference the third.

```
  Layer 1 — PRIMITIVES        Layer 2 — SEMANTIC          Layer 3 — COMPONENT
  raw, never used directly    role-based, theme-aware      per-component, optional
  ────────────────────        ────────────────────────     ─────────────────────
  --grey-50 … --grey-950      --surface                    --row-bg
  --blue-50 … --blue-900      --surface-raised              --row-bg-selected
  --red-…, --amber-…,         --surface-sunken               --sheet-scrim
  --green-…                   --text-primary                 --bar-bg
  --space-1 … --space-12      --text-secondary               --fab-bg
  --radius-sm/md/lg/full      --text-on-accent
  --dur-fast/base/slow        --border, --border-strong
  --ease-standard/emph        --accent, --accent-hover
                              --accent-subtle
                              --danger, --danger-subtle
                              --warning, --success
                              --focus-ring
                              --overlay-scrim
```

Rules:

1. A component that references a Layer 1 primitive fails review. There is no exception for "just
   this one border".
2. Semantic tokens are defined **completely** on bare `:root` for light, then redefined for dark in
   two places so that both the explicit toggle and the system default work:
   `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { … } }` and
   `:root[data-theme="dark"] { … }`. No colour ever has its only definition inside a media query.
3. `body` always paints an explicit `--surface` background, so the page never borrows a host
   background.
4. Density and text size are token multipliers, not per-component overrides.

### Palettes and contrast

Contrast figures below are the design targets; every combination is verified by the automated audit
in `NFR-A11Y-013`, across the full accent × theme matrix.

**Light theme**

| Token | Role | Contrast requirement | Target |
| --- | --- | --- | --- |
| `--text-primary` on `--surface` | Body text, file names | ≥ 4.5:1 | **≥ 12:1** (near-black on near-white) |
| `--text-secondary` on `--surface` | Metadata line (size · type · date) | ≥ 4.5:1 | **≥ 5.5:1** — this is the line most often failed, because designers treat it as decoration |
| `--text-on-accent` on `--accent` | Primary button label | ≥ 4.5:1 | **≥ 5:1** |
| `--accent` on `--surface` | Links, active tab, focus | ≥ 3:1 as a graphical object; ≥ 4.5:1 where it is text | **≥ 4.6:1** |
| `--border` on `--surface` | Row dividers, input borders | ≥ 3:1 | **≥ 3.2:1** |
| `--danger` on `--surface` | Destructive labels | ≥ 4.5:1 | **≥ 5:1** |
| `--focus-ring` against both adjacent colours | Focus indicator, ≥ 2 px | ≥ 3:1 | **≥ 3.5:1** |

**Dark theme**

| Token | Role | Contrast requirement | Target |
| --- | --- | --- | --- |
| `--surface` | Page ground | — | Not pure black. A dark grey ground so that elevated surfaces can be distinguished, and so OLED smearing on scroll is avoided |
| `--text-primary` on `--surface` | Body text | ≥ 4.5:1 | **≥ 11:1**, and not pure white — pure white on near-black causes halation |
| `--text-secondary` on `--surface` | Metadata | ≥ 4.5:1 | **≥ 5.5:1** |
| `--accent` on `--surface` | Links, active states | ≥ 4.5:1 for text | **≥ 4.8:1** — accents are lightened in dark theme, never reused from light |
| `--border` on `--surface` | Dividers | ≥ 3:1 | **≥ 3.2:1**, achieved with a lighter border rather than a shadow, because shadows are invisible in dark |
| `--surface-raised` vs `--surface` | Sheets, cards | Distinguishable without relying on shadow | **≥ 1.3:1** luminance ratio between the two |

### System following and manual override

- Default is **System**. `prefers-color-scheme` drives the theme, and the change applies live
  without a reload.
- Manual **Light** / **Dark** sets `data-theme` on the root and wins over the media query in both
  directions, which is why the dark tokens are declared twice.
- The choice is stored per account **and** per device, with the device value taking precedence, so
  a user with a dark phone and a light laptop is not fighting a synced preference.
- The theme is applied before first paint from a synchronous inline read of the stored preference,
  so there is no flash of the wrong theme.
- `color-scheme: light dark` is declared so form controls, scrollbars and the address bar match.

### User-customisable axes

| Axis | Range | How contrast is protected |
| --- | --- | --- |
| **Accent colour** | Six pre-validated hues, each with a separate light-theme and dark-theme value | Only pre-validated pairs are offered. There is **no free colour picker** in R1, because an arbitrary hue cannot be guaranteed to pass 4.5:1 as a text colour and 3:1 as a graphical object in both themes. If a picker ships later, the chosen hue is clamped in lightness to the nearest compliant value and the user is told: "Adjusted slightly to stay readable." |
| **Density** | Comfortable (row 64 px) / Compact (row 56 px) | Compact reduces vertical padding only. It never reduces a touch target below 48 × 48 px: at Compact the row is 56 px and the ⋯ button retains a 48 px hit region with transparent padding. Density is disabled (locked to Comfortable) when the OS reports a large text scale, because the two compound. |
| **Text size** | 0.9× to 1.6× multiplier on the type scale | Applied through `rem` scaling on the root, so every spacing token that uses `rem` scales with it. Verified at 1.6× combined with 200% browser zoom, which is the true worst case. Rows grow rather than clip; the overflow button never leaves the viewport. |
| **Reduce motion** | Follow system / Always / Never | "Never" cannot re-enable motion for a user whose OS requests reduction — the OS wins, and the control explains why. |
| **Thumbnails** | Always / Wi-Fi only / Never | Data-use axis rather than an appearance one; documented here because it changes layout density perception. |

### OLED and dark-mode battery note

Dark theme on an OLED panel draws materially less power than light theme, because unlit pixels
consume almost nothing; on an LCD panel the difference is negligible because the backlight is
always on. Two consequences for this product:

1. **Do not claim a battery figure.** Assumption: the saving is real on OLED and near-zero on LCD,
   and we cannot detect the panel type from the web platform, so any specific percentage in copy
   would be invented. Dark theme is offered because users want it, and the battery effect is a
   side benefit we do not quantify.
2. **Do not use pure black to chase the saving.** A pure-black ground removes the elevation cues
   that the sheet-heavy interaction model depends on, and causes visible smearing on OLED during
   fast list scrolling. The dark ground is a dark grey, and `--surface-raised` is distinguishable
   from it by luminance rather than by shadow.

Where battery genuinely matters is the foreground upload with a screen wake lock, which is why
`NFR-MOB-018` bounds the wake lock and `NFR-PERF-029` budgets session energy.

## Accessibility implementation checklist

A developer ticks this per screen before requesting review. The WCAG criterion is beside each item
so a failure is reportable as a specific defect rather than a general concern. This checklist is
the `G8` gate content for accessibility; the automated portions are also `G1`.

**Structure and semantics**

- [ ] One `h1` per screen, headings in order, no level skipped — SC 1.3.1
- [ ] Lists use `role="grid"` (or a native table at `expanded` and above) with correct `aria-rowcount` and
      `aria-rowindex` that reflect the **full** collection, not the virtualised window — SC 1.3.1,
      `NFR-A11Y-017`
- [ ] Every row announces name, type, size or child count, modified date, selected state, share
      state and offline state — SC 1.3.1, `NFR-A11Y-017`
- [ ] Landmarks present: `banner`, `main`, `navigation`, `contentinfo`; the bottom tab bar is a
      `navigation` with an accessible name — SC 1.3.1
- [ ] Sheets are `role="dialog"` with `aria-modal="true"` and a labelled title — SC 4.1.2

**Touch and pointer**

- [ ] Every target ≥ 48 × 48 CSS px with ≥ 8 px separation; any exception documented against one of
      the five permitted escapes — SC 2.5.8, `NFR-MOB-002`
- [ ] No function is drag-only; every drag has a tap equivalent — SC 2.5.7
- [ ] No function requires a multipoint or path-based gesture — SC 2.5.1
- [ ] Nothing fires on `pointerdown`; every gesture is abortable and every destructive action is
      undoable or confirmed — SC 2.5.2
- [ ] No hover-only affordance; hover styles live inside
      `@media (hover: hover) and (pointer: fine)` — SC 1.4.13 and platform reality
- [ ] No swipe within 24 px of a screen edge — platform requirement (Android gesture exclusion)

**Layout and text**

- [ ] No two-dimensional scrolling at 320 CSS px width — SC 1.4.10
- [ ] Fully operable in portrait and landscape — SC 1.3.4
- [ ] Survives 200% text resize and 1.6× dynamic type with no clipped control — SC 1.4.4,
      `NFR-A11Y-018`
- [ ] Text spacing overrides (line height 1.5, paragraph spacing 2×, letter spacing 0.12em) cause
      no loss — SC 1.4.12
- [ ] Content reflows correctly with a 40% string-length increase — `NFR-I18N-003`

**Colour and contrast**

- [ ] Text ≥ 4.5:1, large text ≥ 3:1, in both themes and every accent — SC 1.4.3
- [ ] UI component boundaries and meaningful graphics ≥ 3:1 — SC 1.4.11
- [ ] No information conveyed by colour alone: every state also carries text or a shape (queued,
      offline, read-only, error, share state) — SC 1.4.1
- [ ] Focus indicator ≥ 2 px, ≥ 3:1 against both adjacent colours — SC 2.4.7, 2.4.13

**Keyboard and focus**

- [ ] Every function reachable and operable by keyboard, on phone and desktop — SC 2.1.1
- [ ] No keyboard trap; focus returns to the invoking control when a sheet closes — SC 2.1.2
- [ ] Focused element never entirely hidden by a sticky bar, an open sheet, a toast or the software
      keyboard — SC 2.4.11
- [ ] Focus order matches visual order; roving `tabindex` on lists so the list is one tab stop —
      SC 2.4.3
- [ ] Visible skip-to-content at `expanded` and above — SC 2.4.1

**Status, forms and errors**

- [ ] Every asynchronous status announced in a polite live region without stealing focus — SC 4.1.3
- [ ] Every input has a persistently visible label, not a placeholder standing in for one —
      SC 3.3.2
- [ ] Errors identify the field, state the problem in words and suggest a fix — SC 3.3.1, 3.3.3
- [ ] Icon-only controls have an accessible name containing their visible label — SC 2.5.3
- [ ] No information is re-requested within a flow; recipients are offered for selection —
      SC 3.3.7
- [ ] Paste permitted in password and one-time-code fields; `autocomplete` tokens correct;
      passkeys offered where available — SC 3.3.8
- [ ] Destructive actions are confirmed with a text statement of the blast radius, and the undo is
      keyboard-reachable for its whole window — SC 3.3.4, `NFR-A11Y-022`

**Motion and timing**

- [ ] `prefers-reduced-motion: reduce` removes every transform animation and all haptics —
      SC 2.3.3
- [ ] No content flashes more than three times per second — SC 2.3.1
- [ ] No time limit on any interaction except the undo window, which is extendable by interacting
      with the toast — SC 2.2.1
- [ ] Auto-updating content (activity log, upload tray) can be paused or does not move focus —
      SC 2.2.2

**Screen-reader verification** (per `NFR-A11Y-016`)

- [ ] VoiceOver on iOS: swipe-navigate the whole screen, confirm row semantics and every status
      announcement
- [ ] TalkBack on Android: same, plus confirm that the system back gesture behaves
- [ ] NVDA on Windows: keyboard-only traversal of the `expanded` layout
- [ ] Recorded transcript of the announced row string attached to the story

## Keyboard and external-keyboard support

Keyboard support is not a desktop-only feature. It is a WCAG Level A obligation that applies on a
phone with a Bluetooth keyboard or a switch-access device, and it is simultaneously the desktop
enhancement. Shortcuts activate whenever a hardware keyboard is detected, at any viewport width.

### Shortcut table

| Shortcut | Scope | Action |
| --- | --- | --- |
| `↑` `↓` | List | Move the focused row |
| `←` | List | Go up one level (same as Back) |
| `→` / `Enter` | List, folder focused | Drill into the folder |
| `Enter` | List, file focused | Open the full-screen viewer |
| `Space` | List | Toggle selection of the focused row, entering selection mode if needed |
| `Shift+↑/↓` | List | Extend the selection |
| `Cmd/Ctrl+A` | List | Select all loaded; press again for "all in this folder" |
| `Escape` | Anywhere | Close the sheet, exit selection mode, clear search, or close the viewer — in that precedence order |
| `Home` / `End` | List | First / last loaded item |
| `Page Up` / `Page Down` | List, viewer | Page the list; page the document |
| Type any character | List | Jump to the next item starting with it; a second character within 800 ms extends the prefix |
| `Cmd/Ctrl+F` or `/` | Anywhere | Focus search, scoped to the current folder |
| `Cmd/Ctrl+Shift+F` | Anywhere | Focus search, scoped to all rooms |
| `F2` | List | Rename the focused item |
| `Cmd/Ctrl+Shift+M` | List | **Move** — opens the destination picker for the focused row or the current selection, the same command as "Move to…". This is the direct move; `Cmd/Ctrl+X` then `Cmd/Ctrl+V` is the staging-tray route to the same result |
| `Cmd/Ctrl+X` | List | Cut — arms the staging tray with the selection |
| `Cmd/Ctrl+C` | List | Copy — arms the staging tray in copy mode |
| `Cmd/Ctrl+V` | List | Paste here from the staging tray |
| `Cmd/Ctrl+D` | List | Duplicate |
| `Delete` / `Backspace` | List | Delete to trash, with the confirmation for folders and the undo toast for files |
| `Cmd/Ctrl+Shift+N` | List | New folder |
| `Cmd/Ctrl+U` | List | Upload files here |
| `Cmd/Ctrl+Shift+V` | List | **Toggle view** — list ↔ tiles, persisting the preference like the ▤/▦ control does. Safe to bind because the browser's paste-and-match-style meaning of this chord applies only in an editable field, and the rule below bars list shortcuts from firing there |
| `Cmd/Ctrl+I` | List, viewer | Toggle details — the details sheet at `compact` and `medium`, the docked inspector at `expanded` and above |
| `Cmd/Ctrl+Z` | Anywhere | Undo the last undoable action while its window is open |
| `Cmd/Ctrl+R` | Anywhere | Refresh the current list |
| `Cmd/Ctrl+1` … `4` | Anywhere | Switch to the Rooms / Recents / Search / Activity destination |
| `Cmd/Ctrl+K` | Anywhere | Command palette (R2) |
| `?` | Anywhere | Open the shortcut reference sheet |
| `+` / `-` / `0` | Viewer | Zoom in / out / fit-width |
| `←` `→` | Viewer | Previous / next file in the folder |
| `g` then a page number, `Enter` | Viewer | Jump to page |
| `Tab` / `Shift+Tab` | Anywhere | Move between regions and controls; the list is a single tab stop |

Rules: no single-letter shortcut fires while a text field has focus, except type-ahead inside the
list. No list shortcut of any kind fires while an editable element has focus. Shortcuts are shown
in the menu bar at `expanded` and above and in the `?` sheet, and **not** in context menus, per
Apple's guidance. Every shortcut has a pointer and touch equivalent, so no function is
keyboard-only.

**The ten shortcuts `FR-MOB-039` requires are all present**, and this table is checked against the
requirement rather than the other way round: navigate (`↑` `↓` `←` `→`), select (`Space`),
select-range (`Shift+↑/↓`), rename (`F2`), **move** (`Cmd/Ctrl+Shift+M`), delete
(`Delete`/`Backspace`), search (`Cmd/Ctrl+F`), new folder (`Cmd/Ctrl+Shift+N`), upload
(`Cmd/Ctrl+U`) and **toggle view** (`Cmd/Ctrl+Shift+V`). Move and toggle view were missing from
this table while the requirement named them, and are added under D18. `FR-MOB-039` is **R1**: the
shortcut set is what makes a colleague with a keyboard-and-phone or keyboard-and-tablet setup
productive, and it is active at every size class the moment a hardware keyboard is detected — a
keyboard is a capability, not a width.

### Focus order rule

Focus order is: skip link (desktop) → Zone A controls in visual order (Back, title, breadcrumb
rail as one stop, Search, overflow) → the sort/filter rail as one stop → the list as **one stop**
with a roving `tabindex` → the FAB → Zone D destinations. A sheet traps focus and restores it to
the invoking control on close. The focused row is scrolled into view with `scroll-padding-bottom`
accounting for the sticky bar and the keyboard, so it is never obscured (SC 2.4.11).

### One app, three input situations

| Situation | What changes | What does not change |
| --- | --- | --- |
| **Phone, touch only** | No focus rings until the first `Tab` or arrow key; no hover styles; shortcuts inert | Every command is reachable by tap through a visible control |
| **Phone or tablet with a Bluetooth keyboard** | The full `FR-MOB-039` set is live, focus rings visible, `?` sheet available — at **any** size class, including `compact`. The layout does **not** gain the tree rail, the docked inspector or split view unless the size class also permits it (`expanded` and above); an attached keyboard is not a width | The bottom bar remains at `compact`; sheets remain sheets; every touch path remains |
| **Fine pointer (mouse, trackpad, stylus)** | Hover affordances, right-click context menus, marquee selection and drag-and-drop, all gated on the pointer rather than the width. The tree rail, docked inspector, split view and menu bar arrive separately, on the size class (`expanded` and above) | The overflow button, "Move to…", selection mode, the destination picker and the staging tray all remain, because they are the keyboard- and screen-reader-accessible routes |

Detection is by capability, not by width or user agent: `@media (pointer: fine)` and
`@media (hover: hover)` for the pointer, and a first-keydown listener for the keyboard. A
touchscreen laptop therefore gets both, which is the correct outcome and the case user-agent
sniffing gets wrong (`NFR-COMPAT-004`, `NFR-COMPAT-011`).

## Copy guidelines

### Voice

Plain, specific, and calm. The reader is a competent professional in a hurry, often on a bad
connection, sometimes standing in a car park. Write as a careful colleague would speak.

| Do | Do not |
| --- | --- |
| Say what happened and what to do next | Apologise at length, or blame the user |
| Use the user's nouns: room, folder, file, link, invite | Use ours: entity, resource, ACL, principal, tenant |
| State numbers: "3 folders and 47 files" | Say "some items" or "this content" |
| Name the actual thing: "Lease — Riverside.pdf" | Say "the selected item" |
| Use sentence case for everything, including buttons | Use Title Case, ALL CAPS, or exclamation marks |
| Put the verb in the button: **Delete 50 items**, **Move here**, **Send invite** | Use OK, Yes, Submit, Continue |
| Say "you" and "we" | Say "the system", "the application", or the passive voice for a failure |
| Keep a button label to ≤ 3 words where possible, ≤ 5 as the hard limit | Write a sentence on a button |
| State a real limitation once, clearly | Hide a limitation, or repeat it on every screen |

Never use an em dash as a stylistic connector in product copy; use a full stop or a comma.

### Error message formula

Three parts, always in this order, and never more than two sentences:

> **What happened.** *(state, past tense, specific, with the item named)*
> **Why.** *(one clause, only when it is genuinely known and useful)*
> **What to do.** *(an action the user can take, ideally as the adjacent button label)*

| Bad | Good |
| --- | --- |
| "An error occurred." | "We could not move Lease.pdf. The connection dropped. Try again." |
| "Upload failed (500)." | "Survey.pdf did not finish uploading. The connection dropped at 12 MB of 40 MB. Retry." |
| "Permission denied." | "You cannot add items to 02 Financials. Your access is Viewer. Ask Marcy Doyle for Contributor access." |
| "Invalid name." | "Folder names cannot contain / or \\. Try 2025 Q3 instead." |
| "Quota exceeded." | "Storage is full, so this upload is paused. Nothing was lost. Free up space, or ask your administrator to raise the quota." |
| "Sync error." | "1 change needs your attention: Lease.pdf was renamed by someone else while you were offline. Review." |

Never include: an HTTP status code, a stack trace, a correlation id in the main text (it goes in a
"Details for support" disclosure), or the word "unexpected".

### Standard strings for the destructive and conflict flows

These strings are normative. Placeholders in `{braces}` are ICU-formatted with plural rules
(`NFR-I18N-009`).

| Key | String |
| --- | --- |
| `delete.folder.title` | "Delete {folderName}?" |
| `delete.folder.body` | "This permanently deletes {folderCount, plural, one {# folder} other {# folders}} and {fileCount, plural, one {# file} other {# files}}, including {sharedCount, plural, =0 {nothing shared} one {# file shared with others} other {# files shared with others}}. They go to Trash for {retentionDays} days." |
| `delete.folder.confirm` | "Delete {totalCount, plural, one {# item} other {# items}}" |
| `delete.file.title` | "Delete {fileName}?" |
| `delete.file.body` | "It goes to Trash for {retentionDays} days. Anyone it is shared with loses access now." |
| `delete.bulk.title` | "Delete {count, plural, one {# item} other {# items}}?" |
| `delete.bulk.body` | "This includes {folderCount, plural, one {# folder} other {# folders}} and everything inside {folderCount, plural, one {it} other {them}}: {nestedCount, plural, one {# more item} other {# more items}}." |
| `delete.permanent.title` | "Permanently delete {count, plural, one {# item} other {# items}}?" |
| `delete.permanent.body` | "This cannot be undone. There is no Trash to restore from." |
| `delete.room.title` | "Delete {roomName}?" |
| `delete.room.body` | "This deletes {folderCount, plural, one {# folder} other {# folders}} and {fileCount, plural, one {# file} other {# files}}, and removes access for {peopleCount, plural, one {# person} other {# people}}. Type the room name to confirm." |
| `delete.undo.toast` | "Deleted {count, plural, one {# item} other {# items}}." + action "Undo" |
| `conflict.name.title` | "{fileName} already exists" |
| `conflict.name.keepBoth` | "Keep both" |
| `conflict.name.keepBoth.detail` | "Saved as {resultingName}" |
| `conflict.name.replace` | "Replace as a new version" |
| `conflict.name.replace.detail` | "The current file becomes version {currentVersion}. Nothing is lost." |
| `conflict.name.cancel` | "Do not add this file" |
| `conflict.version.title` | "{itemName} changed while you were away" |
| `conflict.version.body` | "{actorName} changed it at {time}. Your change was not saved yet." |
| `conflict.version.mine` | "Use my change" |
| `conflict.version.theirs` | "Keep their change" |
| `conflict.deleted.title` | "{itemName} was deleted" |
| `conflict.deleted.body` | "{actorName} deleted it at {time}, after you made your change." |
| `conflict.deleted.restore` | "Restore it with my change" |
| `conflict.deleted.discard` | "Discard my change" |
| `conflict.move.descendant` | "You cannot move a folder into itself or into a folder inside it." |
| `revoke.link.title` | "Turn off this link?" |
| `revoke.link.body` | "Anyone with the link loses access immediately. {openCount, plural, =0 {No one has opened it yet} one {# person has opened it} other {# people have opened it}}." |
| `revoke.person.title` | "Remove {personName}?" |
| `revoke.person.body` | "They lose access to {scopeName} immediately. Their previous downloads are not recalled." |
| `readonly.blocked` | "You cannot change this. Your access is {roleName}." |
| `upload.paused.background` | "Paused — reopen the app to continue." |
| `upload.offline` | "Offline — uploads will continue when you reconnect." |
| `upload.partial` | "{ok} of {total} uploaded. {failed, plural, one {# failed} other {# failed}}." + action "Retry {failed, plural, one {# file} other {# files}}" |
| `offline.cache.caveat` | "Your browser may clear saved files if you do not open the app for a week." |
| `download.destination` | "Saved to your Downloads folder. Open the Files app to find it." |
| `share.blocked.offline` | "You cannot change sharing while offline." |
| `bulk.partial` | "{ok, plural, one {# item} other {# items}} done. {failed, plural, one {# item} other {# items}} could not be: {reasons}." |

## Mobile UX review gate

A story is not Done until every applicable line passes. This is the `G8` gate. The reviewer is a
person other than the implementer, holding the reference handset, on a throttled connection.

**Reachability and layout**

- [ ] Completed one-handed, thumb only, no grip shift, on the reference handset
- [ ] Every primary action is in the bottom third or a bottom sheet; nothing primary in the top bar
- [ ] Verified at every [reference viewport](#reference-viewports--a-test-matrix-not-a-breakpoint-set):
      320, 360, 390 and 414 px portrait, and 844 × 390 landscape, with no horizontal body scroll
- [ ] Every responsive rule the story touches cites a class name from 03's size-class ladder. A new
      breakpoint anywhere in the diff fails the gate (D10)
- [ ] Split view, the tree rail and the docked inspector appear at `expanded` and above, and split
      view only above the 480 CSS px height floor
- [ ] Verified at 200% text and 1.6× dynamic type with no clipped control
- [ ] Bottom-anchored elements clear the home indicator (`env(safe-area-inset-bottom)` applied)
- [ ] With the software keyboard open, the focused field, its error and the primary button are all
      visible

**Touch primitives**

- [ ] Every target ≥ 48 × 48 px with ≥ 8 px separation; destructive neighbours ≥ 16 px
- [ ] Every gesture has a visible, non-gesture equivalent
- [ ] Long-press on a row enters selection mode and selects that row, and opens **no** sheet
      (`FR-FILE-035`)
- [ ] Every row carries a visible ⋯ button on its trailing edge, ≥ 48 × 48 CSS px, and it is the
      only route to the action sheet (`FR-MOB-001`)
- [ ] No swipe begins within 24 px of a screen edge; the Android system back still works everywhere
- [ ] Nothing is drag-only; nothing fires on `pointerdown`
- [ ] No hover-dependent affordance at compact width

**Navigation**

- [ ] Every sheet, selection mode and viewer is a popable history entry
- [ ] Android system back and the iOS in-app Back both pop exactly one level with no dead end
- [ ] Deep link into this screen works from cold start in all nine documented outcomes
- [ ] Scroll position restores to within ±40 px on return
- [ ] The breadcrumb collapses correctly at 360 px and at 200% text, and the ancestor sheet works

**States**

- [ ] Loading uses a shape-matched skeleton and causes no layout shift
- [ ] Empty state names what to do and offers the action
- [ ] Error state says what happened, why if known, and what to do
- [ ] Offline state is honest, names what is readable, and queues **only** upload, rename and
      delete-to-trash (`BR-130`). Anything else offered as queueable fails the gate
- [ ] Partial failure names every failed item and its reason, and offers Retry on the failures only
- [ ] There is no "you do not have access" screen. A principal with no grant on the target sees the
      not-found state, in the same words and the same layout as a target that never existed
      (`BR-233`)
- [ ] A dead, expired or revoked link renders exactly "This link is no longer active." plus the
      request-access action, and discloses nothing else — no name, no owner, no reason, no expiry
      (`BR-099`, `BR-234`)
- [ ] Read-only state hides mutating commands rather than dimming them

**Safety**

- [ ] Every destructive action states its blast radius in text, with counts
- [ ] Every reversible action has a 10-second undo (`BR-176`); every irreversible one has a confirmation
- [ ] No destructive action is the first tap in the thumb resting zone
- [ ] Name conflicts offer Keep both / Replace as a new version / Cancel, never a silent rename
- [ ] Sharing and permission changes are never optimistic and never queued offline

**Feedback**

- [ ] Every asynchronous status is in a polite live region and does not steal focus
- [ ] Toast sits above the bottom bar and does not obscure the acted-on item
- [ ] Haptics fire only on the five permitted events, and are suppressed under reduced motion
- [ ] All animation is removed under `prefers-reduced-motion: reduce`

**Accessibility**

- [ ] The [accessibility checklist](#accessibility-implementation-checklist) is complete for this
      screen, with the WCAG criterion recorded against any exception
- [ ] Screen-reader pass recorded on VoiceOver or TalkBack, with the announced row string attached
- [ ] Full keyboard traversal with a Bluetooth keyboard, no trap, focus never obscured

**Performance**

- [ ] Bundle budget not regressed (`NFR-PERF-019` to `021`)
- [ ] Interaction measured under 200 ms on the reference device for the interactions this story
      touches
- [ ] Virtualised list still holds ≥ 55 fps on the 10,000-item fixture
- [ ] No long task over 50 ms introduced

**Honesty**

- [ ] Every capability claim in the copy is true on iOS Safari, installed iOS, installed Android
      and an in-app WebView
- [ ] No copy implies background transfer, durable offline storage, or a known download location
- [ ] Every limitation the user will hit is stated before they hit it, not after
- [ ] No plan, tier, price, upgrade, payment or checkout surface appears anywhere in the diff. This
      is an internal tool; the storage quota is set by an administrator (`BR-199`) and raised by
      asking one (`BR-201`)
