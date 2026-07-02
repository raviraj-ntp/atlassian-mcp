export function escapeJqlString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

export function jqlAssigneeCurrentUser(): string {
  return "assignee = currentUser() AND resolution = Unresolved ORDER BY updated DESC";
}
