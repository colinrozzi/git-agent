/**
 * Git repository detection and analysis
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import type { GitRepository, GitWorkflow, GitAgentConfig, ExecutionMode } from './types.js';

/**
 * Detect git repository by walking up directory tree
 */
export function detectGitRepository(startPath?: string): string | null {
  let currentDir = startPath || process.cwd();

  while (currentDir !== path.dirname(currentDir)) {
    if (fs.existsSync(path.join(currentDir, '.git'))) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }

  return null;
}

/**
 * Analyze git repository status
 */
export function analyzeRepository(repoPath: string): GitRepository {
  const originalCwd = process.cwd();

  try {
    process.chdir(repoPath);

    // Get current branch
    const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', {
      encoding: 'utf8'
    }).trim();

    // Get status
    const statusOutput = execSync('git status --porcelain', {
      encoding: 'utf8'
    });

    const modifiedFiles: string[] = [];
    const untrackedFiles: string[] = [];
    const stagedFiles: string[] = [];

    for (const line of statusOutput.split('\n')) {
      if (!line.trim()) continue;

      const status = line.substring(0, 2);
      const filePath = line.substring(3);

      // Staged files (first character)
      if (status[0] !== ' ' && status[0] !== '?') {
        stagedFiles.push(filePath);
      }

      // Modified files (second character)
      if (status[1] === 'M') {
        modifiedFiles.push(filePath);
      }

      // Untracked files
      if (status[0] === '?' && status[1] === '?') {
        untrackedFiles.push(filePath);
      }
    }

    const hasUncommittedChanges = modifiedFiles.length > 0 || untrackedFiles.length > 0 || stagedFiles.length > 0;
    const isClean = !hasUncommittedChanges;

    return {
      path: repoPath,
      isClean,
      currentBranch,
      hasUncommittedChanges,
      modifiedFiles,
      untrackedFiles,
      stagedFiles
    };

  } catch (error) {
    throw new Error(`Failed to analyze repository: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    process.chdir(originalCwd);
  }
}

/**
 * Build task-manager configuration for git workflows
 */
export function buildGitConfig(workflow: GitWorkflow, repoPath: string, mode: ExecutionMode = 'task'): GitAgentConfig {
  const workflowConfig = getWorkflowConfig(workflow);
  const systemPrompt = buildGitSystemPrompt(workflow, repoPath);
  const initialMessage = getWorkflowInitialMessage(workflow);

  return {
    actor: {
      manifest_path: "/Users/colinrozzi/work/actor-registry/task-manager/manifest.toml",
      initial_state: {
        system_prompt: systemPrompt,
        initial_message: initialMessage,
        model_config: workflowConfig.model_config,
        temperature: workflowConfig.temperature,
        max_tokens: workflowConfig.max_tokens,
        mcp_servers: [
          {
            actor_id: null,
            actor: {
              manifest_path: "https://github.com/colinrozzi/git-mcp-actor/releases/latest/download/manifest.toml"
            },
            tools: null
          }
        ],
        auto_exit_on_completion: mode === 'task'
      }
    },
    mode: mode
  };
}

/**
 * Build git-specific system prompt with directory context
 */
function buildGitSystemPrompt(workflow: GitWorkflow, repoPath: string): string {
  const directoryContext = `\n\nWORKING DIRECTORY: ${repoPath}\nAll git operations should be performed in this directory.`;

  const basePrompt = "You are a Git Task Assistant with access to git tools. You specialize in completing specific git-related tasks efficiently and thoroughly.\n\nAVAILABLE CAPABILITIES:\n- Git repository operations (status, diff, log, branch management)\n- File staging and commit creation\n- Branch operations and history analysis\n- Code review and quality assessment\n- Repository cleanup and organization\n- Task completion signaling\n\nAPPROACH:\n- Always start by understanding the current repository state\n- Break down complex tasks into clear steps\n- Provide explanations for all git operations\n- Follow git best practices and conventions\n- Signal completion when tasks are finished";

  const taskContext = getTaskContext(workflow);

  return `${basePrompt}${directoryContext}${taskContext}`;
}

/**
 * Get task-specific context for system prompt
 */
function getTaskContext(workflow: GitWorkflow): string {
  switch (workflow) {
    case 'commit':
      return "\n\nTASK: AUTOMATED COMMIT\n" +
        "Your task is to analyze the current repository and create appropriate commits:\n\n" +
        "STEPS:\n" +
        "1. Check git status to identify changed files\n" +
        "2. Review changes using git diff to understand what was modified\n" +
        "3. Stage appropriate files for logical commits\n" +
        "4. Create meaningful, conventional commit messages\n" +
        "5. Execute commits with clear explanations\n" +
        "6. When all commits are complete, use the task_complete tool\n\n" +
        "GOAL: Create clean, atomic commits with descriptive messages. " +
        "If there are multiple logical changes, create separate commits. " +
        "Always explain your reasoning and call task_complete when finished.";

    case 'review':
      return "\n\nTASK: CODE REVIEW\n" +
        "Your task is to thoroughly review the current code changes:\n\n" +
        "STEPS:\n" +
        "1. Check git status and diff to understand all changes\n" +
        "2. Analyze code quality, style, and architecture\n" +
        "3. Identify potential bugs, security issues, or performance problems\n" +
        "4. Suggest specific improvements with examples\n" +
        "5. Provide constructive feedback on implementation choices\n" +
        "6. When review is complete, use the task_complete tool\n\n" +
        "GOAL: Provide thorough, constructive code review that helps improve " +
        "code quality. Focus on being educational and actionable.";

    case 'rebase':
      return "\n\nTASK: INTERACTIVE REBASE\n" +
        "Your task is to help clean up the git history through rebase:\n\n" +
        "STEPS:\n" +
        "1. Analyze current branch history and commit structure\n" +
        "2. Plan an appropriate rebase strategy\n" +
        "3. Guide through interactive rebase steps\n" +
        "4. Help resolve any merge conflicts that arise\n" +
        "5. Verify the final history is clean and logical\n" +
        "6. When rebase is complete, use the task_complete tool\n\n" +
        "GOAL: Achieve a clean, linear git history while preserving " +
        "all important changes and maintaining code integrity.";

    case 'chat':
    default:
      return "\n\nMODE: INTERACTIVE GIT ASSISTANCE\n" +
        "You are available to help with any git-related tasks or questions. " +
        "Use your tools to understand the repository state and provide helpful guidance " +
        "on git workflows, best practices, and problem-solving.";
  }
}

/**
 * Get workflow-specific initial message
 */
function getWorkflowInitialMessage(workflow: GitWorkflow): string | undefined {
  switch (workflow) {
    case 'commit':
      return "Please analyze the repository and commit any pending changes with appropriate commit messages. Start by checking git status to see what files have changed.";

    case 'review':
      return "Please perform a comprehensive code review of the current changes. Start by examining what has been modified.";

    case 'rebase':
      return "Please help me clean up the git history through an interactive rebase. Start by showing the current commit history.";

    case 'chat':
    default:
      return undefined; // No auto-initiation for general chat
  }
}

/**
 * Get workflow-specific configuration
 */
function getWorkflowConfig(workflow: GitWorkflow) {
  const configs = {
    commit: {
      temperature: 0.3,
      max_tokens: 4096,
      model_config: {
        model: "gemini-2.0-flash",
        provider: "google"
      }
    },
    review: {
      temperature: 0.5,
      max_tokens: 8192,
      model_config: {
        model: "claude-sonnet-4-20250514",
        provider: "anthropic"
      }
    },
    rebase: {
      temperature: 0.4,
      max_tokens: 6144,
      model_config: {
        model: "claude-sonnet-4-20250514",
        provider: "anthropic"
      }
    },
    chat: {
      temperature: 0.7,
      max_tokens: 8192,
      model_config: {
        model: "claude-sonnet-4-20250514",
        provider: "anthropic"
      }
    }
  };

  return configs[workflow];
}

/**
 * Validate that directory is a git repository
 */
export function validateGitRepository(path: string): void {
  if (!fs.existsSync(path)) {
    throw new Error(`Directory does not exist: ${path}`);
  }

  if (!fs.existsSync(path + '/.git')) {
    throw new Error(`Not a git repository: ${path}`);
  }

  try {
    const originalCwd = process.cwd();
    process.chdir(path);

    // Test git command
    execSync('git status', { stdio: 'pipe' });

    process.chdir(originalCwd);
  } catch (error) {
    throw new Error(`Invalid git repository: ${error instanceof Error ? error.message : String(error)}`);
  }
}
