## ADDED Requirements

### Requirement: List View
The client application must render folders and files in a list view format.

#### Scenario: FR-VIEW-010 Rendering the list view
- **WHEN** a folder's contents are loaded successfully
- **THEN** the main content area renders a list view showing the folder's nodes, including their names, types, and relevant metadata.

### Requirement: Empty States
The client application must guide the user when a folder is empty.

#### Scenario: FR-VIEW-010 Empty folder state
- **WHEN** a user navigates to a folder that contains no children
- **THEN** the list view displays an empty state illustration or message indicating there are no files or folders here.
