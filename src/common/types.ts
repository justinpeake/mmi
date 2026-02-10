/**
 * Shared domain types for MMI (no Nest/DB coupling).
 */

export type UserType = 'superadmin' | 'orgadmin' | 'serviceprovider';

export type ConnectionStatus =
  | 'pending'   // awaiting helper accept/decline
  | 'active'
  | 'paused'
  | 'complete'
  | 'declined';

export interface User {
  id: string;
  username: string;
  userType: UserType;
  orgId: string | null;  // null for superadmin; primary/legacy single org
  orgIds?: string[];     // for serviceprovider: all orgs they belong to (when multiple)
  displayName: string;
  bio?: string;
  needs?: string[];      // for serviceprovider: "Can mentor in"
  createdAt: string;      // ISO
}

export interface Org {
  id: string;
  name: string;
  mainContactName: string;
  mainContactEmail: string;
  createdAt: string;
}

export interface Client {
  id: string;
  orgId: string;
  name: string;
  age?: string;
  bio?: string;
  needs?: string[];
  /** Extended fields (match current frontend) */
  address?: string;
  contact?: string;
  charge?: string;
  atiPlan?: string;
  story?: string;
  notes?: string;
  advocateContact?: string;
  createdAt: string;
}

export interface Connection {
  id: string;
  orgId: string;
  clientId: string;
  helperId: string;       // userId of serviceprovider
  status: ConnectionStatus;
  createdById: string;   // userId who created (orgadmin)
  createdAt: string;
  acceptedAt?: string;   // when helper accepted (if status active)
  declinedAt?: string;   // when helper declined
}

export type ConnectionUpdateMediaType = 'video' | 'image' | 'audio';

export interface ConnectionUpdateMediaItem {
  url: string;
  type: ConnectionUpdateMediaType;
}

export interface ConnectionUpdate {
  id: string;
  connectionId: string;
  eventName: string;
  eventTime: string;     // ISO
  notes?: string;
  media?: ConnectionUpdateMediaItem[];
  createdBy: string;     // helperId
  createdAt: string;     // ISO
}

/** Internal org-only rating of a serviceprovider. Helper never sees this. */
export interface HelperRating {
  id: string;
  orgId: string;
  helperId: string;       // userId of serviceprovider
  stars: number;          // 1-5
  notes?: string;        // optional internal notes
  createdById: string;    // userId who set (orgadmin/superadmin)
  createdAt: string;     // ISO
  updatedAt: string;     // ISO
}

/** For API responses: user without internal fields if needed */
export interface UserResponse {
  id: string;
  username: string;
  userType: UserType;
  orgId: string | null;
  orgIds?: string[];
  orgNames?: string[];   // resolved org names for display (e.g. badges)
  displayName: string;
  bio?: string;
  needs?: string[];
  /** Present only for serviceprovider when caller is orgadmin/superadmin; never exposed to helper */
  internalRating?: { stars: number; notes?: string };
}
