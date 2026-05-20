import { execSync } from "child_process";
import { encode } from 'gpt-3-encoder';

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

export const MAX_INPUT_TOKENS: number = 128000;
export const MAX_ALLOWED_CHARS: number = MAX_INPUT_TOKENS * 3.5;

function processGitDiff(rawDiff: string): string {
  const SAFE_LIMIT = 120000; // Beri buffer aman dari max 128k token
  let currentDiff = rawDiff;
  let tokens = encode(currentDiff);
  let iterations = 0;

  if (tokens.length <= SAFE_LIMIT) {
    return currentDiff;
  }

  console.log(`⚠️ Warning: Git diff token overhead detected (${tokens.length} tokens). Running Recursive Smart Truncation...`);

  // Jalankan loop pemotongan dinamis sampai masuk budget token
  while (tokens.length > SAFE_LIMIT && currentDiff.length > 0) {
    iterations++;

    // Hitung persentase kelebihan token dan potong string secara proporsional + beri buffer keamanan
    const reductionRatio = SAFE_LIMIT / tokens.length;
    const targetCharLength = Math.floor(currentDiff.length * reductionRatio * 0.95);

    currentDiff = currentDiff.slice(0, targetCharLength);
    tokens = encode(currentDiff);

    if (iterations > 5) {
      // Break-safe agar tidak terjadi infinite loop jika ada anomali string
      currentDiff = currentDiff.slice(0, 10000);
      break;
    }
  }

  console.log(`✅ Truncation successful after ${iterations} cycles. Final payload optimized to ${tokens.length} tokens.`);
  return currentDiff + "\n\n[... DIFF TRUNCATED DUE TO MAX TOKEN LIMIT ...]";
}

export function getGitDiff(): string {
  try {
    // 1. Coba ambil diff dari file yang sudah di-stage (setelah git add)
    let diff = execSync('git diff --staged').toString().trim();

    // 2. Jika kosong, otomatis fallback ambil diff dari file yang belum di-stage
    if (!diff) {
      diff = execSync('git diff').toString().trim();
    }

    return diff;
  } catch (error) {
    console.error("❌ Failed to execute git diff command:", error);
    return "";
  }
}

export { getArgs, checkGitRepository, stripEmoji, processGitDiff }
