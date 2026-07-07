/**
 * @raviraj87/atlassian-mcp · util/jql.ts
 * JQL query building utilities.
 *
 * Copyright (c) 2026 Ravi Raj · MIT License · see LICENSE
 */

export function escapeJqlString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

export function jqlAssigneeCurrentUser(): string {
  return "assignee = currentUser() AND resolution = Unresolved ORDER BY updated DESC";
}
