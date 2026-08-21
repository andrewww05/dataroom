# Business Rules, Permissions & Access Control

## Purpose

This document is the normative rulebook for the Data Room. Where
[05-functional-requirements.md](./05-functional-requirements.md) states what the system does, this
document states who is allowed to do it, what happens when two things conflict, and what the exact
threshold, format, precedence order or propagation time is. Every rule is numbered `BR-nnn`,
independently citable, and written so that two engineers reading it reach the same implementation.

The Data Room is an internal tool. This company builds it for its own staff, who organise sensitive
documents in it and share a bounded subset of them outward to **external recipients** — clients,
advisers, auditors and other outside parties who reach the material through a share link or an
emailed invitation and who frequently hold no account at all. Every rule below is written for that
shape: colleagues inside, recipients outside, an internal administrator setting the governance
values, and no commercial relationship anywhere in the model.

**This document owns the numbers.** Every threshold, limit, retention window, timing guarantee and
permission rule in the set is defined here, once. 05 owns every Release tag and Priority, 10 owns
every metric ID and event name, 03 owns the responsive size-class ladder, and 09 owns entity field
names and error codes. Every other document cites a rule here by ID rather than restating its value;
where a number must appear elsewhere for readability it is written with the owning ID in
parentheses, for example "60 seconds (BR-110)". A number that appears anywhere in the set without
such a citation, or that disagrees with the rule it cites, is a defect in that document rather than
a second opinion.

Three principles govern everything below and are stated once here rather than repeated in every
rule.

1. **Default deny.** No principal has any authority over any scope except through an explicit,
   currently active grant. The absence of a rule permitting an action is a prohibition, not an
   ambiguity.
2. **The API is the enforcement point.** The interface may hide, disable or omit a control as a
   convenience. That is never access control. Every rule in this document is enforced server-side on
   every request, including requests the interface would never send.
3. **A phone is the primary administration device.** Rules are written so that a consequential
   action performed with a thumb, on a bad connection, cannot silently leak, destroy or widen
   access. Where a rule adds friction, the friction is deliberate and its blast radius is stated.

Rules marked with a **Decision rationale** encode a choice that could reasonably have gone the
other way. The rationale is there so that a future change is a decision, not an accident.

## Related documents

- [Documentation index](./README.md)
- [Product overview](./03-product-overview.md)
- [Epics](./04-epics.md)
- [Functional requirements](./05-functional-requirements.md)
- [Non-functional requirements](./07-non-functional-requirements.md)
- [Mobile UX specification](./08-mobile-ux-spec.md)
- [Domain model and glossary](./09-domain-model-and-glossary.md)
- [Risks and open questions](./12-risks-and-open-questions.md)
- Backlog by epic:
  [Access and Identity](./backlog/epic-01-access-and-identity.md),
  [Data Rooms and Workspace Home](./backlog/epic-02-data-rooms-and-workspace-home.md),
  [Folder Hierarchy and Navigation](./backlog/epic-03-folder-hierarchy-and-navigation.md),
  [File Operations](./backlog/epic-04-file-operations.md),
  [Viewing, Preview and File Details](./backlog/epic-05-viewing-preview-and-file-details.md),
  [Search and Discovery](./backlog/epic-06-search-and-discovery.md),
  [Sharing and Access Control](./backlog/epic-07-sharing-and-access-control.md),
  [Conflict Resolution and Data Integrity](./backlog/epic-08-conflict-resolution-and-data-integrity.md),
  [Mobile UX Foundations](./backlog/epic-09-mobile-ux-foundations.md),
  [Performance, Offline and Scale](./backlog/epic-10-performance-offline-and-scale.md),
  [Trust, Audit and Notifications](./backlog/epic-11-trust-audit-and-notifications.md),
  [Account, Storage and Governance](./backlog/epic-12-account-storage-and-governance.md)

API paths quoted in this document are the canonical set the rules are written against.
[09-domain-model-and-glossary.md](./09-domain-model-and-glossary.md) is the authority on exact
request and response shapes, error codes and the shared TypeScript contract in
`packages/shared`.

---

## Actors and scopes

### Principal types

| Principal type | How it is established | Lifetime | Can hold a grant |
| --- | --- | --- | --- |
| **Account holder** | A staff account provisioned through the company identity provider (assumption A-IDP below), a sign-up with a verified email address, or an accepted invitation converted into an account | Until account deletion or deprovisioning (BR-237) | Yes |
| **Invited guest** | An email-bound invitation accepted without creating an account. This is the ordinary shape of an **external recipient** | Until the grant is revoked or the guest creates an account | Yes |
| **Anonymous link visitor** | Possession of a valid public link token, with no credential. The other shape of an external recipient, and the most constrained surface in the product | The lesser of the link's validity and the session ceiling | No. Authority derives from the link, not from the visitor |
| **System** | Internal scheduled or event-driven job (thumbnailing, purge, digest, notification) | Per job execution | No |

An **administrator** is not a fifth principal type. It is an account holder carrying the
account-level governance capability defined in BR-044: storage quota, retention settings and account
provisioning. The capability confers no authority over the contents of any room (BR-036).

### Scopes

| Scope | Grantable | Contains | Notes |
| --- | --- | --- | --- |
| **Account** | No. Authority over an account is held only by the account holder and, for the governance values only, by an administrator (BR-044) | Rooms, storage quota, retention settings, provisioning state | Quota, retention and account deletion are account-scoped, never room-scoped |
| **Room** | Yes | Folders, files, trash, activity log, shares | The root of every access decision and the unit of quota reporting, audit and archive |
| **Folder** | Yes | Folders, files | Grantable at any depth |
| **File** | Yes | Versions | Grantable individually, including a file inside an ungranted folder |

### Rules

| ID | Rule |
| --- | --- |
| BR-001 | The system recognises exactly four principal types: account holder, invited guest, anonymous link visitor, and system. No other principal type exists, and no request is processed without resolving to exactly one of them. |
| BR-002 | Every request resolves to exactly one principal before any authorization decision is made. A request that cannot be resolved to a principal is treated as an anonymous link visitor with no token, which has authority over nothing. |
| BR-003 | Grants may be issued on three scope types only: room, folder and file. Authority over an account is never grantable. |
| BR-004 | Every folder and every file belongs to exactly one room, permanently. Reparenting across rooms is not an operation the system offers (see BR-075). |
| BR-005 | A grant is the tuple (principal identity, scope reference, role, download-allowed flag, can-reshare flag, granting principal, created timestamp, state, optional expiry). All nine fields are recorded; none is inferred at read time. |
| BR-006 | A grant applies to its scope and to every descendant of that scope, and to nothing else. A grant on a file applies to that file and its versions. |
| BR-007 | The system principal may perform only the operations enumerated for it in the permission matrix, may never be assumed by a request originating outside the platform, and may never be used to satisfy a user-initiated request that the user's own authority would refuse. |
| BR-008 | An invited guest is identified by a verified-on-first-use email address and holds grants in its own right. A guest has no workspace home, cannot create rooms, and can see only the scopes granted to it. |
| BR-009 | An anonymous link visitor holds no grant. Its authority for the duration of the session is exactly the authority recorded on the link token it presented, and is re-derived from that link on every request. |
| BR-010 | An account holder is the only principal type that can own a room, create rooms, or hold the account-level governance capability of BR-044. |
| BR-011 | When a person creates and verifies an account using an email address that holds guest grants, every one of those grants transfers to the new account, preserving role, flags, grantor and audit history, without any action by the granting principal. The guest identity is then retired. |
| BR-012 | Every action performed by the system principal is written to the activity log with the job name as the actor. No action of any kind is recorded as having no actor. |

**BR-011 decision rationale.** The alternative is to require the sharer to re-invite. That is a
worse product (the recipient silently loses access at the moment they invest in an account) and a
worse security posture (it trains sharers to re-issue grants casually). Transfer is safe because the
email address is the identity key in both cases and the new account has verified it.

**Withdrawn in the internal-tool rework.** The principal-type table's "Consumes a paid seat" column
is withdrawn: there are no seats to meter, so the column carried no rule. No BR ID was retired in
this section; BR-010 was rewritten in place to point at the governance capability of BR-044 instead
of at seat and payment authority.

---

## Role definitions

Four roles exist. They are ordered, and the order is total: `Viewer < Contributor < Manager < Owner`.
Two flags, download-allowed and can-reshare, are carried independently of the role.

| ID | Rule |
| --- | --- |
| BR-013 | Every room has exactly one Owner at every point in time. The Owner grant cannot be revoked, downgraded or deleted; it can only be transferred (BR-029). A room can never exist with zero Owners or with two. |

### Owner

| Aspect | Definition |
| --- | --- |
| **Who** | The account that created the room, or the account a completed ownership transfer moved it to. |
| **Can** | Everything a Manager can do, plus: transfer ownership, delete the room, archive and restore the room, change any grant including a Manager's, view and export the full activity log, and see room storage usage. |
| **Cannot** | Escape being the Owner without a completed transfer. Exceed the administrator-set storage quota (BR-199). Recover data past the retention windows in BR-177, BR-186 and BR-194. Read another account's rooms. |
| **Flags** | Always treated as download-allowed and can-reshare, regardless of the stored flag values. |

| ID | Rule |
| --- | --- |
| BR-014 | The Owner holds every authority over its room that the permission matrix marks Allowed or Conditional for any role, subject only to item state (BR-034), account state (BR-035) and the account-scoped restrictions in BR-044. |

### Manager

| Aspect | Definition |
| --- | --- |
| **Who** | A principal granted the Manager role on a room, folder or file. |
| **Can** | Create, rename, move, copy, upload, delete and restore within its scope. Share within its scope, including creating public links. Revoke shares it can see within its scope. Change roles and flags on grants at or below its scope, up to Manager. View the activity log and viewer analytics for its scope. |
| **Cannot** | Grant or change an Owner grant. Transfer ownership. Delete or archive the room (unless the grant scope is the room and the principal is also the Owner, which by BR-013 it is not). Change the administrator-set storage quota or any other account-level governance value (BR-044). Act outside its granted subtree. Grant a role higher than Manager (BR-027). |
| **Flags** | Treated as download-allowed and can-reshare unless the grant explicitly sets either flag to false. |

| ID | Rule |
| --- | --- |
| BR-015 | A Manager's authority is bounded by its grant scope. A Manager on a folder has no authority over that folder's siblings, its parent, or the room's settings, and cannot see that they exist unless another grant covers them. |

### Contributor

| Aspect | Definition |
| --- | --- |
| **Who** | A principal granted the Contributor role, typically an external recipient asked to supply documents, or a colleague collaborating inside the room. |
| **Can** | List and open folders in scope. Preview files. Create folders. Upload files. Rename and move items it created. Delete items it created (to trash). Restore from trash items it deleted. |
| **Cannot** | Rename, move or delete items created by another principal. Share anything, unless can-reshare is explicitly true. Revoke a share. Change any grant. View the activity log or viewer analytics. Permanently delete anything. Download, unless download-allowed is true. |
| **Flags** | Download-allowed defaults to true. Can-reshare defaults to false. |

| ID | Rule |
| --- | --- |
| BR-016 | A Contributor may mutate only items whose creating principal is itself. Creation authorship is recorded at creation time and is not transferable, so a Contributor's authority over an item does not change when the item is moved or renamed by someone else. |

**BR-016 decision rationale.** The alternative, letting any Contributor mutate any item in scope, is
simpler but makes a Contributor grant unsafe to hand to an external recipient: one recipient could
rename or delete another recipient's uploads. Author-scoped mutation is the smallest rule that makes
"upload your documents here" a safe thing to say to a stranger.

### Viewer

| Aspect | Definition |
| --- | --- |
| **Who** | A principal granted the Viewer role. The default role for every external recipient in this product. |
| **Can** | List and open folders in scope. Preview files. Search within scope. Download, if download-allowed is true. Reshare, if can-reshare is true. |
| **Cannot** | Create, rename, move, copy into, upload, delete or restore anything. Change any grant. See the activity log. See any principal's grant other than its own. See trash. |
| **Flags** | Download-allowed defaults to true and is the flag most often set to false. Can-reshare defaults to false. |

| ID | Rule |
| --- | --- |
| BR-017 | The Viewer role is strictly read-only. Every mutating endpoint refuses a Viewer unconditionally, and no combination of flags makes a Viewer able to mutate anything. |

---

## Identity, credential and verification rules

**Assumption A-IDP.** The company identity provider (SSO over OIDC) is the primary sign-in path for
staff, so in production most account holders are expected to be provisioned and authenticated
through it rather than through a password. This pass deliberately does not specify an SSO
requirement set. The rules below stand exactly as written: they are the fallback path for staff and
the only path for external recipients. **Open question OQ-IDP:** which identity provider, and
whether group membership asserted by it may drive the administrator capability of BR-044. Two
consequences hold whatever the answer: email, passkey and biometric authentication remain in scope
as specified here, and an external recipient must always be able to open a share link with no
account and no identity provider at all (BR-009, BR-081).

| ID | Rule |
| --- | --- |
| BR-018 | A password must be at least 12 characters. No character-class composition rule is applied. Every Unicode character is accepted, including spaces and emoji. A password matching an entry in the configured breached-credential corpus is rejected with a message naming that as the reason. Maximum accepted length is 256 characters, and the full length is used in the hash. |
| BR-019 | A registered passkey is bound to the account, not to a session, and multiple passkeys may be registered. Removing the last passkey is permitted only while at least one other authentication method remains usable on the account. |
| BR-020 | The email address is the identity key for accounts, guests and invitations. Addresses are compared after lower-casing the domain and applying case-sensitive comparison to the local part only where the receiving domain is known to be case-sensitive; in practice the system stores the address as submitted and compares case-insensitively across the whole address. Two accounts can never share an address. |
| BR-021 | An account whose email address is not yet verified may create rooms, folders and files, and may not create any share of any kind. Every share-creation request from an unverified account is refused with a typed error naming email verification as the blocker and offering a resend. |
| BR-022 | Every emailed authentication artefact (verification link, magic sign-in link, password-reset link, invitation acceptance link) is single-use, carries at least 128 bits of entropy from a cryptographically secure source, and expires: verification 24 hours, magic sign-in 15 minutes, password reset 60 minutes, invitation acceptance 30 days. Consuming any one of them invalidates every outstanding artefact of the same kind for that address. |
| BR-023 | An access credential has a maximum lifetime of 5 minutes. A refresh credential has a maximum lifetime of 90 days, is rotated on every use, and a replayed refresh credential invalidates the entire credential chain for that session and raises a security event. |
| BR-024 | A guest session and an anonymous link visitor session may never outlive the grant or link that authorised them, and both carry an absolute session ceiling of 12 hours after which the principal must present the invitation or link again. |

**BR-018 decision rationale.** Length plus a breach check is stronger in practice than composition
rules, and composition rules are measurably hostile on a phone keyboard where reaching the symbol
plane is a distinct interaction. The 256-character ceiling exists only to bound hashing cost.

**BR-023 decision rationale.** The five-minute access-credential ceiling is what makes the
revocation promise in BR-108 achievable without consulting a revocation list on the hot read path
for every request. It is a deliberate trade of a small amount of token-refresh traffic for a
credible security claim.

---

## Flags, role assignment and ownership

| ID | Rule |
| --- | --- |
| BR-025 | The download-allowed flag governs the delivery of original file bytes: file download, bulk zip download, version download, and hand-off to another application. It does not govern preview. When false, every one of those endpoints refuses the request, and the interface renders no download affordance. |
| BR-026 | The can-reshare flag governs whether a principal may create a grant or a public link at or below its own grant scope. When false, every share-creation endpoint refuses the request. |
| BR-027 | No principal may create a grant carrying a role higher than its own effective role on that scope, nor a flag set to true that it does not itself hold as true. A Manager cannot mint an Owner. A Viewer with can-reshare cannot mint a Contributor. A principal without download-allowed cannot mint a grant with download-allowed. |
| BR-028 | A role is a property of a grant, not of a principal. The same principal may hold Manager on one folder and Viewer on another in the same room, and the effective role is computed per item by BR-066. |
| BR-029 | Ownership transfer requires: the current Owner initiates it, the single exception being an administrator initiating it for a deprovisioned account under BR-237; the transferee is an account holder, not a guest; the transferee explicitly accepts, with no exception; the transfer is atomic, so the former Owner becomes a Manager in the same operation that makes the transferee the Owner; the room's storage moves to the transferee's applicable quota (BR-199) at the moment of acceptance; and the transfer is refused if it would put the transferee over that quota. A pending transfer expires after 7 days. |
| BR-030 | An Owner cannot remove its own grant, leave the room, or delete its account while it owns a room, without either transferring ownership or deleting the room. The interface must present both options at the point of refusal, never a bare error. |

**BR-029 decision rationale.** Transferring the storage with the room, and refusing the transfer if
the transferee cannot hold it, is the only rule that avoids an account silently exceeding its quota
because someone else gave it a room. The alternative (accept and place the transferee into
over-quota read-only) punishes the recipient for accepting.

---

## Permission matrix

The matrix is normative. Columns are effective roles as computed by BR-066, plus the anonymous link
visitor and the system principal. An invited guest does not have its own column: a guest holds one
of the four roles and is evaluated in that column, with the guest-specific restrictions in BR-008
applied on top.

**A** = Allowed. **D** = Denied. **C**n = Conditional, subject to condition n in the legend.

| Action | Owner | Manager | Contributor | Viewer | Anonymous link visitor | System |
| --- | --- | --- | --- | --- | --- | --- |
| List a room in the workspace home | A | C5 | C5 | C5 | D | D |
| Open a room and list its root | A | C5 | C5 | C5 | C15 | D |
| Open a folder and list its contents | A | C5 | C5 | C5 | C15 | D |
| Preview a file | A | A | A | A | C15 | D |
| Download a file | C2 | C2 | C2 | C2 | C7 | D |
| Bulk download as zip | C2 | C2 | C2 | C2 | C7 | D |
| Create a folder | C1 | C1 | C1 | D | D | D |
| Rename a folder | C1 | C1 | C1 C4 | D | D | D |
| Move a folder | C1 | C1 | C1 C4 | D | D | D |
| Delete a folder with cascade | C1 | C1 | C1 C4 | D | D | D |
| Upload a file | C1 C8 | C1 C8 | C1 C8 | D | D | D |
| Copy a file or folder | C1 C8 | C1 C8 | C1 C8 | D | D | D |
| Rename a file | C1 | C1 | C1 C4 | D | D | D |
| Move a file | C1 | C1 | C1 C4 | D | D | D |
| Delete a file | C1 | C1 | C1 C4 | D | D | D |
| Replace a file as a new version | C1 C8 | C1 C8 | C1 C4 C8 | D | D | D |
| View trash | A | A | C4 | D | D | D |
| Restore from trash | C1 C9 | C1 C9 | C1 C4 C9 | D | D | D |
| Permanently delete from trash | C1 | C1 | D | D | D | C14 |
| Share a room, folder or file | C1 C11 | C1 C3 C11 | C3 C11 | C3 C11 | D | D |
| Reshare an item already shared with the principal | A | C3 | C3 | C3 | D | D |
| Revoke a share | A | C5 | C16 | C16 | D | C14 |
| Change a grant's role or flags | C13 | C5 C13 | D | D | D | D |
| Rotate a public link token | A | C5 | D | D | D | D |
| View the activity log | A | C5 | D | D | D | D |
| View viewer analytics | A | C5 | D | D | D | D |
| Export the activity log | A | C5 | D | D | D | D |
| Transfer room ownership | C12 | D | D | D | D | D |
| Archive or restore a room | A | D | D | D | D | D |
| Delete a room | C11 | D | D | D | D | D |
| Rename a room | A | C5 | D | D | D | D |
| See room storage usage | A | C5 | D | D | D | D |
| See account storage usage and quota | C6 | D | D | D | D | D |
| Set an account or per-room storage quota (BR-199) | C6 | D | D | D | D | D |
| Set the retention periods in BR-195 | C6 | D | D | D | D | D |
| Provision or deprovision a staff account (BR-237) | C6 | D | D | D | D | D |
| Export account data for portability | C6 | D | D | D | D | D |
| Delete the account | C6 C11 | D | D | D | D | D |
| Use search | C10 | C10 | C10 | C10 | C10 C15 | D |
| Request access to an item | A | A | A | A | A | D |
| Generate thumbnails and rendered pages | D | D | D | D | D | A |
| Purge expired trash and versions | D | D | D | D | D | C14 |
| Send digests and notifications | D | D | D | D | D | A |

### Conditions legend

| Condition | Definition |
| --- | --- |
| **C1** | The target room is not archived (BR-128), the target item is not in trash, and the account owning the room is not in a read-only state (BR-129). |
| **C2** | The principal's effective download-allowed flag on the target item is true (BR-025, BR-068), and the file is not quarantined (BR-226). |
| **C3** | The principal's effective can-reshare flag on the target item is true (BR-026), the new grant is at or below the principal's own grant scope, and the new grant's role and flags do not exceed the principal's own (BR-027). |
| **C4** | The creating principal of the target item is the requesting principal (BR-016). |
| **C5** | The target is at or below the scope of the principal's own grant. A grant on a folder confers nothing on that folder's parent or siblings. |
| **C6** | The principal is the account holder, or holds the account-level governance capability of BR-044 as an administrator. Room roles never confer account-level authority, and the capability never confers access to room contents (BR-036). |
| **C7** | The presenting link has download-allowed set to true, has not expired, has not been revoked, has passed its password gate if one is set, has passed its email-capture gate if one is set, and the file is not quarantined. |
| **C8** | No applicable storage quota — room, team or account (BR-199) — is at or over its ceiling (BR-201). |
| **C9** | The principal also holds the authority required to create the item at the restore destination, as resolved by BR-181. |
| **C10** | Results are restricted server-side to items within the principal's granted scopes. No result, count, facet or latency signal may reveal the existence of an item outside them (BR-047). |
| **C11** | The action requires a successful step-up re-authentication within the preceding 5 minutes. |
| **C12** | The transferee is an account holder and has explicitly accepted (BR-029). |
| **C13** | The grant being changed is not an Owner grant (BR-013), and a Manager may not raise a grant above Manager (BR-027). |
| **C14** | Performed only by an internal scheduled job, attributed in the activity log by job name (BR-012), and never triggerable directly by an external request. |
| **C15** | The target item is the link's own scope or a descendant of it, and every gate on the link has been passed. An anonymous visitor can never navigate above the link's scope, and the ancestor chain is rendered as non-navigable labels (BR-078). |
| **C16** | The requesting principal is the principal that created the grant or public link being revoked, and that grant or link is still within a scope the principal can see. This is the whole of the creator's revoke authority: it permits revoking what the principal itself issued, and nothing else (BR-235). |

### Cross-cutting authority rules

| ID | Rule |
| --- | --- |
| BR-031 | The permission matrix above is normative. Where any other document, comment or interface behaviour disagrees with it, the matrix wins and the other artefact is a defect. |
| BR-032 | Authorization is default-deny. An action absent from the matrix is denied to every principal until the matrix is amended. |
| BR-033 | Effective authority for a request is computed as a function of (effective role, effective flags, item state, room state, account state, quota state, rate-limit state), evaluated in that order, and every factor can only reduce authority, never increase it. |
| BR-034 | Item and room state gates apply before role. A trashed item, an archived room and a room in a read-only state each refuse every mutation regardless of role, including from the Owner. |
| BR-035 | Account state gates apply before role. An account or room over its quota refuses uploads and copies (BR-204); an account or room placed in a read-only state, whether by an administrator or by a quota reduction (BR-206), refuses every mutation except share revocation, deletion and export; a suspended account refuses everything except sign-in and export. In every degraded state, revocation and deletion remain available without exception. |
| BR-036 | A Conditional cell in the matrix is a condition evaluated by code, never a discretion exercised by an operator. There is no override path, no support bypass and no administrative superuser that can read or mutate the contents of a room. The administrator capability of BR-044 sets governance values and provisions accounts; it does not list, open, preview, download, search or export the contents of any room it holds no grant on, and a principal exercising it is subject to BR-233 exactly like any other. |
| BR-037 | Listing a room in the workspace home requires a grant on the room itself or on any descendant of it. A principal granted only a nested folder sees an entry representing the reachable subtree, not the room's other contents (BR-078). |
| BR-038 | Every create, update, move, delete, restore and share operation requires both a sufficient role and a writable state. Passing one and failing the other is a denial, and the typed error names which check failed. |
| BR-039 | Delivery of original file bytes requires download-allowed on every path: direct download, bulk zip, version download, share-to-app, and any future export. Adding a new byte-delivery path without a download-allowed check is a security defect. |
| BR-040 | Preview authority is independent of download authority. A principal with download-allowed false may preview every file in scope. A rendered preview page is never the original bytes and is served at a reduced fidelity that makes it unsuitable as a substitute for the original. |
| BR-041 | Share authority is the conjunction of a sufficient role and the can-reshare flag, bounded by the resharer's own scope, role and flags. An Owner and a Manager satisfy the role component inherently; a Contributor and a Viewer satisfy it only through can-reshare. |
| BR-042 | The activity log, viewer analytics and download tracking for a scope are visible only to principals holding Owner or Manager on that scope or an ancestor of it. No principal can see log entries about items outside its own granted scope, including entries about itself. |
| BR-043 | Search authority is derived, not granted. A principal can search exactly the union of its granted scopes, and the result set, the result count and the response latency must be indistinguishable from a corpus containing only those scopes. |
| BR-044 | **The administrator capability.** Account-level governance — setting the storage quota (BR-199), setting the retention periods (BR-195), setting the configurable limits (BR-231), and provisioning or deprovisioning staff accounts (BR-237) — belongs to the account holder and to principals the account holder has explicitly granted the administrator capability. It is a named capability on an account, recorded and revocable like any other grant, and every exercise of it is written to the activity log with the actor and the previous and new values. Room roles never confer it; it never confers a room role; and an Owner of a room inside another account has no governance authority over that account. |
| BR-045 | Ownership transfer, room deletion and account deletion each require step-up re-authentication within the preceding 5 minutes, because each is irreversible past its retention window. |

**BR-036 decision rationale.** An operator override is the single most requested and most dangerous
capability in a tool like this. An internal administrator who can read any room turns the tool into
a liability the legal team will not accept, and it makes the audit log worthless: nobody can prove
who read a confidential file if a superuser could have read it silently. The rule is stated as an
absolute so that an internal escalation cannot erode it one exception at a time. A colleague who has
lost access recovers through their own credentials and their own room's trash, or through a room
Owner who re-grants access deliberately, and not otherwise. This is the reason the administrator
capability in BR-044 is scoped to governance values and provisioning only.

**Withdrawn in the internal-tool rework.** Two matrix rows are withdrawn: "Manage plan, seats and
billing" and "View invoices". Neither has a replacement, because no such action exists in an
internal tool. Matrix rows carry no IDs, so nothing dangles; the account-level rows that survive are
the storage, retention, provisioning, export and deletion rows, all gated by C6. Condition **C6**
was rewritten in place from a billing capability to the administrator capability of BR-044, and any
document citing C6 now resolves to that.

---

## Visibility rules

The brief's requirement is that a Data Room is not visible to anyone it was not shared with. That is
implemented as three separate properties: it cannot be enumerated, it cannot be found, and it cannot
be confirmed by probing.

**BR-233 is the single normative statement of the 403-versus-404 rule for the whole document set,
and BR-234 is the single normative statement of what a dead link may disclose.** Every other
document — 05, 07, 08, 09 and every backlog epic — cites BR-233 and BR-234 by ID rather than
restating when each status code applies or what an expired link says. Where those two rules and any
other artefact disagree, these two win and the other artefact is a defect.

| ID | Rule |
| --- | --- |
| BR-046 | No listing endpoint returns a room, folder, file, share, grant, activity entry or principal that the requesting principal has no grant on. Enumeration is computed from grants, never filtered from a complete set in the client. |
| BR-047 | No search, suggestion, type-ahead, recent-items, facet count, result count or aggregate figure reflects the existence of an item the requesting principal has no grant on. |
| BR-048 | No identifier of a room, folder, file or share is addressable by a principal without a grant on it. Possession of a correct identifier confers nothing. |
| BR-049 | A request for a valid identifier from a principal without a grant returns a response indistinguishable from the response for an identifier that has never existed: the same status code (`404 NOT_FOUND`, per BR-233), the same body shape, the same error code, the same headers, and no distinguishing timing characteristic. |
| BR-050 | Authorization checks that could reveal existence are performed in constant time relative to the existence of the target, and the response is emitted after a uniform minimum delay so that a timing difference cannot separate "does not exist" from "exists but is not yours". |
| BR-051 | For a principal holding no grant on the target, no error message, error code, validation message, log line returned to the client, or response header distinguishes "not found" from "found but forbidden", anywhere in the API, including on mutating endpoints. The single permitted exception is the one BR-233 defines, where the principal already holds a grant on that exact target; there is no other case in which a refusal may reveal that the target exists. |
| BR-052 | No redirect, canonical link, `Location` header or client-side route transition reveals the existence, name, room, owner or type of an item the principal cannot access. |
| BR-053 | Rate-limit behaviour is identical for existing and non-existing identifiers, so that a differing limit or a differing `Retry-After` cannot be used as an existence oracle. |
| BR-054 | Password-reset, magic-link and invitation-resend endpoints return an identical response, with an identical timing envelope, whether or not the submitted address corresponds to an account. |
| BR-055 | A public link token carries at least 160 bits of entropy from a cryptographically secure random source. |
| BR-056 | A token is rendered as URL-safe base64 without padding, prefixed with a fixed two-character scheme marker so that a leaked token is identifiable in a secret scan, and is never derived from, and carries no encoding of, the identifier, name, room, owner or creation time of the item it grants. |
| BR-057 | No public surface exposes a sequential or guessable identifier for a room, folder, file, share or grant. Identifiers appearing in URLs, share pages, emails and analytics payloads are opaque and non-enumerable. |
| BR-058 | Repeated presentation of invalid tokens is rate-limited per source per token prefix per BR-215, and a source exceeding the threshold receives the same indistinguishable response as before, not a distinguishable block page. |
| BR-059 | A token is excluded from server access logs, application logs, error reports, analytics payloads, referrer headers and any URL that leaves the platform. Where a token must appear in a URL, the page carries a no-referrer policy (BR-096) and the token is stripped from client-side telemetry before transmission. |
| BR-060 | A principal is never told who else holds a grant on a scope unless it holds Owner or Manager on that scope. A Viewer or Contributor sees only its own grant, and the share-management screen shows a count only to principals authorised by BR-042. |
| BR-233 | **The 403-versus-404 rule. This is the single normative statement on existence disclosure in the document set.** A principal that holds no active grant on the target, and presents no link token whose scope covers the target, receives `404 NOT_FOUND` on every verb of every endpoint. That response is byte-identical and timing-equivalent to the response for an identifier that has never existed (BR-049, BR-050). `403` is permitted in exactly one situation: the principal already holds an active grant on that exact target and is exceeding it — the canonical case being an authenticated Viewer attempting a write, which BR-017 refuses. A 403 therefore discloses only what its recipient already knew, that the target exists and that it holds a grant on it. Any code path capable of returning `403` to a principal without a grant on the target is a security defect, not a debuggability trade-off. Consequently the codes named `FORBIDDEN`, `SHARE_REVOKED` and `SHARE_EXPIRED` in [09-domain-model-and-glossary.md](./09-domain-model-and-glossary.md) must be re-scoped or deleted so that none of them can reach a principal holding no grant on the target: `FORBIDDEN` survives only for the grant-holding, exceeding-its-grant case; a dead or expired link resolves to the generic state of BR-234 and a `404`, never to a code that names the reason. |
| BR-234 | **A dead link discloses nothing, including its expiry.** A link that is expired, revoked, rotated, quarantined, suspended or never issued renders one generic state whose entire disclosure is the sentence `This link is no longer active.` together with the request-access affordance of BR-099. It never states which of those conditions applies, never names the item, folder, room, sharer or owner, and never discloses an expiry date, an expiry time, a duration, or even the fact that an expiry was ever set. An unauthenticated visitor is never shown an expiry value under any circumstances. Expiry values, like every other share setting, are visible only to a principal holding Owner or Manager on the scope, or to the principal that created the link (BR-060, BR-235). A page, email, banner, error message or API response that tells a visitor when a link expired — including a response body that merely carries an `expiresAt` field — is a defect against this rule. |

**BR-049, BR-051 and BR-233 decision rationale.** Distinguishing 403 from 404 is the conventional,
more debuggable choice, and it is wrong here. In this tool the existence of a room is itself
confidential: knowing that `acme-hvac-sale` exists tells an outsider the business is for sale. The
cost is a harder internal support conversation ("are you sure you have access?") and the benefit is that the
invisibility rule is actually true. Internal server-side logs do record the real reason, so
debuggability is preserved where it does not leak.

The one permitted 403 is narrow on purpose. A Viewer that already holds a grant on a file and tries
to rename it has learned nothing from being told it may not: it can already list the file. Widening
the exception by one step — 403 for "you had a grant and it was revoked", or "this link expired on
14 March" — hands a former recipient a probe that confirms the room exists and dates the deal, which
is exactly the disclosure the invisibility rule exists to prevent. That is why BR-234 forbids the
expiry date outright rather than treating it as a courtesy to the visitor.

**BR-055 decision rationale.** 160 bits is chosen over the more common 128 because these tokens are
long-lived, are frequently forwarded through email and messaging systems that log URLs, and protect
material whose disclosure is commercially terminal. The cost is a 27-character token instead of 22,
which is invisible to a user who taps a link.

---

## Inheritance and override rules

| ID | Rule |
| --- | --- |
| BR-061 | A grant flows down. A grant on a scope applies to every descendant of that scope, at every depth, without any per-descendant record. |
| BR-062 | A grant never flows up or sideways. A grant on a folder confers no authority over that folder's parent, its ancestors, its siblings, or anything outside its subtree. |
| BR-063 | A principal's grants are additive. Where several grants apply to one item, the principal holds the union of their authority, resolved by BR-066 to BR-069. |
| BR-064 | The system has no negative grant, no deny rule and no exclusion. Access is restricted by not granting, never by granting-then-denying. Introducing one is a change to this rule, not a feature that can be added under it; the release tag of any capability that would need one lives in [05-functional-requirements.md](./05-functional-requirements.md). |
| BR-065 | A grant on a descendant may be more permissive than a grant on its ancestor. This is a supported, deliberate configuration, not an error, and the more permissive grant wins on that subtree. |
| BR-066 | Effective role on an item is the maximum, in the total order `Viewer < Contributor < Manager < Owner`, of the roles of every active, unexpired grant held by the principal whose scope is the item or an ancestor of the item. |
| BR-067 | Where two grants confer the same role, the resulting authority is identical and there is no tiebreak to perform. Grant creation order, grant depth and grantor identity never affect effective role. |
| BR-068 | Effective download-allowed on an item is the logical OR of the download-allowed flag of every active grant that applies to the item. Effective can-reshare is resolved the same way. |
| BR-069 | A direct grant on an item takes effect only through BR-066 and BR-068. It does not override an inherited grant that is more permissive, and it cannot reduce inherited authority. |
| BR-070 | To give a principal narrower access to a subtree than it holds on the ancestor, the ancestor grant must be removed or re-scoped. Adding a narrower descendant grant has no restricting effect. |
| BR-071 | An item moved into a subtree immediately acquires every grant that applies to that subtree, and the acquisition is effective on the next request, within the propagation target in BR-108. |
| BR-072 | An item moved out of a subtree immediately loses every grant it held only by inheritance from that subtree. Loss of access is governed by the revocation semantics in BR-106 to BR-120, including the in-flight and cached-content rules. |
| BR-073 | A direct grant on an item travels with that item when it is moved. Moving a file that was individually shared does not revoke that share. |
| BR-074 | A copy carries no grants of its own. The copy inherits from its destination subtree and nothing else, so copying a shared file into an unshared folder produces an unshared copy. |
| BR-075 | An item cannot be moved between rooms. Where the outcome is desired, the operation is a copy into the destination room followed by a delete in the source room, performed explicitly by the principal, so that the grant consequences of BR-074 are visible rather than surprising. |
| BR-076 | Restoring an item from trash recomputes its inherited grants from its restored location. Direct grants that were revoked when the item was deleted (BR-184) are not reinstated. |
| BR-077 | Effective permission is computed server-side on every request. A client-held permission result is a rendering hint with no authority and is never consulted to decide whether to serve bytes or accept a mutation. |
| BR-078 | A public link grants authority over its own scope and descendants only, and never unions with any authenticated principal's grants. A visitor arriving through a link sees the ancestor chain above the link's scope as non-navigable labels showing names only, and cannot list, search or address anything above it. |
| BR-079 | The interface must show, for any item, the source of the principal's authority over it: which grant it derives from, and whether that grant is direct or inherited from a named ancestor. A principal cannot be asked to reason about effective permissions it cannot see. |
| BR-080 | A file individually shared inside an ungranted folder is reachable by its own link or grant, and is invisible when browsing. It never appears in a listing of its parent for a principal whose only grant is on the file, and its parent's other contents are never revealed. |

**BR-064 decision rationale.** Negative grants are the single largest source of bugs and support
escalations in permission systems, because the interaction of inheritance, unions and denies is not
something a user can hold in their head, let alone on a phone. Choosing union-only means the answer
to "why can they see this?" is always "because of this grant", which is answerable in one screen
(BR-079). The cost is that carving a hole in a broadly shared subtree requires restructuring the
grants rather than adding an exception, and that cost is accepted. Revisit only with a designed
precedence model and a UI that can explain it.

**BR-068 decision rationale.** Resolving flags by OR rather than AND was the harder call. AND is
safer in the abstract: a narrow no-download grant would clamp a broad download grant. It is also
badly surprising in practice, because it means adding a grant can take capability away, and because
the narrower grant is usually the more recent and more specific intent. OR keeps the invariant
"granting never reduces", which is what makes BR-070 and BR-079 comprehensible. The mitigation is
FR-SHARE-025: before a share is created the sharer is shown exactly what the recipient will end up
able to do, including the effect of grants that already exist.

**BR-075 decision rationale.** Cross-room move is technically easy and semantically awful: the item
silently changes quota owner, audit room, retention clock and grant set in one operation the user
perceives as a drag. Forcing copy-then-delete makes each of those consequences a separate, visible
act.

### Worked examples

The tree used in every example below. Indentation is containment.

```
Riverside HVAC (room, Owner: marcy@ourcompany.example)
  01 Corporate
    Articles.pdf
    Cap table.xlsx
  02 Financials
    2024
      P and L 2024.pdf
      Bank statements
        Jan.pdf
    2025
      P and L 2025.pdf
  03 Property
    Lease.pdf
```

**Example 1: a folder grant is a keyhole, not a window.**
Marcy grants `dev@buyer.example` the Viewer role on `02 Financials`, download-allowed false.

- Dev can list `02 Financials`, `2024`, `2025`, `Bank statements`, and preview all four files below
  them.
- Dev cannot list `01 Corporate` or `03 Property`, cannot search them, and receives the
  indistinguishable-not-found response for their identifiers (BR-049).
- Dev's workspace home shows one entry for the reachable subtree of `Riverside HVAC`, not the room's
  full contents (BR-037).
- Dev's breadcrumb inside `2024` shows `Riverside HVAC / 02 Financials / 2024`, where
  `Riverside HVAC` is a label and not a navigable target (BR-078).
- Dev cannot download anything (BR-025), but can read everything in scope (BR-040).

**Example 2: a descendant grant more permissive than its ancestor.**
Marcy additionally grants Dev the Viewer role on `02 Financials/2024/Bank statements` with
download-allowed true.

- Effective role on `Jan.pdf`: Viewer, from both grants, so Viewer (BR-066).
- Effective download-allowed on `Jan.pdf`: true, because it is the OR of false and true (BR-068).
- Effective download-allowed on `P and L 2024.pdf`: false. The `Bank statements` grant does not apply
  to it (BR-062).
- This is a supported configuration (BR-065). Before creating the second grant, the interface must
  state that Dev will be able to download the contents of `Bank statements` while remaining unable
  to download the rest of `02 Financials` (FR-SHARE-025).

**Example 3: a narrower grant cannot claw authority back.**
Marcy, wanting Dev to lose download on `Jan.pdf`, adds a third grant: Viewer on `Jan.pdf` with
download-allowed false.

- Nothing changes. Effective download-allowed on `Jan.pdf` remains true, because it is the OR across
  all three applicable grants (BR-068, BR-069).
- The correct action is to remove or re-scope the `Bank statements` grant (BR-070). The interface
  must say so at the point of the attempt rather than accepting a grant that has no effect.

**Example 4: mixed roles in one room.**
Marcy grants `ashley@ourcompany.example` Contributor on `03 Property` and Viewer on the room.

- Effective role on `Lease.pdf`: Contributor, the maximum of Contributor and Viewer (BR-066).
- Effective role on `Articles.pdf`: Viewer.
- Ashley can upload into `03 Property`, and can rename or delete only the items she created there
  (BR-016). She can preview but not mutate anything in `01 Corporate` or `02 Financials`.

**Example 5: moving an item into a shared subtree.**
Ashley moves `Cap table.xlsx` from `01 Corporate` into `02 Financials`.

- On the next request, Dev can see and preview `Cap table.xlsx`, because it now inherits the
  `02 Financials` grant (BR-071).
- Nothing warned Dev, and nothing needed to. But the mover must be warned: the move sheet must state
  that the item will become visible to the principals who hold grants on the destination, because on
  a phone this is the most likely accidental disclosure in the entire product.

**Example 6: moving an item out of a shared subtree.**
Marcy moves `Bank statements` from `02 Financials` to the room root.

- Dev immediately loses the inherited `02 Financials` grant on that folder (BR-072).
- Dev's direct grant on `Bank statements` from Example 2 travels with the folder (BR-073), so Dev
  retains Viewer with download on it, now reachable only by direct link (BR-080).
- If Marcy's intent was to remove Dev's access, moving the folder was not sufficient. The interface
  must state the surviving direct grant in the move confirmation.

**Example 7: copying does not carry grants.**
Marcy copies `Lease.pdf` from `03 Property` into `02 Financials`.

- The copy inherits from `02 Financials` only (BR-074), so Dev can preview it.
- The original in `03 Property` is unaffected.
- Had `Lease.pdf` carried a direct grant to a third party, the copy would not.

**Example 8: a file shared alone inside an unshared folder.**
Marcy shares `01 Corporate/Articles.pdf` with `tomas@cpa.example` as Viewer.

- Tomas can open `Articles.pdf` by its link.
- Tomas cannot list `01 Corporate`, cannot discover `Cap table.xlsx`, and receives the
  indistinguishable-not-found response for the folder (BR-080, BR-049).
- Tomas's breadcrumb shows `Riverside HVAC / 01 Corporate / Articles.pdf` with only the file
  navigable.

---

## Public link rules

| ID | Rule |
| --- | --- |
| BR-081 | A public link is a share whose principal is unauthenticated possession of a token. It grants the Viewer role and never any other role, on its scope and descendants only. An anonymous link visitor is **always** a Viewer: the orthogonal download-allowed flag (BR-025) is the only variable a link carries, there is no role picker on the public-link path, and no setting, flag or configuration makes an anonymous visitor able to write (BR-095). Role control exists only on the invite path, where the recipient is email-bound and attributable. |
| BR-082 | A link token is generated from a cryptographically secure source with at least 160 bits of entropy (BR-055). |
| BR-083 | A link token is encoded as URL-safe base64 without padding, 27 characters, carrying a fixed two-character scheme prefix, and is stored only as a hash so that a database disclosure does not yield usable tokens. |
| BR-084 | The token is the sole credential for the link. Every surface that displays it treats it as a secret: it is never rendered into a page title, a share-sheet subject line, an analytics payload, an error report or a server log (BR-059). |
| BR-085 | A token is unrelated to the identifier, name, type, room, owner or creation time of its scope, and two links on the same item are unrelated to each other (BR-056). |
| BR-086 | A newly created public link defaults to: no expiry, no password, download-allowed inherited from the room's default share policy, watermark inherited from the room's default share policy, and no email-capture gate. Every default is overridable at creation. |
| BR-087 | A link with an expiry ceases to grant any authority at the instant of expiry, evaluated server-side against the server clock, with no grace period and no client involvement. An expired link cannot be un-expired; the expiry can be extended, which is recorded as a grant change in the activity log. |
| BR-088 | A link with a password serves nothing before the password is verified: no listing, no name, no thumbnail, no metadata, no preview and no bytes. The password is verified server-side against a slow hash, is never transmitted to the client, and is never recoverable, only replaceable. |
| BR-089 | **Public-link password attempt limit.** At most 10 failed password attempts are accepted per link, per source address, per 15 minutes. On the tenth failure that link-and-address pair is locked for 15 minutes, during which every request from that address against that link is refused whatever password it presents. The lock is scoped to the pair, never to the token alone, so an attacker cannot lock a legitimate recipient out of a link by failing against it. Each lock raises a security event and notifies every principal holding Owner or Manager on the scope. The locked response is indistinguishable from the ordinary wrong-password response (BR-058), and neither response reveals whether the link exists (BR-233). This rule is the single value; BR-214 states the same limit from the rate-limit side and adds no second number. |
| BR-090 | A link with download-allowed false refuses every byte-delivery path for its scope: file download, zip download, version download and share-to-app (BR-039). Preview remains available. |
| BR-091 | A link with watermarking enabled causes every rendered preview page served through it to carry the visitor identifier, the link identifier and the access timestamp, composited server-side into the rendered page rather than overlaid in the client. |
| BR-092 | A link with an email-capture gate collects an address before serving anything beyond the gate, records that address against every subsequent access through that link in the same session, and labels it unverified everywhere it is displayed (FR-AUDIT-007). |
| BR-093 | Each link is revocable individually. Revoking one link has no effect on any other link, on any permissioned grant, or on the item itself. |
| BR-094 | Rotating a link issues a new token and invalidates the previous one immediately, preserving the link's settings, its counters and its access history under the same link identity. Rotation is the remedy for a token believed to have leaked. |
| BR-095 | A public link can never confer write authority of any kind. There is no configuration, setting or flag that makes an anonymous visitor able to upload, rename, move, delete or share. |
| BR-096 | Every page served for a public link carries `X-Robots-Tag: noindex, nofollow, noarchive`, a matching `robots` meta directive, `Referrer-Policy: no-referrer`, and `Cache-Control: private, no-store` on any response containing item names, metadata or content. |
| BR-097 | The link path prefix is disallowed in `robots.txt`, and no sitemap, feed, social preview card or link-unfurling response is generated for a link URL. |
| BR-098 | The pre-gate page for a password-protected or email-gated link reveals only that a document has been shared and by which room name, if the room's default policy permits even that; it never reveals the item name, type, size, count or the sharer's email address. |
| BR-099 | A visitor arriving on an expired, revoked, rotated, quarantined or never-issued link sees one page carrying the single sentence `This link is no longer active.`, a request-access action, and nothing else: no item name, no room name, no owner, no sharer, no reason, no expiry date, and no indication of whether the link ever existed (BR-234). On a phone this page fits without scrolling at 360 CSS pixels and its primary action sits in the thumb zone. |
| BR-100 | Each link records total views, unique visitors, total downloads, first access and last access, and those counters survive rotation (BR-094). |
| BR-101 | An item may carry at most 20 concurrently active public links. Creating a twenty-first is refused with a message stating the limit and offering the list of existing links. |
| BR-102 | Links are independent. A setting on one link never affects another, and a visitor's having passed one link's gate never satisfies another link's gate. |
| BR-103 | A link's scope cannot be changed after creation. Widening or narrowing the shared scope requires revoking the link and creating a new one, so that a forwarded URL can never silently come to grant more than it did when it was sent. |
| BR-104 | **Per-link egress ceiling, default 25 GiB per rolling 24 hours.** Every public link carries an egress ceiling on original bytes delivered through it. The default is 25 GiB per link per rolling 24-hour window. An administrator may set a different value per data room within the bounds of BR-231, and no value is derived from anything other than that setting. Exceeding the ceiling suspends byte delivery for that link until the window rolls, notifies the Owner and every Manager on the scope with the observed figure, and continues to serve previews unchanged. The suspended byte path returns the same refusal as a link with download-allowed false (BR-090), so the ceiling is never an existence oracle for the room's size. |
| BR-105 | The Owner and every Manager on the scope are notified on a link's first access, and on an access pattern flagged as anomalous by BR-228. |

**BR-081 and BR-095 decision rationale.** Some prior-art tools offer anonymous upload links, and a
role picker on the public-link dialog. Both are genuinely useful (an outside party sending documents
without an account) and both are refused here, because an anonymous write path into a confidential
room is an unbounded liability: no attribution, no revocable identity, no defence against abuse, and
no way to explain the resulting item in an audit log. The supported equivalent is an email-bound
Contributor invitation, which is one extra tap for the recipient and preserves attribution. Keeping
the public-link role fixed at Viewer also removes the worst mis-tap in the sharing flow: a staff
member on a phone selecting a writable role for a link they are about to paste into an email.

**BR-103 decision rationale.** Allowing the scope of an existing link to be edited is convenient and
is exactly the mechanism by which a link forwarded three months ago silently starts granting access
to a whole room. Immutable scope means the URL a recipient holds means the same thing forever, or
nothing.

**BR-099 decision rationale.** Telling the visitor which of expired, revoked or never-existed
applies is friendlier and leaks. "Revoked" tells a former recipient that they specifically were cut
off, "expired" confirms the room exists, and an expiry date tells them when the work it belonged to
was expected to end. One page, one message, no date (BR-234).

---

## Revocation semantics

The brief requires that the owner can revoke a share at any time. This section is the definition of
"at any time" with numbers attached.

| ID | Rule |
| --- | --- |
| BR-106 | A revocation takes effect in the authoritative store synchronously, within the request that performs it. The request does not return success until the grant or link state is durably recorded as revoked. |
| BR-107 | Revocation is a state transition to `revoked`, never a deletion. The record, its history and its audit trail are retained for the activity-log retention period in BR-195, so that "who had access and when was it removed" remains answerable. |
| BR-108 | **Propagation target, and the single source of the revocation numbers.** A revoked principal is refused on every path within **5 seconds at the 95th percentile** and within **60 seconds absolutely**, measured from the acknowledged revoke request to the first refused request by that principal. These two figures are the only revocation-latency numbers in the document set; every other document cites them as "5 s p95 / 60 s absolute (BR-108)" and states no third figure. The target applies to grants, public links, session revocation and sign-out-everywhere alike, and is measured continuously as a production service-level objective. A download already streaming when the revocation commits is bounded separately and more tightly by BR-111. The mechanisms that make the bound achievable are the 5-minute access-credential lifetime (BR-023), the 60-second signed-URL lifetime (BR-110) and the 30-second loaded-page re-check interval (BR-112); a change to any of those three changes this bound and must be made here. |
| BR-109 | A request already in flight when the revocation commits either completes with the authority it was authorised under, or is refused, depending on whether it had passed its authorization check. No request is retroactively reversed, and no partially written mutation is left behind: a mutation is atomic with respect to its authorization check. |
| BR-110 | Every signed content URL carries a maximum lifetime of 60 seconds and is bound to the grant identity and the grant's epoch counter. A revocation increments the epoch, which invalidates every outstanding signed URL derived from that grant immediately, without waiting for their expiry. |
| BR-111 | **Streamed downloads are cut within 30 seconds.** A download in progress is re-authorised on every byte-range request, so a revocation terminates it at the next range boundary rather than allowing it to complete, and **in no case more than 30 seconds after the revocation commits**. Where a client is holding a long range open, the server closes the response at the 30-second bound whether or not a natural range boundary has been reached, and refuses any further range request against that grant. The client reports the download as failed, not as complete. 30 seconds is the single value; no other document may state a different streamed-download bound. |
| BR-112 | **Loaded-page grant re-check interval, 30 seconds.** A page already loaded in a revoked principal's browser loses access on its next request, and it makes a request at least every 30 seconds for exactly this purpose: an idle open page re-checks its grant state on a 30-second interval, so an idle session cannot outlive a revocation by more than that interval plus one request. This is the interval referenced by BR-108, and it is what makes the 60-second absolute bound achievable rather than aspirational. On refusal the client discards the in-memory representation of the affected scope, replaces the view with an explicit access-removed state, and does not silently render stale data. |
| BR-113 | On the next application start after a refusal, the client purges from its local cache every listing, thumbnail, rendered preview page and pinned file belonging to the revoked scope. This purge is best-effort by definition: the platform may have already evicted the storage, or may have discarded the page before the purge ran. |
| BR-114 | A role downgrade takes effect on the next request. The response carries the principal's new effective role, the client re-renders its capabilities from that response, and any mutation the new role does not permit is refused even if it was already composed in the interface. |
| BR-115 | A role downgrade does not sign the principal out and does not invalidate its session. Only a revocation of the last grant covering the principal's current location returns it to the access-removed state. |
| BR-116 | A queued offline mutation belonging to a revoked or downgraded principal is refused at reconciliation, is surfaced to the principal as failed with the reason, and is never force-applied (BR-131). |
| BR-117 | Revocation cannot recall bytes that already left the platform. A file already downloaded to a device, printed, screenshotted or forwarded is outside the system's control, and the product must say so plainly in the revoke confirmation rather than implying otherwise. The activity log records that the download happened and when, which is the actual remedy. |
| BR-118 | Revoking a grant on an ancestor does not revoke a direct grant on a descendant. The revoke confirmation must state, with counts, which principals will retain access through surviving direct grants, and offer to revoke those in the same operation. |
| BR-119 | A bulk revoke is atomic: either every named grant and link is revoked, or none is, and the result enumerates each one. A partial bulk revoke is never reported as success. |
| BR-120 | Every revocation writes an activity entry recording the actor, the revoked principal or link, the scope, the timestamp and the reason if one was given, and notifies the Owner and every Manager on the scope. |
| BR-235 | **Revoke authority.** A grant or public link may be revoked by exactly three principals and no others: the room Owner; a Manager whose grant scope is at or above the grant being revoked (condition C5); and the principal that created the grant or link, whatever its own role (condition C16). The creator's authority is limited to the grants and links it created — it confers no authority to revoke anyone else's grant, to see grants it did not create, or to change a role or a flag on any grant. A Contributor or Viewer that created a reshare under BR-026 can therefore always withdraw its own reshare, which is the case that made the narrower rule wrong: the principal who made the disclosure is the one most likely to notice it was a mistake. Revocation by a creator carries the full semantics of BR-106 to BR-120, including the notification in BR-120, so an Owner always learns that it happened. |

**BR-108 decision rationale.** Five seconds at p95 was chosen over "immediate" because immediate is
not a testable claim in a distributed system, and over "one minute" because the colleague revoking a
recipient's access is standing there watching. The 60-second absolute ceiling is the outer bound
implied by the 5-minute access-credential lifetime in BR-023, the 60-second signed-URL lifetime in
BR-110 and the 30-second loaded-page re-check in BR-112, combined with per-request grant re-checks on
content paths. Achieving p95 of 5 seconds requires that content delivery and mutation paths consult
the authoritative grant state rather than a cached copy; caching effective permissions for
performance is explicitly forbidden by BR-077 for this reason, and no requirement anywhere in the
set may state that the API need not consult grant state per request.

**BR-111 decision rationale.** Letting an in-progress download complete is kinder to the user and
means a revoke does not stop a 400 MB transfer that is 99 percent done. It is refused because the
whole point of revocation in this product is the moment an external recipient turns hostile, and a
several-minute window in which they can still pull the entire archive defeats it. The 30-second hard
bound exists because "the next range boundary" is not a bound at all against a client that asks for
one open-ended range: without it, a single request could outlive the revocation indefinitely.

**BR-117 decision rationale.** Stating the limit in the confirmation dialog costs a line of copy and
buys the tool its credibility with the legal team. Prior-art products imply revocation is absolute;
it is not, for anyone, and saying so plainly is what stops a colleague over-trusting the button at
the moment it matters.

**BR-235 decision rationale.** Restricting revocation to the Owner and Managers reads safer and is
worse. The person who sends a link on a phone is very often a Contributor or a Viewer with
can-reshare, and the fastest correction of a mis-sent link is that same person withdrawing it in the
next ten seconds — not finding a Manager. The rule is safe because a creator can only withdraw
authority, never widen it (BR-027 still bounds creation), and because BR-120 tells the Owner it
happened. The narrow scoping matters: creator authority is per-grant, so it can never be used to
enumerate or remove grants the principal did not issue.

---

## Read-only enforcement

| ID | Rule |
| --- | --- |
| BR-121 | The API is the sole enforcement point for every authorization decision. Every mutating endpoint performs its full check set on every request, regardless of client type, client version, or whether the interface would have offered the action. |
| BR-122 | The interface is a hint. A hidden button, a disabled control and an omitted menu item are conveniences with no security value, and a request that bypasses them is refused by the API, not accepted. |
| BR-123 | Every mutating endpoint performs, in this order: (A) resolve the principal; (L) apply rate limits; (G) resolve the grant chain on the target scope; (R) check the effective role against the matrix; (F) check the required flags; (S) check item, room and account state; (Q) check quota where the mutation consumes storage; (V) check the version token; (I) check the idempotency key. A failure at any step returns a typed error naming that step's failure class and no other information. |
| BR-124 | The check set applied by each mutating endpoint is the following table. Adding an endpoint to the API without adding it to this table is a review-blocking defect. |

| Method and path | A | L | G | R | F | S | Q | V | I |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `POST /api/rooms` | yes | yes | n/a | account holder | n/a | account | room-count ceiling (BR-236) | n/a | yes |
| `PATCH /api/rooms/:roomId` | yes | yes | yes | Manager | n/a | yes | n/a | yes | yes |
| `POST /api/rooms/:roomId/archive` | yes | yes | yes | Owner | n/a | yes | n/a | yes | yes |
| `DELETE /api/rooms/:roomId` | yes | yes | yes | Owner + step-up | n/a | yes | n/a | yes | yes |
| `POST /api/rooms/:roomId/transfer-ownership` | yes | yes | yes | Owner + step-up | n/a | yes | transferee quota | yes | yes |
| `POST /api/folders/:parentId/folders` | yes | yes | yes | Contributor | n/a | yes | n/a | n/a | yes |
| `PATCH /api/folders/:folderId` | yes | yes | yes | Contributor + authorship | n/a | yes | n/a | yes | yes |
| `POST /api/folders/:folderId/move` | yes | yes | yes | Contributor + authorship, on source and destination | n/a | yes | n/a | yes | yes |
| `DELETE /api/folders/:folderId` | yes | yes | yes | Contributor + authorship | n/a | yes | n/a | yes | yes |
| `POST /api/folders/:folderId/uploads` | yes | yes | yes | Contributor | n/a | yes | yes | n/a | yes |
| `PATCH /api/uploads/:uploadId` (chunk) | yes | yes | yes | upload creator | n/a | yes | yes | n/a | yes |
| `POST /api/uploads/:uploadId/complete` | yes | yes | yes | upload creator | n/a | yes | yes | n/a | yes |
| `PATCH /api/files/:fileId` | yes | yes | yes | Contributor + authorship | n/a | yes | n/a | yes | yes |
| `POST /api/files/:fileId/move` | yes | yes | yes | Contributor + authorship, on source and destination | n/a | yes | n/a | yes | yes |
| `POST /api/files/:fileId/copy` | yes | yes | yes | Contributor on destination, read on source | n/a | yes | yes | n/a | yes |
| `DELETE /api/files/:fileId` | yes | yes | yes | Contributor + authorship | n/a | yes | n/a | yes | yes |
| `POST /api/files/:fileId/versions` | yes | yes | yes | Contributor + authorship | n/a | yes | yes | yes | yes |
| `POST /api/files/:fileId/versions/:v/restore` | yes | yes | yes | Contributor + authorship | n/a | yes | yes | yes | yes |
| `POST /api/trash/:itemId/restore` | yes | yes | yes | Contributor + authorship, plus destination authority | n/a | yes | yes | yes | yes |
| `DELETE /api/trash/:itemId` | yes | yes | yes | Manager | n/a | yes | n/a | yes | yes |
| `POST /api/items/:itemId/shares` | yes | yes | yes | Manager, or can-reshare | can-reshare, download-allowed ceiling | yes | guest-count ceiling (BR-236) | n/a | yes |
| `PATCH /api/shares/:shareId` | yes | yes | yes | Manager on scope | role and flag ceiling | yes | n/a | yes | yes |
| `DELETE /api/shares/:shareId` | yes | yes | yes | Manager on scope, or the grant's creator (BR-235) | n/a | revoke permitted in read-only | n/a | yes | yes |
| `POST /api/shares/:shareId/rotate` | yes | yes | yes | Manager on scope | n/a | yes | n/a | yes | yes |
| `PATCH /api/grants/:grantId` | yes | yes | yes | Manager on scope, not an Owner grant | role and flag ceiling | yes | n/a | yes | yes |
| `GET /api/files/:fileId/content` | yes | yes | yes | Viewer | download-allowed | not trashed | n/a | n/a | n/a |
| `GET /api/folders/:folderId/archive` (zip) | yes | yes | yes | Viewer | download-allowed | not trashed | n/a | n/a | n/a |
| `PATCH /api/account` | yes | yes | n/a | account holder | n/a | yes | n/a | yes | yes |
| `PATCH /api/account/governance` | yes | yes | n/a | administrator capability (BR-044) | n/a | yes | n/a | yes | yes |
| `POST /api/account/provisioning` | yes | yes | n/a | administrator capability (BR-044) | n/a | yes | n/a | yes | yes |
| `DELETE /api/account` | yes | yes | n/a | account holder + step-up | n/a | yes | n/a | yes | yes |

| ID | Rule |
| --- | --- |
| BR-125 | Every mutable resource representation carries an opaque version token. Every mutating request against it must present that token, and a request without one is refused as malformed rather than being treated as an unconditional write. |
| BR-126 | Every mutating request must carry a client-generated idempotency key, unique to the intent. Repeating a key returns the original outcome without repeating the effect, and a key presented with a different payload is refused as a conflict. |
| BR-127 | A room in a read-only state refuses every mutation except revoking a share, deleting content, and repairing the condition that caused the state. |
| BR-128 | An archived room refuses every mutation except restoring the room. Every share on an archived room is suspended, which is enforced identically to revocation for the duration. |
| BR-129 | An account in a read-only state, whether from a quota overrun after an administrator reduced the quota (BR-206), from an administrator placing it in read-only deliberately, or from suspension for abuse (BR-229), refuses every mutation except share revocation, deletion, export, and the action that repairs the condition (BR-035). |
| BR-130 | **The queueable mutation kinds are exactly three: file upload, rename, and delete-to-trash.** This list is complete and closed. Every other mutation — move, copy, replace-as-new-version, folder create, share create, share revoke, role change, restore from trash, permanent delete, and every account-level action — requires a live connection, and the interface must say so at the point of attempt rather than accepting it into a queue it cannot honour. Any document listing a fourth queueable kind is a defect against this rule; cite it as "the three kinds in BR-130". |
| BR-131 | Offline reconciliation replays each queued mutation with its captured version token and its idempotency key. A mutation whose token is stale, whose authority has changed, or whose target has moved or been deleted, fails and is surfaced for individual resolution. No queued mutation is ever force-applied, and no queued mutation is discarded without the principal seeing it. |
| BR-132 | Every refusal returns a typed error carrying a stable machine-readable code, a human-readable message safe to display verbatim, and the identifier of the failing check class from BR-123. It never returns a stack trace, an internal identifier, or information distinguishable per BR-051. |
| BR-133 | When a mutation applied optimistically in the client is refused, the client restores the exact pre-mutation state of the affected rows, presents the server's message, and offers retry where retry is meaningful. It never leaves the interface showing a change the server rejected, and it never re-applies the change on its own. |
| BR-134 | The client never caches an authorization result beyond the response that produced it. Rendering hints derived from a response are discarded when that response's data is invalidated. |
| BR-135 | Read-only enforcement extends to every derived and aggregate path: bulk zip download, thumbnail generation, rendered preview pages, search result content snippets, export archives, and email digests all apply the same grant and flag checks as the primary path. |

**BR-126 decision rationale.** Requiring an idempotency key on every mutation, rather than only on
uploads, is extra client work. It is required because on a cellular link the client cannot
distinguish a lost request from a lost response, so it must retry, and without a key every retry
produces a duplicate folder, a duplicate share or a double delete. The requirement is what makes
FR-CONF-029 and FR-FILE-015 implementable rather than aspirational.

**BR-130 decision rationale.** A general offline mutation queue over a permissioned hierarchy is a
distributed-systems project. Restricting the queue to three kinds whose reconciliation is tractable
keeps the scope honest — the release tag for the capability lives in
[05-functional-requirements.md](./05-functional-requirements.md), not here — and stating plainly
that other actions need a connection is better than accepting a share creation offline and
reconciling it into a permission the user did not intend. The three kinds were chosen because each
reconciles against a single item with a version token and a clear failure story: an upload either
lands or is offered again, a rename either applies or reports a collision, a delete either applies
or reports that the item is already gone. A move needs two live scopes, a share needs a live grant
graph, and a restore needs a live trash state; none of those can be honestly resolved from a queue.

**Withdrawn in the internal-tool rework.** One row is withdrawn from the BR-124 endpoint table:
`POST /api/billing/subscription`. It is replaced by `PATCH /api/account/governance` and
`POST /api/account/provisioning`, which are the account-level endpoints an internal tool actually
has. The `Q` column entries that read "plan room limit" and "plan guest limit" now read
"room-count ceiling (BR-236)" and "guest-count ceiling (BR-236)"; the check itself is unchanged, only
its source. No BR ID was retired in this section.

---

## Naming and conflict rules

### Character set and normalisation

| ID | Rule |
| --- | --- |
| BR-136 | A name may contain any Unicode scalar value except those forbidden by BR-137, BR-138 and BR-139, after the normalisation and trimming in BR-140 to BR-142. Letters, digits, marks, punctuation, symbols, spaces and emoji from every script are permitted. |
| BR-137 | The following nine characters are forbidden anywhere in a name: solidus `/`, reverse solidus `\`, colon `:`, asterisk `*`, question mark `?`, quotation mark `"`, less-than `<`, greater-than `>`, and vertical line (U+007C, the pipe character). Reason: each is a path separator, a wildcard or a reserved character on at least one of the filesystems a download, a zip extraction or a device sync will land on, and a name containing one either fails to extract or silently changes meaning. The error names the specific offending character. |
| BR-138 | The following are forbidden anywhere in a name: Unicode control characters U+0000 to U+001F and U+007F, the bidirectional override and isolate controls U+202A to U+202E and U+2066 to U+2069, and the directional marks U+200E and U+200F. Reason: bidirectional overrides let a name render as `report-gpj.pdf` while actually being `report-fdp.jpg`, which is a live filename-spoofing technique against a person deciding whether to open an attachment. |
| BR-139 | A name may not contain a path separator of any kind, and a submitted name containing one is rejected rather than being split into path components. Hierarchy is expressed by the parent reference, never by the name. |
| BR-140 | Every submitted name is normalised to Unicode Normalisation Form C before validation, storage, comparison and display. The normalised form is the stored form; the submitted form is not retained. Reason: the same visible name typed on macOS and on Windows can arrive in different normalisation forms, and without normalising, two items that look identical would coexist in one folder. |
| BR-141 | Leading and trailing whitespace of every kind, including non-breaking and ideographic spaces, is trimmed. Interior whitespace is preserved but a run of interior whitespace is collapsed to a single space. |
| BR-142 | Trailing full stops are trimmed. Reason: a trailing dot is unrepresentable on Windows filesystems and silently disappears on extraction, which would turn a unique name into a collision after the fact. |
| BR-143 | Uniqueness within a parent is case-insensitive. Two names collide when they are equal after NFC normalisation (BR-140), trimming (BR-141, BR-142) and Unicode simple case folding. `Lease.pdf` and `lease.PDF` collide. |
| BR-144 | The following names are reserved and rejected, case-insensitively, with or without an extension: `CON`, `PRN`, `AUX`, `NUL`, `COM1` to `COM9`, `LPT1` to `LPT9`, `.`, `..`. Reason: the first group cannot be created on Windows filesystems, so an archive containing one fails to extract; the last two are path traversal tokens. |
| BR-145 | An empty name, a name consisting only of characters removed by trimming, and a name consisting only of full stops are rejected. |
| BR-156 | A name whose characters mix scripts in a way that produces a visual confusable of an existing sibling name is accepted, and the interface displays a non-blocking notice on both items stating that two names look alike. Reason: blocking is unacceptable for legitimate multilingual use; silence is unacceptable when the collision is the point of the attack. |
| BR-157 | Uniqueness is enforced per parent, not per room. Two folders in different parents may both contain `Lease.pdf`. |
| BR-165 | A rename that changes only the case of an existing name is permitted and is applied, because it does not collide with itself under BR-143. |

### Length, depth and path limits

| ID | Rule |
| --- | --- |
| BR-158 | **The maximum length of a single name is 255 UTF-8 bytes**, measured after NFC normalisation (BR-140) and trimming (BR-141, BR-142), including any extension and any duplicate-resolution suffix. This is the single value for a name length limit in the document set. |
| BR-159 | **The maximum total path length within a room is 4,096 UTF-8 bytes**, computed as the sum of the UTF-8 byte lengths of every name from the room root to the item, plus one byte for each separator between a pair of names. The room's own name is excluded from the computation. This is the single value for a path length limit in the document set. |
| BR-160 | The maximum nesting depth is 32 levels below the room root. The room root is depth 0; an item at depth 32 may not contain a folder. |
| BR-161 | **Length is measured in UTF-8 bytes, and warned about in graphemes.** All length counts in BR-158, BR-159 and BR-162 are UTF-8 bytes after NFC normalisation — not code points, not UTF-16 code units, not characters. Reason: the byte length is what the object store, the database column, the `Content-Disposition` header, the zip container and the filesystem a download lands on actually enforce, so a limit expressed in any other unit is a limit the storage layer can still refuse after the product accepted it. Because a byte count is invisible to a person typing, the interface never presents bytes as the primary signal: the create and rename fields show the remaining allowance as a **grapheme cluster** count, and display a warning once the name reaches 80 percent of its byte allowance, stating that the name is close to the limit and that some characters cost more than one byte. The warning must appear while the name is still acceptable, never as a refusal at submit time, and it is required precisely because an emoji costs 4 bytes and a Devanagari or Han grapheme commonly costs 3, so a 90-grapheme name can breach a 255-byte limit that a 250-grapheme ASCII name does not. Where a limit is reached mid-input the field stops accepting further graphemes rather than silently truncating. |
| BR-162 | A room name follows every rule in this section, including the 255-byte limit of BR-158, except that it is not subject to sibling uniqueness. Two rooms owned by the same account may share a name, and are distinguished by the visual marker required by FR-ROOM-015. |
| BR-163 | Names in a generated zip archive are sanitised for the target filesystem at generation time: forbidden characters that survived because they were legal here are replaced, path length is truncated from the middle of the longest interior segment with an ellipsis, and a collision produced by sanitisation is resolved by the algorithm in BR-146. The archive contains a manifest mapping sanitised names to original names. |
| BR-164 | A single-file download presents the name sanitised the same way and, where the platform permits, carries the original name in the RFC 5987 encoded form of the `Content-Disposition` filename parameter. |

### Duplicate resolution

| ID | Rule |
| --- | --- |
| BR-146 | **The deterministic duplicate-resolution algorithm.** Given a desired name `N` and a target parent `P`: (1) normalise and trim `N` per BR-140 to BR-142; (2) split `N` into `base` and `ext`, where `ext` is the final full stop and everything after it if and only if the full stop is not the first character and is followed by 1 to 16 characters containing no full stop, and is the empty string otherwise; (3) if `N` does not collide in `P` under BR-143, use `N`; (4) otherwise, for `n` = 2, 3, 4, … , form the candidate `base + " (" + n + ")" + ext` and return the first candidate that does not collide; (5) if `n` reaches 10,000 without a free candidate, refuse the operation with a typed error. |
| BR-147 | The suffix format is exactly one space, an opening parenthesis, the decimal integer with no leading zeros, and a closing parenthesis, inserted immediately before the extension separator, or appended to the whole name where there is no extension. The counter starts at 2. |
| BR-148 | The algorithm never parses or strips an existing parenthesised number from the incoming name. The whole submitted name, suffix included, is the `base`. |
| BR-149 | Where appending the suffix would exceed the 255-byte name limit in BR-158, the `base` is truncated from its end by exactly enough bytes to fit, and the suffix and extension are preserved in full. The suffix is never truncated. Truncation never splits a UTF-8 sequence and never splits a grapheme cluster: where the byte at the cut point falls inside either, the whole cluster is removed, so the result may be a byte or two shorter than the limit but is always well-formed and always renders. |
| BR-150 | The "Apply to all remaining" choice in a conflict sheet is scoped to the current operation and to conflicts of the same kind within it. It expires when the operation completes, is never persisted as a preference, and is never applied across operations. A separate "Apply to all" is offered for each distinct conflict kind (name collision, forbidden character, over-length) encountered. |
| BR-151 | **Every detected conflict offers exactly three resolutions, and no default is pre-selected: Keep both**, which applies the algorithm in BR-146; **Replace as a new version**, which creates a new current version of the existing item per BR-153; and **Cancel this item**, which abandons this one item and continues the operation. That set is closed. No fourth resolution exists — in particular, combining the contents of two folders into one is never offered as a resolution, because it is not reversible by undo, it cannot be predicted before it runs, and on a phone it is indistinguishable at a glance from Replace. Abandoning the whole remaining operation is not a resolution and is not one of the three: it is the sheet's own abort control, which cancels the items not yet processed and leaves the items already resolved as they are. These are the three choices FR-CONF-006 requires; cite them elsewhere as "the three choices in BR-151". |
| BR-152 | An upload is idempotent on the tuple (parent identifier, normalised name, content hash, idempotency key). A retry matching an existing tuple returns the existing item rather than creating a duplicate or a "(2)" variant. |
| BR-153 | Replace never overwrites bytes. It creates a new current version of the existing item, retains the previous version per BR-186, and preserves the item's identifier, its grants, its links and its activity history. Every link and grant pointing at that item now resolves to the new version. |
| BR-154 | A rename preserves the extension unless the principal explicitly edits it. The rename field pre-selects the base name only, and changing or removing an extension requires a confirmation stating the type change. |
| BR-155 | Extensions are hidden in list and tile rows by default, shown when the principal enables the setting, and always shown in the details sheet and in the rename field. The setting applies uniformly to every surface. |
| BR-166 | Conflict detection is server-authoritative and is performed inside the same transaction as the mutation, so that two simultaneous creates of the same name cannot both succeed. |
| BR-167 | The client may compute and display the name a Keep-both will produce, and that prediction must equal the server's result for the same inputs. The algorithm in BR-146 is implemented once in `packages/shared` and imported by both sides, and is covered by a shared fixture set. |
| BR-168 | A multi-item operation processes items in a deterministic order: ascending by normalised name, then by identifier. Consequently the numbers assigned by BR-146 across a batch are reproducible. |
| BR-169 | A name held by an item currently in trash does not block a new item taking that name. Restoring the trashed item later is then a conflict, resolved at restore time by BR-181 and BR-151. |
| BR-170 | A name held by an in-flight, not-yet-committed upload does block a second upload of the same name in the same parent, which is resolved as a normal conflict. Reason: without this, two simultaneous uploads of the same document from a phone that retried produce two items. |

### Worked examples

**Example A: the simple case.**
`Lease.pdf` is uploaded into a folder already containing `Lease.pdf`.
`base` = `Lease`, `ext` = `.pdf`. `n` = 2 gives `Lease (2).pdf`, which is free. Result:
**`Lease (2).pdf`**.

**Example B: the case the assignment asks for.**
`file (1).pdf` is uploaded into a folder already containing `file (1).pdf`.
By BR-148 the existing parenthesised number is not parsed out, so `base` = `file (1)` and
`ext` = `.pdf`. `n` = 2 gives `file (1) (2).pdf`, which is free. Result: **`file (1) (2).pdf`**.

Uploading `file (1).pdf` a third time into the same folder now finds both `file (1).pdf` and
`file (1) (2).pdf` present. `n` = 2 collides, `n` = 3 is free. Result: **`file (1) (3).pdf`**.

**Example C: a gap in the sequence is filled, not skipped.**
A folder contains `Deck.pdf`, `Deck (2).pdf` and `Deck (4).pdf`. Uploading `Deck.pdf` produces
**`Deck (3).pdf`**, because the algorithm returns the first free integer, not the highest plus one.

**Example D: case-insensitive collision.**
A folder contains `lease.PDF`. Uploading `Lease.pdf` collides under BR-143. `base` = `Lease`,
`ext` = `.pdf`. Result: **`Lease (2).pdf`**. The existing item's case is not changed.

**Example E: no extension.**
A folder contains a folder named `2024`. Creating another folder named `2024` yields
**`2024 (2)`**, with the suffix appended to the whole name because `ext` is empty.

**Example F: a name that looks like it has an extension but does not.**
`Q1.Final.Reviewed` collides. Step 2 finds a final full stop followed by `Reviewed`, which is 8
characters with no interior full stop, so `ext` = `.Reviewed` and `base` = `Q1.Final`. Result:
**`Q1.Final (2).Reviewed`**. This is a known imperfection of extension detection and is accepted:
the alternative, an allow-list of known extensions, is worse because it mangles every unusual but
legitimate suffix.

**Example G: length interaction, measured in bytes.**
A 254-byte name `AAAA…A.pdf` collides. Because every character is ASCII, 254 bytes is also 254
characters. Appending ` (2)` would add 4 bytes for a total of 258, over the 255-byte limit of
BR-158. By BR-149 the base is truncated by 3 bytes and the result is `AAAA…A (2).pdf` at exactly 255
bytes. The suffix and extension survive intact.

**Example H: the same interaction where a character is not one byte.**
A folder contains `отчёт.pdf`. A second upload of `отчёт.pdf` collides. `base` = `отчёт`,
`ext` = `.pdf`, and the result is **`отчёт (2).pdf`** — 10 bytes of Cyrillic, 4 bytes of suffix, 4
bytes of extension, 18 bytes in total, nowhere near the limit.

Now take a colliding name that is already 253 bytes and whose last base character is a two-byte
Cyrillic letter. Appending ` (2)` needs 4 bytes, taking it to 257, so at least 2 bytes must go.
Removing that final letter removes exactly 2 bytes, and the result lands at 251 + 4 = 255 bytes: a
perfect fit. Had the final base character been a three-byte Han glyph, removing it would give
250 + 4 = 254 bytes, one byte under the ceiling, and that is the correct answer — BR-149 removes the
whole grapheme rather than half of it. Shorter than the ceiling is correct; malformed is not.
Throughout, the interface warned the user in graphemes at 80 percent of the byte allowance
(BR-161), so the truncation is not a surprise.

**BR-147 decision rationale, counter starting at 2.** Starting at 1 produces `Lease (1).pdf` next to
`Lease.pdf`, which reads as if the original were number zero. Starting at 2 means the suffix number
is the ordinal of the copy, which is what users expect and what the dominant desktop platforms do.

**BR-148 decision rationale, not parsing existing suffixes.** Parsing `file (1).pdf` back to a base
of `file` and then producing `file (2).pdf` is what several file managers do, and it is lossy: a user
who deliberately named a document `Amendment (1).pdf` because it is amendment one finds their
numbering silently reinterpreted, and two unrelated documents can be merged into one apparent
sequence. Treating the whole submitted name as the base is uglier in one case and correct in all of
them. It also makes the algorithm a pure function of (name, sibling set), which is what BR-167
requires.

### Conflict resolution on a phone

| ID | Rule |
| --- | --- |
| BR-171 | The conflict sheet at compact width presents: the conflicting name; a one-line statement of what already exists there, including its size and modified date; the three resolutions of BR-151 as full-width targets of at least 48 CSS pixels; the name that Keep both will produce, shown literally; and, during a multi-item operation, the "Apply to all remaining" control and a progress indicator of the form "conflict 3 of 11". Replace is styled as the consequential option and is never the top-most target under the thumb. No resolution is pre-selected, and the sheet cannot be dismissed by an outside tap. |

---

## Deletion, trash and retention rules

| ID | Rule |
| --- | --- |
| BR-172 | **The cascade warning must state, as exact integers computed server-side:** the number of subfolders that will be deleted; the number of files that will be deleted; the total size of those files in human-readable units; the number of active grants and public links that will stop working; and the name of the deepest item, if any, that a principal other than the actor created. The warning names the folder being deleted. It never uses a vague quantifier such as "all contents" in place of a count. |
| BR-173 | The counts in BR-172 are computed by the server at the moment the warning is requested, are returned with the confirmation token, and are re-validated on commit. If the subtree changed between warning and commit, the commit is refused and a fresh warning with updated counts is presented. |
| BR-174 | A second, distinct confirmation is required when a cascade delete would remove more than 25 items in total, or would break any active grant or public link. The second confirmation is an explicit acknowledgement control, not a repeat of the same button, and it restates the counts. |
| BR-175 | A cascade delete is atomic. Either the whole subtree moves to trash or none of it does. A partially deleted subtree is never observable. |
| BR-176 | Every delete presents an undo affordance for 10 seconds. Activating it restores the entire subtree to its exact prior state, including grants that were revoked by BR-184. After the undo window closes, recovery is through trash. |
| BR-177 | Trash retains items for 30 days from deletion, after which they are permanently deleted by a scheduled job. The remaining retention time is shown per item in the trash screen. |
| BR-178 | Trash is scoped per room. An item deleted from a room appears only in that room's trash, and a principal sees only the trashed items it is authorised to see by the matrix. |
| BR-179 | A trashed item is excluded from every listing, search result, breadcrumb, count and share resolution, and continues to consume storage quota until it is permanently deleted. The quota display states how much of the used total is in trash. |
| BR-180 | Restoring an item restores the whole subtree that was deleted with it, to its original parent, with its original names. A name collision at the destination is resolved by BR-151, offering the same three choices. |
| BR-181 | Where the original parent no longer exists, restore proceeds as follows, in order: if the original parent is itself in trash and restorable, it is restored first, recursively, up to the room root; otherwise the missing ancestor chain is recreated as folders under a room-root folder named `Restored items`, preserving the original relative path; and if the room itself no longer exists, the restore is refused with an explanation. The chosen path is stated in the confirmation before the restore commits. |
| BR-182 | Permanent deletion is irreversible from the product's point of view: the item disappears from trash, its bytes are scheduled for destruction, and no interface, endpoint or support action recovers it. Deleted bytes may persist in encrypted backups until the backup horizon in BR-194 elapses, and that fact is stated in the confirmation. |
| BR-183 | Permanently deleting a folder from trash permanently deletes its whole trashed subtree, behind a confirmation that states the counts per BR-172. |
| BR-184 | Deleting an item revokes every grant and public link whose scope is that item or a descendant of it, immediately and with the full revocation semantics of BR-106 to BR-120. Grants inherited from a surviving ancestor are unaffected. |
| BR-185 | Restoring an item, or restoring an archived room, does not reinstate any grant or link that was revoked or suspended. Access must be granted again explicitly. The only exception is the 10-second undo in BR-176, which reverses the whole operation including its revocations. |
| BR-186 | A file retains its previous versions for 90 days from the moment each was superseded, and always retains at least the 3 most recent versions regardless of age. Version storage counts toward quota, and the version list states when the oldest retained version expires. |
| BR-187 | Every trash purge and every version expiry writes an activity entry naming the item, its path, its size and the job that performed it, so that no disappearance is unexplained. |
| BR-188 | Deleting a room deletes its folders, files, trash contents, versions, grants and links. The activity log for the room is retained for the period in BR-195 and remains visible to the account holder, so that the record of who accessed what survives the room. |
| BR-189 | Only a principal the matrix authorises may delete, and a Contributor may delete only items it created (BR-016). Authorship is evaluated per item across the whole subtree, so a Contributor's cascade delete is refused if the subtree contains an item created by anyone else, naming that item. |
| BR-190 | An account deletion request enters a 30-day retention window during which the account is signed out everywhere, every share is revoked, every room becomes inaccessible to every principal, and no data is destroyed. |
| BR-191 | On entering the retention window, every principal holding a grant on any room of the account is notified that their access has ended. The notification names the room and the account holder's email address and nothing else. |
| BR-192 | Content the account holder created inside another account's room is not deleted by their account deletion. Its authorship is replaced with a tombstone identity, and the activity log entries recording their actions are retained with the tombstone. |
| BR-193 | The account holder may cancel a deletion request at any moment inside the retention window. Cancellation restores the account and its rooms, and does not reinstate any revoked grant (BR-185). |
| BR-194 | At the end of the retention window the account, its rooms and its content are permanently deleted. Encrypted backups are rotated out within a further 35 days, which is the backup horizon; after that, no copy exists. |
| BR-195 | **Activity-log retention is 24 months by default, and is administrator-configurable.** Entries are retained for 24 months from the event, independently of the lifetime of the item they refer to. An administrator may set a different period per account under BR-044, within a floor of 6 months and a ceiling of 84 months; the period is never derived from anything else, and a change to it is itself written to the activity log with the old and new values and applies only to entries created after the change. The period in force is stated in the interface wherever the log is shown, and in the export produced by the log export path. |
| BR-237 | **Provisioning and deprovisioning.** An administrator may provision a staff account and may deprovision one (the joiner and leaver flows). Deprovisioning, in one atomic operation: signs the account out everywhere with the full semantics of BR-108; invalidates every credential, passkey and refresh chain on the account; and marks the identity retired so it cannot authenticate again. Deprovisioning does not delete content and does not by itself revoke the grants the account issued to others, because the documents an external recipient is mid-review on do not stop mattering when a colleague leaves. Because BR-013 requires every room to have exactly one Owner, deprovisioning is refused until every room the account owns has been either transferred to a named colleague or archived; the refusal enumerates those rooms. An administrator may initiate that transfer on the leaver's behalf without the leaver's acceptance, which is the single documented exception to the acceptance requirement in BR-029, and the transferee must still accept. Every step is written to the activity log with the administrator as the actor. |

**BR-172 decision rationale.** The brief asks to "warn the user what will be deleted". Naming the
active-share count alongside the item counts is an addition, and it is the number the person holding
the phone actually needs: losing 47 files they can restore from trash is an inconvenience, while
silently cutting off two external recipients mid-review is a business event. It is placed in the same
warning because a phone gives no second chance to notice.

**BR-176 plus BR-177 decision rationale, two safety nets rather than one.** A 10-second undo handles
the mis-tap, which is the dominant failure mode on touch, and it does so without making the user
find a trash screen. A 30-day trash handles the changed mind. Neither substitutes for the other:
undo alone loses data to a delayed realisation, trash alone makes the common case a five-tap
recovery.

**BR-181 decision rationale.** The alternative to recreating the ancestor chain is to restore into
the room root as a flat item, which loses the context that made the file findable. Recreating the
path under a clearly named `Restored items` folder keeps the structure while making it obvious that
something unusual happened, and stating the destination before commit means the user is never
surprised by where their file went.

**BR-185 decision rationale.** Silently reinstating an external recipient's access when a folder is
restored, possibly months later, is the worst leak this product could produce, and it would be
invisible: nobody audits the shares on a folder they just restored. Requiring an explicit re-grant is
friction in a rare operation, in exchange for removing an entire class of silent disclosure.

**BR-237 decision rationale.** The leaver flow is where an internal tool leaks. The tempting
implementation deletes the departing colleague's account and everything in it, which destroys rooms
other people are working in and cuts off recipients mid-review; the other tempting implementation
leaves the account live "until someone gets round to it", which leaves a credential and an Owner
seat belonging to a person who no longer works here. Refusing deprovisioning until ownership is
resolved forces the decision to be made once, by a named administrator, at the moment the
information is still available. Note what deprovisioning deliberately does not do: it does not
revoke the grants the leaver issued, because that would silently break every outward share they had
set up. Withdrawing those is the new Owner's decision, and BR-118's counts are what makes it an
informed one.

---

## Quota rules

| ID | Rule |
| --- | --- |
| BR-196 | Storage warnings fire when usage crosses **75 percent, 90 percent and 100 percent** of the applicable quota (BR-199), each once per crossing, in the interface and by email to the account holder and to the administrator. Each warning states the exact remaining allowance in the same units as the quota and names which ceiling — room, team or account — is being approached. These three thresholds are unchanged by anything else in the model and are the only storage warning thresholds in the document set. |
| BR-197 | Quota is consumed by: committed file bytes of the current version of every file; committed file bytes of every retained previous version; committed file bytes of every item in trash. |
| BR-198 | Quota is not consumed by: folder records, thumbnails, server-rendered preview pages, search indexes, activity log entries, or any other platform-generated derivative. Reason: a user must never have quota charged against them for storage they cannot see, delete or control. |
| BR-199 | **The quota is set by an administrator, and by nothing else.** Two ceilings exist, both set under BR-044: an **account-level ceiling, default 1 TiB**, and an **optional per-room ceiling, unset by default**, so that by default a room is bounded only by the account ceiling and one room may consume all of it. An administrator may additionally set a **team-level ceiling**, which applies to the accounts in that team as a shared account-level ceiling. Where more than one ceiling applies, the lowest governs, and any operation that would increase stored bytes is refused if it would breach any of them, naming the one it breached. Per-room and per-team figures are otherwise reporting only (FR-ACCT-005). No quota is ever derived from a purchase, a head count, a room count or any other computed value: an administrator sets it, the activity log records the change, and that is the whole mechanism. |
| BR-200 | The used-storage figure, per account and per room, is recomputed within **10 seconds** of an upload completing or a permanent deletion committing. A client may display a figure cached for up to **60 seconds** — the freshness window cited by FR-PERF-025 — and must state when the figure it is showing was computed; the authoritative figure behind it is never more than 10 seconds stale. The two numbers are not in conflict: 10 seconds bounds the server's recomputation, 60 seconds bounds how long a client may show an old answer. |
| BR-201 | An upload is refused at initiation, before any byte is accepted, when the declared size would take the account, team or room over its applicable quota (BR-199). The refusal states the file size, the remaining allowance, the shortfall, which ceiling was breached, and offers two actions: free space, or request an increase from the administrator named on the account. |
| BR-202 | Every upload must declare its total size at initiation, and the server reserves that amount against the quota for the lifetime of the upload session. An abandoned upload's reservation is released when its parts are cleaned up per BR-210. |
| BR-203 | An upload whose actual received bytes exceed its declared size is aborted immediately, its uploaded parts are discarded, no item appears in the destination folder, its reservation is released, and the abort is reported to the client with the reason. |
| BR-204 | At or over quota, the account retains full authority to list, search, preview, download, share, revoke, rename, move, delete and export. Only operations that increase stored bytes are refused: upload, copy, replace-as-new-version and room duplication. |
| BR-205 | The system never silently truncates, downsamples, compresses, discards or partially commits a file because of a quota condition. Either the whole file is stored or the operation is refused with an explanation. |
| BR-206 | **A quota reduction never destroys data.** Where an administrator lowers a ceiling below current usage, the affected scope enters a read-only state for a **30-day grace period**, during which nothing is deleted by the system, the account holder and the room Owners are notified with the shortfall and the deadline, and every read, share, revoke, delete and export path stays open. At the end of the grace period the scope remains read-only indefinitely until the condition is resolved, either by the administrator raising the ceiling again or by a principal deleting content. **The system never deletes anyone's content to enforce a quota, at any point, in any state.** |
| BR-207 | *Withdrawn.* See the tombstone note at the end of this section. |
| BR-208 | The confirmed resume offset of an in-progress upload is committed to durable local storage before each chunk is transmitted, never after. Reason: the page may be frozen or discarded at any moment, and `unload` does not fire when a tab is closed from a mobile tab switcher, so a post-transmission write is a write that may never happen. |
| BR-209 | Upload chunk size is between 256 KiB and 8 MiB, is a multiple of 256 KiB, defaults to 1 MiB on a connection the client reports as cellular or slow and 8 MiB on an unmetered fast connection, and adapts within those bounds based on observed throughput and failure rate. Only one chunk is held in memory at a time. |
| BR-210 | Upload parts belonging to a session with no activity for 24 hours are deleted by a scheduled job, their quota reservation is released, and the abandonment is recorded so that the client can present the upload as expired rather than as still resumable. |

**BR-198 decision rationale.** Counting thumbnails and rendered pages toward quota would be
defensible as a cost-recovery measure and is rejected because it is user-hostile and unexplainable:
the figure would move without the user doing anything, and there would be no action they could take
to reduce it. Platform derivatives are the platform's cost.

**BR-204 and BR-206 decision rationale.** The tempting behaviour at the limit is to lock the whole
account until someone fixes it. That would mean a colleague at their quota cannot revoke a share,
which turns a storage-governance event into a confidentiality breach. Revocation and deletion are
therefore always available, in every degraded state, without exception. Likewise the system never
deletes content to enforce a limit: a data room's whole value is that the documents are still there,
and an internal tool that silently trims a colleague's room to fit a number an administrator typed
is a tool nobody will trust with the only copy of anything.

**BR-209 decision rationale.** The 256 KiB floor and the multiple-of-256 KiB constraint exist to
stay compatible with the resumable-upload semantics of the major object stores, whose per-part
minimums and alignment requirements are stricter than a purely client-side design would need. The 1
MiB cellular default is deliberately below those stores' recommended part sizes, because the
quantity being minimised on a phone is radio work at risk per interruption, not throughput.

**Withdrawn in the internal-tool rework.**

| Withdrawn ID | Reason |
| --- | --- |
| BR-207 | Payment-retry schedule and payment-failure read-only. There is no payment in an internal tool, so the rule has no subject. Nothing replaces it: the only routes into a read-only state are now an administrator setting it, a quota reduction under BR-206, and suspension for abuse under BR-229, all enumerated in BR-129. The number is retired, not reused (see the note under the rule index). |

Everything else in this section survives unchanged in substance. The warning thresholds (BR-196), the
hard-stop-at-the-limit behaviour (BR-201, BR-204), the never-silently-drop-data guarantee (BR-205)
and the never-delete-to-enforce guarantee (BR-206) are all intentionally preserved word for word in
effect; only the source of the number moved, from a purchased plan to an administrator (BR-199).

---

## Rate limits and abuse rules

| ID | Rule |
| --- | --- |
| BR-211 | Every limit below is enforced server-side, is applied per the stated key, returns HTTP 429 with a `Retry-After` header on rejection, and is recorded as an event. Limits are ceilings, not targets, and each is configurable by an administrator (BR-231) without a code change. |
| BR-212 | Sign-in: 5 attempts per minute per source address and 10 per hour per account. On the sixth consecutive failure for one account, a lockout begins at 30 seconds and doubles on each subsequent failure to a ceiling of 15 minutes, resetting on a successful sign-in or a completed password reset. The remaining time is returned so the interface can show a live countdown. |
| BR-213 | Magic-link, password-reset and invitation-resend requests: 3 per 15 minutes per email address and 20 per hour per source address, with the identical-response rule of BR-054 applied to the rejection as well as to the acceptance. |
| BR-214 | Public-link password attempts: **10 failed attempts per link per source address per 15 minutes**, then the 15-minute lock on that link-and-address pair defined by BR-089. This restates BR-089 and introduces no second number. Also 60 failed attempts per hour per source address across all tokens, to bound credential-stuffing across many links. |
| BR-215 | Anonymous link resolution: 300 requests per hour per token per source address, and 60 invalid-token attempts per hour per source address, after which further attempts from that source receive the same indistinguishable response with an increasing delay (BR-058). |
| BR-216 | Share creation: 50 per hour per room and 200 per day per account, counting grants and public links together. |
| BR-217 | Outbound invitation and notification email: 100 recipients per day per account, and no more than 3 emails to the same recipient address per room per day. |
| BR-218 | Upload initiation: 600 per hour per account and 60 concurrent upload sessions per account. |
| BR-219 | Bulk operations: at most 500 items per move, copy, delete, restore or share request, and at most 2,000 items per bulk download archive. A request above the cap is refused with the cap stated, and the interface splits the operation rather than failing it. |
| BR-220 | Search: 60 queries per minute per principal, which accommodates type-ahead at the debounce interval in FR-SRCH-005 with headroom. |
| BR-221 | General API: 1,000 requests per minute per authenticated principal and 300 per minute per anonymous session, excluding content byte ranges, which are governed by BR-104 and BR-228. |
| BR-222 | Every 429 response carries a `Retry-After` in seconds, a stable machine-readable code identifying which limit was hit, and a message safe to display verbatim. The interface presents a wait, not a failure, and retries automatically once with jitter where the operation is idempotent. |
| BR-223 | Rate-limit responses obey BR-053: the limit, the counter and the `Retry-After` are identical for existing and non-existing targets, so a limit cannot be used as an existence oracle. |
| BR-224 | Activity-log export: 10 exports per day per account and 1 concurrent export job per account. Exceeding it states the limit and the time the next export becomes available. |
| BR-225 | Every uploaded file is scanned for malware before its first preview or download is served. Until the scan completes the item is listed with a pending state, is previewable only to the uploading principal, and is downloadable by nobody. |
| BR-226 | A file that fails the scan is quarantined: it is retained, is listed to the Owner and Managers with an explicit quarantined state, is never previewable or downloadable by any principal, and every public link resolving to it returns the unavailable page of BR-099. The Owner and the uploader are notified. |
| BR-227 | Every public link page carries an abuse-report affordance that requires no account and no email address, and a report suspends byte delivery for that link pending review while preserving the underlying content and the room's own access. |
| BR-228 | **Egress anomaly threshold, with explicit defaults.** Byte delivery through one link is suspended when any of the following is reached, whichever comes first: **500 file downloads through one link in 1 hour**; **200 distinct source addresses presenting one token in 1 hour**; or **egress exceeding 5 times that link's trailing 7-day median hourly egress**, with the multiplier applied only once the link has at least 7 days of history and the 25 GiB ceiling of BR-104 governing in the meantime. Each figure is a default an administrator may change per data room under BR-231, and none is derived from anything else. On suspension the system notifies the Owner and every Manager on the scope with the observed pattern and the threshold that was crossed, and requires an explicit action to resume. Previews continue to be served throughout, and the suspended byte path returns the same refusal as BR-090 so that the threshold is not an existence oracle. |
| BR-229 | An account confirmed to be distributing malware or conducting phishing is suspended: every share is revoked, every link returns the unavailable page, and the account holder retains sign-in and export authority so that legitimate data is never destroyed by an enforcement action. |
| BR-230 | Limits are calibrated against the reference device and reference network so that ordinary use on a slow connection with retries never reaches a ceiling. Any limit that a legitimate session can reach is a defect, and every 429 served to a first-party client is recorded with its route so that this can be measured rather than assumed. |
| BR-231 | **Every numeric limit here is an administrator-set configuration value, and the figures stated in each rule are its defaults.** This applies to every limit in this section and to the egress ceiling in BR-104 and the anomaly thresholds in BR-228, so those three rules and this one agree by construction: BR-104 defaults to 25 GiB per link per rolling 24 hours, BR-228 defaults to 500 downloads or 200 distinct addresses per hour or 5 times the trailing median, and each limit below defaults to the figure written in its own rule. An administrator may raise or lower any of them per data room, and per team where a team is configured, under BR-044; no limit is derived from a purchase, a role, a head count or any other computed value. Every change is written to the activity log with the old and new values and the actor, and takes effect without a deployment. Where an administrator sets no value, the default in the rule is in force — there is no unset state and no code path that computes a limit. |
| BR-232 | Every rejection by a limit in this section is written to the activity log or the security event log, whichever applies, so that a limit that is tripping in production is visible without adding instrumentation. |
| BR-236 | **Account-level count ceilings, referenced by the BR-124 check table.** Rooms per account: **200** by default. Concurrently active invited guests per room: **500** by default. Both are administrator-set under BR-231 with those figures as the defaults, both are checked in the `Q` column of BR-124, and neither is derived from anything else. Reaching either returns a typed refusal that states the ceiling, the current count and the administrator to ask, and never silently drops the request. |

**BR-229 decision rationale.** Suspending a compromised or abusive account while leaving its holder
able to sign in and export looks lenient. It is deliberate: enforcement mistakes happen, and a
suspension that destroys the company's only copy of a set of documents is not recoverable by an
apology. Revoking every share stops the harm immediately, which is the part that is urgent.

**BR-231 and BR-236 decision rationale.** Every one of these numbers used to be attached to a
purchased plan, which meant the answer to "why is this limit 200?" was commercial rather than
technical. Attaching them to an administrator with a written default is strictly better for an
internal tool: the default is the engineering judgement, the override is the operational escape
hatch, and the activity-log entry is the record of who changed it and when. What must not happen is
a limit with no stated default, because that is how a check ends up pointing at a value nobody
owns — which is exactly the defect BR-104 and BR-228 carried before this pass.

**BR-230 decision rationale.** Stating "any limit a legitimate session can reach is a defect" turns
rate limiting from a guess into something measurable. Without it, limits get tightened after every
incident and the product slowly becomes unusable on exactly the slow connections it claims to serve.

---

## Rule index by concern

| Concern | Rules |
| --- | --- |
| Principals and scopes | BR-001 to BR-012 |
| Roles | BR-013 to BR-017 |
| Identity, credentials, verification | BR-018 to BR-024 |
| Flags, role assignment, ownership | BR-025 to BR-030 |
| Permission matrix and cross-cutting authority | BR-031 to BR-045 |
| Visibility and anti-enumeration | BR-046 to BR-060, **BR-233** (the 403-versus-404 rule), **BR-234** (what a dead link may disclose) |
| Inheritance and override | BR-061 to BR-080 |
| Public links | BR-081 to BR-105 |
| Revocation | BR-106 to BR-120, **BR-235** (revoke authority) |
| Read-only enforcement | BR-121 to BR-135 |
| Naming, normalisation, limits, conflicts | BR-136 to BR-171 |
| Deletion, trash, retention | BR-172 to BR-195, **BR-237** (provisioning and deprovisioning) |
| Quota | BR-196 to BR-210, of which BR-207 is withdrawn |
| Rate limits and abuse | BR-211 to BR-232, **BR-236** (account-level count ceilings) |

Total: 237 numbered rules, of which 1 is withdrawn (BR-207), leaving 236 in force. The numbering is
stable. A retired rule keeps its number and is marked withdrawn with the reason and, where one
exists, the rule that replaced it; a number is never reused. Rules added in the internal-tool and
audit rework are BR-233 to BR-237.

### The single values this document owns

Quoted here in one place so that no other document has to guess. Cite the ID, not the number.

| Value | Figure | Rule |
| --- | --- | --- |
| Access credential lifetime | 5 minutes | BR-023 |
| Refresh credential lifetime | 90 days, rotated on every use | BR-023 |
| Share-token entropy | 160 bits | BR-055, BR-082 |
| Signed content URL lifetime | 60 seconds | BR-110 |
| Revocation propagation | 5 s at p95, 60 s absolute | BR-108 |
| Streamed download cut after revocation | at the next range boundary, never more than 30 seconds | BR-111 |
| Loaded-page grant re-check interval | 30 seconds | BR-112 |
| Public-link password attempts | 10 failed per link per source address per 15 minutes, then a 15-minute lock on that pair | BR-089, BR-214 |
| Undo window | 10 seconds | BR-176 |
| Trash retention | 30 days | BR-177 |
| Version retention | 90 days, and always the 3 most recent | BR-186 |
| Activity-log retention | 24 months, administrator-configurable | BR-195 |
| Name length limit | 255 UTF-8 bytes, warned in graphemes | BR-158, BR-161 |
| Total path length limit | 4,096 UTF-8 bytes | BR-159 |
| Nesting depth limit | 32 levels below the room root | BR-160 |
| Conflict resolutions offered | exactly 3: keep both, replace as a new version, cancel this item | BR-151 |
| Queueable offline mutation kinds | exactly 3: upload, rename, delete-to-trash | BR-130 |
| Storage warning thresholds | 75, 90, 100 percent | BR-196 |
| Storage quota | administrator-set; 1 TiB account default, per-room ceiling unset by default | BR-199 |
| Per-link egress ceiling | 25 GiB per rolling 24 hours (default) | BR-104 |
| Account deletion retention window | 30 days, plus a 35-day backup horizon | BR-190, BR-194 |

Six further thresholds are carried inline by the requirements that use them, because each is local to
one requirement rather than to a rule. They are recorded here so that this document remains the one
place to check a number, and they are cited by requirement ID rather than by BR ID.

| Value | Figure | Carried by |
| --- | --- | --- |
| Row-virtualisation engagement point | above 100 rows | FR-PERF-004 |
| Server-side render threshold for a document preview | 25 MB | FR-VIEW-016 |
| Retention of a reading resume position | 90 days | FR-VIEW-024 |
| Conflict-detection staleness window | 60 seconds | FR-CONF-019 |
| Storage-usage display freshness window | 60 seconds | FR-PERF-025, consistent with BR-200 |
| Notification delivery, p95 | 30 seconds | FR-AUDIT-022 |

## Rules that carry a service-level target

These are the rules whose correctness is a measured production figure rather than a passing test.
Each has a corresponding non-functional requirement in
[07-non-functional-requirements.md](./07-non-functional-requirements.md).

| Rule | Target | Measured as |
| --- | --- | --- |
| BR-108 | Revocation refused within 5 s at p95, 60 s absolute | Synthetic revoke-then-probe canary, every minute, per region |
| BR-110 | Signed content URL lifetime at most 60 s | Assertion in CI plus an audit of issued URLs |
| BR-111 | In-progress download cut within 30 s of revocation | Synthetic canary that starts a large ranged download, revokes, and measures time to refusal |
| BR-112 | Loaded-page access loss within the 30 s re-check interval | Synthetic canary with an open idle session |
| BR-200 | Used-storage figure current within 10 s | Sampled comparison of the reported figure against a recomputation |
| BR-225 | Scan completed before first serve | Percentage of items served with a pending scan, target zero |
| BR-230 | No legitimate session reaches a limit | Count of 429 responses to first-party clients, per route, target zero |
| BR-233 | No 403 reaches a principal without a grant on the target | Continuous assertion over production refusal responses, counted per route, target zero; plus a route-coverage test asserting 404 for every verb with no grant |
