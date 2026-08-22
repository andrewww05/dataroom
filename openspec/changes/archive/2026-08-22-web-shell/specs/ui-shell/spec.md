## Purpose
The `ui-shell` capability defines the foundational web application layout, global routing rules, and application-wide states (loading, error) that host the core Data Room experience.

## ADDED Requirements

### Requirement: Application Layout
The web application must render a three-pane layout once authenticated, providing a consistent structure across routes.

#### Scenario: FR-NAV-040 Three-pane layout structure
- **WHEN** an authenticated user accesses a valid internal route
- **THEN** the application renders the persistent three-pane layout (sidebar, main content area, details pane).

### Requirement: Skeleton and Error States
The application must handle loading and error states gracefully at the global level.

#### Scenario: FR-VIEW-010 Global skeleton loading
- **WHEN** the application is fetching the initial data for a route
- **THEN** it displays skeleton loaders matching the expected layout instead of a blank screen or a spinner.

#### Scenario: FR-VIEW-010 Global error boundary
- **WHEN** a fatal client-side error occurs or an unhandled API error is encountered during routing
- **THEN** the application renders an error state with a descriptive message and an option to retry or return home.
