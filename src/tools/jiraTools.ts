/**
 * @raviraj87/atlassian-mcp · tools/jiraTools.ts
 * Core MCP tools for Jira issues and search.
 *
 * Copyright (c) 2026 Ravi Raj · MIT License · see LICENSE
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ClientFactory } from "../clients/clientFactory.js";
import { connectionField, dryRunField, jsonResult, registerTool } from "./common.js";

export function registerJiraTools(server: McpServer, factory: ClientFactory): void {
  registerTool(server, "jira_list_connections", "List configured Atlassian connection names.", async () =>
    jsonResult({ default: factory.defaultConnection(), connections: factory.listConnections() }),
  );

  registerTool(server, "jira_who_am_i", "Get current Jira user.", { connection: connectionField }, async ({ connection }) =>
    jsonResult(await factory.requireJira(connection).whoAmI()),
  );

  registerTool(
    server,
    "jira_get_issue",
    "Get a Jira issue by key with optional field projection.",
    { connection: connectionField, issueKey: z.string(), fields: z.array(z.string()).optional() },
    async ({ connection, issueKey, fields }) =>
      jsonResult(await factory.requireJira(connection).getIssue(issueKey, fields)),
  );

  registerTool(
    server,
    "jira_search",
    "Search Jira issues using JQL.",
    {
      connection: connectionField,
      jql: z.string(),
      startAt: z.number().optional(),
      maxResults: z.number().optional(),
      fields: z.array(z.string()).optional(),
    },
    async ({ connection, jql, startAt, maxResults, fields }) =>
      jsonResult(await factory.requireJira(connection).searchIssues(jql, startAt ?? 0, maxResults ?? 50, fields)),
  );

  registerTool(
    server,
    "jira_create_issue",
    "Create a Jira issue.",
    { connection: connectionField, fields: z.record(z.unknown()), dryRun: dryRunField },
    async ({ connection, fields, dryRun }) =>
      jsonResult(await factory.requireJira(connection).createIssue(fields, dryRun)),
  );

  registerTool(
    server,
    "jira_update_issue",
    "Update Jira issue fields.",
    { connection: connectionField, issueKey: z.string(), fields: z.record(z.unknown()), dryRun: dryRunField },
    async ({ connection, issueKey, fields, dryRun }) =>
      jsonResult(await factory.requireJira(connection).updateIssue(issueKey, fields, dryRun)),
  );

  registerTool(
    server,
    "jira_delete_issue",
    "Delete a Jira issue.",
    { connection: connectionField, issueKey: z.string(), dryRun: dryRunField },
    async ({ connection, issueKey, dryRun }) =>
      jsonResult(await factory.requireJira(connection).deleteIssue(issueKey, dryRun)),
  );

  registerTool(
    server,
    "jira_assign_issue",
    "Assign a Jira issue to a user.",
    { connection: connectionField, issueKey: z.string(), assignee: z.string(), dryRun: dryRunField },
    async ({ connection, issueKey, assignee, dryRun }) =>
      jsonResult(await factory.requireJira(connection).assignIssue(issueKey, assignee, dryRun)),
  );

  registerTool(
    server,
    "jira_get_comments",
    "List comments on an issue.",
    { connection: connectionField, issueKey: z.string(), startAt: z.number().optional(), maxResults: z.number().optional() },
    async ({ connection, issueKey, startAt, maxResults }) =>
      jsonResult(await factory.requireJira(connection).getComments(issueKey, startAt, maxResults)),
  );

  registerTool(
    server,
    "jira_add_comment",
    "Add a comment to an issue.",
    { connection: connectionField, issueKey: z.string(), body: z.string(), dryRun: dryRunField },
    async ({ connection, issueKey, body, dryRun }) =>
      jsonResult(await factory.requireJira(connection).addComment(issueKey, body, dryRun)),
  );

  registerTool(
    server,
    "jira_update_comment",
    "Update an issue comment.",
    {
      connection: connectionField,
      issueKey: z.string(),
      commentId: z.string(),
      body: z.string(),
      dryRun: dryRunField,
    },
    async ({ connection, issueKey, commentId, body, dryRun }) =>
      jsonResult(await factory.requireJira(connection).updateComment(issueKey, commentId, body, dryRun)),
  );

  registerTool(
    server,
    "jira_delete_comment",
    "Delete an issue comment.",
    { connection: connectionField, issueKey: z.string(), commentId: z.string(), dryRun: dryRunField },
    async ({ connection, issueKey, commentId, dryRun }) =>
      jsonResult(await factory.requireJira(connection).deleteComment(issueKey, commentId, dryRun)),
  );

  registerTool(
    server,
    "jira_get_transitions",
    "Get available transitions for an issue.",
    { connection: connectionField, issueKey: z.string() },
    async ({ connection, issueKey }) =>
      jsonResult(await factory.requireJira(connection).getTransitions(issueKey)),
  );

  registerTool(
    server,
    "jira_transition_issue",
    "Transition an issue to a new status.",
    {
      connection: connectionField,
      issueKey: z.string(),
      transitionId: z.string(),
      fields: z.record(z.unknown()).optional(),
      dryRun: dryRunField,
    },
    async ({ connection, issueKey, transitionId, fields, dryRun }) =>
      jsonResult(await factory.requireJira(connection).transitionIssue(issueKey, transitionId, fields, dryRun)),
  );

  registerTool(
    server,
    "jira_get_worklogs",
    "Get worklogs for an issue.",
    { connection: connectionField, issueKey: z.string() },
    async ({ connection, issueKey }) => jsonResult(await factory.requireJira(connection).getWorklogs(issueKey)),
  );

  registerTool(
    server,
    "jira_add_worklog",
    "Add a worklog entry.",
    {
      connection: connectionField,
      issueKey: z.string(),
      timeSpent: z.string(),
      comment: z.string().optional(),
      dryRun: dryRunField,
    },
    async ({ connection, issueKey, timeSpent, comment, dryRun }) =>
      jsonResult(await factory.requireJira(connection).addWorklog(issueKey, timeSpent, comment, dryRun)),
  );

  registerTool(
    server,
    "jira_update_worklog",
    "Update a worklog entry.",
    {
      connection: connectionField,
      issueKey: z.string(),
      worklogId: z.string(),
      timeSpent: z.string(),
      comment: z.string().optional(),
      dryRun: dryRunField,
    },
    async ({ connection, issueKey, worklogId, timeSpent, comment, dryRun }) =>
      jsonResult(await factory.requireJira(connection).updateWorklog(issueKey, worklogId, timeSpent, comment, dryRun)),
  );

  registerTool(
    server,
    "jira_delete_worklog",
    "Delete a worklog entry.",
    { connection: connectionField, issueKey: z.string(), worklogId: z.string(), dryRun: dryRunField },
    async ({ connection, issueKey, worklogId, dryRun }) =>
      jsonResult(await factory.requireJira(connection).deleteWorklog(issueKey, worklogId, dryRun)),
  );

  registerTool(
    server,
    "jira_get_attachments",
    "Get attachment metadata for an issue.",
    { connection: connectionField, issueKey: z.string() },
    async ({ connection, issueKey }) => jsonResult(await factory.requireJira(connection).getAttachments(issueKey)),
  );

  registerTool(
    server,
    "jira_create_issue_link",
    "Link two issues.",
    {
      connection: connectionField,
      inward: z.string(),
      outward: z.string(),
      linkType: z.string(),
      dryRun: dryRunField,
    },
    async ({ connection, inward, outward, linkType, dryRun }) =>
      jsonResult(await factory.requireJira(connection).createIssueLink(inward, outward, linkType, dryRun)),
  );

  registerTool(
    server,
    "jira_get_issue_link_types",
    "List issue link types.",
    { connection: connectionField },
    async ({ connection }) => jsonResult(await factory.requireJira(connection).getIssueLinkTypes()),
  );

  registerTool(
    server,
    "jira_get_remote_links",
    "Get remote links on an issue.",
    { connection: connectionField, issueKey: z.string() },
    async ({ connection, issueKey }) => jsonResult(await factory.requireJira(connection).getRemoteLinks(issueKey)),
  );

  registerTool(
    server,
    "jira_create_remote_link",
    "Add a remote link to an issue.",
    { connection: connectionField, issueKey: z.string(), url: z.string(), title: z.string(), dryRun: dryRunField },
    async ({ connection, issueKey, url, title, dryRun }) =>
      jsonResult(await factory.requireJira(connection).createRemoteLink(issueKey, url, title, dryRun)),
  );

  registerTool(
    server,
    "jira_get_projects",
    "List Jira projects.",
    { connection: connectionField, startAt: z.number().optional(), maxResults: z.number().optional() },
    async ({ connection, startAt, maxResults }) =>
      jsonResult(await factory.requireJira(connection).getProjects(startAt, maxResults)),
  );

  registerTool(
    server,
    "jira_get_project",
    "Get a Jira project.",
    { connection: connectionField, projectKey: z.string() },
    async ({ connection, projectKey }) => jsonResult(await factory.requireJira(connection).getProject(projectKey)),
  );

  registerTool(
    server,
    "jira_get_issue_types",
    "Get issue types globally or for a project.",
    { connection: connectionField, projectKey: z.string().optional() },
    async ({ connection, projectKey }) => jsonResult(await factory.requireJira(connection).getIssueTypes(projectKey)),
  );

  registerTool(
    server,
    "jira_get_create_meta",
    "Get create metadata for a project/issue type.",
    { connection: connectionField, projectKey: z.string(), issueTypeId: z.string().optional() },
    async ({ connection, projectKey, issueTypeId }) =>
      jsonResult(await factory.requireJira(connection).getCreateMeta(projectKey, issueTypeId)),
  );

  registerTool(
    server,
    "jira_lookup_user",
    "Search Jira users.",
    { connection: connectionField, query: z.string(), maxResults: z.number().optional() },
    async ({ connection, query, maxResults }) =>
      jsonResult(await factory.requireJira(connection).lookupUser(query, maxResults)),
  );

  registerTool(
    server,
    "jira_get_groups",
    "Search Jira groups.",
    { connection: connectionField, query: z.string().optional() },
    async ({ connection, query }) => jsonResult(await factory.requireJira(connection).getGroups(query)),
  );

  registerTool(
    server,
    "jira_get_versions",
    "List fix versions for a project.",
    { connection: connectionField, projectKey: z.string() },
    async ({ connection, projectKey }) => jsonResult(await factory.requireJira(connection).getVersions(projectKey)),
  );

  registerTool(
    server,
    "jira_create_version",
    "Create a fix version.",
    {
      connection: connectionField,
      projectKey: z.string(),
      name: z.string(),
      description: z.string().optional(),
      dryRun: dryRunField,
    },
    async ({ connection, projectKey, name, description, dryRun }) =>
      jsonResult(await factory.requireJira(connection).createVersion(projectKey, name, description, dryRun)),
  );

  registerTool(
    server,
    "jira_get_components",
    "List components for a project.",
    { connection: connectionField, projectKey: z.string() },
    async ({ connection, projectKey }) => jsonResult(await factory.requireJira(connection).getComponents(projectKey)),
  );

  registerTool(
    server,
    "jira_get_changelog",
    "Get issue changelog/history.",
    { connection: connectionField, issueKey: z.string() },
    async ({ connection, issueKey }) => jsonResult(await factory.requireJira(connection).getChangelog(issueKey)),
  );

  registerTool(
    server,
    "jira_watch_issue",
    "Watch an issue.",
    { connection: connectionField, issueKey: z.string(), dryRun: dryRunField },
    async ({ connection, issueKey, dryRun }) =>
      jsonResult(await factory.requireJira(connection).watchIssue(issueKey, dryRun)),
  );

  registerTool(
    server,
    "jira_get_watchers",
    "Get watchers for an issue.",
    { connection: connectionField, issueKey: z.string() },
    async ({ connection, issueKey }) => jsonResult(await factory.requireJira(connection).getWatchers(issueKey)),
  );

  registerTool(
    server,
    "jira_bulk_update",
    "Bulk update multiple issues.",
    { connection: connectionField, issueUpdates: z.array(z.unknown()), dryRun: dryRunField },
    async ({ connection, issueUpdates, dryRun }) =>
      jsonResult(await factory.requireJira(connection).bulkUpdate(issueUpdates, dryRun)),
  );

  registerTool(
    server,
    "jira_get_boards",
    "List agile boards.",
    { connection: connectionField, startAt: z.number().optional(), maxResults: z.number().optional() },
    async ({ connection, startAt, maxResults }) =>
      jsonResult(await factory.requireJira(connection).getBoards(startAt, maxResults)),
  );

  registerTool(
    server,
    "jira_get_sprints",
    "List sprints for a board.",
    { connection: connectionField, boardId: z.number(), startAt: z.number().optional(), maxResults: z.number().optional() },
    async ({ connection, boardId, startAt, maxResults }) =>
      jsonResult(await factory.requireJira(connection).getSprints(boardId, startAt, maxResults)),
  );

  registerTool(
    server,
    "jira_get_sprint_issues",
    "List issues in a sprint.",
    { connection: connectionField, sprintId: z.number(), startAt: z.number().optional(), maxResults: z.number().optional() },
    async ({ connection, sprintId, startAt, maxResults }) =>
      jsonResult(await factory.requireJira(connection).getSprintIssues(sprintId, startAt, maxResults)),
  );

  registerTool(
    server,
    "jira_move_issues_to_sprint",
    "Move issues into a sprint.",
    { connection: connectionField, sprintId: z.number(), issueKeys: z.array(z.string()), dryRun: dryRunField },
    async ({ connection, sprintId, issueKeys, dryRun }) =>
      jsonResult(await factory.requireJira(connection).moveIssuesToSprint(sprintId, issueKeys, dryRun)),
  );

  registerTool(
    server,
    "jira_rank_issues",
    "Rank issues in backlog.",
    {
      connection: connectionField,
      issueKeys: z.array(z.string()),
      rankBefore: z.string().optional(),
      rankAfter: z.string().optional(),
      dryRun: dryRunField,
    },
    async ({ connection, issueKeys, rankBefore, rankAfter, dryRun }) =>
      jsonResult(await factory.requireJira(connection).rankIssues(issueKeys, rankBefore, rankAfter, dryRun)),
  );

  registerTool(
    server,
    "jira_api",
    "Escape hatch: call any Jira REST path under /rest/api.",
    {
      connection: connectionField,
      path: z.string().describe("Path after /rest/api/2 or /3, e.g. issue/PROJ-1"),
      method: z.string().optional(),
      query: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
      body: z.unknown().optional(),
      dryRun: dryRunField,
    },
    async ({ connection, path, method, query, body, dryRun }) =>
      jsonResult(await factory.requireJira(connection).raw(path, { method, query, body, dryRun })),
  );
}
