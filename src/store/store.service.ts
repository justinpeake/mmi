import { Injectable } from '@nestjs/common';
import {
  User,
  Org,
  Client,
  Connection,
  ConnectionUpdate,
  UserType,
  ConnectionStatus,
} from '../common/types';

@Injectable()
export class StoreService {
  private users: Map<string, User> = new Map();
  private orgs: Map<string, Org> = new Map();
  private clients: Map<string, Client> = new Map();
  private connections: Map<string, Connection> = new Map();
  private connectionUpdates: Map<string, ConnectionUpdate> = new Map();

  /** Token (opaque string) -> userId. For auth. */
  private tokenToUserId: Map<string, string> = new Map();

  constructor() {
    this.seed();
  }

  private uuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  private seed(): void {
    const now = new Date().toISOString();

    // 1) Superadmin (MMI team) – no org
    const superadmin: User = {
      id: this.uuid(),
      username: 'superadmin@mmi.org',
      userType: 'superadmin',
      orgId: null,
      displayName: 'MMI Admin',
      createdAt: now,
    };
    this.users.set(superadmin.id, superadmin);

    // 2) One test org — all clients and community helpers belong to this org
    const orgId = this.uuid();
    const org: Org = {
      id: orgId,
      name: 'TestOrg',
      mainContactName: 'Jane Doe',
      mainContactEmail: 'jane@testorg.org',
      createdAt: now,
    };
    this.orgs.set(org.id, org);

    // 3) Org admin for that org
    const orgadmin: User = {
      id: this.uuid(),
      username: 'orgadmin@testorg.org',
      userType: 'orgadmin',
      orgId,
      displayName: 'Org Admin',
      createdAt: now,
    };
    this.users.set(orgadmin.id, orgadmin);

    // 4a) Second org (so we can have a helper in multiple orgs)
    const org2Id = this.uuid();
    const org2: Org = {
      id: org2Id,
      name: 'OtherOrg',
      mainContactName: 'Other Contact',
      mainContactEmail: 'other@example.org',
      createdAt: now,
    };
    this.orgs.set(org2.id, org2);

    // 4b) Two service providers: helper1 in both orgs, helper2 in TestOrg only
    const helper1: User = {
      id: this.uuid(),
      username: 'sarah.martinez@example.com',
      userType: 'serviceprovider',
      orgId,
      orgIds: [orgId, org2Id],
      displayName: 'Sarah Martinez',
      bio: 'Mentors clients on employment, housing, and life skills.',
      needs: ['Employment', 'Housing', 'Life skills'],
      createdAt: now,
    };
    const helper2: User = {
      id: this.uuid(),
      username: 'james.wilson@example.com',
      userType: 'serviceprovider',
      orgId,
      displayName: 'James Wilson',
      bio: 'Mentors on job readiness and workplace skills.',
      needs: ['Employment', 'Life skills'],
      createdAt: now,
    };
    this.users.set(helper1.id, helper1);
    this.users.set(helper2.id, helper2);

    // 5) Sample clients for that org
    const client1: Client = {
      id: this.uuid(),
      orgId,
      name: 'Margaret Thompson',
      age: '34 years old',
      bio: 'Seeking a mentor for employment readiness, housing, and accountability.',
      needs: ['Employment', 'Housing', 'Life skills'],
      createdAt: now,
    };
    const client2: Client = {
      id: this.uuid(),
      orgId,
      name: 'Robert Chen',
      age: '28 years old',
      bio: 'Looking for a mentor to support job readiness and stable housing.',
      needs: ['Employment', 'Housing'],
      createdAt: now,
    };
    const client3: Client = {
      id: this.uuid(),
      orgId,
      name: 'Patricia Davis',
      age: '41 years old',
      bio: 'Seeking mentorship for life skills and planning.',
      needs: ['Life skills', 'Accountability'],
      createdAt: now,
    };
    this.clients.set(client1.id, client1);
    this.clients.set(client2.id, client2);
    this.clients.set(client3.id, client3);

    // 6) One connection: Margaret <-> Sarah (active, so it was "accepted" before)
    const conn1: Connection = {
      id: this.uuid(),
      orgId,
      clientId: client1.id,
      helperId: helper1.id,
      status: 'active',
      createdById: orgadmin.id,
      createdAt: now,
      acceptedAt: now,
    };
    this.connections.set(conn1.id, conn1);

    // 7) One pending connection: Robert -> Sarah (pending accept/decline)
    const conn2: Connection = {
      id: this.uuid(),
      orgId,
      clientId: client2.id,
      helperId: helper1.id,
      status: 'pending',
      createdById: orgadmin.id,
      createdAt: now,
    };
    this.connections.set(conn2.id, conn2);
  }

  // ---------- Auth (tokens) ----------
  createToken(userId: string): string {
    const token = this.uuid();
    this.tokenToUserId.set(token, userId);
    return token;
  }

  getUserIdByToken(token: string): string | null {
    return this.tokenToUserId.get(token) ?? null;
  }

  removeToken(token: string): void {
    this.tokenToUserId.delete(token);
  }

  // ---------- Users ----------
  findUserByUsername(username: string): User | null {
    const normalized = username.trim().toLowerCase();
    for (const u of this.users.values()) {
      if (u.username.toLowerCase() === normalized) return u;
    }
    return null;
  }

  getUserById(id: string): User | null {
    return this.users.get(id) ?? null;
  }

  getUsersByOrgId(orgId: string): User[] {
    return Array.from(this.users.values()).filter((u) => {
      if (u.orgIds && u.orgIds.length) return u.orgIds.includes(orgId);
      return u.orgId === orgId;
    });
  }

  addUser(user: Omit<User, 'id' | 'createdAt'>): User {
    const id = this.uuid();
    const created: User = {
      ...user,
      id,
      createdAt: new Date().toISOString(),
    };
    this.users.set(id, created);
    return created;
  }

  updateUser(id: string, patch: Partial<Pick<User, 'displayName' | 'bio' | 'needs'>>): User | null {
    const u = this.users.get(id);
    if (!u) return null;
    const updated = { ...u, ...patch };
    this.users.set(id, updated);
    return updated;
  }

  // ---------- Orgs ----------
  getAllOrgs(): Org[] {
    return Array.from(this.orgs.values());
  }

  getOrgById(id: string): Org | null {
    return this.orgs.get(id) ?? null;
  }

  addOrg(org: Omit<Org, 'id' | 'createdAt'>): Org {
    const id = this.uuid();
    const created: Org = {
      ...org,
      id,
      createdAt: new Date().toISOString(),
    };
    this.orgs.set(id, created);
    return created;
  }

  updateOrg(id: string, patch: Partial<Pick<Org, 'name' | 'mainContactName' | 'mainContactEmail'>>): Org | null {
    const o = this.orgs.get(id);
    if (!o) return null;
    const updated = { ...o, ...patch };
    this.orgs.set(id, updated);
    return updated;
  }

  // ---------- Clients ----------
  getClientsByOrgId(orgId: string): Client[] {
    return Array.from(this.clients.values()).filter((c) => c.orgId === orgId);
  }

  getClientById(id: string): Client | null {
    return this.clients.get(id) ?? null;
  }

  addClient(client: Omit<Client, 'id' | 'createdAt'>): Client {
    const id = this.uuid();
    const created: Client = {
      ...client,
      id,
      createdAt: new Date().toISOString(),
    };
    this.clients.set(id, created);
    return created;
  }

  updateClient(id: string, patch: Partial<Omit<Client, 'id' | 'orgId' | 'createdAt'>>): Client | null {
    const c = this.clients.get(id);
    if (!c) return null;
    const updated = { ...c, ...patch };
    this.clients.set(id, updated);
    return updated;
  }

  deleteClient(id: string): boolean {
    return this.clients.delete(id);
  }

  // ---------- Connections ----------
  getConnectionsByOrgId(orgId: string): Connection[] {
    return Array.from(this.connections.values()).filter((c) => c.orgId === orgId);
  }

  getConnectionsByHelperId(helperId: string): Connection[] {
    return Array.from(this.connections.values()).filter((c) => c.helperId === helperId);
  }

  getConnectionById(id: string): Connection | null {
    return this.connections.get(id) ?? null;
  }

  addConnection(
    conn: Omit<Connection, 'id' | 'createdAt' | 'status'> & { status?: ConnectionStatus },
  ): Connection {
    const id = this.uuid();
    const created: Connection = {
      ...conn,
      id,
      status: conn.status ?? 'pending',
      createdAt: new Date().toISOString(),
    };
    this.connections.set(id, created);
    return created;
  }

  updateConnection(
    id: string,
    patch: Partial<Pick<Connection, 'status' | 'acceptedAt' | 'declinedAt'>>,
  ): Connection | null {
    const c = this.connections.get(id);
    if (!c) return null;
    const updated = { ...c, ...patch };
    this.connections.set(id, updated);
    return updated;
  }

  // ---------- Connection updates (session/engagement) ----------
  getUpdatesByConnectionId(connectionId: string): ConnectionUpdate[] {
    return Array.from(this.connectionUpdates.values())
      .filter((u) => u.connectionId === connectionId)
      .sort((a, b) => new Date(b.eventTime).getTime() - new Date(a.eventTime).getTime());
  }

  addConnectionUpdate(update: Omit<ConnectionUpdate, 'id' | 'createdAt'>): ConnectionUpdate {
    const id = this.uuid();
    const created: ConnectionUpdate = {
      ...update,
      id,
      createdAt: new Date().toISOString(),
    };
    this.connectionUpdates.set(id, created);
    return created;
  }
}
