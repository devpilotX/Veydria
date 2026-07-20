/**
 * Role based access control. Roles are ordered from least to most powerful.
 * Clerk Organizations is the source of truth, so we map Clerk's org roles onto
 * ours. Enterprise SSO and SAML can be added in Clerk later without touching
 * this file, since it only cares about the resolved role string.
 */
export const ROLE_ORDER = ['viewer', 'member', 'admin', 'owner'] as const;

export type Role = (typeof ROLE_ORDER)[number];

export function roleRank(role: Role): number {
  return ROLE_ORDER.indexOf(role);
}

/** True when `role` is at least as powerful as `minimum`. */
export function hasAtLeast(role: Role, minimum: Role): boolean {
  return roleRank(role) >= roleRank(minimum);
}

/** Maps a Clerk organization role onto our role. Defaults to member. */
export function mapClerkRole(orgRole: string | null | undefined): Role {
  switch (orgRole) {
    case 'org:owner':
    case 'owner':
      return 'owner';
    case 'org:admin':
    case 'admin':
      return 'admin';
    case 'org:viewer':
    case 'viewer':
      return 'viewer';
    case 'org:member':
    case 'member':
    default:
      return 'member';
  }
}
