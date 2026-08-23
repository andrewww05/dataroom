## Context

When users share links (via `/s/:token`), social bots attempt to crawl Open Graph tags. Since Vite serves a bare HTML file and bots do not execute JS, we must serve a pre-rendered HTML with `<meta>` tags. The project rules forbid vendor-specific solutions like Vercel Edge Middleware.

## Goals / Non-Goals

**Goals:**
- Provide Open Graph tags (`og:title`, `og:site_name`, `twitter:card`) for shared nodes.
- Maintain strict adherence to BR-100 (no vendor in code).
- Implement a lightweight NestJS endpoint for serving the HTML.

**Non-Goals:**
- Next.js or full SSR for the React application.
- Providing dynamic images (`og:image`) - we will stick to a static generic image or omit it.

## Decisions

1. **NestJS Endpoint for HTML**: We will create `GET /shares/preview/:token` in `ShareController`.
   - Instead of returning JSON, it returns `text/html` using NestJS's `@Header('Content-Type', 'text/html')`.
   - It will fetch the `Share` and `Node` by token.
   - If the token is invalid or expired, it returns `404 NOT_FOUND` (HTML or standard API error, likely HTML with a 404 status). To stick to the global filter, we might just throw `NotFoundException` and let the standard filter return JSON, but bots won't care either way as long as the status code is 404. Let's just throw `NotFoundException`.
   - If valid, it returns an HTML string injecting `<title>` and `<meta property="og:title">`. For files, title is the file name. For folders, title is "Folder: " + name.

2. **Invariants Touched**:
   - **BR-100 (No vendor in code)**: Upheld by using standard NestJS controllers instead of Vercel functions.
   - **BR-010 (Scope)**: Upheld because `GET /shares/preview/:token` only allows unscoped lookup by token, exactly like `GET /shares/resolve`.

3. **Alternative Rejected**:
   - *Vercel Edge Middleware*: Rejected because it hardcodes Vercel into the project, violating BR-100.

4. **Validation Script**:
   - *Proves*: `FR-SHARE-090` (endpoint returns HTML with OG tags), `FR-SHARE-090` (404 for invalid token).
   - *Manual checklist*: Verify that pasting a valid share link into a tool like Telegram or Slack preview generator correctly fetches the metadata (requires configuring proxy/rewrites manually or using a tunnel like ngrok).

## Risks / Trade-offs

- **Infrastructure Configuration**: The burden is placed on the operator to configure Nginx, Caddy, or Vercel `vercel.json` rewrites to route traffic matching social bot User-Agents to `GET /api/shares/preview/:token`. We will add a small documentation section for this.
