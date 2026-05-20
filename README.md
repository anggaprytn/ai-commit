# AI-Commit

Deterministic, Conventional Commits generator powered by OpenAI or local Ollama instances. Optimized for professional, emoji-free environments.

## Installation (Local Fork)

To use this customized local fork with professional standards:

```bash
git clone <your-fork-url>
cd ai-commit
npm install
npm install -g .
```

### Local Global Linking
By running `npm install -g .`, you link your local development folder to your global `PATH`. This allows you to test changes immediately and use your customized version of `ai-commit` system-wide.

## Quick Start

```bash
git add .
ai-commit
```

## Features

- **Professional Conventional Commits:** Enforces the standard format: `<type>(<scope>): <subject>`.
- **Emoji-Free:** Completely removes and forbids emojis, gitmojis, and decorative icons at both the prompt and runtime layers.
- **AI-Powered:** Support for both OpenAI (GPT-4o-mini) and local Ollama (e.g., Mistral) models.
- **Sanitization:** Built-in runtime sanitization to ensure commit messages are always clean before being pushed to Git.

## Configuration

Set environment variables or pass flags directly:

```bash
# OpenAI Setup
export OPENAI_API_KEY="your-api-key"

# Ollama Setup (Local)
export PROVIDER="ollama"
# Ensure your local model is running: ollama run mistral
```

## CLI Flags

| Flag            | Description                                                     |
| --------------- | --------------------------------------------------------------- |
| `--list`        | Return 5 generated options to select from.                      |
| `--force`       | Skip confirmation; commit immediately.                          |
| `--filter-fee`  | Display estimated API cost before execution.                    |
| `--template`    | Custom formatting string (e.g., `"Project: {COMMIT_MESSAGE}"`). |
| `--language`    | Target output language (Default: `english`).                    |
| `--commit-type` | Enforce specific scope/type (e.g., `feat`, `fix`).              |

## License

MIT
