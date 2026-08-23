## Why

When users share a file or folder using a public link (e.g., via Slack, Telegram, or iMessage), the receiving application attempts to generate a "rich preview" showing the title and type of the shared document. Currently, shared links (`/s/:shareId`) serve the bare Vite `index.html` which lacks Open Graph metadata, resulting in poor user experience and generic link previews. 

Because social media crawlers do not execute JavaScript, the React SPA cannot dynamically inject these tags on the client. To preserve the project's vendor-agnostic architecture (BR-100: no host is hardcoded, no vendor in code), we need a backend-driven solution rather than relying on vendor-specific edge functions.

## What Changes

We will introduce a new lightweight API endpoint in the NestJS backend (`GET /shares/preview/:token`) that serves a pre-rendered HTML page containing the necessary Open Graph (`og:title`, `og:site_name`, `twitter:card`) meta tags. This endpoint will read the `Share` and its associated `Node` from the database. 

Operators can then configure their reverse proxy (e.g., Nginx) or platform routing (e.g., Vercel Rewrites based on User-Agent) to route bot traffic for `/s/*` to this API endpoint, while normal human traffic continues to receive the Vite SPA. This maintains strict adherence to BR-100 while enabling rich link previews.

This is an extension of Slice 10 (FR-SHARE-*).

## Capabilities

### New Capabilities

- `share/rich-preview`: Serving static HTML with Open Graph metadata for bots and crawlers to generate rich link previews for shared nodes.

### Modified Capabilities

- None

## Impact

- **API:** Addition of a new controller endpoint `GET /shares/preview/:token` serving `text/html`.
- **Infrastructure:** Documentation updates on how to configure proxies to route bot traffic. No code changes to the Vite frontend.
- **Dependencies:** None.
