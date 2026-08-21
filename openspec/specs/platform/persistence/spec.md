## Purpose

Holds the relational model behind every Data Room — users, rooms, the single node tree that carries
both folders and files, and the shares granted on it — together with the database-level invariants
that model depends on and the object-store bucket its blobs are written to.

## Requirements

### Requirement: Names are unique within a folder, case-insensitively

The database SHALL reject a second node with the same name under the same parent in the same Data
Room, comparing names case-insensitively (BR-020). The constraint is the database's, not the
service's, so no later code path can bypass it.

#### Scenario: BR-020 a duplicate name under the same parent is rejected

- **WHEN** a node named `Report.pdf` exists under parent `P` in Data Room `R`, and a second node
  named `Report.pdf` is inserted under `P` in `R`
- **THEN** the write fails on a unique-constraint violation and only the first row exists

#### Scenario: BR-020 names differing only in case collide

- **WHEN** a node named `Report.pdf` exists under `P`, and `report.PDF` is inserted under `P`
- **THEN** the write fails on the same unique-constraint violation

#### Scenario: BR-020 the same name in a different folder is allowed

- **WHEN** `Report.pdf` exists under parent `P1` and `Report.pdf` is inserted under parent `P2` in
  the same Data Room
- **THEN** both rows exist

#### Scenario: BR-020 the same name in a different Data Room is allowed

- **WHEN** `Report.pdf` exists under the root of Data Room `R1` and `Report.pdf` is inserted under
  the root of Data Room `R2`
- **THEN** both rows exist, because the constraint is scoped by Data Room

### Requirement: A Data Room has exactly one root node

The database SHALL permit at most one node with no parent per Data Room, so the root is resolvable
by a single indexed lookup and every other node has a parent (FR-AUTH-050). No `rootId` column is
stored on the Data Room.

#### Scenario: FR-AUTH-050 the first parentless node is accepted

- **WHEN** a Data Room has no nodes and a node with a null parent is inserted for it
- **THEN** the row is created and is that room's root

#### Scenario: FR-AUTH-050 a second parentless node is rejected

- **WHEN** a Data Room already has a node with a null parent and another null-parent node is
  inserted for the same room
- **THEN** the write fails on a unique-constraint violation

#### Scenario: FR-AUTH-050 each Data Room gets its own root

- **WHEN** two Data Rooms each insert one null-parent node
- **THEN** both rows exist, one root per room

### Requirement: Deleting a container deletes everything beneath it

The schema SHALL cascade deletes down the node tree and across the rows that hang off it, so
removing a folder row removes its whole subtree and every share on any node in it in one statement
(FR-FLDR-030). Deleting a Data Room removes its nodes and shares; deleting a user removes their
Data Rooms.

#### Scenario: FR-FLDR-030 deleting a folder row removes its descendants

- **WHEN** a folder with nested folders and files beneath it is deleted by row
- **THEN** no node in that subtree remains

#### Scenario: FR-FLDR-030 deleting a node removes the shares on it

- **WHEN** a node carrying one or more shares is deleted, directly or as part of a deleted subtree
- **THEN** those share rows no longer exist, so the tokens resolve to nothing

#### Scenario: FR-ROOM-020 deleting a user removes their rooms and contents

- **WHEN** a user row is deleted
- **THEN** their Data Rooms, all nodes in them and all shares on those nodes are gone

### Requirement: A share carries a role, and today it is only VIEWER

Every share row SHALL carry a role that defaults to viewer, and the column SHALL already accept the
editor value, so adding a second role is a capability-map entry rather than a migration (BR-070).
Nothing in this change reads the role or exposes a way to set it.

#### Scenario: BR-070 role defaults to VIEWER

- **WHEN** a share row is inserted without specifying a role
- **THEN** its role reads `VIEWER`

#### Scenario: BR-070 the role column already admits EDITOR

- **WHEN** a share row is inserted with role `EDITOR`
- **THEN** the write succeeds at the database level, confirming no schema change is needed to add
  the second role

#### Scenario: BR-070 an unknown role is rejected

- **WHEN** a share row is inserted with a role outside the enum
- **THEN** the write fails, so the role column can never hold a value the capability map does not
  cover

### Requirement: One folder's children can be paged in sort order without a sort step

The schema SHALL carry an index that matches the listing's order — folders first, then name
ascending, with id as the tiebreak — scoped by Data Room and parent, so a keyset page of a folder's
children costs the same at page 500 as at page 1 regardless of how many rows the room holds
(FR-NAV-030).

#### Scenario: FR-NAV-030 the listing query plan needs no sort

- **WHEN** a folder's children are read in `type, name, id` order with a keyset predicate and a row
  limit
- **THEN** the query plan is an index scan over the listing index with no sort step, on an empty
  table and on a folder holding many thousands of rows alike

#### Scenario: FR-NAV-030 folders sort before files

- **WHEN** a mixed set of folder and file nodes under one parent is read ordered by type ascending
- **THEN** every folder precedes every file, without the query naming either value

#### Scenario: FR-NAV-030 a second Data Room does not widen the scan

- **WHEN** a folder's children are read while other Data Rooms hold nodes of their own
- **THEN** the plan's index condition is bounded by Data Room and parent, so rows outside that room
  are never examined

### Requirement: A clean clone reaches a working database and bucket with no manual step

Bringing up local infrastructure and applying migrations SHALL be two documented commands, and the
API SHALL create its private bucket on boot when it is missing, so nothing has to be clicked in a
console before the app can store bytes (FR-OPS-020, BR-060). Configuration is read from environment
variables, all of which are listed with their local defaults in the example env file.

#### Scenario: FR-OPS-020 migrating an empty database yields the full schema

- **WHEN** migrations are applied to an empty database
- **THEN** the users, Data Rooms, nodes and shares tables exist along with the listing index and
  both partial unique indexes, and re-applying the migrations reports nothing to do

#### Scenario: FR-OPS-020 the hand-written indexes survive a reset

- **WHEN** the database is reset and migrated again from scratch
- **THEN** the case-insensitive name index and the one-root index are present, because they live in
  the migration rather than having been applied by hand

#### Scenario: BR-060 the bucket exists after the API boots

- **WHEN** the API starts against an object store with no such bucket
- **THEN** the bucket is created as a private bucket, and a second start with the bucket already
  present changes nothing and logs nothing alarming

#### Scenario: BR-050 unreachable infrastructure fails loudly at boot

- **WHEN** the API starts with the database or the object store unreachable, or with a required
  connection variable unset
- **THEN** startup fails with a message naming the variable or endpoint at fault, rather than
  serving requests that cannot read rows or store bytes
