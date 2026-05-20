import { ChatGPTAPI } from "chatgpt";

import { encode } from 'gpt-3-encoder';
import inquirer from "inquirer";
import { AI_PROVIDER } from "./config.js"

const FEE_PER_1K_TOKENS = 0.02;
const MAX_TOKENS = 128000;
//this is the approximate cost of a completion (answer) fee from CHATGPT
const FEE_COMPLETION = 0.001;

const openai = {
  sendMessage: async (input, {apiKey, model}) => {
    console.log("prompting chat gpt...");
    console.log("prompt: ", input);
    const api = new ChatGPTAPI({
      apiKey,
      completionParams: {
        model: "gpt-4o-mini",
      },
    });
    const { text } = await api.sendMessage(input);

    return text;
  },

  getPromptForSingleCommit: (diff, {commitType, customMessageConvention, language}) => {
    const systemPrompt = `You are a deterministic git commit message generator. Analyze the provided git diff and generate a professional commit message.

CRITICAL RULES:
1. Follow the Conventional Commits specification strictly: <type>(<scope>): <description>
2. NEVER use any emojis, gitmojis, formatting icons, or visual markers under any circumstances.
3. Start the output directly with the commit type (e.g., feat, fix, refactor, chore, docs).
4. Use lowercase for the type and scope.
5. Use the imperative mood in the description (e.g., "add feature", not "added feature").
6. Output ONLY the raw commit message. Do not include introductions, explanations, or markdown code blocks.`;

    let prompt = `${systemPrompt}\n\n`;
    prompt += `The commit message should be in ${language} language.\n`;
    if (commitType) prompt += `Use the commit type '${commitType}'.\n`;
    if (customMessageConvention) prompt += `Additional instructions: ${customMessageConvention}\n`;
    prompt += `\nGIT DIFF:\n${diff}`;

    return prompt;
  },

  getPromptForMultipleCommits: (diff, {commitType, customMessageConvention, numOptions, language}) => {
    const systemPrompt = `You are a deterministic git commit message generator. Analyze the provided git diff and generate a professional commit message.

CRITICAL RULES:
1. Follow the Conventional Commits specification strictly: <type>(<scope>): <description>
2. NEVER use any emojis, gitmojis, formatting icons, or visual markers under any circumstances.
3. Start the output directly with the commit type (e.g., feat, fix, refactor, chore, docs).
4. Use lowercase for the type and scope.
5. Use the imperative mood in the description (e.g., "add feature", not "added feature").
6. Output ONLY the raw commit message. Do not include introductions, explanations, or markdown code blocks.`;

    let prompt = `${systemPrompt}\n\n`;
    prompt += `Generate exactly ${numOptions} different commit message options, separated by a semicolon (;).\n`;
    prompt += `The commit messages should be in ${language} language.\n`;
    if (commitType) prompt += `Use the commit type '${commitType}'.\n`;
    if (customMessageConvention) prompt += `Additional instructions: ${customMessageConvention}\n`;
    prompt += `\nGIT DIFF:\n${diff}`;

    return prompt;
  },

  filterApi: async ({ prompt, numCompletion = 1, filterFee }) => {
    const numTokens = encode(prompt).length;
    const fee = numTokens / 1000 * FEE_PER_1K_TOKENS + (FEE_COMPLETION * numCompletion);

    if (numTokens > MAX_TOKENS) {
        console.log("The commit diff is too large for the ChatGPT API. Max 4k tokens or ~8k characters. ");
        return false;
    }

    if (filterFee) {
        console.log(`This will cost you ~$${+fee.toFixed(3)} for using the API.`);
        const answer = await inquirer.prompt([
            {
                type: "confirm",
                name: "continue",
                message: "Do you want to continue?",
                default: true,
            },
        ]);
        if (!answer.continue) return false;
    }

    return true;
}


};

export default openai;
