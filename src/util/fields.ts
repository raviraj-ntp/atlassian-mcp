/**
 * @raviraj87/atlassian-mcp · util/fields.ts
 * Jira field selection utilities.
 *
 * Copyright (c) 2026 Ravi Raj · MIT License · see LICENSE
 */

export const JIRA_DEFAULT_FIELDS = ["summary", "status", "assignee", "priority", "updated"] as const;

export function projectFields(fields?: string[]): string[] {
  return fields?.length ? fields : [...JIRA_DEFAULT_FIELDS];
}
