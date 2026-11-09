export type Role = "finance" | "exec" | "member" | "none";
export type Action = "money.view" | "money.edit" | "money.approve" | "records.view" | "records.edit" | "self.use";

export function roleFrom(flags: { finance: boolean; exec: boolean; member: boolean }): Role {
  if (flags.finance) return "finance";
  if (flags.exec) return "exec";
  return flags.member ? "member" : "none";
}

const RANK: Record<Role, number> = { none: 0, member: 1, exec: 2, finance: 3 };
const NEEDS: Record<Action, Role> = {
  "self.use": "member",
  "records.view": "exec",
  "records.edit": "exec",
  "money.view": "exec",
  "money.edit": "finance",
  "money.approve": "finance"
};

/** What the screens show. The database enforces the same rules with row-level security; this only hides buttons. */
export const can = (role: Role, action: Action) => RANK[role] >= RANK[NEEDS[action]];
