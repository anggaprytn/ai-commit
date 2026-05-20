# **AI-Commit: The Commit Message Generator**

Make your commit history organized and informative using AI.

AI-Commit leverages OpenAI's models or local models via Ollama to analyze your code changes and generate professional commit messages following the Conventional Commits specification.

## Installation

To use AI-Commit from a local fork:

1. Fork the repository on GitHub.
2. Clone your fork to your local machine:
   ```bash
   git clone <your-fork-url>
   cd ai-commit
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Install the package globally from the local directory:
   ```bash
   npm install -g .
   ```
   This links your local fork as the globally available `ai-commit` CLI.

## How it Works

### Using OpenAI

1. Generate an OpenAI API key [here](https://platform.openai.com/account/api-keys)
2. Set your `OPENAI_API_KEY` environment variable to your API key
3. Make your code changes and stage them with `git add .`
4. Type `ai-commit` in your terminal
5. AI-Commit will analyze your changes and generate a commit message
6. Approve the commit message and AI-Commit will create the commit for you

### Using Local Model (Ollama)

You can also use a local model for free with Ollama.

1. Install Ollama from https://ollama.ai/
2. Run `ollama run mistral` to fetch the model for the first time
3. Set `PROVIDER` in your environment to `ollama`
4. Make your code changes and stage them with `git add .`
5. Type `ai-commit` in your terminal
6. AI-Commit will analyze your changes and generate a commit message
7. Approve the commit message and AI-Commit will create the commit for you

## Options

`--list`: Select from a list of 5 generated messages (or regenerate the list)

`--force`: Automatically create a commit without being prompted to select a message (cannot be used with `--list`)

`--filter-fee`: Displays the approximate fee for using the API and prompts you to confirm the request

`--apiKey`: Your OpenAI API key. (Prefer using the `OPENAI_API_KEY` environment variable)

`--template`: Specify a custom commit message template. e.g. `--template "Modified {GIT_BRANCH} | {COMMIT_MESSAGE}"`

`--language`: Specify the language to use for the commit message (default: `english`). e.g. `--language english`

`--commit-type`: Specify the type of commit to generate. This will be used as the type in the commit message e.g. `--commit-type feat`

## Contributing

We'd love for you to contribute to AI-Commit! Here's how:

1. Fork the repository
2. Clone your fork to your local machine
3. Create a new branch
4. Make your changes
5. Commit your changes and push to your fork
6. Create a pull request to the AI-Commit repository

## Roadmap

- [x] Support for multiple suggestions: Provide multiple suggestions for the commit message.
- [x] Support for custom commit types: Allow users to specify a custom commit type manually.
- [ ] Automated scope detection: Detect the scope of changes and automatically include it in the commit message.
- [ ] Commit message templating: Provide a customizable commit message template for users to follow.
- [ ] Interactive commit message generation: Allow users to interact with AI-Commit during the commit message generation process to provide more context and refine the generated message.
- [ ] Integration with Git hooks: Integrate AI-Commit with Git hooks so that it can automatically generate commit messages whenever changes are staged.
- [ ] Advanced diff analysis: Enhance AI-Commit's diff analysis capabilities to better understand the changes made to the code.
- [ ] Reverse commit message generation: Allow users to generate code changes from a commit message.

## License

AI-Commit is licensed under the MIT License.
