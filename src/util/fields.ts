export const JIRA_DEFAULT_FIELDS = ["summary", "status", "assignee", "priority", "updated"] as const;

export function projectFields(fields?: string[]): string[] {
  return fields?.length ? fields : [...JIRA_DEFAULT_FIELDS];
}
