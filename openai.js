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
    const rules = [
      "Do not preface the commit with anything",
      "Use the present tense",
      "Return the full sentence",
      "Use the conventional commits specification (<type in lowercase>: <subject>)",
      "NEVER use emojis, gitmoji, or unicode icons",
      "Output only clean Conventional Commit format",
    ];

    const invalidExamples = [
      "🔧 chore: update dependencies",
      "✨ feat: add auth flow",
      "🚀 deploy: release production build",
    ];

    return (
      `Write a professional git commit message based on the diff below in ${language} language` +
      (commitType ? ` with commit type '${commitType}'. ` : ". ") +
      "\nRules:\n" + rules.map(r => `- ${r}`).join('\n') + "\n" +
      "Invalid examples (DO NOT DO THIS):\n" + invalidExamples.map(e => `- ${e}`).join('\n') + "\n" +
      `${customMessageConvention ? `Additionally apply these JSON formatted rules to your response: ${customMessageConvention}.` : ''}` +
      '\n\n'+
      diff
    );
  },

  getPromptForMultipleCommits: (diff, {commitType, customMessageConvention, numOptions, language}) => {
    const rules = [
      "Do not preface the commit with anything",
      "Use the present tense",
      "Return the full sentence",
      "Use the conventional commits specification (<type in lowercase>: <subject>)",
      "NEVER use emojis, gitmoji, or unicode icons",
      "Output only clean Conventional Commit format",
    ];

    const invalidExamples = [
      "🔧 chore: update dependencies",
      "✨ feat: add auth flow",
      "🚀 deploy: release production build",
    ];

    const prompt =
      `Write a professional git commit message based on the diff below in ${language} language` +
      (commitType ? ` with commit type '${commitType}'. ` : ". ") +
      `and make ${numOptions} options that are separated by ";".` +
      "\nRules:\n" + rules.map(r => `- ${r}`).join('\n') + "\n" +
      "Invalid examples (DO NOT DO THIS):\n" + invalidExamples.map(e => `- ${e}`).join('\n') + "\n" +
      `${customMessageConvention ? `Additionally apply these JSON formatted rules to your response: ${customMessageConvention}.` : ''}` +
      '\n\n' +
      diff;

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
