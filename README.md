# AI-Commit

Deterministic, Conventional Commits generator powered by OpenAI or local Ollama instances.

## Installation

```bash
git clone <your-fork-url> && cd ai-commit
npm install
npm install -g .

```

## Quick Start

```bash
git add .
ai-commit

```

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
