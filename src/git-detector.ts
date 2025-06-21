/**
 * Git repository detection and analysis
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import type { GitRepository, GitWorkflow, GitTheaterConfig, ExecutionMode } from './types.js';

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
 * Build git-chat-assistant configuration
 */
export function buildGitConfig(workflow: GitWorkflow, repoPath: string, mode: ExecutionMode = 'workflow'): GitTheaterConfig {
  const workflowConfig = getWorkflowConfig(workflow);

  return {
    actor: {
      manifest_path: "/Users/colinrozzi/work/actor-registry/git-chat-assistant/manifest.toml",
      initial_state: {
        current_directory: repoPath,
        workflow: workflow === 'chat' ? undefined : workflow,
        auto_exit_on_completion: mode === 'workflow',
        ...workflowConfig
      }
    },
    mode: mode
  };
}

/**
 * Get workflow-specific configuration
 */
function getWorkflowConfig(workflow: GitWorkflow) {
  const configs = {
    commit: {
      temperature: 0.3,
      max_tokens: 4096,
      title: "Git Commit Assistant",
      description: "Automated git commit workflow assistant",
      model_config: {
        model: "gemini-2.0-flash",
        provider: "google"
      }
    },
    review: {
      temperature: 0.5,
      max_tokens: 8192,
      title: "Git Review Assistant",
      description: "Code review workflow assistant",
      model_config: {
        model: "claude-sonnet-4-20250514",
        provider: "anthropic"
      }
    },
    rebase: {
      temperature: 0.4,
      max_tokens: 6144,
      title: "Git Rebase Assistant",
      description: "Interactive rebase workflow assistant",
      model_config: {
        model: "claude-sonnet-4-20250514",
        provider: "anthropic"
      }
    },
    chat: {
      temperature: 0.7,
      max_tokens: 8192,
      title: "Git Assistant",
      description: "General git workflow assistant",
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
