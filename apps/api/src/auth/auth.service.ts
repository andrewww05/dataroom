import { randomBytes } from 'node:crypto';

import type { AuthResponse, AuthUser, DataRoom } from '@dataroom/shared';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';

import { InvalidCredentialsException, UnauthenticatedException } from '../http/api.exception';
import { PrismaService } from '../prisma/prisma.service';
import { normalizeEmail } from './email';

/** What both endpoints take. The DTOs that validate it belong to the controller. */
interface Credentials {
  email: string;
  password: string;
}

/** `DataRoom.name` is `VarChar(255)`; see FR-ROOM-010. */
const NAME_MAX = 255;
const NAME_SUFFIX = "'s Data Room";

/**
 * FR-ROOM-010's default: `<local part>'s Data Room`.
 *
 * The local part gives way when the column is too short, never the suffix — truncating the whole
 * string would leave a long address named `aaaa…aaa` with no `'s Data Room` on the end at all.
 */
export function dataRoomNameFor(email: string): string {
  const local = email.slice(0, email.indexOf('@'));

  return local.slice(0, NAME_MAX - NAME_SUFFIX.length) + NAME_SUFFIX;
}

/** The one row shape this service reads. `passwordHash` never leaves the methods below. */
const ACCOUNT_SELECT = {
  id: true,
  email: true,
  passwordHash: true,
  dataRooms: {
    // The model allows several rooms; the app creates exactly one (FR-ROOM-020). Oldest-first
    // keeps this deterministic if that ever changes.
    take: 1,
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      name: true,
      // The room's root is its one parentless node — `DataRoom` carries no `rootId` column, and
      // the `node_single_root` index is what makes this exactly one row.
      nodes: { where: { parentId: null }, select: { id: true }, take: 1 },
    },
  },
} as const;

interface Account {
  id: string;
  email: string;
  passwordHash: string;
  dataRooms: { id: string; name: string; nodes: { id: string }[] }[];
}

@Injectable()
export class AuthService implements OnModuleInit {
  /**
   * A hash of a value nobody knows, including this process after boot. An unknown email is
   * verified against it so a missing account costs the same work as a wrong password.
   */
  private decoyHash = '';

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.decoyHash = await argon2.hash(randomBytes(32).toString('base64'));
  }

  /**
   * FR-AUTH-010 and FR-AUTH-050: the user, their Data Room and that room's root folder in one
   * transaction, so a partial account is never reachable (BR-060).
   *
   * A `P2002` on `User.email` — from a second sign-up or from two racing ones — leaves nothing
   * behind and reaches the client as `409 EMAIL_TAKEN` through the exception filter.
   */
  async signUp(credentials: Credentials): Promise<AuthResponse> {
    const email = normalizeEmail(credentials.email);
    const name = dataRoomNameFor(email);
    const passwordHash = await argon2.hash(credentials.password);

    const created = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({ data: { email, passwordHash } });
      const dataRoom = await tx.dataRoom.create({ data: { ownerId: user.id, name } });
      // The root carries the room's name for want of anything better; nothing displays it, so the
      // rename endpoint can land later without touching this row. Never named "Root".
      const root = await tx.node.create({
        data: { dataRoomId: dataRoom.id, parentId: null, type: 'FOLDER', name },
      });

      return { user, dataRoom, root };
    });

    return this.issue(
      { id: created.user.id, email: created.user.email },
      { id: created.dataRoom.id, name: created.dataRoom.name, rootId: created.root.id },
    );
  }

  /**
   * FR-AUTH-020. A wrong password and an unknown email throw the same exception with the same
   * message, so the two responses are byte-identical and neither discloses which accounts exist.
   */
  async signIn(credentials: Credentials): Promise<AuthResponse> {
    const account = await this.findAccount({ email: normalizeEmail(credentials.email) });

    if (!account) {
      await argon2.verify(this.decoyHash, credentials.password);
      throw new InvalidCredentialsException();
    }

    if (!(await argon2.verify(account.passwordHash, credentials.password))) {
      throw new InvalidCredentialsException();
    }

    return this.issue({ id: account.id, email: account.email }, this.roomOf(account));
  }

  /**
   * The one place a token's `sub` is resolved to a row. A token outlives its user until it
   * expires, so a deleted account is refused here rather than answered (FR-AUTH-030).
   */
  async me(principal: { userId: string }): Promise<AuthUser & { dataRoom: DataRoom }> {
    const account = await this.findAccount({ id: principal.userId });

    if (!account) throw new UnauthenticatedException();

    return { id: account.id, email: account.email, dataRoom: this.roomOf(account) };
  }

  private async issue(user: AuthUser, dataRoom: DataRoom): Promise<AuthResponse> {
    // `expiresIn` comes from JWT_EXPIRES_IN via JwtModule; there is no refresh token.
    const token = await this.jwt.signAsync({ sub: user.id, email: user.email });

    return { token, user, dataRoom };
  }

  private findAccount(where: { id: string } | { email: string }): Promise<Account | null> {
    return this.prisma.user.findUnique({ where, select: ACCOUNT_SELECT });
  }

  /**
   * A signed-up account always has both rows — that is what the transaction buys — so their
   * absence is a broken invariant rather than a state a caller can produce, and it belongs in the
   * log as an unmapped `500` rather than in a message a client could act on.
   */
  private roomOf(account: Account): DataRoom {
    const room = account.dataRooms[0];
    const root = room?.nodes[0];

    if (!room || !root) {
      throw new Error(`User ${account.id} has no Data Room with a root node`);
    }

    return { id: room.id, name: room.name, rootId: root.id };
  }
}
