## MODIFIED Requirements

### Requirement: /shares/resolve uses a query parameter, not a path segment

The resolve route currently uses `GET /shares/resolve/:token` (path segment). Per the API table
in docs/03-domain-and-api.md, it MUST be `GET /shares/resolve?token=<token>` (query parameter).
This is a breaking change to the URL shape but not to the behavior contract (FR-AUTH-030).

#### Scenario: FR-AUTH-030 resolving a share token via query param succeeds

- **WHEN** `GET /api/shares/resolve?token=<token>` is called for a valid PUBLIC share without authentication
- **THEN** the response is `200` with the share context object

#### Scenario: FR-AUTH-030 old path-segment form returns 404

- **WHEN** `GET /api/shares/resolve/<token>` (path-segment form) is called
- **THEN** the response is `404` (no route registered for that shape)
