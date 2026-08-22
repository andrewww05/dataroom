## ADDED Requirements

### Requirement: Breadcrumb Navigation

The client application must display the current path in the folder hierarchy as interactive breadcrumbs.

#### Scenario: FR-NAV-020 Breadcrumbs rendering

- **WHEN** the user navigates into a nested folder
- **THEN** the UI displays breadcrumbs reflecting the path from the root to the current folder.

#### Scenario: FR-NAV-020 Breadcrumb interaction

- **WHEN** the user clicks an ancestor folder in the breadcrumb trail
- **THEN** the application navigates to that folder's view.
