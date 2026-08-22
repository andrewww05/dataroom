## Purpose

The `data-room` capability handles the lifecycle and presentation of the user's Data Room entity in the client application.

## ADDED Requirements

### Requirement: Data Room Title Display

The UI must display the name of the active Data Room prominently in the shell.

#### Scenario: FR-ROOM-010 Data Room title in header

- **WHEN** the user is authenticated and the Data Room data is loaded
- **THEN** the application header displays the Data Room's name.

### Requirement: Data Room setup on signup

The client must handle the onboarding flow when a Data Room is created during sign up.

#### Scenario: FR-ROOM-010 Transparent room creation

- **WHEN** a user successfully completes the sign-up form
- **THEN** the client immediately transitions to the authenticated layout, showing the newly created Data Room and root folder.
