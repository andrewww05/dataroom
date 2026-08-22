## ADDED Requirements

### Requirement: A resolved principal reaches only the rows its own Data Room holds

Resolving a principal SHALL NOT by itself grant access to a row. Every request naming a node SHALL be
checked against the Data Room that holds it, once per request rather than once per row, and a node the
principal has no claim on SHALL be answered `404 NOT_FOUND` — never `403`, and never a body that
distinguishes it from a node that does not exist (BR-010, FR-ROOM-030). The check SHALL happen before
any query that reads the node's children, path or contents, so a request that will be refused never
reads a row it is not entitled to.

#### Scenario: BR-010 a node in another owner's Data Room is not found

- **WHEN** a signed-in caller names a node that exists in a Data Room owned by somebody else
- **THEN** the response is `404` with code `NOT_FOUND`, and never `403` — a refusal that confirmed
  the row existed would let the tree be mapped by guessing ids

#### Scenario: BR-010 a refusal is indistinguishable from a missing row

- **WHEN** the same route is called twice by one caller — once naming a node in another owner's room
  and once naming an id no node has ever had
- **THEN** both responses are `404` with byte-identical bodies, so neither reveals which of the two
  it was

#### Scenario: FR-ROOM-030 an id that cannot name a node is not found

- **WHEN** a route is called with an id that is not a well-formed identifier at all
- **THEN** the response is `404` with code `NOT_FOUND` — never a `500`, and never a database error
  reaching the client

#### Scenario: BR-010 every read route in the surface refuses alike

- **WHEN** each route that names a node — the node itself, its children, its path and its contents —
  is called for a node outside the caller's own room
- **THEN** every one answers `404 NOT_FOUND`, so no single route is the one that leaks

#### Scenario: BR-010 the scope check precedes the listing query

- **WHEN** a caller lists the children of a folder in another owner's Data Room, passing a valid
  cursor
- **THEN** the response is `404 NOT_FOUND` and no row from that folder is returned, paged or
  otherwise disclosed

#### Scenario: BR-010 a refusal names nothing about the other room

- **WHEN** any of the above refusals is examined
- **THEN** the body carries only the code and a generic message: no owner email, room name, node
  name, parent id or count appears in it

#### Scenario: BR-010 a caller's own room is unaffected by a second room existing

- **WHEN** a caller reads their own nodes while other Data Rooms hold nodes of their own
- **THEN** every request succeeds normally, so the scope check refuses foreign rows without
  narrowing legitimate access
