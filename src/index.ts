#!/usr/bin/env node

'use strict'
import { execSync } from "child_process";
import inquirer from "inquirer";
import { getArgs, checkGitRepository, stripEmoji } from "./helpers.js";
import { AI_PROVIDER, MODEL, args } from "./config.js"
import openai from "./openai.js"
import ollama from "./ollama.js"

const REGENERATE_MSG: string = "Regenerate Commit Messages";

const apiKey: string | undefined = args.apiKey || (process.env.OPENAI_API_KEY as string);

const language: string = args.language || (process.env.AI_COMMIT_LANGUAGE as string) || 'english';

if (AI_PROVIDER === 'openai' && !apiKey) {
  console.error("Please set the OPENAI_API_KEY environment variable.");
  process.exit(1);
}

const commitType: string | undefined = args['commit-type'];

const provider: any = AI_PROVIDER === 'ollama' ? ollama : openai;

const customMessageConvention: string | undefined = args['custom-conventions'];

const processTemplate = ({ template, commitMessage }: { template: string, commitMessage: string }): string => {
  if (!template.includes('COMMIT_MESSAGE')) {
    console.log(`Warning: template doesn't include {COMMIT_MESSAGE}`)

    return commitMessage;
  }

  let finalCommitMessage = template.replaceAll("{COMMIT_MESSAGE}", commitMessage);

  if (finalCommitMessage.includes('GIT_BRANCH')) {
    const currentBranch = execSync("git branch --show-current").toString().replaceAll("\n", "");

    console.log('Using currentBranch: ', currentBranch);

    finalCommitMessage = finalCommitMessage.replaceAll("{GIT_BRANCH}", currentBranch)
  }

  return finalCommitMessage.trim();
}

const makeCommit = (input: string): void => {
  console.log("Committing Message... ");
  execSync(`git commit -F -`, { input: stripEmoji(input) });
  console.log("Commit Successful!");
};


const getPromptForSingleCommit = (diff: string): string => {
  return provider.getPromptForSingleCommit(diff, { commitType, customMessageConvention, language })
};

const generateSingleCommit = async (diff: string): Promise<void> => {
  const prompt = getPromptForSingleCommit(diff)
  if (!await provider.filterApi({ prompt, filterFee: args['filter-fee'] })) process.exit(1);

  const text = await provider.sendMessage(prompt, { apiKey: apiKey!, model: MODEL });

  let finalCommitMessage = stripEmoji(text);

  if (args.template) {
    finalCommitMessage = processTemplate({
      template: args.template as string,
      commitMessage: finalCommitMessage,
    })

    console.log(
      `Proposed Commit With Template:\n------------------------------\n${finalCommitMessage}\n------------------------------`
    );
  } else {

    console.log(
      `Proposed Commit:\n------------------------------\n${finalCommitMessage}\n------------------------------`
    );

  }

  if (args.force) {
    makeCommit(finalCommitMessage);
    return;
  }

  const answer: any = await inquirer.prompt([
    {
      type: "confirm",
      name: "continue",
      message: "Do you want to continue?",
      default: true,
    },
  ]);

  if (!answer.continue) {
    console.log("Commit aborted by user");
    process.exit(1);
  }

  makeCommit(finalCommitMessage);
};

const generateListCommits = async (diff: string, numOptions: number = 5): Promise<void> => {
  const prompt = provider.getPromptForMultipleCommits(diff, { commitType, customMessageConvention, numOptions, language })
  if (!await provider.filterApi({ prompt, filterFee: args['filter-fee'], numCompletion: numOptions })) process.exit(1);

  const text = await provider.sendMessage(prompt, { apiKey: apiKey!, model: MODEL });

  let msgs = text.split(";").map((msg: string) => stripEmoji(msg));

  if (args.template) {
    msgs = msgs.map((msg: string) => processTemplate({
      template: args.template as string,
      commitMessage: msg,
    }))
  }

  // add regenerate option
  msgs.push(REGENERATE_MSG);

  const answer: any = await inquirer.prompt([
    {
      type: "list",
      name: "commit",
      message: "Select a commit message",
      choices: msgs,
    },
  ]);

  if (answer.commit === REGENERATE_MSG) {
    await generateListCommits(diff);
    return;
  }

  makeCommit(answer.commit);
};

// Add this function after imports
const filterLockFiles = (diff: string): string => {
  const lines = diff.split('\n');
  let isLockFile = false;
  const filteredLines = lines.filter(line => {
    if (line.match(/^diff --git a\/(.*\/)?(yarn\.lock|pnpm-lock\.yaml|package-lock\.json)/)) {
      isLockFile = true;
      return false;
    }
    if (isLockFile && line.startsWith('diff --git')) {
      isLockFile = false;
    }
    return !isLockFile;
  });
  return filteredLines.join('\n');
};

async function generateAICommit(): Promise<void> {
  const isGitRepository = checkGitRepository();

  if (!isGitRepository) {
    console.error("This is not a git repository");
    process.exit(1);
  }

  let diff = execSync("git diff --staged").toString();

  // Filter lock files
  const originalDiff = diff;
  diff = filterLockFiles(diff);

  // Check if lock files were changed
  if (diff !== originalDiff) {
    console.log("Changes detected in lock files. These changes will be included in the commit but won't be analyzed for commit message generation.");
  }

  // Handle empty diff after filtering
  if (!diff.trim()) {
    console.log("No changes to commit except lock files");
    console.log("Maybe you forgot to add files? Try running git add . and then run this script again.");
    process.exit(1);
  }

  args.list
    ? await generateListCommits(diff)
    : await generateSingleCommit(diff);
}

await generateAICommit();
