import { ChatGPTAPI } from "chatgpt";
import { encode } from 'gpt-3-encoder';
import inquirer from "inquirer";

const MAX_OUTPUT_TOKENS: number = 400;
const FEE_INPUT_PER_TOKEN: number = 0.000005;
const FEE_COMPLETION_PER_TOKEN: number = 0.000015;

interface SendMessageOptions {
  apiKey: string;
  model: string;
}

interface PromptOptions {
  commitType?: string;
  customMessageConvention?: string;
  language: string;
}

interface MultiplePromptOptions extends PromptOptions {
  numOptions: number;
}

interface FilterApiOptions {
  prompt: string;
  numCompletion?: number;
  filterFee?: boolean;
}

const openai = {
  sendMessage: async (input: string, { apiKey, model }: SendMessageOptions): Promise<string> => {
    const api = new ChatGPTAPI({
      apiKey,
      completionParams: {
        model: model || "gpt-4o-mini",
        max_tokens: MAX_OUTPUT_TOKENS,
      },
    });
    const { text } = await api.sendMessage(input);

    return text;
  },

  getPromptForSingleCommit: (diff: string, { commitType, customMessageConvention, language }: PromptOptions): string => {
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

  getPromptForMultipleCommits: (diff: string, { commitType, customMessageConvention, numOptions, language }: MultiplePromptOptions): string => {
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

  filterApi: async ({ prompt, numCompletion = 1, filterFee }: FilterApiOptions): Promise<boolean> => {
    const numTokens = encode(prompt).length;
    const fee = (numTokens * FEE_INPUT_PER_TOKEN) + (MAX_OUTPUT_TOKENS * FEE_COMPLETION_PER_TOKEN * numCompletion);

    if (filterFee) {
        console.log(`This will cost you ~$${+fee.toFixed(3)} for using the API.`);
        const answer: any = await inquirer.prompt([
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
