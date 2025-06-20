# Git Theater

**Git workflows powered by AI** - A streamlined interface for the git-chat-assistant that makes git operations effortless.

## Features

🎯 **One Command, Smart Workflows** - Just type `commit`, `review`, or `rebase` in any git repository  
🔍 **Auto Repository Detection** - Automatically finds and analyzes your git repository  
🤖 **AI-Powered Git Assistant** - Uses your git-chat-assistant actor for intelligent git operations  
⚡ **Zero Configuration** - Works out of the box with sensible defaults  
🎨 **Rich Terminal UI** - Beautiful, interactive interface built with Ink  

## Quick Start

### Installation

```bash
# Install dependencies
cd /path/to/git-theater
bun install

# Build the project
bun run build

# Link for global usage (optional)
npm link
```

### Basic Usage

Simply run these commands from within any git repository:

```bash
# Analyze changes and create commits
commit

# Review code changes  
review

# Interactive rebase assistance
rebase

# General git chat
git-chat
```

## Commands

### `commit` - Smart Commit Workflow
Analyzes your repository state and creates meaningful commits:
- Checks `git status` to identify changes
- Reviews diffs to understand modifications  
- Stages files appropriately
- Creates conventional commit messages
- Executes commits with explanations

**Example:**
```bash
cd my-project
commit
```

### `review` - Code Review Assistant  
Provides comprehensive code review:
- Analyzes code changes for quality and style
- Identifies potential bugs and security issues
- Suggests improvements and optimizations
- Provides constructive feedback

**Example:**
```bash
cd my-project  
review
```

### `rebase` - Interactive Rebase Helper
Assists with git rebase operations:
- Plans rebase strategies
- Helps resolve merge conflicts
- Guides through interactive rebase steps
- Ensures clean, linear history

**Example:**
```bash
cd my-project
rebase
```

### `git-chat` - General Git Assistant
Open-ended git assistance:
- Repository analysis and guidance
- Git workflow best practices  
- Branch management strategies
- Troubleshooting git issues

**Example:**
```bash
cd my-project
git-chat
```

## Advanced Usage

### Explicit Commands

You can also use the explicit `git-theater` command:

```bash
git-theater commit --verbose
git-theater review --directory /path/to/repo
git-theater rebase --server 192.168.1.100:9000
```

### Command Options

All commands support these options:

- `-d, --directory <path>` - Specify repository path (auto-detected if not provided)
- `-s, --server <address>` - Theater server address (default: 127.0.0.1:9000)  
- `-v, --verbose` - Enable verbose logging and diagnostics

### Examples with Options

```bash
# Use specific repository
commit --directory /path/to/other/repo

# Connect to remote Theater server
review --server production-server:9000 --verbose

# Verbose mode for debugging
rebase --verbose
```

## How It Works

Git Theater creates a streamlined interface around your existing `git-chat-assistant` actor:

```
git-theater → GitTheaterClient → git-chat-assistant → chat-state + git-tools
```

### Workflow Process

1. **🔍 Repository Detection** - Automatically finds the git repository
2. **📊 Repository Analysis** - Analyzes git status, branches, and changes  
3. **🎭 Actor Setup** - Starts git-chat-assistant with workflow-specific configuration
4. **🤖 Workflow Automation** - Triggers appropriate workflow (commit/review/rebase)
5. **💬 Interactive Chat** - Provides real-time chat interface with git context

### Smart Configuration

Each workflow gets optimized settings:

- **Commit**: Lower temperature (0.3) for focused, deterministic commits
- **Review**: Medium temperature (0.5) for balanced analysis  
- **Rebase**: Low-medium temperature (0.4) for careful history editing
- **Chat**: Higher temperature (0.7) for creative problem-solving

## Architecture

### Components

- **CLI Interface** (`src/index.ts`) - Command parsing and workflow routing
- **Git Detection** (`src/git-detector.ts`) - Repository discovery and analysis
- **Theater Client** (`src/theater-client.ts`) - git-chat-assistant communication  
- **UI Components** (`src/ui/`) - Rich terminal interface with Ink
- **Type Definitions** (`src/types.ts`) - Comprehensive TypeScript types

### Dependencies

- **git-chat-assistant** - Domain actor for git workflow intelligence
- **theater-client** - Low-level Theater protocol client
- **Ink** - React-based terminal UI framework
- **Commander** - CLI argument parsing

## Development

### Setup

```bash
# Install dependencies
bun install

# Development mode with auto-restart
bun run dev

# Build for production  
bun run build

# Type checking
bun run type-check
```

### Project Structure

```
git-theater/
├── src/
│   ├── index.ts              # Main CLI entry point
│   ├── types.ts              # Type definitions
│   ├── git-detector.ts       # Repository detection & analysis
│   ├── theater-client.ts     # git-chat-assistant client wrapper
│   └── ui/
│       ├── GitChatUI.tsx     # Main chat interface
│       └── MultiLineInput.tsx # Input component
├── package.json
├── tsconfig.json  
└── README.md
```

### Key Design Principles

1. **Zero Configuration** - Works immediately without setup
2. **Smart Defaults** - Optimal settings for each workflow  
3. **Repository Context** - Always aware of current git state
4. **Workflow Focus** - Purpose-built for specific git tasks
5. **Clean UX** - Simple commands, rich interface

## Configuration

### Git Chat Assistant Path

Update the manifest path in `src/git-detector.ts`:

```typescript
// Update this path to match your git-chat-assistant location
manifest_path: "/path/to/your/git-chat-assistant/manifest.toml"
```

### Theater Server

Default server is `127.0.0.1:9000`. Override with:

```bash
commit --server your-server:9000
```

Or set environment variable:

```bash
export THEATER_SERVER=your-server:9000
commit
```

## Troubleshooting

### "Not in a git repository"
- Ensure you're in a git repository: `git status`
- Or specify path: `commit --directory /path/to/repo`

### "Failed to connect to Theater server"  
- Check Theater server is running: `theater-server --port 9000`
- Verify server address: `commit --server 127.0.0.1:9000 --verbose`

### "git-chat-assistant not found"
- Update manifest path in `src/git-detector.ts`
- Ensure git-chat-assistant is built: `cd /path/to/git-chat-assistant && cargo component build --release`

### Verbose Debugging

Add `--verbose` to any command for detailed diagnostics:

```bash
commit --verbose
# Shows:
# 🔍 Detected repository: /path/to/repo
# 📁 Branch: main  
# 📊 Status: Has changes
#    Modified: 3, Untracked: 1, Staged: 0
# 🎭 Starting commit workflow...
# 🎯 Using git-chat-assistant actor
# 🔗 Connecting to 127.0.0.1:9000
# ✅ Session started - Domain: actor-123, Chat: actor-456
```

## Examples

### Typical Commit Workflow

```bash
cd my-project

# Make some changes
echo "new feature" >> src/app.ts
echo "# Updated docs" >> README.md

# Start commit workflow
commit
```

**Output:**
```
📝 Commit Workflow
Analyze changes and create meaningful commits  
📁 Repository: my-project (main)
⚠️  2 files with changes

🎭 Git Commit Assistant
📁 my-project • 🌿 main • ⚠️  Changes pending

🤖 Assistant: I'll analyze your repository changes and help create commits.

🔧 git status

I can see you have 2 modified files. Let me examine the changes:

🔧 git diff src/app.ts
🔧 git diff README.md

I can see two distinct changes:
1. A new feature addition in src/app.ts
2. Documentation update in README.md

I'll create two separate commits:

🔧 git add src/app.ts
🔧 git commit -m "feat: add new feature functionality"

🔧 git add README.md  
🔧 git commit -m "docs: update README with recent changes"

✅ Created 2 commits with clear, conventional messages!

💬 _
```

### Code Review Session

```bash
cd my-project
review
```

**Output:**
```
🔍 Code Review
Review changes and provide feedback
📁 Repository: my-project (feature-branch)  
⚠️  5 files with changes

🤖 Assistant: I'll review your code changes for quality, security, and best practices.

🔧 git diff --staged

Reviewing your changes:

✅ **Positive aspects:**
- Good separation of concerns in auth.ts
- Comprehensive error handling  
- Clear variable naming

⚠️ **Suggestions:**
- Consider adding input validation in user.service.ts:42
- The password hashing could be more secure (use argon2 instead of bcrypt)
- Missing unit tests for the new authentication flow

🔧 git diff src/auth.ts

**Security note:** Line 15 has a potential timing attack vulnerability. Consider using constant-time comparison.

Would you like me to show you how to fix these issues?

💬 _
```

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch  
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Related Projects

- **[git-chat-assistant](../git-chat-assistant)** - The underlying AI actor for git workflows
- **[theater-client](../theater-client)** - TypeScript client for Theater actor system  
- **[theater-chat](../theater-chat)** - General-purpose Theater chat interface

---

**Git Theater** - Making git workflows intelligent and effortless! 🎭✨