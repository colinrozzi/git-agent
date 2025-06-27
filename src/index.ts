#!/usr/bin/env node

/**
 * Git Agent - Git workflows powered by AI
 * 
 * Usage:
 *   commit          # Start commit workflow
 *   review          # Start review workflow  
 *   rebase          # Start rebase workflow
 *   git-chat        # General git chat
 *   git-agent       # With explicit command
 */

import { program } from 'commander';
import chalk from 'chalk';
import path from 'path';
import { detectGitRepository, analyzeRepository, buildGitConfig, validateGitRepository } from './git-detector.js';
import { GitAgentClient } from './theater-client.js';
import { renderGitChatApp } from './ui/GitChatUI.js';
import type { GitWorkflow, CLIOptions, ExecutionMode } from './types.js';

// Determine the workflow from the command name
function getWorkflowFromCommand(): GitWorkflow {
  const scriptName = path.basename(process.argv[1]);

  switch (scriptName) {
    case 'commit':
      return 'commit';
    case 'review':
      return 'review';
    case 'rebase':
      return 'rebase';
    case 'git-chat':
      return 'chat';
    default:
      return 'chat'; // Default for git-agent
  }
}

// Main program setup
program
  .name('git-agent')
  .description('Git workflows powered by AI')
  .version('1.0.0');

// Add workflow commands
program
  .command('commit')
  .description('Analyze changes and create commits')
  .option('-d, --directory <path>', 'Git repository path (auto-detected if not provided)')
  .option('-s, --server <address>', 'Theater server address', '127.0.0.1:9000')
  .option('-m, --mode <mode>', 'Execution mode: workflow (auto-exit) or interactive (chat)', 'workflow')
  .option('-v, --verbose', 'Enable verbose logging')
  .action((options) => runWorkflow('commit', options));

program
  .command('review')
  .description('Review code changes and provide feedback')
  .option('-d, --directory <path>', 'Git repository path (auto-detected if not provided)')
  .option('-s, --server <address>', 'Theater server address', '127.0.0.1:9000')
  .option('-m, --mode <mode>', 'Execution mode: workflow (auto-exit) or interactive (chat)', 'workflow')
  .option('-v, --verbose', 'Enable verbose logging')
  .action((options) => runWorkflow('review', options));

program
  .command('rebase')
  .description('Interactive rebase assistance')
  .option('-d, --directory <path>', 'Git repository path (auto-detected if not provided)')
  .option('-s, --server <address>', 'Theater server address', '127.0.0.1:9000')
  .option('-m, --mode <mode>', 'Execution mode: workflow (auto-exit) or interactive (chat)', 'workflow')
  .option('-v, --verbose', 'Enable verbose logging')
  .action((options) => runWorkflow('rebase', options));

program
  .command('chat')
  .description('General git assistant chat')
  .option('-d, --directory <path>', 'Git repository path (auto-detected if not provided)')
  .option('-s, --server <address>', 'Theater server address', '127.0.0.1:9000')
  .option('-m, --mode <mode>', 'Execution mode: workflow (auto-exit) or interactive (chat)', 'interactive')
  .option('-v, --verbose', 'Enable verbose logging')
  .action((options) => runWorkflow('chat', options));

// Handle direct invocation (commit, review, rebase, git-chat commands)
if (process.argv.length === 2) {
  const workflow = getWorkflowFromCommand();
  if (workflow !== 'chat' || path.basename(process.argv[1]) === 'git-chat') {
    // Direct workflow command - run with default options
    const defaultMode = workflow === 'chat' ? 'interactive' : 'task';
    runWorkflow(workflow, {
      server: '127.0.0.1:9000',
      mode: defaultMode,
      verbose: false
    });
  } else {
    // Default to showing help for git-agent
    program.help();
  }
} else {
  // Parse command line arguments normally
  program.parse();
}

/**
 * Run a git workflow
 */
async function runWorkflow(workflow: GitWorkflow, options: CLIOptions): Promise<void> {
  try {
    // Detect and validate git repository
    const repoPath = options.directory || detectGitRepository();
    if (!repoPath) {
      console.error(chalk.red('❌ Not in a git repository'));
      console.error(chalk.gray('Run this command from within a git repository, or use -d to specify the path.'));
      process.exit(1);
    }

    /*
    validateGitRepository(repoPath);
    const repository = analyzeRepository(repoPath);

    if (options.verbose) {
      console.log(chalk.cyan(`Detected repository: ${repository.path}`));
      console.log(chalk.gray(`Branch: ${repository.currentBranch}`));
      console.log(chalk.gray(`Status: ${repository.isClean ? 'Clean' : 'Has changes'}`));
      if (!repository.isClean) {
        console.log(chalk.gray(`   Modified: ${repository.modifiedFiles.length}`));
        console.log(chalk.gray(`   Untracked: ${repository.untrackedFiles.length}`));
        console.log(chalk.gray(`   Staged: ${repository.stagedFiles.length}`));
      }
    }
    */

    // Validate mode
    const mode = options.mode || (workflow === 'chat' ? 'interactive' : 'task');
    if (mode !== 'task' && mode !== 'interactive') {
      console.error(chalk.red(`❌ Invalid mode: ${mode}. Must be 'task' or 'interactive'`));
      process.exit(1);
    }

    // Build configuration
    const config = buildGitConfig(workflow, repoPath, mode);

    if (options.verbose) {
      console.log(chalk.cyan(`Starting ${workflow} task in ${mode} mode...`));
      console.log(chalk.gray(`Mode: ${mode === 'task' ? 'Auto-exit when complete' : 'Interactive chat'}`));
      console.log(chalk.gray(`Using task-manager actor`));
      console.log(chalk.gray(`Connecting to ${options.server || '127.0.0.1:9000'}`));
    }

    // Start the interactive UI
    await renderGitChatApp(options, config, repoPath, workflow, mode);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(chalk.red(`❌ Error: ${errorMessage}`));

    if (options.verbose && error instanceof Error && error.stack) {
      console.error(chalk.gray(error.stack));
    }

    process.exit(1);
  }
}

/**
 * Show workflow-specific banner
 */
function showWorkflowBanner(workflow: GitWorkflow, repository: any): void {
  const workflowInfo = {
    commit: {
      emoji: '',
      title: 'Commit Workflow',
      description: 'Analyze changes and create meaningful commits'
    },
    review: {
      emoji: '',
      title: 'Code Review',
      description: 'Review changes and provide feedback'
    },
    rebase: {
      emoji: '🔄',
      title: 'Interactive Rebase',
      description: 'Clean up commit history'
    },
    chat: {
      emoji: '',
      title: 'Git Assistant',
      description: 'General git workflow assistance'
    }
  };

  const info = workflowInfo[workflow];
  const repoName = repository.path.split('/').pop();

  console.log(chalk.cyan(`\n${info.emoji} ${info.title}`));
  console.log(chalk.gray(`${info.description}`));
  console.log(chalk.gray(`Repository: ${repoName} (${repository.currentBranch})`));

  if (repository.hasUncommittedChanges) {
    console.log(chalk.yellow(`${repository.modifiedFiles.length + repository.untrackedFiles.length + repository.stagedFiles.length} files with changes`));
  } else {
    console.log(chalk.green(`Working directory clean`));
  }

  console.log(''); // Empty line before UI starts
}
