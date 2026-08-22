## Why

This change implements Slice 4 from `docs/05-build-order.md`. Slices 1-3 established the local infrastructure, database schema, API authentication, and the read side of the nodes API. Slice 4 builds the web application shell to consume these APIs. This is the first slice that introduces the React front-end, establishing the routing, state management, and core layout that subsequent UI slices will build upon.

## What Changes

We will scaffold the `apps/web` Vite application with Tailwind CSS and shadcn/ui. We will implement TanStack Router for navigation and TanStack Query for data fetching. We will build the authentication screens (sign-in, sign-up), the main authenticated three-pane layout, the Data Room title header, breadcrumbs navigation, and the primary file list view. We will also implement necessary loading skeletons, empty states, and error boundaries.

This change delivers the following requirements:
- FR-NAV-020 (Breadcrumbs)
- FR-NAV-040 (Routing)
- FR-VIEW-010 (List view)
- FR-ROOM-010 (Data room display / creation on sign up)

## Capabilities

### New Capabilities
- `ui-shell`: The core web application layout, routing setup (TanStack Router), styling foundation (Tailwind + shadcn), and global error/loading states.
- `data-room`: The display of the user's data room title and creation handling during sign up.

### Modified Capabilities
- `auth`: Adding the client-side sign-in and sign-up UI screens.
- `navigation`: Implementing the client-side breadcrumb component and routing.
- `viewing`: Implementing the client-side list view, empty states, and skeleton loaders.

## Non-goals

This slice strictly focuses on the foundational UI shell and read-only navigation. We will deliberately avoid:
- Folder CRUD operations (Create, Rename, Delete) - deferred to Slice 5.
- File upload and download operations - deferred to Slice 6.
- The full-screen document viewer - deferred to Slice 7.

## Impact

- `apps/web`: Complete scaffolding of the client application, introducing major dependencies (`@tanstack/react-router`, `@tanstack/react-query`, `tailwindcss`, `lucide-react`, `shadcn/ui` components).
- Minimal to no changes in `apps/api` or `packages/shared`, as the API surface for auth and reading nodes was established in Slices 2 and 3.
