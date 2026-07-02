import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ClientFactory } from "../clients/clientFactory.js";
import { connectionField, dryRunField, jsonResult, registerTool, repoRefSchema } from "./common.js";

export function registerJiraExtendedTools(server: McpServer, factory: ClientFactory): void {
  const j = (connection?: string) => factory.requireJira(connection);

  registerTool(
    server,
    "jira_clone_issue",
    "Clone an issue (copy fields, optional overrides).",
    { connection: connectionField, sourceKey: z.string(), overrides: z.record(z.unknown()).optional(), dryRun: dryRunField },
    async (a) => jsonResult(await j(a.connection).cloneIssue(a.sourceKey, a.overrides, a.dryRun)),
  );

  registerTool(
    server,
    "jira_move_issue",
    "Move issue to another project/issue type.",
    {
      connection: connectionField,
      issueKey: z.string(),
      targetProject: z.string(),
      targetIssueType: z.string().optional(),
      dryRun: dryRunField,
    },
    async (a) => jsonResult(await j(a.connection).moveIssue(a.issueKey, a.targetProject, a.targetIssueType, a.dryRun)),
  );

  registerTool(
    server,
    "jira_delete_issue_link",
    "Delete an issue link by ID.",
    { connection: connectionField, linkId: z.string(), dryRun: dryRunField },
    async (a) => jsonResult(await j(a.connection).deleteIssueLink(a.linkId, a.dryRun)),
  );

  registerTool(
    server,
    "jira_delete_remote_link",
    "Delete a remote link from an issue.",
    { connection: connectionField, issueKey: z.string(), linkId: z.string(), dryRun: dryRunField },
    async (a) => jsonResult(await j(a.connection).deleteRemoteLink(a.issueKey, a.linkId, a.dryRun)),
  );

  registerTool(
    server,
    "jira_add_attachment",
    "Upload attachment (base64 content).",
    {
      connection: connectionField,
      issueKey: z.string(),
      filename: z.string(),
      contentBase64: z.string(),
      dryRun: dryRunField,
    },
    async (a) => jsonResult(await j(a.connection).addAttachment(a.issueKey, a.filename, a.contentBase64, a.dryRun)),
  );

  registerTool(
    server,
    "jira_delete_attachment",
    "Delete attachment by ID.",
    { connection: connectionField, attachmentId: z.string(), dryRun: dryRunField },
    async (a) => jsonResult(await j(a.connection).deleteAttachment(a.attachmentId, a.dryRun)),
  );

  registerTool(
    server,
    "jira_add_vote",
    "Vote for an issue.",
    { connection: connectionField, issueKey: z.string(), dryRun: dryRunField },
    async (a) => jsonResult(await j(a.connection).addVote(a.issueKey, a.dryRun)),
  );

  registerTool(
    server,
    "jira_remove_vote",
    "Remove vote from an issue.",
    { connection: connectionField, issueKey: z.string(), dryRun: dryRunField },
    async (a) => jsonResult(await j(a.connection).removeVote(a.issueKey, a.dryRun)),
  );

  registerTool(
    server,
    "jira_get_votes",
    "Get votes for an issue.",
    { connection: connectionField, issueKey: z.string() },
    async (a) => jsonResult(await j(a.connection).getVotes(a.issueKey)),
  );

  registerTool(
    server,
    "jira_unwatch_issue",
    "Stop watching an issue.",
    { connection: connectionField, issueKey: z.string(), dryRun: dryRunField },
    async (a) => jsonResult(await j(a.connection).unwatchIssue(a.issueKey, a.dryRun)),
  );

  registerTool(
    server,
    "jira_create_component",
    "Create a project component.",
    {
      connection: connectionField,
      projectKey: z.string(),
      name: z.string(),
      description: z.string().optional(),
      dryRun: dryRunField,
    },
    async (a) => jsonResult(await j(a.connection).createComponent(a.projectKey, a.name, a.description, a.dryRun)),
  );

  registerTool(
    server,
    "jira_update_component",
    "Update a component.",
    { connection: connectionField, componentId: z.string(), fields: z.record(z.unknown()), dryRun: dryRunField },
    async (a) => jsonResult(await j(a.connection).updateComponent(a.componentId, a.fields, a.dryRun)),
  );

  registerTool(
    server,
    "jira_delete_component",
    "Delete a component.",
    { connection: connectionField, componentId: z.string(), dryRun: dryRunField },
    async (a) => jsonResult(await j(a.connection).deleteComponent(a.componentId, a.dryRun)),
  );

  registerTool(
    server,
    "jira_update_version",
    "Update a fix version.",
    { connection: connectionField, versionId: z.string(), fields: z.record(z.unknown()), dryRun: dryRunField },
    async (a) => jsonResult(await j(a.connection).updateVersion(a.versionId, a.fields, a.dryRun)),
  );

  registerTool(
    server,
    "jira_delete_version",
    "Delete a fix version.",
    { connection: connectionField, versionId: z.string(), dryRun: dryRunField },
    async (a) => jsonResult(await j(a.connection).deleteVersion(a.versionId, a.dryRun)),
  );

  registerTool(
    server,
    "jira_get_epic_issues",
    "List issues in an epic.",
    { connection: connectionField, epicKey: z.string(), startAt: z.number().optional(), maxResults: z.number().optional() },
    async (a) => jsonResult(await j(a.connection).getEpicIssues(a.epicKey, a.startAt, a.maxResults)),
  );

  registerTool(
    server,
    "jira_get_board_epics",
    "List epics on a board.",
    { connection: connectionField, boardId: z.number(), startAt: z.number().optional(), maxResults: z.number().optional() },
    async (a) => jsonResult(await j(a.connection).getBoardEpics(a.boardId, a.startAt, a.maxResults)),
  );

  registerTool(
    server,
    "jira_get_board_backlog",
    "List backlog issues for a board.",
    { connection: connectionField, boardId: z.number(), startAt: z.number().optional(), maxResults: z.number().optional() },
    async (a) => jsonResult(await j(a.connection).getBoardBacklog(a.boardId, a.startAt, a.maxResults)),
  );

  registerTool(
    server,
    "jira_create_sprint",
    "Create a sprint.",
    {
      connection: connectionField,
      name: z.string(),
      originBoardId: z.number(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      dryRun: dryRunField,
    },
    async (a) =>
      jsonResult(await j(a.connection).createSprint(a.name, a.originBoardId, a.startDate, a.endDate, a.dryRun)),
  );

  registerTool(
    server,
    "jira_update_sprint",
    "Update sprint fields.",
    { connection: connectionField, sprintId: z.number(), fields: z.record(z.unknown()), dryRun: dryRunField },
    async (a) => jsonResult(await j(a.connection).updateSprint(a.sprintId, a.fields, a.dryRun)),
  );

  registerTool(
    server,
    "jira_delete_sprint",
    "Delete a sprint.",
    { connection: connectionField, sprintId: z.number(), dryRun: dryRunField },
    async (a) => jsonResult(await j(a.connection).deleteSprint(a.sprintId, a.dryRun)),
  );

  registerTool(
    server,
    "jira_get_fields",
    "List all Jira fields (metadata).",
    { connection: connectionField },
    async (a) => jsonResult(await j(a.connection).getFields()),
  );
}

export function registerBitbucketExtendedTools(server: McpServer, factory: ClientFactory): void {
  const bb = (connection?: string) => factory.requireBitbucket(connection);
  const ref = (a: { project: string; repository: string }) => ({ project: a.project, repository: a.repository });

  registerTool(
    server,
    "bitbucket_create_repository",
    "Create a repository in a project.",
    { connection: connectionField, project: z.string(), name: z.string(), dryRun: dryRunField },
    async (a) => jsonResult(await bb(a.connection).createRepository(a.project, a.name, a.dryRun)),
  );

  registerTool(
    server,
    "bitbucket_create_tag",
    "Create a tag.",
    { ...repoRefSchema, name: z.string(), startPoint: z.string(), message: z.string().optional(), dryRun: dryRunField },
    async (a) => jsonResult(await bb(a.connection).createTag(ref(a), a.name, a.startPoint, a.message, a.dryRun)),
  );

  registerTool(
    server,
    "bitbucket_set_review_status",
    "Request changes or clear change request on a PR.",
    {
      ...repoRefSchema,
      pullRequestId: z.number(),
      requestChanges: z.boolean(),
      comment: z.string().optional(),
      dryRun: dryRunField,
    },
    async (a) =>
      jsonResult(
        await bb(a.connection).setReviewStatus(ref(a), a.pullRequestId, a.requestChanges, a.comment, a.dryRun),
      ),
  );

  registerTool(
    server,
    "bitbucket_list_pr_tasks",
    "List PR tasks.",
    { ...repoRefSchema, pullRequestId: z.number() },
    async (a) => jsonResult(await bb(a.connection).listPullRequestTasks(ref(a), a.pullRequestId)),
  );

  registerTool(
    server,
    "bitbucket_create_pr_task",
    "Create a PR task.",
    { ...repoRefSchema, pullRequestId: z.number(), text: z.string(), dryRun: dryRunField },
    async (a) => jsonResult(await bb(a.connection).createPullRequestTask(ref(a), a.pullRequestId, a.text, a.dryRun)),
  );

  registerTool(
    server,
    "bitbucket_update_pr_task",
    "Update a PR task.",
    { ...repoRefSchema, pullRequestId: z.number(), taskId: z.number(), text: z.string(), dryRun: dryRunField },
    async (a) =>
      jsonResult(await bb(a.connection).updatePullRequestTask(ref(a), a.pullRequestId, a.taskId, a.text, a.dryRun)),
  );

  registerTool(
    server,
    "bitbucket_delete_pr_task",
    "Delete a PR task.",
    { ...repoRefSchema, pullRequestId: z.number(), taskId: z.number(), dryRun: dryRunField },
    async (a) => jsonResult(await bb(a.connection).deletePullRequestTask(ref(a), a.pullRequestId, a.taskId, a.dryRun)),
  );

  registerTool(
    server,
    "bitbucket_set_pr_task_status",
    "Resolve or reopen a PR task.",
    {
      ...repoRefSchema,
      pullRequestId: z.number(),
      taskId: z.number(),
      state: z.enum(["OPEN", "RESOLVED"]),
      dryRun: dryRunField,
    },
    async (a) =>
      jsonResult(
        await bb(a.connection).setPullRequestTaskStatus(ref(a), a.pullRequestId, a.taskId, a.state, a.dryRun),
      ),
  );

  registerTool(
    server,
    "bitbucket_convert_pr_item",
    "Convert comment↔task (Server/DC only).",
    {
      ...repoRefSchema,
      pullRequestId: z.number(),
      id: z.number(),
      direction: z.enum(["to_task", "to_comment"]),
      dryRun: dryRunField,
    },
    async (a) =>
      jsonResult(await bb(a.connection).convertPullRequestItem(ref(a), a.pullRequestId, a.id, a.direction, a.dryRun)),
  );

  registerTool(
    server,
    "bitbucket_list_pr_comments",
    "List PR comments.",
    { ...repoRefSchema, pullRequestId: z.number(), start: z.number().optional(), limit: z.number().optional() },
    async (a) => jsonResult(await bb(a.connection).listPullRequestComments(ref(a), a.pullRequestId, a.start, a.limit)),
  );

  registerTool(
    server,
    "bitbucket_get_pr_changes",
    "List files changed in a PR.",
    { ...repoRefSchema, pullRequestId: z.number() },
    async (a) => jsonResult(await bb(a.connection).getPullRequestChanges(ref(a), a.pullRequestId)),
  );

  registerTool(
    server,
    "bitbucket_get_file_blame",
    "Get file blame / line history.",
    {
      ...repoRefSchema,
      filePath: z.string(),
      branch: z.string().optional(),
      startLine: z.number().optional(),
      lineCount: z.number().optional(),
    },
    async (a) =>
      jsonResult(
        await bb(a.connection).getFileBlame(ref(a), a.filePath, a.branch, a.startLine, a.lineCount),
      ),
  );

  registerTool(
    server,
    "bitbucket_search_files",
    "Search files by path glob (not content).",
    {
      ...repoRefSchema,
      pattern: z.string().optional(),
      subPath: z.string().optional(),
      branch: z.string().optional(),
      limit: z.number().optional(),
    },
    async (a) =>
      jsonResult(await bb(a.connection).searchFiles(ref(a), a.pattern, a.subPath, a.branch, a.limit)),
  );

  registerTool(
    server,
    "bitbucket_find_in_files",
    "Content search by reading files (regex).",
    {
      ...repoRefSchema,
      contentQuery: z.string(),
      filenamePattern: z.string().optional(),
      branch: z.string().optional(),
      maxFiles: z.number().optional(),
      limit: z.number().optional(),
      parallelism: z.number().optional(),
    },
    async (a) =>
      jsonResult(
        await bb(a.connection).findInFiles(
          ref(a),
          a.contentQuery,
          a.filenamePattern,
          a.branch,
          a.maxFiles,
          a.limit,
          a.parallelism,
        ),
      ),
  );

  registerTool(
    server,
    "bitbucket_manage_attachment",
    "Download or delete repo attachment (Server/DC only).",
    {
      ...repoRefSchema,
      action: z.enum(["download", "delete"]),
      attachmentId: z.string(),
      dryRun: dryRunField,
    },
    async (a) => jsonResult(await bb(a.connection).manageAttachment(ref(a), a.action, a.attachmentId, a.dryRun)),
  );

  registerTool(
    server,
    "bitbucket_add_pr_reviewer",
    "Add a reviewer to a PR.",
    { ...repoRefSchema, pullRequestId: z.number(), userSlug: z.string(), dryRun: dryRunField },
    async (a) =>
      jsonResult(await bb(a.connection).addPullRequestReviewer(ref(a), a.pullRequestId, a.userSlug, a.dryRun)),
  );
}
