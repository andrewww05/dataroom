## Context

This change builds the foundational web shell for the Data Room application, introducing the React/Vite client that consumes the API established in Slices 1-3. See proposal.md for motivation.

## Goals / Non-Goals

**Goals:**
- Establish the client-side routing, layout (three-pane), and data fetching architecture.
- Implement the authentication flow using the backend's JWT-based authentication.
- Render the file and folder list view with support for keyset pagination.

**Non-Goals:**
- Folder creation, rename, and delete operations (Slice 5).
- File upload and download operations (Slice 6).
- The full-screen document viewer (Slice 7).

## Decisions

### 1. Routing and State Management
We will use **TanStack Router** for type-safe, file-based routing and **TanStack Query** for server state management (caching, deduplication, pagination).
- *Alternative Rejected*: React Router and Redux. Redux is too heavy for an application that primarily syncs server state, and TanStack Query natively handles the keyset pagination model used by our API.

### 2. Authentication State
The JWT token will be stored in `localStorage` to persist sessions across reloads. The application will fetch `GET /auth/me` on boot to populate a global Zustand store with the current user and their Data Room context.

### 3. API Communication
All client-side fetches will use the native `fetch` API, wrapped in a generic client that automatically attaches the `Authorization: Bearer <jwt>` header to satisfy **BR-010**. 
Following **BR-100**, the client will not hardcode origins. It will rely on Vite's proxy during development (`VITE_API_PROXY_TARGET`) and `VITE_API_URL` for production builds.

## Invariants Maintained

- **BR-010 (One principal per request):** The fetch client is configured to attach the JWT to all requests except public ones (`/auth/login`, `/auth/signup`).
- **BR-100 (No hardcoding):** The UI relies strictly on `VITE_API_URL` and `VITE_API_PROXY_TARGET`, ensuring deployability on any host.

## Relevant API Contracts (from docs/03)

**Endpoints:**
- `POST /auth/signup` (`{ email, password }`) returns `{ token, user, dataRoom }`
- `POST /auth/login` (`{ email, password }`) returns `{ token, user, dataRoom }`
- `GET /auth/me` returns `{ id, email, dataRoom: { id, name, rootId } }`
- `GET /nodes/:id/children?cursor&limit&type` returns `{ items: FsNode[], nextCursor }`
- `GET /nodes/:id/path` returns `Breadcrumb[]`

**Error Codes:**
- `UNAUTHENTICATED` (401)
- `INVALID_CREDENTIALS` (401)
- `EMAIL_TAKEN` (409)
- `VALIDATION_FAILED` (400)

## Risks / Trade-offs

- **Risk:** Token leakage via XSS since JWT is stored in `localStorage`.
  - **Mitigation:** Rely on React's built-in XSS protections and ensure no `dangerouslySetInnerHTML` is used without sanitization. (An HttpOnly cookie approach was rejected to keep the API entirely stateless and cross-origin friendly for simple deployment).
