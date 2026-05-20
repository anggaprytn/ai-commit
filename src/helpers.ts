import { execSync } from "child_process";

export interface Args {
  [key: string]: any;
}

const getArgs = (): Args => {
  const args = process.argv.slice(2);
  const result: Args = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    // Check if argument is of the form --KEY=VALUE
    if (arg.includes('=')) {
      const [key, value] = arg.split('=');
      result[key.replace(/^--/, '')] = value;
    } else {
      const key = arg.replace(/^--/, '');
      const nextArg = args[i + 1];

      // Check if next argument is a flag or undefined
      if (/^--/.test(nextArg) || nextArg === undefined) {
        result[key] = true;
      } else {
        result[key] = nextArg;
        i++; // Skip next argument since it's a value
      }
    }
  }
  return result;
};


const checkGitRepository = (): boolean => {
  try {
    const output = execSync('git rev-parse --is-inside-work-tree', { encoding: 'utf-8' });
    return output.trim() === 'true';
  } catch (err) {
    return false;
  }
};

function stripEmoji(input: string): string {
  return input
    .replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

export { getArgs, checkGitRepository, stripEmoji }
