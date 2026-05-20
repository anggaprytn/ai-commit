const SYSTEM_PROMPT = `You are a strict, local git commit generator. Analyze the provided git diff and generate a professional commit message.

CRITICAL RULES:
1. Follow the Conventional Commits specification strictly: <type>(<scope>): <description>
2. NEVER use any emojis, gitmojis, formatting icons, or visual markers under any circumstances.
3. Start the output directly with the commit type (e.g., feat, fix, refactor, chore, docs).
4. Use lowercase for the type and scope.
5. Use the imperative mood in the description (e.g., "add feature", not "added feature").
6. Output ONLY the raw commit message line. Do not include introductions, explanations, or markdown code blocks.

ABSOLUTE NEGATIVE CONSTRAINT:
Do not put any emoji (like 🚀, ✨, 🐛, 🚑, etc.) in the output. Emojis are strictly banned.`;

const ollama = {
  /**
   * send prompt to ai.
   */
  sendMessage: async (input, { apiKey, model = 'mistral' }) => {
    const url = "http://127.0.0.1:11434/api/chat";
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: input }
    ];
    const data = { model, stream: false, messages };

    console.log(`Prompting Ollama with model: ${model}...`);

    try {
      // Initial request
      const initialResponse = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const initialResult = await initialResponse.json();

      console.log("Initial answer from Ollama:", initialResult);
      const answer = initialResult.message;

      console.log("Response from Ollama:", answer.content);
      return answer.content;

    } catch (err) {
      console.error("Error during AI processing:", err.message);
      throw new Error(`Local model issues. Details: ${err.message}`);
    }
  },


  getPromptForSingleCommit: (diff, { commitType, customMessageConvention, language }) => {
    let prompt = "";
    prompt += `The commit message should be in ${language} language.\n`;
    if (commitType) prompt += `Use the commit type '${commitType}'.\n`;
    if (customMessageConvention) prompt += `Additional instructions: ${customMessageConvention}\n`;
    prompt += `\nGIT DIFF:\n${diff}`;

    return prompt;
  },

  getPromptForMultipleCommits: (
    diff,
    { commitType, customMessageConvention, numOptions, language }
  ) => {
    let prompt = "";
    prompt += `Generate exactly ${numOptions} different commit message options, separated by a semicolon (;).\n`;
    prompt += `The commit messages should be in ${language} language.\n`;
    if (commitType) prompt += `Use the commit type '${commitType}'.\n`;
    if (customMessageConvention) prompt += `Additional instructions: ${customMessageConvention}\n`;
    prompt += `\nGIT DIFF:\n${diff}`;

    return prompt;
  },

  filterApi: ({ prompt, numCompletion = 1, filterFee }) => {
    //ollama dont have any limits and is free so we dont need to filter anything
    return true;
  }
};

export default ollama;
