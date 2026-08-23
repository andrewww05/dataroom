# data-room Specification

## Purpose

The `data-room` capability handles the lifecycle and presentation of the user's Data Room entity in the client application.

## Requirements

### Requirement: Data Room Title Display

The UI MUST display the name of the active Data Room prominently in the shell.

#### Scenario: FR-ROOM-010 Data Room title in header

- **WHEN** the user is authenticated and the Data Room data is loaded
- **THEN** the application header displays the Data Room's name.

### Requirement: Data Room setup on signup

The client MUST handle the onboarding flow when a Data Room is created during sign up.

#### Scenario: FR-ROOM-010 Transparent room creation

- **WHEN** a user successfully completes the sign-up form
- **THEN** the client immediately transitions to the authenticated layout, showing the newly created Data Room and root folder.

### Requirement: FR-ACCT-010 — A Data Room reports what it holds in total

The API SHALL report, for one Data Room, the total bytes stored in it and the total number of files
in it, at every depth, in one request — `GET /data-rooms/:id/usage` returning `{ bytes, files }`.
The figures SHALL be exact, never sampled, estimated or capped, and SHALL be a plain JSON number
even beyond 32 bits. Folders contribute nothing to either figure.

The sidebar footer SHALL show those two figures for the owner's Data Room, and SHALL keep them
current: an upload, a delete, a copy or a paste SHALL be reflected without a reload. While the
figures are in flight the footer SHALL say so rather than show a zero standing in for an unknown
(BR-030), and a failure to fetch them SHALL be visible rather than silent (BR-050).

Usage belongs to the owner of the room (BR-010): a caller with no claim on that room, including a
share principal, SHALL receive `404 NOT_FOUND` rather than `403`, so a room's size cannot be probed
by id.

#### Scenario: FR-ACCT-010 the total covers every depth

- **WHEN** the usage of a Data Room whose files sit at mixed depths is read
- **THEN** the byte total is the sum of every file in the room and the file count is every file in
  it, whichever folder each sits in

#### Scenario: FR-ACCT-010 an empty Data Room reports zeros

- **WHEN** the usage of a Data Room holding no files is read
- **THEN** both figures are zero, and neither is null, absent or negative

#### Scenario: FR-ACCT-010 folders are not counted as files and add no bytes

- **WHEN** the usage of a Data Room holding many folders and one file is read
- **THEN** the file count is one and the byte total is that file's size

#### Scenario: FR-ACCT-010 a total beyond 32 bits is reported exactly

- **WHEN** the usage of a Data Room holding more than 4 GiB is read
- **THEN** the byte total is exact and is a plain JSON number, not a string, an object or a rounded
  value

#### Scenario: FR-ACCT-010 another Data Room's rows are never counted

- **WHEN** the usage of a Data Room is read while other Data Rooms hold files of their own
- **THEN** the figures cover only the room asked about

#### Scenario: FR-ACCT-010 BR-010 another owner's room is not found

- **WHEN** a signed-in owner reads the usage of a Data Room they do not own
- **THEN** the response is `404 NOT_FOUND`, never `403`, and carries no figure

#### Scenario: FR-ACCT-010 BR-010 a share principal cannot read a room's usage

- **WHEN** a request authenticated by a share token reads the usage of the room its shared node sits
  in
- **THEN** the response is `404 NOT_FOUND`, so the size of the surrounding room stays invisible to a
  viewer holding a link into one folder of it

#### Scenario: FR-ACCT-010 the footer shows both figures

- **WHEN** the owner is signed in and the figures have arrived
- **THEN** the sidebar footer shows the total bytes stored and the total number of files for their
  Data Room

#### Scenario: FR-ACCT-010 the footer follows a write without a reload

- **WHEN** the owner uploads a file, deletes one, or pastes a copied folder
- **THEN** the footer's figures update to match, with no reload

#### Scenario: BR-030 figures in flight are not guessed at

- **WHEN** the usage figures have not arrived yet
- **THEN** the footer shows that they are loading and shows no number until the real one arrives

#### Scenario: BR-050 usage that cannot be fetched fails visibly

- **WHEN** the usage request fails
- **THEN** the footer says the figures could not be loaded rather than showing zero or nothing at all
