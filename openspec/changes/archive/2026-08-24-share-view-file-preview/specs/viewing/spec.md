## MODIFIED Requirements

### Requirement: The viewer closes, steps through the folder, and lives in the URL

The viewer SHALL close on `Esc` and on its own close control, returning to the listing with the file
still selected (FR-VIEW-060). `←` and `→` SHALL step to the previous and next **file** of the same
folder in the order the listing shows, without returning to the listing.

In the owner's listing the open file SHALL be part of the URL, so a viewer link opens the same file
and the browser's Back closes the viewer. The shared view at `/s/{token}` SHALL NOT carry the open
file in the URL, because the folder the visitor is browsing is not carried there either — a URL that
named a file but not its folder would open the viewer over the wrong listing. The shared viewer
SHALL instead close on `Esc` and on its close control back to the folder it was opened from
(FR-SHARE-070).

#### Scenario: FR-VIEW-060 Esc closes the viewer

- **WHEN** the owner presses `Esc` in the viewer
- **THEN** the viewer closes, the listing is shown again, and the file that was open is the selected
  row

#### Scenario: FR-VIEW-060 the arrows step through the folder's files

- **WHEN** the owner presses `→` while viewing a file in a folder holding several files
- **THEN** the viewer shows the next file of that folder, its own name and Download now referring to
  that file — and the listing is never returned to in between

#### Scenario: FR-VIEW-060 stepping skips folders

- **WHEN** the folder holds folders as well as files and the owner steps through it
- **THEN** only files are shown, because a folder has nothing to render

#### Scenario: FR-VIEW-060 stepping stops at the ends

- **WHEN** the owner is viewing the last file of a folder
- **THEN** there is no next-file affordance to activate and `→` does nothing — it does not wrap
  around to the first file, and no disabled control is on display (BR-100)

#### Scenario: FR-VIEW-060 a viewer link opens the viewer

- **WHEN** a URL that names an open file is loaded directly by the signed-in owner
- **THEN** the viewer opens on that file over its own folder's listing

#### Scenario: FR-VIEW-060 Back closes the viewer rather than leaving the folder

- **WHEN** the owner opens the viewer from a listing and then presses the browser's Back
- **THEN** the viewer closes and the same folder's listing is shown

#### Scenario: FR-SHARE-070 the shared viewer is not addressable by URL

- **WHEN** a visitor opens a file in the shared view and then copies the address bar
- **THEN** the address is still the share's own URL, so the copied link opens the shared root rather
  than a viewer over a folder the link does not name

#### Scenario: FR-VIEW-060 a file the caller cannot have is refused, not half-rendered

- **WHEN** a viewer URL names a file id that does not exist or belongs to another Data Room
- **THEN** the viewer shows a not-found message with a way back to the folder, and no request for
  bytes is made (the API answers `404 NOT_FOUND` under BR-010)
