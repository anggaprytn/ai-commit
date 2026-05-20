# **AI-Commit: The Commit Message Generator**

Professional commit message generator for personalized use.

AI-Commit leverages OpenAI's models or local models via Ollama to analyze your code changes and generate professional commit messages following the Conventional Commits specification.

## Local Installation (For Your Fork)

If you have forked this repository and want to use your customized version globally on your machine:

1. **Clone your fork:**
   ```bash
   git clone <your-fork-url>
   cd ai-commit
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Install globally from local source:**
   ```bash
   npm install -g .
   ```
   *Note: This command links your local directory to the global `ai-commit` command. Any changes you make in this folder will be reflected when you run `ai-commit` anywhere on your system.*

## Usage

Once installed globally, you can use it in any git repository:

1. Stage your changes: `git add .`
2. Run the generator: `ai-commit`
3. Follow the prompts to review and accept the generated message.

## Configuration

### Using OpenAI

1. Generate an OpenAI API key [here](https://platform.openai.com/account/api-keys)
2. Set your `OPENAI_API_KEY` environment variable.
3. (Optional) Pass the key via `--apiKey`.

### Using Local Model (Ollama)

1. Install Ollama from https://ollama.ai/
2. Run `ollama run mistral` to fetch the model.
3. Set `PROVIDER=ollama` in your environment.

## CLI Options

`--list`: Select from 5 generated options.
`--force`: Skip confirmation and commit immediately.
`--filter-fee`: Show estimated API cost before proceeding.
`--template`: Use a custom template, e.g., `--template "Project: {COMMIT_MESSAGE}"`.
`--language`: Set output language (default: `english`).
`--commit-type`: Force a specific commit type (e.g., `feat`, `fix`).

## License

MIT
