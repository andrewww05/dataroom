/**
 * The auth contract both sides import, so neither redeclares it. See docs/03 § API for the
 * endpoints these shapes belong to.
 */

export interface AuthUser {
  id: string;
  email: string;
}

/**
 * A Data Room as the client needs it: the room plus the id of its root folder, so the shell can
 * open `/` without a second request (FR-NAV-020). The room's root is the one node in it with no
 * parent — `DataRoom` carries no `rootId` column (docs/03 § Prisma).
 */
export interface DataRoom {
  id: string;
  name: string;
  rootId: string;
}

/** What sign-up and sign-in both answer with. */
export interface AuthResponse {
  token: string;
  user: AuthUser;
  dataRoom: DataRoom;
}

/**
 * The one envelope every failure arrives in (BR-050). `code` is what the client switches on,
 * `message` is what a toast shows, and `details` is present only when a payload was rejected
 * field by field.
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}
