# ui-shell Specification

## Purpose

The `ui-shell` capability defines the foundational web application layout, global routing rules, and application-wide states (loading, error) that host the core Data Room experience.

## Requirements

### Requirement: Application Layout

The web application MUST render a three-pane layout once authenticated, providing a consistent structure across routes.

#### Scenario: FR-NAV-040 Three-pane layout structure

- **WHEN** an authenticated user accesses a valid internal route
- **THEN** the application renders the persistent three-pane layout (sidebar, main content area, details pane).

### Requirement: Skeleton and Error States

The application MUST handle loading and error states gracefully at the global level.

#### Scenario: FR-VIEW-010 Global skeleton loading

- **WHEN** the application is fetching the initial data for a route
- **THEN** it displays skeleton loaders matching the expected layout instead of a blank screen or a spinner.

#### Scenario: FR-VIEW-010 Global error boundary

- **WHEN** a fatal client-side error occurs or an unhandled API error is encountered during routing
- **THEN** the application renders an error state with a descriptive message and an option to retry or return home.

### Requirement: FR-VIEW-050 — Light and dark themes, following the OS until overridden

The application SHALL render in a light and a dark theme (FR-VIEW-050). With no stored preference it
SHALL follow the operating system's `prefers-color-scheme`. A control in the header SHALL override
that choice, and the override SHALL be remembered across reloads and across routes. The stored
override SHALL keep winning when the OS setting later changes; only clearing it returns the app to
following the OS.

One set of CSS custom properties SHALL drive both themes, so every surface — the shell, the listing,
dialogs, the viewer, toasts and the shared `/s/{token}` view — changes together and no component
carries a colour literal of its own. The chosen theme SHALL be applied before the first paint, so no
reload flashes the wrong theme.

#### Scenario: FR-VIEW-050 a first visit follows the operating system

- **WHEN** someone opens the app with no stored preference and the OS set to dark
- **THEN** the app renders dark, and rendering light when the OS is set to light

#### Scenario: FR-VIEW-050 the header control overrides the OS

- **WHEN** the owner switches the theme from the header while the OS is set to dark
- **THEN** the app switches immediately to the chosen theme without a reload

#### Scenario: FR-VIEW-050 the override survives a reload and outlives an OS change

- **WHEN** the owner chooses light on a dark OS, reloads, and then the OS switches to light and back
  to dark
- **THEN** the app stays light throughout, because a stored override outranks the OS setting

#### Scenario: FR-VIEW-050 no flash of the wrong theme on load

- **WHEN** the app is loaded with dark stored
- **THEN** the first painted frame is already dark — no light frame appears first

#### Scenario: FR-VIEW-050 every surface follows the theme together

- **WHEN** the theme is dark and the owner opens a dialog, the file viewer, a toast and the shared
  `/s/{token}` view
- **THEN** each renders in the dark palette, with no pane, overlay or control left in light colours

#### Scenario: FR-VIEW-050 text stays legible in both themes

- **WHEN** either theme is active
- **THEN** body text, muted text and every control's label remain readable against their own
  background, and no state is signalled by a colour that disappears in the other theme

### Requirement: FR-VIEW-070 — No surface renders blank while it loads

Every window in which the application has nothing to show yet SHALL be filled with a placeholder
shaped like the content that will replace it (FR-VIEW-070). This covers four windows that the
listing's own skeleton (FR-NAV-040) does not:

1. Before the client has mounted — the document SHALL already paint the shell's outline.
2. While the session is being resolved on a route that requires one.
3. While the application is redirecting from one of its own routes to another.
4. While any pane, tree or footer inside the shell is waiting on its own request.

A placeholder SHALL occupy the same box as the content it stands in for, so nothing on screen moves
when the real content arrives. It SHALL be drawn in the active theme's colours — never a light
rectangle on a dark background (FR-VIEW-050). It SHALL NOT be a centred spinner, and SHALL NOT be a
line of text where a shaped placeholder is possible. No route, at any point in its load, SHALL render
an empty document body.

A placeholder is a wait, never a resting state: when the request behind it settles, it SHALL be
replaced by the content, the empty state, or that surface's own error state with a retry (BR-050).

#### Scenario: FR-VIEW-070 the first painted frame is the shell, not an empty page

- **WHEN** the app is loaded on any route with a cold cache, so the client has not yet mounted
- **THEN** the first painted frame already shows the shell's outline — a sidebar column, a header bar
  and a listing placeholder — in the stored theme's colours, and no frame shows an empty body

#### Scenario: FR-VIEW-070 resolving the session shows the shell rather than nothing

- **WHEN** a signed-in owner loads a route that must resolve the session before it can render, and
  that resolution takes measurable time
- **THEN** the shell placeholder is on screen for the whole wait, and is replaced by the real shell
  without the page going blank in between

#### Scenario: FR-VIEW-070 the room's entry point redirects without a blank frame

- **WHEN** the owner loads `/` and the app redirects them into the room's root folder
- **THEN** every frame between the two URLs shows either the placeholder or a listing — never an
  empty content area

#### Scenario: FR-VIEW-070 an anonymous caller reaches sign-in without a blank frame

- **WHEN** someone with no session loads a route that requires one
- **THEN** they see the placeholder and then the sign-in screen, and no frame in between is empty

#### Scenario: FR-VIEW-070 moving between folders keeps a listing shape on screen

- **WHEN** the owner opens a folder from the listing or the tree
- **THEN** the content area shows either the previous listing or the listing placeholder until the
  new listing arrives, and the toolbar above it stays on screen throughout

#### Scenario: FR-VIEW-070 the pane, the tree and the footer each show their own shape

- **WHEN** the details pane's figures, an expanded tree node's children, or the storage footer's
  totals are still in flight
- **THEN** each shows a placeholder shaped like the content it is waiting for — not a line of text
  saying it is loading, and not an empty box holding the space

#### Scenario: FR-VIEW-070 a placeholder does not move the layout when it resolves

- **WHEN** any placeholder is replaced by the real content
- **THEN** the rows, controls and panes around it keep the positions they had, so nothing jumps under
  the pointer

#### Scenario: FR-VIEW-050 a placeholder follows the active theme

- **WHEN** the dark theme is active and any of these placeholders is on screen, including the one
  painted before the client mounts
- **THEN** it is drawn in the dark palette, and no white or light rectangle appears at any point

#### Scenario: BR-050 a placeholder is replaced by a failure, never left on screen

- **WHEN** the request behind a placeholder fails
- **THEN** that surface shows its error state with a way to retry, and the placeholder is gone — it is
  never left in place as the final thing the owner sees
