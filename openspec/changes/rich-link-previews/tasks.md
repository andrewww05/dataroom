## 1. API Implementation

- [x] 1.1 Add `GET /preview/:token` to `ShareController` in `apps/api/src/share/share.controller.ts` using `@Header('Content-Type', 'text/html')`. This route should be `@Public()` since it's accessed via a token.
- [x] 1.2 Implement the handler to look up the `Share` and its associated `Node` using `ShareService.resolveShare(token)`. If not found, it throws `NotFoundException`.
- [x] 1.3 Construct and return the HTML string containing `<title>`, `<meta property="og:title">`, and `<meta property="og:site_name" content="Dataroom">`.

## 2. Infrastructure & Documentation

- [x] 2.1 Update `README.md` or `docs/03-domain-and-api.md` to add the `GET /shares/preview/:token` endpoint to the table.
- [x] 2.2 Add documentation explaining how to configure a reverse proxy (e.g. Nginx, Caddy) or Vercel `vercel.json` to route bot traffic (via User-Agent) to the `/api/shares/preview/:token` endpoint.

## 3. Testing & Validation

- [x] 3.1 Write a unit test for `ShareController` testing the HTML generation for both a file and a folder, and the 404 case.
- [x] 3.2 Create `scripts/validate/rich-link-previews.sh` to assert `FR-SHARE-090` using `curl` against the running API endpoint. It must assert that a valid token returns `200` with Open Graph tags in the body, and an invalid token returns `404 NOT_FOUND`.
