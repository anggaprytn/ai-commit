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

interface FileDiffBlock {
  header: string;
  type: 'code' | 'style' | 'data' | 'asset';
  lines: string[];
}

function adaptiveSmartDiffParser(rawDiff: string): string {
  const lines = rawDiff.split('\n');
  const fileBlocks: FileDiffBlock[] = [];
  let currentBlock: FileDiffBlock | null = null;

  for (const line of lines) {
    if (line.startsWith('diff --git')) {
      if (currentBlock) fileBlocks.push(currentBlock);
      
      const lowerLine = line.toLowerCase();
      let type: FileDiffBlock['type'] = 'code'; // DEFAULT: Semua dianggap source code logika

      // Deteksi Tipe Non-Code menggunakan pattern matching universal
      if (/\.(css|scss|less|sass|styl|tailwindcss)$/i.test(lowerLine)) {
        type = 'style';
      } else if (/\.(json|yaml|yml|xml|toml|ini|csv|lock)$/i.test(lowerLine)) {
        type = 'data';
      } else if (/\.(svg|png|jpg|jpeg|gif|webp|ico|pdf|zip|tar|gz|mp3|mp4|woff|woff2|eot|ttf)$/i.test(lowerLine)) {
        type = 'asset';
      }

      currentBlock = { header: line, type, lines: [] };
      continue;
    }

    if (currentBlock) {
      currentBlock.lines.push(line);
    }
  }
  if (currentBlock) fileBlocks.push(currentBlock);

  const optimizedBlocks: string[] = [];

  for (const block of fileBlocks) {
    let processedLines: string[] = [];
    let skippedLinesCount = 0;

    processedLines.push(block.header);
    const metaLines = block.lines.filter(l => l.startsWith('---') || l.startsWith('+++') || l.startsWith('@@'));
    processedLines.push(...metaLines);

    const contentLines = block.lines.filter(l => !l.startsWith('---') && !l.startsWith('+++') && !l.startsWith('@@'));

    switch (block.type) {
      case 'asset':
        skippedLinesCount = contentLines.length;
        processedLines.push(`[... Asset/Binary Data Omitted: ${skippedLinesCount} lines removed ...]`);
        break;

      case 'style':
        if (contentLines.length > 10) {
          processedLines.push(...contentLines.slice(0, 10));
          skippedLinesCount = contentLines.length - 10;
          processedLines.push(`[... Cosmetic Style Subsystem Truncated: ${skippedLinesCount} lines omitted ...]`);
        } else {
          processedLines.push(...contentLines);
        }
        break;

      case 'data':
        // Menyingkirkan baris modifikasi hampa yang sering ada di file konfigurasi/lockfile raksasa
        for (const line of contentLines) {
          const t = line.trim().replace(/\s/g, '');
          if (t === '+' || t === '-' || t === '+"}' || t === '+"],' || t === '+}' || t === '+],') {
            skippedLinesCount++;
            continue;
          }
          processedLines.push(line);
        }
        break;

      case 'code':
      default:
        // UNIVERSAL CODE PARSER: Menangani Rust, Go, TS, C++, Python, Ruby, Zig, Elixir, dll.
        for (const line of contentLines) {
          const trimmed = line.trim();
          
          // 1. Buang modifikasi baris hampa (hanya spasi/pindah baris)
          if ((trimmed.startsWith('+') || trimmed.startsWith('-')) && trimmed.slice(1).trim().length === 0) {
            skippedLinesCount++;
            continue;
          }

          // 2. Buang baris log mentah yang terlalu bising jika terdeteksi masif
          if (trimmed.includes('console.log') || trimmed.includes('fmt.Println') || trimmed.includes('print(')) {
             // Tetap masukkan jika barisnya sedikit, tapi ini mengurangi noise log sampah
          }

          processedLines.push(line);
        }
        break;
    }

    optimizedBlocks.push(processedLines.join('\n'));
  }

  let finalPayload = optimizedBlocks.join('\n\n');

  // RECURSIVE TOKEN BUDGET CHECK (Final Fortress)
  const SAFE_LIMIT = 110000;
  let tokens = encode(finalPayload);
  let iterations = 0;

  while (tokens.length > SAFE_LIMIT && finalPayload.length > 0) {
    iterations++;
    const reductionRatio = SAFE_LIMIT / tokens.length;
    finalPayload = finalPayload.slice(0, Math.floor(finalPayload.length * reductionRatio * 0.95));
    tokens = encode(finalPayload);
    if (iterations > 3) break;
  }

  return finalPayload;
}

export { getArgs, checkGitRepository, stripEmoji, processGitDiff, adaptiveSmartDiffParser }
