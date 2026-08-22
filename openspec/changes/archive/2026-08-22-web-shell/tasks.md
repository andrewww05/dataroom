## 1. Web Application Scaffolding

- [x] 1.1 Initialize Tailwind CSS v4 and shadcn/ui inside `apps/web`, setting up the base CSS tokens and UI component folder (`src/components/ui`). Verify by rendering a shadcn Button on a test page.
- [x] 1.2 Setup TanStack Router and TanStack Query providers in the main entry point (`src/main.tsx`). Verify the app mounts without React errors.

## 2. API Client and Authentication State

- [x] 2.1 Implement the API fetch client utility that automatically attaches the `Authorization` header from `localStorage` and respects `VITE_API_URL` / `VITE_API_PROXY_TARGET`. Verify by calling a protected endpoint and inspecting the network tab for the header.
- [x] 2.2 Create a Zustand store or React Context (`useAuth`) that fetches `GET /auth/me` on boot, managing the user session and the current Data Room state. Verify by logging in and inspecting the global state object.

## 3. UI Implementation

- [x] 3.1 Implement the Sign-in and Sign-up screens (`FR-AUTH-010`, `FR-AUTH-020`) using shadcn form components, storing the token on success (`FR-AUTH-030`) and transparently continuing to the application (`FR-ROOM-010`). Verify by creating a new account and confirming the token is stored.
- [x] 3.2 Build the Three-pane Application Layout component (`FR-NAV-040`), incorporating the Data Room title (`FR-ROOM-010`) and Breadcrumb navigation (`FR-NAV-020`) in the header. Verify by rendering the shell and confirming the UI structure matches the design.
- [x] 3.3 Implement the List View component (`FR-VIEW-010`) utilizing TanStack Query for data fetching, including the empty state and skeleton loaders. Verify by rendering a mock folder with files and a folder with zero items.

## 4. Routing and Verification

- [x] 4.1 Wire the routes (`/login`, `/signup`, `/`) in TanStack Router, adding an authentication guard that redirects unauthenticated users to `/login`. Verify by attempting to access `/` while logged out, observing the redirect.
- [x] 4.2 Write Vitest unit tests asserting the `useAuth` session management and route guards. Verify by running `pnpm test --filter @dataroom/web` and seeing green output.
