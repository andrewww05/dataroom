## ADDED Requirements

### Requirement: The shared view resolves behind its own shell, not a spinner

While `/s/{token}` is resolving the token, the screen SHALL show the shared view's own shell — the
header strip, the breadcrumb bar and a listing placeholder — rather than a centred spinner
(FR-SHARE-070, FR-VIEW-070). A visitor SHALL never see an empty page on this route.

The shell shown during the wait SHALL carry no content the resolve has not yet returned. The owner's
email and the shared node's name are only known once the token resolves, and a `RESTRICTED` link
opened by a stranger never reveals them at all (FR-SHARE-020, BR-010) — so the placeholder SHALL name
neither, and SHALL NOT stand in a guess for either.

When resolution settles, the placeholder SHALL be replaced directly by whichever screen the token
resolves to — the shared listing, the single-file viewer, the sign-in screen, or the removal screen —
with no empty frame between the two.

#### Scenario: FR-SHARE-070 the wait shows the shared view's own shell

- **WHEN** a visitor opens a `/s/{token}` link and resolving the token takes measurable time
- **THEN** they see the read-only header strip, the breadcrumb bar and placeholder rows for the whole
  wait, and no centred spinner appears

#### Scenario: FR-SHARE-020 the wait reveals nothing about what is behind the link

- **WHEN** a stranger opens a `RESTRICTED` link and the resolve is still in flight
- **THEN** the placeholder names neither the owner's email nor the shared node's name, and shows no
  stand-in text in their place

#### Scenario: FR-SHARE-070 a folder share replaces the placeholder with its listing

- **WHEN** the token resolves to a folder share
- **THEN** the placeholder rows are replaced by the shared listing under the same header strip, and
  the screen does not go blank between the two

#### Scenario: FR-SHARE-070 a file share replaces the placeholder with the viewer

- **WHEN** the token resolves to a single-file share
- **THEN** the placeholder is replaced by the single-file viewer, and no empty frame appears in
  between

#### Scenario: FR-SHARE-050 a revoked token replaces the placeholder with the removal screen

- **WHEN** the resolve answers `404 NOT_FOUND` because the share was revoked, expired, or its node
  deleted
- **THEN** the placeholder is replaced by "This content was removed by its owner" — never left in
  place, and never a blank page

#### Scenario: FR-SHARE-020 a restricted token replaces the placeholder with the sign-in screen

- **WHEN** the resolve answers `401 SIGN_IN_REQUIRED`
- **THEN** the placeholder is replaced by the sign-in-required screen, with no blank frame in between
